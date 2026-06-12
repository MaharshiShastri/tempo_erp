from fastapi import APIRouter, Depends, HTTPException
from database.repository import EDBR
from security import verify_bearer_token
from .dependencies import check_department

router = APIRouter(prefix="/api/v1/tasks", tags=["Task Manager Subsystem"])

@router.get("", dependencies=[Depends(check_department("Factory"))])
def get_all_tasks(user_profile: dict = Depends(verify_bearer_token)):
    return EDBR.get_tasks(user_email=user_profile["email"])

@router.post("/create", dependencies=[Depends(check_department("Factory"))])
def create_new_task(payload: dict, user_profile: dict = Depends(verify_bearer_token)):
    if "title" not in payload or not payload["title"].strip():
        raise HTTPException(status_code=400, detail="Metadata view header title required.")
    return EDBR.create_task(payload, assigned_by=user_profile["email"])

@router.post("/{task_id}/toggle", dependencies=[Depends(check_department("Factory"))])
def toggle_task(task_id: int, user_profile: dict = Depends(verify_bearer_token)):
    try:
        return EDBR.toggle_task_status(task_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))