from pydantic import BaseModel
from typing import Optional
class TargetPayload(BaseModel):
    company_name: str
    domain: Optional[str] = ""
