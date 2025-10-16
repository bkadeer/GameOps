from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from app.models.payment import PaymentMethod, PaymentStatus

class PaymentBase(BaseModel):
    """Base payment schema"""
    user_id: Optional[str] = None
    amount: float = Field(..., ge=0, le=10000)
    payment_method: PaymentMethod
    payment_metadata: Optional[Dict[str, Any]] = None

class PaymentCreate(PaymentBase):
    """Create payment schema"""
    pass

class PaymentResponse(PaymentBase):
    """Payment response schema"""
    id: str
    transaction_id: Optional[str] = None
    status: PaymentStatus
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
