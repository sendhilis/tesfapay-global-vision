# GlobalPay — Spring Boot Backend Templates

> **Copy-paste ready** Java source files for the GlobalPay microservices backend.
> These are **reference templates**, not a runnable project — use Spring Initializr to scaffold each service, then paste these files in.

---

## Quick Start

### 1. Generate each microservice at [start.spring.io](https://start.spring.io)

| Service | Group | Artifact | Dependencies |
|---|---|---|---|
| **auth-service** | `com.globalpay` | `auth-service` | Web, Security, JPA, PostgreSQL, Flyway, Validation, Lombok |
| **wallet-service** | `com.globalpay` | `wallet-service` | Web, JPA, PostgreSQL, Flyway, OpenFeign, Kafka, Validation, Lombok |
| **transfer-service** | `com.globalpay` | `transfer-service` | Web, JPA, PostgreSQL, Flyway, OpenFeign, Kafka, Validation, Lombok |
| **payment-service** | `com.globalpay` | `payment-service` | Web, JPA, PostgreSQL, Flyway, Validation, Lombok |
| **savings-service** | `com.globalpay` | `savings-service` | Web, JPA, PostgreSQL, Flyway, OpenFeign, Validation, Lombok |
| **loan-service** | `com.globalpay` | `loan-service` | Web, JPA, PostgreSQL, Flyway, OpenFeign, Validation, Lombok |
| **loyalty-service** | `com.globalpay` | `loyalty-service` | Web, JPA, PostgreSQL, Flyway, Kafka, Validation, Lombok |
| **agent-service** | `com.globalpay` | `agent-service` | Web, JPA, PostgreSQL, Flyway, OpenFeign, Kafka, Validation, Lombok |
| **notification-service** | `com.globalpay` | `notification-service` | Web, JPA, PostgreSQL, Flyway, Kafka, Validation, Lombok |
| **admin-service** | `com.globalpay` | `admin-service` | Web, JPA, PostgreSQL, Flyway, OpenFeign, Validation, Lombok |
| **gateway-service** | `com.globalpay` | `gateway-service` | Gateway, Eureka Client |
| **discovery-service** | `com.globalpay` | `discovery-service` | Eureka Server |

### 2. Copy template files into each service

```
backend-templates/
├── common/                      → shared module (publish as Maven artifact)
│   ├── dto/                     → Request/Response DTOs
│   ├── enums/                   → Shared enums
│   ├── exception/               → Exception classes + global handler
│   └── security/                → JWT utilities
│
├── auth-service/                → com.globalpay.auth
├── wallet-service/              → com.globalpay.wallet
├── transfer-service/            → com.globalpay.transfer
├── payment-service/             → com.globalpay.payment
├── savings-service/             → com.globalpay.savings
├── loan-service/                → com.globalpay.loan
├── loyalty-service/             → com.globalpay.loyalty
├── agent-service/               → com.globalpay.agent
├── notification-service/        → com.globalpay.notification
├── admin-service/               → com.globalpay.admin
├── gateway-service/             → com.globalpay.gateway
├── infrastructure/              → Docker, Flyway migrations
│   ├── docker-compose.yml
│   └── flyway/
```

### 3. Set up databases

Each service gets its own PostgreSQL database:
```bash
createdb globalpay_auth
createdb globalpay_wallet
createdb globalpay_transfer
createdb globalpay_payment
createdb globalpay_savings
createdb globalpay_loan
createdb globalpay_loyalty
createdb globalpay_agent
createdb globalpay_notification
createdb globalpay_admin
```

### 4. Run Flyway migrations

Copy `backend-templates/infrastructure/flyway/` SQL files to each service's `src/main/resources/db/migration/`.

### 5. Start services

```bash
# Start infrastructure first
docker-compose up -d postgres kafka zookeeper redis

# Start discovery server
cd discovery-service && mvn spring-boot:run

# Start gateway
cd gateway-service && mvn spring-boot:run

# Start business services (any order)
cd auth-service && mvn spring-boot:run
cd wallet-service && mvn spring-boot:run
# ... etc
```

---

## File Mapping to API Contract

| Template File | API Endpoints | Front-end Pages |
|---|---|---|
| `auth-service/AuthController.java` | `/auth/*` | LoginPage, Onboarding |
| `wallet-service/WalletController.java` | `/wallet/*` | WalletHome |
| `transfer-service/TransferController.java` | `/transfers/*`, `/contacts/*` | SendMoney, RequestMoney |
| `payment-service/BillerController.java` | `/billers/*`, `/airtime/*`, `/merchants/*` | PayBills, AirtimeTopup, MerchantPay |
| `savings-service/SavingsController.java` | `/savings/*` | SavingsGoals |
| `loan-service/LoanController.java` | `/loans/*` | MicroLoan |
| `loyalty-service/LoyaltyController.java` | `/loyalty/*` | LoyaltyRewards |
| `agent-service/AgentController.java` | `/agent/*`, `/cash/*` | Agent portal pages |
| `admin-service/AdminController.java` | `/admin/*` | Admin console pages |

---

## Related Documentation

- `API_CONTRACT.md` — Full endpoint specs with request/response JSON
- `DATABASE_SCHEMA.md` — 31-table PostgreSQL schema with JPA entity samples
- `MICROSERVICES_ARCHITECTURE.md` — Service boundaries, Kafka topics, Saga patterns
- `DEVELOPER_GUIDE.md` — React-to-Spring concept mapping
- `POSTMAN_COLLECTION.json` — 55 pre-built API test requests
