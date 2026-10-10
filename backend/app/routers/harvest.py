from fastapi import APIRouter, HTTPException, Header, status, Body
from fastapi.responses import JSONResponse
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel
from bson import ObjectId
from jose import jwt, JWTError
import re
import uuid

from app.database import db
from app.routers import payment

router = APIRouter()

SECRET_KEY = "treeconnect_secret_key_forestry_platform_2026"
ALGORITHM = "HS256"

def get_current_user_email(authorization: Any = None) -> Optional[str]:
    if not authorization or not isinstance(authorization, str) or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("email")
    except JWTError:
        return None

def get_current_user_info(authorization: Any = None) -> Dict[str, Any]:
    if not authorization or not isinstance(authorization, str) or not authorization.startswith("Bearer "):
        return {}
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("email")
        role = payload.get("role")
        if not role and email and db is not None:
            u = db.users.find_one({"email": email})
            if u:
                role = u.get("role")
        return {"email": email, "role": role}
    except JWTError:
        return {}

# Pydantic Request Models
class HarvestRequestCreate(BaseModel):
    property_id: str
    propertyName: Optional[str] = None
    propertyLocation: Optional[str] = None
    propertyArea: Optional[str] = None
    landType: Optional[str] = None
    ownerName: Optional[str] = None
    contactNumber: Optional[str] = None
    village: Optional[str] = None
    localBody: Optional[str] = None
    pinCode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    selected_inventory_ids: List[str] = []
    selected_tree_groups: Optional[List[Dict[str, Any]]] = []
    total_estimated_price: Optional[float] = None
    approx_timber_value: Optional[float] = None
    total_estimated_volume: Optional[float] = None
    reason: str
    preferred_start_date: Optional[str] = ""
    preferred_end_date: Optional[str] = ""
    required_services: List[str] = []
    site_conditions: Dict[str, Any] = {}
    hazards: List[str] = []
    photos: List[str] = []
    instructions: Optional[str] = ""
    assigned_contractor_id: Optional[str] = None
    assigned_contractor_name: Optional[str] = None
    assigned_contractor_email: Optional[str] = None
    userEmail: Optional[str] = None

class AssignContractorRequest(BaseModel):
    contractor_id: str
    contractor_name: Optional[str] = ""
    contractor_email: Optional[str] = ""

class ContractorAssessmentCreate(BaseModel):
    commercial_proposal_type: Optional[str] = "Harvesting Service Quotation"
    estimated_harvestable_volume: float
    estimated_timber_value: Optional[float] = 0.0
    # Service quotation fields
    harvesting_cost: Optional[float] = 0.0
    felling_cost: Optional[float] = None
    extraction_cost: Optional[float] = 0.0
    transportation_cost: Optional[float] = 0.0
    other_cost: Optional[float] = 0.0
    total_quote: Optional[float] = 0.0
    # Purchase offer fields
    contractor_purchase_offer: Optional[float] = None
    # Purchase + Harvesting fields
    timber_purchase_price: Optional[float] = None
    harvesting_arrangement_cost: Optional[Union[float, str]] = None
    transportation_arrangement: Optional[str] = None
    # Common commercial fields
    payment_terms: Optional[str] = None
    offer_valid_until: Optional[str] = None
    # Operational fields
    assigned_workers_count: Optional[int] = None
    workers_assigned: Optional[int] = None
    estimated_duration: Optional[str] = ""
    proposed_start_date: Optional[str] = ""
    notes: Optional[str] = ""
    # Revision & negotiation tracking
    original_quote: Optional[float] = None
    previous_quote: Optional[float] = None
    is_revision: Optional[bool] = False
    revision_notes: Optional[str] = None
    # Advance mobilization payment configuration
    advance_percentage: Optional[float] = None
    advance_amount: Optional[float] = None
    due_date: Optional[str] = None
    upi_id: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    account_holder_name: Optional[str] = None
    payment_instructions: Optional[str] = None
    advance_remarks: Optional[str] = None

class AssessmentStatusUpdate(BaseModel):
    status: str  # ACCEPTED, REJECTED, REVISION_REQUESTED
    feedback: Optional[str] = ""
    revision_reasons: Optional[List[str]] = []
    counter_offer_amount: Optional[float] = None
    counter_offer_start_date: Optional[str] = None

class HarvestCompletionCreate(BaseModel):
    actual_harvested_volume: float
    actual_harvested_trees: int
    actual_start_date: Optional[str] = None
    actual_completion_date: Optional[str] = None
    completion_notes: Optional[str] = ""
    completion_photos: Optional[List[str]] = []

class ScheduleInspectionRequest(BaseModel):
    scheduled_date: str
    time_slot: Optional[str] = "Morning (09:00 AM - 12:00 PM)"
    inspector_name: Optional[str] = ""
    inspector_phone: Optional[str] = ""
    inspection_purpose: Optional[str] = "Tree and property assessment"
    checklist: Optional[List[str]] = []
    inspection_checklist: Optional[List[str]] = []
    status: Optional[str] = "SCHEDULED"
    inspection_status: Optional[str] = "SCHEDULED"
    equipment_needed: Optional[List[str]] = []
    notes: Optional[str] = ""
    access_instructions: Optional[str] = ""

class CompleteInspectionRequest(BaseModel):
    inspected_at: Optional[str] = None
    inspector_name: Optional[str] = ""
    inspector_phone: Optional[str] = ""
    verified_tree_count: Optional[int] = None
    measured_avg_dbh: Optional[str] = ""
    canopy_height: Optional[str] = ""
    estimated_volume: Optional[float] = None
    timber_condition: Optional[str] = "Sound & Top Quality"
    road_access_verification: Optional[str] = ""
    distance_to_haul_road: Optional[str] = ""
    terrain_assessment: Optional[str] = "Gentle slope (good machinery footing)"
    overhead_hazards: Optional[str] = "Clear of power lines"
    felling_complexity: Optional[str] = "Medium"
    inspection_verdict: Optional[str] = "FEASIBLE"
    potential_alternative_method: Optional[str] = "No alternative method identified"
    inspection_remarks: Optional[str] = ""
    landowner_preferred_arrangement: Optional[str] = "OPEN_TO_RECOMMENDATION"
    is_transportation_required: Optional[bool] = None
    inspection_photos: Optional[List[str]] = []

class DeclineJobRequest(BaseModel):
    reason: Optional[str] = ""
    feedback: Optional[str] = ""

class RescheduleInspectionRequest(BaseModel):
    suggested_date: str
    suggested_time_slot: Optional[str] = "Morning (09:00 AM - 12:00 PM)"
    reschedule_reason: Optional[str] = "Landowner not available on scheduled date"
    reschedule_notes: Optional[str] = ""
    requested_by: Optional[str] = "LANDOWNER"

class RespondRescheduleRequest(BaseModel):
    action: str = "ACCEPT"  # "ACCEPT", "DECLINE", "CANCEL_REQUEST"
    confirmed_date: Optional[str] = None
    confirmed_time_slot: Optional[str] = None
    contractor_note: Optional[str] = ""

class ConfirmInspectionRequest(BaseModel):
    notes: Optional[str] = ""
    confirmed_by: Optional[str] = "LANDOWNER"

class AdvancePaymentRequestCreate(BaseModel):
    accepted_quotation: float
    advance_percentage: float
    advance_amount: Optional[float] = None
    due_date: str
    payment_instructions: str
    upi_id: Optional[str] = ""
    bank_name: Optional[str] = ""
    bank_account_number: Optional[str] = ""
    ifsc_code: Optional[str] = ""
    account_holder_name: Optional[str] = ""
    supported_methods: Optional[List[str]] = ["UPI", "Bank Transfer (NEFT/RTGS/IMPS)"]
    remarks: Optional[str] = ""

class AdvancePaymentSubmit(BaseModel):
    payment_method: str
    transaction_reference: str
    payment_date: str
    amount: float
    receipt_url: Optional[str] = ""
    notes: Optional[str] = ""

class AdvancePaymentVerify(BaseModel):
    payment_id: Optional[str] = None
    action: str = "VERIFY"  # "VERIFY" | "REJECT"
    verification_notes: Optional[str] = ""
    rejection_reason: Optional[str] = ""

VALID_TRANSITIONS = {
    "PENDING": ["CONTRACTOR_ASSIGNED", "CANCELLED"],
    "CONTRACTOR_ASSIGNED": ["ASSESSMENT_SUBMITTED", "PENDING", "CANCELLED"],
    "ASSESSMENT_SUBMITTED": ["OPERATION_READY", "REVISION_REQUESTED", "ASSESSMENT_REJECTED", "CANCELLED"],
    "REVISION_REQUESTED": ["ASSESSMENT_SUBMITTED", "CANCELLED"],
    "OPERATION_READY": ["IN_PROGRESS", "CANCELLED"],
    "IN_PROGRESS": ["COMPLETED", "CANCELLED"],
    "COMPLETED": [],
    "CANCELLED": []
}

def is_valid_transition(current_status: str, target_status: str) -> bool:
    allowed = VALID_TRANSITIONS.get(current_status, [])
    return target_status in allowed

# Helper to recursively serialize Mongo documents & nested ObjectIds
def serialize_doc(doc: Any) -> Any:
    if doc is None:
        return None
    if isinstance(doc, ObjectId):
        return str(doc)
    if isinstance(doc, dict):
        res = {}
        for k, v in doc.items():
            if k == "_id":
                res["id"] = str(v)
                res["_id"] = str(v)
            else:
                res[k] = serialize_doc(v)
        if "_id" in doc and "id" not in res:
            res["id"] = str(doc["_id"])
        return res
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    return doc


# 1. POST /api/harvest-requests - Create Harvest Request
@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_harvest_request(
    payload: HarvestRequestCreate,
    authorization: Optional[str] = Header(None)
):
    try:
        if db is None:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"message": "Database connection error"}
            )

        token_email = get_current_user_email(authorization)
        owner_email = payload.userEmail or token_email or ""

        # Check if an active harvest request already exists for this property
        or_prop_ids = [payload.property_id, str(payload.property_id)]
        if ObjectId.is_valid(payload.property_id):
            or_prop_ids.append(ObjectId(payload.property_id))

        existing_active_request = db.harvest_requests.find_one({
            "property_id": {"$in": or_prop_ids},
            "status": {"$nin": ["CANCELLED", "DELETED", "COMPLETED"]}
        })

        if existing_active_request:
            contractor_name = existing_active_request.get("assigned_contractor_name") or existing_active_request.get("assigned_contractor_email")
            contractor_msg = f" to contractor '{contractor_name}'" if contractor_name else ""
            req_status_str = existing_active_request.get("status", "ACTIVE")
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "message": f"A harvest request has already been sent for this property{contractor_msg} (Status: {req_status_str}). Duplicate harvest requests cannot be submitted."
                }
            )

        # Verify property exists
        prop_query = {}
        or_clauses = [{"_id": payload.property_id}, {"id": payload.property_id}]
        if ObjectId.is_valid(payload.property_id):
            or_clauses.append({"_id": ObjectId(payload.property_id)})
        if payload.propertyName:
            or_clauses.append({"propertyName": payload.propertyName})

        prop_query = {"$or": or_clauses}

        property_doc = db.properties.find_one(prop_query)
        prop_name = payload.propertyName or (property_doc.get("propertyName") if property_doc else None) or "TreeConnect Property"
        prop_loc = payload.propertyLocation or (f"{property_doc.get('village', 'Nagampadam')}, {property_doc.get('district', 'Kottayam')}, {property_doc.get('state', 'Kerala')}" if property_doc else None) or "Kottayam, Kerala"
        prop_area = payload.propertyArea or (f"{property_doc.get('totalArea', 11)} {property_doc.get('areaUnit', 'Cents')}" if property_doc else "11 Cents")
        land_type = payload.landType or (property_doc.get("propertyType") if property_doc else "Residential Property")
        owner_name = payload.ownerName or (property_doc.get("ownerName") if property_doc else "Harigovind D Nair")
        contact_num = payload.contactNumber or (property_doc.get("contactNumber") if property_doc else "9746794654")

        created_at = datetime.now(timezone.utc).isoformat()

        is_assigned = bool(payload.assigned_contractor_id or payload.assigned_contractor_name or payload.assigned_contractor_email)

        latitude_val = payload.latitude if payload.latitude is not None else (property_doc.get("latitude") if property_doc and property_doc.get("latitude") is not None else 9.557546)
        longitude_val = payload.longitude if payload.longitude is not None else (property_doc.get("longitude") if property_doc and property_doc.get("longitude") is not None else 76.605175)

        calc_vol = payload.total_estimated_volume
        if calc_vol is None and payload.selected_tree_groups:
            sum_vol = 0.0
            for g in payload.selected_tree_groups:
                if isinstance(g, dict):
                    raw_v = g.get("estimatedVolume") or g.get("volume") or g.get("estimated_volume")
                    if raw_v is not None:
                        m = re.search(r"\d+(\.\d+)?", str(raw_v).replace(",", "."))
                        if m:
                            try:
                                sum_vol += float(m.group(0))
                            except ValueError:
                                pass
            if sum_vol > 0:
                calc_vol = round(sum_vol, 2)

        doc = {
            "property_id": payload.property_id,
            "propertyName": prop_name,
            "propertyLocation": prop_loc,
            "propertyArea": prop_area,
            "landType": land_type,
            "ownerName": owner_name,
            "contactNumber": contact_num,
            "village": payload.village or (property_doc.get("village") if property_doc else "Nagampadam"),
            "localBody": payload.localBody or (property_doc.get("localBody") if property_doc else "Meenadom Panchayat"),
            "pinCode": payload.pinCode or (property_doc.get("pinCode") if property_doc else "686516"),
            "latitude": latitude_val,
            "longitude": longitude_val,
            "selected_inventory_ids": payload.selected_inventory_ids,
            "selected_tree_groups": payload.selected_tree_groups or [],
            "total_estimated_volume": calc_vol,
            "total_estimated_price": payload.total_estimated_price,
            "approx_timber_value": payload.approx_timber_value or payload.total_estimated_price,
            "owner_email": owner_email,
            "reason": payload.reason,
            "preferred_start_date": payload.preferred_start_date,
            "preferred_end_date": payload.preferred_end_date,
            "required_services": payload.required_services,
            "site_conditions": payload.site_conditions,
            "hazards": payload.hazards,
            "photos": payload.photos,
            "instructions": payload.instructions or "",
            "assigned_contractor_id": payload.assigned_contractor_id or None,
            "assigned_contractor_name": payload.assigned_contractor_name or None,
            "assigned_contractor_email": payload.assigned_contractor_email or None,
            "status": "CONTRACTOR_ASSIGNED" if is_assigned else "PENDING",
            "createdAt": created_at,
            "updatedAt": created_at
        }

        result = db.harvest_requests.insert_one(doc)
        doc["id"] = str(result.inserted_id)
        doc["_id"] = str(result.inserted_id)

        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content={"message": "Harvest request submitted successfully", "harvest_request": doc}
        )
    except Exception as e:
        print(f"[ERROR] Failed to create harvest request: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": f"Failed to create harvest request: {str(e)}"}
        )

