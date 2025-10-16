from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID
from datetime import datetime, timedelta

from app.api.deps import get_db, get_current_staff
from app.models.session import Session, SessionStatus
from app.models.station import Station, StationStatus
from app.models.payment import Payment, PaymentStatus
from app.models.user import User
from app.schemas.session import SessionCreate, SessionExtend, SessionResponse

router = APIRouter()

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
        select(Station).where(Station.id == UUID(session_data.station_id))
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
    
    # Create payment
    payment = Payment(
        user_id=UUID(session_data.user_id) if session_data.user_id else None,
        amount=session_data.amount,
        payment_method=session_data.payment_method,
        status=PaymentStatus.COMPLETED  # Simplified for MVP
    )
    db.add(payment)
    await db.flush()
    
    # Create session
    started_at = datetime.utcnow()
    scheduled_end_at = started_at + timedelta(minutes=session_data.duration_minutes)
    
    session = Session(
        station_id=UUID(session_data.station_id),
        user_id=UUID(session_data.user_id) if session_data.user_id else None,
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
    
    # TODO: Notify agent via WebSocket
    # TODO: Cache session in Redis
    
    return session

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
    
    # Create additional payment
    payment = Payment(
        user_id=session.user_id,
        amount=extend_data.amount,
        payment_method=extend_data.payment_method,
        status=PaymentStatus.COMPLETED
    )
    db.add(payment)
    
    # Extend session
    session.extended_minutes += extend_data.additional_minutes
    session.scheduled_end_at += timedelta(minutes=extend_data.additional_minutes)
    
    await db.commit()
    await db.refresh(session)
    
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
    session.actual_end_at = datetime.utcnow()
    
    # Update station status
    result = await db.execute(
        select(Station).where(Station.id == session.station_id)
    )
    station = result.scalar_one_or_none()
    if station:
        station.status = StationStatus.ONLINE
    
    await db.commit()
    await db.refresh(session)
    
    # TODO: Notify agent via WebSocket
    # TODO: Remove from Redis cache
    
    return session
