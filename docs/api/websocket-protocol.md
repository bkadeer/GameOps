# WebSocket Protocol Specification

## Overview

The EVMS WebSocket protocol enables real-time bidirectional communication between the FastAPI server and PC agents. All messages are JSON-formatted and follow a consistent structure.

## Connection

### Endpoint
```
wss://api.venue.local/ws/agent/{station_id}
```

### Authentication
```
Authorization: Bearer <jwt_token>
```

### Connection Flow
1. Agent initiates WebSocket connection with JWT token
2. Server validates token and station_id
3. Server accepts connection and registers agent
4. Agent sends `agent_hello` message
5. Server responds with `server_hello`
6. Heartbeat loop begins

---

## Message Structure

### Base Message Format
```json
{
  "type": "message_type",
  "timestamp": "2025-10-16T10:30:00.000Z",
  "data": {}
}
```

---

## Server → Agent Messages

### 1. server_hello
Sent immediately after connection is established.

```json
{
  "type": "server_hello",
  "timestamp": "2025-10-16T10:30:00.000Z",
  "data": {
    "server_version": "1.0.0",
    "heartbeat_interval": 30,
    "station": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "PC-01",
      "status": "ONLINE"
    }
  }
}
```

### 2. session_start
Instructs agent to start a new session.

```json
{
  "type": "session_start",
  "timestamp": "2025-10-16T10:30:00.000Z",
  "data": {
    "session_id": "660e8400-e29b-41d4-a716-446655440001",
    "duration_seconds": 3600,
    "user": {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "username": "player123",
      "membership_tier": "PREMIUM"
    },
    "scheduled_end_at": "2025-10-16T11:30:00.000Z"
  }
}
```

**Agent Actions:**
- Start local countdown timer
- Display kiosk UI overlay with remaining time
- Enable session monitoring
- Send acknowledgment

### 3. session_extend
Adds time to an active session.

```json
{
  "type": "session_extend",
  "timestamp": "2025-10-16T11:00:00.000Z",
  "data": {
    "session_id": "660e8400-e29b-41d4-a716-446655440001",
    "additional_seconds": 1800,
    "new_scheduled_end_at": "2025-10-16T12:00:00.000Z"
  }
}
```

**Agent Actions:**
- Add time to countdown timer
- Update kiosk UI
- Show "Time added!" notification (5 seconds)
- Send acknowledgment

### 4. session_stop
Manually stops a session (no enforcement).

```json
{
  "type": "session_stop",
  "timestamp": "2025-10-16T11:15:00.000Z",
  "data": {
    "session_id": "660e8400-e29b-41d4-a716-446655440001",
    "action": "lock",
    "reason": "manual_stop"
  }
}
```

**Actions:**
- `lock`: Lock screen only (user can unlock)
- `logoff`: Logoff Windows user
- `none`: Just stop timer

**Agent Actions:**
- Stop countdown timer
- Hide kiosk UI overlay
- Execute specified action
- Send acknowledgment

### 5. session_expired
Session time has expired (enforcement required).

```json
{
  "type": "session_expired",
  "timestamp": "2025-10-16T11:30:00.000Z",
  "data": {
    "session_id": "660e8400-e29b-41d4-a716-446655440001",
    "action": "logoff",
    "grace_period_seconds": 30
  }
}
```

**Agent Actions:**
1. Lock screen immediately
2. Show "Session ended" full-screen message
3. Wait grace_period_seconds for user to save work
4. Execute logoff
5. Send acknowledgment with result

### 6. session_warning
Warning before session expiration.

```json
{
  "type": "session_warning",
  "timestamp": "2025-10-16T11:25:00.000Z",
  "data": {
    "session_id": "660e8400-e29b-41d4-a716-446655440001",
    "remaining_seconds": 300,
    "warning_level": "5min"
  }
}
```

**Warning Levels:**
- `5min`: 5 minutes remaining (yellow notification)
- `1min`: 1 minute remaining (red notification, disable game input)

**Agent Actions:**
- Show prominent warning overlay
- Play alert sound (if configured)
- If 1min: Disable game input (optional)

### 7. heartbeat_ack
Acknowledges agent heartbeat.

```json
{
  "type": "heartbeat_ack",
  "timestamp": "2025-10-16T10:30:30.000Z",
  "data": {
    "server_time": "2025-10-16T10:30:30.000Z"
  }
}
```

### 8. sync_response
Response to agent sync request (after reconnection).

```json
{
  "type": "sync_response",
  "timestamp": "2025-10-16T10:35:00.000Z",
  "data": {
    "has_active_session": true,
    "session": {
      "session_id": "660e8400-e29b-41d4-a716-446655440001",
      "remaining_seconds": 3300,
      "scheduled_end_at": "2025-10-16T11:30:00.000Z"
    },
    "server_time": "2025-10-16T10:35:00.000Z"
  }
}
```

