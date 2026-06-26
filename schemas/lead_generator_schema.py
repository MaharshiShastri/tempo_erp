from pydantic import BaseModel
class TargetPayload(BaseModel):
    company_name: str
    domain: str
