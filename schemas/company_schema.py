from pydantic import BaseModel, Field
from typing import Optional

class CompanyCreateInput(BaseModel):
    name: str = Field(..., min_length=1)

    address_line_1: str = Field(..., min_length=1)
    city: str = Field(..., min_length=1)
    state: str = Field(..., min_length=1)
    pincode: str = Field(..., min_length=6, max_length=10)

    contact_name: str = Field(..., min_length=1)
    contact_role: str = Field(..., min_length=1)
    contact_phone: str = Field(..., min_length=10, max_length=15)

class CompanyUpdateInput(BaseModel):
    name: Optional[str] = None

    address_line_1: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None

    contact_name: Optional[str] = None
    contact_role: Optional[str] = None
    contact_phone: Optional[str] = None

