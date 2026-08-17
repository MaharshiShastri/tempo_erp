from pydantic import BaseModel, Field
from typing import Optional


class ExerciseGeneratePayload(BaseModel):
    exercise_name: str = Field(..., min_length=1)
    person_email: Optional[str] = None
    role: Optional[str] = None