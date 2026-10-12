from pymongo import MongoClient
from app.config import MONGODB_URL, DATABASE_NAME

db = None

try:
    client = MongoClient(MONGODB_URL, serverSelectionTimeoutMS=10000, socketTimeoutMS=15000)
    client.admin.command("ping")
    print("[OK] MongoDB Connected Successfully")
    db = client[DATABASE_NAME]
except Exception as e:
    print(f"[WARN] Primary MongoDB ({MONGODB_URL}) failed: {e}. Trying localhost fallback...")
    try:
        client = MongoClient("mongodb://localhost:27017", serverSelectionTimeoutMS=5000, socketTimeoutMS=5000)
        client.admin.command("ping")
        print("[OK] Connected to Localhost MongoDB Successfully")
        db = client[DATABASE_NAME]
    except Exception as local_err:
        print(f"[INFO] Localhost MongoDB also unavailable: {local_err}. Running in offline fallback mode.")
        db = None

if db is not None:
    try:
        db.harvest_payments.create_index("payment_id", unique=True)
        db.harvest_payments.create_index("razorpay_order_id", sparse=True)
        db.harvest_payments.create_index([("harvest_request_id", 1), ("status", 1)])
        db.harvest_payments.create_index("idempotency_key", sparse=True)
        db.webhook_events.create_index("event_id", unique=True)
    except Exception as idx_err:
        print(f"[DB INDEX NOTICE] {idx_err}")