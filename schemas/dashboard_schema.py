from pydantic import BaseModel
class ManualLogPayload(BaseModel):
    message: str