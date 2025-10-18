# GameOps PC Agent

Windows client application for managing gaming station PCs remotely.

## Features

- ✅ **WebSocket Communication** - Real-time connection to backend
- ✅ **Session Management** - Automatic session tracking and enforcement
- ✅ **System Monitoring** - CPU, RAM, Disk usage reporting
- ✅ **Auto-Lock/Unlock** - Lock workstation when no active session
- ✅ **Auto-Logout** - Logout user when session expires
- ✅ **Time Warnings** - Notify users before session ends
- ✅ **Heartbeat** - Regular status updates to backend
- ✅ **Auto-Reconnect** - Automatic reconnection on network issues

## Requirements

- Windows 10/11
- Python 3.9+
- Network access to backend server

## Installation

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 2. Run Setup

```bash
python setup.py
```

This will prompt you for:
- Station ID (auto-generated if not provided)
- Station Name (e.g., PC-GAMING-01)
- Backend server address
- Agent authentication token

### 3. Configure Backend

In the backend admin panel:
1. Create a new station with the Station ID from setup
2. Generate an agent token for this station
3. Update the `AGENT_TOKEN` in `.env` file

### 4. Test the Agent

```bash
python main.py
```

The agent should connect to the backend and report online status.

## Configuration

Edit `config.yaml` to customize:

```yaml
agent:
  station_id: "your-station-uuid"
  station_name: "PC-GAMING-01"

backend:
  url: "ws://192.168.1.100:8000/ws/agent"
  api_url: "http://192.168.1.100:8000/api/v1"
  token: "your-agent-token"
  reconnect_interval: 5
  heartbeat_interval: 30

session:
  warning_time: 300  # 5 minutes
  grace_period: 60   # 1 minute
  check_interval: 10

features:
  auto_lock: true
  auto_logout: true
  show_notifications: true
  block_shutdown: true
```

## Running as Windows Service

### Install Service (Run as Administrator)

```batch
install_service.bat
```

### Start/Stop Service

```batch
net start GameOpsAgent
net stop GameOpsAgent
```

### Uninstall Service

```batch
uninstall_service.bat
```

## WebSocket Protocol

The agent communicates with the backend using WebSocket messages:

### Messages from Backend:

- `session_start` - Start a new gaming session
- `session_extend` - Extend current session
- `session_end` - End current session
- `lock_station` - Lock the workstation
- `get_status` - Request status report
- `ping` - Heartbeat check

### Messages to Backend:

- `agent_connected` - Agent connected successfully
- `session_start_response` - Session start result
- `session_extend_response` - Session extend result
- `session_end_response` - Session end result
- `status_update` - Periodic status update
- `status_report` - Full status report
- `heartbeat` - Keep-alive message
- `pong` - Heartbeat response

## Session Flow

1. **No Session** - Workstation is locked (if auto_lock enabled)
2. **Session Start** - Backend sends `session_start` message
   - Agent unlocks workstation (user must login)
   - Prevents system sleep
   - Starts session timer
3. **During Session** - Agent monitors time remaining
   - Shows warning 5 minutes before end
   - Sends periodic status updates
4. **Session End** - When time expires or manually ended
   - Shows logout warning
   - Grace period (60 seconds)
   - Auto-logout user (if enabled)
   - Locks workstation

## Troubleshooting

### Agent won't connect

- Check backend URL in config.yaml
- Verify backend is running
- Check firewall settings
- Verify agent token is correct

### Session not starting

- Check WebSocket connection
- Verify station is registered in backend
- Check backend logs for errors

### Auto-logout not working

- Requires Administrator privileges
- Check `features.auto_logout` in config
- Verify Windows user permissions

### Notifications not showing

- Check `features.show_notifications` in config
- Verify Windows notification settings
- May require additional notification library

## Logs

Logs are written to `agent.log` with rotation:
- Max size: 10MB
- Backup count: 5 files

View logs:
```bash
tail -f agent.log  # Linux/Mac
Get-Content agent.log -Wait  # PowerShell
```

## Development

### Project Structure

```
pc-agent/
├── agent/
│   ├── __init__.py
│   ├── agent.py              # Main agent application
│   ├── config.py             # Configuration management
│   ├── websocket_client.py   # WebSocket communication
│   ├── system_control.py     # Windows system control
│   ├── system_monitor.py     # System monitoring
│   └── session_manager.py    # Session management
├── main.py                   # Entry point
├── setup.py                  # Setup script
├── config.yaml               # Configuration file
├── requirements.txt          # Python dependencies
└── README.md                 # This file
```

### Testing

Test individual components:

```python
# Test system control
from agent.system_control import SystemControl
sc = SystemControl()
sc.lock_workstation()

# Test system monitor
from agent.system_monitor import SystemMonitor
sm = SystemMonitor()
print(sm.get_status_report())
```

## Security Notes

- Agent token should be kept secure
- Run agent with limited user privileges when possible
- Auto-logout requires elevated privileges
- WebSocket connection should use WSS (TLS) in production
- Validate all messages from backend

## License

Proprietary - GameOps Console Time Management System

## Support

For issues or questions, contact the development team.
