# GameOps PC Agent

Professional Windows client for esports gaming cafes and internet cafes with time-based session management.

## Features

### Core Features
- ✅ **WebSocket Communication** - Real-time connection to backend
- ✅ **Session Management** - Automatic session tracking and enforcement
- ✅ **System Monitoring** - CPU, RAM, Disk usage reporting
- ✅ **Time Warnings** - Notify users before session ends
- ✅ **Heartbeat** - Regular status updates to backend
- ✅ **Auto-Reconnect** - Automatic reconnection on network issues

### Professional Lock Screen 🎮
- ✅ **Smooth Animations** - Fade-in/out transitions (1 second)
- ✅ **Venue Branding** - Display your logo with glow effect
- ✅ **Dimmed Background** - 60% transparent overlay preserves desktop
- ✅ **Input Blocking** - Complete keyboard/mouse freeze (requires admin)
- ✅ **Unbreakable Security** - Auto-relaunch if tampered, blocks all shortcuts
- ✅ **Dynamic Messages** - Update text via WebSocket without restart
- ✅ **Remote Unlock** - Instant unlock from admin dashboard
- ✅ **No Password Needed** - Seamless resume when time is added

## Requirements

- Windows 10/11
- Python 3.9+
- Network access to backend server

## Installation

### 1. Clone and Setup Virtual Environment

```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Add Venue Logo (Optional)

Place your venue logo as `assets/logo.png`:
- Format: PNG (transparency recommended)
- Size: Any (auto-resized to 250x250)
- Recommended: 512x512 or 1024x1024 for best quality

If no logo provided, falls back to lock icon emoji.

### 3. Configure Agent

Edit `config.yaml` with your settings:
```yaml
agent:
  station_id: "7860f893-996d-477c-adac-b24e655a7d03"
  station_name: "PC-LENOVO"

backend:
  api_url: "http://10.0.0.240:8000/api/v1"
  url: "ws://10.0.0.240:8000/ws/agent"
  token: "your-agent-token-here"
```

Edit `.env` with your credentials:
```env
STATION_ID=7860f893-996d-477c-adac-b24e655a7d03
BACKEND_URL=ws://10.0.0.240:8000/ws/agent
BACKEND_API_URL=http://10.0.0.240:8000/api/v1
AGENT_TOKEN=your-agent-token-here
```

### 4. Build Executable (Production)

```powershell
.\rebuild.bat
```

This creates `dist\GameOpsAgent.exe` with all dependencies bundled.

### 5. Run Agent

**Development:**
```powershell
venv\Scripts\python.exe main.py
```

**Production (IMPORTANT - Run as Administrator):**
```powershell
Right-click dist\GameOpsAgent.exe → Run as administrator
```

Running as administrator enables full input blocking on lock screen.

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
  auto_lock: true          # Show lock screen when session expires
  auto_logout: false       # Logout instead of lock (not recommended)
  show_notifications: true # Show system notifications
  block_shutdown: true     # Prevent shutdown during session
```

## Lock Screen System

### Visual Design
- **Dimmed Background**: 60% transparent black overlay
- **Venue Logo**: Centered with smooth glow animation (place logo at `assets/logo.png`)
- **Smooth Transitions**: 1-second fade-in/out animations
- **Modern Typography**: Professional fonts and layout
- **Dynamic Messages**: Update text via WebSocket without restart

### Security Features
- **Complete Input Blocking**: Keyboard and mouse frozen (requires admin)
- **Shortcut Blocking**: Alt+Tab, Alt+F4, Ctrl+Alt+Del, Escape all disabled
- **Auto-Relaunch**: Instantly relaunches if tampered (monitored every 500ms)
- **Task Manager Disabled**: Prevents process termination
- **Always On Top**: Cannot be minimized or hidden
- **Unbreakable**: Survives all tampering attempts

### Remote Control via WebSocket
```json
// Lock screen
{"action": "lock_screen"}

// Unlock screen  
{"action": "unlock_screen"}

// Update message
{"action": "update_lock_message", "message": "New text here"}
```

### API Methods
```python
# Show lock screen with fade-in
overlay.show_lock_screen()

# Hide lock screen with fade-out
overlay.hide_lock_screen()

# Update message dynamically
overlay.update_message("Visit counter to add more time")
```

