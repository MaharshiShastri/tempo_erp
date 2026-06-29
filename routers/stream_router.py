from fastapi import APIRouter, Depends, Request
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
import asyncio
import json
from security import verify_bearer_token
from database.repository import EDBR

router = APIRouter(prefix="/api/v1/stream", tags=["Unified SSE Stream"])

async def event_generator(request: Request, user_email: str, user: dict = Depends(verify_bearer_token)):
    """
    Unified SSE stream. 
    1. Sends a heartbeat ping every 15 seconds so the client knows the server is alive.
    2. Polls the database for unread notifications specific to the user.
    """
    try:
        while True:
            # If client disconnects, break the loop
            if await request.is_disconnected():
                break

            # 1. Fetch unread notifications for this specific user
            with EDBR._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT id, title, message, type, created_at 
                        FROM system_notifications 
                        WHERE user_email = %s AND is_read = FALSE
                        ORDER BY created_at ASC
                    """, (user_email,))
                    notifications = cur.fetchall()

                    for notif in notifications:
                        # Yield the notification to the frontend
                        payload = json.dumps({
                            "id": notif["id"],
                            "title": notif["title"],
                            "message": notif["message"],
                            "type": notif["type"],
                            "timestamp": notif["created_at"].isoformat()
                        })
                        yield f"data: {payload}\n\n"
                        
                        # Mark as read immediately after sending so it doesn't duplicate
                        cur.execute("UPDATE system_notifications SET is_read = TRUE WHERE id = %s", (notif["id"],))
                    conn.commit()

            # 2. System Pulse / Heartbeat (Keeps connection alive and proves server status)
            yield f"data: {json.dumps({'type': 'SYSTEM_PULSE', 'message': 'alive'})}\n\n"

            # Wait 5 seconds before checking again (adjustable based on server load)
            await asyncio.sleep(5)

    except asyncio.CancelledError:
        pass

@router.get("/events")
async def sse_endpoint(request: Request, token: str):
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    user = verify_bearer_token(creds)
    return StreamingResponse(event_generator(request, user["email"]), media_type="text/event-stream")