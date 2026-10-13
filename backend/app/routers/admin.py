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
    "address": 1,
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
}

def format_user_summary(u, include_urls=False):
    user_id = str(u.get("_id", ""))
    email = u.get("email", "").strip().lower()

    role = u.get("role", "landowner")
    name = u.get("fullName") or u.get("companyName") or u.get("contactPerson") or email
    phone = u.get("phone") or "N/A"
    district = u.get("district") or u.get("state") or u.get("address") or "Kerala"
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
    if business_cert: docs_summary_list.append("Business Certificate")
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
        "idProofType": u.get("idProofType") or "",
        "idProofDocument": id_proof_doc,
        "supportingDocument": u.get("supportingDocument") or "",
    }

    if include_urls:
        user_data.update({
            "forestLicenceUrl": u.get("forestLicenceUrl") or "",
            "tradeLicenceUrl": u.get("tradeLicenceUrl") or "",
            "gstUrl": u.get("gstUrl") or "",
            "businessCertUrl": u.get("businessCertUrl") or "",
            "landTaxInvoiceUrl": u.get("landTaxInvoiceUrl") or "",
            "idProofUrl": u.get("idProofUrl") or "",
            "supportingUrl": u.get("supportingUrl") or "",
        })
    else:
        # Pass non-heavy URLs (HTTP URLs) while omitting heavy base64 strings from bulk list
        for url_field in ["forestLicenceUrl", "tradeLicenceUrl", "gstUrl", "businessCertUrl", "landTaxInvoiceUrl", "idProofUrl", "supportingUrl"]:
            val = u.get(url_field) or ""
            if val and len(val) < 500:
                user_data[url_field] = val
            elif val:
                user_data[url_field] = f"/api/admin/users/{user_id}/doc/{url_field}"
            else:
                user_data[url_field] = ""

    return user_data

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
