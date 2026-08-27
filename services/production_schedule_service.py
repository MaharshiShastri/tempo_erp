from __future__ import annotations

from datetime import datetime

from sqlalchemy import select, and_
from sqlalchemy.orm import Session

from database.models import (
    ProductionSchedule,
    OrderHeader,
    ProductionStage,
)


VALID_STATUSES = {
    "PLANNED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
    "ON_HOLD",
}


def _serialize_schedule(schedule: ProductionSchedule) -> dict:
    order = schedule.order

    return {
        "id": schedule.id,

        "order_id": schedule.order_id,

        "order_acceptance_id": (
            order.order_acceptance_id
            if order
            else None
        ),

        "client_name": (
            order.billing_name
            if order
            else None
        ),

        "stage_code": schedule.stage_code,

        "planned_start": (
            schedule.planned_start.isoformat()
            if schedule.planned_start
            else None
        ),

        "planned_end": (
            schedule.planned_end.isoformat()
            if schedule.planned_end
            else None
        ),

        "actual_start": (
            schedule.actual_start.isoformat()
            if schedule.actual_start
            else None
        ),

        "actual_end": (
            schedule.actual_end.isoformat()
            if schedule.actual_end
            else None
        ),

        "priority": schedule.priority,

        "assigned_team": schedule.assigned_team,

        "status": schedule.status,

        "created_by": schedule.created_by,

        "created_at": (
            schedule.created_at.isoformat()
            if schedule.created_at
            else None
        ),
    }


def get_production_schedules(
    session: Session,
    from_datetime: datetime,
    to_datetime: datetime,
    stage_code: str | None = None,
    assigned_team: str | None = None,
    status: str | None = None,
) -> list[dict]:

    conditions = [
        # Calendar overlap logic:
        #
        # schedule starts before requested window ends
        # AND
        # schedule ends after requested window starts
        ProductionSchedule.planned_start <= to_datetime,
        ProductionSchedule.planned_end >= from_datetime,
    ]

    if stage_code:
        conditions.append(
            ProductionSchedule.stage_code == stage_code
        )

    if assigned_team:
        conditions.append(
            ProductionSchedule.assigned_team
            == assigned_team
        )

    if status:
        conditions.append(
            ProductionSchedule.status == status
        )

    stmt = (
        select(ProductionSchedule)
        .join(
            OrderHeader,
            OrderHeader.order_id
            == ProductionSchedule.order_id,
        )
        .where(and_(*conditions))
        .order_by(
            ProductionSchedule.planned_start,
            ProductionSchedule.priority.desc(),
            ProductionSchedule.id,
        )
    )

    schedules = session.scalars(stmt).all()

    return [
        _serialize_schedule(schedule)
        for schedule in schedules
    ]


def create_production_schedule(
    session: Session,
    *,
    order_acceptance_id: str,
    stage_code: str,
    planned_start: datetime,
    planned_end: datetime,
    priority: int = 0,
    assigned_team: str | None = None,
    status: str = "PLANNED",
    created_by: str | None = None,
) -> dict:

    if planned_end < planned_start:
        raise ValueError(
            "planned_end cannot be before planned_start."
        )

    status = status.upper().strip()

    if status not in VALID_STATUSES:
        raise ValueError(
            f"Invalid schedule status: {status}"
        )

    # ---------------------------------------------------------
    # Validate order
    # ---------------------------------------------------------

    order = session.query(OrderHeader).filter(OrderHeader.order_acceptance_id == order_acceptance_id).first()

    if not order:
        raise ValueError(
            f"Order {order_acceptance_id} not found."
        )

    # ---------------------------------------------------------
    # Validate production stage
    # ---------------------------------------------------------

    stage = session.get(
        ProductionStage,
        stage_code,
    )

    if not stage:
        raise ValueError(
            f"Production stage {stage_code!r} not found."
        )

    # ---------------------------------------------------------
    # Create
    # ---------------------------------------------------------

    schedule = ProductionSchedule(
        order_id=order.order_id,
        stage_code=stage_code,
        planned_start=planned_start,
        planned_end=planned_end,
        priority=priority,
        assigned_team=assigned_team,
        status=status,
        created_by=created_by,
    )

    session.add(schedule)
    session.commit()
    session.refresh(schedule)

    return _serialize_schedule(schedule)


def update_production_schedule(
    session: Session,
    schedule_id: int,
    *,
    order_id: int | None = None,
    stage_code: str | None = None,
    planned_start: datetime | None = None,
    planned_end: datetime | None = None,
    actual_start: datetime | None = None,
    actual_end: datetime | None = None,
    priority: int | None = None,
    assigned_team: str | None = None,
    status: str | None = None,
) -> dict:

    schedule = session.get(
        ProductionSchedule,
        schedule_id,
    )

    if not schedule:
        raise ValueError(
            f"Production schedule {schedule_id} not found."
        )

    # ---------------------------------------------------------
    # Resolve final values before validation
    # ---------------------------------------------------------

    final_order_id = (
        order_id
        if order_id is not None
        else schedule.order_id
    )

    final_stage_code = (
        stage_code
        if stage_code is not None
        else schedule.stage_code
    )

    final_start = (
        planned_start
        if planned_start is not None
        else schedule.planned_start
    )

    final_end = (
        planned_end
        if planned_end is not None
        else schedule.planned_end
    )

    if final_end < final_start:
        raise ValueError(
            "planned_end cannot be before planned_start."
        )

    # ---------------------------------------------------------
    # Validate references
    # ---------------------------------------------------------

    if order_id is not None:

        order = session.get(
            OrderHeader,
            final_order_id,
        )

        if not order:
            raise ValueError(
                f"Order {final_order_id} not found."
            )

    if stage_code is not None:

        stage = session.get(
            ProductionStage,
            final_stage_code,
        )

        if not stage:
            raise ValueError(
                f"Production stage "
                f"{final_stage_code!r} not found."
            )

    if status is not None:

        status = status.upper().strip()

        if status not in VALID_STATUSES:
            raise ValueError(
                f"Invalid schedule status: {status}"
            )

    # ---------------------------------------------------------
    # Apply changes
    # ---------------------------------------------------------

    if order_id is not None:
        schedule.order_id = order_id

    if stage_code is not None:
        schedule.stage_code = stage_code

    if planned_start is not None:
        schedule.planned_start = planned_start

    if planned_end is not None:
        schedule.planned_end = planned_end

    if actual_start is not None:
        schedule.actual_start = actual_start

    if actual_end is not None:
        schedule.actual_end = actual_end

    if priority is not None:
        schedule.priority = priority

    if assigned_team is not None:
        schedule.assigned_team = assigned_team

    if status is not None:
        schedule.status = status

    session.commit()
    session.refresh(schedule)

    return _serialize_schedule(schedule)


def delete_production_schedule(
    session: Session,
    schedule_id: int,
) -> dict:

    schedule = session.get(
        ProductionSchedule,
        schedule_id,
    )

    if not schedule:
        raise ValueError(
            f"Production schedule {schedule_id} not found."
        )

    session.delete(schedule)
    session.commit()

    return {
        "id": schedule_id,
        "deleted": True,
    }