from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID
from datetime import datetime, timedelta, timezone
import logging

from app.api.deps import get_db, get_current_staff
from app.models.session import Session, SessionStatus
from app.models.station import Station, StationStatus
from app.models.payment import Payment, PaymentStatus
from app.models.user import User
from app.schemas.session import SessionCreate, SessionExtend, SessionResponse
from app.websocket.manager import connection_manager
from app.websocket.dashboard_manager import dashboard_manager

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("", response_model=List[SessionResponse])
async def get_all_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_staff)
):
    """
    Get all sessions
    """
    result = await db.execute(
        select(Session).order_by(Session.started_at.desc())
    )
    sessions = result.scalars().all()
    return sessions

@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    session_data: SessionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_staff)
):
    """
    Start a new gaming session
    """
    # Get station
    result = await db.execute(
        select(Station).where(Station.id == session_data.station_id)
    )
    station = result.scalar_one_or_none()
    
    if not station:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Station not found"
        )
    
    # Check if station is available
    if station.status == StationStatus.IN_SESSION:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Station is already in use"
        )
    
    if station.status != StationStatus.ONLINE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Station is {station.status.value}, cannot start session"
        )
    
    # Create payment and session - wrap in try/except
    try:
        # Use the logged-in staff member's username (admin/employee who created the session)
        staff_username = current_user.username
        logger.info(f"Session created by staff: '{staff_username}' (user_id: {current_user.id})")
        
        payment = Payment(
            user_name=staff_username,  # Track which staff member processed the payment
            station_id=session_data.station_id,  # Track which station generated revenue
            amount=session_data.amount,
            payment_method=session_data.payment_method,
            status=PaymentStatus.COMPLETED  # Simplified for MVP
        )
        db.add(payment)
        await db.flush()
        
        # Create session with timezone-aware datetime
        started_at = datetime.now(timezone.utc)
        scheduled_end_at = started_at + timedelta(minutes=session_data.duration_minutes)
        
        session = Session(
            user_name=staff_username,  # Track which staff member created the session
            station_id=session_data.station_id,
            station_name=station.name,  # Store station name for human readability
            started_at=started_at,
            scheduled_end_at=scheduled_end_at,
            duration_minutes=session_data.duration_minutes,
            status=SessionStatus.ACTIVE,
            payment_id=payment.id,
            notes=session_data.notes,
            created_by=current_user.id
        )
        db.add(session)
        
        # Update station status
        station.status = StationStatus.IN_SESSION
        
        await db.commit()
        await db.refresh(session)
        await db.refresh(station)  # Refresh station to load all attributes
        
        logger.info(f"Session created successfully: {session.id} for station {station.name}")
        
        # Notify agent via WebSocket
        await connection_manager.send_to_station(str(session.station_id), {
            "type": "session_start",
            "data": {
                "id": str(session.id),
                "user_name": session.user_name,
                "started_at": session.started_at.isoformat(),
                "scheduled_end_at": session.scheduled_end_at.isoformat(),
                "duration_minutes": session.duration_minutes,
                "extended_minutes": session.extended_minutes,
            }
        })
        logger.info(f"Session start notification sent to station {station.name}")
        
        # Broadcast session update to all dashboards
        session_dict = SessionResponse.model_validate(session).model_dump(mode='json')
        await dashboard_manager.send_session_update(session_dict)
        
        # Also broadcast station status update
        from app.schemas.station import StationResponse as StationResponseSchema
        station_dict = StationResponseSchema.model_validate(station).model_dump(mode='json')
        await dashboard_manager.send_station_update(station_dict)
        
        # TODO: Cache session in Redis
        
        return session
        
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating session: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create session: {str(e)}"
        )

@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_staff)
):
    """
    Get session by ID
    """
    result = await db.execute(
        select(Session).where(Session.id == session_id)
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    return session

@router.put("/{session_id}/extend", response_model=SessionResponse)
async def extend_session(
    session_id: UUID,
    extend_data: SessionExtend,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_staff)
):
    """
    Extend session duration
    """
    result = await db.execute(
        select(Session).where(Session.id == session_id)
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    if session.status != SessionStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot extend inactive session"
        )
    
    # Create additional payment - track which staff member extended the session
    payment = Payment(
        user_name=current_user.username,  # Track which staff member processed the extension payment
        station_id=session.station_id,  # Track revenue per station
        amount=extend_data.amount,
        payment_method=extend_data.payment_method,
        status=PaymentStatus.COMPLETED
    )
    db.add(payment)
    logger.info(f"Session extended by staff: '{current_user.username}'")
    
    # Extend session
    session.extended_minutes += extend_data.additional_minutes
    session.scheduled_end_at += timedelta(minutes=extend_data.additional_minutes)
    
    await db.commit()
    await db.refresh(session)
    
    logger.info(f"Session extended: {session.id} by {extend_data.additional_minutes} minutes")
    
    # Broadcast session update to all dashboards
    session_dict = SessionResponse.model_validate(session).model_dump(mode='json')
    await dashboard_manager.send_session_update(session_dict)
    
    # TODO: Notify agent via WebSocket
    # TODO: Update Redis cache
    
    return session

@router.delete("/{session_id}", response_model=SessionResponse)
async def stop_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_staff)
):
    """
    Manually stop a session
    """
    result = await db.execute(
        select(Session).where(Session.id == session_id)
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    if session.status != SessionStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session is not active"
        )
    
    # Stop session
    session.status = SessionStatus.STOPPED
    session.actual_end_at = datetime.now(timezone.utc)
    
    # Update station status
    result = await db.execute(
        select(Station).where(Station.id == session.station_id)
    )
    station = result.scalar_one_or_none()
    if station:
        station.status = StationStatus.ONLINE
    
    await db.commit()
    await db.refresh(session)
    if station:
        await db.refresh(station)  # Refresh station to load all attributes
    
    logger.info(f"Session stopped: {session.id}")
    
    # Broadcast session update to all dashboards
    session_dict = SessionResponse.model_validate(session).model_dump(mode='json')
    await dashboard_manager.send_session_update(session_dict)
    
    # Broadcast station status update
    if station:
        from app.schemas.station import StationResponse as StationResponseSchema
        station_dict = StationResponseSchema.model_validate(station).model_dump(mode='json')
        await dashboard_manager.send_station_update(station_dict)
    
    # TODO: Notify agent via WebSocket
    # TODO: Remove from Redis cache
    
    return session