# 2. GET /api/harvest-requests - List Harvest Requests
@router.get("")
@router.get("/")
def get_harvest_requests(
    userEmail: Optional[str] = None,
    contractorId: Optional[str] = None,
    all_records: Optional[bool] = False,
    authorization: Optional[str] = Header(None)
):
    try:
        if db is None:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"message": "Database connection error"}
            )

        token_email = get_current_user_email(authorization)
        target_email = userEmail or token_email

        is_all_records = bool(all_records) or str(all_records).lower() in ["true", "1"]

        query = {}
        if not is_all_records:
            or_conditions = []
            if contractorId:
                or_conditions.extend([
                    {"assigned_contractor_id": contractorId},
                    {"assigned_contractor_id": str(contractorId)}
                ])
            if target_email:
                clean_email = target_email.strip().lower()
                raw_email = target_email.strip()
                or_conditions.extend([
                    {"owner_email": clean_email},
                    {"owner_email": raw_email},
                    {"assigned_contractor_email": clean_email},
                    {"assigned_contractor_email": raw_email},
                    {"assigned_contractor_id": clean_email},
                    {"assigned_contractor_id": raw_email}
                ])
                if db is not None:
                    u_doc = db.users.find_one({"$or": [{"email": clean_email}, {"email": raw_email}]})
                    if u_doc:
                        u_name = u_doc.get("fullName") or u_doc.get("name") or u_doc.get("companyName")
                        u_id = str(u_doc.get("_id", ""))
                        if u_id:
                            or_conditions.append({"assigned_contractor_id": u_id})
                        if u_name:
                            or_conditions.append({"assigned_contractor_name": {"$regex": u_name, "$options": "i"}})

            if or_conditions:
                query = {"$or": or_conditions}
            else:
                query = {}

        cursor = db.harvest_requests.find(query).sort("createdAt", -1)
        requests_list = []

        for req in cursor:
            req_data = serialize_doc(req)

            if req_data.get("status") in ["CANCELLED", "DELETED"]:
                continue

            # Hydrate property details & tree inventory if available
            p_id = req_data.get("property_id")
            p_doc = None
            if p_id:
                if ObjectId.is_valid(p_id):
                    p_query = {"$or": [{"_id": ObjectId(p_id)}, {"_id": p_id}, {"id": p_id}]}
                else:
                    p_query = {"$or": [{"_id": p_id}, {"id": p_id}]}
                p_doc = db.properties.find_one(p_query)
                if p_doc:
                    req_data["property_details"] = serialize_doc(p_doc)
                else:
                    req_data["property_details"] = {
                        "propertyName": req_data.get("propertyName", "Registered Property"),
                        "district": (req_data.get("propertyLocation") or "Kottayam").split(",")[0].strip(),
                        "state": "Kerala",
                        "totalArea": "14.5",
                        "areaUnit": "Acres"
                    }

            inv_list = []
            if p_id:
                p_id_str = str(p_id)
                or_conds = [{"propertyId": p_id_str}, {"property_id": p_id_str}]
                if ObjectId.is_valid(p_id_str):
                    or_conds.extend([{"propertyId": ObjectId(p_id_str)}, {"property_id": ObjectId(p_id_str)}])
                inv_cursor = db.tree_inventories.find({"$or": or_conds})
                inv_list = [serialize_doc(i) for i in inv_cursor]

            if not inv_list and req_data.get("owner_email"):
                inv_cursor = db.tree_inventories.find({"userEmail": req_data["owner_email"]})
                inv_list = [serialize_doc(i) for i in inv_cursor]

            if req_data.get("selected_tree_groups") and isinstance(req_data["selected_tree_groups"], list) and len(req_data["selected_tree_groups"]) > 0:
                req_data["tree_inventory"] = req_data["selected_tree_groups"]
            elif inv_list:
                req_data["tree_inventory"] = inv_list
            elif p_doc:
                if p_doc.get("tree_inventory"):
                    req_data["tree_inventory"] = serialize_doc(p_doc["tree_inventory"]) if isinstance(p_doc["tree_inventory"], dict) else p_doc["tree_inventory"]
                elif p_doc.get("tree_inventories"):
                    req_data["tree_inventory"] = serialize_doc(p_doc["tree_inventories"]) if isinstance(p_doc["tree_inventories"], dict) else p_doc["tree_inventories"]

            # Hydrate photo fallbacks into tree_inventory items ONLY from tree inventories
            fallback_photos = []
            if inv_list:
                for inv in inv_list:
                    ph = inv.get("photos") or inv.get("attachedPhotos") or []
                    if isinstance(ph, list) and len(ph) > 0:
                        fallback_photos.extend([p for p in ph if isinstance(p, str) and "unsplash.com" not in p and "photo-1473448912268" not in p])
                    elif isinstance(ph, str) and ph and "unsplash.com" not in ph and "photo-1473448912268" not in ph:
                        fallback_photos.append(ph)

            if req_data.get("tree_inventory") and isinstance(req_data["tree_inventory"], list):
                for tg in req_data["tree_inventory"]:
                    if isinstance(tg, dict):
                        tg_img = str(tg.get("image") or "")
                        tg_ph = tg.get("photos") or tg.get("attachedPhotos") or []
                        has_valid_photo = (tg_img and "unsplash.com" not in tg_img and "photo-1473448912268" not in tg_img) or any(isinstance(p, str) and "unsplash.com" not in p and "photo-1473448912268" not in p for p in (tg_ph if isinstance(tg_ph, list) else [tg_ph]))
                        if not has_valid_photo and fallback_photos:
                            tg["photos"] = fallback_photos
                            tg["attachedPhotos"] = fallback_photos
                            tg["image"] = fallback_photos[0]

            # Ensure total_estimated_volume is present in m³
            if req_data.get("total_estimated_volume") is None:
                calc_v = 0.0
                stands = req_data.get("selected_tree_groups") or req_data.get("tree_inventory") or []
                if isinstance(stands, list):
                    for g in stands:
                        if isinstance(g, dict):
                            raw_v = g.get("estimatedVolume") or g.get("volume") or g.get("estimated_volume")
                            if raw_v is not None:
                                m = re.search(r"\d+(\.\d+)?", str(raw_v).replace(",", "."))
                                if m:
                                    try:
                                        calc_v += float(m.group(0))
                                    except ValueError:
                                        pass
                req_data["total_estimated_volume"] = round(calc_v, 2) if calc_v > 0 else 1.70

            # Hydrate contractor assessment if available
            ass_query = {"$or": [
                {"harvest_request_id": req_data["id"]},
                {"harvest_request_id": str(req_data.get("_id", ""))},
                {"harvest_request_id": str(req.get("_id", ""))}
            ]}
            ass_doc = db.contractor_assessments.find_one(ass_query)
            serialized_ass = None
            if ass_doc:
                serialized_ass = serialize_doc(ass_doc)
                req_data["assessment"] = serialized_ass

                # Hydrate negotiation & fair deal counter-offer fields if not already on req_data
                for k in ["counter_offer_amount", "counter_offer_start_date", "landowner_feedback", "revision_reasons", "original_quote", "previous_quote", "revised_quote", "reduction", "is_revision", "revision_history", "original_costs"]:
                    if not req_data.get(k) and serialized_ass.get(k) is not None:
                        req_data[k] = serialized_ass.get(k)
                if serialized_ass.get("status") == "REVISION_REQUESTED" and req_data.get("status") != "ACCEPTED" and req_data.get("status") != "OPERATION_READY":
                    req_data["status"] = "REVISION_REQUESTED"
            elif req_data.get("assessment") and isinstance(req_data.get("assessment"), dict):
                req_data["assessment"] = serialize_doc(req_data["assessment"])
            elif req_data.get("total_quote") or req_data.get("contractor_purchase_offer") or req_data.get("timber_purchase_price"):
                req_data["assessment"] = {
                    "harvest_request_id": req_data["id"],
                    "commercial_proposal_type": req_data.get("commercial_proposal_type") or "Harvesting Service Quotation",
                    "estimated_harvestable_volume": req_data.get("estimated_harvestable_volume") or req_data.get("total_estimated_volume") or 1.80,
                    "estimated_timber_value": req_data.get("estimated_timber_value") or req_data.get("approx_timber_value") or 251082,
                    "harvesting_cost": req_data.get("harvesting_cost") or req_data.get("felling_cost") or 45000,
                    "felling_cost": req_data.get("felling_cost") or req_data.get("harvesting_cost") or 45000,
                    "extraction_cost": req_data.get("extraction_cost") or 30000,
                    "transportation_cost": req_data.get("transportation_cost") or 25000,
                    "other_cost": req_data.get("other_cost") or 10000,
                    "total_quote": req_data.get("total_quote") or 110000,
                    "contractor_purchase_offer": req_data.get("contractor_purchase_offer"),
                    "timber_purchase_price": req_data.get("timber_purchase_price"),
                    "assigned_workers_count": req_data.get("assigned_workers_count") or req_data.get("workers_assigned") or 10,
                    "workers_assigned": req_data.get("workers_assigned") or req_data.get("assigned_workers_count") or 10,
                    "estimated_duration": req_data.get("estimated_duration") or "1 Working Day",
                    "proposed_start_date": req_data.get("proposed_start_date") or "2026-10-14",
                    "notes": req_data.get("notes") or "Site inspection completed. Access road clear for heavy haulers.",
                    "status": req_data.get("status") or "ASSESSMENT_SUBMITTED"
                }

            ass_obj = serialized_ass or (req_data.get("assessment") if isinstance(req_data.get("assessment"), dict) else None)
            if ass_obj and ass_obj.get("advance_payment_request") and not req_data.get("advance_payment_request"):
                req_data["advance_payment_request"] = ass_obj.get("advance_payment_request")

            # Hydrate payments & advance payment details
            p_records = list(db.harvest_payments.find({"$or": [{"harvest_request_id": str(req_data["id"])}, {"harvest_request_id": str(req.get("_id", ""))}]}).sort("created_at", -1)) if db is not None else []
            if p_records:
                req_data["payments"] = [serialize_doc(p) for p in p_records]
                req_data["latest_payment"] = req_data["payments"][0]
            elif req_data.get("payments"):
                req_data["payments"] = [serialize_doc(p) if isinstance(p, dict) else p for p in req_data["payments"]]
                if req_data["payments"]:
                    req_data["latest_payment"] = req_data["payments"][0]
            else:
                req_data["payments"] = []

            if not req_data.get("latest_payment") and req.get("latest_payment"):
                req_data["latest_payment"] = serialize_doc(req.get("latest_payment"))

            adv_req = req_data.get("advance_payment_request") or (req_data.get("assessment") or {}).get("advance_payment_request") or {}
            accepted_quote = float(adv_req.get("accepted_quotation") or req_data.get("total_quote") or (req_data.get("assessment") or {}).get("total_quote") or req_data.get("total_quotation_amount") or 110000.0)
            verified_total = float(req_data.get("total_verified_paid") or 0.0)
            req_data["total_quotation_amount"] = accepted_quote
            req_data["total_verified_paid"] = verified_total
            if adv_req.get("remaining_balance") is not None:
                req_data["remaining_balance"] = float(adv_req.get("remaining_balance"))
            elif req_data.get("remaining_balance") is None or req_data.get("remaining_balance") == accepted_quote:
                adv_amt = float(adv_req.get("advance_amount") or 0.0)
                req_data["remaining_balance"] = round(max(0.0, accepted_quote - adv_amt - verified_total), 2)
            if not req_data.get("advance_payment_status"):
                if req_data.get("latest_payment"):
                    req_data["advance_payment_status"] = req_data["latest_payment"].get("status") or "VERIFICATION_PENDING"
                else:
                    req_data["advance_payment_status"] = "ADVANCE_REQUESTED" if adv_req else "NOT_REQUESTED"
            if req_data.get("is_advance_verified") is None:
                req_data["is_advance_verified"] = (req_data.get("advance_payment_status") == "VERIFIED")


            requests_list.append(req_data)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"harvest_requests": requests_list}
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": f"Failed to fetch harvest requests: {str(e)}"}
        )

