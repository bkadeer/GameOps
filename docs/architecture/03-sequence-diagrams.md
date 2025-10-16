# Sequence Diagrams - Session Lifecycle

## 1. Session Start Flow

```mermaid
sequenceDiagram
    participant Admin as Admin UI
    participant API as FastAPI Server
    participant DB as PostgreSQL
    participant Redis as Redis Cache
    participant Agent as PC Agent
    participant Plug as Smart Plug

    Admin->>API: POST /api/v1/sessions/start<br/>{station_id, duration, user_id}
    
    API->>DB: Check station availability
    DB-->>API: Station available
    
    API->>DB: Create payment record
    DB-->>API: Payment ID
    
    API->>DB: Create session record
    DB-->>API: Session created
    
    API->>Redis: Cache session state<br/>SET session:{id} {data}
    API->>Redis: PUBLISH session:started {session_id}
    
    alt Station Type = PC
        API->>Agent: WebSocket: session_start<br/>{session_id, duration}
        Agent-->>API: ACK
        Agent->>Agent: Start countdown timer
        Agent->>Agent: Show kiosk UI overlay
    else Station Type = Console
        API->>Plug: HTTP POST /relay/0?turn=on
        Plug-->>API: OK
    end
    
    API-->>Admin: 201 Created {session}
    Admin->>Admin: Update dashboard
    
    Note over Agent: Every 30s
    Agent->>API: WebSocket: heartbeat<br/>{session_id, remaining_time}
    API->>Redis: Update session cache
```

---

## 2. Session Extension Flow

```mermaid
sequenceDiagram
    participant Admin as Admin UI
    participant API as FastAPI Server
    participant DB as PostgreSQL
    participant Redis as Redis Cache
    participant Agent as PC Agent

    Admin->>API: PUT /api/v1/sessions/{id}/extend<br/>{additional_minutes: 30}
    
    API->>DB: Get session by ID
    DB-->>API: Session data
    
    alt Session is ACTIVE
        API->>DB: Create additional payment
        DB-->>API: Payment created
        
        API->>DB: Update session<br/>extended_minutes += 30<br/>scheduled_end_at += 30min
        DB-->>API: Session updated
        
        API->>Redis: Update cached session
        API->>Redis: PUBLISH session:extended {session_id, added_seconds}
        
        API->>Agent: WebSocket: session_extend<br/>{session_id, additional_seconds: 1800}
        Agent-->>API: ACK
        Agent->>Agent: Update countdown timer
        Agent->>Agent: Show "Time added!" notification
        
        API-->>Admin: 200 OK {updated_session}
    else Session is not ACTIVE
        API-->>Admin: 400 Bad Request<br/>"Cannot extend inactive session"
    end
```

---

## 3. Session Expiration Flow

```mermaid
sequenceDiagram
    participant Scheduler as Session Monitor
    participant DB as PostgreSQL
    participant Redis as Redis Cache
    participant API as FastAPI Server
    participant Agent as PC Agent
    participant Plug as Smart Plug

    Note over Scheduler: Runs every 10 seconds
    
    Scheduler->>DB: SELECT sessions WHERE<br/>scheduled_end_at <= NOW()<br/>AND status = 'ACTIVE'
    DB-->>Scheduler: Expired sessions list
    
    loop For each expired session
        Scheduler->>Redis: Get session cache
        Redis-->>Scheduler: Session data
        
        Scheduler->>DB: UPDATE session<br/>status = 'EXPIRED'<br/>actual_end_at = NOW()
        
        Scheduler->>Redis: PUBLISH session:expired {session_id}
        
        alt Station Type = PC
            Scheduler->>Agent: WebSocket: session_expired<br/>{session_id, action: "logoff"}
            Agent->>Agent: Lock screen
            Agent->>Agent: Show "Session ended" message
            Agent->>Agent: Wait 30s for user to save
            Agent->>Agent: Logoff Windows user
            Agent-->>Scheduler: ACK
        else Station Type = Console
            Scheduler->>Plug: POST /relay/0?turn=off
            Plug-->>Scheduler: OK
        end
        
        Scheduler->>DB: INSERT INTO events<br/>(type: 'session_expired')
    end
```

---

