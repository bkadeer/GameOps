from typing import Dict, Optional
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime
import json
import logging
import asyncio

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manage WebSocket connections for PC agents"""
    
    def __init__(self):
        # station_id -> WebSocket
        self.active_connections: Dict[str, WebSocket] = {}
        # station_id -> last heartbeat timestamp
        self.last_heartbeat: Dict[str, datetime] = {}
    
    async def connect(self, station_id: str, websocket: WebSocket):
        """Accept and register a new connection"""
        await websocket.accept()
        self.active_connections[station_id] = websocket
        self.last_heartbeat[station_id] = datetime.utcnow()
        logger.info(f"Agent connected: {station_id}")
    
    def disconnect(self, station_id: str):
        """Remove a connection"""
        if station_id in self.active_connections:
            del self.active_connections[station_id]
        if station_id in self.last_heartbeat:
            del self.last_heartbeat[station_id]
        logger.info(f"Agent disconnected: {station_id}")
    
    async def send_message(self, station_id: str, message: dict):
        """Send message to a specific agent"""
        if station_id in self.active_connections:
            try:
                message["timestamp"] = datetime.utcnow().isoformat()
                await self.active_connections[station_id].send_json(message)
                logger.debug(f"Sent message to {station_id}: {message['type']}")
            except Exception as e:
                logger.error(f"Error sending message to {station_id}: {e}")
                self.disconnect(station_id)
    
    async def broadcast(self, message: dict):
        """Broadcast message to all connected agents"""
        message["timestamp"] = datetime.utcnow().isoformat()
        disconnected = []
        
        for station_id, websocket in self.active_connections.items():
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to {station_id}: {e}")
                disconnected.append(station_id)
        
        # Clean up disconnected clients
        for station_id in disconnected:
            self.disconnect(station_id)
    
    def is_connected(self, station_id: str) -> bool:
        """Check if agent is connected"""
        return station_id in self.active_connections
    
    def update_heartbeat(self, station_id: str):
        """Update last heartbeat timestamp"""
        self.last_heartbeat[station_id] = datetime.utcnow()
    
    def get_connection_count(self) -> int:
        """Get number of active connections"""
        return len(self.active_connections)
    
    async def disconnect_all(self):
        """Disconnect all agents (shutdown)"""
        for station_id in list(self.active_connections.keys()):
            try:
                await self.send_message(station_id, {
                    "type": "server_shutdown",
                    "data": {"message": "Server is shutting down"}
                })
                await self.active_connections[station_id].close()
            except Exception as e:
                logger.error(f"Error disconnecting {station_id}: {e}")
            finally:
                self.disconnect(station_id)

# Global connection manager instance
connection_manager = ConnectionManager()
