from pymongo import MongoClient
from app.config import MONGODB_URL, DATABASE_NAME

try:
    client = MongoClient(MONGODB_URL, serverSelectionTimeoutMS=2000, socketTimeoutMS=2000)

    # Test MongoDB connection with 2s timeout
    client.admin.command("ping")

    print("[OK] MongoDB Connected Successfully")

    db = client[DATABASE_NAME]

except Exception as e:
    print("[INFO] MongoDB Connection not available; running in fast offline fallback mode.")
    db = None