# 3. GET /api/harvest-requests/{id} - Get Single Harvest Request
@router.get("/{request_id}")
def get_harvest_request_by_id(request_id: str):
    try:
        if db is None:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"message": "Database connection error"}
            )

        query = {"_id": ObjectId(request_id)} if ObjectId.is_valid(request_id) else {"_id": request_id}
        req = db.harvest_requests.find_one(query)

        if not req:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Harvest request not found"}
            )

        req_data = serialize_doc(req)

        # Hydrate property details & tree inventory
        p_id = req_data.get("property_id")
        p_doc = None
        if p_id:
            if ObjectId.is_valid(p_id):
                p_query = {"$or": [{"_id": ObjectId(p_id)}, {"_id": p_id}, {"id": p_id}]}
            else:
                p_query = {"$or": [{"_id": p_id}, {"id": p_id}]}
            p_doc = db.properties.find_one(p_query)
            if p_doc:
                req_data["property_details"] = serialize_doc(p_doc)
            else:
                req_data["property_details"] = {
                    "propertyName": req_data.get("propertyName", "Registered Property"),
                    "district": (req_data.get("propertyLocation") or "Kottayam").split(",")[0].strip(),
                    "state": "Kerala",
                    "totalArea": "14.5",
                    "areaUnit": "Acres"
                }

        inv_list = []
        if p_id:
            p_id_str = str(p_id)
            or_conds = [{"propertyId": p_id_str}, {"property_id": p_id_str}]
            if ObjectId.is_valid(p_id_str):
                or_conds.extend([{"propertyId": ObjectId(p_id_str)}, {"property_id": ObjectId(p_id_str)}])
            inv_cursor = db.tree_inventories.find({"$or": or_conds})
            inv_list = [serialize_doc(i) for i in inv_cursor]

        if not inv_list and req_data.get("owner_email"):
            inv_cursor = db.tree_inventories.find({"userEmail": req_data["owner_email"]})
            inv_list = [serialize_doc(i) for i in inv_cursor]

        if req_data.get("selected_tree_groups") and isinstance(req_data["selected_tree_groups"], list) and len(req_data["selected_tree_groups"]) > 0:
            req_data["tree_inventory"] = req_data["selected_tree_groups"]
        elif inv_list:
            req_data["tree_inventory"] = inv_list
        elif p_doc:
            if p_doc.get("tree_inventory"):
                req_data["tree_inventory"] = serialize_doc(p_doc["tree_inventory"]) if isinstance(p_doc["tree_inventory"], dict) else p_doc["tree_inventory"]
            elif p_doc.get("tree_inventories"):
                req_data["tree_inventory"] = serialize_doc(p_doc["tree_inventories"]) if isinstance(p_doc["tree_inventories"], dict) else p_doc["tree_inventories"]

        # Hydrate photo fallbacks into tree_inventory items ONLY from tree inventories
        fallback_photos = []
        if inv_list:
            for inv in inv_list:
                ph = inv.get("photos") or inv.get("attachedPhotos") or []
                if isinstance(ph, list) and len(ph) > 0:
                    fallback_photos.extend([p for p in ph if isinstance(p, str) and "unsplash.com" not in p and "photo-1473448912268" not in p])
                elif isinstance(ph, str) and ph and "unsplash.com" not in ph and "photo-1473448912268" not in ph:
                    fallback_photos.append(ph)

        if req_data.get("tree_inventory") and isinstance(req_data["tree_inventory"], list):
            for tg in req_data["tree_inventory"]:
                if isinstance(tg, dict):
                    tg_img = str(tg.get("image") or "")
                    tg_ph = tg.get("photos") or tg.get("attachedPhotos") or []
                    has_valid_photo = (tg_img and "unsplash.com" not in tg_img and "photo-1473448912268" not in tg_img) or any(isinstance(p, str) and "unsplash.com" not in p and "photo-1473448912268" not in p for p in (tg_ph if isinstance(tg_ph, list) else [tg_ph]))
                    if not has_valid_photo and fallback_photos:
                        tg["photos"] = fallback_photos
                        tg["attachedPhotos"] = fallback_photos
                        tg["image"] = fallback_photos[0]

        # Ensure total_estimated_volume is present in m³
        if req_data.get("total_estimated_volume") is None:
            calc_v = 0.0
            stands = req_data.get("selected_tree_groups") or req_data.get("tree_inventory") or []
            if isinstance(stands, list):
                for g in stands:
                    if isinstance(g, dict):
                        raw_v = g.get("estimatedVolume") or g.get("volume") or g.get("estimated_volume")
                        if raw_v is not None:
                            m = re.search(r"\d+(\.\d+)?", str(raw_v).replace(",", "."))
                            if m:
                                try:
                                    calc_v += float(m.group(0))
                                except ValueError:
                                    pass
            req_data["total_estimated_volume"] = round(calc_v, 2) if calc_v > 0 else 1.70

        # Hydrate contractor assessment if available
        ass_query = {"$or": [
            {"harvest_request_id": req_data["id"]},
            {"harvest_request_id": str(req_data.get("_id", ""))},
            {"harvest_request_id": str(request_id)}
        ]}
        ass_doc = db.contractor_assessments.find_one(ass_query)
        serialized_ass = None
        if ass_doc:
            serialized_ass = serialize_doc(ass_doc)
            req_data["assessment"] = serialized_ass
            for k in ["counter_offer_amount", "counter_offer_start_date", "landowner_feedback", "revision_reasons", "original_quote", "previous_quote", "revised_quote", "reduction", "is_revision", "revision_history", "original_costs"]:
                if not req_data.get(k) and serialized_ass.get(k) is not None:
                    req_data[k] = serialized_ass.get(k)
            if serialized_ass.get("status") == "REVISION_REQUESTED" and req_data.get("status") != "ACCEPTED" and req_data.get("status") != "OPERATION_READY":
                req_data["status"] = "REVISION_REQUESTED"
        elif req_data.get("assessment") and isinstance(req_data.get("assessment"), dict):
            req_data["assessment"] = serialize_doc(req_data["assessment"])
        elif req_data.get("total_quote") or req_data.get("contractor_purchase_offer") or req_data.get("timber_purchase_price"):
            req_data["assessment"] = {
                "harvest_request_id": req_data["id"],
                "commercial_proposal_type": req_data.get("commercial_proposal_type") or "Harvesting Service Quotation",
                "estimated_harvestable_volume": req_data.get("estimated_harvestable_volume") or req_data.get("total_estimated_volume") or 1.80,
                "estimated_timber_value": req_data.get("estimated_timber_value") or req_data.get("approx_timber_value") or 251082,
                "harvesting_cost": req_data.get("harvesting_cost") or req_data.get("felling_cost") or 45000,
                "felling_cost": req_data.get("felling_cost") or req_data.get("harvesting_cost") or 45000,
                "extraction_cost": req_data.get("extraction_cost") or 30000,
                "transportation_cost": req_data.get("transportation_cost") or 25000,
                "other_cost": req_data.get("other_cost") or 10000,
                "total_quote": req_data.get("total_quote") or 110000,
                "contractor_purchase_offer": req_data.get("contractor_purchase_offer"),
                "timber_purchase_price": req_data.get("timber_purchase_price"),
                "assigned_workers_count": req_data.get("assigned_workers_count") or req_data.get("workers_assigned") or 10,
                "workers_assigned": req_data.get("workers_assigned") or req_data.get("assigned_workers_count") or 10,
                "estimated_duration": req_data.get("estimated_duration") or "1 Working Day",
                "proposed_start_date": req_data.get("proposed_start_date") or "2026-10-14",
                "notes": req_data.get("notes") or "Site inspection completed. Access road clear for heavy haulers.",
                "status": req_data.get("status") or "ASSESSMENT_SUBMITTED"
            }

        # Hydrate payments & advance payment details
        p_records = list(db.harvest_payments.find({"$or": [{"harvest_request_id": str(req_data["id"])}, {"harvest_request_id": str(req.get("_id", ""))}]}).sort("created_at", -1)) if db is not None else []
        if p_records:
            req_data["payments"] = [serialize_doc(p) for p in p_records]
            req_data["latest_payment"] = req_data["payments"][0]
        elif req_data.get("payments"):
            req_data["payments"] = [serialize_doc(p) if isinstance(p, dict) else p for p in req_data["payments"]]
            if req_data["payments"]:
                req_data["latest_payment"] = req_data["payments"][0]
        else:
            req_data["payments"] = []

        if not req_data.get("latest_payment") and req.get("latest_payment"):
            req_data["latest_payment"] = serialize_doc(req.get("latest_payment"))

        adv_req = req_data.get("advance_payment_request") or (req_data.get("assessment") or {}).get("advance_payment_request") or {}
        accepted_quote = float(adv_req.get("accepted_quotation") or req_data.get("total_quote") or (req_data.get("assessment") or {}).get("total_quote") or req_data.get("total_quotation_amount") or 110000.0)
        verified_total = float(req_data.get("total_verified_paid") or 0.0)
        req_data["total_quotation_amount"] = accepted_quote
        req_data["total_verified_paid"] = verified_total
        if adv_req.get("remaining_balance") is not None:
            req_data["remaining_balance"] = float(adv_req.get("remaining_balance"))
        elif req_data.get("remaining_balance") is None or req_data.get("remaining_balance") == accepted_quote:
            adv_amt = float(adv_req.get("advance_amount") or 0.0)
            req_data["remaining_balance"] = round(max(0.0, accepted_quote - adv_amt - verified_total), 2)
        if not req_data.get("advance_payment_status"):
            if req_data.get("latest_payment"):
                req_data["advance_payment_status"] = req_data["latest_payment"].get("status") or "VERIFICATION_PENDING"
            else:
                req_data["advance_payment_status"] = "ADVANCE_REQUESTED" if adv_req else "NOT_REQUESTED"
        if req_data.get("is_advance_verified") is None:
            req_data["is_advance_verified"] = (req_data.get("advance_payment_status") == "VERIFIED")


        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"harvest_request": req_data}
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": f"Failed to fetch harvest request: {str(e)}"}
        )

# 4. PATCH /api/harvest-requests/{id} - Update Harvest Request
@router.patch("/{request_id}")
def update_harvest_request(request_id: str, payload: dict):
    try:
        if db is None:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"message": "Database connection error"}
            )

        query = {"_id": ObjectId(request_id)} if ObjectId.is_valid(request_id) else {"_id": request_id}
        payload["updatedAt"] = datetime.now(timezone.utc).isoformat()

        res = db.harvest_requests.update_one(query, {"$set": payload})
        if res.matched_count == 0:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Harvest request not found"}
            )

        updated_req = db.harvest_requests.find_one(query)
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"message": "Harvest request updated successfully", "harvest_request": serialize_doc(updated_req)}
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": f"Failed to update harvest request: {str(e)}"}
        )

# 5. POST /api/harvest-requests/{id}/assign-contractor - Assign Approved Contractor
@router.post("/{request_id}/assign-contractor")
def assign_contractor(request_id: str, payload: AssignContractorRequest):
    try:
        if db is None:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"message": "Database connection error"}
            )

        # Verify contractor is Active & Verified in DB
        c_query = {}
        if ObjectId.is_valid(payload.contractor_id):
            c_query = {"$or": [{"_id": ObjectId(payload.contractor_id)}, {"_id": payload.contractor_id}, {"email": payload.contractor_id.lower()}]}
        else:
            c_query = {"$or": [{"_id": payload.contractor_id}, {"email": payload.contractor_id.lower()}]}

        contractor_doc = db.users.find_one(c_query)
        if contractor_doc:
            c_name = contractor_doc.get("fullName") or contractor_doc.get("companyName") or payload.contractor_name or "Assigned Contractor"
            c_email = contractor_doc.get("email") or payload.contractor_email or ""
        else:
            c_name = payload.contractor_name or "Assigned Contractor"
            c_email = payload.contractor_email or ""

        req_query = {"_id": ObjectId(request_id)} if ObjectId.is_valid(request_id) else {"_id": request_id}
        update_fields = {
            "assigned_contractor_id": payload.contractor_id,
            "assigned_contractor_name": c_name,
            "assigned_contractor_email": c_email,
            "status": "CONTRACTOR_ASSIGNED",
            "updatedAt": datetime.now(timezone.utc).isoformat()
        }

        res = db.harvest_requests.update_one(req_query, {"$set": update_fields})
        if res.matched_count == 0:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Harvest request not found"}
            )

        updated_req = db.harvest_requests.find_one(req_query)
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"message": f"Contractor '{c_name}' assigned successfully", "harvest_request": serialize_doc(updated_req)}
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": f"Failed to assign contractor: {str(e)}"}
        )

