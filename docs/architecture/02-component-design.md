# Component Design - Detailed Architecture

## Component Overview

```mermaid
graph TB
    subgraph "Admin Layer"
        UI[Admin Web UI<br/>Next.js]
        Kiosk[Customer Kiosk<br/>Electron/Web]
    end
    
    subgraph "Core Services"
        API[FastAPI Server]
        WS[WebSocket Server]
        Scheduler[Session Scheduler]
        Auth[Auth Service]
    end
    
    subgraph "Data Layer"
        PG[(PostgreSQL<br/>+TimescaleDB)]
        Redis[(Redis<br/>Cache/Pub-Sub)]
    end
    
    subgraph "Integration Layer"
        PlugCtrl[Smart Plug Controller]
        RouterCtrl[Router Controller]
        PaymentGW[Payment Gateway]
    end
    
    subgraph "Station Layer"
        PCAgent[PC Agent<br/>Windows Service]
        SmartPlug[Smart Plugs<br/>Shelly/Tasmota]
        Switch[Managed Switch<br/>Mikrotik/Ubiquiti]
    end
    
    subgraph "Observability"
        Prom[Prometheus]
        Grafana[Grafana]
        Loki[Loki Logs]
    end
    
    UI -->|HTTPS/WSS| API
    Kiosk -->|HTTPS/WSS| API
    API --> Auth
    API --> WS
    API --> Scheduler
    API --> PG
    API --> Redis
    WS --> Redis
    Scheduler --> PG
    Scheduler --> Redis
    
    API --> PlugCtrl
    API --> RouterCtrl
    API --> PaymentGW
    
    PlugCtrl --> SmartPlug
    RouterCtrl --> Switch
    
    PCAgent -->|WSS| WS
    PCAgent --> Redis
    
    API --> Prom
    Scheduler --> Prom
    PCAgent --> Prom
    Grafana --> Prom
    Grafana --> Loki
```

## 1. Admin Server (Core Backend)

### Technology
- **FastAPI** (Python 3.11+)
- **Uvicorn** (ASGI server)
- **SQLAlchemy** (ORM)
- **Alembic** (migrations)

### Responsibilities
1. **REST API**: CRUD operations for stations, sessions, users, payments
2. **WebSocket Server**: Real-time bidirectional communication with agents
3. **Session Scheduler**: Monitor and expire sessions automatically
4. **Authentication**: JWT-based auth with refresh tokens
5. **Integration Hub**: Coordinate smart plugs, routers, payment gateways

### Key Modules

```
backend/
├── api/
│   ├── v1/
│   │   ├── stations.py      # Station management
│   │   ├── sessions.py      # Session CRUD
│   │   ├── users.py         # User/member management
│   │   ├── payments.py      # Payment processing
│   │   ├── admin.py         # Admin operations
│   │   └── auth.py          # Authentication
│   └── deps.py              # Dependencies (DB, auth)
├── websocket/
│   ├── manager.py           # Connection manager
│   ├── handlers.py          # Message handlers
│   └── protocol.py          # Message protocol
├── services/
│   ├── session_service.py   # Business logic
│   ├── station_service.py
│   ├── payment_service.py
│   └── notification_service.py
├── integrations/
│   ├── smart_plug.py        # Shelly/Tasmota
│   ├── router.py            # Mikrotik/Ubiquiti
│   ├── pdu.py               # IP PDU control
│   └── payment_gateway.py   # Stripe/Square
├── scheduler/
│   ├── session_monitor.py   # Check expirations
│   └── tasks.py             # Background tasks
├── models/
│   ├── station.py
│   ├── session.py
│   ├── user.py
│   └── payment.py
├── schemas/
│   ├── station.py           # Pydantic schemas
│   ├── session.py
│   └── user.py
├── core/
│   ├── config.py            # Settings
│   ├── security.py          # Auth utilities
│   └── database.py          # DB connection
└── main.py                  # App entry point
```

### Configuration
```python
# Environment variables
DATABASE_URL=postgresql://user:pass@localhost/evms
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=<random-secret>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS=["https://admin.venue.local"]
```

