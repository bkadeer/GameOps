from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
from app.models.session import SessionStatus
from app.models.payment import PaymentMethod

class SessionBase(BaseModel):
    """Base session schema"""
    station_id: str = Field(..., pattern=r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
    user_id: Optional[str] = Field(None, pattern=r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
    duration_minutes: int = Field(..., ge=15, le=480)
    notes: Optional[str] = Field(None, max_length=500)

class SessionCreate(SessionBase):
    """Create session schema"""
    payment_method: PaymentMethod
    amount: float = Field(..., ge=0, le=1000)
    
    @validator('notes')
    def sanitize_notes(cls, v):
        if v:
            # Remove potential XSS
            import re
            v = re.sub(r'<[^>]*>', '', v)
            v = re.sub(r'(--|;|\'|\")', '', v)
        return v

class SessionExtend(BaseModel):
    """Extend session schema"""
    additional_minutes: int = Field(..., ge=15, le=240)
    payment_method: PaymentMethod
    amount: float = Field(..., ge=0, le=500)

class SessionUpdate(BaseModel):
    """Update session schema"""
    status: Optional[SessionStatus] = None
    notes: Optional[str] = None

class SessionResponse(SessionBase):
    """Session response schema"""
    id: str
    started_at: datetime
    scheduled_end_at: datetime
    actual_end_at: Optional[datetime] = None
    extended_minutes: int
    status: SessionStatus
    payment_id: Optional[str] = None
    created_by: Optional[str] = None
    
    class Config:
        from_attributes = True