## 4. Session Stop (Manual) Flow

```mermaid
sequenceDiagram
    participant Admin as Admin UI
    participant API as FastAPI Server
    participant DB as PostgreSQL
    participant Redis as Redis Cache
    participant Agent as PC Agent

    Admin->>API: DELETE /api/v1/sessions/{id}
    
    API->>DB: Get session by ID
    DB-->>API: Session data
    
    alt Session is ACTIVE
        API->>DB: UPDATE session<br/>status = 'STOPPED'<br/>actual_end_at = NOW()
        DB-->>API: Session updated
        
        API->>Redis: Delete session cache
        API->>Redis: PUBLISH session:stopped {session_id}
        
        API->>Agent: WebSocket: session_stop<br/>{session_id, action: "lock"}
        Agent-->>API: ACK
        Agent->>Agent: Lock screen (no logoff)
        Agent->>Agent: Hide kiosk overlay
        
        API-->>Admin: 200 OK {stopped_session}
        Admin->>Admin: Update dashboard
    else Session already ended
        API-->>Admin: 400 Bad Request<br/>"Session already ended"
    end
```

---

## 5. Agent Connection & Heartbeat Flow

```mermaid
sequenceDiagram
    participant Agent as PC Agent
    participant API as FastAPI Server
    participant Redis as Redis Cache
    participant DB as PostgreSQL

    Note over Agent: Agent starts on boot
    
    Agent->>API: WebSocket Connect<br/>wss://api.venue.local/ws/agent/{station_id}<br/>Authorization: Bearer {token}
    
    API->>API: Validate JWT token
    API->>DB: Get station by ID
    DB-->>API: Station data
    
    alt Station exists
        API->>Redis: Register connection<br/>SET ws:connections:{station_id}
        API->>DB: UPDATE station<br/>status = 'ONLINE'
        API-->>Agent: Connection accepted
        
        Agent->>API: WebSocket: agent_hello<br/>{version, os, specs}
        API->>DB: UPDATE station specs
        
        loop Every 30 seconds
            Agent->>API: WebSocket: heartbeat<br/>{cpu, ram, active_session}
            API->>Redis: Update heartbeat timestamp
            
            alt Has active session
                Agent->>API: {remaining_seconds}
                API->>Redis: Update session cache
            end
            
            API-->>Agent: heartbeat_ack
        end
        
    else Station not found
        API-->>Agent: 404 Not Found<br/>Close connection
    end
    
    Note over Agent: Connection lost
    Agent->>Agent: Attempt reconnect<br/>Exponential backoff
```

---

## 6. Payment Processing Flow

```mermaid
sequenceDiagram
    participant Admin as Admin UI
    participant API as FastAPI Server
    participant DB as PostgreSQL
    participant PG as Payment Gateway<br/>(Stripe/Square)

    Admin->>API: POST /api/v1/sessions/start<br/>{payment_method: "CARD", amount: 10.00}
    
    API->>DB: Create payment record<br/>status = 'PENDING'
    DB-->>API: Payment ID
    
    alt Payment method = CARD
        API->>PG: Create payment intent<br/>{amount, currency}
        PG-->>API: Client secret
        
        API-->>Admin: {payment_id, client_secret}
        Admin->>PG: Confirm payment (frontend)
        PG-->>Admin: Payment successful
        
        Admin->>API: POST /api/v1/payments/{id}/confirm
        API->>PG: Verify payment status
        PG-->>API: Confirmed
        
        API->>DB: UPDATE payment<br/>status = 'COMPLETED'<br/>transaction_id = {pg_id}
        
    else Payment method = CASH
        API->>DB: UPDATE payment<br/>status = 'COMPLETED'
        
    else Payment method = BALANCE
        API->>DB: Get user balance
        DB-->>API: Balance: $25.00
        
        alt Balance sufficient
            API->>DB: UPDATE user<br/>balance -= amount
            API->>DB: UPDATE payment<br/>status = 'COMPLETED'
        else Insufficient balance
            API->>DB: UPDATE payment<br/>status = 'FAILED'
            API-->>Admin: 400 Insufficient balance
        end
    end
    
    alt Payment completed
        API->>API: Proceed with session creation
        API-->>Admin: 201 Session created
    else Payment failed
        API-->>Admin: 402 Payment required
    end
```

