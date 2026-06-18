from fastapi import APIRouter, HTTPException, Depends
from schemas.auth_schema import LoginInput, UserProfileResponse, UserCreateInput, UserUpdateInput
from database.repository import EDBR
from security import verify_bearer_token, SECRET_KEY
import jwt
import logging
from datetime import datetime, timedelta, timezone

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/auth", tags=["Authentication Layer"])

@router.post("/login")
def login_session_gate(payload: LoginInput):
    if not payload.email.strip() or not payload.password.strip():
        raise HTTPException(status_code=400, detail="Incomplete credentials")
    try:
        logger.info(f"Login Attempt for email: {payload.email}")
        user = EDBR.get_user(payload.email, payload.password)

        if not user:
            raise ValueError("No user matched these credentials.")
        
        logger.info(f"User validated successfully.")

        jwt_payload = {"email": user['email'], "role": user['role'], "department": user.get('department', 'General'), "exp": datetime.now(timezone.utc) + timedelta(hours=9.5)}
        token = jwt.encode(jwt_payload, SECRET_KEY, algorithm="HS256")

        if user:
            return{
                "email": user["email"], "name": user["name"], "role": user["role"], "department": user.get("department", "General"),
                "access_token": token
            }
    
    except ValueError as ve:
        logger.warning(f"Login failed: {str(ve)}")
        raise HTTPException(status_code=401, detail="Invalid corporate credentials")
    except Exception as e:  
        print("User lookup failed")  
        logger.warning("User lookup failed")
        raise HTTPException(status_code=401, detail="Invalid corporate credentials parameter profile.")

@router.get("/users")
def get_system_users(user_profile: dict = Depends(verify_bearer_token)):
    return EDBR.get_all_users()

@router.post("/users/create")
def register_new_user(payload: UserCreateInput, user_profile: dict = Depends(verify_bearer_token)):
    if user_profile["role"] not in ["Chief Full Stack Developer", "Admin"]:
        raise HTTPException(status_code=403, detail="RBAC Violation: Insufficient clearance.")
    
    try:
        return EDBR.create_user(payload.dict())
    except Exception as e:
        raise HTTPException(status_code=400, detail="User email already exists or invalid data.")
    
@router.put("/users/{email}")
def update_user_profile(email: str, payload: UserUpdateInput, user_profile: dict = Depends(verify_bearer_token)):
    if user_profile["role"] not in ["Chief Full Stack Developer", "Admin"]:
        raise HTTPException(status_code=403, detail="RBAC Violation: Insufficient clearance.")
    try:
        return EDBR.update_user(email, payload.dict())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/users/{email}")
def delete_system_user(email: str, user_profile: dict = Depends(verify_bearer_token)):
    if user_profile["role"] not in ["Chief Full Stack Developer", "Admin"]:
        raise HTTPException(status_code=403, detail="RBAC Violation: Insufficient clearance.")
    
    # Security guard to prevent an admin from accidentally deleting their own active session
    if email == user_profile["email"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own active session account.")
        
    try:
        return EDBR.delete_user(email)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))