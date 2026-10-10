from pymongo import MongoClient
from app.config import MONGODB_URL, DATABASE_NAME

try:
    client = MongoClient(MONGODB_URL, serverSelectionTimeoutMS=5000, socketTimeoutMS=10000)

    # Test MongoDB connection with 2s timeout
    client.admin.command("ping")

    print("[OK] MongoDB Connected Successfully")

    db = client[DATABASE_NAME]

    try:
        db.harvest_payments.create_index("payment_id", unique=True)
        db.harvest_payments.create_index("razorpay_order_id", sparse=True)
        db.harvest_payments.create_index([("harvest_request_id", 1), ("status", 1)])
        db.harvest_payments.create_index("idempotency_key", sparse=True)
        db.webhook_events.create_index("event_id", unique=True)
    except Exception as idx_err:
        print(f"[DB INDEX NOTICE] {idx_err}")

except Exception as e:
    print("[INFO] MongoDB Connection not available; running in fast offline fallback mode.")
    db = None