---

## 7. Console Station Control Flow (Smart Plug)

```mermaid
sequenceDiagram
    participant API as FastAPI Server
    participant Plug as Smart Plug<br/>(Shelly)
    participant Console as PS5/Xbox
    participant TV as Display

    Note over API: Session starts
    
    API->>Plug: POST http://192.168.30.101/relay/0?turn=on
    Plug->>Console: Power ON
    Plug-->>API: {"ison": true}
    
    Console->>Console: Boot sequence
    Console->>TV: HDMI signal
    
    Note over API: Monitor session
    
    loop Every 60 seconds
        API->>Plug: GET /status
        Plug-->>API: {"relay": {"ison": true}, "power": 45.2}
        API->>API: Log power consumption
    end
    
    Note over API: Session expires
    
    API->>Plug: POST /relay/0?turn=off
    Plug->>Console: Power OFF
    Plug-->>API: {"ison": false}
    
    Console->>Console: Hard shutdown
    TV->>TV: No signal
```

---

## 8. Network-Based Console Control (Router API)

```mermaid
sequenceDiagram
    participant API as FastAPI Server
    participant Router as Mikrotik Router
    participant Console as PS5
    participant Internet as Internet

    Note over API: Session starts
    
    API->>Router: RouterOS API:<br/>/ip/firewall/filter/remove<br/>where src-mac={console_mac}
    Router-->>API: Rule removed
    
    Console->>Router: Network traffic
    Router->>Internet: Forward packets
    
    Note over Console: Gaming online
    
    Note over API: Session expires
    
    API->>Router: RouterOS API:<br/>/ip/firewall/filter/add<br/>chain=forward<br/>src-mac={console_mac}<br/>action=drop
    Router-->>API: Rule added
    
    Console->>Router: Network traffic
    Router->>Router: Drop packets
    Router--XInternet: Blocked
    
    Note over Console: No network access<br/>Game disconnects
```

---

## 9. Station Status Update Flow

```mermaid
sequenceDiagram
    participant Agent as PC Agent
    participant API as FastAPI Server
    participant Redis as Redis Cache
    participant DB as PostgreSQL
    participant UI as Admin UI

    Agent->>API: WebSocket: status_change<br/>{status: "MAINTENANCE"}
    
    API->>DB: UPDATE station<br/>status = 'MAINTENANCE'
    DB-->>API: Updated
    
    API->>Redis: PUBLISH station:status<br/>{station_id, status}
    
    Redis->>UI: WebSocket broadcast
    UI->>UI: Update station card<br/>Show maintenance icon
    
    Note over Agent: Maintenance completed
    
    Agent->>API: WebSocket: status_change<br/>{status: "ONLINE"}
    
    API->>DB: UPDATE station<br/>status = 'ONLINE'
    API->>Redis: PUBLISH station:status
    Redis->>UI: Broadcast
    UI->>UI: Update station card<br/>Show available
```

---

## 10. Error Handling & Recovery

```mermaid
sequenceDiagram
    participant Agent as PC Agent
    participant API as FastAPI Server
    participant Redis as Redis Cache
    participant DB as PostgreSQL

    Note over Agent: Connection lost
    
    Agent->>Agent: Detect WebSocket disconnect
    Agent->>Agent: Enter offline mode
    Agent->>Agent: Continue countdown locally
    
    loop Reconnection attempts
        Agent->>API: WebSocket Connect (retry)
        alt Connection successful
            API-->>Agent: Connected
            Agent->>API: WebSocket: sync_request<br/>{last_known_session}
            
            API->>DB: Get current session
            DB-->>API: Session data
            
            alt Session still active
                API->>Agent: sync_response<br/>{session, server_time}
                Agent->>Agent: Sync local countdown
            else Session expired during disconnect
                API->>Agent: session_expired
                Agent->>Agent: Enforce expiration
            else No active session
                API->>Agent: no_session
                Agent->>Agent: Clear local state
            end
        else Connection failed
            Agent->>Agent: Wait with exponential backoff
        end
    end
```

---

## Next: Database Schema & Deployment Plans
