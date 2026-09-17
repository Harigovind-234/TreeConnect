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

DEFAULT_TIMBER_RATES = [
    {
        "species": "Teak",
        "rate_per_m3": 139490,
        "unit": "INR/m3",
        "district": "Kottayam",
        "rate_type": "Reference Market Rate",
        "effective_from": "2026-01-01",
        "effective_to": None,
        "source": "Kerala Government timber market-price data"
    },
    {
        "species": "Teakwood",
        "rate_per_m3": 139490,
        "unit": "INR/m3",
        "district": "Kottayam",
        "rate_type": "Reference Market Rate",
        "effective_from": "2026-01-01",
        "effective_to": None,
        "source": "Kerala Government timber market-price data"
    },
    {
        "species": "Rosewood",
        "rate_per_m3": 210000,
        "unit": "INR/m3",
        "district": "Kottayam",
        "rate_type": "Reference Market Rate",
        "effective_from": "2026-01-01",
        "effective_to": None,
        "source": "Kerala Government timber market-price data"
    },
    {
        "species": "Mahogany",
        "rate_per_m3": 85000,
        "unit": "INR/m3",
        "district": "Kottayam",
        "rate_type": "Reference Market Rate",
        "effective_from": "2026-01-01",
        "effective_to": None,
        "source": "Kerala Government timber market-price data"
    },
    {
        "species": "Rubber",
        "rate_per_m3": 38000,
        "unit": "INR/m3",
        "district": "Kottayam",
        "rate_type": "Reference Market Rate",
        "effective_from": "2026-01-01",
        "effective_to": None,
        "source": "Kerala Government timber market-price data"
    },
    {
        "species": "Sandalwood",
        "rate_per_m3": 350000,
        "unit": "INR/m3",
        "district": "Kottayam",
        "rate_type": "Reference Market Rate",
        "effective_from": "2026-01-01",
        "effective_to": None,
        "source": "Kerala Government timber market-price data"
    },
    {
        "species": "Coconut",
        "rate_per_m3": 22000,
        "unit": "INR/m3",
        "district": "Kottayam",
        "rate_type": "Reference Market Rate",
        "effective_from": "2026-01-01",
        "effective_to": None,
        "source": "Kerala Government timber market-price data"
    },
    {
        "species": "Jackfruit",
        "rate_per_m3": 45000,
        "unit": "INR/m3",
        "district": "Kottayam",
        "rate_type": "Reference Market Rate",
        "effective_from": "2026-01-01",
        "effective_to": None,
        "source": "Kerala Government timber market-price data"
    },
    {
        "species": "Eucalyptus",
        "rate_per_m3": 28000,
        "unit": "INR/m3",
        "district": "Kottayam",
        "rate_type": "Reference Market Rate",
        "effective_from": "2026-01-01",
        "effective_to": None,
        "source": "Kerala Government timber market-price data"
    },
    {
        "species": "Pine",
        "rate_per_m3": 32000,
        "unit": "INR/m3",
        "district": "Kottayam",
        "rate_type": "Reference Market Rate",
        "effective_from": "2026-01-01",
        "effective_to": None,
        "source": "Kerala Government timber market-price data"
    },
    {
        "species": "Western Red Cedar",
        "rate_per_m3": 65000,
        "unit": "INR/m3",
        "district": "Kottayam",
        "rate_type": "Reference Market Rate",
        "effective_from": "2026-01-01",
        "effective_to": None,
        "source": "Kerala Government timber market-price data"
    },

    # State-level fallbacks (district = None)
    {
        "species": "Teak",
        "rate_per_m3": 135000,
        "unit": "INR/m3",
        "district": None,
        "rate_type": "State Reference Rate",
        "effective_from": "2026-01-01",
        "effective_to": None,
        "source": "Kerala Government timber market-price data"
    },
    {
        "species": "Teakwood",
        "rate_per_m3": 135000,
        "unit": "INR/m3",
        "district": None,
        "rate_type": "State Reference Rate",
        "effective_from": "2026-01-01",
        "effective_to": None,
        "source": "Kerala Government timber market-price data"
    },
    {
        "species": "Rosewood",
        "rate_per_m3": 200000,
        "unit": "INR/m3",
        "district": None,
        "rate_type": "State Reference Rate",
        "effective_from": "2026-01-01",
        "effective_to": None,
        "source": "Kerala Government timber market-price data"
    },
    {
        "species": "Mahogany",
        "rate_per_m3": 80000,
        "unit": "INR/m3",
        "district": None,
        "rate_type": "State Reference Rate",
        "effective_from": "2026-01-01",
        "effective_to": None,
        "source": "Kerala Government timber market-price data"
    },
    {
        "species": "Rubber",
        "rate_per_m3": 35000,
        "unit": "INR/m3",
        "district": None,
        "rate_type": "State Reference Rate",
        "effective_from": "2026-01-01",
        "effective_to": None,
        "source": "Kerala Government timber market-price data"
    },
    {
        "species": "Sandalwood",
        "rate_per_m3": 340000,
        "unit": "INR/m3",
        "district": None,
        "rate_type": "State Reference Rate",
        "effective_from": "2026-01-01",
        "effective_to": None,
        "source": "Kerala Government timber market-price data"
    },
    {
        "species": "Coconut",
        "rate_per_m3": 20000,
        "unit": "INR/m3",
        "district": None,
        "rate_type": "State Reference Rate",
        "effective_from": "2026-01-01",
        "effective_to": None,
        "source": "Kerala Government timber market-price data"
    },
    {
        "species": "Jackfruit",
        "rate_per_m3": 42000,
        "unit": "INR/m3",
        "district": None,
        "rate_type": "State Reference Rate",
        "effective_from": "2026-01-01",
        "effective_to": None,
        "source": "Kerala Government timber market-price data"
    },
    {
        "species": "Eucalyptus",
        "rate_per_m3": 26000,
        "unit": "INR/m3",
        "district": None,
        "rate_type": "State Reference Rate",
        "effective_from": "2026-01-01",
        "effective_to": None,
        "source": "Kerala Government timber market-price data"
    },
    {
        "species": "Pine",
        "rate_per_m3": 30000,
        "unit": "INR/m3",
        "district": None,
        "rate_type": "State Reference Rate",
        "effective_from": "2026-01-01",
        "effective_to": None,
        "source": "Kerala Government timber market-price data"
    },
    {
        "species": "Western Red Cedar",
        "rate_per_m3": 60000,
        "unit": "INR/m3",
        "district": None,
        "rate_type": "State Reference Rate",
        "effective_from": "2026-01-01",
        "effective_to": None,
        "source": "Kerala Government timber market-price data"
    },
    {
        "species": "Douglas Fir",
        "rate_per_m3": 55000,
        "unit": "INR/m3",
        "district": None,
        "rate_type": "State Reference Rate",
        "effective_from": "2026-01-01",
        "effective_to": None,
        "source": "Kerala Government timber market-price data"
    },
    {
        "species": "Mango",
        "rate_per_m3": 32000,
        "unit": "INR/m3",
        "district": None,
        "rate_type": "State Reference Rate",
        "effective_from": "2026-01-01",
        "effective_to": None,
        "source": "Kerala Government timber market-price data"
    },
    {
        "species": "Other",
        "rate_per_m3": 30000,
        "unit": "INR/m3",
        "district": None,
        "rate_type": "State Reference Rate",
        "effective_from": "2026-01-01",
        "effective_to": None,
        "source": "Kerala Government timber market-price data"
    }
]

