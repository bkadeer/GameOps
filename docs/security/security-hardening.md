# Security & Hardening Guide

## Security Architecture

### Defense in Depth Layers

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Network Segmentation (VLANs, Firewall)            │
├─────────────────────────────────────────────────────────────┤
│ Layer 2: TLS/SSL Encryption (All communications)           │
├─────────────────────────────────────────────────────────────┤
│ Layer 3: Authentication & Authorization (JWT, RBAC)        │
├─────────────────────────────────────────────────────────────┤
│ Layer 4: Input Validation & Sanitization                   │
├─────────────────────────────────────────────────────────────┤
│ Layer 5: Secrets Management (Vault, encrypted env)         │
├─────────────────────────────────────────────────────────────┤
│ Layer 6: Audit Logging & Monitoring                        │
├─────────────────────────────────────────────────────────────┤
│ Layer 7: Regular Updates & Patching                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Network Security

### VLAN Isolation

**Configuration on Mikrotik**:
```routeros
# Create VLANs
/interface vlan
add interface=bridge name=vlan10-admin vlan-id=10
add interface=bridge name=vlan20-pc vlan-id=20
add interface=bridge name=vlan30-console vlan-id=30
add interface=bridge name=vlan40-guest vlan-id=40
add interface=bridge name=vlan50-iot vlan-id=50

# Assign IP addresses
/ip address
add address=192.168.10.1/24 interface=vlan10-admin
add address=192.168.20.1/24 interface=vlan20-pc
add address=192.168.30.1/24 interface=vlan30-console
add address=192.168.40.1/24 interface=vlan40-guest
add address=192.168.50.1/24 interface=vlan50-iot

# Firewall rules
/ip firewall filter

# Drop invalid connections
add chain=input connection-state=invalid action=drop

# Allow established/related
add chain=input connection-state=established,related action=accept
add chain=forward connection-state=established,related action=accept

# Admin VLAN can access everything
add chain=forward src-address=192.168.10.0/24 action=accept

# PC stations can only access server and internet
add chain=forward src-address=192.168.20.0/24 dst-address=192.168.10.10 action=accept
add chain=forward src-address=192.168.20.0/24 dst-address=!192.168.0.0/16 action=accept
add chain=forward src-address=192.168.20.0/24 action=drop

# Console stations - internet only
add chain=forward src-address=192.168.30.0/24 dst-address=!192.168.0.0/16 action=accept
add chain=forward src-address=192.168.30.0/24 action=drop

# IoT devices - server only, no internet
add chain=forward src-address=192.168.50.0/24 dst-address=192.168.10.10 action=accept
add chain=forward src-address=192.168.50.0/24 action=drop

# Guest WiFi - internet only, isolated
add chain=forward src-address=192.168.40.0/24 dst-address=!192.168.0.0/16 action=accept
add chain=forward src-address=192.168.40.0/24 action=drop

# Drop everything else
add chain=forward action=drop
```

### Port Security

```routeros
# Limit MAC addresses per port (prevent MAC flooding)
/interface ethernet switch port
set [find] learn-limit=2

# Enable DHCP snooping
/ip dhcp-snooping
set enabled=yes
```

---

## 2. TLS/SSL Configuration

### Nginx SSL Configuration

```nginx
# nginx/nginx.conf
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
ssl_prefer_server_ciphers on;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_stapling on;
ssl_stapling_verify on;

# HSTS (force HTTPS)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;

server {
    listen 443 ssl http2;
    server_name api.venue.local;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;

    location / {
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Certificate Management

```bash
# Auto-renewal with Let's Encrypt
cat > /etc/cron.daily/certbot-renew << 'EOF'
#!/bin/bash
certbot renew --quiet --post-hook "docker-compose -f /opt/evms/docker-compose.yml restart nginx"
EOF