### API Endpoints (Summary)
- `POST /api/v1/auth/login` - Authenticate admin/staff
- `POST /api/v1/sessions/start` - Start a session
- `PUT /api/v1/sessions/{id}/extend` - Add time
- `DELETE /api/v1/sessions/{id}` - Stop session
- `GET /api/v1/stations` - List all stations
- `GET /api/v1/dashboard` - Live dashboard data
- `WS /ws/agent/{station_id}` - Agent WebSocket

---

## 2. PostgreSQL Database

### Schema Design

#### Stations Table
```sql
CREATE TABLE stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    station_type VARCHAR(20) NOT NULL, -- 'PC', 'PS5', 'XBOX', 'SWITCH'
    location VARCHAR(100),
    ip_address INET,
    mac_address MACADDR,
    control_method VARCHAR(20), -- 'AGENT', 'SMART_PLUG', 'ROUTER'
    control_address VARCHAR(255), -- Smart plug IP or router port
    status VARCHAR(20) DEFAULT 'OFFLINE', -- 'ONLINE', 'OFFLINE', 'IN_SESSION', 'MAINTENANCE'
    specs JSONB, -- Hardware specs for PCs
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stations_status ON stations(status);
CREATE INDEX idx_stations_type ON stations(station_type);
```

#### Sessions Table
```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID NOT NULL REFERENCES stations(id),
    user_id UUID REFERENCES users(id),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    scheduled_end_at TIMESTAMPTZ NOT NULL,
    actual_end_at TIMESTAMPTZ,
    duration_minutes INTEGER NOT NULL,
    extended_minutes INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- 'ACTIVE', 'EXPIRED', 'STOPPED', 'PAUSED'
    payment_id UUID REFERENCES payments(id),
    notes TEXT,
    created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_sessions_station ON sessions(station_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_end_time ON sessions(scheduled_end_at);
```

#### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    full_name VARCHAR(200),
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL, -- 'ADMIN', 'STAFF', 'CUSTOMER'
    membership_tier VARCHAR(20), -- 'BASIC', 'PREMIUM', 'VIP'
    balance DECIMAL(10,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
```

#### Payments Table
```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20), -- 'CASH', 'CARD', 'BALANCE', 'ONLINE'
    transaction_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
```

#### Events Table (Audit Log)
```sql
CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    user_id UUID REFERENCES users(id),
    data JSONB,
    ip_address INET,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Convert to TimescaleDB hypertable for efficient time-series queries
SELECT create_hypertable('events', 'timestamp');
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_entity ON events(entity_type, entity_id);
```

---

## 3. Redis Cache & Pub/Sub

### Use Cases

#### Session State Cache
```
Key: session:{session_id}
Value: {
    "station_id": "uuid",
    "remaining_seconds": 3600,
    "last_heartbeat": "2025-10-16T10:30:00Z"
}
TTL: session duration + 60s
```

#### WebSocket Connection Registry
```
Key: ws:connections:{station_id}
Value: {
    "connection_id": "uuid",
    "connected_at": "timestamp",
    "agent_version": "1.0.0"
}
```

#### Pub/Sub Channels
- `session:started` - Notify agents of new sessions
- `session:extended` - Time added to session
- `session:stopped` - Manual stop
- `session:expiring` - 5-minute warning
- `station:status` - Station online/offline events

---

## 4. PC Agent (Windows Service)

### Technology
- **Python 3.11+**
- **websockets** library
- **pywin32** for Windows API
- **psutil** for monitoring

### Responsibilities
1. Maintain persistent WebSocket connection to server
2. Display kiosk UI overlay with remaining time
3. Enforce session locks (disable input, lock screen)
4. Logoff or restart on expiration
5. Report heartbeat and telemetry

### Agent Architecture

```
agent/
├── main.py                  # Entry point
├── service.py               # Windows service wrapper
├── websocket_client.py      # WebSocket connection
├── session_manager.py       # Local session state
├── enforcement.py           # Lock/logoff logic
├── ui/
│   ├── overlay.py           # Tkinter overlay UI
│   └── assets/              # Images, fonts
├── monitoring.py            # System metrics
└── config.py                # Local config
```

### Key Features

#### WebSocket Protocol
```json
// Server -> Agent: Start Session
{
    "type": "session_start",
    "session_id": "uuid",
    "duration_seconds": 3600,
    "timestamp": "2025-10-16T10:30:00Z"
}

