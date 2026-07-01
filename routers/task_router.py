import shutil
import time
import os
from pathlib import Path
from typing import List
from fastapi import APIRouter, Depends, HTTPException, File, Form, UploadFile
from fastapi.responses import FileResponse, StreamingResponse
from database.repository import EDBR
from security import verify_bearer_token
from .dependencies import check_department
from schemas.task_schema import TaskUpdatePayload
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from io import BytesIO
from zipfile import ZipFile, ZIP_DEFLATED

router = APIRouter(prefix="/api/v1/tasks", tags=["Task Manager Subsystem"])

UPLOAD_DIR = Path("uploaded_task_attachments")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.get("", dependencies=[Depends(check_department("Shop Floor Administrator"))])
def get_all_tasks(user_profile: dict = Depends(verify_bearer_token)):
    return EDBR.get_tasks(user_email=user_profile["email"])

# NEW: Secure endpoint to serve task attachments
@router.get("/attachment/{file_name:path}", dependencies=[Depends(check_department("Shop Floor Administrator"))])
def get_task_attachment(file_name: str, user_profile: dict = Depends(verify_bearer_token)):
    # os.path.basename ensures we drop any nested folder paths (prevents path traversal attacks)
    clean_name = os.path.basename(file_name) 
    file_path = UPLOAD_DIR / clean_name
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Attachment file not found on the server.")
        
    return FileResponse(file_path, filename=clean_name)

@router.post("/create", dependencies=[Depends(check_department("Shop Floor Administrator"))])
async def create_new_task(title: str = Form(...), details: str = Form(...), direction: str = Form("dispatched"), deadline: str = Form(None), assigned_to: List[str] = Form(...), attachment: UploadFile = File(None), user_profile: dict = Depends(verify_bearer_token)):
    if not title.strip():
        raise HTTPException(status_code=400, detail="Metadata view header title required.")
    
    saved_file_path = None

    if attachment:
        try:
            unique_filename = f"{int(time.time())}_{attachment.filename}"
            file_location = UPLOAD_DIR / unique_filename
            
            with file_location.open("wb+") as buffer:
                shutil.copyfileobj(attachment.file, buffer)
            
            # Store just the filename to make the download URL cleaner
            saved_file_path = unique_filename
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save system attachment: {str(e)}")

    db_payload = {
        "title": title,
        "details": details,
        "direction": direction,
        "assigned_to": assigned_to,
        "attachment_url": saved_file_path,
        "deadline": deadline
    }

    new_task =  EDBR.create_task(db_payload, assigned_by=user_profile["email"])
    
    for email in assigned_to:
        EDBR.create_system_notification(user_email=email, title=f"New Task: {title}", message=details[:100] + "..." if len(details) > 100 else details,notif_type="TASK")

    return new_task
@router.post("/{task_id}/toggle", dependencies=[Depends(check_department("Shop Floor Administrator"))])
def toggle_task(task_id: int, user_profile: dict = Depends(verify_bearer_token)):
    try:
        return EDBR.toggle_task_status(task_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    
@router.put("/{task_id}", dependencies=[Depends(check_department("Shop Floor Administrator"))])
def edit_task(task_id: int, payload: TaskUpdatePayload, user: dict = Depends(verify_bearer_token)):
    try:
        return EDBR.update_task(task_id, payload.title, payload.details, payload.deadline, user["email"], user["role"])
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))

@router.delete("/{task_id}", dependencies=[Depends(check_department("Shop Floor Administrator"))])
def remove_task(task_id: int, user: dict = Depends(verify_bearer_token)):
    try:
        EDBR.delete_task(task_id, user["email"], user["role"])
        return {"status": "success"}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    
@router.get("/{task_id}/export-pdf", dependencies=[Depends(check_department("Shop Floor Administrator"))])
def export_task(task_id: int, user: dict = Depends(verify_bearer_token)):
    task = EDBR.get_task_by_id(task_id)

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # -----------------------------
    # Generate PDF in memory
    # -----------------------------
    pdf_buffer = BytesIO()
    c = canvas.Canvas(pdf_buffer, pagesize=letter)

    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, 750, f"Task Workflow Document: {task['title']}")

    c.setFont("Helvetica", 12)
    c.drawString(50, 720, f"Assigned By: {task['assigned_by']}")
    c.drawString(50, 700, f"Assigned To: {', '.join(task['assigned_to'])}")
    c.drawString(
        50,
        680,
        f"Status: {'Pending' if task['is_incomplete'] else 'Completed'}"
    )

    c.drawString(50, 640, "Task Details:")

    text = c.beginText(50, 620)
    text.setFont("Helvetica", 10)

    for line in task["details"].splitlines():
        text.textLine(line)

    c.drawText(text)

    if task.get("attachment_url"):
        c.setFont("Helvetica-Oblique", 10)
        c.drawString(
            50,
            120,
            f"Original attachment included in this ZIP: {task['attachment_url']}"
        )

    c.save()
    pdf_buffer.seek(0)

    # -----------------------------
    # Build ZIP in memory
    # -----------------------------
    zip_buffer = BytesIO()

    with ZipFile(zip_buffer, "w", ZIP_DEFLATED) as zip_file:

        # Add generated PDF
        zip_file.writestr(
            f"task_{task_id}_export.pdf",
            pdf_buffer.getvalue()
        )

        # Add original attachment if present
        if task.get("attachment_url"):

            attachment_file = Path(task["attachment_url"])

            if attachment_file.exists():
                zip_file.write(
                    attachment_file,
                    arcname=attachment_file.name
                )

    zip_buffer.seek(0)

    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={
            "Content-Disposition":
                f'attachment; filename="task_{task_id}_export.zip"'
        }
    )