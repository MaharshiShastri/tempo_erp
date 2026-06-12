from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from argon2 import PasswordHasher as ph
import jwt
security_guard = HTTPBearer()
SECRET_KEY = "90c3a4911019f14026c2a184b46d375e104abedab94879b2c15a9635c26bb912"
def hash_password(password: str)->str:
    return ph.hash()

def verify_password(stored_hash: str, password: str) -> bool:
    try:
        return ph.verify(stored_hash, password)
    except:
        return False

def verify_bearer_token(credentials: HTTPAuthorizationCredentials = Depends(security_guard)):
    token = credentials.credentials
    print("TOKEN:", token)
    payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"] )
    return payload