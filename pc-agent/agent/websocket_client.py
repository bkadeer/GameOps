"""
WebSocket client for backend communication
"""
import asyncio
import json
import logging
import websockets
from typing import Optional, Callable, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

class WebSocketClient:
    """WebSocket client for agent-backend communication"""
    
    def __init__(self, url: str, station_id: str, token: str):
        self.url = f"{url}/{station_id}?token={token}"
        self.station_id = station_id
        self.token = token
        self.websocket: Optional[websockets.WebSocketClientProtocol] = None
        self.connected = False
        self.reconnect_interval = 5
        self.heartbeat_interval = 30
        self.message_handlers: Dict[str, Callable] = {}
        self._running = False
        self._heartbeat_task: Optional[asyncio.Task] = None
    
    def on_message(self, message_type: str, handler: Callable):
        """Register message handler"""
        self.message_handlers[message_type] = handler
        logger.info(f"Registered handler for message type: {message_type}")
    
    async def connect(self):
        """Connect to WebSocket server"""
        try:
            logger.info(f"Connecting to {self.url}")
            self.websocket = await websockets.connect(
                self.url,
                ping_interval=20,
                ping_timeout=10,
            )
            self.connected = True
            logger.info("WebSocket connected successfully")
            
            # Start heartbeat
            self._heartbeat_task = asyncio.create_task(self._heartbeat_loop())
            
            return True
        except Exception as e:
            logger.error(f"Failed to connect: {e}")
            self.connected = False
            return False
    
    async def disconnect(self):
        """Disconnect from WebSocket server"""
        self._running = False
        
        if self._heartbeat_task:
            self._heartbeat_task.cancel()
            try:
                await self._heartbeat_task
            except asyncio.CancelledError:
                pass
        
        if self.websocket:
            await self.websocket.close()
            self.websocket = None
        
        self.connected = False
        logger.info("WebSocket disconnected")
    
    async def send_message(self, message_type: str, data: Dict[str, Any]):
        """Send message to server"""
        if not self.connected or not self.websocket:
            logger.warning("Cannot send message: not connected")
            return False
        
        try:
            message = {
                "type": message_type,
                "station_id": self.station_id,
                "timestamp": datetime.utcnow().isoformat(),
                "data": data
            }
            
            await self.websocket.send(json.dumps(message))
            logger.debug(f"Sent message: {message_type}")
            return True
        except Exception as e:
            logger.error(f"Failed to send message: {e}")
            self.connected = False
            return False
    
    async def _heartbeat_loop(self):
        """Send periodic heartbeat messages"""
        while self._running and self.connected:
            try:
                await asyncio.sleep(self.heartbeat_interval)
                await self.send_message("heartbeat", {
                    "status": "online",
                    "timestamp": datetime.utcnow().isoformat()
                })
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Heartbeat error: {e}")
    
    async def receive_loop(self):
        """Main receive loop"""
        self._running = True
        
        while self._running:
            try:
                if not self.connected:
                    logger.info("Attempting to reconnect...")
                    if await self.connect():
                        # Send initial status
                        await self.send_message("agent_connected", {
                            "station_id": self.station_id,
                            "status": "online"
                        })
                    else:
                        await asyncio.sleep(self.reconnect_interval)
                        continue
                
                # Receive message
                message_str = await self.websocket.recv()
                message = json.loads(message_str)
                
                logger.debug(f"Received message: {message.get('type')}")
                
                # Handle message
                message_type = message.get('type')
                if message_type in self.message_handlers:
                    handler = self.message_handlers[message_type]
                    await handler(message)
                else:
                    logger.warning(f"No handler for message type: {message_type}")
                
            except websockets.exceptions.ConnectionClosed:
                logger.warning("Connection closed, will reconnect...")
                self.connected = False
                await asyncio.sleep(self.reconnect_interval)
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON received: {e}")
            except Exception as e:
                logger.error(f"Error in receive loop: {e}")
                self.connected = False
                await asyncio.sleep(self.reconnect_interval)
    
    async def start(self):
        """Start the WebSocket client"""
        logger.info("Starting WebSocket client...")
        await self.receive_loop()
    
    async def stop(self):
        """Stop the WebSocket client"""
        logger.info("Stopping WebSocket client...")
        await self.disconnect()