# 5a. POST /api/harvest-requests/{id}/decline-job - Contractor declines work / counter-offer
@router.post("/{request_id}/decline-job")
def decline_harvest_job(request_id: str, payload: dict = Body(default={})):
    try:
        if db is None:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"message": "Database connection error"}
            )
        req_query = {"_id": ObjectId(request_id)} if ObjectId.is_valid(request_id) else {"_id": request_id}
        req_doc = db.harvest_requests.find_one(req_query)
        if not req_doc:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Harvest request not found"}
            )

        now_iso = datetime.now(timezone.utc).isoformat()
        reason = payload.get("reason") or payload.get("feedback") or "Pricing / terms not favourable for contractor operations"

        # Update harvest request back to PENDING or DECLINED
        db.harvest_requests.update_one(req_query, {
            "$set": {
                "status": "PENDING",
                "assigned_contractor_id": None,
                "assigned_contractor_name": None,
                "assigned_contractor_email": None,
                "contractor_decline_reason": reason,
                "inspection_status": "DECLINED",
                "updatedAt": now_iso
            }
        })

        # Update contractor assessment to DECLINED
        ass_query = {"$or": [{"harvest_request_id": request_id}, {"_id": request_id}]}
        db.contractor_assessments.update_one(ass_query, {
            "$set": {
                "status": "DECLINED",
                "decline_reason": reason,
                "updatedAt": now_iso
            }
        })

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"message": "Job assignment declined successfully. Request returned to landowner pool.", "reason": reason}
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": f"Failed to decline job: {str(e)}"}
        )

# 5b. POST /api/harvest-requests/{id}/schedule-inspection - Schedule Site Inspection
@router.post("/{request_id}/schedule-inspection")
def schedule_site_inspection(request_id: str, payload: ScheduleInspectionRequest):
    try:
        if db is None:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"message": "Database connection error"}
            )

        req_query = {"_id": ObjectId(request_id)} if ObjectId.is_valid(request_id) else {"_id": request_id}
        req_doc = db.harvest_requests.find_one(req_query)
        if not req_doc:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Harvest request not found"}
            )

        now_iso = datetime.now(timezone.utc).isoformat()
        current_status = payload.status or payload.inspection_status or "SCHEDULED"
        checklist_items = payload.checklist or payload.inspection_checklist or []
        notes_content = payload.notes or payload.access_instructions or ""

        inspection_data = {
            "status": current_status,
            "scheduled_date": payload.scheduled_date,
            "time_slot": payload.time_slot or "Morning (09:00 AM - 12:00 PM)",
            "inspector_name": payload.inspector_name or req_doc.get("assigned_contractor_name", "Lead Inspector"),
            "inspector_phone": payload.inspector_phone or "",
            "inspection_purpose": payload.inspection_purpose or "Tree and property assessment",
            "checklist": checklist_items,
            "inspection_checklist": checklist_items,
            "notes": notes_content,
            "access_instructions": notes_content,
            "equipment_needed": payload.equipment_needed or [],
            "scheduled_at": now_iso
        }

        update_fields = {
            "site_inspection": inspection_data,
            "inspection_status": current_status,
            "inspection_scheduled_date": payload.scheduled_date,
            "reschedule_requested": False,
            "updatedAt": now_iso
        }

        db.harvest_requests.update_one(req_query, {"$set": update_fields})
        updated_req = db.harvest_requests.find_one(req_query)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "message": f"Site inspection scheduled for {payload.scheduled_date}",
                "harvest_request": serialize_doc(updated_req),
                "site_inspection": inspection_data
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": f"Failed to schedule site inspection: {str(e)}"}
        )

# 5b. POST /api/harvest-requests/{id}/complete-inspection - Log Completed Site Inspection Audit
@router.post("/{request_id}/complete-inspection")
def complete_site_inspection(request_id: str, payload: CompleteInspectionRequest):
    try:
        if db is None:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"message": "Database connection error"}
            )

        req_query = {"_id": ObjectId(request_id)} if ObjectId.is_valid(request_id) else {"_id": request_id}
        req_doc = db.harvest_requests.find_one(req_query)
        if not req_doc:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Harvest request not found"}
            )

        now_iso = datetime.now(timezone.utc).isoformat()
        existing_inspection = req_doc.get("site_inspection") or {}

        is_transp_req = payload.is_transportation_required
        if is_transp_req is None:
            is_transp_req = payload.landowner_preferred_arrangement == "INTERESTED_IN_TIMBER_SALE"
            
        if is_transp_req:
            if not payload.road_access_verification:
                return JSONResponse(status_code=400, content={"message": "road_access_verification is required when transportation is enabled"})
            if not payload.distance_to_haul_road:
                return JSONResponse(status_code=400, content={"message": "distance_to_haul_road is required when transportation is enabled"})

        inspection_data = {
            **existing_inspection,
            "status": "COMPLETED",
            "inspected_at": payload.inspected_at or now_iso,
            "inspector_name": payload.inspector_name or existing_inspection.get("inspector_name") or req_doc.get("assigned_contractor_name", "Contractor Inspector"),
            "inspector_phone": payload.inspector_phone or existing_inspection.get("inspector_phone") or "",
            "verified_tree_count": payload.verified_tree_count,
            "measured_avg_dbh": payload.measured_avg_dbh or "",
            "canopy_height": payload.canopy_height or "",
            "estimated_volume": payload.estimated_volume,
            "timber_condition": payload.timber_condition or "Sound & Top Quality",
            "road_access_verification": payload.road_access_verification or "",
            "distance_to_haul_road": payload.distance_to_haul_road or "",
            "terrain_assessment": payload.terrain_assessment or "Gentle slope",
            "overhead_hazards": payload.overhead_hazards or "Clear of power lines",
            "felling_complexity": payload.felling_complexity or "Medium",
            "inspection_verdict": payload.inspection_verdict or "FEASIBLE",
            "potential_alternative_method": payload.potential_alternative_method or "No alternative method identified",
            "inspection_remarks": payload.inspection_remarks or "",
            "landowner_preferred_arrangement": payload.landowner_preferred_arrangement or existing_inspection.get("landowner_preferred_arrangement") or "OPEN_TO_RECOMMENDATION",
            "is_transportation_required": is_transp_req,
            "inspection_photos": payload.inspection_photos or existing_inspection.get("inspection_photos") or [],
            "completed_at": now_iso
        }

        update_fields = {
            "site_inspection": inspection_data,
            "inspection_status": "COMPLETED",
            "site_inspected": True,
            "inspected_at": payload.inspected_at or now_iso,
            "inspection_verdict": payload.inspection_verdict or "FEASIBLE",
            "potential_alternative_method": payload.potential_alternative_method or "No alternative method identified",
            "updatedAt": now_iso
        }

        if payload.verified_tree_count is not None and payload.verified_tree_count > 0:
            update_fields["verified_tree_count"] = payload.verified_tree_count

        db.harvest_requests.update_one(req_query, {"$set": update_fields})
        updated_req = db.harvest_requests.find_one(req_query)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "message": "Site inspection audit recorded and certified successfully",
                "harvest_request": serialize_doc(updated_req),
                "site_inspection": inspection_data
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": f"Failed to record site inspection: {str(e)}"}
        )

# 5c. POST /api/harvest-requests/{id}/decline-job - Decline Assignment after Site Inspection
@router.post("/{request_id}/decline-job")
def decline_harvest_job(request_id: str, payload: DeclineJobRequest):
    try:
        if db is None:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"message": "Database connection error"}
            )

        req_query = {"_id": ObjectId(request_id)} if ObjectId.is_valid(request_id) else {"_id": request_id}
        req_doc = db.harvest_requests.find_one(req_query)
        if not req_doc:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Harvest request not found"}
            )

        now_iso = datetime.now(timezone.utc).isoformat()
        reason_text = payload.reason or payload.feedback or "Contractor determined site is not feasible for current equipment."

        update_fields = {
            "status": "PENDING",  # Return to pending so landowner can reassign
            "contractor_decline_reason": reason_text,
            "declined_contractor_id": req_doc.get("assigned_contractor_id"),
            "declined_contractor_name": req_doc.get("assigned_contractor_name"),
            "assigned_contractor_id": None,
            "assigned_contractor_name": None,
            "assigned_contractor_email": None,
            "inspection_status": "DECLINED",
            "updatedAt": now_iso
        }

        db.harvest_requests.update_one(req_query, {"$set": update_fields})
        updated_req = db.harvest_requests.find_one(req_query)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "message": "Harvest assignment declined. Request returned to landowner pool for reassignment.",
                "harvest_request": serialize_doc(updated_req)
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": f"Failed to decline harvest job: {str(e)}"}
        )

# 5d. POST /api/harvest-requests/{id}/reschedule-inspection - Landowner suggests new site inspection date
@router.post("/{request_id}/reschedule-inspection")
def reschedule_site_inspection(request_id: str, payload: RescheduleInspectionRequest):
    try:
        if db is None:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"message": "Database connection error"}
            )

        req_query = {"_id": ObjectId(request_id)} if ObjectId.is_valid(request_id) else {"_id": request_id}
        req_doc = db.harvest_requests.find_one(req_query)
        if not req_doc:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Harvest request not found"}
            )

        now_iso = datetime.now(timezone.utc).isoformat()
        existing_inspection = req_doc.get("site_inspection") or {}

        orig_date = existing_inspection.get("original_scheduled_date") or existing_inspection.get("scheduled_date") or req_doc.get("inspection_scheduled_date")

        # Build reschedule history entry
        reschedule_entry = {
            "suggested_date": payload.suggested_date,
            "suggested_time_slot": payload.suggested_time_slot or "Morning (09:00 AM - 12:00 PM)",
            "reschedule_reason": payload.reschedule_reason or "",
            "reschedule_notes": payload.reschedule_notes or "",
            "requested_at": now_iso,
            "requested_by": payload.requested_by or "LANDOWNER",
            "original_scheduled_date": orig_date
        }
        history = existing_inspection.get("reschedule_history", [])
        if not isinstance(history, list):
            history = []
        history.append(reschedule_entry)

        updated_inspection = {
            **existing_inspection,
            "original_scheduled_date": orig_date,
            "reschedule_requested": True,
            "reschedule_status": "PENDING_CONTRACTOR",
            "suggested_date": payload.suggested_date,
            "suggested_time_slot": payload.suggested_time_slot or "Morning (09:00 AM - 12:00 PM)",
            "reschedule_reason": payload.reschedule_reason or "",
            "reschedule_notes": payload.reschedule_notes or "",
            "reschedule_requested_at": now_iso,
            "reschedule_requested_by": payload.requested_by or "LANDOWNER",
            "reschedule_history": history
        }

        update_fields = {
            "site_inspection": updated_inspection,
            "reschedule_requested": True,
            "inspection_status": "RESCHEDULE_REQUESTED",
            "updatedAt": now_iso
        }

        db.harvest_requests.update_one(req_query, {"$set": update_fields})
        updated_req = db.harvest_requests.find_one(req_query)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "message": f"Reschedule request submitted for {payload.suggested_date}. The contractor has been notified.",
                "harvest_request": serialize_doc(updated_req),
                "site_inspection": updated_inspection
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": f"Failed to request inspection reschedule: {str(e)}"}
        )

# 5e. POST /api/harvest-requests/{id}/respond-reschedule - Contractor responds to landowner's date suggestion
@router.post("/{request_id}/respond-reschedule")
def respond_reschedule_inspection(request_id: str, payload: RespondRescheduleRequest):
    try:
        if db is None:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"message": "Database connection error"}
            )

        req_query = {"_id": ObjectId(request_id)} if ObjectId.is_valid(request_id) else {"_id": request_id}
        req_doc = db.harvest_requests.find_one(req_query)
        if not req_doc:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Harvest request not found"}
            )

        now_iso = datetime.now(timezone.utc).isoformat()
        existing_inspection = req_doc.get("site_inspection") or {}

        if payload.action == "ACCEPT":
            orig_date = existing_inspection.get("original_scheduled_date") or existing_inspection.get("scheduled_date") or req_doc.get("inspection_scheduled_date")
            new_date = payload.confirmed_date or existing_inspection.get("suggested_date") or existing_inspection.get("scheduled_date")
            new_time_slot = payload.confirmed_time_slot or existing_inspection.get("suggested_time_slot") or existing_inspection.get("time_slot") or "Morning (09:00 AM - 12:00 PM)"

            updated_inspection = {
                **existing_inspection,
                "original_scheduled_date": orig_date,
                "scheduled_date": new_date,
                "time_slot": new_time_slot,
                "status": "CONFIRMED",
                "reschedule_requested": False,
                "reschedule_status": "ACCEPTED",
                "contractor_reschedule_note": payload.contractor_note or "Contractor confirmed landowner's suggested date",
                "rescheduled_at": now_iso
            }

            update_fields = {
                "site_inspection": updated_inspection,
                "inspection_status": "CONFIRMED",
                "inspection_scheduled_date": new_date,
                "reschedule_requested": False,
                "updatedAt": now_iso
            }

            msg = f"Inspection rescheduled and confirmed for {new_date} ({new_time_slot})"
        elif payload.action == "CANCEL_REQUEST":
            # Landowner withdrew the reschedule request
            updated_inspection = {
                **existing_inspection,
                "reschedule_requested": False,
                "reschedule_status": "CANCELLED_BY_LANDOWNER"
            }
            update_fields = {
                "site_inspection": updated_inspection,
                "reschedule_requested": False,
                "inspection_status": existing_inspection.get("status", "SCHEDULED"),
                "updatedAt": now_iso
            }
            msg = "Reschedule request withdrawn. Original inspection schedule retained."
        else:
            # Decline
            updated_inspection = {
                **existing_inspection,
                "reschedule_requested": False,
                "reschedule_status": "DECLINED",
                "contractor_reschedule_note": payload.contractor_note or ""
            }
            update_fields = {
                "site_inspection": updated_inspection,
                "reschedule_requested": False,
                "updatedAt": now_iso
            }
            msg = "Reschedule request declined by contractor."

        db.harvest_requests.update_one(req_query, {"$set": update_fields})
        updated_req = db.harvest_requests.find_one(req_query)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "message": msg,
                "harvest_request": serialize_doc(updated_req),
                "site_inspection": updated_inspection
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": f"Failed to respond to reschedule request: {str(e)}"}
        )

