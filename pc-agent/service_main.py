"""
GameOps Agent - Windows Service Version
Runs as a background service, auto-starts with Windows
"""

import sys
import os
import win32serviceutil
import win32service
import win32event
import servicemanager
import socket
import asyncio
import logging
from pathlib import Path

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from agent.agent import GameOpsAgent
from agent.config import load_config

# Setup logging
log_dir = Path(os.getenv('PROGRAMDATA', 'C:\\ProgramData')) / 'GameOps'
log_dir.mkdir(exist_ok=True)
log_file = log_dir / 'agent.log'

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)


class GameOpsService(win32serviceutil.ServiceFramework):
    """Windows Service for GameOps Agent"""
    
    _svc_name_ = "GameOpsAgent"
    _svc_display_name_ = "GameOps Gaming Station Agent"
    _svc_description_ = "Manages gaming sessions and workstation locking for GameOps"
    
    def __init__(self, args):
        win32serviceutil.ServiceFramework.__init__(self, args)
        self.stop_event = win32event.CreateEvent(None, 0, 0, None)
        self.agent = None
        socket.setdefaulttimeout(60)
        
    def SvcStop(self):
        """Stop the service"""
        logger.info("Service stop requested")
        self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
        win32event.SetEvent(self.stop_event)
        
        # Stop agent
        if self.agent:
            try:
                asyncio.run(self.agent.stop())
            except Exception as e:
                logger.error(f"Error stopping agent: {e}")
        
    def SvcDoRun(self):
        """Run the service"""
        logger.info("GameOps Agent Service starting...")
        servicemanager.LogMsg(
            servicemanager.EVENTLOG_INFORMATION_TYPE,
            servicemanager.PYS_SERVICE_STARTED,
            (self._svc_name_, '')
        )
        
        try:
            self.main()
        except Exception as e:
            logger.error(f"Service error: {e}", exc_info=True)
            servicemanager.LogErrorMsg(f"Service error: {e}")
    
    def main(self):
        """Main service loop"""
        try:
            # Load configuration
            config_path = Path(os.path.dirname(os.path.abspath(__file__))) / 'config.ini'
            if not config_path.exists():
                # Try ProgramData location
                config_path = Path(os.getenv('PROGRAMDATA', 'C:\\ProgramData')) / 'GameOps' / 'config.ini'
            
            if not config_path.exists():
                logger.error("Configuration file not found!")
                return
            
            config = load_config(str(config_path))
            logger.info(f"Configuration loaded from {config_path}")
            
            # Create and run agent
            self.agent = GameOpsAgent(config)
            
            # Run agent in async loop
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            async def run_agent():
                await self.agent.start()
                # Keep running until stop event
                while win32event.WaitForSingleObject(self.stop_event, 1000) != win32event.WAIT_OBJECT_0:
                    await asyncio.sleep(1)
            
            loop.run_until_complete(run_agent())
            
        except Exception as e:
            logger.error(f"Error in main loop: {e}", exc_info=True)
        finally:
            logger.info("Service stopped")


def install_service():
    """Install the service"""
    try:
        win32serviceutil.InstallService(
            GameOpsService._svc_reg_class_,
            GameOpsService._svc_name_,
            GameOpsService._svc_display_name_,
            startType=win32service.SERVICE_AUTO_START,
            description=GameOpsService._svc_description_
        )
        print(f"✅ Service '{GameOpsService._svc_display_name_}' installed successfully")
        print("   - Auto-start: Enabled (starts with Windows)")
        print(f"   - Logs: {log_file}")
        print("\nNext steps:")
        print("1. Edit config.ini with your station details")
        print("2. Run: GameOpsAgent.exe --start")
    except Exception as e:
        print(f"❌ Error installing service: {e}")


def uninstall_service():
    """Uninstall the service"""
    try:
        win32serviceutil.RemoveService(GameOpsService._svc_name_)
        print(f"✅ Service '{GameOpsService._svc_display_name_}' uninstalled successfully")
    except Exception as e:
        print(f"❌ Error uninstalling service: {e}")


def start_service():
    """Start the service"""
    try:
        win32serviceutil.StartService(GameOpsService._svc_name_)
        print(f"✅ Service '{GameOpsService._svc_display_name_}' started")
    except Exception as e:
        print(f"❌ Error starting service: {e}")


def stop_service():
    """Stop the service"""
    try:
        win32serviceutil.StopService(GameOpsService._svc_name_)
        print(f"✅ Service '{GameOpsService._svc_display_name_}' stopped")
    except Exception as e:
        print(f"❌ Error stopping service: {e}")


if __name__ == '__main__':
    if len(sys.argv) == 1:
        # Run as service
        servicemanager.Initialize()
        servicemanager.PrepareToHostSingle(GameOpsService)
        servicemanager.StartServiceCtrlDispatcher()
    else:
        # Handle command-line arguments
        command = sys.argv[1].lower()
        
        if command == '--install':
            install_service()
        elif command == '--uninstall':
            uninstall_service()
        elif command == '--start':
            start_service()
        elif command == '--stop':
            stop_service()
        elif command == '--restart':
            stop_service()
            start_service()
        else:
            print("GameOps Agent - Windows Service")
            print("\nUsage:")
            print("  GameOpsAgent.exe --install    Install service")
            print("  GameOpsAgent.exe --uninstall  Uninstall service")
            print("  GameOpsAgent.exe --start      Start service")
            print("  GameOpsAgent.exe --stop       Stop service")
            print("  GameOpsAgent.exe --restart    Restart service")
