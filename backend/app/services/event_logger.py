"""Event logging service for audit trail and analytics"""
import logging
from typing import Optional, Dict, Any
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.event import Event
from datetime import datetime

logger = logging.getLogger(__name__)

class EventLogger:
    """Service for logging system events"""
    
    @staticmethod
    async def log_event(
        db: AsyncSession,
        event_type: str,
        entity_type: Optional[str] = None,
        entity_id: Optional[UUID] = None,
        user_id: Optional[UUID] = None,
        data: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None
    ) -> Optional[Event]:
        """
        Log an event to the database
        
        Args:
            db: Database session
            event_type: Type of event (e.g., 'session_start', 'station_created')
            entity_type: Type of entity (e.g., 'session', 'station')
            entity_id: ID of the entity
            user_id: ID of the user who triggered the event
            data: Additional event data as JSON
            ip_address: IP address of the client
        
        Returns:
            Created Event object or None if failed
        """
        try:
            event = Event(
                event_type=event_type,
                entity_type=entity_type,
                entity_id=entity_id,
                user_id=user_id,
                data=data or {},
                ip_address=ip_address
            )
            db.add(event)
            await db.commit()
            await db.refresh(event)
            logger.debug(f"Event logged: {event_type} for {entity_type}:{entity_id}")
            return event
        except Exception as e:
            logger.error(f"Failed to log event {event_type}: {e}")
            await db.rollback()
            return None
    
    @staticmethod
    async def log_session_event(
        db: AsyncSession,
        event_type: str,
        session_id: UUID,
        user_id: Optional[UUID] = None,
        data: Optional[Dict[str, Any]] = None
    ):
        """Log a session-related event"""
        return await EventLogger.log_event(
            db=db,
            event_type=event_type,
            entity_type="session",
            entity_id=session_id,
            user_id=user_id,
            data=data
        )
    
    @staticmethod
    async def log_station_event(
        db: AsyncSession,
        event_type: str,
        station_id: UUID,
        user_id: Optional[UUID] = None,
        data: Optional[Dict[str, Any]] = None
    ):
        """Log a station-related event"""
        return await EventLogger.log_event(
            db=db,
            event_type=event_type,
            entity_type="station",
            entity_id=station_id,
            user_id=user_id,
            data=data
        )
    
    @staticmethod
    async def log_agent_event(
        db: AsyncSession,
        event_type: str,
        station_id: UUID,
        data: Optional[Dict[str, Any]] = None
    ):
        """Log an agent-related event"""
        return await EventLogger.log_event(
            db=db,
            event_type=f"agent_{event_type}",
            entity_type="station",
            entity_id=station_id,
            data=data
        )
    
    @staticmethod
    async def log_error(
        db: AsyncSession,
        error_type: str,
        error_message: str,
        entity_type: Optional[str] = None,
        entity_id: Optional[UUID] = None,
        stack_trace: Optional[str] = None
    ):
        """Log an error event"""
        return await EventLogger.log_event(
            db=db,
            event_type=f"error_{error_type}",
            entity_type=entity_type,
            entity_id=entity_id,
            data={
                "error_message": error_message,
                "stack_trace": stack_trace
            }
        )
    
    @staticmethod
    async def get_recent_events(
        db: AsyncSession,
        limit: int = 100,
        event_type: Optional[str] = None,
        entity_id: Optional[UUID] = None
    ) -> list[Event]:
        """Get recent events with optional filtering"""
        try:
            query = select(Event).order_by(Event.timestamp.desc()).limit(limit)
            
            if event_type:
                query = query.where(Event.event_type == event_type)
            if entity_id:
                query = query.where(Event.entity_id == entity_id)
            
            result = await db.execute(query)
            return list(result.scalars().all())
        except Exception as e:
            logger.error(f"Failed to get recent events: {e}")
            return []

# Event type constants
class EventType:
    """Standard event types"""
    # Session events
    SESSION_CREATED = "session_created"
    SESSION_STARTED = "session_started"
    SESSION_EXTENDED = "session_extended"
    SESSION_ENDED = "session_ended"
    SESSION_EXPIRED = "session_expired"
    SESSION_WARNING = "session_warning"
    
    # Station events
    STATION_CREATED = "station_created"
    STATION_UPDATED = "station_updated"
    STATION_DELETED = "station_deleted"
    STATION_STATUS_CHANGED = "station_status_changed"
    
    # Agent events
    AGENT_CONNECTED = "agent_connected"
    AGENT_DISCONNECTED = "agent_disconnected"
    AGENT_HEARTBEAT = "agent_heartbeat"
    AGENT_ERROR = "agent_error"
    AGENT_ENFORCEMENT_SUCCESS = "agent_enforcement_success"
    AGENT_ENFORCEMENT_FAILED = "agent_enforcement_failed"
    
    # Payment events
    PAYMENT_RECEIVED = "payment_received"
    PAYMENT_REFUNDED = "payment_refunded"
    
    # Auth events
    USER_LOGIN = "user_login"
    USER_LOGOUT = "user_logout"
    USER_LOGIN_FAILED = "user_login_failed"
    
    # System events
    SYSTEM_ERROR = "system_error"
    SYSTEM_WARNING = "system_warning"
