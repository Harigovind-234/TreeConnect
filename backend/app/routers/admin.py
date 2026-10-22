from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from app.database import db

router = APIRouter()

from typing import Optional
from bson import ObjectId

USER_LIST_PROJECTION = {
    "_id": 1,
    "email": 1,
    "role": 1,
    "fullName": 1,
    "companyName": 1,
    "contactPerson": 1,
    "name": 1,
    "phone": 1,
    "district": 1,
    "state": 1,
    "country": 1,
    "address": 1,
    "localBody": 1,
    "panchayat": 1,
    "postalCode": 1,
    "pinCode": 1,
    "createdAt": 1,
    "isVerified": 1,
    "status": 1,
    "experience": 1,
    "yearsOfExperience": 1,
    "equipment": 1,
    "machinery": 1,
    "buyerType": 1,
    "businessType": 1,
    "docType": 1,
    "forestLicenceDoc": 1,
    "tradeLicenceDoc": 1,
    "gstDoc": 1,
    "businessCertDoc": 1,
    "landTaxInvoiceDoc": 1,
    "idProofType": 1,
    "idProofDocument": 1,
    "supportingDocument": 1,
    "declarationAccepted": 1,
    "preferredCommunication": 1,
    "forestLicenceUrl": 1,
    "tradeLicenceUrl": 1,
    "gstUrl": 1,
    "businessCertUrl": 1,
    "landTaxInvoiceUrl": 1,
    "idProofUrl": 1,
    "supportingUrl": 1,
}

def format_user_summary(u, include_urls=False):
    user_id = str(u.get("_id", ""))
    email = u.get("email", "").strip().lower()

    role = u.get("role", "landowner")
    name = u.get("fullName") or u.get("companyName") or u.get("contactPerson") or email
    phone = u.get("phone") or "N/A"
    district_raw = u.get("district") or ""
    district = district_raw or u.get("state") or u.get("address") or "Kerala"
    if "Kerala" not in district and district != "N/A":
        district = f"{district}, Kerala"

    created_at = u.get("createdAt", "")
    date_str = "Recent"
    if created_at:
        try:
            date_str = created_at.split("T")[0]
        except Exception:
            pass

    is_verified = u.get("isVerified", False)
    status_val = u.get("status", "Pending")
    
    if is_verified and status_val == "Active":
        verification = "Verified by TreeConnect Admin"
    else:
        verification = "Pending Verification"

    experience = u.get("experience") or u.get("yearsOfExperience") or "N/A"
    equipment = u.get("equipment") or u.get("machinery") or "N/A"
    buyer_type = u.get("buyerType") or u.get("businessType") or ""
    forest_licence = u.get("forestLicenceDoc") or ""
    trade_licence = u.get("tradeLicenceDoc") or ""
    gst_doc = u.get("gstDoc") or ""
    business_cert = u.get("businessCertDoc") or ""
    land_tax_doc = u.get("landTaxInvoiceDoc") or ""
    id_proof_doc = u.get("idProofDocument") or ""

    docs_summary_list = []
    if forest_licence: docs_summary_list.append("Forest Dept Licence")
    if trade_licence: docs_summary_list.append("Trade Licence")
    if gst_doc: docs_summary_list.append("GST Registration")
    if land_tax_doc: docs_summary_list.append("Land Tax Invoice")
    if id_proof_doc: docs_summary_list.append(u.get("idProofType") or "Govt ID")

    doc_type = u.get("docType") or (", ".join(docs_summary_list) if docs_summary_list else "No Verification Documents")
    contact_person = u.get("contactPerson") or u.get("fullName") or name

    user_data = {
        "id": user_id,
        "name": name,
        "contractorName": name,
        "companyName": u.get("companyName") or name,
        "contactPerson": contact_person,
        "email": email,
        "phone": phone,
        "role": role,
        "location": district,
        "district": district_raw or (district.split(',')[0].strip() if district else "Kerala"),
        "state": u.get("state") or "Kerala",
        "country": u.get("country") or "India",
        "address": u.get("address") or "",
        "localBody": u.get("localBody") or u.get("panchayat") or "",
        "postalCode": u.get("postalCode") or u.get("pinCode") or "",
        "buyerType": buyer_type,
        "businessType": buyer_type,
        "status": status_val,
        "isVerified": is_verified,
        "verification": verification,
        "date": date_str,
        "submittedDate": date_str,
        "experience": experience,
        "equipment": equipment,
        "docType": doc_type,
        "forestLicenceDoc": forest_licence,
        "tradeLicenceDoc": trade_licence,
        "gstDoc": gst_doc,
        "businessCertDoc": business_cert,
        "landTaxInvoiceDoc": land_tax_doc,
        "idProofType": u.get("idProofType") or "Aadhaar Card",
        "idProofDocument": id_proof_doc,
        "supportingDocument": u.get("supportingDocument") or "",
        "declarationAccepted": u.get("declarationAccepted", True),
        "preferredCommunication": u.get("preferredCommunication") or "Email",
        "forestLicenceUrl": u.get("forestLicenceUrl") or "",
        "tradeLicenceUrl": u.get("tradeLicenceUrl") or "",
        "gstUrl": u.get("gstUrl") or "",
        "businessCertUrl": u.get("businessCertUrl") or "",
        "landTaxInvoiceUrl": u.get("landTaxInvoiceUrl") or "",
        "idProofUrl": u.get("idProofUrl") or "",
        "supportingUrl": u.get("supportingUrl") or "",
    }

    return user_data