### 9. command
Generic command for agent control.

```json
{
  "type": "command",
  "timestamp": "2025-10-16T10:30:00.000Z",
  "data": {
    "command": "restart",
    "params": {
      "delay_seconds": 60
    }
  }
}
```

**Commands:**
- `restart`: Restart PC
- `shutdown`: Shutdown PC
- `update_config`: Update agent configuration
- `clear_cache`: Clear local cache
- `screenshot`: Take screenshot for support

### 10. error
Server-side error notification.

```json
{
  "type": "error",
  "timestamp": "2025-10-16T10:30:00.000Z",
  "data": {
    "code": "SESSION_NOT_FOUND",
    "message": "Session does not exist or has expired",
    "details": {}
  }
}
```

---

## Agent → Server Messages

### 1. agent_hello
Sent immediately after connection.

```json
{
  "type": "agent_hello",
  "timestamp": "2025-10-16T10:30:00.000Z",
  "data": {
    "agent_version": "1.0.0",
    "os": "Windows 11 Pro",
    "os_version": "22H2",
    "hostname": "PC-01-GAMING",
    "specs": {
      "cpu": "Intel Core i7-12700K",
      "gpu": "NVIDIA RTX 3080",
      "ram_gb": 32,
      "storage_gb": 1000
    }
  }
}
```

### 2. heartbeat
Periodic status update (every 30 seconds).

```json
{
  "type": "heartbeat",
  "timestamp": "2025-10-16T10:30:30.000Z",
  "data": {
    "session_id": "660e8400-e29b-41d4-a716-446655440001",
    "remaining_seconds": 3570,
    "system_metrics": {
      "cpu_usage_percent": 45.2,
      "ram_usage_percent": 62.1,
      "gpu_usage_percent": 78.5,
      "disk_usage_percent": 55.0,
      "network_rx_mbps": 12.5,
      "network_tx_mbps": 2.3,
      "temperature_celsius": 65
    },
    "active_processes": [
      {"name": "steam.exe", "cpu": 5.2, "ram_mb": 450},
      {"name": "game.exe", "cpu": 35.0, "ram_mb": 8192}
    ]
  }
}
```

**If no active session:**
```json
{
  "type": "heartbeat",
  "timestamp": "2025-10-16T10:30:30.000Z",
  "data": {
    "session_id": null,
    "system_metrics": { /* ... */ }
  }
}
```

### 3. ack
Acknowledges server message.

```json
{
  "type": "ack",
  "timestamp": "2025-10-16T10:30:00.100Z",
  "data": {
    "message_type": "session_start",
    "message_timestamp": "2025-10-16T10:30:00.000Z",
    "status": "success"
  }
}
```

**Status values:**
- `success`: Message processed successfully
- `error`: Failed to process message
- `partial`: Partially processed

### 4. sync_request
Request current session state (after reconnection).

```json
{
  "type": "sync_request",
  "timestamp": "2025-10-16T10:35:00.000Z",
  "data": {
    "last_known_session_id": "660e8400-e29b-41d4-a716-446655440001",
    "last_known_remaining_seconds": 3300,
    "disconnected_at": "2025-10-16T10:33:00.000Z"
  }
}
```

### 5. session_event
Reports session-related events.

```json
{
  "type": "session_event",
  "timestamp": "2025-10-16T11:30:00.000Z",
  "data": {
    "session_id": "660e8400-e29b-41d4-a716-446655440001",
    "event": "expired_enforced",
    "details": {
      "action_taken": "logoff",
      "success": true,
      "error": null
    }
  }
}
```

**Events:**
- `started`: Session started successfully
- `warning_shown`: Warning displayed to user
- `expired_enforced`: Expiration action executed
- `stopped`: Session stopped manually
- `error`: Error during session management

### 6. status_change
Reports station status changes.

```json
{
  "type": "status_change",
  "timestamp": "2025-10-16T10:30:00.000Z",
  "data": {
    "old_status": "ONLINE",
    "new_status": "MAINTENANCE",
    "reason": "Hardware issue reported"
  }
}
```

**Status values:**
- `ONLINE`: Available for sessions
- `OFFLINE`: Agent disconnected
- `IN_SESSION`: Currently in use
- `MAINTENANCE`: Under maintenance

### 7. error
Agent-side error notification.

```json
{
  "type": "error",
  "timestamp": "2025-10-16T10:30:00.000Z",
  "data": {
    "code": "ENFORCEMENT_FAILED",
    "message": "Failed to logoff user",
    "details": {
      "session_id": "660e8400-e29b-41d4-a716-446655440001",
      "error": "Access denied"
    }
  }
}
```

