# GlobalPay Backend — Quick Start

## Run in 3 commands

```bash
cd globalpay
cp .env.example .env
docker-compose up --build
```

## Verify
- Eureka: http://localhost:8761 (user: eureka / pass: EurekaPass123!)
- Gateway: http://localhost:8080

## Services & Ports

| Service | Port |
|---|---|
| gp-discovery (Eureka) | 8761 |
| gp-gateway | 8080 |
| gp-auth-service | 8081 |
| gp-user-service | 8082 |
| gp-wallet-service | 8083 |
| gp-transfer-service | 8084 |
| gp-payment-service | 8085 |
| gp-savings-service | 8086 |
| gp-loan-service | 8087 |
| gp-loyalty-service | 8088 |
| gp-agent-service | 8089 |
| gp-admin-service | 8090 |
| gp-notification-service | 8091 |

## Requirements
- Docker Desktop
- 6GB RAM allocated to Docker
