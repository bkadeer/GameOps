from sqlalchemy import Column, String, DateTime, Enum as SQLEnum, JSON
from sqlalchemy.dialects.postgresql import UUID, INET, MACADDR
from sqlalchemy.sql import func
import uuid
import enum
from app.core.database import Base

class StationType(str, enum.Enum):
    PC = "PC"
    PS5 = "PS5"
    XBOX = "XBOX"
    SWITCH = "SWITCH"

class ControlMethod(str, enum.Enum):
    AGENT = "AGENT"
    SMART_PLUG = "SMART_PLUG"
    ROUTER = "ROUTER"

class StationStatus(str, enum.Enum):
    ONLINE = "ONLINE"
    OFFLINE = "OFFLINE"
    IN_SESSION = "IN_SESSION"
    MAINTENANCE = "MAINTENANCE"

class Station(Base):
    __tablename__ = "stations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, unique=True, index=True)
    station_type = Column(SQLEnum(StationType), nullable=False)
    location = Column(String(100))
    ip_address = Column(INET)
    mac_address = Column(MACADDR)
    control_method = Column(SQLEnum(ControlMethod), nullable=False)
    control_address = Column(String(255))  # Smart plug IP or router port
    status = Column(SQLEnum(StationStatus), default=StationStatus.OFFLINE, index=True)
    specs = Column(JSON)  # Hardware specs for PCs
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True, index=True)  # Soft delete
    
    def __repr__(self):
        return f"<Station {self.name} ({self.station_type})>"
