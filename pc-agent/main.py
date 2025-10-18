"""
PC Agent entry point
"""
import asyncio
import logging
import sys
from pathlib import Path

# Add agent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from agent.agent import PCAgent

def setup_logging(log_level: str = "INFO", log_file: str = "agent.log"):
    """Setup logging configuration"""
    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    
    # File handler
    file_handler = logging.FileHandler(log_file, encoding='utf-8')
    file_handler.setFormatter(formatter)
    
    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper()))
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)
    
    # Reduce noise from websockets
    logging.getLogger('websockets').setLevel(logging.WARNING)

async def main():
    """Main entry point"""
    # Setup logging
    setup_logging(log_level="INFO", log_file="agent.log")
    
    logger = logging.getLogger(__name__)
    logger.info("Starting GameOps PC Agent...")
    
    try:
        # Create and start agent
        agent = PCAgent(config_path="config.yaml")
        agent.setup_signal_handlers()
        
        await agent.start()
        
    except KeyboardInterrupt:
        logger.info("Interrupted by user")
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    if sys.platform == 'win32':
        # Use ProactorEventLoop on Windows for better compatibility
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    
    asyncio.run(main())
