from datetime import datetime

from pydantic import BaseModel, Field


class ProductionScheduleCreate(BaseModel):

    order_acceptance_id: str 

    stage_code: str

    planned_start: datetime

    planned_end: datetime

    priority: int = 0

    assigned_team: str | None = None

    status: str = "PLANNED"


class ProductionScheduleUpdate(BaseModel):

    order_acceptance_id: int | None = None

    stage_code: str | None = None

    planned_start: datetime | None = None

    planned_end: datetime | None = None

    actual_start: datetime | None = None

    actual_end: datetime | None = None

    priority: int | None = None

    assigned_team: str | None = None

    status: str | None = None


class ProductionScheduleResponse(BaseModel):

    id: int

    order_id: int

    order_acceptance_id: str | None = None

    client_name: str | None = None

    stage_code: str

    planned_start: datetime

    planned_end: datetime

    actual_start: datetime | None = None

    actual_end: datetime | None = None

    priority: int

    assigned_team: str | None = None

    status: str

    created_by: str | None = None

    created_at: datetime | None = None