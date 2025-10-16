from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from uuid import UUID
import logging

from app.api.deps import get_db, get_current_staff, get_current_admin
from app.models.station import Station, StationStatus, StationType
from app.models.user import User
from app.schemas.station import StationCreate, StationUpdate, StationResponse

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("", response_model=List[StationResponse])
async def list_stations(
    status_filter: Optional[StationStatus] = Query(None, alias="status"),
    type_filter: Optional[StationType] = Query(None, alias="station_type"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_staff)
):
    """
    List all stations with optional filters
    """
    query = select(Station)
    
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
        select(Station).where(Station.id == station_id)
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
        select(Station).where(Station.id == station_id)
    )
    station = result.scalar_one_or_none()
    
    if not station:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Station not found"
        )
    
    # Update fields - wrap in try/except
    try:
        update_data = station_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(station, field, value)
        
        await db.commit()
        await db.refresh(station)
        
        logger.info(f"Station updated successfully: {station.name} (ID: {station.id})")
        return station
        
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
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Delete station (Admin only)
    """
    result = await db.execute(
        select(Station).where(Station.id == station_id)
    )
    station = result.scalar_one_or_none()
    
    if not station:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Station not found"
        )
    
    # Delete station - wrap in try/except
    try:
        await db.delete(station)
        await db.commit()
        
        logger.info(f"Station deleted successfully: {station.name} (ID: {station.id})")
        return None
        
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting station: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete station: {str(e)}"
        )
