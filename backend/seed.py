import asyncio
import json
import os
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from auth import get_password_hash
from database import DB_NAME, MONGO_URL

# Use the MONGO_URL from database.py
# MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")

async def seed():
    print(f"Connecting to {MONGO_URL}...")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Load data
    with open("seed_data.json", "r") as f:
        data = json.load(f)
    
    # Seed Users
    print("Seeding Users...")
    for user in data["users"]:
        # Check if exists
        if await db["users"].find_one({"email": user["email"]}):
            print(f"User {user['email']} already exists.")
            # Fetch the existing user to get ID for transactions
            existing = await db["users"].find_one({"email": user["email"]})
            user_id = str(existing["_id"])
        else:
            hashed = get_password_hash(user["password"])
            user_doc = {
                "email": user["email"],
                "full_name": user["full_name"],
                "hashed_password": hashed
            }
            result = await db["users"].insert_one(user_doc)
            user_id = str(result.inserted_id)
            print(f"Created user {user['email']}")

    # Seed Transactions
    print("Seeding Transactions...")
    # For this simple seed, we assign all transactions to the first user found/created
    # In a real scenario, you'd map them by email
    
    for tx in data["transactions"]:
        # Attach user_id
        tx["user_id"] = user_id
        # Convert date string to object
        tx["date"] = datetime.fromisoformat(tx["date"])
        
        await db["transactions"].insert_one(tx)
        
    print(f"Inserted {len(data['transactions'])} transactions.")
    print("Seeding complete.")

if __name__ == "__main__":
    asyncio.run(seed())
