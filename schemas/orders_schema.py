from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date
from uuid import UUID

class CompanyCreateInput(BaseModel):
    name: str = Field(..., min_length=1, description="Legal Registered Name")
    address_line_1: str = Field(..., min_length=1)
    city: str = Field(..., min_length=1)
    state: str = Field(..., min_length=1)
    pincode: str = Field(..., min_length=6, max_length=6)
    contact_name: str = Field(..., min_length=1)
    contact_role: str = Field(..., min_length=1)
    contact_phone: str = Field(..., min_length=10, max_length=15)
    
class OrderItemCreate(BaseModel):
    item_code: str = Field(..., min_length=1)
    additional_spec_text: str = Field(..., min_length=1)
    hsn_code: str = Field(..., min_length=4, max_length=8)
    quantity: int = Field(..., gt=0)
    unit_measure: str = Field(..., min_length=1)
    rate: float = Field(..., ge=0.0)
    discount_percentage: float = Field(0.0, ge=0.0, le=100.0)

class StageUpdatePayload(BaseModel):
    stage: str

class OrderHeaderCreate(BaseModel):
    order_acceptance_id: UUID  # Strict structural UUID verification pattern enforced
    order_acceptance_date: date
    purchase_order_number: str = Field(..., min_length=1)
    purchase_order_date: date
    customer_code: str = Field(..., min_length=1)
    payment_terms: Optional[str] = ""
    billing_name: str = Field(..., min_length=1)
    billing_address: str = Field(..., min_length=1)
    dispatched_through: Optional[str] = ""
    delivery_terms: Optional[str] = ""
    due_date: date
    items: List[OrderItemCreate]