from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from app.database import db

router = APIRouter()

@router.get("/users")
def get_all_users():
    try:
        users_list = []

        if db is not None:
            db_users = list(db.users.find())
            for u in db_users:
                user_id = str(u.get("_id", ""))
                email = u.get("email", "").strip().lower()
                if not email:
                    continue

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
                status_val = u.get("status", "Active")
                
                if is_verified:
                    verification = "Verified by TreeConnect Admin"
                else:
                    verification = "Pending Verification" if role == "contractor" else "Verified"

                experience = u.get("experience") or u.get("yearsInBusiness") or "3+ Years Harvesting Experience"
                equipment = u.get("equipment") or u.get("machinery") or "Standard Logging & Transport Machinery"
                doc_type = u.get("docType") or u.get("idProofType") or "Government Registered Business License & ID Proof"
                contact_person = u.get("contactPerson") or u.get("fullName") or name

                users_list.append({
                    "id": user_id,
                    "name": name,
                    "contractorName": name,
                    "contactPerson": contact_person,
                    "email": email,
                    "phone": phone,
                    "role": role,
                    "location": district,
                    "status": status_val,
                    "isVerified": is_verified,
                    "verification": verification,
                    "date": date_str,
                    "submittedDate": date_str,
                    "experience": experience,
                    "equipment": equipment,
                    "docType": doc_type
                })

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"users": users_list}
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": f"Failed to fetch users from database: {str(e)}"}
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