def format_inr(amount: float) -> str:
    if amount >= 10000000:
        return f"₹{amount / 10000000:.2f} Cr"
    elif amount >= 100000:
        return f"₹{amount / 100000:.2f} Lakhs"
    elif amount >= 1000:
        return f"₹{amount / 1000:.1f}K"
    else:
        return f"₹{amount:,.0f}"

@router.get("/overview")
def get_platform_overview():
    try:
        if db is None:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"message": "Database connection error"}
            )

        # 1. Users count (exclude admin)
        users = list(db.users.find({}, {"role": 1, "status": 1, "isVerified": 1, "verification": 1, "forestLicenceDoc": 1, "tradeLicenceDoc": 1}))
        non_admin_users = [u for u in users if (u.get("role") or "").lower() != "admin"]
        total_users_count = len(non_admin_users)

        # Pending contractors review
        pending_contractors = [
            u for u in non_admin_users
            if (
                not u.get("isVerified")
                or "pending" in str(u.get("verification", "")).lower()
                or str(u.get("status", "")).lower() == "pending"
            )
            and (u.get("role") in ["contractor", "buyer"] or u.get("forestLicenceDoc") or u.get("tradeLicenceDoc"))
        ]
        pending_contractor_count = len(pending_contractors)

        # 2. Properties count
        props = list(db.properties.find({}, {"treeCount": 1, "totalTrees": 1}))
        total_properties_count = len(props)
        total_trees = sum(p.get("treeCount", 0) or p.get("totalTrees", 0) for p in props)

        # 3. Harvest requests
        harvests = list(db.harvest_requests.find({}, {
            "status": 1,
            "inspection_status": 1,
            "inspection_scheduled_date": 1,
            "current_harvest_stage": 1,
            "is_advance_verified": 1,
            "is_fully_paid": 1
        }))
        total_harvests_count = len(harvests)

        pending_harvests = []
        bidding_harvests = []
        survey_harvests = []
        active_harvesting = []
        completed_harvests = []

        for h in harvests:
            st = str(h.get("status", "")).upper()
            insp_st = str(h.get("inspection_status", "")).upper()
            has_insp_date = bool(h.get("inspection_scheduled_date"))
            stage = str(h.get("current_harvest_stage", "")).lower()

            if "COMPLET" in st or "SETTLED" in st or "FINAL" in st or h.get("is_fully_paid"):
                completed_harvests.append(h)
            elif "IN_PROGRESS" in st or "HARVEST" in st or stage in ["stage_1", "stage_2", "stage_3", "stage_4"] or h.get("is_advance_verified"):
                active_harvesting.append(h)
            elif "SURVEY" in st or "SCHEDULED" in insp_st or (has_insp_date and insp_st != "COMPLETED"):
                survey_harvests.append(h)
            elif st in ["CONTRACTOR_ASSIGNED", "ASSESSMENT_SUBMITTED", "COUNTER_PROPOSED_BY_LANDOWNER", "PENDING_LANDOWNER_APPROVAL"] or "BID" in st:
                bidding_harvests.append(h)
            else:
                pending_harvests.append(h)

        # 4. Timber listings
        listings = list(db.timber_marketplace_listings.find({}, {"status": 1}))
        total_listings_count = len(listings)
        active_listings = [l for l in listings if str(l.get("status", "")).lower() not in ["sold", "inactive"]]

        # 5. Transactions / Payments
        payments = list(db.harvest_payments.find({}, {"status": 1, "amount": 1}))
        verified_payments = [p for p in payments if str(p.get("status", "")).upper() in ["VERIFIED", "PAID", "SUCCESS", "COMPLETED"]]
        verified_amount = sum(float(p.get("amount", 0) or 0) for p in verified_payments)

        orders = list(db.timber_orders.find({}, {"totalAmount": 1, "agreedPrice": 1, "status": 1}))
        order_amount = sum(float(o.get("totalAmount") or o.get("agreedPrice") or 0) for o in orders)
        total_transactions_val = verified_amount + order_amount

        metrics = [
            {
                "id": "total_users",
                "label": "TOTAL USERS",
                "value": str(total_users_count),
                "subtext": "Live MongoDB count",
                "icon": "Users",
                "color": "emerald"
            },
            {
                "id": "pending_contractors",
                "label": "CONTRACTOR VERIFICATION",
                "value": str(pending_contractor_count),
                "subtext": f"{pending_contractor_count} pending review" if pending_contractor_count > 0 else "All verified",
                "icon": "ShieldCheck",
                "color": "amber" if pending_contractor_count > 0 else "emerald"
            },
            {
                "id": "active_properties",
                "label": "ACTIVE PROPERTIES",
                "value": str(total_properties_count),
                "subtext": f"{total_trees} trees cataloged" if total_trees > 0 else f"{total_properties_count} registered",
                "icon": "Trees",
                "color": "emerald"
            },
            {
                "id": "harvest_requests",
                "label": "HARVEST REQUESTS",
                "value": str(total_harvests_count),
                "subtext": f"{len(pending_harvests)} pending" if len(pending_harvests) > 0 else (f"{len(completed_harvests)} completed" if len(completed_harvests) > 0 else "0 pending"),
                "icon": "Truck",
                "color": "blue"
            },
            {
                "id": "timber_listings",
                "label": "TIMBER LISTINGS",
                "value": str(len(active_listings)),
                "subtext": f"{len(active_listings)} active in market",
                "icon": "ShoppingBag",
                "color": "purple"
            },
            {
                "id": "transactions",
                "label": "TRANSACTIONS",
                "value": format_inr(total_transactions_val),
                "subtext": f"{len(verified_payments)} verified payments" if len(verified_payments) > 0 else "Escrow protected",
                "icon": "DollarSign",
                "color": "emerald"
            }
        ]

        operations_overview = {
            "harvestOperations": {
                "pendingRequests": len(pending_harvests),
                "contractorBidding": len(bidding_harvests),
                "surveyScheduled": len(survey_harvests),
                "harvesting": len(active_harvesting),
                "completed": len(completed_harvests),
                "operationsTotal": total_harvests_count
            },
            "timberMarketplace": {
                "activeListings": len(active_listings),
                "buyerRequests": len(list(db.timber_negotiations.find({}))),
                "pendingOrders": len([o for o in orders if str(o.get("status", "")).lower() not in ["delivered", "completed"]]),
                "completedSales": len([l for l in listings if str(l.get("status", "")).lower() == "sold"]) + len([o for o in orders if str(o.get("status", "")).lower() in ["delivered", "completed"]]),
                "transactionValue": format_inr(order_amount)
            },
            "transactionsSummary": {
                "completedValue": format_inr(total_transactions_val),
                "pendingValue": format_inr(sum(float(p.get("amount", 0) or 0) for p in payments if p not in verified_payments)),
                "failedCount": len([p for p in payments if str(p.get("status", "")).upper() in ["FAILED", "REJECTED"]])
            }
        }

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "metrics": metrics,
                "operationsOverview": operations_overview
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": f"Failed to fetch platform overview: {str(e)}"}
        )

