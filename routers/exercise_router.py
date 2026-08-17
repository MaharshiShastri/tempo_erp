from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from io import BytesIO

from schemas.exercise_schema import ExerciseGeneratePayload
from database.repository import EDBR
from security import verify_bearer_token
from .dependencies import check_department
from services.exercise_document_service import generate_exercise_document

import re


router = APIRouter(prefix="/api/v1/exercises", tags=["Exercise Document Generation"],)

@router.get("/users", dependencies=[Depends(check_department("Admin"))],)
def get_exercise_users(role: str | None = None, user_profile: dict = Depends(verify_bearer_token),):

    clean_role = role.strip() if role else None

    return EDBR.get_users_for_exercise(role=clean_role)

@router.post(
    "/generate",
    dependencies=[Depends(check_department("Admin"))],
)
def generate_exercise(
    payload: ExerciseGeneratePayload,
    user_profile: dict = Depends(verify_bearer_token),
):
    exercise_name = (
        payload.exercise_name or ""
    ).strip()

    person_email = (
        payload.person_email or ""
    ).strip()

    role = (
        payload.role or ""
    ).strip()

    # ---------------------------------------------------------
    # Exercise name is mandatory.
    # ---------------------------------------------------------

    if not exercise_name:
        raise HTTPException(
            status_code=400,
            detail="Exercise name is required.",
        )

    # ---------------------------------------------------------
    # Resolve people
    #
    # person selected -> one person
    # role selected   -> all users in role
    # neither         -> all users
    # ---------------------------------------------------------

    if person_email:

        person = EDBR.get_user_for_exercise(
            person_email=person_email,
            role=role or None,
        )

        if not person:
            raise HTTPException(
                status_code=404,
                detail="Selected ERP user was not found.",
            )

        people = [person]

    else:

        people = EDBR.get_users_for_exercise(
            role=role or None,
        )

    if not people:
        raise HTTPException(
            status_code=404,
            detail=(
                "No ERP users were found for "
                f"{role or 'All Roles'}."
            ),
        )

    # ---------------------------------------------------------
    # Collect names
    # ---------------------------------------------------------

    person_names = []

    for person in people:

        person_name = (
            person.get("name") or ""
        ).strip()

        if person_name:
            person_names.append(
                person_name
            )

    if not person_names:
        raise HTTPException(
            status_code=404,
            detail="No valid ERP user names were found.",
        )

    # ---------------------------------------------------------
    # Generate ONE common document
    # ---------------------------------------------------------

    try:

        document = generate_exercise_document(
            exercise_name=exercise_name,
            person_names=person_names,
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except FileNotFoundError as exc:

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to generate exercise document: "
                f"{str(exc)}"
            ),
        )

    # ---------------------------------------------------------
    # Filename
    # ---------------------------------------------------------

    safe_exercise_name = re.sub(
        r"[^a-zA-Z0-9_-]+",
        "_",
        exercise_name,
    ).strip("_")

    filename = (
        f"Exercise_{safe_exercise_name}.docx"
    )

    return StreamingResponse(
        document,
        media_type=(
            "application/vnd.openxmlformats-officedocument."
            "wordprocessingml.document"
        ),
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            ),
        },
    )
@router.get("/roles", dependencies=[Depends(check_department("Admin"))],)
def get_exercise_roles(user_profile: dict = Depends(verify_bearer_token),):
    return EDBR.get_exercise_roles()