def seed_timber_rates_if_needed():
    if db is not None:
        try:
            if db.timber_reference_rates.count_documents({}) == 0:
                db.timber_reference_rates.insert_many(DEFAULT_TIMBER_RATES)
                print("[OK] Timber reference rates collection initialized.")
        except Exception as err:
            print(f"[WARN] Failed to seed timber reference rates: {err}")

# Auto-seed on router load
seed_timber_rates_if_needed()

def find_timber_reference_rate(species: str, district: Optional[str] = None) -> Optional[dict]:
    if not species:
        return None
    sp_norm = str(species).strip().lower()

    if db is not None:
        try:
            seed_timber_rates_if_needed()
            # 1. Check district-specific rate
            if district and str(district).strip():
                dist_norm = str(district).strip()
                match = db.timber_reference_rates.find_one({
                    "species": {"$regex": f"^{sp_norm}$", "$options": "i"},
                    "district": {"$regex": f"^{dist_norm}$", "$options": "i"}
                })
                if match:
                    return match

            # 2. Check state-level fallback (district is None or null)
            state_match = db.timber_reference_rates.find_one({
                "species": {"$regex": f"^{sp_norm}$", "$options": "i"},
                "$or": [{"district": None}, {"district": {"$exists": False}}]
            })
            if state_match:
                return state_match

            # 3. Fallback to species "Other"
            other_match = db.timber_reference_rates.find_one({
                "species": {"$regex": "^other$", "$options": "i"}
            })
            if other_match:
                return other_match
        except Exception as e:
            print(f"[WARN] Error fetching timber rate from DB: {e}")

    # Fallback to in-memory list if DB offline or query misses
    if district and str(district).strip():
        dist_norm = str(district).strip().lower()
        for r in DEFAULT_TIMBER_RATES:
            if r.get("species", "").lower() == sp_norm and r.get("district") and r.get("district").lower() == dist_norm:
                return r

    for r in DEFAULT_TIMBER_RATES:
        if r.get("species", "").lower() == sp_norm and r.get("district") is None:
            return r

    for r in DEFAULT_TIMBER_RATES:
        if r.get("species", "").lower() == "other":
            return r

    return None

