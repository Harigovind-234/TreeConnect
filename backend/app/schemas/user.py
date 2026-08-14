from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional

class UserRegister(BaseModel):
    role: str = Field(default="landowner")
    fullName: Optional[str] = ""
    companyName: Optional[str] = ""
    contactPerson: Optional[str] = ""
    email: EmailStr
    phone: Optional[str] = ""
    password: str
    address: Optional[str] = ""
    district: Optional[str] = ""
    state: Optional[str] = ""
    country: Optional[str] = ""
    postalCode: Optional[str] = ""
    localBody: Optional[str] = ""
    village: Optional[str] = ""
    businessType: Optional[str] = ""
    yearsOfExperience: Optional[str] = ""
    serviceArea: Optional[str] = ""
    licenseNumber: Optional[str] = ""
    idProofType: Optional[str] = ""
    idProofDocument: Optional[str] = ""
    supportingDocument: Optional[str] = ""
    declarationAccepted: Optional[bool] = False
    preferredCommunication: Optional[str] = "Email"
    language: Optional[str] = "English"
    profilePicture: Optional[str] = ""

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return v
        cleaned = v.strip()
        if not cleaned.isdigit():
            raise ValueError('Mobile number must contain digits only')
        if len(cleaned) != 10:
            raise ValueError('Mobile number must be exactly 10 digits')
        if cleaned[0] not in ['6', '7', '8', '9']:
            raise ValueError('Mobile number must start with 6, 7, 8, or 9')
        counts = {}
        for ch in cleaned:
            counts[ch] = counts.get(ch, 0) + 1
            if counts[ch] >= 5:
                raise ValueError('Mobile number cannot contain the same digit 5 or more times')
        return cleaned

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    message: str