// Agent -> Server: Heartbeat
{
    "type": "heartbeat",
    "session_id": "uuid",
    "remaining_seconds": 3540,
    "cpu_usage": 45.2,
    "ram_usage": 62.1
}

// Server -> Agent: Extend Session
{
    "type": "session_extend",
    "session_id": "uuid",
    "additional_seconds": 1800
}

// Server -> Agent: Stop Session
{
    "type": "session_stop",
    "session_id": "uuid",
    "action": "logoff"  // or "lock", "restart"
}
```

#### Enforcement Actions
1. **5-minute warning**: Show prominent overlay
2. **1-minute warning**: Disable game input, show countdown
3. **Expiration**: Lock screen + logoff user
4. **Graceful**: Save game state if possible (game-specific)

---

## 5. Console Controller

### Smart Plug Integration (Shelly/Tasmota)

#### Shelly API
```python
# Turn on console
POST http://192.168.30.101/relay/0?turn=on

# Turn off console
POST http://192.168.30.101/relay/0?turn=off

# Get status
GET http://192.168.30.101/status
```

#### Tasmota MQTT
```
Topic: cmnd/console_ps5_1/POWER
Payload: ON / OFF

Status: stat/console_ps5_1/POWER
```

### Router Control (Mikrotik)

```python
from librouteros import connect

api = connect(
    host='192.168.1.1',
    username='admin',
    password='password'
)

# Block console by MAC address
api('/ip/firewall/filter/add', 
    chain='forward',
    src_mac_address='AA:BB:CC:DD:EE:FF',
    action='drop'
)

# Disable switch port
api('/interface/ethernet/set',
    numbers='ether10',
    disabled='yes'
)
```

---

## 6. Admin Web UI (Next.js)

### Technology
- **Next.js 14+** (App Router)
- **TypeScript**
- **shadcn/ui + Tailwind CSS**
- **TanStack Query** (React Query)
- **Zustand** for state

### Key Pages

```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── page.tsx           # Live station map
│   │   ├── sessions/          # Session history
│   │   ├── stations/          # Station management
│   │   ├── customers/         # Customer/member mgmt
│   │   ├── payments/          # Payment history
│   │   ├── reports/           # Analytics
│   │   └── settings/          # System config
│   └── layout.tsx
├── components/
│   ├── ui/                    # shadcn components
│   ├── station-card.tsx       # Live station display
│   ├── session-timer.tsx      # Countdown timer
│   └── quick-actions.tsx      # Start/stop buttons
├── lib/
│   ├── api.ts                 # API client
│   ├── websocket.ts           # WebSocket hook
│   └── utils.ts
└── hooks/
    ├── use-stations.ts
    ├── use-sessions.ts
    └── use-realtime.ts
```

### Real-time Dashboard

```typescript
// Live station grid with WebSocket updates
const Dashboard = () => {
  const { data: stations } = useStations();
  const { subscribe } = useWebSocket();
  
  useEffect(() => {
    const unsubscribe = subscribe('station:status', (event) => {
      // Update station status in real-time
    });
    return unsubscribe;
  }, []);
  
  return (
    <div className="grid grid-cols-4 gap-4">
      {stations.map(station => (
        <StationCard key={station.id} station={station} />
      ))}
    </div>
  );
};
```

---

## 7. Monitoring & Observability

### Prometheus Metrics

```python
# FastAPI metrics
from prometheus_client import Counter, Histogram, Gauge

session_starts = Counter('evms_session_starts_total', 'Total sessions started')
session_duration = Histogram('evms_session_duration_seconds', 'Session durations')
active_sessions = Gauge('evms_active_sessions', 'Currently active sessions')
websocket_connections = Gauge('evms_websocket_connections', 'Active WebSocket connections')
```

### Grafana Dashboards
1. **Operations Dashboard**: Active sessions, station status, revenue
2. **Technical Dashboard**: API latency, WebSocket connections, errors
3. **Business Dashboard**: Daily revenue, popular stations, peak hours

### Alerting Rules
- Session expiration failures
- Agent disconnections >5 minutes
- Payment processing errors
- Database connection issues
- High API error rates

---

## Next: API Specification & Sequence Diagrams