@router.get("/users")
def get_all_users(role: Optional[str] = None):
    try:
        users_list = []

        if db is not None:
            query = {}
            if role:
                query["role"] = {"$regex": f"^{role}$", "$options": "i"}

            db_users = list(db.users.find(query, USER_LIST_PROJECTION))
            for u in db_users:
                email = u.get("email", "").strip().lower()
                if not email:
                    continue
                users_list.append(format_user_summary(u, include_urls=False))

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"users": users_list}
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": f"Failed to fetch users from database: {str(e)}"}
        )

@router.get("/users/{user_id}")
def get_user_by_id(user_id: str):
    try:
        if db is None:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"message": "Database connection error"}
            )

        query = {}
        if ObjectId.is_valid(user_id):
            query = {"$or": [{"_id": ObjectId(user_id)}, {"_id": user_id}, {"email": user_id.lower()}]}
        else:
            query = {"$or": [{"_id": user_id}, {"email": user_id.lower()}]}

        # Exclude password and fleet equipment
        user_doc = db.users.find_one(query, {"password": 0, "fleet_equipment": 0})
        if not user_doc:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "User not found"}
            )

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"user": format_user_summary(user_doc, include_urls=True)}
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": f"Failed to fetch user: {str(e)}"}
        )

from pydantic import BaseModel
from typing import Optional
from bson import ObjectId

