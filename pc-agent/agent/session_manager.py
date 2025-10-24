"""Session management - tracks active sessions and enforces time limits
"""
import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from .system_control import SystemControl
from .lock_overlay import LockOverlay

logger = logging.getLogger(__name__)

class SessionManager:
    """Manage gaming sessions on the PC"""
    
    def __init__(self, system_control: SystemControl, config):
        self.system_control = system_control
        self.config = config
        self.current_session: Optional[Dict[str, Any]] = None
        self.session_timer_task: Optional[asyncio.Task] = None
        self.warning_shown = False
        self.lock_overlay: Optional[LockOverlay] = None
        
        # Initialize lock overlay if auto_lock is enabled
        if self.config.get('features.auto_lock', True):
            self.lock_overlay = LockOverlay()
    
    def start_session(self, session_data: Dict[str, Any]):
        """Start a new gaming session"""
        try:
            self.current_session = {
                "id": session_data.get("id"),
                "user_id": session_data.get("user_id"),
                "started_at": datetime.fromisoformat(session_data.get("started_at")),
                "scheduled_end_at": datetime.fromisoformat(session_data.get("scheduled_end_at")),
                "duration_minutes": session_data.get("duration_minutes"),
                "extended_minutes": session_data.get("extended_minutes", 0),
            }
            
            logger.info(f"Session started: {self.current_session['id']}")
            logger.info(f"Duration: {self.current_session['duration_minutes']} minutes")
            logger.info(f"Ends at: {self.current_session['scheduled_end_at']}")
            
            # Hide lock overlay if it was shown
            if self.lock_overlay and self.lock_overlay.visible:
                logger.info("Hiding lock overlay for new session")
                self.lock_overlay.hide()
            
            # Unlock workstation if locked
            if self.system_control.is_workstation_locked():
                logger.info("Workstation is locked, but session started - keeping locked for security")
            
            # Prevent system sleep during session
            self.system_control.prevent_sleep(True)
            
            # Show notification
            self.system_control.show_notification(
                "Session Started",
                f"Your gaming session has started. Duration: {self.current_session['duration_minutes']} minutes"
            )
            
            # Start session timer
            if self.session_timer_task:
                self.session_timer_task.cancel()
            self.session_timer_task = asyncio.create_task(self._session_timer())
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to start session: {e}")
            return False
    
    def extend_session(self, additional_minutes: int, new_end_time: str):
        """Extend current session"""
        if not self.current_session:
            logger.warning("No active session to extend")
            return False
        
        try:
            old_end = self.current_session['scheduled_end_at']
            self.current_session['scheduled_end_at'] = datetime.fromisoformat(new_end_time)
            self.current_session['extended_minutes'] += additional_minutes
            self.warning_shown = False  # Reset warning flag
            
            logger.info(f"Session extended by {additional_minutes} minutes")
            logger.info(f"New end time: {self.current_session['scheduled_end_at']}")
            
            # Hide lock overlay if it was shown
            if self.lock_overlay and self.lock_overlay.visible:
                logger.info("Hiding lock overlay after session extension")
                self.lock_overlay.hide()
            
            # Unlock workstation if it was locked due to session expiry
            if self.system_control.is_workstation_locked():
                logger.info("Workstation is locked - user will need to unlock manually")
                # Note: Windows doesn't allow programmatic unlock for security
                # User will need to unlock manually, but session will be active
            
            # Show notification
            self.system_control.show_notification(
                "Session Extended",
                f"Your session has been extended by {additional_minutes} minutes"
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to extend session: {e}")
            return False
    
    def end_session(self, reason: str = "completed"):
        """End current session"""
        if not self.current_session:
            logger.warning("No active session to end")
            return False
        
        try:
            session_id = self.current_session['id']
            logger.info(f"Ending session: {session_id} (reason: {reason})")
            
            # Cancel timer
            if self.session_timer_task:
                self.session_timer_task.cancel()
                self.session_timer_task = None
            
            # Show notification
            self.system_control.show_notification(
                "Session Ended",
                f"Your gaming session has ended. Reason: {reason}"
            )
            
            # Grace period before lock/logout
            grace_period = self.config.get('session.grace_period', 60)
            if grace_period > 0:
                if self.config.get('features.auto_lock', True):
                    action = "frozen (keyboard/mouse disabled)"
                else:
                    action = "logged out"
                self.system_control.show_notification(
                    "Session Ending",
                    f"Your screen will be {action} in {grace_period} seconds. Please save your work."
                )
            
            # Allow system sleep
            self.system_control.prevent_sleep(False)
            
            # Clear session
            self.current_session = None
            self.warning_shown = False
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to end session: {e}")
            return False
    
    async def _session_timer(self):
        """Monitor session time and show warnings"""
        try:
            while self.current_session:
                await asyncio.sleep(10)  # Check every 10 seconds
                
                if not self.current_session:
                    break
                
                now = datetime.now(timezone.utc)
                end_time = self.current_session['scheduled_end_at']
                time_remaining = (end_time - now).total_seconds()
                
                # Show warning before session ends
                warning_time = self.config.get('session.warning_time', 300)
                if time_remaining <= warning_time and not self.warning_shown:
                    minutes_left = int(time_remaining / 60)
                    self.system_control.show_notification(
                        "Session Ending Soon",
                        f"Your session will end in {minutes_left} minutes. Please save your work."
                    )
                    self.warning_shown = True
                    logger.info(f"Session warning shown: {minutes_left} minutes remaining")
                
                # Session expired
                if time_remaining <= 0:
                    logger.warning("Session time expired")
                    self.end_session("time_expired")
                    
                    # Show lock overlay instead of logout if auto_lock is enabled
                    if self.config.get('features.auto_lock', True):
                        grace_period = self.config.get('session.grace_period', 60)
                        await asyncio.sleep(grace_period)
                        
                        logger.info("Showing lock overlay with input blocking")
                        
                        # Show fullscreen lock overlay (blocks keyboard/mouse)
                        if self.lock_overlay:
                            self.lock_overlay.show()
                        
                        # Optionally lock Windows workstation (requires password to unlock)
                        # Disabled by default - overlay with input blocking is sufficient
                        # self.system_control.lock_workstation()
                    elif self.config.get('features.auto_logout', False):
                        # Fallback to logout if auto_lock is disabled but auto_logout is enabled
                        grace_period = self.config.get('session.grace_period', 60)
                        await asyncio.sleep(grace_period)
                        
                        logger.info("Logging out user after grace period")
                        self.system_control.logout_user()
                    
                    break
                    
        except asyncio.CancelledError:
            logger.info("Session timer cancelled")
        except Exception as e:
            logger.error(f"Error in session timer: {e}")
    
    def get_session_status(self) -> Dict[str, Any]:
        """Get current session status"""
        if not self.current_session:
            return {
                "active": False,
                "session_id": None
            }
        
        now = datetime.now(timezone.utc)
        end_time = self.current_session['scheduled_end_at']
        time_remaining = max(0, (end_time - now).total_seconds())
        
        return {
            "active": True,
            "session_id": self.current_session['id'],
            "user_id": self.current_session['user_id'],
            "started_at": self.current_session['started_at'].isoformat(),
            "scheduled_end_at": self.current_session['scheduled_end_at'].isoformat(),
            "duration_minutes": self.current_session['duration_minutes'],
            "extended_minutes": self.current_session['extended_minutes'],
            "time_remaining_seconds": int(time_remaining),
            "time_remaining_minutes": int(time_remaining / 60),
        }
    
    def has_active_session(self) -> bool:
        """Check if there's an active session"""
        return self.current_session is not None
