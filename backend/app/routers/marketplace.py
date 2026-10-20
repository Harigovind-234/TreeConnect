from fastapi import APIRouter, HTTPException, Header, status
from fastapi.responses import JSONResponse
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from bson import ObjectId
import json
import uuid

from app.database import db

router = APIRouter()

def serialize_doc(doc: dict) -> dict:
    if not doc:
        return doc
    res = {}
    for k, v in doc.items():
        if isinstance(v, ObjectId):
            res[k] = str(v)
        elif isinstance(v, datetime):
            res[k] = v.isoformat()
        elif isinstance(v, list):
            res[k] = [serialize_doc(i) if isinstance(i, dict) else i for i in v]
        elif isinstance(v, dict):
            res[k] = serialize_doc(v)
        else:
            res[k] = v
    if "_id" in res:
        res["_id"] = str(res["_id"])
        if "id" not in res or not res["id"]:
            res["id"] = str(res["_id"])
    return res

# ==================== LISTINGS ====================

@router.get("/listings")
def get_all_listings():
    try:
        docs = list(db.timber_marketplace_listings.find().sort("createdAt", -1))
        return [serialize_doc(d) for d in docs]
    except Exception as e:
        print(f"Error fetching listings: {e}")
        return []

@router.post("/listings")
def create_listing(listing_data: Dict[str, Any]):
    try:
        new_doc = {**listing_data}
        if "id" not in new_doc or not new_doc["id"]:
            new_doc["id"] = f"tl_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
        new_doc["createdAt"] = new_doc.get("createdAt") or datetime.now(timezone.utc).strftime("%Y-%m-%d")
        new_doc["status"] = new_doc.get("status") or "Published"

        res = db.timber_marketplace_listings.insert_one(new_doc)
        new_doc["_id"] = str(res.inserted_id)
        return serialize_doc(new_doc)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/listings/{listing_id}")
def update_listing(listing_id: str, updated_data: Dict[str, Any]):
    try:
        db.timber_marketplace_listings.update_one(
            {"$or": [{"id": listing_id}, {"_id": ObjectId(listing_id) if ObjectId.is_valid(listing_id) else None}]},
            {"$set": updated_data}
        )
        found = db.timber_marketplace_listings.find_one(
            {"$or": [{"id": listing_id}, {"_id": ObjectId(listing_id) if ObjectId.is_valid(listing_id) else None}]}
        )
        return serialize_doc(found)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/listings/{listing_id}")
def delete_listing(listing_id: str):
    try:
        db.timber_marketplace_listings.delete_one(
            {"$or": [{"id": listing_id}, {"_id": ObjectId(listing_id) if ObjectId.is_valid(listing_id) else None}]}
        )
        return {"success": True, "deleted_id": listing_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== NEGOTIATIONS ====================

@router.get("/negotiations")
def get_all_negotiations(buyer_email: Optional[str] = None, seller_email: Optional[str] = None):

    try:
        q = {}
        if buyer_email:
            q["buyerEmail"] = {"$regex": f"^{buyer_email.strip()}$", "$options": "i"}
        if seller_email:
            q["sellerEmail"] = {"$regex": f"^{seller_email.strip()}$", "$options": "i"}
        docs = list(db.timber_negotiations.find(q).sort("createdAt", -1))
        return [serialize_doc(d) for d in docs]
    except Exception as e:
        print(f"Error fetching negotiations: {e}")
        return []

@router.post("/negotiations")
def create_negotiation(neg_data: Dict[str, Any]):
    try:
        new_doc = {**neg_data}
        if "id" not in new_doc or not new_doc["id"]:
            new_doc["id"] = f"neg_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
        new_doc["createdAt"] = new_doc.get("createdAt") or datetime.now(timezone.utc).strftime("%Y-%m-%d")
        new_doc["status"] = new_doc.get("status") or "Pending Review"

        res = db.timber_negotiations.insert_one(new_doc)
        new_doc["_id"] = str(res.inserted_id)
        return serialize_doc(new_doc)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/negotiations/{neg_id}")
def update_negotiation(neg_id: str, updated_data: Dict[str, Any]):
    try:
        db.timber_negotiations.update_one(
            {"$or": [{"id": neg_id}, {"_id": ObjectId(neg_id) if ObjectId.is_valid(neg_id) else None}]},
            {"$set": updated_data}
        )
        found = db.timber_negotiations.find_one(
            {"$or": [{"id": neg_id}, {"_id": ObjectId(neg_id) if ObjectId.is_valid(neg_id) else None}]}
        )
        return serialize_doc(found)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== ORDERS ====================

@router.get("/orders")
def get_all_orders(buyer_email: Optional[str] = None):

    try:
        q = {}
        if buyer_email:
            q["buyerEmail"] = {"$regex": f"^{buyer_email.strip()}$", "$options": "i"}
        docs = list(db.timber_orders.find(q).sort("createdAt", -1))
        return [serialize_doc(d) for d in docs]
    except Exception as e:
        print(f"Error fetching orders: {e}")
        return []

@router.post("/orders")
def create_order(order_data: Dict[str, Any]):
    try:
        new_doc = {**order_data}
        if "id" not in new_doc or not new_doc["id"]:
            new_doc["id"] = f"ORD-2026-{int(datetime.now(timezone.utc).timestamp()) % 10000:04d}"
        new_doc["createdAt"] = new_doc.get("createdAt") or datetime.now(timezone.utc).strftime("%Y-%m-%d")

        res = db.timber_orders.insert_one(new_doc)
        new_doc["_id"] = str(res.inserted_id)
        return serialize_doc(new_doc)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== LIVE MARKETPLACE STATS ====================

@router.get("/stats")
def get_marketplace_stats():

    try:
        total_listings = db.timber_marketplace_listings.count_documents({"status": {"$ne": "Sold"}})
        active_negs = db.timber_negotiations.count_documents({"status": {"$in": ["Pending Review", "Counter-Offer"]}})
        total_orders = db.timber_orders.count_documents({})
        in_transit = db.timber_orders.count_documents({"status": {"$regex": "Transit|Scheduled", "$options": "i"}})

        # Aggregate total spend
        pipeline = [{"$group": {"_id": None, "totalSpend": {"$sum": "$totalNum"}}}]
        agg_res = list(db.timber_orders.aggregate(pipeline))
        total_spend = agg_res[0]["totalSpend"] if agg_res else 0

        # Distinct species
        species_list = db.timber_marketplace_listings.distinct("timberSpecies", {"status": {"$ne": "Sold"}})

        return {
            "totalListings": total_listings,
            "activeNegotiations": active_negs,
            "totalOrders": total_orders,
            "inTransitOrders": in_transit,
            "totalSpend": total_spend,
            "availableSpecies": species_list
        }
    except Exception as e:
        print(f"Error fetching stats: {e}")
        return {
            "totalListings": 0,
            "activeNegotiations": 0,
            "totalOrders": 0,
            "inTransitOrders": 0,
            "totalSpend": 0,
            "availableSpecies": []
        }