class UserStatusUpdate(BaseModel):
    status: Optional[str] = "Active"
    isVerified: Optional[bool] = True

@router.put("/users/{user_id}/status")
@router.post("/users/{user_id}/verify")
def update_user_status(user_id: str, payload: UserStatusUpdate):
    try:
        if db is None:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"message": "Database connection error"}
            )

        query = {}
        if ObjectId.is_valid(user_id):
            query = {"$or": [{"_id": ObjectId(user_id)}, {"_id": user_id}, {"email": user_id.lower()}]}
        else:
            query = {"$or": [{"_id": user_id}, {"email": user_id.lower()}]}

        update_fields = {}
        if payload.status is not None:
            update_fields["status"] = payload.status
        if payload.isVerified is not None:
            update_fields["isVerified"] = payload.isVerified

        result = db.users.update_one(query, {"$set": update_fields})

        if result.matched_count == 0:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": f"User with ID {user_id} not found."}
            )

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"message": "User verification status updated successfully."}
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": f"Failed to update user status: {str(e)}"}
        )

# ==================== OPERATIONS & MARKET DATA ====================

def serialize_mongo(doc):
    if doc is None:
        return None
    if isinstance(doc, ObjectId):
        return str(doc)
    if isinstance(doc, dict):
        res = {}
        for k, v in doc.items():
            if isinstance(v, ObjectId):
                res[k] = str(v)
            elif isinstance(v, (dict, list)):
                res[k] = serialize_mongo(v)
            else:
                res[k] = v
        if "_id" in res and "id" not in res:
            res["id"] = res["_id"]
        return res
    if isinstance(doc, list):
        return [serialize_mongo(i) for i in doc]
    return doc

@router.get("/harvests")
def get_admin_harvest_operations():
    try:
        if db is None:
            return JSONResponse(status_code=500, content={"message": "Database offline"})

        docs = list(db.harvest_requests.find().sort("createdAt", -1))
        serialized = [serialize_mongo(d) for d in docs]
        return JSONResponse(status_code=200, content={"harvests": serialized})
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Failed to fetch harvests: {str(e)}"})

@router.get("/marketplace")
def get_admin_marketplace():
    try:
        if db is None:
            return JSONResponse(status_code=500, content={"message": "Database offline"})

        listings = list(db.timber_marketplace_listings.find().sort("createdAt", -1))
        negotiations = list(db.timber_negotiations.find().sort("createdAt", -1))
        orders = list(db.timber_orders.find().sort("createdAt", -1))

        return JSONResponse(status_code=200, content={
            "listings": [serialize_mongo(l) for l in listings],
            "negotiations": [serialize_mongo(n) for n in negotiations],
            "orders": [serialize_mongo(o) for o in orders]
        })
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Failed to fetch marketplace: {str(e)}"})

@router.get("/payments")
def get_admin_payments():
    try:
        if db is None:
            return JSONResponse(status_code=500, content={"message": "Database offline"})

        payments = list(db.harvest_payments.find().sort("created_at", -1))
        orders = list(db.timber_orders.find().sort("createdAt", -1))

        verified = [p for p in payments if str(p.get("status", "")).upper() in ["VERIFIED", "PAID", "SUCCESS", "COMPLETED"]]
        verified_amount = sum(float(p.get("amount", 0) or 0) for p in verified)
        order_amount = sum(float(o.get("totalAmount") or o.get("agreedPrice") or 0) for o in orders)

        pending_amount = sum(float(p.get("amount", 0) or 0) for p in payments if str(p.get("status", "")).upper() not in ["VERIFIED", "PAID", "SUCCESS", "COMPLETED", "FAILED", "REJECTED"])
        failed_count = len([p for p in payments if str(p.get("status", "")).upper() in ["FAILED", "REJECTED"]])

        return JSONResponse(status_code=200, content={
            "payments": [serialize_mongo(p) for p in payments],
            "orders": [serialize_mongo(o) for o in orders],
            "summary": {
                "totalCompletedVolume": format_inr(verified_amount + order_amount),
                "totalPendingEscrow": format_inr(pending_amount),
                "verifiedPaymentsCount": len(verified),
                "failedPaymentsCount": failed_count,
                "totalTransactionsCount": len(payments) + len(orders)
            }
        })
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Failed to fetch payments: {str(e)}"})

