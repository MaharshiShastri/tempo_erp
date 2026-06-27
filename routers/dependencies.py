from fastapi import HTTPException, Depends, Request
from security import verify_bearer_token
from database.repository import EDBR

def check_department(required_role: str):
    # We add Request to inspect the endpoint URL automatically
    def dependency(request: Request, user: dict = Depends(verify_bearer_token)):
        
        role = user.get("role")
        user_email = user.get("email")
        user_name = user.get("name", "Unknown")
        route_path = request.url.path

        # 1. Log the action to the Audit Table
        try:
            EDBR.log_system_action(user_email, user_name, route_path)
        except Exception as e:
            print(f"Audit Log Warning: {e}")

        # 2. Process RBAC (Role-Based Access Control)
        if role in ["Admin", "Chief Full Stack Developer"]:
            return user

        if role != required_role:
            raise HTTPException(status_code=403, detail="Access Denied: Restricted Module")

        return user

    return dependency