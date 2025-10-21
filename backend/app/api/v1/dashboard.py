from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta, timezone

from app.api.deps import get_db, get_current_staff
from app.models.station import Station, StationStatus
from app.models.session import Session, SessionStatus
from app.models.payment import Payment, PaymentStatus
from app.models.user import User

router = APIRouter()

@router.get("")
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_staff)
):
    """
    Get real-time dashboard data
    """
    # Count active sessions
    result = await db.execute(
        select(func.count(Session.id)).where(Session.status == SessionStatus.ACTIVE)
    )
    active_sessions = result.scalar()
    
    # Count total stations (excluding soft-deleted)
    result = await db.execute(
        select(func.count(Station.id)).where(Station.deleted_at.is_(None))
    )
    total_stations = result.scalar()
    
    # Count available stations (excluding soft-deleted)
    result = await db.execute(
        select(func.count(Station.id)).where(
            Station.status == StationStatus.ONLINE,
            Station.deleted_at.is_(None)
        )
    )
    available_stations = result.scalar()
    
    # Calculate today's revenue (6AM to 6AM cycle)
    now = datetime.now(timezone.utc)
    if now.hour < 6:
        # Before 6AM, use yesterday 6AM to today 6AM
        today_6am = now.replace(hour=6, minute=0, second=0, microsecond=0) - timedelta(days=1)
    else:
        # After 6AM, use today 6AM to tomorrow 6AM
        today_6am = now.replace(hour=6, minute=0, second=0, microsecond=0)
    
    result = await db.execute(
        select(func.sum(Payment.amount)).where(
            Payment.status == PaymentStatus.COMPLETED,
            Payment.created_at >= today_6am
        )
    )
    revenue_today = result.scalar() or 0.0
    
    # Get all stations with their current sessions (excluding soft-deleted)
    result = await db.execute(
        select(Station).where(Station.deleted_at.is_(None)).order_by(Station.name)
    )
    stations = result.scalars().all()
    
    stations_data = []
    for station in stations:
        # Get active session for this station (limit to 1 in case of duplicates)
        session_result = await db.execute(
            select(Session).where(
                Session.station_id == station.id,
                Session.status == SessionStatus.ACTIVE
            ).order_by(Session.started_at.desc()).limit(1)
        )
        session = session_result.scalar_one_or_none()
        
        remaining_seconds = None
        if session:
            now = datetime.now(timezone.utc)
            remaining = (session.scheduled_end_at - now).total_seconds()
            remaining_seconds = max(0, int(remaining))
        
        stations_data.append({
            "station": {
                "id": str(station.id),
                "name": station.name,
                "station_type": station.station_type.value,
                "status": station.status.value,
                "location": station.location
            },
            "session": {
                "id": str(session.id),
                "started_at": session.started_at.isoformat(),
                "scheduled_end_at": session.scheduled_end_at.isoformat(),
                "duration_minutes": session.duration_minutes
            } if session else None,
            "remaining_seconds": remaining_seconds
        })
    
    return {
        "active_sessions": active_sessions,
        "total_stations": total_stations,
        "available_stations": available_stations,
        "revenue_today": float(revenue_today),
        "stations": stations_data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