def get_current_user_email(authorization: Optional[str] = Header(None)) -> Optional[str]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("email")
    except JWTError:
        return None

@router.get("/timber-reference-rate")
def get_timber_reference_rate(species: str, district: Optional[str] = None):
    rate_doc = find_timber_reference_rate(species, district)
    if not rate_doc:
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "species": species,
                "district": district,
                "reference_rate": None,
                "rate_unit": None,
                "rate_source": None,
                "rate_effective_date": None,
                "message": "Reference rate unavailable"
            }
        )

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "species": rate_doc.get("species", species),
            "district": rate_doc.get("district") or district,
            "reference_rate": rate_doc.get("rate_per_m3"),
            "rate_unit": rate_doc.get("unit", "INR/m3"),
            "rate_source": rate_doc.get("source", "Kerala Government timber market-price data"),
            "rate_effective_date": rate_doc.get("effective_from", "2026-01-01"),
            "rate_type": rate_doc.get("rate_type", "Reference Market Rate")
        }
    )

@router.post("/calculate-timber-value")
def calculate_timber_value(payload: dict):
    species = payload.get("species") or payload.get("treeSpecies") or "Teak"
    district = payload.get("district") or ""
    property_id = payload.get("propertyId") or payload.get("property_id")

    if not district and property_id and db is not None:
        try:
            q = {"_id": ObjectId(property_id)} if ObjectId.is_valid(property_id) else {"_id": property_id}
            p = db.properties.find_one(q)
            if p and p.get("district"):
                district = p.get("district")
        except Exception:
            pass

    try:
        vol_raw = payload.get("estimated_volume")
        if vol_raw is None:
            vol_raw = payload.get("estimatedVolume")
        if vol_raw is None:
            vol_raw = payload.get("volume")
        vol = float(vol_raw) if vol_raw is not None else 0.0
    except (ValueError, TypeError):
        vol = 0.0

    if vol < 0:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"message": "Estimated volume must be non-negative"}
        )

    rate_doc = find_timber_reference_rate(species, district)
    if not rate_doc or vol == 0.0:
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "species": species,
                "district": district,
                "estimated_volume": round(vol, 2),
                "reference_rate": rate_doc.get("rate_per_m3") if rate_doc else None,
                "rate_unit": rate_doc.get("unit", "INR/m3") if rate_doc else None,
                "approximate_timber_value": int(round(vol * rate_doc["rate_per_m3"])) if rate_doc and vol > 0 else None,
                "rate_source": rate_doc.get("source") if rate_doc else None,
                "rate_effective_date": rate_doc.get("effective_from") if rate_doc else None,
                "message": "Reference rate unavailable" if not rate_doc else "Volume is zero"
            }
        )

    rate_per_m3 = float(rate_doc["rate_per_m3"])
    approx_val = int(round(vol * rate_per_m3))

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "species": species,
            "district": rate_doc.get("district") or district,
            "estimated_volume": round(vol, 2),
            "reference_rate": rate_per_m3,
            "rate_unit": rate_doc.get("unit", "INR/m3"),
            "approximate_timber_value": approx_val,
            "rate_source": rate_doc.get("source", "Kerala Government timber market-price data"),
            "rate_effective_date": rate_doc.get("effective_from", "2026-01-01"),
            "rate_type": rate_doc.get("rate_type", "Reference Market Rate")
        }
    )

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

        prop_id = payload.get("propertyId")
        prop_district = "Kottayam"
        if prop_id:
            try:
                q = {"_id": ObjectId(prop_id)} if ObjectId.is_valid(prop_id) else {"_id": prop_id}
                target_p = db.properties.find_one(q)
                if target_p and target_p.get("district"):
                    prop_district = target_p.get("district")
            except Exception:
                pass

        raw_species_list = payload.get("speciesList", [])
        enriched_species_list = []
        for sp in raw_species_list:
            if isinstance(sp, dict):
                sp_item = dict(sp)
                sp_name = sp_item.get("treeSpecies") or sp_item.get("species") or "Teak"
                vol_val = sp_item.get("estimatedVolume") if sp_item.get("estimatedVolume") is not None else sp_item.get("volume")
                try:
                    vol_float = float(vol_val) if vol_val is not None else 0.0
                except (ValueError, TypeError):
                    vol_float = 0.0

                rate_info = find_timber_reference_rate(sp_name, prop_district)
                if rate_info and vol_float > 0:
                    rate_per_m3 = float(rate_info["rate_per_m3"])
                    approx_val = int(round(vol_float * rate_per_m3))
                    sp_item["estimated_volume"] = round(vol_float, 2)
                    sp_item["approximate_timber_value"] = approx_val
                    sp_item["rate_unit"] = rate_info.get("unit", "INR/m3")
                    sp_item["rate_source"] = rate_info.get("source", "Kerala Government timber market-price data")
                    sp_item["rate_effective_date"] = rate_info.get("effective_from", "2026-01-01")
                    sp_item["rate_snapshot"] = {
                        "rate_per_m3": rate_per_m3,
                        "rate_unit": rate_info.get("unit", "INR/m3"),
                        "rate_source": rate_info.get("source", "Kerala Government timber market-price data"),
                        "rate_effective_date": rate_info.get("effective_from", "2026-01-01"),
                        "district": rate_info.get("district") or prop_district
                    }
                else:
                    sp_item["estimated_volume"] = round(vol_float, 2) if vol_float > 0 else None
                    sp_item["approximate_timber_value"] = None
                    sp_item["rate_snapshot"] = None

                enriched_species_list.append(sp_item)

        doc = {
            "propertyId": payload.get("propertyId"),
            "propertyName": payload.get("propertyName", ""),
            "treeAreaLocation": payload.get("treeAreaLocation", ""),
            "speciesList": enriched_species_list,
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

