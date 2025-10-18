"""
Windows system control functions
Handles locking, unlocking, and session management
"""
import os
import sys
import ctypes
import logging
from typing import Optional

# Import Windows-specific modules only on Windows
if sys.platform == 'win32':
    try:
        import win32api
        import win32con
        import win32gui
        WIN32_AVAILABLE = True
    except ImportError:
        WIN32_AVAILABLE = False
        logging.warning("pywin32 not available, some features will be limited")
else:
    WIN32_AVAILABLE = False

logger = logging.getLogger(__name__)

class SystemControl:
    """Windows system control"""
    
    def __init__(self):
        self.is_windows = sys.platform == 'win32'
        if not self.is_windows:
            logger.warning("Not running on Windows, system control features disabled")
    
    def lock_workstation(self) -> bool:
        """Lock the Windows workstation"""
        if not self.is_windows:
            logger.warning("Lock workstation only works on Windows")
            return False
        
        try:
            ctypes.windll.user32.LockWorkStation()
            logger.info("Workstation locked")
            return True
        except Exception as e:
            logger.error(f"Failed to lock workstation: {e}")
            return False
    
    def is_workstation_locked(self) -> bool:
        """Check if workstation is locked"""
        if not self.is_windows:
            return False
        
        try:
            # SystemParametersInfo with SPI_GETSCREENSAVERRUNNING
            running = ctypes.c_int(0)
            ctypes.windll.user32.SystemParametersInfoW(
                0x0072,  # SPI_GETSCREENSAVERRUNNING
                0,
                ctypes.byref(running),
                0
            )
            return bool(running.value)
        except Exception as e:
            logger.error(f"Failed to check lock status: {e}")
            return False
    
    def show_notification(self, title: str, message: str, duration: int = 5):
        """Show Windows notification"""
        if not self.is_windows:
            logger.info(f"Notification: {title} - {message}")
            return
        
        try:
            # This is a simplified notification
            # For production, use a proper notification library like plyer or win10toast
            logger.info(f"Notification: {title} - {message}")
            
        except Exception as e:
            logger.error(f"Failed to show notification: {e}")
    
    def logout_user(self) -> bool:
        """Logout current Windows user"""
        if not self.is_windows:
            logger.warning("Logout only works on Windows")
            return False
        
        try:
            # ExitWindowsEx with EWX_LOGOFF flag
            EWX_LOGOFF = 0
            EWX_FORCE = 4
            
            result = ctypes.windll.user32.ExitWindowsEx(EWX_LOGOFF | EWX_FORCE, 0)
            if result:
                logger.info("User logout initiated")
                return True
            else:
                logger.error("Failed to logout user")
                return False
        except Exception as e:
            logger.error(f"Failed to logout user: {e}")
            return False
    
    def prevent_sleep(self, prevent: bool = True):
        """Prevent system from sleeping"""
        if not self.is_windows:
            return
        
        try:
            ES_CONTINUOUS = 0x80000000
            ES_SYSTEM_REQUIRED = 0x00000001
            ES_DISPLAY_REQUIRED = 0x00000002
            
            if prevent:
                # Prevent sleep and keep display on
                ctypes.windll.kernel32.SetThreadExecutionState(
                    ES_CONTINUOUS | ES_SYSTEM_REQUIRED | ES_DISPLAY_REQUIRED
                )
                logger.info("Sleep prevention enabled")
            else:
                # Allow normal sleep behavior
                ctypes.windll.kernel32.SetThreadExecutionState(ES_CONTINUOUS)
                logger.info("Sleep prevention disabled")
        except Exception as e:
            logger.error(f"Failed to set sleep prevention: {e}")
    
    def get_current_user(self) -> Optional[str]:
        """Get current logged in username"""
        try:
            if self.is_windows and WIN32_AVAILABLE:
                import win32api
                return win32api.GetUserName()
            else:
                return os.getenv('USER') or os.getenv('USERNAME')
        except Exception as e:
            logger.error(f"Failed to get current user: {e}")
            return None
    
    def is_user_active(self) -> bool:
        """Check if user is actively using the system"""
        if not self.is_windows:
            return True
        
        try:
            # Get last input time
            class LASTINPUTINFO(ctypes.Structure):
                _fields_ = [
                    ('cbSize', ctypes.c_uint),
                    ('dwTime', ctypes.c_uint),
                ]
            
            lii = LASTINPUTINFO()
            lii.cbSize = ctypes.sizeof(LASTINPUTINFO)
            
            ctypes.windll.user32.GetLastInputInfo(ctypes.byref(lii))
            
            # Get current tick count
            current_tick = ctypes.windll.kernel32.GetTickCount()
            
            # Calculate idle time in seconds
            idle_time = (current_tick - lii.dwTime) / 1000.0
            
            # Consider active if idle time is less than 5 minutes
            return idle_time < 300
            
        except Exception as e:
            logger.error(f"Failed to check user activity: {e}")
            return True
    
    def show_message_box(self, title: str, message: str, style: int = 0):
        """Show Windows message box"""
        if not self.is_windows:
            logger.info(f"MessageBox: {title} - {message}")
            return
        
        try:
            # MB_OK = 0, MB_ICONINFORMATION = 64
            ctypes.windll.user32.MessageBoxW(0, message, title, style | 64)
        except Exception as e:
            logger.error(f"Failed to show message box: {e}")
