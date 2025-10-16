from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any
from datetime import datetime
from app.models.station import StationType, ControlMethod, StationStatus
import re

class StationBase(BaseModel):
    """Base station schema"""
    name: str = Field(..., min_length=1, max_length=100)
    station_type: StationType
    location: Optional[str] = Field(None, max_length=100)
    ip_address: Optional[str] = None
    mac_address: Optional[str] = None
    control_method: ControlMethod
    control_address: Optional[str] = Field(None, max_length=255)
    specs: Optional[Dict[str, Any]] = None
    
    @validator('name')
    def validate_name(cls, v):
        if not re.match(r'^[A-Za-z0-9\-_]+$', v):
            raise ValueError('Name can only contain letters, numbers, hyphens, and underscores')
        return v
    
    @validator('ip_address')
    def validate_ip(cls, v):
        if v:
            parts = v.split('.')
            if len(parts) != 4:
                raise ValueError('Invalid IP address format')
            if not all(0 <= int(part) <= 255 for part in parts):
                raise ValueError('Invalid IP address range')
        return v
    
    @validator('mac_address')
    def validate_mac(cls, v):
        if v:
            if not re.match(r'^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$', v):
                raise ValueError('Invalid MAC address format')
        return v

class StationCreate(StationBase):
    """Create station schema"""
    pass

class StationUpdate(BaseModel):
    """Update station schema"""
    name: Optional[str] = None
    location: Optional[str] = None
    ip_address: Optional[str] = None
    mac_address: Optional[str] = None
    control_address: Optional[str] = None
    status: Optional[StationStatus] = None
    specs: Optional[Dict[str, Any]] = None

class StationResponse(StationBase):
    """Station response schema"""
    id: str
    status: StationStatus
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
