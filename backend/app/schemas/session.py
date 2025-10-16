from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.models.session import SessionStatus
from app.models.payment import PaymentMethod

class SessionBase(BaseModel):
    """Base session schema"""
    station_id: UUID
    user_id: Optional[UUID] = None
    duration_minutes: int = Field(
        ..., 
        ge=15, 
        le=480,
        description="Session duration in minutes (minimum 15, maximum 480)"
    )
    notes: Optional[str] = Field(None, max_length=500)
    
    @validator('duration_minutes')
    def validate_duration(cls, v):
        if v < 15:
            raise ValueError('Session duration must be at least 15 minutes')
        if v > 480:
            raise ValueError('Session duration cannot exceed 480 minutes (8 hours)')
        return v

class SessionCreate(SessionBase):
    """Create session schema"""
    payment_method: PaymentMethod
    amount: float = Field(
        ..., 
        ge=0, 
        le=1000,
        description="Payment amount (minimum 0, maximum 1000)"
    )
    
    @validator('amount')
    def validate_amount(cls, v):
        if v < 0:
            raise ValueError('Payment amount cannot be negative')
        if v > 1000:
            raise ValueError('Payment amount cannot exceed 1000')
        return v
    
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
    id: UUID
    started_at: datetime
    scheduled_end_at: datetime
    actual_end_at: Optional[datetime] = None
    extended_minutes: int
    status: SessionStatus
    payment_id: Optional[UUID] = None
    created_by: Optional[UUID] = None
    
    class Config:
        from_attributes = True
