from pymongo import MongoClient
from app.config import MONGODB_URL, DATABASE_NAME

try:
    client = MongoClient(MONGODB_URL)

    # Test MongoDB connection
    client.admin.command("ping")

    print("[OK] MongoDB Connected Successfully")

    db = client[DATABASE_NAME]

except Exception as e:
    print("[ERROR] MongoDB Connection Failed")
    print(e)