from pydantic import BaseModel, Field
from typing import Optional, List

class PropertyCreate(BaseModel):
    propertyName: str
    propertyType: str = Field(default="Residential Property")
    ownerName: Optional[str] = ""
    contactNumber: Optional[str] = ""
    description: Optional[str] = ""
    address: Optional[str] = ""
    state: Optional[str] = "Kerala"
    district: Optional[str] = "Kottayam"
    localBody: Optional[str] = ""
    village: Optional[str] = ""
    pinCode: Optional[str] = ""
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    totalArea: Optional[float] = None
    areaUnit: Optional[str] = "Acres"
    photos: Optional[List[str]] = []
    videos: Optional[List[str]] = []
    riskFactors: Optional[List[str]] = []
    riskNotes: Optional[str] = ""
    image: Optional[str] = None
    status: Optional[str] = "Active Estate"
    ownerId: Optional[str] = None
    userEmail: Optional[str] = None

class PropertyUpdate(BaseModel):
    propertyName: Optional[str] = None
    propertyType: Optional[str] = None
    ownerName: Optional[str] = None
    contactNumber: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    localBody: Optional[str] = None
    village: Optional[str] = None
    pinCode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    totalArea: Optional[float] = None
    areaUnit: Optional[str] = None
    photos: Optional[List[str]] = None
    videos: Optional[List[str]] = None
    status: Optional[str] = None
