from pydantic import BaseModel, Field
from datetime import date
from typing import Optional, Literal

class SpecialModelRow(BaseModel):
    values: list[str] = Field(default_factory=list)


class QuoteGenerationRequest(BaseModel):
    product_group: str
    item_code: str | None = None
    qoute_number: str

    client_company: str
    client_address_line1: str
    client_city: str
    client_postal_code: str

    client_email: str
    buyer_name: str
    buyer_phone_number: str

    date_input: date

    supply: str
    installation: str
    freight: str

    dealer: bool = False

    special_model: bool = False

    special_columns: list[str] = Field(default_factory=list)
    special_rows: list[SpecialModelRow] = Field(default_factory=list)

    base_model_price: float = Field(..., ge=0)

    packing_mode: Literal["INCLUSIVE", "ACTUAL"] = "INCLUSIVE"
    packing_amount: float | None = Field(default=None, ge=0)

    freight_mode: Literal["INCLUSIVE", "ACTUAL"] = "INCLUSIVE"
    freight_amount: float | None = Field(default=None, ge=0)

    tax_rate: float = Field(default=18.0, ge=0,)
class QuotationUpdateRequest(BaseModel):
    product_group: Optional[str] = None

    client_company: Optional[str] = None
    client_address_line1: Optional[str] = None
    client_city: Optional[str] = None
    client_postal_code: Optional[str] = None

    client_email: Optional[str] = None

    buyer_name: Optional[str] = None
    buyer_phone_number: Optional[str] = None

    enquiry_date: Optional[date] = None

    supply: Optional[str] = None
    installation: Optional[str] = None
    freight: Optional[str] = None

    is_dealer: Optional[bool] = None
    is_special_model: Optional[bool] = None

    base_model_price: Optional[float] = Field(default=None, ge=0)

    packing_mode: Optional[Literal["INCLUSIVE", "ACTUAL"]] = None
    packing_amount: Optional[float] = Field(default=None, ge=0)

    freight_mode: Optional[Literal["INCLUSIVE", "ACTUAL"]] = None
    freight_amount: Optional[float] = Field(default=None, ge=0)

    tax_rate: Optional[float] = Field(default=None, ge=0,)
    
class QuotationChangeSnapshotRequest(BaseModel):

    quoted_product_group: str
    quoted_item_code: Optional[str] = None
    quoted_quantity: Optional[float] = None
    quoted_rate: Optional[float] = None

    ordered_product_group: Optional[str] = None
    ordered_item_code: Optional[str] = None
    ordered_quantity: Optional[float] = None
    ordered_rate: Optional[float] = None


class QuotationStatusUpdateRequest(BaseModel):

    status: str = Field(..., pattern="^(ORDERED|REJECTED|CHANGED)$",)

    converted_order_id: Optional[int] = None

    snapshot: Optional[QuotationChangeSnapshotRequest] = None