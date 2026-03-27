# GlobalPay Backend — Spring Boot Microservices

> Production-ready backend for **TesfaPay / GlobalPay** wallet app.  
> Built to match the API contract in `API_CONTRACT.md` and the architecture in `MICROSERVICES_ARCHITECTURE.md`.

---

## Services Built

| # | Service | Port | Status | Description |
|---|---------|------|--------|-------------|
| 1 | `gp-discovery` | 8761 | ✅ | Eureka service registry |
| 2 | `gp-gateway` | 8080 | ✅ | Spring Cloud Gateway — JWT validation, routing, rate limiting |
| 3 | `gp-auth-service` | 8081 | ✅ | Registration, OTP, MPIN login, biometric, JWT tokens |
| 4 | `gp-wallet-service` | 8083 | ✅ | Double-entry ledger, balances, transaction history |
| 5 | `gp-transfer-service` | 8084 | ✅ | P2P send money (Saga), request money, contacts |
| 6 | `gp-agent-service` | 8089 | ✅ | Cash-in/out, float management, commissions |

> Services not yet scaffolded: `gp-user-service` (8082), `gp-payment-service` (8085), `gp-savings-service` (8086), `gp-loan-service` (8087), `gp-loyalty-service` (8088), `gp-admin-service` (8090), `gp-notification-service` (8091).  
> Follow the same patterns from the services above to implement them.

---

## Prerequisites

- Docker & Docker Compose
- Java 17+
- Maven 3.9+

---

## Quick Start (Docker Compose)

```bash
# 1. Clone and enter the project
git clone https://github.com/sendhilis/tesfapay-global-vision
cd globalpay

# 2. Copy and configure environment
cp .env.example .env
# Edit .env — at minimum change JWT_SECRET for production

# 3. Start everything (infrastructure + services)
docker-compose up --build

# 4. Verify services are registered
open http://localhost:8761   # Eureka dashboard (user: eureka / pass: EurekaPass123!)

# 5. Test via the gateway
curl http://localhost:8080/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phone":"+251911234567","firstName":"Abebe","lastName":"Girma","pin":"123456"}'
```

---

## Local Development (per service)

```bash
# 1. Start infrastructure only
docker-compose up postgres redis kafka zookeeper minio -d

# 2. Create all databases
psql -U globalpay -h localhost -f init-databases.sql

# 3. Run a specific service (e.g. auth)
cd gp-auth-service
mvn spring-boot:run

# 4. Swagger UI for each service
open http://localhost:8081/swagger-ui.html   # auth
open http://localhost:8083/swagger-ui.html   # wallet
open http://localhost:8084/swagger-ui.html   # transfer
open http://localhost:8089/swagger-ui.html   # agent
```

---

## Architecture Summary

```
Lovable Frontend (React/Vite)
        │ HTTPS
        ▼
  gp-gateway :8080          ← JWT validation, rate limiting, routing
        │
   Eureka Registry           ← Service discovery (lb://)
        │
  ┌─────┴─────────────────────────────────────┐
  │  gp-auth-service    :8081                  │
  │  gp-wallet-service  :8083  ← ledger        │
  │  gp-transfer-service:8084  ← P2P Saga      │
  │  gp-agent-service   :8089  ← cash ops      │
  └────────────────────────────────────────────┘
        │
  PostgreSQL + Redis + Kafka + MinIO
```

---

## Key Design Decisions

### Double-Entry Ledger (gp-wallet-service)
Every financial movement writes two `ledger_entries` rows — one DEBIT, one CREDIT — ensuring `SUM(DEBIT) == SUM(CREDIT)` for regulatory reconciliation.

### P2P Transfer Saga (gp-transfer-service)
Uses the **Orchestration Saga** pattern:
1. Validate recipient (User Service)
2. Debit sender (Wallet Service)
3. Credit recipient (Wallet Service)
4. On failure at step 3 → automatically refund sender (compensation)
5. Publish `transfer.completed` Kafka event (fire-and-forget)

### JWT Flow
```
Client → POST /v1/auth/login → gp-auth-service
       ← { accessToken, refreshToken }

Client → GET /v1/wallet/balance
       → Authorization: Bearer <accessToken>
       → gp-gateway validates JWT, injects X-User-Id / X-Wallet-Id headers
       → gp-wallet-service reads headers (trusts gateway)
```

### Idempotency
All write endpoints accept `X-Idempotency-Key` header. Duplicate submissions within 24h return the original response without re-processing.

---

## Connecting to the Lovable Frontend

In your Lovable project, set the API base URL:

```typescript
// src/lib/api.ts
export const API_BASE = 'http://localhost:8080/v1';   // dev
// export const API_BASE = 'https://api.globalpay.et/v1'; // prod
```

All endpoints match `API_CONTRACT.md` exactly.

---

## Running Tests

```bash
cd gp-auth-service && mvn test
cd gp-wallet-service && mvn test
cd gp-transfer-service && mvn test
```

---

## Production Checklist

- [ ] Change `JWT_SECRET` to a cryptographically random 256-bit value
- [ ] Set `OTP_MOCK_ENABLED=false` and configure Africa's Talking / Twilio
- [ ] Enable TLS on gateway and all inter-service communication
- [ ] Set `spring.jpa.show-sql=false` on all services
- [ ] Configure proper Kafka replication factor (`replicas: 3` in KafkaConfig)
- [ ] Set up PostgreSQL HA (read replicas, connection pooling via PgBouncer)
- [ ] Configure Prometheus + Grafana dashboards
- [ ] Set up centralized logging (ELK or CloudWatch)

---

*Generated to match `API_CONTRACT.md`, `DATABASE_SCHEMA.md`, and `MICROSERVICES_ARCHITECTURE.md` from the tesfapay-global-vision repository.*
