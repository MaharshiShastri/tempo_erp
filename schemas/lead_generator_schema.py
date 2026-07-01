from pydantic import BaseModel
from typing import Optional, List

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

class MappedContact(BaseModel):
    full_name: str
    designation: str
    email: str
    is_priority: bool

class ApproveStagingPayload(BaseModel):
    contacts: List[MappedContact]