chmod +x /etc/cron.daily/certbot-renew
```

---

## 3. Authentication & Authorization

### JWT Configuration

```python
# backend/core/security.py
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        return payload
    except JWTError:
        raise credentials_exception

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
```

### Role-Based Access Control (RBAC)

```python
# backend/core/permissions.py
from enum import Enum
from fastapi import Depends, HTTPException, status

class Role(str, Enum):
    ADMIN = "ADMIN"
    STAFF = "STAFF"
    CUSTOMER = "CUSTOMER"

class Permission(str, Enum):
    # Session permissions
    SESSION_CREATE = "session:create"
    SESSION_READ = "session:read"
    SESSION_UPDATE = "session:update"
    SESSION_DELETE = "session:delete"
    
    # Station permissions
    STATION_CREATE = "station:create"
    STATION_READ = "station:read"
    STATION_UPDATE = "station:update"
    STATION_DELETE = "station:delete"
    
    # User permissions
    USER_CREATE = "user:create"
    USER_READ = "user:read"
    USER_UPDATE = "user:update"
    USER_DELETE = "user:delete"
    
    # Payment permissions
    PAYMENT_PROCESS = "payment:process"
    PAYMENT_REFUND = "payment:refund"

ROLE_PERMISSIONS = {
    Role.ADMIN: [p for p in Permission],  # All permissions
    Role.STAFF: [
        Permission.SESSION_CREATE,
        Permission.SESSION_READ,
        Permission.SESSION_UPDATE,
        Permission.SESSION_DELETE,
        Permission.STATION_READ,
        Permission.USER_READ,
        Permission.PAYMENT_PROCESS,
    ],
    Role.CUSTOMER: [
        Permission.SESSION_READ,
        Permission.STATION_READ,
    ]
}

def require_permission(permission: Permission):
    def permission_checker(current_user: User = Depends(get_current_user)):
        user_permissions = ROLE_PERMISSIONS.get(current_user.role, [])
        if permission not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return permission_checker

# Usage in endpoints
@router.post("/stations")
async def create_station(
    station: StationCreate,
    current_user: User = Depends(require_permission(Permission.STATION_CREATE))
):
    # Create station logic
    pass
```

### Agent Authentication

```python
# backend/websocket/auth.py
from fastapi import WebSocket, status

async def authenticate_agent(websocket: WebSocket, token: str, station_id: str):
    try:
        payload = verify_token(token)
        
        # Verify token is for agent
        if payload.get("type") != "agent":
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return None
        
        # Verify station_id matches
        if payload.get("station_id") != station_id:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return None
        
        # Get station from database
        station = await get_station(station_id)
        if not station:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return None
        
        return station
        
    except JWTError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return None

# Generate agent token (one-time setup)
def generate_agent_token(station_id: str, expires_days: int = 365):
    expire = datetime.utcnow() + timedelta(days=expires_days)
    to_encode = {
        "sub": f"agent_{station_id}",
        "station_id": station_id,
        "type": "agent",
        "exp": expire
    }
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
```

---

## 4. Input Validation & Sanitization

### Pydantic Models with Validation

```python
# backend/schemas/session.py
from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional
import re

