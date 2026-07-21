from typing import Iterable
from fastapi import HTTPException, Depends, Request
from security import verify_bearer_token
from database.repository import EDBR


def check_department(required_roles: Iterable[str]):
    def dependency(request: Request, user: dict = Depends(verify_bearer_token)):
        role = user.get("role")
        user_email = user.get("email")
        user_name = user.get("name", "Unknown")
        route_path = request.url.path

        # Audit logging
        try:
            EDBR.log_system_action(user_email, user_name, route_path)
        except Exception as e:
            print(f"Audit Log Warning: {e}")

        # Superusers always allowed
        if role in ("Admin", "Chief Full Stack Developer"):
            return user

        # RBAC
        if role not in required_roles:
            raise HTTPException(status_code=403, detail="Access Denied: Restricted Module")

        return user

    return dependency