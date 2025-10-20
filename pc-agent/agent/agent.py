"""
Main PC Agent application
"""
import asyncio
import logging
import signal
import sys
from typing import Dict, Any

from .config import Config
from .websocket_client import WebSocketClient
from .system_control import SystemControl
from .system_monitor import SystemMonitor
from .session_manager import SessionManager
from .kiosk_overlay import KioskOverlay

logger = logging.getLogger(__name__)

class PCAgent:
    """Main PC Agent application"""
    
    def __init__(self, config_path: str = "config.yaml"):
        self.config = Config(config_path)
        self.system_control = SystemControl()
        self.system_monitor = SystemMonitor()
        self.session_manager = SessionManager(self.system_control, self.config)
        
        # Kiosk overlay UI
        self.kiosk_overlay = None
        if self.config.get('features.show_overlay', True):
            self.kiosk_overlay = KioskOverlay()
        
        # WebSocket client
        self.ws_client = WebSocketClient(
            url=self.config.backend_url,
            station_id=self.config.station_id,
            token=self.config.agent_token
        )
        
        # Register message handlers
        self._register_handlers()
        
        # Status monitoring task
        self.status_task: asyncio.Task = None
        self.running = False
    
    def _register_handlers(self):
        """Register WebSocket message handlers"""
        self.ws_client.on_message("session_start", self._handle_session_start)
        self.ws_client.on_message("session_extended", self._handle_session_extend)
        self.ws_client.on_message("session_end", self._handle_session_end)
        self.ws_client.on_message("server_hello", self._handle_server_hello)
        self.ws_client.on_message("heartbeat_ack", self._handle_heartbeat_ack)
        self.ws_client.on_message("lock_station", self._handle_lock_station)
        self.ws_client.on_message("unlock_station", self._handle_unlock_station)
        self.ws_client.on_message("get_status", self._handle_get_status)
        self.ws_client.on_message("ping", self._handle_ping)
    
    async def _handle_session_start(self, message: Dict[str, Any]):
        """Handle session start command"""
        logger.info("Received session start command")
        session_data = message.get("data", {})
        
        try:
            success = self.session_manager.start_session(session_data)
            
            # Update overlay
            if self.kiosk_overlay:
                self.kiosk_overlay.update_session(self.session_manager.get_session_status())
            
            await self.ws_client.send_message("session_event", {
                "event": "session_started",
                "success": success,
                "session_id": session_data.get("id"),
                "status": self.session_manager.get_session_status()
            })
        except Exception as e:
            logger.error(f"Error handling session start: {e}")
            await self.ws_client.send_message("error", {
                "message": f"Failed to start session: {str(e)}",
                "session_id": session_data.get("id")
            })
    
    async def _handle_session_extend(self, message: Dict[str, Any]):
        """Handle session extend command"""
        logger.info("Received session extend command")
        data = message.get("data", {})
        
        try:
            success = self.session_manager.extend_session(
                additional_minutes=data.get("extended_minutes"),
                new_end_time=data.get("new_end_time")
            )
            
            # Update overlay
            if self.kiosk_overlay:
                self.kiosk_overlay.update_session(self.session_manager.get_session_status())
            
            await self.ws_client.send_message("session_event", {
                "event": "session_extended",
                "success": success,
                "session_id": data.get("id"),
                "status": self.session_manager.get_session_status()
            })
        except Exception as e:
            logger.error(f"Error handling session extend: {e}")
            await self.ws_client.send_message("error", {
                "message": f"Failed to extend session: {str(e)}",
                "session_id": data.get("id")
            })
    
    async def _handle_session_end(self, message: Dict[str, Any]):
        """Handle session end command"""
        logger.info("Received session end command")
        data = message.get("data", {})
        
        try:
            success = self.session_manager.end_session(
                reason=data.get("reason", "manual")
            )
            
            # Update overlay
            if self.kiosk_overlay:
                self.kiosk_overlay.update_session(self.session_manager.get_session_status())
            
            await self.ws_client.send_message("session_event", {
                "event": "session_ended",
                "success": success,
                "session_id": data.get("id"),
                "reason": data.get("reason", "manual")
            })
            
            # Lock workstation after session ends
            if self.config.get('features.auto_lock', True):
                await asyncio.sleep(2)  # Small delay
                self.system_control.lock_workstation()
        except Exception as e:
            logger.error(f"Error handling session end: {e}")
            await self.ws_client.send_message("error", {
                "message": f"Failed to end session: {str(e)}",
                "session_id": data.get("id")
            })
    
    async def _handle_lock_station(self, message: Dict[str, Any]):
        """Handle lock station command"""
        logger.info("Received lock station command")
        success = self.system_control.lock_workstation()
        
        await self.ws_client.send_message("lock_station_response", {
            "success": success
        })
    
    async def _handle_unlock_station(self, message: Dict[str, Any]):
        """Handle unlock station command"""
        logger.info("Received unlock station command")
        # Note: Cannot programmatically unlock Windows workstation
        # User must enter password
        
        await self.ws_client.send_message("unlock_station_response", {
            "success": False,
            "message": "Cannot programmatically unlock Windows. User must enter password."
        })
    
    async def _handle_get_status(self, message: Dict[str, Any]):
        """Handle get status command"""
        logger.debug("Received get status command")
        
        status = {
            "station_id": self.config.station_id,
            "station_name": self.config.station_name,
            "session": self.session_manager.get_session_status(),
            "system": self.system_monitor.get_status_report(),
            "locked": self.system_control.is_workstation_locked(),
            "current_user": self.system_control.get_current_user(),
        }
        
        await self.ws_client.send_message("status_report", status)
    
    async def _handle_server_hello(self, message: Dict[str, Any]):
        """Handle server hello message"""
        logger.info("Received server hello")
        data = message.get("data", {})
        logger.info(f"Server version: {data.get('server_version')}")
        logger.info(f"Heartbeat interval: {data.get('heartbeat_interval')}s")
        
        # Send agent hello with system specs
        await self.ws_client.send_message("agent_hello", {
            "agent_version": "1.0.0",
            "specs": self.system_monitor.get_status_report()
        })
    
    async def _handle_heartbeat_ack(self, message: Dict[str, Any]):
        """Handle heartbeat acknowledgment"""
        # Just log it, no action needed
        pass
    
    async def _handle_ping(self, message: Dict[str, Any]):
        """Handle ping command"""
        await self.ws_client.send_message("pong", {
            "timestamp": message.get("timestamp")
        })
    
    async def _status_monitoring_loop(self):
        """Periodically send status updates"""
        monitor_interval = self.config.get('system.monitor_interval', 60)
        
        while self.running:
            try:
                await asyncio.sleep(monitor_interval)
                
                # Send status update
                status = {
                    "station_id": self.config.station_id,
                    "session": self.session_manager.get_session_status(),
                    "system": {
                        "cpu_percent": self.system_monitor.get_cpu_info().get("percent"),
                        "memory_percent": self.system_monitor.get_memory_info().get("percent"),
                        "disk_percent": self.system_monitor.get_disk_info().get("percent"),
                    },
                    "locked": self.system_control.is_workstation_locked(),
                    "healthy": self.system_monitor.is_healthy(),
                }
                
                await self.ws_client.send_message("status_update", status)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in status monitoring: {e}")
    
    async def start(self):
        """Start the agent"""
        logger.info("=" * 60)
        logger.info("GameOps PC Agent Starting")
        logger.info("=" * 60)
        logger.info(f"Station ID: {self.config.station_id}")
        logger.info(f"Station Name: {self.config.station_name}")
        logger.info(f"Backend URL: {self.config.backend_url}")
        logger.info("=" * 60)
        
        # Validate configuration
        if not self.config.station_id:
            logger.error("Station ID not configured!")
            logger.error("Please set STATION_ID in .env file or config.yaml")
            return
        
        if not self.config.agent_token:
            logger.error("Agent token not configured!")
            logger.error("Please set AGENT_TOKEN in .env file or config.yaml")
            return
        
        self.running = True
        
        # Start kiosk overlay
        if self.kiosk_overlay:
            self.kiosk_overlay.start()
        
        # Start status monitoring
        self.status_task = asyncio.create_task(self._status_monitoring_loop())
        
        # Start WebSocket client (this will run until stopped)
        await self.ws_client.start()
    
    async def stop(self):
        """Stop the agent"""
        logger.info("Stopping PC Agent...")
        self.running = False
        
        # Cancel status monitoring
        if self.status_task:
            self.status_task.cancel()
            try:
                await self.status_task
            except asyncio.CancelledError:
                pass
        
        # Stop WebSocket client
        await self.ws_client.stop()
        
        # Stop kiosk overlay
        if self.kiosk_overlay:
            self.kiosk_overlay.stop()
        
        # Allow system sleep
        self.system_control.prevent_sleep(False)
        
        logger.info("PC Agent stopped")
    
    def setup_signal_handlers(self):
        """Setup signal handlers for graceful shutdown"""
        def signal_handler(sig, frame):
            logger.info(f"Received signal {sig}, shutting down...")
            asyncio.create_task(self.stop())
        
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
