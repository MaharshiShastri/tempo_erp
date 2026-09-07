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
    details: Optional[str] = None
    direction: Optional[str] = None
    is_incomplete: bool  # True = Incomplete (ON), False = Completed (OFF)
    assigned_by: Optional[str] = None
    assigned_to: list[str] = []
    created_at: Optional[datetime] = None
    attachment_urls: list[str] = []
    deadline: Optional[datetime] = None
    completed_at: Optional[datetime] = None
