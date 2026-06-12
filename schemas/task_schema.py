from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1)
    details: str
    direction: str = Field(..., description="'received' or 'dispatched'")

class TaskResponse(BaseModel):
    id: int
    title: str
    details: str
    direction: str
    is_incomplete: bool  # True = Incomplete (ON), False = Completed (OFF)
    created_at: str