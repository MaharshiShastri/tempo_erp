from fastapi import APIRouter, HTTPException, Depends
from schemas.auth_schema import LoginInput, UserProfileResponse, UserCreateInput
from database.repository import EDBR
from security import verify_bearer_token, SECRET_KEY
import jwt
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/auth", tags=["Authentication Layer"])

@router.post("/login")
def login_session_gate(payload: LoginInput):
    try:
        print(f"Email Id: {payload.email} and password: {payload.password}")
        logger.info(f"Email Id: {payload.email} and password: {payload.password}")
        user = EDBR.get_user(payload.email, payload.password)
        print(f"Found users")
        logger.info(f"Found users")
        jwt_payload = {"email": user['email'], "role": user['role'], "department": user.get('department', 'General')}
        token = jwt.encode(jwt_payload, SECRET_KEY, algorithm="HS256")
        if user:
            return{
                "email": user["email"], "name": user["name"], "role": user["role"], "department": user.get("department", "General"),
                "access_token": token
            }
        
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