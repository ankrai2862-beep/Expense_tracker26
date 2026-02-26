from fastapi import APIRouter, Depends, HTTPException, status, Body, UploadFile, File
from fastapi.security import OAuth2PasswordRequestForm
from typing import List
from datetime import timedelta
from models import UserCreate,BulkUploadResult, UserInDB, Token, TransactionCreate, TransactionInDB
from database import get_database
from auth import get_password_hash, verify_password, create_access_token, get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import datetime
import pdfplumber
import io
router = APIRouter()

@router.post("/auth/register", response_model=Token)
async def register(user: UserCreate, db = Depends(get_database)):
    # Check if user exists
    existing_user = await db["users"].find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    user_in_db = UserInDB(**user.dict(), hashed_password=hashed_password)
    
    await db["users"].insert_one(user_in_db.dict())
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "full_name": user.full_name}

@router.post("/auth/login")
async def login(credentials: dict, db = Depends(get_database)):
    email = credentials.get("username")
    password = credentials.get("password")
    user = await db["users"].find_one({"email": email})
    if not user or not verify_password(password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    full_name = user.get("full_name", "Unknown")
    return {"access_token": access_token, "token_type": "bearer", "full_name": full_name}

@router.get("/dashboard/summary")
async def get_dashboard_summary(current_user: dict = Depends(get_current_user), db = Depends(get_database)):
    # Aggregation for total income, expenses
    pipeline = [
        {"$match": {"user_id": str(current_user["_id"])}},
        {"$group": {
            "_id": "$type",
            "total": {"$sum": "$amount"}
        }}
    ]
    cursor = db["transactions"].aggregate(pipeline)
    totals = {doc["_id"]: doc["total"] for doc in await cursor.to_list(length=100)}
    
    total_income = totals.get("income", 0)
    total_expenses = totals.get("expense", 0)
    balance = total_income - total_expenses
    
    # Category breakdown for donut chart
    category_pipeline = [
        {"$match": {"user_id": str(current_user["_id"]), "type": "expense"}},
        {"$group": {
            "_id": "$category",
            "total": {"$sum": "$amount"}
        }}
    ]
    cursor = db["transactions"].aggregate(category_pipeline)
    categories = await cursor.to_list(length=100)
    # Format for chart: labels and data
    chart_data = {
        "labels": [c["_id"] for c in categories],
        "data": [c["total"] for c in categories]
    }
    
    return {
        "income": total_income,
        "expenses": total_expenses,
        "balance": balance,
        "chart_data": chart_data
    }

@router.post("/transactions", response_model=TransactionInDB)
async def create_transaction(transaction: TransactionCreate, current_user: dict = Depends(get_current_user), db = Depends(get_database)):
    transaction_in_db = TransactionInDB(**transaction.dict(), user_id=str(current_user["_id"]))
    new_transaction = await db["transactions"].insert_one(transaction_in_db.dict())
    return transaction_in_db

@router.get("/transactions", response_model=List[TransactionInDB])
async def get_transactions(current_user: dict = Depends(get_current_user), db = Depends(get_database)):
    cursor = db["transactions"].find({"user_id": str(current_user["_id"])}).sort("date", -1)
    return await cursor.to_list(length=100)

# ─── PDF Upload Helpers ──────────────────────────────────────────────────────

def _normalize_type(raw: str):
    """Map various type strings to 'income' or 'expense'."""
    val = raw.strip().lower()
    if val in ("income", "credit", "cr", "in"):
        return "income"
    if val in ("expense", "debit", "dr", "out", "expenditure"):
        return "expense"
    return None

def _parse_date(raw: str):
    """Try common date formats and return a datetime or None."""
    formats = [
        "%Y-%m-%d", "%d-%m-%Y", "%m/%d/%Y", "%d/%m/%Y",
        "%d-%b-%Y", "%d %b %Y", "%Y/%m/%d", "%d.%m.%Y"
    ]
    for fmt in formats:
        try:
            return datetime.strptime(raw.strip(), fmt)
        except ValueError:
            continue
    return None


# ─── PDF Upload Endpoint ─────────────────────────────────────────────────────

@router.post("/transactions/upload-pdf", response_model=BulkUploadResult)
async def upload_pdf_transactions(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    contents = await file.read()
    inserted = 0
    skipped = 0
    errors: List[str] = []
    transactions_to_insert = []

    try:
        with pdfplumber.open(io.BytesIO(contents)) as pdf:
            for page_num, page in enumerate(pdf.pages, start=1):
                tables = page.extract_tables()
                for table in tables:
                    if not table or len(table) < 2:
                        continue

                    # Normalise header row
                    raw_headers = [str(h).strip().lower() if h else "" for h in table[0]]

                    # Map column names flexibly
                    col_map = {}
                    for i, h in enumerate(raw_headers):
                        if "date" in h:
                            col_map.setdefault("date", i)
                        elif "amount" in h:
                            col_map.setdefault("amount", i)
                        elif "type" in h or "description" in h or "desc" in h or "narration" in h:
                            col_map.setdefault("type_or_desc", i)
                        elif "category" in h or "cat" in h:
                            col_map.setdefault("category", i)

                    if "date" not in col_map or "amount" not in col_map:
                        errors.append(
                            f"Page {page_num}: Table missing required 'date' or 'amount' columns. "
                            f"Found headers: {raw_headers}"
                        )
                        skipped += len(table) - 1
                        continue

                    for row_idx, row in enumerate(table[1:], start=2):
                        try:
                            raw_date = str(row[col_map["date"]] or "").strip()
                            raw_amount = str(row[col_map["amount"]] or "").strip()

                            if not raw_date or not raw_amount:
                                skipped += 1
                                continue

                            # Parse date
                            parsed_date = _parse_date(raw_date)
                            if not parsed_date:
                                errors.append(f"Page {page_num} row {row_idx}: Unrecognised date '{raw_date}'.")
                                skipped += 1
                                continue

                            # Parse amount (remove currency symbols, commas)
                            clean_amount = (
                                raw_amount
                                .replace(",", "")
                                .replace("₹", "")
                                .replace("$", "")
                                .replace("£", "")
                                .strip()
                            )
                            amount = float(clean_amount)
                            if amount <= 0:
                                errors.append(f"Page {page_num} row {row_idx}: Amount must be positive (got {raw_amount}).")
                                skipped += 1
                                continue

                            # Determine type and description
                            tx_type = "expense"
                            description = ""
                            if "type_or_desc" in col_map:
                                raw_td = str(row[col_map["type_or_desc"]] or "").strip()
                                normalised = _normalize_type(raw_td)
                                if normalised:
                                    tx_type = normalised
                                else:
                                    description = raw_td

                            # Category
                            category = "Imported"
                            if "category" in col_map:
                                cat_val = str(row[col_map["category"]] or "").strip()
                                if cat_val:
                                    category = cat_val
                            elif description:
                                category = description[:50]

                            tx = {
                                "amount": amount,
                                "category": category,
                                "type": tx_type,
                                "date": parsed_date,
                                "description": description,
                                "user_id": str(current_user["_id"])
                            }
                            transactions_to_insert.append(tx)

                        except (ValueError, TypeError, IndexError) as e:
                            errors.append(f"Page {page_num} row {row_idx}: {str(e)}")
                            skipped += 1

    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to parse PDF: {str(e)}")

    if transactions_to_insert:
        await db["transactions"].insert_many(transactions_to_insert)
        inserted = len(transactions_to_insert)

    return BulkUploadResult(inserted=inserted, skipped=skipped, errors=errors)
