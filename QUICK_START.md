# GameOps Quick Start Guide

Get your esports venue management system running in 15 minutes!

---

## Prerequisites

- **Backend**: Python 3.11+, PostgreSQL, Redis
- **Dashboard**: Node.js 18+, npm
- **PC Agent**: Windows 10/11, Python 3.11+

---

## Step 1: Backend Setup (5 minutes)

### 1.1 Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 1.2 Start Services

**PostgreSQL** (Docker):
```bash
docker run -d \
  --name gameops-db \
  -e POSTGRES_USER=evms_user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=evms \
  -p 5432:5432 \
  postgres:15-alpine
```

**Redis** (Docker):
```bash
docker run -d \
  --name gameops-redis \
  -p 6379:6379 \
  redis:alpine
```

### 1.3 Configure Environment

```bash
cp .env.example .env
# Edit .env with your settings
```

**Minimal .env**:
```bash
DATABASE_URL=postgresql+asyncpg://evms_user:password@localhost:5432/evms
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=change-this-to-random-secret
CORS_ORIGINS=http://localhost:3000
```

### 1.4 Initialize Database

```bash
# Run migrations
alembic upgrade head

# Create admin user (optional)
python scripts/init_db.py
```

### 1.5 Start Backend

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

✅ Backend running at `http://localhost:8000`  
📚 API docs at `http://localhost:8000/api/docs`

---

## Step 2: Dashboard Setup (3 minutes)

### 2.1 Install Dependencies

```bash
cd dashboard
npm install
```

### 2.2 Configure Environment

```bash
cp .env.example .env.local
```

**`.env.local`**:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/dashboard
```

### 2.3 Start Dashboard

```bash
npm run dev
```

✅ Dashboard running at `http://localhost:3000`

### 2.4 Login

**Default Credentials**:
- Username: `admin`
- Password: `admin123`

---

## Step 3: PC Agent Setup (7 minutes)

### 3.1 Install on Windows PC

```bash
cd pc-agent
pip install -r requirements.txt
```

### 3.2 Get Station ID

1. Open dashboard at `http://localhost:3000`
2. Click "Add Station"
3. Fill in details:
   - Name: `PC-01`
   - Type: `PC`
   - Specs: CPU, RAM, GPU
4. Click "Create"
5. **Copy the Station ID** (UUID)

### 3.3 Get Agent Token

**Option A: Generate via API**:
```bash
curl -X POST http://localhost:8000/api/v1/auth/agent-token \
  -H "Content-Type: application/json" \
  -d '{"station_id": "your-station-id-here"}'
```

**Option B: Use admin token temporarily**:
```bash
# Login to get token
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

### 3.4 Configure Agent

Edit `config.yaml`:
```yaml
station:
  id: "your-station-id-from-step-3.2"
  name: "PC-01"

backend:
  url: "ws://your-server-ip:8000/ws/agent"
  token: "your-agent-token-from-step-3.3"

features:
  auto_lock: true
  auto_logout: true
  show_overlay: true

session:
  warning_time: 300      # 5 minutes
  grace_period: 60       # 60 seconds

system:
  monitor_interval: 60
```

### 3.5 Start Agent

```bash
python main.py
```

✅ Agent connected! Check dashboard for green status.

---

## Step 4: Test the System (2 minutes)

### 4.1 Create a Test Session

1. Go to dashboard: `http://localhost:3000`
2. Find your station (PC-01)
3. Click "Start Session"
4. Fill in:
   - Customer name: `Test User`
   - Duration: `30 minutes`
   - Payment: `Cash - $5`
5. Click "Start Session"

### 4.2 Verify on PC

On the Windows PC, you should see:
- ✅ Kiosk overlay appears (top-right corner)
- ✅ Countdown timer showing 30:00
- ✅ Green status indicator
- ✅ Windows notification: "Session Started"

### 4.3 Test Session Extension

1. In dashboard, click "Extend" on the active session
2. Add 15 minutes
3. Verify overlay updates to 45:00

### 4.4 Test Session End

