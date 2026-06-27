from pydantic import BaseModel, Field
from typing import Optional

class ItemMasterCreate(BaseModel):
    item_code: str = Field(..., min_length=1, description="Unique Product Code")
    item_name: str = Field(..., min_length=1, description="Product Name/Description")
    item_group: str = Field(default="General", description="Product Group/Category")
    rate: float = Field(0.0, ge=0.0, description="Product Price")
    unit_measure: str = Field(default="in", min_length=1, description="Unit of Measurement")
    additional_spec_text: Optional[str] = Field(default="")
    hsn_code: Optional[str] = Field(default="")
    revision_no: Optional[str] = Field(default="")

class ItemMasterUpdate(BaseModel):
    item_name: Optional[str] = None
    item_group: Optional[str] = None
    rate: Optional[float] = None
    unit_measure: Optional[str] = None
    additional_spec_text: Optional[str] = None
    hsn_code: Optional[str] = None
    revision_no: Optional[str] = None