import os
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.getenv("MONGO_URL", "mongodb+srv://callsumeet01_db_user:vijshpViXhMBiT6r@clustertest.3pger30.mongodb.net/?appName=Clustertest")
DB_NAME = "expense_tracker"

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

async def get_database():
    return db
