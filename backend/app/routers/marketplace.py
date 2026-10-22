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

        # Check if a listing with the same ID or same harvestOperationId already exists; update it if so
        existing = None
        if new_doc.get("id"):
            existing = db.timber_marketplace_listings.find_one({"id": new_doc["id"]})
        if not existing and new_doc.get("harvestOperationId"):
            existing = db.timber_marketplace_listings.find_one({"harvestOperationId": new_doc["harvestOperationId"]})

        if existing:
            db.timber_marketplace_listings.update_one(
                {"_id": existing["_id"]},
                {"$set": new_doc}
            )
            found = db.timber_marketplace_listings.find_one({"_id": existing["_id"]})
            return serialize_doc(found)

        res = db.timber_marketplace_listings.insert_one(new_doc)
        new_doc["_id"] = str(res.inserted_id)
        return serialize_doc(new_doc)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/listings/{listing_id}")
def update_listing(listing_id: str, updated_data: Dict[str, Any]):
    try:
        clean_data = {k: v for k, v in updated_data.items() if k != "_id"}
        q = [{"id": listing_id}]
        if ObjectId.is_valid(listing_id):
            q.append({"_id": ObjectId(listing_id)})

        res = db.timber_marketplace_listings.update_one(
            {"$or": q},
            {"$set": clean_data}
        )
        if res.matched_count == 0:
            clean_data["id"] = listing_id
            db.timber_marketplace_listings.insert_one(clean_data)

        found = db.timber_marketplace_listings.find_one({"$or": q})
        return serialize_doc(found)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/listings/{listing_id}")
def delete_listing(listing_id: str):
    try:
        q = [{"id": listing_id}, {"title": listing_id}]
        if ObjectId.is_valid(listing_id):
            q.append({"_id": ObjectId(listing_id)})

        # 1. Collect all matching listing IDs / aliases before deleting
        matching_listings = list(db.timber_marketplace_listings.find({"$or": q}))
        all_listing_ids = {listing_id}
        for doc in matching_listings:
            if doc.get("id"):
                all_listing_ids.add(str(doc["id"]))
            if doc.get("_id"):
                all_listing_ids.add(str(doc["_id"]))
            if doc.get("harvestOperationId"):
                all_listing_ids.add(str(doc["harvestOperationId"]))
            if doc.get("treeInventoryId"):
                all_listing_ids.add(str(doc["treeInventoryId"]))

        res = db.timber_marketplace_listings.delete_many({"$or": q})

        # 2. Cascade delete any associated negotiations from timber_negotiations
        neg_res = db.timber_negotiations.delete_many({
            "listingId": {"$in": list(all_listing_ids)}
        })
        print(f"[CASCADE DELETE] Deleted {res.deleted_count} listing(s) and {neg_res.deleted_count} associated negotiation(s) for IDs {all_listing_ids}")

        return {
            "success": True,
            "deleted_id": listing_id,
            "deleted_count": res.deleted_count,
            "deleted_negotiations": neg_res.deleted_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== NEGOTIATIONS ====================

@router.get("/negotiations")
def get_all_negotiations(buyer_email: Optional[str] = None, seller_email: Optional[str] = None):
    try:
        # Collect all active listing IDs to prune/filter orphaned negotiations
        active_listings = list(db.timber_marketplace_listings.find({}, {"id": 1, "_id": 1, "harvestOperationId": 1, "treeInventoryId": 1}))
        valid_listing_ids = set()
        for l in active_listings:
            if l.get("id"):
                valid_listing_ids.add(str(l["id"]))
            if l.get("_id"):
                valid_listing_ids.add(str(l["_id"]))
            if l.get("harvestOperationId"):
                valid_listing_ids.add(str(l["harvestOperationId"]))
            if l.get("treeInventoryId"):
                valid_listing_ids.add(str(l["treeInventoryId"]))

        q = {}
        if buyer_email:
            q["buyerEmail"] = {"$regex": f"^{buyer_email.strip()}$", "$options": "i"}
        if seller_email:
            q["sellerEmail"] = {"$regex": f"^{seller_email.strip()}$", "$options": "i"}
        docs = list(db.timber_negotiations.find(q).sort("createdAt", -1))

        # Filter and prune orphaned negotiations whose listing no longer exists in timber_marketplace_listings
        valid_docs = []
        orphaned_ids = []
        for d in docs:
            lid = str(d.get("listingId") or "").strip()
            if lid and lid in valid_listing_ids:
                valid_docs.append(d)
            else:
                orphaned_ids.append(d["_id"])

        if orphaned_ids:
            try:
                db.timber_negotiations.delete_many({"_id": {"$in": orphaned_ids}})
                print(f"[CLEANUP] Pruned {len(orphaned_ids)} orphaned negotiations without active listing")
            except Exception as pe:
                print(f"Error pruning orphaned negotiations: {pe}")

        return [serialize_doc(d) for d in valid_docs]
    except Exception as e:
        print(f"Error fetching negotiations: {e}")
        return []

@router.post("/negotiations")
def create_negotiation(neg_data: Dict[str, Any]):
    try:
        new_doc = {**neg_data}
        listing_id = new_doc.get("listingId")
        buyer_email = (new_doc.get("buyerEmail") or "").strip().lower()

        # Deduplication check: if an active negotiation already exists for this listing and buyer, update it
        if listing_id and buyer_email:
            existing = db.timber_negotiations.find_one({
                "listingId": listing_id,
                "buyerEmail": {"$regex": f"^{buyer_email}$", "$options": "i"}
            })
            if existing:
                new_doc.pop("_id", None)
                new_doc["id"] = existing.get("id") or new_doc.get("id")
                db.timber_negotiations.update_one({"_id": existing["_id"]}, {"$set": new_doc})
                existing.update(new_doc)
                return serialize_doc(existing)

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
        clean_data = {k: v for k, v in updated_data.items() if k != "_id"}
        q = [{"id": neg_id}]
        if ObjectId.is_valid(neg_id):
            q.append({"_id": ObjectId(neg_id)})

        res = db.timber_negotiations.update_one(
            {"$or": q},
            {"$set": clean_data}
        )
        if res.matched_count == 0:
            clean_data["id"] = neg_id
            db.timber_negotiations.insert_one(clean_data)

        found = db.timber_negotiations.find_one({"$or": q})
        return serialize_doc(found)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/negotiations/{neg_id}")
def delete_negotiation(neg_id: str):
    try:
        q = [{"id": neg_id}]
        if ObjectId.is_valid(neg_id):
            q.append({"_id": ObjectId(neg_id)})
        res = db.timber_negotiations.delete_many({"$or": q})
        return {"success": True, "deleted_id": neg_id, "deleted_count": res.deleted_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/negotiations")
def clear_negotiations(buyer_email: Optional[str] = None):
    try:
        q = {}
        if buyer_email:
            q["buyerEmail"] = {"$regex": f"^{buyer_email.strip()}$", "$options": "i"}
        res = db.timber_negotiations.delete_many(q)
        return {"success": True, "deleted_count": res.deleted_count}
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

@router.put("/orders/{order_id}")
def update_order(order_id: str, updated_data: Dict[str, Any]):
    try:
        db.timber_orders.update_one(
            {"$or": [{"id": order_id}, {"_id": ObjectId(order_id) if ObjectId.is_valid(order_id) else None}]},
            {"$set": updated_data}
        )
        found = db.timber_orders.find_one(
            {"$or": [{"id": order_id}, {"_id": ObjectId(order_id) if ObjectId.is_valid(order_id) else None}]}
        )
        return serialize_doc(found)
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