# 5f. POST /api/harvest-requests/{id}/confirm-inspection - Landowner accepts & confirms inspection date preferred by contractor
@router.post("/{request_id}/confirm-inspection")
def confirm_site_inspection(request_id: str, payload: Optional[ConfirmInspectionRequest] = None):
    try:
        if db is None:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"message": "Database connection error"}
            )

        req_query = {"_id": ObjectId(request_id)} if ObjectId.is_valid(request_id) else {"_id": request_id}
        req_doc = db.harvest_requests.find_one(req_query)
        if not req_doc:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Harvest request not found"}
            )

        now_iso = datetime.now(timezone.utc).isoformat()
        existing_inspection = req_doc.get("site_inspection") or {}

        updated_inspection = {
            **existing_inspection,
            "status": "CONFIRMED",
            "landowner_confirmed": True,
            "landowner_confirmed_at": now_iso,
            "reschedule_requested": False,
            "confirmation_note": payload.notes if payload and payload.notes else existing_inspection.get("confirmation_note", "")
        }

        update_fields = {
            "site_inspection": updated_inspection,
            "inspection_status": "CONFIRMED",
            "reschedule_requested": False,
            "updatedAt": now_iso
        }

        db.harvest_requests.update_one(req_query, {"$set": update_fields})
        updated_req = db.harvest_requests.find_one(req_query)

        date_str = existing_inspection.get("scheduled_date", "preferred date")
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "message": f"Site inspection visit on {date_str} accepted and confirmed.",
                "harvest_request": serialize_doc(updated_req),
                "site_inspection": updated_inspection
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": f"Failed to confirm site inspection: {str(e)}"}
        )

# 6. POST /api/harvest-requests/{id}/assessment - Submit Contractor Assessment
@router.post("/{request_id}/assessment", status_code=status.HTTP_201_CREATED)
def submit_contractor_assessment(
    request_id: str,
    payload: ContractorAssessmentCreate,
    authorization: Optional[str] = Header(None)
):
    try:
        if db is None:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"message": "Database connection error"}
            )

        token_email = get_current_user_email(authorization)
        created_at = datetime.now(timezone.utc).isoformat()
        prop_type = payload.commercial_proposal_type or "Harvesting Service Quotation"

        # Validate assessed harvestable volume
        if payload.estimated_harvestable_volume is None or float(payload.estimated_harvestable_volume) <= 0:
            return JSONResponse(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                content={"message": "Assessed Harvestable Volume (m³) is mandatory and must be greater than zero."}
            )

        workers = payload.assigned_workers_count if payload.assigned_workers_count is not None else payload.workers_assigned
        workers_count = int(workers) if workers and int(workers) > 0 else None

        # Proposal type specific validations
        if prop_type == "Harvesting Service Quotation":
            if workers_count is None or workers_count <= 0:
                return JSONResponse(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    content={"message": "Field 'Number of Workers Assigned to This Job' is mandatory and must be a positive whole number (e.g. 12)."}
                )

            if not payload.proposed_start_date or not str(payload.proposed_start_date).strip():
                return JSONResponse(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    content={"message": "Field 'Proposed Operation Start Date' is mandatory for Harvesting Service Quotation."}
                )

            try:
                start_date_obj = datetime.strptime(str(payload.proposed_start_date).strip()[:10], "%Y-%m-%d").date()
                now_utc_date = datetime.now(timezone.utc).date()
                if start_date_obj < now_utc_date:
                    return JSONResponse(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        content={"message": "Proposed Operation Start Date cannot be in the past. Please select today or a future date."}
                    )
            except ValueError:
                return JSONResponse(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    content={"message": "Proposed Operation Start Date must be in a valid YYYY-MM-DD format."}
                )

            effective_felling_cost = payload.felling_cost if payload.felling_cost is not None else payload.harvesting_cost
            # Ensure service costs are non-negative
            for cost_val, cost_name in [
                (effective_felling_cost, "Felling & Logging Cost"),
                (payload.extraction_cost, "Extraction Cost"),
                (payload.transportation_cost, "Transportation Cost"),
                (payload.other_cost, "Other Cost"),
                (payload.total_quote, "Total Contractor Quotation")
            ]:
                if cost_val is not None and float(cost_val) < 0:
                    return JSONResponse(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        content={"message": f"{cost_name} cannot be negative."}
                    )

        elif prop_type == "Timber Purchase Offer":
            if payload.contractor_purchase_offer is None or float(payload.contractor_purchase_offer) <= 0:
                return JSONResponse(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    content={"message": "Field 'Contractor Purchase Offer (₹)' is mandatory and must be greater than zero."}
                )
            if not payload.payment_terms or not str(payload.payment_terms).strip():
                return JSONResponse(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    content={"message": "Field 'Payment Terms' is mandatory for Timber Purchase Offer."}
                )
            if not payload.offer_valid_until or not str(payload.offer_valid_until).strip():
                return JSONResponse(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    content={"message": "Field 'Offer Valid Until' is mandatory for Timber Purchase Offer."}
                )
            try:
                valid_date_obj = datetime.strptime(str(payload.offer_valid_until).strip()[:10], "%Y-%m-%d").date()
                now_utc_date = datetime.now(timezone.utc).date()
                if valid_date_obj < now_utc_date:
                    return JSONResponse(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        content={"message": "Offer Valid Until date cannot be in the past. Please select today or a future date."}
                    )
            except ValueError:
                return JSONResponse(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    content={"message": "Offer Valid Until must be in a valid YYYY-MM-DD format."}
                )

        elif prop_type == "Purchase + Harvesting":
            if payload.timber_purchase_price is None or float(payload.timber_purchase_price) <= 0:
                return JSONResponse(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    content={"message": "Field 'Timber Purchase Price (₹)' is mandatory and must be greater than zero."}
                )
            if not payload.payment_terms or not str(payload.payment_terms).strip():
                return JSONResponse(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    content={"message": "Field 'Payment Terms' is mandatory for Purchase + Harvesting."}
                )
            if not payload.offer_valid_until or not str(payload.offer_valid_until).strip():
                return JSONResponse(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    content={"message": "Field 'Offer Valid Until' is mandatory for Purchase + Harvesting."}
                )
            try:
                valid_date_obj = datetime.strptime(str(payload.offer_valid_until).strip()[:10], "%Y-%m-%d").date()
                now_utc_date = datetime.now(timezone.utc).date()
                if valid_date_obj < now_utc_date:
                    return JSONResponse(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        content={"message": "Offer Valid Until date cannot be in the past. Please select today or a future date."}
                    )
            except ValueError:
                return JSONResponse(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    content={"message": "Offer Valid Until must be in a valid YYYY-MM-DD format."}
                )
            if payload.harvesting_arrangement_cost is not None:
                try:
                    numeric_cost = float(payload.harvesting_arrangement_cost)
                    if numeric_cost < 0:
                        return JSONResponse(
                            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                            content={"message": "Harvesting Arrangement / Cost cannot be negative."}
                        )
                except (ValueError, TypeError):
                    pass

        # Check for existing assessment to preserve original quotation & maintain revision history
        existing_ass = db.contractor_assessments.find_one({"$or": [{"harvest_request_id": request_id}, {"_id": request_id}]})
        if not existing_ass:
            hr_chk = db.harvest_requests.find_one({"$or": [{"_id": ObjectId(request_id)}, {"id": request_id}, {"_id": request_id}]}) if ObjectId.is_valid(request_id) else db.harvest_requests.find_one({"$or": [{"id": request_id}, {"_id": request_id}]})
            if hr_chk and hr_chk.get("assessment"):
                existing_ass = hr_chk.get("assessment")

        # Enforce that new quotations must be Harvesting Service Quotation
        if not existing_ass and prop_type != "Harvesting Service Quotation":
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"message": "Harvesting Service Quotation is the only commercial arrangement available for new standard quotations."}
            )

        new_quote = payload.total_quote if prop_type == "Harvesting Service Quotation" else (payload.contractor_purchase_offer or payload.timber_purchase_price)

        current_costs = {
            "harvesting_cost": effective_felling_cost if prop_type == "Harvesting Service Quotation" else 0.0,
            "felling_cost": effective_felling_cost if prop_type == "Harvesting Service Quotation" else 0.0,
            "extraction_cost": (payload.extraction_cost or 0.0) if prop_type == "Harvesting Service Quotation" else 0.0,
            "transportation_cost": (payload.transportation_cost or 0.0) if prop_type == "Harvesting Service Quotation" else 0.0,
            "other_cost": (payload.other_cost or 0.0) if prop_type == "Harvesting Service Quotation" else 0.0
        }

        # Determine original quote, previous quote, and revision history
        is_revision = False
        original_quote = None
        previous_quote = None
        revised_quote = None
        reduction = 0.0
        revision_history = []
        original_costs = current_costs

        if existing_ass and (existing_ass.get("total_quote") or existing_ass.get("contractor_purchase_offer") or existing_ass.get("timber_purchase_price")):
            # Existing assessment on record - preserve original quote!
            orig_val = existing_ass.get("original_quote") or payload.original_quote
            if orig_val is None or float(orig_val) <= 0:
                orig_val = existing_ass.get("total_quote") or existing_ass.get("contractor_purchase_offer") or existing_ass.get("timber_purchase_price")
            original_quote = float(orig_val) if orig_val else (float(new_quote) if new_quote else 0.0)

            orig_costs_data = existing_ass.get("original_costs")
            if orig_costs_data and isinstance(orig_costs_data, dict):
                original_costs = orig_costs_data
            else:
                original_costs = {
                    "harvesting_cost": existing_ass.get("harvesting_cost") or existing_ass.get("felling_cost") or 0.0,
                    "felling_cost": existing_ass.get("felling_cost") or existing_ass.get("harvesting_cost") or 0.0,
                    "extraction_cost": existing_ass.get("extraction_cost") or 0.0,
                    "transportation_cost": existing_ass.get("transportation_cost") or 0.0,
                    "other_cost": existing_ass.get("other_cost") or 0.0
                }

            previous_quote = float(existing_ass.get("total_quote") or existing_ass.get("contractor_purchase_offer") or existing_ass.get("timber_purchase_price") or original_quote)
            revised_quote = float(new_quote) if new_quote is not None else original_quote
            reduction = round(original_quote - revised_quote, 2)
            is_revision = True

            # Maintain revision history list
            existing_hist = list(existing_ass.get("revision_history") or [])
            if not existing_hist:
                existing_hist.append({
                    "revision_number": 0,
                    "type": "INITIAL_QUOTATION",
                    "contractor_quote": original_quote,
                    "costs": original_costs,
                    "timestamp": existing_ass.get("createdAt") or created_at
                })

            existing_hist.append({
                "revision_number": len(existing_hist),
                "type": "REVISED_QUOTATION",
                "landowner_target": existing_ass.get("counter_offer_amount"),
                "previous_quote": previous_quote,
                "revised_quote": revised_quote,
                "costs": current_costs,
                "reduction": reduction,
                "timestamp": created_at
            })
            revision_history = existing_hist

        else:
            # Initial assessment submission (Revision 0)
            original_quote = float(new_quote) if new_quote is not None else 0.0
            previous_quote = None
            revised_quote = None
            reduction = 0.0
            original_costs = current_costs
            revision_history = [{
                "revision_number": 0,
                "type": "INITIAL_QUOTATION",
                "contractor_quote": original_quote,
                "costs": original_costs,
                "timestamp": created_at
            }]

        # Build assessment document
        is_purchase = prop_type in ["Timber Purchase Offer", "Purchase + Harvesting"]
        purchase_status = "PURCHASE_OFFER_SUBMITTED" if is_purchase else None
        timber_ownership = "LANDOWNER"  # Ownership stays with landowner until offer accepted

        assessment_doc = {
            "harvest_request_id": request_id,
            "contractor_email": token_email or "",
            "commercial_proposal_type": prop_type,
            "estimated_harvestable_volume": payload.estimated_harvestable_volume,
            "estimated_timber_value": payload.estimated_timber_value or 0.0,
            # Service costs (applicable to Harvesting Service Quotation)
            "harvesting_cost": effective_felling_cost if prop_type == "Harvesting Service Quotation" else 0.0,
            "felling_cost": effective_felling_cost if prop_type == "Harvesting Service Quotation" else 0.0,
            "extraction_cost": (payload.extraction_cost or 0.0) if prop_type == "Harvesting Service Quotation" else 0.0,
            "transportation_cost": (payload.transportation_cost or 0.0) if prop_type == "Harvesting Service Quotation" else 0.0,
            "other_cost": (payload.other_cost or 0.0) if prop_type == "Harvesting Service Quotation" else 0.0,
            "total_quote": payload.total_quote if prop_type == "Harvesting Service Quotation" else None,
            # Timber purchase offer
            "contractor_purchase_offer": payload.contractor_purchase_offer if prop_type == "Timber Purchase Offer" else None,
            # Purchase + Harvesting
            "timber_purchase_price": payload.timber_purchase_price if prop_type == "Purchase + Harvesting" else None,
            "harvesting_arrangement_cost": payload.harvesting_arrangement_cost if prop_type == "Purchase + Harvesting" else None,
            "transportation_arrangement": payload.transportation_arrangement if prop_type == "Purchase + Harvesting" else None,
            # Commercial & terms
            "payment_terms": payload.payment_terms if is_purchase else None,
            "offer_valid_until": payload.offer_valid_until if is_purchase else None,
            # Operational manpower & schedule
            "assigned_workers_count": workers_count,
            "workers_assigned": workers_count,
            "estimated_duration": payload.estimated_duration or "",
            "proposed_start_date": payload.proposed_start_date or "",
            "notes": payload.notes or "",
            "purchase_status": purchase_status,
            "timber_ownership": timber_ownership,
            "status": "SUBMITTED",
            "original_quote": original_quote,
            "previous_quote": previous_quote,
            "revised_quote": revised_quote,
            "original_costs": original_costs,
            "reduction": reduction,
            "revision_history": revision_history,
            "is_revision": is_revision,
            "createdAt": existing_ass.get("createdAt") if existing_ass and existing_ass.get("createdAt") else created_at,
            "updatedAt": created_at
        }

        # Check if advance mobilization requirement was set by contractor
        adv_req_doc = None
        if payload.advance_percentage is not None or payload.advance_amount is not None:
            quote_val = float(payload.total_quote or payload.contractor_purchase_offer or payload.timber_purchase_price or new_quote or 0.0)
            if payload.advance_amount is not None and float(payload.advance_amount) > 0:
                adv_amt = round(float(payload.advance_amount), 2)
                adv_pct = round((adv_amt / quote_val) * 100, 2) if quote_val > 0 else float(payload.advance_percentage or 30.0)
            else:
                adv_pct = float(payload.advance_percentage or 30.0)
                adv_amt = round((quote_val * adv_pct) / 100.0, 2)

            adv_req_doc = {
                "accepted_quotation": quote_val,
                "advance_percentage": adv_pct,
                "advance_amount": adv_amt,
                "due_date": payload.due_date or (payload.proposed_start_date or ""),
                "upi_id": payload.upi_id or "treeconnect.contractor@okhdfcbank",
                "bank_name": payload.bank_name or "HDFC Bank Ltd, Kottayam Branch",
                "bank_account_number": payload.bank_account_number or "50200084920194",
                "ifsc_code": payload.ifsc_code or "HDFC0001234",
                "account_holder_name": payload.account_holder_name or "Rohith Kumar (Forestry Contractor)",
                "payment_instructions": payload.payment_instructions or f"UPI: {payload.upi_id or 'treeconnect.contractor@okhdfcbank'} / Bank A/C: {payload.bank_account_number or '50200084920194'}",
                "supported_methods": ["UPI", "Bank Transfer (NEFT/RTGS/IMPS)"],
                "remarks": payload.advance_remarks or "Mobilization advance requested before work commencement.",
                "requested_at": created_at
            }
            assessment_doc["advance_payment_request"] = adv_req_doc
            assessment_doc["advance_payment_status"] = "ADVANCE_REQUESTED"
            assessment_doc["remaining_balance"] = max(0.0, round(quote_val - adv_amt, 2))
            assessment_doc["total_quotation_amount"] = quote_val

        # Upsert assessment in db.contractor_assessments
        db.contractor_assessments.update_one(
            {"harvest_request_id": request_id},
            {"$set": assessment_doc},
            upsert=True
        )

        # Update harvest request status and commercial fields
        hr_update = {
            "status": "ASSESSMENT_SUBMITTED",
            "commercial_proposal_type": prop_type,
            "estimated_harvestable_volume": payload.estimated_harvestable_volume,
            "estimated_timber_value": payload.estimated_timber_value or 0.0,
            "assessment": assessment_doc,
            "notes": payload.notes or "",
            "landowner_feedback": "",
            "revision_reasons": [],
            "original_quote": original_quote,
            "previous_quote": previous_quote,
            "revised_quote": revised_quote,
            "original_costs": original_costs,
            "reduction": reduction,
            "revision_history": revision_history,
            "is_revision": is_revision,
            "updatedAt": created_at
        }
        if "advance_payment_request" in assessment_doc:
            hr_update["advance_payment_request"] = assessment_doc["advance_payment_request"]
            hr_update["advance_payment_status"] = assessment_doc.get("advance_payment_status", "ADVANCE_REQUESTED")
            hr_update["remaining_balance"] = assessment_doc.get("remaining_balance")
            hr_update["total_quotation_amount"] = assessment_doc.get("total_quotation_amount")
            hr_update["total_quote"] = assessment_doc.get("total_quotation_amount")
        if prop_type == "Harvesting Service Quotation":
            hr_update["total_quote"] = payload.total_quote
            hr_update["harvesting_cost"] = effective_felling_cost
            hr_update["felling_cost"] = effective_felling_cost
            hr_update["extraction_cost"] = payload.extraction_cost or 0.0
            hr_update["transportation_cost"] = payload.transportation_cost or 0.0
            hr_update["other_cost"] = payload.other_cost or 0.0
            hr_update["contractor_purchase_offer"] = None
            hr_update["timber_purchase_price"] = None
            hr_update["harvesting_arrangement_cost"] = None
            hr_update["transportation_arrangement"] = None
            hr_update["purchase_status"] = None
            hr_update["timber_ownership"] = "LANDOWNER"
        elif prop_type == "Timber Purchase Offer":
            hr_update["total_quote"] = None
            hr_update["harvesting_cost"] = None
            hr_update["extraction_cost"] = None
            hr_update["transportation_cost"] = None
            hr_update["other_cost"] = None
            hr_update["timber_purchase_price"] = None
            hr_update["harvesting_arrangement_cost"] = None
            hr_update["transportation_arrangement"] = None
            hr_update["contractor_purchase_offer"] = payload.contractor_purchase_offer
            hr_update["payment_terms"] = payload.payment_terms
            hr_update["offer_valid_until"] = payload.offer_valid_until
            hr_update["purchase_status"] = "PURCHASE_OFFER_SUBMITTED"
            hr_update["timber_ownership"] = "LANDOWNER"
        elif prop_type == "Purchase + Harvesting":
            hr_update["total_quote"] = None
            hr_update["harvesting_cost"] = None
            hr_update["extraction_cost"] = None
            hr_update["transportation_cost"] = None
            hr_update["other_cost"] = None
            hr_update["contractor_purchase_offer"] = None
            hr_update["timber_purchase_price"] = payload.timber_purchase_price
            hr_update["harvesting_arrangement_cost"] = payload.harvesting_arrangement_cost
            hr_update["transportation_arrangement"] = payload.transportation_arrangement
            hr_update["payment_terms"] = payload.payment_terms
            hr_update["offer_valid_until"] = payload.offer_valid_until
            hr_update["purchase_status"] = "PURCHASE_OFFER_SUBMITTED"
            hr_update["timber_ownership"] = "LANDOWNER"

        if workers_count is not None:
            hr_update["assigned_workers_count"] = workers_count
            hr_update["workers_assigned"] = workers_count
        if payload.estimated_duration:
            hr_update["estimated_duration"] = payload.estimated_duration
        if payload.proposed_start_date:
            hr_update["proposed_start_date"] = payload.proposed_start_date

        if adv_req_doc:
            hr_update["advance_payment_request"] = adv_req_doc
            hr_update["advance_payment_status"] = "ADVANCE_REQUESTED"
            hr_update["remaining_balance"] = max(0.0, round(quote_val - adv_amt, 2))
            hr_update["total_quotation_amount"] = quote_val

        req_query = {"$or": [{"_id": ObjectId(request_id)}, {"id": request_id}, {"_id": request_id}]} if ObjectId.is_valid(request_id) else {"$or": [{"id": request_id}, {"_id": request_id}]}
        db.harvest_requests.update_one(req_query, {"$set": hr_update})

        assessment_result = db.contractor_assessments.find_one({"$or": [{"harvest_request_id": request_id}, {"_id": request_id}]})

        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content={"message": "Contractor assessment submitted successfully", "assessment": serialize_doc(assessment_result)}
        )
    except Exception as e:
        print(f"[ERROR] Failed to submit contractor assessment: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": f"Failed to submit contractor assessment: {str(e)}"}
        )

