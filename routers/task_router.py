import shutil
import time
from pathlib import Path
from typing import List
from fastapi import APIRouter, Depends, HTTPException, File, Form, UploadFile
from database.repository import EDBR
from security import verify_bearer_token
from .dependencies import check_department

router = APIRouter(prefix="/api/v1/tasks", tags=["Task Manager Subsystem"])

# Define storage directory for your attachments
UPLOAD_DIR = Path("uploaded_task_attachments")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.get("", dependencies=[Depends(check_department("Shop Floor Administrator"))])
def get_all_tasks(user_profile: dict = Depends(verify_bearer_token)):
    return EDBR.get_tasks(user_email=user_profile["email"])

@router.post("/create", dependencies=[Depends(check_department("Shop Floor Administrator"))])
async def create_new_task(title: str = Form(...), details: str = Form(...), direction: str = Form("dispatched"), deadline: str = Form(None), assigned_to: List[str] = Form(...), attachment: UploadFile = File(None), user_profile: dict = Depends(verify_bearer_token)):
    if not title.strip():
        raise HTTPException(status_code=400, detail="Metadata view header title required.")
    
    saved_file_path = None

    # Process and save the file securely if provided
    if attachment:
        try:
            # Timestamp prepended to avoid file name collisions
            unique_filename = f"{int(time.time())}_{attachment.filename}"
            file_location = UPLOAD_DIR / unique_filename
            
            with file_location.open("wb+") as buffer:
                shutil.copyfileobj(attachment.file, buffer)
            
            saved_file_path = str(file_location)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save system attachment: {str(e)}")

    # Reconstruct payload structure expected by your database repository
    db_payload = {
        "title": title,
        "details": details,
        "direction": direction,
        "assigned_to": assigned_to,
        "attachment_path": saved_file_path,
        "deadline": deadline
    }

    return EDBR.create_task(db_payload, assigned_by=user_profile["email"])

@router.post("/{task_id}/toggle", dependencies=[Depends(check_department("Shop Floor Administrator"))])
def toggle_task(task_id: int, user_profile: dict = Depends(verify_bearer_token)):
    try:
        return EDBR.toggle_task_status(task_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))