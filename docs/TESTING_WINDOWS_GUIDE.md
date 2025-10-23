# Testing GameOps on Windows PC

This guide explains how to test the gaming center management system with a Windows PC while running the backend on Mac.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────┐
│  Mac (Development Server)                   │
│  ├─ Backend API: Port 8000                  │
│  ├─ Dashboard: Port 3000                    │
│  └─ PostgreSQL: Port 5432                   │
└─────────────────────────────────────────────┘
                    ↕ WiFi Network
┌─────────────────────────────────────────────┐
│  Windows Gaming PC                          │
│  └─ PC Agent (Python)                       │
│     - Connects to Mac backend               │
│     - Locks/unlocks Windows                 │
│     - Monitors session time                 │
└─────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

### On Mac (Server):
- ✅ Backend running
- ✅ Dashboard running
- ✅ PostgreSQL running
- ✅ Connected to WiFi

### On Windows PC:
- ✅ Python 3.9+ installed
- ✅ Connected to same WiFi network
- ✅ Administrator privileges (for locking)

---

## 🚀 Step-by-Step Setup

### **Step 1: Find Your Mac's IP Address**

On Mac terminal:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Example output:
```
inet 192.168.1.100 netmask 0xffffff00 broadcast 192.168.1.255
```

Your Mac's IP: **192.168.1.100** (use this in next steps)

---

### **Step 2: Update Backend CORS Settings**

Edit `/backend/app/core/config.py`:

```python
# CORS - Allow Windows PC to connect
CORS_ORIGINS: str = "http://localhost:3000,http://192.168.1.100:3000,http://192.168.1.*:*"
```

Or for testing, allow all:
```python
# For testing only - allow all origins
CORS_ORIGINS: str = "*"
```

---

### **Step 3: Run Backend on All Network Interfaces**

Instead of:
```bash
uvicorn app.main:app --reload
```

Use:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

This allows external connections.

---

### **Step 4: Update Dashboard Environment Variables**

Edit `/dashboard/.env.local`:

```bash
# Use Mac's IP address instead of localhost
NEXT_PUBLIC_API_URL=http://192.168.1.100:8000/api/v1
```

Restart dashboard:
```bash
npm run dev -- --host 0.0.0.0
```

---

### **Step 5: Setup Windows PC Agent**

#### **A. Copy Agent to Windows:**

Transfer the `/pc-agent` folder to Windows PC via:
- USB drive
- Network share
- Git clone

#### **B. Install Python on Windows:**

Download from: https://www.python.org/downloads/

**Important:** Check "Add Python to PATH" during installation

#### **C. Install Dependencies:**

Open Command Prompt as Administrator:
```cmd
cd C:\path\to\pc-agent
python -m venv venv-agent
venv-agent\Scripts\activate
pip install -r requirements.txt
```

#### **D. Configure Agent:**

Edit `pc-agent/.env`:
```bash
# Use your Mac's IP address
BACKEND_URL=ws://192.168.1.100:8000/ws/agent
BACKEND_HTTP_URL=http://192.168.1.100:8000/api/v1

# Station configuration
STATION_ID=your-station-uuid-here
AGENT_TOKEN=your-agent-token-here
```

---

### **Step 6: Register Windows Station**

#### **A. Access Dashboard from Windows:**

Open browser on Windows:
```
http://192.168.1.100:3000
```

Login with admin credentials.

#### **B. Add Station:**

1. Go to Stations page
2. Click "Add Station"
3. Fill in:
   - **Name**: "Gaming PC 1"
   - **Type**: "PC"
   - **Control Method**: "AGENT"
   - **IP Address**: Windows PC's IP (e.g., 192.168.1.101)

4. Copy the **Station ID** and **Agent Token**

#### **C. Update Agent Config:**

Paste the Station ID and Token into `pc-agent/.env`

---

### **Step 7: Run Agent on Windows**

Open Command Prompt as Administrator:

```cmd
cd C:\path\to\pc-agent
venv-agent\Scripts\activate
python main.py
```

You should see:
```
Agent starting...
Connecting to backend: ws://192.168.1.100:8000/ws/agent
Connected successfully!
Station status: ONLINE
```

---

### **Step 8: Test Session & Auto-Lock**

#### **A. Start Session from Dashboard:**

1. Open dashboard: `http://192.168.1.100:3000`
2. Click "Start Session" on Gaming PC 1
3. Set duration: 5 minutes (for testing)
4. Click "Start"

#### **B. What Should Happen on Windows:**

1. ✅ Agent receives session start command
2. ✅ Windows PC stays unlocked during session
3. ✅ After 5 minutes, session expires
4. ✅ **Windows PC automatically locks** 🔒
5. ✅ Station status changes to ONLINE

#### **C. Check Logs:**

**Windows Agent:**
```
Session started: {session_id}
Time remaining: 5:00
Time remaining: 4:00
...
Time remaining: 0:00
Session expired - locking workstation
Workstation locked successfully
```

**Mac Backend:**
```
Session created: {session_id}
Session monitor: Expiring session {session_id}
Station reset to ONLINE
```

---

## 🔧 Troubleshooting

### **Issue 1: Can't Connect to Backend**

**Check firewall on Mac:**
```bash
# Allow port 8000
sudo pfctl -d  # Disable firewall temporarily for testing
```

