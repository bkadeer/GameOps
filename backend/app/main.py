from fastapi import FastAPI, Request, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1 import api_router
from app.websocket.manager import connection_manager
from app.websocket.dashboard_manager import dashboard_manager
from app.websocket.handlers import handle_agent_connection
from app.scheduler.session_monitor import SessionMonitor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Session monitor instance
session_monitor = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info("Starting EVMS Backend...")
    
    # Create database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Start session monitor
    global session_monitor
    session_monitor = SessionMonitor()
    await session_monitor.start()
    
    logger.info("EVMS Backend started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down EVMS Backend...")
    
    # Stop session monitor
    if session_monitor:
        await session_monitor.stop()
    
    # Close WebSocket connections
    await connection_manager.disconnect_all()
    await dashboard_manager.disconnect_all()
    
    logger.info("EVMS Backend shut down successfully")

# Create FastAPI app
app = FastAPI(
    title="Console Time Management API",
    description="Esports Venue Management System API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api/v1")

# WebSocket endpoint for agents
@app.websocket("/ws/agent/{station_id}")
async def websocket_agent_endpoint(websocket: WebSocket, station_id: str, token: str = ""):
    """WebSocket endpoint for PC agents"""
    await handle_agent_connection(websocket, station_id, token)

# WebSocket endpoint for dashboard
@app.websocket("/ws/dashboard")
async def websocket_dashboard_endpoint(websocket: WebSocket):
    """WebSocket endpoint for dashboard real-time updates"""
    await dashboard_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and listen for messages
            data = await websocket.receive_text()
            # Dashboard can send heartbeat or other messages if needed
            logger.debug(f"Received from dashboard: {data}")
    except Exception as e:
        logger.error(f"Dashboard WebSocket error: {e}")
    finally:
        dashboard_manager.disconnect(websocket)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "service": "evms-backend"
    }

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "EVMS API",
        "version": "1.0.0",
        "docs": "/api/docs"
    }

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "type": "internal_error"
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