**Error Codes:**
- `ENFORCEMENT_FAILED`: Cannot lock/logoff
- `SESSION_SYNC_ERROR`: Cannot sync session state
- `SYSTEM_ERROR`: General system error
- `CONFIG_ERROR`: Configuration issue

### 8. user_action
Reports user interactions.

```json
{
  "type": "user_action",
  "timestamp": "2025-10-16T10:30:00.000Z",
  "data": {
    "session_id": "660e8400-e29b-41d4-a716-446655440001",
    "action": "extend_request",
    "details": {
      "requested_minutes": 30
    }
  }
}
```

**Actions:**
- `extend_request`: User clicked "Add Time" button
- `help_request`: User requested assistance
- `report_issue`: User reported a problem

---

## Connection Management

### Reconnection Strategy

```python
# Agent reconnection logic
class ReconnectionStrategy:
    def __init__(self):
        self.attempt = 0
        self.max_attempts = 10
        self.base_delay = 5  # seconds
        self.max_delay = 300  # 5 minutes
    
    def get_delay(self) -> int:
        """Exponential backoff with jitter"""
        delay = min(self.base_delay * (2 ** self.attempt), self.max_delay)
        jitter = random.uniform(0, delay * 0.1)
        return delay + jitter
    
    def should_retry(self) -> bool:
        return self.attempt < self.max_attempts
    
    def increment(self):
        self.attempt += 1
    
    def reset(self):
        self.attempt = 0
```

### Offline Mode

When disconnected, the agent:
1. Continues countdown timer locally
2. Stores events in local queue
3. Attempts reconnection with exponential backoff
4. Syncs state upon reconnection
5. Replays queued events to server

---

## Error Handling

### Connection Errors

| Error | Code | Action |
|-------|------|--------|
| Invalid token | 1008 | Regenerate token, reconnect |
| Station not found | 1008 | Contact admin |
| Server unavailable | 1006 | Retry with backoff |
| Network timeout | 1006 | Retry with backoff |

### Message Errors

| Error | Response |
|-------|----------|
| Invalid JSON | Send error message to server |
| Unknown message type | Log and ignore |
| Missing required fields | Send error message to server |
| Invalid session_id | Request sync from server |

---

## Performance Considerations

### Message Size Limits
- Maximum message size: **64 KB**
- Heartbeat messages: **~2 KB**
- Session start messages: **~1 KB**

### Latency Targets
- Heartbeat round-trip: **<500ms** on LAN
- Command execution: **<2s** from server to enforcement
- Reconnection time: **<10s** after network restore

### Bandwidth Usage
- Heartbeat (30s interval): **~5 KB/min** per agent
- 100 agents: **~500 KB/min** = **~8 KB/s**
- Negligible for gigabit LAN

---

## Security

### Message Validation

```python
# Server-side validation
from pydantic import BaseModel, validator

class WebSocketMessage(BaseModel):
    type: str
    timestamp: datetime
    data: dict
    
    @validator('type')
    def validate_type(cls, v):
        allowed_types = [
            'agent_hello', 'heartbeat', 'ack', 
            'sync_request', 'session_event', 'error'
        ]
        if v not in allowed_types:
            raise ValueError(f'Invalid message type: {v}')
        return v
    
    @validator('timestamp')
    def validate_timestamp(cls, v):
        # Reject messages with timestamp drift > 5 minutes
        now = datetime.utcnow()
        if abs((now - v).total_seconds()) > 300:
            raise ValueError('Timestamp drift too large')
        return v
```

### Rate Limiting

```python
# Limit messages per agent
MAX_MESSAGES_PER_MINUTE = 120  # 2 per second average

# Track message count in Redis
async def check_rate_limit(station_id: str) -> bool:
    key = f"ws_rate_limit:{station_id}"
    count = await redis.incr(key)
    if count == 1:
        await redis.expire(key, 60)
    return count <= MAX_MESSAGES_PER_MINUTE
```

---

## Testing

### WebSocket Test Client

```python
# tests/test_websocket.py
import pytest
from fastapi.testclient import TestClient

def test_agent_connection():
    with TestClient(app) as client:
        with client.websocket_connect(
            f"/ws/agent/{station_id}",
            headers={"Authorization": f"Bearer {token}"}
        ) as websocket:
            # Receive server_hello
            data = websocket.receive_json()
            assert data["type"] == "server_hello"
            
            # Send agent_hello
            websocket.send_json({
                "type": "agent_hello",
                "timestamp": datetime.utcnow().isoformat(),
                "data": {"agent_version": "1.0.0"}
            })
            
            # Send heartbeat
            websocket.send_json({
                "type": "heartbeat",
                "timestamp": datetime.utcnow().isoformat(),
                "data": {"session_id": None}
            })
            
            # Receive heartbeat_ack
            data = websocket.receive_json()
            assert data["type"] == "heartbeat_ack"
```

---

## Next: README and Project Setup
