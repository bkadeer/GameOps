# Deployment Guide - Esports Venue Management System

## Deployment Architecture

### Option 1: Single Server (Recommended for <200 stations)

```
┌─────────────────────────────────────────────────────────────┐
│                    Physical/VM Server                        │
│  CPU: 8 cores | RAM: 16GB | Storage: 500GB SSD             │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Docker Compose Stack                       │ │
│  │                                                         │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │ │
│  │  │  Nginx   │  │ FastAPI  │  │PostgreSQL│            │ │
│  │  │  Proxy   │  │  (x2)    │  │          │            │ │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘            │ │
│  │       │             │             │                    │ │
│  │  ┌────▼─────┐  ┌────▼─────┐  ┌────▼─────┐            │ │
│  │  │  Redis   │  │Prometheus│  │  Loki    │            │ │
│  │  └──────────┘  └──────────┘  └──────────┘            │ │
│  │                                                         │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Option 2: Kubernetes Cluster (For 200+ stations)

```
┌─────────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                        │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Master     │  │   Worker 1   │  │   Worker 2   │     │
│  │              │  │              │  │              │     │
│  │  API Server  │  │  FastAPI     │  │  FastAPI     │     │
│  │  etcd        │  │  Pods (x3)   │  │  Pods (x3)   │     │
│  │  Scheduler   │  │              │  │              │     │
│  └──────────────┘  │  Redis       │  │  Monitoring  │     │
│                    │  PostgreSQL  │  │  Stack       │     │
│                    └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## Network Architecture

### VLAN Configuration

```
┌─────────────────────────────────────────────────────────────┐
│                    Core Switch (Managed)                     │
│                  Mikrotik CRS328 or Ubiquiti                │
└───┬─────────┬─────────┬─────────┬─────────┬────────────────┘
    │         │         │         │         │
    │ VLAN 10 │ VLAN 20 │ VLAN 30 │ VLAN 40 │ VLAN 50
    │ Admin   │ PC      │ Console │ Guest   │ Management
    │         │ Stations│ Stations│ WiFi    │ (Smart Plugs)
    │         │         │         │         │
┌───▼───┐ ┌───▼───┐ ┌───▼───┐ ┌───▼───┐ ┌───▼───┐
│Server │ │PC-01  │ │PS5-01 │ │ AP    │ │Shelly │
│       │ │...    │ │Xbox-01│ │       │ │Plugs  │
│       │ │PC-50  │ │...    │ │       │ │       │
└───────┘ └───────┘ └───────┘ └───────┘ └───────┘
```

### IP Addressing Scheme

| VLAN | Network | Purpose | DHCP Range | Static Range |
|------|---------|---------|------------|--------------|
| 10 | 192.168.10.0/24 | Admin/Server | - | 192.168.10.10-50 |
| 20 | 192.168.20.0/24 | PC Stations | 192.168.20.100-250 | 192.168.20.10-99 |
| 30 | 192.168.30.0/24 | Consoles | 192.168.30.100-200 | 192.168.30.10-99 |
| 40 | 192.168.40.0/24 | Guest WiFi | 192.168.40.100-250 | - |
| 50 | 192.168.50.0/24 | IoT/Smart Devices | - | 192.168.50.10-100 |

### Firewall Rules

```
# Allow Admin VLAN to all
VLAN 10 → VLAN 20, 30, 50: ALLOW
VLAN 10 → Internet: ALLOW

# PC Stations
VLAN 20 → Server (10.10): ALLOW (ports 443, 8000)
VLAN 20 → Internet: ALLOW
VLAN 20 → VLAN 30, 40, 50: DENY

# Console Stations
VLAN 30 → Internet: ALLOW
VLAN 30 → VLAN 10, 20, 40, 50: DENY

# Guest WiFi (isolated)
VLAN 40 → Internet: ALLOW
VLAN 40 → All other VLANs: DENY

# Smart Devices
VLAN 50 → Server (10.10): ALLOW
VLAN 50 → Internet: DENY
VLAN 50 → All other VLANs: DENY
```

---

## Docker Compose Deployment

### Directory Structure

