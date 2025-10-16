from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class Token(BaseModel):
    """Token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

class TokenData(BaseModel):
    """Token payload data"""
    username: Optional[str] = None
    user_id: Optional[str] = None
    role: Optional[str] = None

class PasswordResetRequest(BaseModel):
    """Password reset request schema"""
    identifier: str  # Can be email or username

class PasswordResetConfirm(BaseModel):
    """Password reset confirmation schema"""
    token: str
    new_password: str = Field(..., min_length=8, max_length=100)