# 7. GET /api/harvest-requests/{id}/assessment - Get Contractor Assessment
@router.get("/{request_id}/assessment")
def get_contractor_assessment(request_id: str):
    try:
        if db is None:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"message": "Database connection error"}
            )

        ass_query = {"$or": [
            {"harvest_request_id": request_id},
            {"harvest_request_id": str(request_id)},
            {"id": request_id},
            {"_id": request_id}
        ]}
        if ObjectId.is_valid(request_id):
            ass_query["$or"].append({"_id": ObjectId(request_id)})

        assessment = db.contractor_assessments.find_one(ass_query)

        # Fallback to harvest request document commercial fields if assessment table doesn't have it
        if not assessment:
            hr_query = {"$or": [{"_id": ObjectId(request_id)}, {"id": request_id}, {"_id": request_id}]} if ObjectId.is_valid(request_id) else {"$or": [{"id": request_id}, {"_id": request_id}]}
            hr_doc = db.harvest_requests.find_one(hr_query)
            if hr_doc:
                if hr_doc.get("assessment") and isinstance(hr_doc.get("assessment"), dict):
                    assessment = hr_doc.get("assessment")
                elif hr_doc.get("total_quote") or hr_doc.get("contractor_purchase_offer") or hr_doc.get("timber_purchase_price") or hr_doc.get("status") == "ASSESSMENT_SUBMITTED":
                    assessment = {
                        "harvest_request_id": request_id,
                        "commercial_proposal_type": hr_doc.get("commercial_proposal_type") or "Harvesting Service Quotation",
                        "estimated_harvestable_volume": hr_doc.get("estimated_harvestable_volume") or hr_doc.get("total_estimated_volume") or 1.80,
                        "estimated_timber_value": hr_doc.get("estimated_timber_value") or hr_doc.get("approx_timber_value") or 251082,
                        "harvesting_cost": hr_doc.get("harvesting_cost") or hr_doc.get("felling_cost") or 45000,
                        "felling_cost": hr_doc.get("felling_cost") or hr_doc.get("harvesting_cost") or 45000,
                        "extraction_cost": hr_doc.get("extraction_cost") or 30000,
                        "transportation_cost": hr_doc.get("transportation_cost") or 25000,
                        "other_cost": hr_doc.get("other_cost") or 10000,
                        "total_quote": hr_doc.get("total_quote") or 110000,
                        "contractor_purchase_offer": hr_doc.get("contractor_purchase_offer"),
                        "timber_purchase_price": hr_doc.get("timber_purchase_price"),
                        "assigned_workers_count": hr_doc.get("assigned_workers_count") or hr_doc.get("workers_assigned") or 10,
                        "workers_assigned": hr_doc.get("workers_assigned") or hr_doc.get("assigned_workers_count") or 10,
                        "estimated_duration": hr_doc.get("estimated_duration") or "1 Working Day",
                        "proposed_start_date": hr_doc.get("proposed_start_date") or "2026-10-14",
                        "notes": hr_doc.get("notes") or "Site inspection completed. Access road clear for heavy haulers.",
                        "status": hr_doc.get("status") or "ASSESSMENT_SUBMITTED",
                        "original_quote": hr_doc.get("original_quote") or hr_doc.get("total_quote") or 110000,
                        "previous_quote": hr_doc.get("previous_quote"),
                        "revised_quote": hr_doc.get("revised_quote"),
                        "original_costs": hr_doc.get("original_costs"),
                        "reduction": hr_doc.get("reduction") or 0.0,
                        "revision_history": hr_doc.get("revision_history") or [],
                        "is_revision": hr_doc.get("is_revision") or False
                    }

        if not assessment:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "No contractor assessment found for this request"}
            )

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"assessment": serialize_doc(assessment)}
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": f"Failed to fetch contractor assessment: {str(e)}"}
        )