```
/opt/evms/
├── docker-compose.yml
├── .env
├── nginx/
│   ├── nginx.conf
│   └── ssl/
│       ├── cert.pem
│       └── key.pem
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
├── frontend/
│   ├── Dockerfile
│   └── dist/
├── postgres/
│   ├── init.sql
│   └── data/
├── redis/
│   └── redis.conf
└── monitoring/
    ├── prometheus.yml
    └── grafana/
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: evms-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./frontend/dist:/usr/share/nginx/html:ro
    depends_on:
      - backend
    networks:
      - evms-network
    restart: unless-stopped

  backend:
    build: ./backend
    container_name: evms-backend
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - SECRET_KEY=${SECRET_KEY}
      - JWT_ALGORITHM=HS256
      - CORS_ORIGINS=${CORS_ORIGINS}
    volumes:
      - ./backend/app:/app
    depends_on:
      - postgres
      - redis
    networks:
      - evms-network
    restart: unless-stopped
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '2'
          memory: 2G

  postgres:
    image: timescale/timescaledb:latest-pg15
    container_name: evms-postgres
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - ./postgres/data:/var/lib/postgresql/data
      - ./postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - evms-network
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 4G

  redis:
    image: redis:7-alpine
    container_name: evms-redis
    command: redis-server /usr/local/etc/redis/redis.conf
    volumes:
      - ./redis/redis.conf:/usr/local/etc/redis/redis.conf
      - redis-data:/data
    networks:
      - evms-network
    restart: unless-stopped

  prometheus:
    image: prom/prometheus:latest
    container_name: evms-prometheus
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    ports:
      - "9090:9090"
    networks:
      - evms-network
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: evms-grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
      - GF_INSTALL_PLUGINS=redis-datasource
    volumes:
      - grafana-data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
    ports:
      - "3000:3000"
    depends_on:
      - prometheus
    networks:
      - evms-network
    restart: unless-stopped

  loki:
    image: grafana/loki:latest
    container_name: evms-loki
    ports:
      - "3100:3100"
    volumes:
      - loki-data:/loki
    networks:
      - evms-network
    restart: unless-stopped

networks:
  evms-network:
    driver: bridge

volumes:
  redis-data:
  prometheus-data:
  grafana-data:
  loki-data:
```

### Environment Variables (.env)

```bash
# Database
POSTGRES_DB=evms
POSTGRES_USER=evms_user
POSTGRES_PASSWORD=<strong-password>
DATABASE_URL=postgresql://evms_user:<strong-password>@postgres:5432/evms

# Redis
REDIS_URL=redis://redis:6379/0

# Backend
SECRET_KEY=<generate-with-openssl-rand-hex-32>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS=https://admin.venue.local,https://venue.local

# Monitoring
GRAFANA_PASSWORD=<admin-password>

# Smart Plug Integration
SHELLY_DEVICES=192.168.50.10,192.168.50.11,192.168.50.12

# Router API
MIKROTIK_HOST=192.168.10.1
MIKROTIK_USER=api_user
MIKROTIK_PASSWORD=<router-password>
```

---

## Installation Steps

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create application directory
sudo mkdir -p /opt/evms
sudo chown $USER:$USER /opt/evms
cd /opt/evms
```

### 2. Clone Repository & Configure

```bash
# Clone repository
git clone https://github.com/your-org/evms.git .

# Copy environment template
cp .env.example .env

# Generate secret key
openssl rand -hex 32

# Edit .env file
nano .env
```

### 3. SSL Certificate Setup

```bash
# Option 1: Self-signed (development)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/CN=venue.local"

# Option 2: Let's Encrypt (production)
sudo apt install certbot
sudo certbot certonly --standalone -d venue.yourdomain.com
sudo cp /etc/letsencrypt/live/venue.yourdomain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/venue.yourdomain.com/privkey.pem nginx/ssl/key.pem
```

### 4. Database Initialization

```bash
# Start PostgreSQL only
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
sleep 10

# Run migrations
docker-compose exec backend alembic upgrade head

# Create admin user
docker-compose exec backend python scripts/create_admin.py
```

### 5. Deploy Full Stack

```bash
# Build and start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
```

### 6. Verify Deployment

```bash
# Test API health
curl https://api.venue.local/health

# Test WebSocket
wscat -c wss://api.venue.local/ws/test

# Access admin UI
open https://admin.venue.local
```

---

## PC Agent Deployment

### Build Agent Executable

```bash
cd agent/
pip install -r requirements.txt
pip install pyinstaller

# Build Windows executable
pyinstaller --onefile --windowed \
  --name EVMSAgent \
  --icon=assets/icon.ico \
  --add-data "assets;assets" \
  main.py