**Or configure firewall:**
System Preferences → Security & Privacy → Firewall → Firewall Options
- Allow incoming connections for Python

### **Issue 2: CORS Error**

Update backend CORS settings:
```python
CORS_ORIGINS: str = "*"  # Allow all for testing
```

### **Issue 3: Agent Can't Authenticate**

Verify:
- ✅ Station ID is correct
- ✅ Agent token is correct
- ✅ Station status is not OFFLINE
- ✅ Backend URL is correct (use Mac's IP)

### **Issue 4: Windows Won't Lock**

Agent must run as Administrator:
```cmd
# Right-click Command Prompt → "Run as Administrator"
```

### **Issue 5: Dashboard Shows 404**

Check:
- ✅ Dashboard is running: `npm run dev`
- ✅ Using correct IP: `http://192.168.1.100:3000`
- ✅ Mac and Windows on same network

---

## 🌐 Network Configuration

### **Recommended Setup:**

```
Router: 192.168.1.1
├─ Mac (Server): 192.168.1.100
├─ Windows PC 1: 192.168.1.101
├─ Windows PC 2: 192.168.1.102
└─ Staff Tablet: 192.168.1.103
```

### **Static IP (Recommended):**

Assign static IPs to prevent IP changes:

**Mac:**
System Preferences → Network → Advanced → TCP/IP
- Configure IPv4: Manually
- IP Address: 192.168.1.100

**Windows:**
Control Panel → Network → Change adapter settings
- Properties → IPv4 → Use the following IP
- IP Address: 192.168.1.101

---

## 📱 Access Points

Once setup is complete:

| Service | URL | Access From |
|---------|-----|-------------|
| Dashboard | `http://192.168.1.100:3000` | Any device on network |
| Backend API | `http://192.168.1.100:8000` | Agents & Dashboard |
| API Docs | `http://192.168.1.100:8000/docs` | Browser |
| WebSocket | `ws://192.168.1.100:8000/ws/agent` | PC Agents |

---

## 🚀 Production Deployment

For actual gaming center deployment:

### **Option 1: Dedicated Server (Recommended)**

```
┌─────────────────────────────────────────────┐
│  Server PC (Windows/Linux)                  │
│  - Backend (always running)                 │
│  - PostgreSQL database                      │
│  - Static IP: 192.168.1.10                  │
└─────────────────────────────────────────────┘
                    ↕ Local Network
┌─────────────────────────────────────────────┐
│  Gaming PCs (1-50)                          │
│  - PC Agents connect to server              │
│  - Auto-start agent on boot                 │
└─────────────────────────────────────────────┘
                    ↕ Local Network
┌─────────────────────────────────────────────┐
│  Staff Devices                              │
│  - Access dashboard via browser             │
│  - Tablets, phones, computers               │
└─────────────────────────────────────────────┘
```

### **Option 2: Cloud Hosted**

```
┌─────────────────────────────────────────────┐
│  Cloud Server (DigitalOcean/AWS)            │
│  - Backend API (public URL)                 │
│  - Dashboard (Vercel/Netlify)              │
│  - PostgreSQL (managed database)            │
└─────────────────────────────────────────────┘
                    ↕ Internet
┌─────────────────────────────────────────────┐
│  Gaming Center (Local Network)              │
│  - Gaming PCs with agents                   │
│  - Connect to cloud via internet            │
└─────────────────────────────────────────────┘
```

---

## 🔐 Security Considerations

### **For Testing:**
- ✅ Use local network only
- ✅ Firewall allows local connections
- ✅ CORS allows all origins

### **For Production:**
- ✅ Use HTTPS (SSL certificates)
- ✅ Restrict CORS to specific origins
- ✅ Use strong JWT secrets
- ✅ Enable firewall rules
- ✅ Use VPN for remote access
- ✅ Regular security updates

---

## ✅ Testing Checklist

- [ ] Mac backend running on `0.0.0.0:8000`
- [ ] Dashboard accessible from Windows
- [ ] Windows agent connects successfully
- [ ] Station shows ONLINE in dashboard
- [ ] Can start session from dashboard
- [ ] Windows receives session start notification
- [ ] Session timer counts down
- [ ] Windows locks when session expires
- [ ] Station returns to ONLINE status
- [ ] Can start new session after lock

---

## 📞 Quick Reference

**Start Backend (Mac):**
```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Start Dashboard (Mac):**
```bash
cd dashboard
npm run dev -- --host 0.0.0.0
```

**Start Agent (Windows):**
```cmd
cd pc-agent
venv-agent\Scripts\activate
python main.py
```

**Check Connections:**
```bash
# On Mac - see connected agents
curl http://localhost:8000/api/v1/stations

# On Windows - test backend connection
curl http://192.168.1.100:8000/health
```

---

## 🎯 Summary

1. ✅ **Dashboard**: Web-based (browser access from anywhere)
2. ✅ **Backend**: Runs on Mac (or dedicated server)
3. ✅ **PC Agent**: Runs on each Windows gaming PC
4. ✅ **Network**: All devices on same WiFi/LAN
5. ✅ **Auto-Lock**: Agent locks Windows when time expires

**No need to convert to desktop app** - web-based is perfect for your use case! 🎉