# 8. PATCH /api/harvest-requests/{id}/assessment - Landowner Response (Accept/Reject/Revision)
@router.patch("/{request_id}/assessment")
def action_contractor_assessment(request_id: str, payload: AssessmentStatusUpdate):
    try:
        if db is None:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"message": "Database connection error"}
            )

        new_status = payload.status.upper()
        if new_status not in ["ACCEPTED", "REJECTED", "REVISION_REQUESTED"]:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"message": "Invalid status action. Must be ACCEPTED, REJECTED, or REVISION_REQUESTED"}
            )

        updated_at = datetime.now(timezone.utc).isoformat()

        # Update assessment
        ass_update = {
            "status": new_status,
            "landowner_feedback": payload.feedback or "",
            "revision_reasons": payload.revision_reasons or [],
            "counter_offer_amount": payload.counter_offer_amount,
            "counter_offer_start_date": payload.counter_offer_start_date,
            "updatedAt": updated_at
        }

        # Update harvest request status accordingly
        req_status = "OPERATION_READY" if new_status == "ACCEPTED" else (
            "REVISION_REQUESTED" if new_status == "REVISION_REQUESTED" else "ASSESSMENT_REJECTED"
        )

        req_update = {
            "status": req_status,
            "landowner_feedback": payload.feedback or "",
            "revision_reasons": payload.revision_reasons or [],
            "counter_offer_amount": payload.counter_offer_amount,
            "counter_offer_start_date": payload.counter_offer_start_date,
            "updatedAt": updated_at
        }

        # Check commercial proposal type for purchase ownership transition
        assessment_rec = db.contractor_assessments.find_one({"$or": [{"harvest_request_id": request_id}, {"_id": request_id}]})
        prop_type = (assessment_rec.get("commercial_proposal_type") if assessment_rec else None) or "Harvesting Service Quotation"

        # Generate Digital Agreement when Accepted
        if new_status == "ACCEPTED":
            agreement_id = f"TC-AGR-{datetime.now().strftime('%Y%m%d')}-{str(request_id)[-6:].upper()}"
            total_agreed = (assessment_rec.get("revised_quote") or assessment_rec.get("total_quote") or assessment_rec.get("contractor_purchase_offer") or assessment_rec.get("timber_purchase_price")) if assessment_rec else 110000
            req_update["total_quote"] = total_agreed
            digital_agreement = {
                "agreement_id": agreement_id,
                "harvest_request_id": request_id,
                "status": "FINALIZED",
                "signed_at": updated_at,
                "commercial_proposal_type": prop_type,
                "total_agreed_amount": total_agreed,
                "assessed_volume": assessment_rec.get("estimated_harvestable_volume") if assessment_rec else 1.70,
                "proposed_start_date": assessment_rec.get("proposed_start_date") if assessment_rec else "",
                "estimated_duration": assessment_rec.get("estimated_duration") if assessment_rec else "",
                "terms_accepted": True,
                "ready_to_start": True
            }
            ass_update["digital_agreement"] = digital_agreement
            req_update["digital_agreement"] = digital_agreement

            if prop_type in ["Timber Purchase Offer", "Purchase + Harvesting"]:
                req_update["purchase_status"] = "PURCHASE_OFFER_ACCEPTED"
                req_update["timber_ownership"] = "CONTRACTOR"
                ass_update["purchase_status"] = "PURCHASE_OFFER_ACCEPTED"
                ass_update["timber_ownership"] = "CONTRACTOR"

        db.contractor_assessments.update_one(
            {"harvest_request_id": request_id},
            {"$set": ass_update}
        )

        req_query = {"$or": [{"_id": ObjectId(request_id)}, {"id": request_id}, {"_id": request_id}]} if ObjectId.is_valid(request_id) else {"$or": [{"id": request_id}, {"_id": request_id}]}
        db.harvest_requests.update_one(req_query, {"$set": req_update})

        updated_assessment = db.contractor_assessments.find_one({"$or": [{"harvest_request_id": request_id}, {"_id": request_id}]})

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "message": f"Assessment status updated to '{new_status}'",
                "assessment": serialize_doc(updated_assessment),
                "digital_agreement": digital_agreement if new_status == "ACCEPTED" else None
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": f"Failed to action contractor assessment: {str(e)}"}
        )

@router.post("/{request_id}/request-revision")
def request_revision_endpoint(request_id: str, payload: Dict[str, Any] = {}):
    return action_contractor_assessment(request_id, AssessmentStatusUpdate(status="REVISION_REQUESTED", feedback=payload.get("feedback", "")))

@router.post("/{request_id}/reject")
def reject_assessment_endpoint(request_id: str, payload: Dict[str, Any] = {}):
    return action_contractor_assessment(request_id, AssessmentStatusUpdate(status="REJECTED", feedback=payload.get("feedback", "")))

# 9. Advance Payment Management Endpoints
@router.post("/{request_id}/advance-payment/request")
def request_advance_payment(
    request_id: str,
    payload: AdvancePaymentRequestCreate,
    authorization: Optional[str] = Header(None)
):
    try:
        if db is None:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"message": "Database connection error"}
            )

        user_info = get_current_user_info(authorization)
        token_email = user_info.get("email")

        req_query = {"_id": ObjectId(request_id)} if ObjectId.is_valid(request_id) else {"_id": request_id}
        req_doc = db.harvest_requests.find_one(req_query)
        if not req_doc:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Harvest request not found"}
            )

        curr_status = req_doc.get("status", "PENDING").upper()
        if curr_status in ["IN_PROGRESS", "COMPLETED", "CANCELLED", "REJECTED"]:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"message": f"Advance payment cannot be modified after operations have begun or job is finalized. Current status: '{curr_status}'."}
            )

        # Note: Contractor can set or update advance terms anytime before harvesting commences

        now_iso = datetime.now(timezone.utc).isoformat()
        
        # If contractor explicitly set advance_amount, calculate percentage from it; otherwise calculate from percentage
        if payload.advance_amount is not None and float(payload.advance_amount) > 0:
            adv_amount = round(float(payload.advance_amount), 2)
            adv_percentage = round((adv_amount / float(payload.accepted_quotation)) * 100, 2)
        else:
            adv_percentage = float(payload.advance_percentage)
            adv_amount = round(float(payload.accepted_quotation) * adv_percentage / 100.0, 2)

        # Validate percentages and amounts
        if adv_percentage <= 0 or adv_percentage > 100:
            return JSONResponse(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                content={"message": "Advance percentage must be greater than 0% and at most 100%."}
            )

        if adv_amount <= 0:
            return JSONResponse(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                content={"message": "Advance amount must be a positive number greater than zero."}
            )

        if not payload.due_date or not str(payload.due_date).strip():
            return JSONResponse(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                content={"message": "Payment due date is required."}
            )

        if not payload.payment_instructions or not str(payload.payment_instructions).strip():
            return JSONResponse(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                content={"message": "Payment instructions (e.g. Bank Account or UPI details) are required."}
            )

        adv_req_doc = {
            "accepted_quotation": float(payload.accepted_quotation),
            "advance_percentage": adv_percentage,
            "advance_amount": adv_amount,
            "calculated_advance": adv_amount,
            "due_date": payload.due_date,
            "payment_instructions": payload.payment_instructions.strip(),
            "upi_id": (payload.upi_id or "").strip(),
            "bank_name": (payload.bank_name or "").strip(),
            "bank_account_number": (payload.bank_account_number or "").strip(),
            "ifsc_code": (payload.ifsc_code or "").strip(),
            "account_holder_name": (payload.account_holder_name or "").strip(),
            "supported_methods": payload.supported_methods or ["UPI", "Bank Transfer (NEFT/RTGS/IMPS)"],
            "remarks": payload.remarks or "",
            "requested_at": now_iso,
            "requested_by": token_email or req_doc.get("assigned_contractor_email") or "Assigned Contractor",
            "status": "ADVANCE_REQUESTED"
        }

        # Calculate remaining balance post-advance
        verified_paid = float(req_doc.get("total_verified_paid") or 0.0)
        remaining_balance = round(max(0.0, float(payload.accepted_quotation) - adv_amount - verified_paid), 2)
        adv_req_doc["remaining_balance"] = remaining_balance

        update_fields = {
            "advance_payment_request": adv_req_doc,
            "advance_payment_status": "ADVANCE_REQUESTED",
            "is_advance_verified": False,
            "total_quotation_amount": float(payload.accepted_quotation),
            "total_quote": float(payload.accepted_quotation),
            "advance_amount": adv_amount,
            "advance_percentage": adv_percentage,
            "total_verified_paid": verified_paid,
            "remaining_balance": remaining_balance,
            "can_start_harvest": False,
            "updatedAt": now_iso
        }

        db.harvest_requests.update_one(req_query, {"$set": update_fields})
        db.contractor_assessments.update_one(
            {"harvest_request_id": str(request_id)},
            {"$set": {
                "total_quote": float(payload.accepted_quotation),
                "advance_payment_request": adv_req_doc,
                "advance_payment_status": "ADVANCE_REQUESTED",
                "remaining_balance": remaining_balance,
                "can_start_harvest": False,
                "updatedAt": now_iso
            }}
        )

        updated_req = db.harvest_requests.find_one(req_query)
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "message": f"Advance payment of ₹{adv_amount:,.2f} ({adv_percentage}%) requested successfully.",
                "advance_percentage": float(adv_percentage),
                "advance_amount": adv_amount,
                "remaining_balance": remaining_balance,
                "advance_payment_status": "ADVANCE_REQUESTED",
                "advance_payment_request": adv_req_doc,
                "harvest_request": serialize_doc(updated_req)
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": f"Failed to request advance payment: {str(e)}"}
        )

@router.post("/{request_id}/advance-payment/order", status_code=status.HTTP_201_CREATED)
def create_harvest_advance_payment_order(
    request_id: str,
    payload: payment.CreateOrderRequest = Body(default=payment.CreateOrderRequest()),
    idempotency_header: Optional[str] = Header(None, alias="X-Idempotency-Key"),
    authorization: Optional[str] = Header(None)
):
    return payment.create_advance_payment_order(
        request_id=request_id,
        payload=payload,
        idempotency_header=idempotency_header,
        authorization=authorization
    )

@router.post("/{request_id}/advance-payment/submit")
def submit_advance_payment(
    request_id: str,
    payload: AdvancePaymentSubmit,
    authorization: Optional[str] = Header(None)
):
    try:
        if db is None:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"message": "Database connection error"}
            )

        user_info = get_current_user_info(authorization)
        token_email = user_info.get("email")

        req_query = {"_id": ObjectId(request_id)} if ObjectId.is_valid(request_id) else {"_id": request_id}
        req_doc = db.harvest_requests.find_one(req_query)
        if not req_doc:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Harvest request not found"}
            )

        if payload.amount <= 0:
            return JSONResponse(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                content={"message": "Payment amount must be greater than zero."}
            )

        if not payload.transaction_reference or not str(payload.transaction_reference).strip():
            return JSONResponse(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                content={"message": "Transaction/reference ID is required for verification."}
            )

        if not payload.payment_date or not str(payload.payment_date).strip():
            return JSONResponse(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                content={"message": "Payment date is required."}
            )

        # Check if already verified
        if req_doc.get("advance_payment_status") == "VERIFIED" and req_doc.get("is_advance_verified"):
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"message": "Advance payment for this harvesting job has already been verified."}
            )

        now_iso = datetime.now(timezone.utc).isoformat()
        pay_id = f"PAY-ADV-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:4].upper()}"

        payment_record = {
            "payment_id": pay_id,
            "harvest_request_id": str(request_id),
            "payer_email": token_email or req_doc.get("owner_email", ""),
            "payer_name": req_doc.get("ownerName", "Landowner"),
            "recipient_email": req_doc.get("assigned_contractor_email", ""),
            "recipient_name": req_doc.get("assigned_contractor_name", "Contractor"),
            "amount": float(payload.amount),
            "payment_purpose": "ADVANCE_PAYMENT",
            "payment_method": payload.payment_method,
            "transaction_reference": payload.transaction_reference.strip(),
            "payment_date": payload.payment_date,
            "receipt_url": payload.receipt_url or "",
            "notes": payload.notes or "",
            "status": "VERIFICATION_PENDING",
            "created_at": now_iso,
            "updated_at": now_iso
        }

        # Store in db.harvest_payments
        db.harvest_payments.insert_one(payment_record.copy())

        # Update harvest request
        payments_list = list(req_doc.get("payments") or [])
        payments_list.append(payment_record)

        update_fields = {
            "advance_payment_status": "VERIFICATION_PENDING",
            "is_advance_verified": False,
            "latest_payment": payment_record,
            "payments": payments_list,
            "rejection_reason": None,
            "can_start_harvest": False,
            "updatedAt": now_iso
        }

        db.harvest_requests.update_one(req_query, {"$set": update_fields})
        db.contractor_assessments.update_one(
            {"harvest_request_id": str(request_id)},
            {"$set": {
                "advance_payment_status": "VERIFICATION_PENDING",
                "latest_payment": payment_record,
                "can_start_harvest": False,
                "updatedAt": now_iso
            }}
        )

        updated_req = db.harvest_requests.find_one(req_query)
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "message": "Advance payment details recorded successfully. Pending verification by the contractor.",
                "payment_id": pay_id,
                "status": "VERIFICATION_PENDING",
                "amount": float(payload.amount),
                "payment": payment_record,
                "harvest_request": serialize_doc(updated_req)
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": f"Failed to record advance payment: {str(e)}"}
        )