1. Click "End Session" in dashboard
2. Verify:
   - ✅ Overlay shows "No Active Session"
   - ✅ PC locks automatically (if enabled)
   - ✅ Session marked as "Stopped" in dashboard

---

## 🎉 Success!

Your GameOps system is now running! Here's what you have:

### Backend
- ✅ REST API for session management
- ✅ WebSocket server for real-time updates
- ✅ Redis caching for performance
- ✅ Event logging for audit trail
- ✅ PostgreSQL database

### Dashboard
- ✅ Real-time station monitoring
- ✅ Session management (start/extend/end)
- ✅ Payment tracking
- ✅ Live WebSocket updates

### PC Agent
- ✅ WebSocket connection to backend
- ✅ Session enforcement (lock/logout)
- ✅ Kiosk overlay with countdown
- ✅ Auto-reconnect on disconnect
- ✅ System monitoring

---

## Common Issues

### Backend won't start

**Error**: `Connection refused to PostgreSQL`
```bash
# Check if PostgreSQL is running
docker ps | grep gameops-db

# Check connection
psql -h localhost -U evms_user -d evms
```

**Error**: `Redis connection failed`
```bash
# Check if Redis is running
docker ps | grep gameops-redis

# Test connection
redis-cli ping
```

### Dashboard won't connect

**Error**: `API request failed`
- Verify backend is running: `curl http://localhost:8000/health`
- Check CORS settings in backend `.env`
- Verify `NEXT_PUBLIC_API_URL` in dashboard `.env.local`

### Agent won't connect

**Error**: `WebSocket connection failed`
1. Check backend URL in `config.yaml`
2. Verify station ID is correct
3. Check agent token is valid
4. Review `agent.log` for details

**Error**: `Lock/logout not working`
- Run agent as Administrator
- Check Windows security policies
- Verify `auto_lock` and `auto_logout` in config

---

## Next Steps

### Production Deployment

1. **Secure the Backend**:
   - Change `SECRET_KEY` to random string
   - Use strong database password
   - Enable HTTPS/WSS
   - Set up firewall rules

2. **Configure Agents**:
   - Install on all gaming PCs
   - Use unique station IDs
   - Set up Windows service
   - Configure auto-start

3. **Set Up Monitoring**:
   - Enable Prometheus metrics
   - Configure Grafana dashboards
   - Set up alerting

4. **Backup Strategy**:
   - Database backups (daily)
   - Configuration backups
   - Event log archival

### Advanced Features

- **Payment Integration**: Add Stripe/PayPal
- **Console Support**: Integrate smart plugs
- **Analytics**: Build custom reports
- **Mobile App**: Customer self-service
- **Multi-venue**: Centralized management

---

## Support Resources

- 📖 **Full Documentation**: `IMPLEMENTATION_COMPLETE.md`
- 🏗️ **Architecture**: `docs/architecture/`
- 🔌 **API Docs**: `http://localhost:8000/api/docs`
- 🐛 **Troubleshooting**: Check logs in `backend/logs/` and `pc-agent/agent.log`

---

## Development Mode

### Hot Reload

**Backend**:
```bash
uvicorn app.main:app --reload
```

**Dashboard**:
```bash
npm run dev
```

**Agent**:
```bash
# Edit code and restart manually
python main.py
```

### Debugging

**Backend**:
```python
# Add breakpoints
import pdb; pdb.set_trace()

# Or use VS Code debugger
```

**Dashboard**:
```bash
# Open browser DevTools
# Check Console and Network tabs
```

**Agent**:
```bash
# Check agent.log
tail -f agent.log

# Increase logging
# Edit main.py: logging.basicConfig(level=logging.DEBUG)
```

---

## Production Checklist

Before going live:

- [ ] Change all default passwords
- [ ] Generate strong `SECRET_KEY`
- [ ] Enable HTTPS/WSS
- [ ] Configure firewall
- [ ] Set up database backups
- [ ] Configure monitoring
- [ ] Test failover scenarios
- [ ] Document station IDs
- [ ] Train staff on dashboard
- [ ] Create runbooks for common issues

---

**Happy Gaming! 🎮**
