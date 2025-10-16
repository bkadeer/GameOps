# Getting Started with GameOps

This guide will help you understand the project structure and get started with development or deployment.

## 📁 Project Structure

```
GameOps/
├── docs/                           # 📚 Documentation
│   ├── architecture/               # System design documents
│   │   ├── 01-system-overview.md
│   │   ├── 02-component-design.md
│   │   └── 03-sequence-diagrams.md
│   ├── api/                        # API specifications
│   │   ├── openapi-spec.yaml
│   │   └── websocket-protocol.md
│   ├── deployment/                 # Deployment guides
│   │   └── deployment-guide.md
│   ├── security/                   # Security documentation
│   │   └── security-hardening.md
│   ├── IMPLEMENTATION_STATUS.md    # Current progress
│   └── GETTING_STARTED.md         # This file
│
├── backend/                        # 🔧 FastAPI Backend
│   ├── app/
│   │   ├── main.py                # Application entry point
│   │   ├── core/                  # Core configuration
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   └── redis_client.py
│   │   ├── models/                # Database models
│   │   │   ├── station.py
│   │   │   ├── session.py
│   │   │   ├── user.py
│   │   │   ├── payment.py
│   │   │   └── event.py
│   │   ├── api/                   # REST API endpoints (TODO)
│   │   ├── websocket/             # WebSocket handlers (TODO)
│   │   ├── services/              # Business logic (TODO)
│   │   ├── integrations/          # External integrations (TODO)
│   │   └── scheduler/             # Background tasks (TODO)
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                       # 🎨 Next.js Admin UI (TODO)
├── agent/                          # 💻 Windows PC Agent (TODO)
├── database/                       # 🗄️ Database migrations (TODO)
├── deployment/                     # 🚀 Deployment configs (TODO)
├── monitoring/                     # 📊 Monitoring configs (TODO)
│
├── docker-compose.yml              # Docker orchestration
├── .env.example                    # Environment template
├── .gitignore
├── LICENSE
└── README.md

```

## 🎯 What Has Been Completed

### ✅ Phase 1: Documentation & Architecture (COMPLETE)

1. **Comprehensive Architecture Documentation**
   - System overview with high-level architecture
   - Detailed component design
   - 10 sequence diagrams covering all major flows
   - Technology stack recommendations

2. **API Specifications**
   - Complete OpenAPI 3.0 specification
   - WebSocket protocol documentation
   - Message formats and error handling

3. **Deployment & Security**
   - Docker Compose configuration
   - Network architecture (VLANs, firewall rules)
   - Security hardening guide
   - Backup and recovery procedures

4. **Backend Foundation**
   - FastAPI application structure
   - Database models (SQLAlchemy)
   - Configuration management
   - Redis client wrapper
   - Docker containerization

## 🚀 Quick Start Options

### Option 1: Review Documentation (Recommended First Step)

Start by understanding the system architecture:

```bash
# Read in this order:
1. README.md                                    # Project overview
2. docs/architecture/01-system-overview.md      # System design
3. docs/architecture/02-component-design.md     # Components
4. docs/api/openapi-spec.yaml                   # API reference
5. docs/deployment/deployment-guide.md          # How to deploy
```

### Option 2: Local Development Setup

#### Prerequisites
- Docker & Docker Compose
- Python 3.11+ (for backend development)
- Node.js 18+ (for frontend development, when ready)
- PostgreSQL client (optional, for direct DB access)

#### Steps

1. **Clone and Configure**
```bash
cd /Users/admin/CascadeProjects/GameOps

# Create environment file
cp .env.example .env

# Generate a secure secret key
openssl rand -hex 32
# Copy the output and set it as SECRET_KEY in .env

# Edit .env with your settings
nano .env
```

2. **Start Infrastructure**
```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Wait for services to be ready
sleep 10

# Check status
docker-compose ps
```

3. **Backend Development**
```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations (once implemented)
# alembic upgrade head

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

4. **Access Services**
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/api/docs
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Option 3: Full Stack with Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop all services
docker-compose down
```

