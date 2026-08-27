from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query

from database.repository import SessionLocal

from schemas.production_schema import (
    ProductionScheduleCreate,
    ProductionScheduleUpdate,
)

from services.production_schedule_service import (
    get_production_schedules,
    create_production_schedule,
    update_production_schedule,
    delete_production_schedule,
)


router = APIRouter(
    prefix="/api/v1/production-schedules",
    tags=["Production Scheduling"],
)


@router.get("")
def list_schedules(
    from_datetime: datetime = Query(...),
    to_datetime: datetime = Query(...),
    stage_code: str | None = None,
    assigned_team: str | None = None,
    status: str | None = None,
):

    if to_datetime < from_datetime:
        raise HTTPException(
            status_code=400,
            detail="to_datetime cannot be before from_datetime.",
        )

    with SessionLocal() as session:

        return get_production_schedules(
            session=session,
            from_datetime=from_datetime,
            to_datetime=to_datetime,
            stage_code=stage_code,
            assigned_team=assigned_team,
            status=status,
        )


@router.post("")
def create_schedule(
    payload: ProductionScheduleCreate,
):

    try:

        with SessionLocal() as session:

            return create_production_schedule(
                session=session,
                order_acceptance_id=payload.order_acceptance_id,
                stage_code=payload.stage_code,
                planned_start=payload.planned_start,
                planned_end=payload.planned_end,
                priority=payload.priority,
                assigned_team=payload.assigned_team,
                status=payload.status,
            )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )


@router.patch("/{schedule_id}")
def update_schedule(
    schedule_id: int,
    payload: ProductionScheduleUpdate,
):

    try:

        with SessionLocal() as session:

            return update_production_schedule(
                session=session,
                schedule_id=schedule_id,
                **payload.model_dump(
                    exclude_unset=True
                ),
            )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )


@router.delete("/{schedule_id}")
def delete_schedule(
    schedule_id: int,
):

    try:

        with SessionLocal() as session:

            return delete_production_schedule(
                session=session,
                schedule_id=schedule_id,
            )

    except ValueError as exc:

        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )