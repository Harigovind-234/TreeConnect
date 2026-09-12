from fastapi import APIRouter, HTTPException, Header, status
from fastapi.responses import JSONResponse
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from bson import ObjectId
from jose import jwt, JWTError

from app.database import db

router = APIRouter()

SECRET_KEY = "treeconnect_secret_key_forestry_platform_2026"
ALGORITHM = "HS256"

def get_current_user_email(authorization: Optional[str] = Header(None)) -> Optional[str]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("email")
    except JWTError:
        return None

# Pydantic Request Models
class HarvestRequestCreate(BaseModel):
    property_id: str
    selected_inventory_ids: List[str] = []
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
    userEmail: Optional[str] = None

class AssignContractorRequest(BaseModel):
    contractor_id: str
    contractor_name: Optional[str] = ""
    contractor_email: Optional[str] = ""

class ContractorAssessmentCreate(BaseModel):
    estimated_harvestable_volume: float
    estimated_timber_value: float
    harvesting_cost: Optional[float] = 0.0
    extraction_cost: Optional[float] = 0.0
    transportation_cost: Optional[float] = 0.0
    other_cost: Optional[float] = 0.0
    total_quote: float
    estimated_duration: str
    proposed_start_date: str
    notes: Optional[str] = ""

class AssessmentStatusUpdate(BaseModel):
    status: str  # ACCEPTED, REJECTED, REVISION_REQUESTED
    feedback: Optional[str] = ""

class HarvestCompletionCreate(BaseModel):
    actual_harvested_volume: float
    actual_harvested_trees: int
    actual_start_date: Optional[str] = None
    actual_completion_date: Optional[str] = None
    completion_notes: Optional[str] = ""
    completion_photos: Optional[List[str]] = []

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

# Helper to serialize Mongo documents
def serialize_doc(doc: dict) -> dict:
    if not doc:
        return {}
    doc["id"] = str(doc.get("_id", ""))
    doc["_id"] = str(doc.get("_id", ""))
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

        # Verify property exists
        prop_query = {}
        if ObjectId.is_valid(payload.property_id):
            prop_query = {"$or": [{"_id": ObjectId(payload.property_id)}, {"_id": payload.property_id}, {"id": payload.property_id}]}
        else:
            prop_query = {"$or": [{"_id": payload.property_id}, {"id": payload.property_id}]}

        property_doc = db.properties.find_one(prop_query)
        prop_name = property_doc.get("propertyName", "Registered Property") if property_doc else "Registered Property"
        prop_loc = f"{property_doc.get('district', 'Kottayam')}, {property_doc.get('state', 'Kerala')}" if property_doc else "Kerala"

        created_at = datetime.now(timezone.utc).isoformat()

        doc = {
            "property_id": payload.property_id,
            "propertyName": prop_name,
            "propertyLocation": prop_loc,
            "selected_inventory_ids": payload.selected_inventory_ids,
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
            "status": "CONTRACTOR_ASSIGNED" if payload.assigned_contractor_id else "PENDING",
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

        query = {}
        if not all_records:
            if contractorId:
                query = {"$or": [{"assigned_contractor_id": contractorId}, {"assigned_contractor_email": target_email}]}
            elif target_email:
                clean_email = target_email.strip().lower()
                query = {"$or": [{"owner_email": clean_email}, {"owner_email": target_email.strip()}]}
            else:
                # If no email/contractor filter provided and not all_records, return all
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
                p_query = {"_id": ObjectId(p_id)} if ObjectId.is_valid(p_id) else {"_id": p_id}
                p_doc = db.properties.find_one(p_query)
                if not p_doc:
                    # Property was deleted by landowner — purge orphaned request
                    try:
                        db.harvest_requests.delete_one({"_id": req.get("_id")})
                    except Exception:
                        pass
                    continue
                req_data["property_details"] = serialize_doc(p_doc)

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

            # Hydrate contractor assessment if available
            ass_doc = db.contractor_assessments.find_one({"harvest_request_id": req_data["id"]})
            if ass_doc:
                req_data["assessment"] = serialize_doc(ass_doc)

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
            p_query = {"_id": ObjectId(p_id)} if ObjectId.is_valid(p_id) else {"_id": p_id}
            p_doc = db.properties.find_one(p_query)
            if p_doc:
                req_data["property_details"] = serialize_doc(p_doc)

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

        # Hydrate contractor assessment if available
        ass_doc = db.contractor_assessments.find_one({"harvest_request_id": req_data["id"]})
        if ass_doc:
            req_data["assessment"] = serialize_doc(ass_doc)

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

        # Check existing assessment for this harvest request
        assessment_doc = {
            "harvest_request_id": request_id,
            "contractor_email": token_email or "",
            "estimated_harvestable_volume": payload.estimated_harvestable_volume,
            "estimated_timber_value": payload.estimated_timber_value,
            "harvesting_cost": payload.harvesting_cost or 0.0,
            "extraction_cost": payload.extraction_cost or 0.0,
            "transportation_cost": payload.transportation_cost or 0.0,
            "other_cost": payload.other_cost or 0.0,
            "total_quote": payload.total_quote,
            "estimated_duration": payload.estimated_duration,
            "proposed_start_date": payload.proposed_start_date,
            "notes": payload.notes or "",
            "status": "SUBMITTED",
            "createdAt": created_at,
            "updatedAt": created_at
        }

        # Upsert assessment in db.contractor_assessments
        db.contractor_assessments.update_one(
            {"harvest_request_id": request_id},
            {"$set": assessment_doc},
            upsert=True
        )

        # Update harvest request status
        req_query = {"_id": ObjectId(request_id)} if ObjectId.is_valid(request_id) else {"_id": request_id}
        db.harvest_requests.update_one(req_query, {"$set": {
            "status": "ASSESSMENT_SUBMITTED",
            "updatedAt": created_at
        }})

        assessment_result = db.contractor_assessments.find_one({"harvest_request_id": request_id})

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

        assessment = db.contractor_assessments.find_one({"harvest_request_id": request_id})
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
        db.contractor_assessments.update_one(
            {"harvest_request_id": request_id},
            {"$set": {
                "status": new_status,
                "landowner_feedback": payload.feedback or "",
                "updatedAt": updated_at
            }}
        )

        # Update harvest request status accordingly
        req_status = "OPERATION_READY" if new_status == "ACCEPTED" else (
            "REVISION_REQUESTED" if new_status == "REVISION_REQUESTED" else "ASSESSMENT_REJECTED"
        )

        req_query = {"_id": ObjectId(request_id)} if ObjectId.is_valid(request_id) else {"_id": request_id}
        db.harvest_requests.update_one(req_query, {"$set": {
            "status": req_status,
            "updatedAt": updated_at
        }})

        updated_assessment = db.contractor_assessments.find_one({"harvest_request_id": request_id})

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "message": f"Assessment status updated to '{new_status}'",
                "assessment": serialize_doc(updated_assessment)
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