## 📖 Key Documentation Files

### For Developers
- **[Component Design](docs/architecture/02-component-design.md)** - Understand each component
- **[OpenAPI Spec](docs/api/openapi-spec.yaml)** - REST API reference
- **[WebSocket Protocol](docs/api/websocket-protocol.md)** - Real-time communication
- **[Implementation Status](docs/IMPLEMENTATION_STATUS.md)** - Current progress

### For DevOps
- **[Deployment Guide](docs/deployment/deployment-guide.md)** - How to deploy
- **[Security Hardening](docs/security/security-hardening.md)** - Security best practices
- **docker-compose.yml** - Container orchestration
- **.env.example** - Configuration template

### For System Architects
- **[System Overview](docs/architecture/01-system-overview.md)** - High-level design
- **[Sequence Diagrams](docs/architecture/03-sequence-diagrams.md)** - Flow diagrams
- **README.md** - Project overview

## 🛠️ Development Workflow

### Backend Development

```bash
# Activate virtual environment
source backend/venv/bin/activate

# Run tests (once implemented)
pytest

# Format code
black backend/app

# Lint code
flake8 backend/app

# Type checking
mypy backend/app
```

### Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

### Adding New Features

1. **Create database model** in `backend/app/models/`
2. **Create Pydantic schema** in `backend/app/schemas/`
3. **Implement service logic** in `backend/app/services/`
4. **Create API endpoint** in `backend/app/api/v1/`
5. **Write tests** in `backend/tests/`
6. **Update documentation**

## 🧪 Testing

```bash
# Backend unit tests
cd backend
pytest tests/

# Backend integration tests
pytest tests/integration/

# Load testing (once implemented)
locust -f tests/load/locustfile.py
```

## 📊 Monitoring

Once deployed:

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin/admin)
- **Backend Metrics**: http://localhost:8000/metrics

## 🔍 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Connect to database
docker-compose exec postgres psql -U evms_user -d evms
```

### Redis Connection Issues
```bash
# Check if Redis is running
docker-compose ps redis

# Test Redis connection
docker-compose exec redis redis-cli ping
```

### Backend Issues
```bash
# View backend logs
docker-compose logs -f backend

# Restart backend
docker-compose restart backend

# Check backend health
curl http://localhost:8000/health
```

## 📚 Next Steps

### For Developers

1. **Review the architecture** - Understand the system design
2. **Set up local environment** - Get Docker running
3. **Explore the codebase** - Familiarize yourself with the structure
4. **Check implementation status** - See what needs to be built
5. **Pick a task** - Start with authentication or API endpoints

### For DevOps

1. **Review deployment guide** - Understand infrastructure requirements
2. **Plan network architecture** - VLANs, firewall rules
3. **Prepare hardware** - Server, switches, smart plugs
4. **Test deployment** - Use Docker Compose locally
5. **Plan production deployment** - Kubernetes or single server

### For Project Managers

1. **Review system overview** - Understand capabilities
2. **Check implementation status** - Track progress
3. **Review timeline estimates** - Plan sprints
4. **Identify risks** - Hardware, network, integration points
5. **Plan testing** - QA strategy

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Update documentation
5. Submit a pull request

## 📞 Support

- **Documentation**: Check `docs/` directory
- **Issues**: GitHub Issues (when repository is public)
- **Questions**: GitHub Discussions (when repository is public)

## 🎓 Learning Resources

### FastAPI
- [Official Documentation](https://fastapi.tiangolo.com/)
- [WebSocket Tutorial](https://fastapi.tiangolo.com/advanced/websockets/)

### SQLAlchemy
- [Async SQLAlchemy](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html)

### Next.js
- [Official Documentation](https://nextjs.org/docs)
- [App Router](https://nextjs.org/docs/app)

### Docker
- [Docker Compose](https://docs.docker.com/compose/)
- [Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

**Ready to start?** Begin with reviewing the [System Overview](docs/architecture/01-system-overview.md) to understand the architecture!
