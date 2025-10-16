# System Overview - Esports Venue Management System

## Executive Summary

The **Esports Venue Management System (EVMS)** is a production-ready platform for managing timed gaming sessions across PC and console stations in esports venues. It provides real-time session control, automated enforcement, payment processing, and comprehensive administrative tools.

## System Goals

1. **Session Management**: Start, extend, and stop paid sessions on individual stations
2. **Real-time Monitoring**: Display countdown timers and station status in real-time
3. **Automated Enforcement**: Lock/logoff PCs and power-off/network-block consoles on expiration
4. **Business Operations**: POS/invoicing, session history, membership management
5. **On-Premise First**: Local operation with optional cloud analytics/backups

## Key Capabilities

- Support for **200+ stations** (scalable to 1000+)
- **<2s latency** for real-time updates on local LAN
- **Offline-capable**: Continues operation without internet
- **Multi-station types**: Windows PCs, PS5, Xbox, Nintendo Switch
- **Flexible control**: Network-based and power-based enforcement
- **Secure**: TLS encryption, authentication, RBAC

## Actors

### Primary Users

- **Admin/Staff**: Manage sessions, pricing, view dashboard, handle payments
- **Customers**: Login, pay, view remaining time on station
- **System Operators**: Deploy, monitor, maintain infrastructure

### System Components

- **Admin Server**: Core backend (FastAPI + WebSocket)
- **PC Agents**: Windows services on each gaming PC
- **Console Controllers**: Smart plugs, network devices, or microcontrollers
- **Admin Web UI**: React/Next.js dashboard for staff
- **Database**: PostgreSQL + Redis for state management
- **Network Infrastructure**: VLANs, managed switches, firewalls

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Admin Web UI (Next.js)                    │
│                    https://admin.venue.local                     │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS/WSS
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                     Admin Server (FastAPI)                       │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐ │
│  │  REST API    │  WebSocket   │  Scheduler   │ Integrations │ │
│  │  Endpoints   │   Server     │   Service    │   Layer      │ │
│  └──────────────┴──────────────┴──────────────┴──────────────┘ │
└─────────┬────────────────┬────────────────┬────────────────────┘
          │                │                │
          │                │                │
    ┌─────▼─────┐    ┌────▼────┐    ┌──────▼──────┐
    │PostgreSQL │    │  Redis  │    │  Monitoring │
    │ +TimescaleDB│   │  Cache  │    │ (Prometheus)│
    └───────────┘    └─────────┘    └─────────────┘
          │
          │
┌─────────┴───────────────────────────────────────────────────────┐
│                        Station Network                           │
│  VLAN 20: PC Stations    │    VLAN 30: Console Stations         │
└──────────┬────────────────┴──────────────┬──────────────────────┘
           │                               │
    ┌──────▼──────┐                 ┌──────▼──────┐
    │  PC Agent   │                 │ Smart Plugs │
    │  (Windows)  │                 │  / Router   │
    │  WebSocket  │                 │   Control   │
    └─────────────┘                 └─────────────┘
```

## Technology Stack

### Backend
- **FastAPI**: REST API + WebSocket server
- **PostgreSQL**: Primary database with TimescaleDB extension
- **Redis**: Session cache, pub/sub, connection registry
- **APScheduler**: Session expiration monitoring
- **SQLAlchemy**: ORM
- **Pydantic**: Data validation

### Frontend
- **Next.js 14+**: React framework with App Router
- **shadcn/ui + Tailwind CSS**: UI components
- **TanStack Query**: Server state management
- **Zustand**: Client state management
- **Socket.io / native WebSocket**: Real-time updates

### PC Agent
- **Python 3.11+**: Core language
- **websockets**: WebSocket client
- **pywin32**: Windows API integration
- **psutil**: System monitoring
- **PyInstaller**: Compile to .exe

### Console Control
- **Shelly/Tasmota**: Smart plugs (local HTTP/MQTT)
- **Mikrotik RouterOS API**: Network control
- **Ubiquiti UniFi API**: Alternative network control

### DevOps
- **Docker + Docker Compose**: Containerization
- **Ansible**: Agent deployment automation
- **Prometheus + Grafana**: Monitoring
- **Loki**: Log aggregation
- **Nginx**: Reverse proxy

## Deployment Model

### On-Premise (Primary)
- Single server or VM running Docker Compose
- Local network with VLANs
- No internet dependency for core operations

### Hybrid (Optional)
- On-premise core + cloud analytics
- Backup to cloud storage
- Remote monitoring dashboard

### Scalability Targets
- **Small venue**: 1-50 stations, single server
- **Medium venue**: 50-200 stations, single server with Redis
- **Large venue**: 200-1000+ stations, Kubernetes cluster

## Security Principles

1. **Zero Trust**: All connections authenticated and encrypted
2. **Network Segmentation**: VLANs isolate station traffic
3. **Least Privilege**: Minimal permissions for all components
4. **Secrets Management**: Vault or encrypted environment variables
5. **Audit Logging**: All administrative actions logged

## Non-Functional Requirements

| Requirement | Target | Measurement |
|-------------|--------|-------------|
| **Latency** | <2s | WebSocket message round-trip |
| **Availability** | 99.9% | Uptime during business hours |
| **Scalability** | 200 stations | Concurrent WebSocket connections |
| **Recovery Time** | <5 min | From power loss to operational |
| **Data Retention** | 2 years | Session history and payments |

## Success Metrics

- **Session accuracy**: 99.9% of sessions expire within ±5 seconds
- **Agent uptime**: 99.5% of agents connected during business hours
- **Payment success**: 99% of payment transactions complete
- **Staff efficiency**: <30s to start a new session
- **Customer satisfaction**: Real-time display updates <2s latency

## Next Steps

1. Review detailed component architecture
2. Examine API specifications
3. Study database schema design
4. Review deployment and security plans
5. Begin MVP implementation
