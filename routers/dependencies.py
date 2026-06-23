from fastapi import HTTPException, Depends
from security import verify_bearer_token

def check_department(required_role: str):
    def dependency(user: dict = Depends(verify_bearer_token)):

        role = user.get("role")
        print("ROLE =", user.get("role"))
        print("REQUIRED =", required_role)
        # Superusers bypass RBAC
        if role in ["Admin", "Chief Full Stack Developer"]:
            return user

        if role != required_role:
            raise HTTPException(
                status_code=403,
                detail="Access Denied: Restricted Module"
            )

        return user

    return dependency