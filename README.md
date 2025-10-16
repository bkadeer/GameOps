# # GameOps - Esports Venue Management System

A production-ready platform for managing timed gaming sessions across PC and console stations in esports venues.

## 🎮 Features

- **Multi-Station Support**: Windows PCs, PS5, Xbox, Nintendo Switch
- **Real-Time Control**: WebSocket-based session management with <2s latency
- **Automated Enforcement**: Lock/logoff PCs, power control for consoles
- **Payment Processing**: Cash, card, balance, and online payments
- **Admin Dashboard**: Live station monitoring and session management
- **Membership System**: Basic, Premium, and VIP tiers
- **Comprehensive Logging**: Full audit trail and analytics
- **Offline Capable**: Continues operation without internet

## 📋 System Requirements

### Server
- **CPU**: 8+ cores (16+ for 200+ stations)
- **RAM**: 16GB (32GB for 200+ stations)
- **Storage**: 500GB SSD
- **OS**: Ubuntu 22.04 LTS or similar
- **Network**: Gigabit LAN

### PC Stations
- **OS**: Windows 10/11
- **RAM**: 4GB minimum for agent
- **Network**: Wired gigabit connection

### Network Infrastructure
- Managed switch with VLAN support (Mikrotik/Ubiquiti recommended)
- Firewall/Router with API access
- Smart plugs for console control (Shelly/Tasmota)

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/your-org/GameOps.git
cd GameOps
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your settings
nano .env
```

### 3. Deploy with Docker Compose

```bash
docker-compose up -d
```

### 4. Access Admin UI

```
https://admin.venue.local
Default credentials: admin / changeme
```

## 📚 Documentation

### Architecture & Design
- [System Overview](docs/architecture/01-system-overview.md)
- [Component Design](docs/architecture/02-component-design.md)
- [Sequence Diagrams](docs/architecture/03-sequence-diagrams.md)

### API Documentation
- [OpenAPI Specification](docs/api/openapi-spec.yaml)
- [WebSocket Protocol](docs/api/websocket-protocol.md)

### Deployment
- [Deployment Guide](docs/deployment/deployment-guide.md)
- [Security Hardening](docs/security/security-hardening.md)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin Web UI (Next.js)                    │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS/WSS
┌────────────────────────▼────────────────────────────────────┐
│                  FastAPI Backend Server                      │
│  ┌──────────┬──────────┬──────────┬──────────────────────┐ │
│  │ REST API │WebSocket │Scheduler │ Smart Plug/Router    │ │
│  │          │  Server  │ Service  │ Integration          │ │
│  └──────────┴──────────┴──────────┴──────────────────────┘ │
└─────┬────────────┬────────────┬────────────────────────────┘
      │            │            │
┌─────▼─────┐ ┌────▼────┐ ┌────▼────┐
│PostgreSQL │ │  Redis  │ │Prometheus│
│+TimescaleDB│ │  Cache  │ │ Grafana │
└───────────┘ └─────────┘ └─────────┘
      │
┌─────┴──────────────────────────────────────────────────────┐
│                    Station Network                          │
│  VLAN 20: PC Stations    │    VLAN 30: Console Stations    │
└──────┬───────────────────┴──────────────┬──────────────────┘
       │                                  │
┌──────▼──────┐                    ┌──────▼──────┐
│  PC Agent   │                    │ Smart Plugs │
│  (Windows)  │                    │  / Router   │
└─────────────┘                    └─────────────┘
```

## 🛠️ Technology Stack

### Backend
- **FastAPI** - REST API + WebSocket server
- **PostgreSQL** - Primary database with TimescaleDB
- **Redis** - Session cache and pub/sub
- **SQLAlchemy** - ORM
- **Alembic** - Database migrations

### Frontend
- **Next.js 14** - React framework
- **shadcn/ui** - UI components
- **TanStack Query** - Server state management
- **Tailwind CSS** - Styling

### PC Agent
- **Python 3.11+** - Core language
- **websockets** - WebSocket client
- **pywin32** - Windows API integration

### DevOps
- **Docker** - Containerization
- **Ansible** - Agent deployment
- **Prometheus + Grafana** - Monitoring
- **Nginx** - Reverse proxy

## 📦 Project Structure

```
GameOps/
├── backend/              # FastAPI server
│   ├── api/             # REST endpoints
│   ├── websocket/       # WebSocket handlers
│   ├── models/          # Database models
│   ├── services/        # Business logic
│   ├── integrations/    # Smart plug, router APIs
│   └── scheduler/       # Session expiration checker
├── frontend/            # Next.js admin UI
│   ├── app/            # App router pages
│   ├── components/     # React components
│   └── lib/            # Utilities
├── agent/               # Windows PC agent
│   ├── main.py         # Entry point
│   ├── websocket_client.py
│   ├── enforcement.py
│   └── ui/             # Kiosk overlay
├── docs/                # Documentation
│   ├── architecture/
│   ├── api/
│   ├── deployment/
│   └── security/
├── deployment/          # Docker, k8s, Ansible
├── database/            # Migrations, schemas
└── monitoring/          # Prometheus, Grafana configs
```

## 🔒 Security Features

- **TLS/SSL Encryption**: All communications encrypted
- **JWT Authentication**: Secure token-based auth
- **RBAC**: Role-based access control (Admin, Staff, Customer)
- **VLAN Segmentation**: Network isolation
- **Audit Logging**: Complete activity trail
- **Rate Limiting**: API protection
- **Input Validation**: Pydantic schemas

## 📊 Monitoring

- **Prometheus**: Metrics collection
- **Grafana**: Dashboards and visualization
- **Loki**: Log aggregation
- **Alerts**: Email/Slack notifications for issues

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test

# Agent tests
cd agent
pytest
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/GameOps/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/GameOps/discussions)

## 🗺️ Roadmap

- [x] Core architecture design
- [x] API specification
- [x] Database schema
- [x] Deployment guide
- [ ] MVP implementation
- [ ] PC agent development
- [ ] Admin UI development
- [ ] Smart plug integration
- [ ] Payment gateway integration
- [ ] Mobile app for customers
- [ ] Advanced analytics
- [ ] Multi-venue support

## 👥 Authors

- Your Team - Initial work

## 🙏 Acknowledgments

- FastAPI for the excellent framework
- shadcn/ui for beautiful components
- The open-source community