### Testing Lock Screen
```powershell
# 1. Run agent as administrator
Right-click GameOpsAgent.exe → Run as administrator

# 2. Start a short test session (2 minutes)
# 3. Wait for session to expire
# 4. Verify:
#    - Lock screen appears with fade-in
#    - Venue logo displays with glow effect
#    - Keyboard/mouse are frozen
#    - Alt+Tab, Alt+F4 are blocked
#    - Cannot close or minimize
# 5. Extend session from backend
# 6. Verify lock screen disappears with fade-out
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
├── agent/                    # Source code
│   ├── agent.py             # Main application
│   ├── lock_overlay.py      # Lock screen system
│   ├── session_manager.py   # Session management
│   ├── system_control.py    # Windows integration
│   ├── system_monitor.py    # Performance monitoring
│   └── kiosk_overlay.py     # Time remaining overlay
├── assets/                   # Venue branding
│   ├── logo.png             # Your venue logo (add yours)
│   └── README.md            # Logo requirements
├── main.py                   # Entry point
├── config.yaml               # Configuration
├── .env                      # Credentials (DO NOT COMMIT)
├── requirements.txt          # Python dependencies
├── rebuild.bat               # Build executable
├── cleanup.bat               # Clean temp files
├── install_service.bat       # Install Windows service
├── uninstall_service.bat     # Uninstall service
└── README.md                 # This file (all documentation)

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

## Deployment

### Quick Deployment (5 Minutes)
```powershell
# 1. Configure
# Edit config.yaml - Set backend URL and station info
# Edit .env - Set agent token

# 2. Build
.\rebuild.bat

# 3. Deploy to target PC
# Copy: dist\GameOpsAgent.exe, config.yaml, .env, assets\

# 4. Run as Administrator
Right-click GameOpsAgent.exe → Run as administrator
```

### Auto-Start Setup
```powershell
# Option 1: Task Scheduler
# Open Task Scheduler → Create Basic Task
# Trigger: At startup
# Action: Start GameOpsAgent.exe
# Settings: ☑ Run with highest privileges

# Option 2: Windows Service
install_service.bat
net start GameOpsAgent
```

### Multiple PC Deployment
```powershell
# 1. Build once
.\rebuild.bat

# 2. For each PC, copy and configure:
# - GameOpsAgent.exe
# - config.yaml (unique station_id per PC)
# - .env (unique token per PC)
# - assets\logo.png

# 3. Setup auto-start on each PC
```

## Troubleshooting

### Agent Won't Connect
- Check backend URL in `config.yaml`
- Verify backend server is running: `ping backend-server`
- Check firewall rules
- Verify agent token is correct in `.env`
- Check `agent.log` for connection errors

### Lock Screen Not Working
- **MUST run as administrator** for full functionality
- Verify `auto_lock: true` in `config.yaml`
- Check logs for "Lock overlay shown" message
- Test with short session (2 minutes)

### Input Not Blocked
- **MUST run as administrator** - This is required!
- Check logs for "Input blocked - keyboard and mouse disabled"
- If "Failed to block input - requires admin", elevate privileges
- Verify Windows UAC allows admin apps

### Logo Not Appearing
- Check `assets/logo.png` exists
- Verify file is PNG format
- Check logs for "Found venue logo at: ..." message
- Falls back to lock emoji (🔒) if logo not found

### Performance Issues
- CPU should be <5% idle, ~2-3% during animations
- RAM should be <100MB
- If slow, reduce animation frame rate in code
- Use smaller logo file (<500KB)

### Session Not Starting
- Check WebSocket connection in logs
- Verify station is registered in backend
- Check backend logs for errors
- Ensure backend is sending correct session data

## Security Notes

### Production Security
- **Use WSS/HTTPS** (not WS/HTTP) in production
- **Unique tokens** per station - never reuse
- **Never commit** `.env` to git (contains tokens)
- **Rotate tokens** periodically for security
- **Run as admin** for full input blocking
- **Monitor logs** regularly for suspicious activity

### Network Security
- Use VPN for remote backends
- Implement certificate validation
- Restrict backend access by IP
- Use firewall rules

### Access Control
- Limit access to agent files
- Restrict config file permissions
- Log all configuration changes
- Monitor for unauthorized access

## Monitoring

### Check Agent Status
```powershell
# Check if running
tasklist | findstr GameOpsAgent

# View logs
Get-Content agent.log -Tail 50

# Watch logs in real-time
Get-Content agent.log -Wait

# Search for errors
Select-String -Path agent.log -Pattern "ERROR"
```

### Performance Monitoring
```powershell
# CPU usage
Get-Process GameOpsAgent | Select-Object CPU

# Memory usage
Get-Process GameOpsAgent | Select-Object WS
```

## Updates

### Update Procedure
```powershell
# 1. Build new version
.\rebuild.bat

# 2. Stop agent
taskkill /F /IM GameOpsAgent.exe

# 3. Backup current version
copy GameOpsAgent.exe GameOpsAgent.exe.backup

# 4. Copy new version
copy dist\GameOpsAgent.exe .

# 5. Start agent
# Run as administrator

# 6. Verify functionality
```

## License

Proprietary - GameOps Console Time Management System

## Support

For issues:
1. Check `agent.log` for errors
2. Review troubleshooting section above
3. Verify configuration is correct
4. Test with short session
5. Contact development team with logs
