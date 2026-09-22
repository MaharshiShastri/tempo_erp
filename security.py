import os

from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError
import jwt
from jwt import ExpiredSignatureError, InvalidTokenError

security_guard = HTTPBearer()
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ph = PasswordHasher()
if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY variable is not configured")

ALGORITHM = os.getenv("ALGORITHM")

def hash_password(password: str)->str:
    cryptic_pass = ph.hash(password=password)
    return cryptic_pass

def verify_password(stored_hash: str, password: str) -> bool:
    try:
        return ph.verify(stored_hash, password)
    except (VerificationError, InvalidHashError):
        return False

def verify_bearer_token(credentials: HTTPAuthorizationCredentials = Depends(security_guard)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM] )
        return payload
    
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session Expired")
    
    except InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid Token")