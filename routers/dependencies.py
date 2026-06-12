from fastapi import HTTPException, Depends
from security import verify_bearer_token
def check_department(required_dept: str):
    def dependency(user: dict = Depends(verify_bearer_token)):
        if user['department'] != required_dept and user['role'] not in ['Admin', 'Chief Full Stack Developer']:
            raise HTTPException(status_code=403, detail="Access Denied: Restricted Module")
        return user
    return dependency