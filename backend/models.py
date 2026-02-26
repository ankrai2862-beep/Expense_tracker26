from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema, handler):
        json_schema = handler(core_schema)
        json_schema.update(type="string")
        return json_schema

class UserBase(BaseModel):
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    hashed_password: str

class TransactionBase(BaseModel):
    amount: float
    category: str
    type: Literal["income", "expense"]
    date: datetime = Field(default_factory=datetime.now)
    description: Optional[str] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionInDB(TransactionBase):
    user_id: str 

class Token(BaseModel):
    access_token: str
    token_type: str
    full_name: str

class TokenData(BaseModel):
    email: Optional[str] = None

class BulkUploadResult(BaseModel):
    inserted : int 
    skipped : int
    errors: list[str] 