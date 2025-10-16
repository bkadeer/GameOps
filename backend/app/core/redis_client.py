import redis.asyncio as redis
from app.core.config import settings
import json
from typing import Optional, Any
import logging

logger = logging.getLogger(__name__)

class RedisClient:
    """Redis client wrapper"""
    
    def __init__(self):
        self.redis: Optional[redis.Redis] = None
        self.pubsub: Optional[redis.client.PubSub] = None
    
    async def connect(self):
        """Connect to Redis"""
        try:
            self.redis = await redis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True
            )
            await self.redis.ping()
            logger.info("Connected to Redis")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise
    
    async def disconnect(self):
        """Disconnect from Redis"""
        if self.redis:
            await self.redis.close()
            logger.info("Disconnected from Redis")
    
    async def get(self, key: str) -> Optional[str]:
        """Get value by key"""
        try:
            return await self.redis.get(key)
        except Exception as e:
            logger.error(f"Redis GET error: {e}")
            return None
    
    async def set(self, key: str, value: Any, ex: Optional[int] = None):
        """Set key-value pair with optional expiration"""
        try:
            if isinstance(value, (dict, list)):
                value = json.dumps(value)
            await self.redis.set(key, value, ex=ex)
        except Exception as e:
            logger.error(f"Redis SET error: {e}")
    
    async def delete(self, key: str):
        """Delete key"""
        try:
            await self.redis.delete(key)
        except Exception as e:
            logger.error(f"Redis DELETE error: {e}")
    
    async def publish(self, channel: str, message: Any):
        """Publish message to channel"""
        try:
            if isinstance(message, (dict, list)):
                message = json.dumps(message)
            await self.redis.publish(channel, message)
        except Exception as e:
            logger.error(f"Redis PUBLISH error: {e}")
    
    async def subscribe(self, *channels: str):
        """Subscribe to channels"""
        try:
            self.pubsub = self.redis.pubsub()
            await self.pubsub.subscribe(*channels)
            return self.pubsub
        except Exception as e:
            logger.error(f"Redis SUBSCRIBE error: {e}")
            return None
    
    async def get_json(self, key: str) -> Optional[dict]:
        """Get JSON value by key"""
        value = await self.get(key)
        if value:
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                logger.error(f"Failed to decode JSON for key: {key}")
        return None
    
    async def set_json(self, key: str, value: dict, ex: Optional[int] = None):
        """Set JSON value"""
        await self.set(key, json.dumps(value), ex=ex)
    
    async def incr(self, key: str) -> int:
        """Increment value"""
        try:
            return await self.redis.incr(key)
        except Exception as e:
            logger.error(f"Redis INCR error: {e}")
            return 0
    
    async def expire(self, key: str, seconds: int):
        """Set expiration on key"""
        try:
            await self.redis.expire(key, seconds)
        except Exception as e:
            logger.error(f"Redis EXPIRE error: {e}")

# Global Redis client instance
redis_client = RedisClient()

async def get_redis() -> RedisClient:
    """Get Redis client"""
    if not redis_client.redis:
        await redis_client.connect()
    return redis_client
