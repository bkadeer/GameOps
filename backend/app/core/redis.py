"""Redis connection and cache management"""
import json
import logging
from typing import Optional, Any
from redis import asyncio as aioredis
from app.core.config import settings

logger = logging.getLogger(__name__)

class RedisManager:
    """Manages Redis connections and caching operations"""
    
    def __init__(self):
        self.redis: Optional[aioredis.Redis] = None
        self._connected = False
    
    async def connect(self):
        """Establish Redis connection"""
        try:
            self.redis = await aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                max_connections=50,
                socket_connect_timeout=5,
                socket_keepalive=True,
                health_check_interval=30
            )
            # Test connection
            await self.redis.ping()
            self._connected = True
            logger.info(f"✅ Redis connected: {settings.REDIS_URL}")
        except Exception as e:
            logger.error(f"❌ Redis connection failed: {e}")
            self._connected = False
            # Don't raise - allow app to run without Redis
    
    async def disconnect(self):
        """Close Redis connection"""
        if self.redis:
            await self.redis.close()
            self._connected = False
            logger.info("Redis disconnected")
    
    @property
    def is_connected(self) -> bool:
        """Check if Redis is connected"""
        return self._connected and self.redis is not None
    
    # Session Cache Methods
    async def cache_session(self, session_id: str, session_data: dict, ttl: int = 3600):
        """Cache session data with TTL"""
        if not self.is_connected:
            logger.warning("Redis not connected, skipping cache")
            return False
        
        try:
            key = f"session:{session_id}"
            await self.redis.setex(
                key,
                ttl,
                json.dumps(session_data, default=str)
            )
            logger.debug(f"Cached session {session_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to cache session {session_id}: {e}")
            return False
    
    async def get_session(self, session_id: str) -> Optional[dict]:
        """Retrieve cached session data"""
        if not self.is_connected:
            return None
        
        try:
            key = f"session:{session_id}"
            data = await self.redis.get(key)
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            logger.error(f"Failed to get session {session_id}: {e}")
            return None
    
    async def delete_session(self, session_id: str):
        """Remove session from cache"""
        if not self.is_connected:
            return False
        
        try:
            key = f"session:{session_id}"
            await self.redis.delete(key)
            logger.debug(f"Deleted session {session_id} from cache")
            return True
        except Exception as e:
            logger.error(f"Failed to delete session {session_id}: {e}")
            return False
    
    async def get_active_sessions(self) -> list:
        """Get all active session IDs from cache"""
        if not self.is_connected:
            return []
        
        try:
            keys = await self.redis.keys("session:*")
            return [key.replace("session:", "") for key in keys]
        except Exception as e:
            logger.error(f"Failed to get active sessions: {e}")
            return []
    
    # Station Cache Methods
    async def cache_station_status(self, station_id: str, status: str, ttl: int = 300):
        """Cache station status"""
        if not self.is_connected:
            return False
        
        try:
            key = f"station:{station_id}:status"
            await self.redis.setex(key, ttl, status)
            return True
        except Exception as e:
            logger.error(f"Failed to cache station status: {e}")
            return False
    
    async def get_station_status(self, station_id: str) -> Optional[str]:
        """Get cached station status"""
        if not self.is_connected:
            return None
        
        try:
            key = f"station:{station_id}:status"
            return await self.redis.get(key)
        except Exception as e:
            logger.error(f"Failed to get station status: {e}")
            return None
    
    # Pub/Sub for real-time events
    async def publish_event(self, channel: str, message: dict):
        """Publish event to Redis channel"""
        if not self.is_connected:
            return False
        
        try:
            await self.redis.publish(
                channel,
                json.dumps(message, default=str)
            )
            return True
        except Exception as e:
            logger.error(f"Failed to publish to {channel}: {e}")
            return False
    
    # Generic cache methods
    async def set(self, key: str, value: Any, ttl: Optional[int] = None):
        """Set a cache value"""
        if not self.is_connected:
            return False
        
        try:
            if ttl:
                await self.redis.setex(key, ttl, json.dumps(value, default=str))
            else:
                await self.redis.set(key, json.dumps(value, default=str))
            return True
        except Exception as e:
            logger.error(f"Failed to set {key}: {e}")
            return False
    
    async def get(self, key: str) -> Optional[Any]:
        """Get a cache value"""
        if not self.is_connected:
            return None
        
        try:
            data = await self.redis.get(key)
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            logger.error(f"Failed to get {key}: {e}")
            return None
    
    async def delete(self, key: str):
        """Delete a cache key"""
        if not self.is_connected:
            return False
        
        try:
            await self.redis.delete(key)
            return True
        except Exception as e:
            logger.error(f"Failed to delete {key}: {e}")
            return False
    
    async def increment(self, key: str, amount: int = 1) -> Optional[int]:
        """Increment a counter"""
        if not self.is_connected:
            return None
        
        try:
            return await self.redis.incrby(key, amount)
        except Exception as e:
            logger.error(f"Failed to increment {key}: {e}")
            return None

# Global Redis manager instance
redis_manager = RedisManager()

async def get_redis() -> RedisManager:
    """Dependency to get Redis manager"""
    return redis_manager
