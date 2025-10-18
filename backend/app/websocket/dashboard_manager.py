from typing import Dict, Set
from fastapi import WebSocket
from datetime import datetime
import json
import logging

logger = logging.getLogger(__name__)

class DashboardConnectionManager:
    """Manage WebSocket connections for dashboard clients"""
    
    def __init__(self):
        # Set of active dashboard WebSocket connections
        self.active_connections: Set[WebSocket] = set()
    
    async def connect(self, websocket: WebSocket):
        """Accept and register a new dashboard connection"""
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"Dashboard client connected. Total: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        """Remove a dashboard connection"""
        self.active_connections.discard(websocket)
        logger.info(f"Dashboard client disconnected. Total: {len(self.active_connections)}")
    
    async def broadcast(self, message: dict):
        """Broadcast message to all connected dashboards"""
        if not self.active_connections:
            return
        
        message["timestamp"] = datetime.utcnow().isoformat()
        disconnected = []
        
        for websocket in self.active_connections:
            try:
                await websocket.send_json(message)
                logger.debug(f"Broadcast to dashboard: {message.get('type')}")
            except Exception as e:
                logger.error(f"Error broadcasting to dashboard: {e}")
                disconnected.append(websocket)
        
        # Clean up disconnected clients
        for websocket in disconnected:
            self.disconnect(websocket)
    
    async def send_station_update(self, station_data: dict):
        """Send station status update to all dashboards"""
        await self.broadcast({
            "type": "station_update",
            "data": station_data
        })
    
    async def send_session_update(self, session_data: dict):
        """Send session update to all dashboards"""
        await self.broadcast({
            "type": "session_update",
            "data": session_data
        })
    
    async def send_stats_update(self, stats_data: dict):
        """Send dashboard stats update"""
        await self.broadcast({
            "type": "stats_update",
            "data": stats_data
        })
    
    def get_connection_count(self) -> int:
        """Get number of active dashboard connections"""
        return len(self.active_connections)
    
    async def disconnect_all(self):
        """Disconnect all dashboards (shutdown)"""
        for websocket in list(self.active_connections):
            try:
                await websocket.send_json({
                    "type": "server_shutdown",
                    "data": {"message": "Server is shutting down"}
                })
                await websocket.close()
            except Exception as e:
                logger.error(f"Error disconnecting dashboard: {e}")
            finally:
                self.disconnect(websocket)

# Global dashboard connection manager instance
dashboard_manager = DashboardConnectionManager()
