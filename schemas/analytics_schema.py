from pydantic import BaseModel

class SetTargetPayload(BaseModel):
    target: int