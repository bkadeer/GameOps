from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from uuid import UUID
import logging

from app.api.deps import get_db, get_current_staff, get_current_admin
from app.models.station import Station, StationType, ControlMethod, StationStatus
from app.models.user import User
from app.schemas.station import StationCreate, StationUpdate, StationResponse
from app.websocket.dashboard_manager import dashboard_manager

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("", response_model=List[StationResponse])
async def list_stations(
    status_filter: Optional[StationStatus] = Query(None, alias="status"),
    type_filter: Optional[StationType] = Query(None, alias="station_type"),
    include_deleted: bool = Query(False, description="Include soft-deleted stations"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_staff)
):
    """
    List all stations with optional filters
    """
    query = select(Station)
    
    # Filter out soft-deleted stations by default
    if not include_deleted:
        query = query.where(Station.deleted_at.is_(None))
    
    if status_filter:
        query = query.where(Station.status == status_filter)
    
    if type_filter:
        query = query.where(Station.station_type == type_filter)
    
    result = await db.execute(query)
    stations = result.scalars().all()
    
    return stations

@router.get("/{station_id}", response_model=StationResponse)
async def get_station(
    station_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_staff)
):
    """
    Get station by ID
    """
    result = await db.execute(
        select(Station).where(
            Station.id == station_id,
            Station.deleted_at.is_(None)  # Exclude soft-deleted
        )
    )
    station = result.scalar_one_or_none()
    
    if not station:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Station not found"
        )
    
    return station

@router.post("", response_model=StationResponse, status_code=status.HTTP_201_CREATED)
async def create_station(
    station_data: StationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Create a new station (Admin only)
    """
    logger.info(f"Creating station: {station_data.name}")
    
    # Check if station name already exists
    result = await db.execute(
        select(Station).where(Station.name == station_data.name)
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        logger.warning(f"Station name already exists: {station_data.name}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Station with name '{station_data.name}' already exists"
        )
    
    # Create station - wrap in try/except to catch database errors
    try:
        station = Station(**station_data.model_dump())
        db.add(station)
        await db.commit()
        await db.refresh(station)
        
        logger.info(f"Station created successfully: {station.name} (ID: {station.id})")
        return station
        
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating station: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create station: {str(e)}"
        )

@router.put("/{station_id}", response_model=StationResponse)
async def update_station(
    station_id: UUID,
    station_data: StationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Update station (Admin only)
    """
    result = await db.execute(
        select(Station).where(
            Station.id == station_id,
            Station.deleted_at.is_(None)
        )
    )
    station = result.scalar_one_or_none()
    
    if not station:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Station not found or deleted"
        )
    
    # Update fields - wrap in try/except
    try:
        update_data = station_data.model_dump(exclude_unset=True)
        
        # Check if name is being changed and if new name already exists
        if 'name' in update_data and update_data['name'] != station.name:
            existing = await db.execute(
                select(Station).where(
                    Station.name == update_data['name'],
                    Station.id != station_id,
                    Station.deleted_at.is_(None)  # Only check non-deleted stations
                )
            )
            if existing.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Station with name '{update_data['name']}' already exists"
                )
        
        for field, value in update_data.items():
            setattr(station, field, value)
        
        await db.commit()
        await db.refresh(station)
        
        logger.info(f"Station updated successfully: {station.name} (ID: {station.id})")
        
        # Broadcast station update to all connected dashboards
        from app.schemas.station import StationResponse
        station_dict = StationResponse.model_validate(station).model_dump(mode='json')
        await dashboard_manager.send_station_update(station_dict)
        
        return station
        
    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating station: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update station: {str(e)}"
        )

@router.delete("/{station_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_station(
    station_id: UUID,
    permanent: bool = Query(False, description="Permanently delete (hard delete)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Soft delete station (Admin only)
    Set permanent=true for hard delete
    """
    result = await db.execute(
        select(Station).where(
            Station.id == station_id,
            Station.deleted_at.is_(None)  # Only delete non-deleted stations
        )
    )
    station = result.scalar_one_or_none()
    
    if not station:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Station not found or already deleted"
        )
    
    # Check if station has active session
    if station.status == StationStatus.IN_SESSION:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete station with active session"
        )
    
    # Delete station - wrap in try/except
    try:
        if permanent:
            # Hard delete - permanently remove from database
            await db.delete(station)
            logger.info(f"Station permanently deleted: {station.name} (ID: {station.id})")
        else:
            # Soft delete - mark as deleted
            from datetime import datetime
            station.deleted_at = datetime.utcnow()
            logger.info(f"Station soft deleted: {station.name} (ID: {station.id})")
        
        await db.commit()
        return None
        
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting station: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete station: {str(e)}"
        )

@router.post("/{station_id}/restore", response_model=StationResponse)
async def restore_station(
    station_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Restore a soft-deleted station (Admin only)
    """
    result = await db.execute(
        select(Station).where(
            Station.id == station_id,
            Station.deleted_at.isnot(None)  # Only restore deleted stations
        )
    )
    station = result.scalar_one_or_none()
    
    if not station:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deleted station not found"
        )
    
    try:
        station.deleted_at = None
        await db.commit()
        await db.refresh(station)
        
        logger.info(f"Station restored: {station.name} (ID: {station.id})")
        return station
        
    except Exception as e:
        await db.rollback()
        logger.error(f"Error restoring station: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to restore station: {str(e)}"
        )

@router.post("/{station_id}/generate-token")
async def generate_agent_token(
    station_id: UUID,
    expires_days: int = Query(default=365, ge=1, le=3650),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Generate agent authentication token for a station (Admin only)
    
    This token is used by the PC agent to authenticate WebSocket connections.
    Default expiration is 365 days (1 year).
    """
    # Verify station exists
    result = await db.execute(
        select(Station).where(Station.id == station_id)
    )
    station = result.scalar_one_or_none()
    
    if not station:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Station not found"
        )
    
    # Generate agent token
    agent_token = create_agent_token(str(station_id), expires_days=expires_days)
    
    logger.info(f"Agent token generated for station: {station.name} (ID: {station_id})")
    
    return {
        "station_id": str(station_id),
        "station_name": station.name,
        "agent_token": agent_token,
        "expires_days": expires_days,
        "note": "Save this token securely. It will be used by the PC agent to authenticate."
    }