class SessionCreate(BaseModel):
    station_id: str = Field(..., regex=r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
    user_id: Optional[str] = Field(None, regex=r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
    duration_minutes: int = Field(..., ge=15, le=480)
    payment_method: str = Field(..., regex=r'^(CASH|CARD|BALANCE|ONLINE)$')
    amount: float = Field(..., ge=0, le=1000)
    notes: Optional[str] = Field(None, max_length=500)
    
    @validator('notes')
    def sanitize_notes(cls, v):
        if v:
            # Remove potential XSS
            v = re.sub(r'<[^>]*>', '', v)
            # Remove SQL injection attempts
            v = re.sub(r'(--|;|\'|\")', '', v)
        return v

class StationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, regex=r'^[A-Za-z0-9\-_]+$')
    station_type: str = Field(..., regex=r'^(PC|PS5|XBOX|SWITCH)$')
    location: Optional[str] = Field(None, max_length=100)
    ip_address: str = Field(..., regex=r'^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$')
    mac_address: str = Field(..., regex=r'^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$')
    
    @validator('ip_address')
    def validate_ip(cls, v):
        parts = v.split('.')
        if not all(0 <= int(part) <= 255 for part in parts):
            raise ValueError('Invalid IP address')
        return v
```

### SQL Injection Prevention

```python
# Always use parameterized queries with SQLAlchemy
from sqlalchemy import select

# GOOD - Parameterized query
async def get_user_by_username(username: str):
    query = select(User).where(User.username == username)
    result = await db.execute(query)
    return result.scalar_one_or_none()

# BAD - String concatenation (NEVER DO THIS)
# query = f"SELECT * FROM users WHERE username = '{username}'"
```

---

## 5. Secrets Management

### Using HashiCorp Vault

```bash
# Install Vault
docker run -d --name vault \
  -p 8200:8200 \
  --cap-add=IPC_LOCK \
  -e 'VAULT_DEV_ROOT_TOKEN_ID=myroot' \
  vault:latest

# Initialize and unseal
docker exec vault vault operator init
docker exec vault vault operator unseal <key1>
docker exec vault vault operator unseal <key2>
docker exec vault vault operator unseal <key3>

# Store secrets
docker exec vault vault kv put secret/evms \
  database_password="<strong-password>" \
  jwt_secret="<secret-key>" \
  mikrotik_password="<router-password>"
```

### Backend Integration

```python
# backend/core/vault.py
import hvac

class VaultClient:
    def __init__(self):
        self.client = hvac.Client(
            url='http://vault:8200',
            token=os.getenv('VAULT_TOKEN')
        )
    
    def get_secret(self, path: str) -> dict:
        try:
            response = self.client.secrets.kv.v2.read_secret_version(path=path)
            return response['data']['data']
        except Exception as e:
            logger.error(f"Failed to retrieve secret: {e}")
            raise

# Usage
vault = VaultClient()
secrets = vault.get_secret('evms')
DATABASE_PASSWORD = secrets['database_password']
```

### Environment Variable Encryption

```bash
# Encrypt .env file with ansible-vault
ansible-vault encrypt .env

# Decrypt when deploying
ansible-vault decrypt .env --output=/opt/evms/.env
```

---

## 6. Audit Logging

### Comprehensive Event Logging

```python
# backend/services/audit_service.py
from models.event import Event
from sqlalchemy.ext.asyncio import AsyncSession

class AuditService:
    @staticmethod
    async def log_event(
        db: AsyncSession,
        event_type: str,
        entity_type: str,
        entity_id: str,
        user_id: str,
        data: dict,
        ip_address: str
    ):
        event = Event(
            event_type=event_type,
            entity_type=entity_type,
            entity_id=entity_id,
            user_id=user_id,
            data=data,
            ip_address=ip_address
        )
        db.add(event)
        await db.commit()

# Usage in endpoints
@router.post("/sessions")
async def create_session(
    session: SessionCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_session = await session_service.create(db, session)
    
    # Log audit event
    await AuditService.log_event(
        db=db,
        event_type="session_created",
        entity_type="session",
        entity_id=str(new_session.id),
        user_id=str(current_user.id),
        data=session.dict(),
        ip_address=request.client.host
    )
    
    return new_session
```

### Log Retention Policy

```sql
-- Create partition for events table (TimescaleDB)
SELECT create_hypertable('events', 'timestamp');

-- Set retention policy (keep 2 years)
SELECT add_retention_policy('events', INTERVAL '2 years');

-- Compress old data
SELECT add_compression_policy('events', INTERVAL '90 days');
```

---

## 7. Rate Limiting

### API Rate Limiting

```python
# backend/middleware/rate_limit.py
from fastapi import Request, HTTPException
from redis import Redis
import time

redis_client = Redis(host='redis', port=6379, decode_responses=True)

async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host
    endpoint = request.url.path
    
    # Different limits for different endpoints
    limits = {
        "/api/v1/auth/login": (5, 60),  # 5 requests per minute
        "/api/v1/sessions": (30, 60),   # 30 requests per minute
        "default": (100, 60)             # 100 requests per minute
    }
    
    limit, window = limits.get(endpoint, limits["default"])
    
    key = f"rate_limit:{client_ip}:{endpoint}"
    current = redis_client.get(key)
    
    if current is None:
        redis_client.setex(key, window, 1)
    elif int(current) >= limit:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    else:
        redis_client.incr(key)
    
    response = await call_next(request)
    return response
```

---

## 8. Database Security

### PostgreSQL Hardening

```sql
-- Create read-only user for reporting
CREATE USER evms_readonly WITH PASSWORD '<password>';
GRANT CONNECT ON DATABASE evms TO evms_readonly;
GRANT USAGE ON SCHEMA public TO evms_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO evms_readonly;

-- Row-level security for multi-tenancy (if needed)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY session_isolation ON sessions
    FOR ALL
    TO evms_user
    USING (created_by = current_setting('app.current_user_id')::uuid);

-- Encrypt sensitive columns
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE users 
    ALTER COLUMN email TYPE bytea 
    USING pgp_sym_encrypt(email, '<encryption-key>');
```

### Connection Security

```python
# backend/core/database.py
from sqlalchemy.ext.asyncio import create_async_engine

# Use SSL for database connections
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_async_engine(
    DATABASE_URL,
    connect_args={
        "ssl": {
            "sslmode": "require",
            "sslrootcert": "/path/to/ca-cert.pem",
            "sslcert": "/path/to/client-cert.pem",
            "sslkey": "/path/to/client-key.pem"
        }
    }
)
```

---

## 9. Smart Plug Security

### Disable Cloud Access

```bash
# Shelly devices - disable cloud
curl -X POST http://192.168.50.10/settings \
  -d 'cloud_enabled=false'

# Tasmota - disable cloud
mosquitto_pub -h 192.168.50.11 -t 'cmnd/console_ps5_1/SetOption66' -m '1'
```

### Firmware Updates

```bash
# Check for updates
curl http://192.168.50.10/ota/check

# Apply updates from local server
curl -X POST http://192.168.50.10/ota \
  -d 'url=http://192.168.10.10/firmware/shelly-latest.zip'
```

---

## 10. Security Checklist

### Pre-Deployment

- [ ] Change all default passwords
- [ ] Generate strong SECRET_KEY (32+ characters)
- [ ] Configure TLS/SSL certificates
- [ ] Set up VLANs and firewall rules
- [ ] Disable unnecessary services
- [ ] Configure rate limiting
- [ ] Set up audit logging
- [ ] Test backup and restore procedures

### Post-Deployment

- [ ] Enable automatic security updates
- [ ] Configure monitoring and alerting
- [ ] Perform penetration testing
- [ ] Review audit logs weekly
- [ ] Rotate secrets quarterly
- [ ] Update SSL certificates before expiry
- [ ] Review user permissions monthly

### Ongoing Maintenance

- [ ] Apply security patches within 7 days
- [ ] Review firewall logs weekly
- [ ] Audit user access monthly
- [ ] Test disaster recovery quarterly
- [ ] Update dependencies monthly
- [ ] Security training for staff annually

---

## 11. Incident Response Plan

### Detection

1. **Monitoring alerts** trigger investigation
2. **Unusual patterns** in audit logs
3. **User reports** of suspicious activity

### Response

1. **Isolate** affected systems (VLAN isolation)
2. **Preserve** logs and evidence
3. **Identify** attack vector
4. **Contain** the breach
5. **Eradicate** the threat
6. **Recover** systems from clean backups
7. **Document** incident and lessons learned

### Post-Incident

1. Update security controls
2. Patch vulnerabilities
3. Notify affected parties (if required)
4. Review and improve incident response plan

---

## Next: WebSocket Protocol Specification
