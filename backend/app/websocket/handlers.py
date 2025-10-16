from fastapi import WebSocket, WebSocketDisconnect, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
import logging

from app.websocket.manager import connection_manager
from app.core.database import AsyncSessionLocal
from app.core.security import verify_token
from app.models.station import Station, StationStatus

logger = logging.getLogger(__name__)

async def handle_agent_connection(websocket: WebSocket, station_id: str, token: str):
    """Handle WebSocket connection from PC agent"""
    
    # Authenticate agent
    try:
        payload = verify_token(token)
        
        # Verify it's an agent token
        if payload.get("type") != "agent":
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        # Verify station_id matches
        if payload.get("station_id") != station_id:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
    except Exception as e:
        logger.error(f"Agent authentication failed: {e}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    # Get station from database
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Station).where(Station.id == UUID(station_id))
        )
        station = result.scalar_one_or_none()
        
        if not station:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        # Update station status to ONLINE
        station.status = StationStatus.ONLINE
        await db.commit()
    
    # Accept connection
    await connection_manager.connect(station_id, websocket)
    
    # Send server_hello
    await connection_manager.send_message(station_id, {
        "type": "server_hello",
        "data": {
            "server_version": "1.0.0",
            "heartbeat_interval": 30,
            "station": {
                "id": str(station.id),
                "name": station.name,
                "status": station.status.value
            }
        }
    })
    
    try:
        while True:
            # Receive message from agent
            data = await websocket.receive_json()
            
            # Handle different message types
            message_type = data.get("type")
            
            if message_type == "agent_hello":
                await handle_agent_hello(station_id, data)
            
            elif message_type == "heartbeat":
                await handle_heartbeat(station_id, data)
            
            elif message_type == "session_event":
                await handle_session_event(station_id, data)
            
            elif message_type == "status_change":
                await handle_status_change(station_id, data)
            
            elif message_type == "error":
                await handle_agent_error(station_id, data)
            
            elif message_type == "sync_request":
                await handle_sync_request(station_id, data)
            
            else:
                logger.warning(f"Unknown message type from {station_id}: {message_type}")
    
    except WebSocketDisconnect:
        logger.info(f"Agent {station_id} disconnected")
    except Exception as e:
        logger.error(f"Error in agent connection {station_id}: {e}")
    finally:
        connection_manager.disconnect(station_id)
        
        # Update station status to OFFLINE
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Station).where(Station.id == UUID(station_id))
            )
            station = result.scalar_one_or_none()
            if station:
                station.status = StationStatus.OFFLINE
                await db.commit()

async def handle_agent_hello(station_id: str, data: dict):
    """Handle agent_hello message"""
    logger.info(f"Agent hello from {station_id}: {data.get('data', {}).get('agent_version')}")
    
    # Update station specs in database
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Station).where(Station.id == UUID(station_id))
        )
        station = result.scalar_one_or_none()
        if station:
            agent_data = data.get("data", {})
            station.specs = agent_data.get("specs", {})
            await db.commit()

async def handle_heartbeat(station_id: str, data: dict):
    """Handle heartbeat message"""
    connection_manager.update_heartbeat(station_id)
    
    # Send acknowledgment
    await connection_manager.send_message(station_id, {
        "type": "heartbeat_ack",
        "data": {
            "server_time": datetime.utcnow().isoformat()
        }
    })

async def handle_session_event(station_id: str, data: dict):
    """Handle session event from agent"""
    logger.info(f"Session event from {station_id}: {data}")
    # TODO: Log event to database

async def handle_status_change(station_id: str, data: dict):
    """Handle station status change"""
    logger.info(f"Status change from {station_id}: {data}")
    # TODO: Update station status in database

async def handle_agent_error(station_id: str, data: dict):
    """Handle error reported by agent"""
    logger.error(f"Agent error from {station_id}: {data}")
    # TODO: Log error to database

async def handle_sync_request(station_id: str, data: dict):
    """Handle sync request after reconnection"""
    logger.info(f"Sync request from {station_id}")
    
    # Get current session for station
    async with AsyncSessionLocal() as db:
        from app.models.session import Session, SessionStatus
        from datetime import datetime
        
        result = await db.execute(
            select(Session).where(
                Session.station_id == UUID(station_id),
                Session.status == SessionStatus.ACTIVE
            )
        )
        session = result.scalar_one_or_none()
        
        if session:
            remaining = (session.scheduled_end_at - datetime.utcnow()).total_seconds()
            await connection_manager.send_message(station_id, {
                "type": "sync_response",
                "data": {
                    "has_active_session": True,
                    "session": {
                        "session_id": str(session.id),
                        "remaining_seconds": max(0, int(remaining)),
                        "scheduled_end_at": session.scheduled_end_at.isoformat()
                    },
                    "server_time": datetime.utcnow().isoformat()
                }
            })
        else:
            await connection_manager.send_message(station_id, {
                "type": "sync_response",
                "data": {
                    "has_active_session": False,
                    "server_time": datetime.utcnow().isoformat()
                }
            })

from datetime import datetime
