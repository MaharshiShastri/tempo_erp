from pydantic import BaseModel, model_validator
from datetime import date

class SetTargetPayload(BaseModel):
    target: float
    from_date: date
    to_date: date

    @model_validator(mode="after")
    def validate_target_period(self):
        if self.target <= 0:
            raise ValueError("Target must be greater than zero.")

        if self.from_date > self.to_date:
            raise ValueError("Start date should be greater than or equal to end date.")

        return self

    