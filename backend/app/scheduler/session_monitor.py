import asyncio
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.core.database import AsyncSessionLocal
from app.core.config import settings
from app.models.session import Session, SessionStatus
from app.models.station import Station, StationStatus
from app.websocket.manager import connection_manager
from app.websocket.dashboard_manager import dashboard_manager

logger = logging.getLogger(__name__)

class SessionMonitor:
    """Background task to monitor and expire sessions"""
    
    def __init__(self):
        self.running = False
        self.task = None
    
    async def start(self):
        """Start the session monitor"""
        if self.running:
            logger.warning("Session monitor already running")
            return
        
        self.running = True
        self.task = asyncio.create_task(self._monitor_loop())
        logger.info("Session monitor started")
    
    async def stop(self):
        """Stop the session monitor"""
        self.running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
        logger.info("Session monitor stopped")
    
    async def _monitor_loop(self):
        """Main monitoring loop"""
        while self.running:
            try:
                await self._check_sessions()
                await asyncio.sleep(settings.SESSION_CHECK_INTERVAL)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in session monitor: {e}", exc_info=True)
                await asyncio.sleep(settings.SESSION_CHECK_INTERVAL)
    
    async def _check_sessions(self):
        """Check for expired and expiring sessions"""
        async with AsyncSessionLocal() as db:
            now = datetime.now(timezone.utc)
            
            # Get all active sessions
            result = await db.execute(
                select(Session).where(Session.status == SessionStatus.ACTIVE)
            )
            active_sessions = result.scalars().all()
            
            for session in active_sessions:
                # Make scheduled_end_at timezone-aware if it isn't
                scheduled_end = session.scheduled_end_at
                if scheduled_end.tzinfo is None:
                    scheduled_end = scheduled_end.replace(tzinfo=timezone.utc)
                
                time_remaining = (scheduled_end - now).total_seconds()
                
                # Session expired
                if time_remaining <= 0:
                    await self._expire_session(db, session)
                
                # 5-minute warning
                elif time_remaining <= settings.SESSION_WARNING_MINUTES * 60:
                    await self._send_warning(session, "5min", int(time_remaining))
                
                # 1-minute warning
                elif time_remaining <= settings.SESSION_FINAL_WARNING_MINUTES * 60:
                    await self._send_warning(session, "1min", int(time_remaining))
    
    async def _expire_session(self, db: AsyncSession, session: Session):
        """Expire a session and reset station to online (ready for next customer)"""
        logger.info(f"Expiring session {session.id} for station {session.station_id}")
        
        # Update session status with timezone-aware datetime
        session.status = SessionStatus.EXPIRED
        session.actual_end_at = datetime.now(timezone.utc)
        
        # Update station status to ONLINE (ready for next customer)
        result = await db.execute(
            select(Station).where(Station.id == session.station_id)
        )
        station = result.scalar_one_or_none()
        if station:
            station.status = StationStatus.ONLINE
            logger.info(f"Station {station.name} ({station.id}) reset to ONLINE")
        
        await db.commit()
        await db.refresh(session)
        if station:
            await db.refresh(station)
        
        # Broadcast session update to all dashboards
        from app.schemas.session import SessionResponse
        session_dict = SessionResponse.model_validate(session).model_dump(mode='json')
        await dashboard_manager.send_session_update(session_dict)
        
        # Broadcast station status update to all dashboards
        if station:
            from app.schemas.station import StationResponse as StationResponseSchema
            station_dict = StationResponseSchema.model_validate(station).model_dump(mode='json')
            await dashboard_manager.send_station_update(station_dict)
        
        # Notify agent
        if connection_manager.is_connected(str(session.station_id)):
            await connection_manager.send_message(str(session.station_id), {
                "type": "session_expired",
                "data": {
                    "session_id": str(session.id),
                    "action": "logoff",
                    "grace_period_seconds": 30
                }
            })
        
        logger.info(f"Session {session.id} expired successfully")
    
    async def _send_warning(self, session: Session, warning_level: str, remaining_seconds: int):
        """Send warning to agent"""
        if connection_manager.is_connected(str(session.station_id)):
            await connection_manager.send_message(str(session.station_id), {
                "type": "session_warning",
                "data": {
                    "session_id": str(session.id),
                    "remaining_seconds": remaining_seconds,
                    "warning_level": warning_level
                }
            })
            logger.debug(f"Sent {warning_level} warning for session {session.id}")
