from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import date
from enum import Enum

class LoginInput(BaseModel):
    email: EmailStr
    password: str

class UserCreateInput(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: str
    dob: Optional[date] = None
    phone_personal: Optional[str] = ""
    phone_business: Optional[str] = ""
    regions: List[str] = []

class UserProfileResponse(BaseModel):
    email: str
    name: str
    role: str
    access_token: str

class UserUpdateInput(BaseModel):
    name: str
    password: Optional[str] = None
    role: str
    dob: Optional[date] = None
    phone_personal: Optional[str] = ""
    phone_business: Optional[str] = ""
    regions: List[str] = []

class PromptLLM(str, Enum):
    CHATGPT = "chatgpt"
    CLAUDE = "claude"
    GEMINI = "gemini"
    GROK = "grok"
    DEEPSEEK = "deepseek"
    LLAMA = "llama"


class PromptType(str, Enum):
    SYSTEM = "system"
    NORMAL = "normal"


class PromptGeneratorRequest(BaseModel):
    requirements: str = Field(..., min_length=10, max_length=10000,)

    llm: PromptLLM

    prompt_type: PromptType