# Output: dist/EVMSAgent.exe
```

### Agent Configuration

Create `agent_config.json`:

```json
{
  "server_url": "wss://api.venue.local/ws/agent",
  "station_id": "uuid-from-server",
  "auth_token": "jwt-token",
  "heartbeat_interval": 30,
  "reconnect_delay": 5,
  "max_reconnect_attempts": 10,
  "enforcement": {
    "warning_minutes": 5,
    "final_warning_minutes": 1,
    "action_on_expire": "logoff"
  }
}
```

### Deployment with Ansible

```yaml
# ansible/deploy_agents.yml
---
- name: Deploy EVMS Agent to PC Stations
  hosts: pc_stations
  tasks:
    - name: Copy agent executable
      win_copy:
        src: ../agent/dist/EVMSAgent.exe
        dest: C:\Program Files\EVMS\EVMSAgent.exe

    - name: Copy configuration
      win_copy:
        src: agent_config.json
        dest: C:\Program Files\EVMS\config.json

    - name: Install as Windows service
      win_service:
        name: EVMSAgent
        path: C:\Program Files\EVMS\EVMSAgent.exe
        start_mode: auto
        state: started

    - name: Configure firewall
      win_firewall_rule:
        name: EVMS Agent
        localport: 443
        action: allow
        direction: out
        protocol: tcp
        state: present
```

Run deployment:

```bash
ansible-playbook -i inventory.ini deploy_agents.yml
```

---

## Backup & Recovery

### Automated Backups

```bash
# Create backup script
cat > /opt/evms/scripts/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/evms/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup PostgreSQL
docker-compose exec -T postgres pg_dump -U evms_user evms | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Backup Redis
docker-compose exec -T redis redis-cli SAVE
docker cp evms-redis:/data/dump.rdb "$BACKUP_DIR/redis_$DATE.rdb"

# Backup configuration
tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" .env nginx/ monitoring/

# Cleanup old backups (keep 30 days)
find "$BACKUP_DIR" -type f -mtime +30 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /opt/evms/scripts/backup.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/evms/scripts/backup.sh") | crontab -
```

### Restore from Backup

```bash
# Stop services
docker-compose down

# Restore database
gunzip < backups/db_20251016_020000.sql.gz | docker-compose exec -T postgres psql -U evms_user evms

# Restore Redis
docker cp backups/redis_20251016_020000.rdb evms-redis:/data/dump.rdb

# Restore configuration
tar -xzf backups/config_20251016_020000.tar.gz

# Start services
docker-compose up -d
```

---

## Monitoring Setup

### Prometheus Targets

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'evms-backend'
    static_configs:
      - targets: ['backend:8000']

  - job_name: 'evms-postgres'
    static_configs:
      - targets: ['postgres:9187']

  - job_name: 'evms-redis'
    static_configs:
      - targets: ['redis:9121']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
```

### Grafana Dashboards

Import pre-built dashboards:
- **EVMS Operations**: Dashboard ID 15000 (custom)
- **PostgreSQL**: Dashboard ID 9628
- **Redis**: Dashboard ID 11835
- **Node Exporter**: Dashboard ID 1860

---

## Scaling Considerations

### Horizontal Scaling (200-1000 stations)

1. **Load Balancer**: Add HAProxy or Nginx upstream
2. **Backend Replicas**: Scale FastAPI to 4-6 instances
3. **Redis Cluster**: Switch to Redis Cluster mode
4. **PostgreSQL**: Add read replicas
5. **WebSocket**: Use Redis pub/sub for cross-instance messaging

### Vertical Scaling

| Stations | CPU | RAM | Storage |
|----------|-----|-----|---------|
| 1-50 | 4 cores | 8GB | 250GB |
| 50-100 | 8 cores | 16GB | 500GB |
| 100-200 | 16 cores | 32GB | 1TB |
| 200+ | Kubernetes cluster recommended |

---

## Troubleshooting

### Common Issues

**Agent won't connect**
```bash
# Check WebSocket endpoint
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" https://api.venue.local/ws/test

# Check firewall
sudo ufw status
```

**Database connection errors**
```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U evms_user -d evms -c "SELECT 1;"
```

**High latency**
```bash
# Check Redis performance
docker-compose exec redis redis-cli --latency

# Check network
ping -c 10 192.168.20.100
```

---

## Next: Security & Hardening Guide
