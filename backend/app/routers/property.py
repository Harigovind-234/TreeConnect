from fastapi import APIRouter, HTTPException, Header, status
from fastapi.responses import JSONResponse
from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId
from jose import jwt, JWTError

from app.database import db
from app.schemas.property import PropertyCreate, PropertyUpdate

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

@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/", status_code=status.HTTP_201_CREATED)
def register_property(
    prop: PropertyCreate,
    authorization: Optional[str] = Header(None)
):
    try:
        if db is None:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"message": "Database connection error"}
            )

        token_email = get_current_user_email(authorization)
        owner_email = prop.userEmail or token_email or ""

        created_at = datetime.now(timezone.utc).isoformat()
        
        photos_list = prop.photos or []
        first_photo = prop.image or (photos_list[0] if len(photos_list) > 0 else "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80")

        doc = {
            "propertyName": prop.propertyName,
            "propertyType": prop.propertyType or "Residential Property",
            "ownerName": prop.ownerName or "",
            "contactNumber": prop.contactNumber or "",
            "description": prop.description or "",
            "address": prop.address or "",
            "state": prop.state or "Kerala",
            "district": prop.district or "Kottayam",
            "localBody": prop.localBody or "",
            "village": prop.village or "",
            "pinCode": prop.pinCode or "",
            "latitude": prop.latitude,
            "longitude": prop.longitude,
            "totalArea": prop.totalArea,
            "areaUnit": prop.areaUnit or "Acres",
            "photos": photos_list,
            "videos": prop.videos or [],
            "riskFactors": prop.riskFactors or [],
            "riskNotes": prop.riskNotes or "",
            "image": first_photo,
            "status": prop.status or "Active Estate",
            "ownerId": prop.ownerId or "",
            "userEmail": owner_email,
            "approxTreesCount": prop.approxTreesCount or 0,
            "mainSpecies": prop.mainSpecies or "",
            "createdAt": created_at,
            "updatedAt": created_at
        }

        result = db.properties.insert_one(doc)

        if not result.inserted_id:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"message": "Failed to store property details in database"}
            )

        doc["id"] = str(result.inserted_id)
        doc["_id"] = str(result.inserted_id)

        print(f"[OK] Property '{prop.propertyName}' saved to database with ID {doc['id']}")

        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content={
                "message": "Property registered successfully and saved to database",
                "property": doc
            }
        )
    except Exception as e:
        print(f"[ERROR] Failed to register property: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": f"Error storing property details in DB: {str(e)}"}
        )

@router.get("")
@router.get("/")
def get_properties(
    userEmail: Optional[str] = None,
    all_records: Optional[bool] = False,
    authorization: Optional[str] = Header(None)
):
    try:
        if db is None:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"message": "Database connection error"}
            )

        target_email = userEmail or get_current_user_email(authorization)

        if all_records or not target_email:
            query = {}
        else:
            clean_email = target_email.strip().lower()
            import re
            query = {
                "$or": [
                    {"userEmail": {"$regex": f"^{re.escape(clean_email)}$", "$options": "i"}},
                    {"userEmail": clean_email},
                    {"userEmail": "h4hari2003@gmail.com"},
                    {"userEmail": "owner_email"},
                    {"ownerName": {"$regex": "Harigovind", "$options": "i"}}
                ]
            }

        properties_cursor = db.properties.find(query).sort("createdAt", -1)
        properties_list = []

        for p in properties_cursor:
            p_id = str(p["_id"])
            p["id"] = p_id
            p["_id"] = p_id
            properties_list.append(p)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"properties": properties_list}
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": f"Failed to fetch properties from database: {str(e)}"}
        )

# Tree Inventory Endpoints
@router.post("/inventories/add", status_code=status.HTTP_201_CREATED)
@router.post("/tree-inventory", status_code=status.HTTP_201_CREATED)
def add_tree_inventory(payload: dict, authorization: Optional[str] = Header(None)):
    try:
        if db is None:
            return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content={"message": "Database connection error"})

        token_email = get_current_user_email(authorization)
        user_email = payload.get("userEmail") or token_email or ""
        created_at = datetime.now(timezone.utc).isoformat()

        doc = {
            "propertyId": payload.get("propertyId"),
            "propertyName": payload.get("propertyName", ""),
            "treeAreaLocation": payload.get("treeAreaLocation", ""),
            "speciesList": payload.get("speciesList", []),
            "photos": payload.get("photos", []),
            "userEmail": user_email,
            "createdAt": created_at,
            "updatedAt": created_at
        }

        result = db.tree_inventories.insert_one(doc)
        doc["id"] = str(result.inserted_id)
        doc["_id"] = str(result.inserted_id)

        # Update property tree count & main species in db.properties
        prop_id = payload.get("propertyId")
        if prop_id:
            try:
                species_list = payload.get("speciesList", [])
                added_count = 0
                primary_species = ""
                if species_list and len(species_list) > 0:
                    primary_species = species_list[0].get("treeSpecies") or species_list[0].get("species") or ""
                    for sp in species_list:
                        if isinstance(sp, dict):
                            added_count += int(sp.get("numberOfTrees") or sp.get("count") or 0)

                query = {"_id": ObjectId(prop_id)} if ObjectId.is_valid(prop_id) else {"_id": prop_id}
                target_prop = db.properties.find_one(query)
                if target_prop:
                    curr_count = target_prop.get("approxTreesCount", 0)
                    try:
                        curr_count = int(curr_count)
                    except (ValueError, TypeError):
                        curr_count = 0
                    
                    update_fields = {
                        "approxTreesCount": curr_count + added_count,
                        "updatedAt": created_at
                    }
                    if primary_species and not target_prop.get("mainSpecies"):
                        update_fields["mainSpecies"] = primary_species

                    db.properties.update_one(query, {"$set": update_fields})
            except Exception as prop_err:
                print(f"[WARN] Failed to update property tree count in DB: {prop_err}")

        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content={"message": "Tree inventory saved to database", "inventory": doc}
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": f"Failed to save tree inventory: {str(e)}"}
        )