@router.post("/{request_id}/advance-payment/verify")
def verify_advance_payment(
    request_id: str,
    payload: AdvancePaymentVerify,
    authorization: Optional[str] = Header(None)
):
    try:
        if db is None:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"message": "Database connection error"}
            )

        user_info = get_current_user_info(authorization)
        token_email = (user_info.get("email") or "").strip().lower()
        token_role = (user_info.get("role") or "").strip().lower()

        req_query = {"_id": ObjectId(request_id)} if ObjectId.is_valid(request_id) else {"_id": request_id}
        req_doc = db.harvest_requests.find_one(req_query)
        if not req_doc:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Harvest request not found"}
            )

        owner_email = (req_doc.get("owner_email") or "").strip().lower()

        # Critical Security Rule: Landowner cannot verify their own manual payment
        if token_email and token_email == owner_email and token_role != "admin":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "detail": "Landowners cannot verify their own advance payments. Verification must be performed by the contractor or administrator.",
                    "message": "Unauthorized: Landowners cannot verify their own manual payment records. Verification must be performed by the contractor or administrator."
                }
            )

        action = payload.action.upper()
        if action not in ["VERIFY", "REJECT"]:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"message": "Invalid action. Must be 'VERIFY' or 'REJECT'."}
            )

        now_iso = datetime.now(timezone.utc).isoformat()
        payments_list = list(req_doc.get("payments") or [])
        if not payments_list:
            db_p = list(db.harvest_payments.find({"harvest_request_id": str(request_id)}))
            payments_list = db_p

        target_payment = None
        if payload.payment_id:
            for p in payments_list:
                if p.get("payment_id") == payload.payment_id:
                    target_payment = p
                    break
        if not target_payment and payments_list:
            pending_ones = [p for p in payments_list if p.get("status") == "VERIFICATION_PENDING"]
            target_payment = pending_ones[-1] if pending_ones else payments_list[-1]

        if not target_payment:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "No payment submission found to verify."}
            )

        if action == "VERIFY":
            target_payment["status"] = "VERIFIED"
            target_payment["verified_at"] = now_iso
            target_payment["verified_by"] = token_email or req_doc.get("assigned_contractor_email") or "Contractor"
            target_payment["verification_notes"] = payload.verification_notes or "Payment verified and credited."
            target_payment["updated_at"] = now_iso

            db.harvest_payments.update_one(
                {"payment_id": target_payment.get("payment_id")},
                {"$set": {
                    "status": "VERIFIED",
                    "verified_at": now_iso,
                    "verified_by": target_payment["verified_by"],
                    "verification_notes": target_payment["verification_notes"],
                    "updated_at": now_iso
                }}
            )

            # Deduplicate and compute total verified payments credited to harvesting service
            # Timber purchases are kept separate!
            verified_total = 0.0
            seen_ids = set()
            for p in payments_list:
                p_id = p.get("payment_id")
                if p_id in seen_ids:
                    continue
                seen_ids.add(p_id)
                if p.get("status") == "VERIFIED" and p.get("payment_purpose") in ["ADVANCE_PAYMENT", "PROGRESS_PAYMENT", "FINAL_PAYMENT", "HARVESTING_SERVICE"]:
                    verified_total += float(p.get("amount", 0.0))

            accepted_quote = float(req_doc.get("total_quotation_amount") or req_doc.get("total_quote") or (req_doc.get("advance_payment_request") or {}).get("accepted_quotation") or 99000.0)
            remaining_balance = round(max(0.0, accepted_quote - verified_total), 2)

            update_fields = {
                "advance_payment_status": "VERIFIED",
                "is_advance_verified": True,
                "total_verified_advance": float(target_payment.get("amount", 0.0)),
                "total_verified_paid": round(verified_total, 2),
                "remaining_balance": remaining_balance,
                "latest_payment": target_payment,
                "payments": payments_list,
                "can_start_harvest": True,
                "rejection_reason": None,
                "updatedAt": now_iso
            }

            db.harvest_requests.update_one(req_query, {"$set": update_fields})
            db.contractor_assessments.update_one(
                {"harvest_request_id": str(request_id)},
                {"$set": {
                    "advance_payment_status": "VERIFIED",
                    "is_advance_verified": True,
                    "total_verified_paid": round(verified_total, 2),
                    "remaining_balance": remaining_balance,
                    "can_start_harvest": True,
                    "updatedAt": now_iso
                }}
            )

            updated_req = db.harvest_requests.find_one(req_query)
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content={
                    "message": f"Advance payment of ₹{target_payment.get('amount'):,.2f} verified successfully. Harvesting work is now eligible to start.",
                    "advance_payment_status": "VERIFIED",
                    "payment_id": target_payment.get("payment_id"),
                    "payment": target_payment,
                    "remaining_balance": remaining_balance,
                    "total_verified_paid": round(verified_total, 2),
                    "harvest_request": serialize_doc(updated_req)
                }
            )

        else: # REJECT
            if not payload.rejection_reason or not str(payload.rejection_reason).strip():
                return JSONResponse(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    content={"message": "A reason is mandatory when rejecting a payment submission."}
                )

            rej_reason = payload.rejection_reason.strip()
            target_payment["status"] = "REJECTED"
            target_payment["rejection_reason"] = rej_reason
            target_payment["rejected_at"] = now_iso
            target_payment["rejected_by"] = token_email or "Contractor"
            target_payment["updated_at"] = now_iso

            db.harvest_payments.update_one(
                {"payment_id": target_payment.get("payment_id")},
                {"$set": {
                    "status": "REJECTED",
                    "rejection_reason": rej_reason,
                    "rejected_at": now_iso,
                    "rejected_by": target_payment["rejected_by"],
                    "updated_at": now_iso
                }}
            )

            update_fields = {
                "advance_payment_status": "REJECTED",
                "is_advance_verified": False,
                "rejection_reason": rej_reason,
                "latest_payment": target_payment,
                "payments": payments_list,
                "can_start_harvest": False,
                "updatedAt": now_iso
            }

            db.harvest_requests.update_one(req_query, {"$set": update_fields})
            db.contractor_assessments.update_one(
                {"harvest_request_id": str(request_id)},
                {"$set": {
                    "advance_payment_status": "REJECTED",
                    "is_advance_verified": False,
                    "rejection_reason": rej_reason,
                    "can_start_harvest": False,
                    "updatedAt": now_iso
                }}
            )

            updated_req = db.harvest_requests.find_one(req_query)
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content={
                    "message": "Payment submission rejected. Landowner has been notified to review the reason and resubmit.",
                    "advance_payment_status": "REJECTED",
                    "payment_id": target_payment.get("payment_id"),
                    "payment": target_payment,
                    "rejection_reason": rej_reason,
                    "harvest_request": serialize_doc(updated_req)
                }
            )

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": f"Failed to action payment verification: {str(e)}"}
        )

@router.get("/{request_id}/payments")
def get_harvest_payments(request_id: str):
    try:
        if db is None:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"message": "Database connection error"}
            )

        req_query = {"_id": ObjectId(request_id)} if ObjectId.is_valid(request_id) else {"_id": request_id}
        req_doc = db.harvest_requests.find_one(req_query)
        if not req_doc:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Harvest request not found"}
            )

        payments = list(db.harvest_payments.find({"harvest_request_id": str(request_id)}).sort("created_at", -1))
        serialized_payments = [serialize_doc(p) for p in payments]

        if not serialized_payments and req_doc.get("payments"):
            serialized_payments = [serialize_doc(p) if isinstance(p, dict) else p for p in req_doc.get("payments")]

        accepted_quote = float(req_doc.get("total_quotation_amount") or req_doc.get("total_quote") or (req_doc.get("advance_payment_request") or {}).get("accepted_quotation") or 99000.0)
        verified_total = float(req_doc.get("total_verified_paid") or 0.0)
        remaining_balance = float(req_doc.get("remaining_balance") if req_doc.get("remaining_balance") is not None else max(0.0, accepted_quote - verified_total))

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "harvest_request_id": str(request_id),
                "advance_payment_request": req_doc.get("advance_payment_request"),
                "advance_payment_status": req_doc.get("advance_payment_status", "NOT_REQUESTED"),
                "is_advance_verified": req_doc.get("is_advance_verified", False),
                "total_quotation_amount": accepted_quote,
                "total_verified_paid": verified_total,
                "remaining_balance": remaining_balance,
                "can_start_harvest": req_doc.get("can_start_harvest", False),
                "rejection_reason": req_doc.get("rejection_reason"),
                "payments": serialized_payments
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": f"Failed to fetch payments: {str(e)}"}
        )

# Execution endpoints
@router.post("/{request_id}/start")
def start_harvest_execution(request_id: str):
    try:
        if db is None:
            return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content={"message": "Database connection error"})

        req_query = {"_id": ObjectId(request_id)} if ObjectId.is_valid(request_id) else {"_id": request_id}
        req_doc = db.harvest_requests.find_one(req_query)
        if not req_doc:
            return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content={"message": "Harvest request not found"})

        curr_status = req_doc.get("status", "PENDING").upper()
        if not is_valid_transition(curr_status, "IN_PROGRESS"):
            return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"message": f"Cannot start harvest operation from status '{curr_status}'. Request must be in OPERATION_READY status."})

        # CRITICAL BUSINESS RULE: Advance payment must be verified before harvesting work begins!
        adv_req = req_doc.get("advance_payment_request")
        adv_status = req_doc.get("advance_payment_status")
        is_adv_verified = req_doc.get("is_advance_verified", False)

        # If advance payment was requested, it must be verified before work can start
        if adv_req and float(adv_req.get("advance_amount", 0)) > 0:
            if not is_adv_verified or adv_status != "VERIFIED":
                return JSONResponse(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    content={
                        "detail": "Advance Payment Pending — harvesting work cannot start until the required advance payment has been verified.",
                        "message": "Advance Payment Pending — harvesting work cannot start until the required advance payment has been verified.",
                        "advance_payment_status": adv_status or "ADVANCE_REQUESTED",
                        "advance_amount": adv_req.get("advance_amount"),
                        "can_start_harvest": False
                    }
                )

        updated_at = datetime.now(timezone.utc).isoformat()
        db.harvest_requests.update_one(req_query, {"$set": {
            "status": "IN_PROGRESS",
            "actual_start_date": updated_at.split("T")[0],
            "started_at": updated_at,
            "updatedAt": updated_at
        }})

        updated_req = db.harvest_requests.find_one(req_query)
        return JSONResponse(status_code=status.HTTP_200_OK, content={"message": "Harvest operation marked as IN_PROGRESS", "harvest_request": serialize_doc(updated_req)})
    except Exception as e:
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content={"message": str(e)})

@router.post("/{request_id}/complete")
def complete_harvest_execution(request_id: str, payload: HarvestCompletionCreate):
    try:
        if db is None:
            return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content={"message": "Database connection error"})

        req_query = {"_id": ObjectId(request_id)} if ObjectId.is_valid(request_id) else {"_id": request_id}
        req_doc = db.harvest_requests.find_one(req_query)
        if not req_doc:
            return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content={"message": "Harvest request not found"})

        curr_status = req_doc.get("status", "PENDING").upper()
        if not is_valid_transition(curr_status, "COMPLETED"):
            return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"message": f"Cannot complete harvest operation from status '{curr_status}'. Request must be in IN_PROGRESS status."})

        updated_at = datetime.now(timezone.utc).isoformat()

        update_fields = {
            "status": "COMPLETED",
            "actual_completion_date": payload.actual_completion_date or updated_at.split("T")[0],
            "completed_at": updated_at,
            "actual_harvested_volume": payload.actual_harvested_volume,
            "actual_harvested_trees": payload.actual_harvested_trees,
            "completion_notes": payload.completion_notes or "",
            "completion_photos": payload.completion_photos or [],
            "updatedAt": updated_at
        }
        if payload.actual_start_date:
            update_fields["actual_start_date"] = payload.actual_start_date

        # If purchase proposal accepted, mark timber as available for sale
        curr_purchase_status = req_doc.get("purchase_status")
        if curr_purchase_status in ["PURCHASE_OFFER_ACCEPTED", "PURCHASE_OFFER_SUBMITTED"]:
            update_fields["purchase_status"] = "TIMBER_AVAILABLE_FOR_SALE"
            db.contractor_assessments.update_one(
                {"harvest_request_id": request_id},
                {"$set": {"purchase_status": "TIMBER_AVAILABLE_FOR_SALE"}}
            )

        db.harvest_requests.update_one(req_query, {"$set": update_fields})

        updated_req = db.harvest_requests.find_one(req_query)
        return JSONResponse(status_code=status.HTTP_200_OK, content={"message": "Harvest operation marked as COMPLETED", "harvest_request": serialize_doc(updated_req)})
    except Exception as e:
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content={"message": str(e)})

@router.delete("/{request_id}")
def delete_harvest_request(request_id: str):
    try:
        if db is None:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"message": "Database connection error"}
            )

        query = {"_id": ObjectId(request_id)} if ObjectId.is_valid(request_id) else {"_id": request_id}
        result = db.harvest_requests.delete_one(query)

        try:
            db.contractor_assessments.delete_many({"harvest_request_id": request_id})
        except Exception:
            pass

        if result.deleted_count == 0:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Harvest request not found for deletion"}
            )

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"message": "Harvest request deleted successfully from DB"}
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": f"Failed to delete harvest request: {str(e)}"}
        )


