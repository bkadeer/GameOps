from sqlalchemy import Column, String, DateTime, Enum as SQLEnum, ForeignKey, Numeric, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
import enum
from app.core.database import Base

class PaymentMethod(str, enum.Enum):
    CASH = "CASH"
    CARD = "CARD"
    BALANCE = "BALANCE"
    ONLINE = "ONLINE"

class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_name = Column(String(255), nullable=True, index=True)  # Track who made the payment
    station_id = Column(UUID(as_uuid=True), ForeignKey("stations.id"), nullable=True, index=True)  # Track revenue per station
    amount = Column(Numeric(10, 2), nullable=False)
    payment_method = Column(SQLEnum(PaymentMethod), nullable=False)
    transaction_id = Column(String(255), nullable=True)
    status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING, index=True)
    payment_metadata = Column(JSON)  # For future use: refund info, promo codes, split payments, etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<Payment {self.id} - {self.amount} ({self.status})>"