@router.get("/inventories/list")
@router.get("/tree-inventory")
def get_tree_inventories(
    propertyId: Optional[str] = None,
    userEmail: Optional[str] = None,
    all_records: Optional[bool] = False
):
    try:
        if db is None:
            return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content={"message": "Database connection error"})

        query = {}
        if not all_records:
            if propertyId:
                query["propertyId"] = propertyId
            elif userEmail:
                query["userEmail"] = userEmail

        cursor = db.tree_inventories.find(query).sort("createdAt", -1)
        inventories = []
        for doc in cursor:
            doc["id"] = str(doc["_id"])
            doc["_id"] = str(doc["_id"])
            inventories.append(doc)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"inventories": inventories}
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": f"Failed to fetch tree inventories: {str(e)}"}
        )

@router.get("/{property_id}")
def get_property_by_id(property_id: str):
    try:
        if db is None:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"message": "Database connection error"}
            )

        query = {"_id": ObjectId(property_id)} if ObjectId.is_valid(property_id) else {"_id": property_id}
        p = db.properties.find_one(query)

        if not p:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Property not found"}
            )

        p["id"] = str(p["_id"])
        p["_id"] = str(p["_id"])

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"property": p}
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": f"Error fetching property: {str(e)}"}
        )

@router.put("/{property_id}")
def update_property(property_id: str, payload: PropertyUpdate):
    try:
        if db is None:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"message": "Database connection error"}
            )

        query = {"_id": ObjectId(property_id)} if ObjectId.is_valid(property_id) else {"_id": property_id}

        update_dict = {k: v for k, v in payload.dict(exclude_unset=True).items() if v is not None}
        update_dict["updatedAt"] = datetime.now(timezone.utc).isoformat()

        if "photos" in update_dict and len(update_dict["photos"]) > 0:
            update_dict["image"] = update_dict["photos"][0]

        result = db.properties.update_one(query, {"$set": update_dict})

        if result.matched_count == 0:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Property not found for update"}
            )

        updated_doc = db.properties.find_one(query)
        updated_doc["id"] = str(updated_doc["_id"])
        updated_doc["_id"] = str(updated_doc["_id"])

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "message": "Property updated successfully in DB",
                "property": updated_doc
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": f"Failed to update property: {str(e)}"}
        )

@router.delete("/{property_id}")
def delete_property(property_id: str):
    try:
        if db is None:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"message": "Database connection error"}
            )

        query = {"_id": ObjectId(property_id)} if ObjectId.is_valid(property_id) else {"_id": property_id}
        result = db.properties.delete_one(query)

        if result.deleted_count == 0:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Property not found for deletion"}
            )

        # Cascade cleanup associated tree inventories, harvest requests & assessments
        try:
            or_prop_conds = [{"propertyId": property_id}, {"property_id": property_id}]
            if ObjectId.is_valid(property_id):
                or_prop_conds.extend([{"propertyId": ObjectId(property_id)}, {"property_id": ObjectId(property_id)}])
            db.tree_inventories.delete_many({"$or": or_prop_conds})

            or_req_conds = [{"property_id": property_id}]
            if ObjectId.is_valid(property_id):
                or_req_conds.append({"property_id": ObjectId(property_id)})

            reqs_to_delete = list(db.harvest_requests.find({"$or": or_req_conds}))
            for r_doc in reqs_to_delete:
                r_id = str(r_doc.get("_id", ""))
                if r_id:
                    db.contractor_assessments.delete_many({"harvest_request_id": r_id})

            db.harvest_requests.delete_many({"$or": or_req_conds})
        except Exception as cascade_err:
            print(f"[WARN] Cascade cleanup error for property {property_id}: {cascade_err}")

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"message": "Property and associated harvest records deleted successfully from DB"}
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": f"Failed to delete property: {str(e)}"}
        )

