from pydantic import BaseModel
from typing import Optional

class TargetPayload(BaseModel):
    company_name: str
    domain: Optional[str] = ""

class EmailGenPayload(BaseModel):
    contact_name: str
    designation: str
    company_name: str
    item_name: str
    item_specs: str
    feedback: Optional[str] = None
    previous_draft: Optional[str] = None