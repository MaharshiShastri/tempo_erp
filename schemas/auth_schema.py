from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import date

class LoginInput(BaseModel):
    email: EmailStr
    password: str

class UserCreateInput(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: str
    dob: Optional[date] = None
    phone_personal: Optional[str] = ""
    phone_business: Optional[str] = ""
    regions: List[str] = []

class UserProfileResponse(BaseModel):
    email: str
    name: str
    role: str
    access_token: str