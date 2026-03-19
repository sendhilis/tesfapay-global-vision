# GlobalPay — Spring Boot Starter Guide

> **Audience:** Java developers setting up the first microservice (Auth Service) from scratch.
> **Goal:** Go from zero to a running, testable Auth Service in under 30 minutes.
> **Prerequisites:** JDK 21+, Maven 3.9+, PostgreSQL 15+, an IDE (IntelliJ IDEA recommended)

---

## Table of Contents

1. [Generate the Project](#1-generate-the-project)
2. [Project Structure](#2-project-structure)
3. [pom.xml — Full Dependencies](#3-pomxml--full-dependencies)
4. [application.yml — Configuration](#4-applicationyml--configuration)
5. [JPA Entities](#5-jpa-entities)
6. [Repositories](#6-repositories)
7. [DTOs — Request & Response](#7-dtos--request--response)
8. [Service Layer](#8-service-layer)
9. [Controller — REST Endpoints](#9-controller--rest-endpoints)
10. [Security Configuration](#10-security-configuration)
11. [JWT Token Provider](#11-jwt-token-provider)
12. [Exception Handling](#12-exception-handling)
13. [Flyway Database Migration](#13-flyway-database-migration)
14. [Run & Test](#14-run--test)
15. [Postman Verification](#15-postman-verification)
16. [Next Steps — Scaffold Remaining Services](#16-next-steps--scaffold-remaining-services)

---

## 1. Generate the Project

### Option A: Spring Initializr (Recommended)

Go to [start.spring.io](https://start.spring.io) with these settings:

| Setting | Value |
|---|---|
| Project | Maven |
| Language | Java |
| Spring Boot | 3.3.x (latest stable) |
| Group | `com.globalpay` |
| Artifact | `auth-service` |
| Name | `auth-service` |
| Package name | `com.globalpay.auth` |
| Packaging | Jar |
| Java | 21 |

**Dependencies to add:**
- Spring Web
- Spring Security
- Spring Data JPA
- PostgreSQL Driver
- Flyway Migration
- Validation
- Lombok
- Spring Boot Actuator

Click **Generate** → extract the ZIP → open in your IDE.

### Option B: Maven CLI

```bash
mvn archetype:generate \
  -DgroupId=com.globalpay \
  -DartifactId=auth-service \
  -DarchetypeArtifactId=maven-archetype-quickstart \
  -DinteractiveMode=false

cd auth-service
```

Then add dependencies manually (see Section 3).

---

## 2. Project Structure

After setup, your project should look like this:

```
auth-service/
├── pom.xml
├── src/
│   ├── main/
│   │   ├── java/com/globalpay/auth/
│   │   │   ├── AuthServiceApplication.java          ← @SpringBootApplication entry point
│   │   │   │
│   │   │   ├── config/
│   │   │   │   └── SecurityConfig.java              ← Spring Security + JWT config
│   │   │   │
│   │   │   ├── controller/
│   │   │   │   ├── AuthController.java              ← /v1/auth/* endpoints
│   │   │   │   └── UserController.java              ← /v1/users/* endpoints
│   │   │   │
│   │   │   ├── dto/
│   │   │   │   ├── request/
│   │   │   │   │   ├── RegisterRequest.java
│   │   │   │   │   ├── LoginRequest.java
│   │   │   │   │   ├── VerifyOtpRequest.java
│   │   │   │   │   ├── BiometricLoginRequest.java
│   │   │   │   │   ├── RefreshTokenRequest.java
│   │   │   │   │   └── KycUpgradeRequest.java
│   │   │   │   └── response/
│   │   │   │       ├── RegisterResponse.java
│   │   │   │       ├── LoginResponse.java
│   │   │   │       ├── UserProfileResponse.java
│   │   │   │       └── KycStatusResponse.java
│   │   │   │
│   │   │   ├── entity/
│   │   │   │   ├── User.java
│   │   │   │   ├── UserRole.java
│   │   │   │   ├── UserSession.java
│   │   │   │   ├── OtpVerification.java
│   │   │   │   └── KycApplication.java
│   │   │   │
│   │   │   ├── enums/
│   │   │   │   ├── AppRole.java
│   │   │   │   ├── UserStatus.java
│   │   │   │   ├── DocumentType.java
│   │   │   │   └── KycStatus.java
│   │   │   │
│   │   │   ├── exception/
│   │   │   │   ├── GlobalExceptionHandler.java
│   │   │   │   ├── ErrorResponse.java
│   │   │   │   ├── InvalidPinException.java
│   │   │   │   ├── AccountLockedException.java
│   │   │   │   └── ResourceNotFoundException.java
│   │   │   │
│   │   │   ├── repository/
│   │   │   │   ├── UserRepository.java
│   │   │   │   ├── UserRoleRepository.java
│   │   │   │   ├── UserSessionRepository.java
│   │   │   │   ├── OtpVerificationRepository.java
│   │   │   │   └── KycApplicationRepository.java
│   │   │   │
│   │   │   ├── security/
│   │   │   │   ├── JwtTokenProvider.java
│   │   │   │   └── JwtAuthFilter.java
│   │   │   │
│   │   │   └── service/
│   │   │       ├── AuthService.java
│   │   │       ├── UserService.java
│   │   │       └── OtpService.java
│   │   │
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-dev.yml
│   │       ├── application-prod.yml
│   │       └── db/migration/
│   │           ├── V1__create_users_and_roles.sql
│   │           └── V2__create_kyc_tables.sql
│   │
│   └── test/java/com/globalpay/auth/
│       ├── AuthServiceApplicationTests.java
│       ├── controller/
│       │   └── AuthControllerTest.java
│       └── service/
│           └── AuthServiceTest.java
│
├── Dockerfile
└── .env.example
```

> **Spring Boot equivalent of React structure:**
> - `controller/` = React `pages/` (route handlers)
> - `service/` = React `hooks/` (business logic)
> - `entity/` = TypeScript `interfaces` (data models)
> - `dto/` = React component props (request/response shapes)
> - `repository/` = React Query `queryFn` (data access)

---

## 3. pom.xml — Full Dependencies

Replace the generated `pom.xml` contents with:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.3.5</version>
        <relativePath/>
    </parent>

    <groupId>com.globalpay</groupId>
    <artifactId>auth-service</artifactId>
    <version>1.0.0</version>
    <name>GlobalPay Auth Service</name>
    <description>Authentication, registration, and user management for GlobalPay</description>

    <properties>
        <java.version>21</java.version>
        <jjwt.version>0.12.6</jjwt.version>
    </properties>

    <dependencies>
        <!-- ========== Web ========== -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- ========== Security ========== -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>

        <!-- ========== JPA + PostgreSQL ========== -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>

        <!-- ========== Database Migration ========== -->
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-core</artifactId>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-database-postgresql</artifactId>
        </dependency>

        <!-- ========== Validation ========== -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>

        <!-- ========== JWT (JJWT) ========== -->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>${jjwt.version}</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>${jjwt.version}</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>${jjwt.version}</version>
            <scope>runtime</scope>
        </dependency>

        <!-- ========== Lombok ========== -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- ========== Actuator (health checks) ========== -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>

        <!-- ========== OpenAPI / Swagger UI ========== -->
        <dependency>
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
            <version>2.6.0</version>
        </dependency>

        <!-- ========== Service Discovery (Eureka) ========== -->
        <!-- Uncomment when discovery-service is running -->
        <!--
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
        </dependency>
        -->

        <!-- ========== Testing ========== -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <!-- Spring Cloud BOM (uncomment when using Eureka/Feign) -->
    <!--
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>2023.0.3</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>
    -->

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

### Key dependency mapping to React equivalents:

| Maven Dependency | React/npm Equivalent | Purpose |
|---|---|---|
| `spring-boot-starter-web` | `react`, `react-router-dom` | HTTP server + routing |
| `spring-boot-starter-security` | N/A (new!) | Auth, CORS, CSRF |
| `spring-boot-starter-data-jpa` | `@tanstack/react-query` | Data access layer |
| `postgresql` | N/A (new!) | Database driver |
| `flyway-core` | N/A (new!) | Schema migrations |
| `spring-boot-starter-validation` | `zod`, `react-hook-form` | Input validation |
| `jjwt-*` | N/A (new!) | JWT token generation |
| `lombok` | TypeScript (auto-generates boilerplate) | Getters/setters/builders |
| `springdoc-openapi` | N/A | Auto-generated Swagger UI |

---

## 4. application.yml — Configuration

Create `src/main/resources/application.yml`:

```yaml
# ================================================================
# GlobalPay Auth Service Configuration
# ================================================================
# Maps to: MICROSERVICES_ARCHITECTURE.md §3.1 (Auth Service, Port 8081)
# React equivalent: vite.config.ts + .env files
# ================================================================

server:
  port: 8081
  servlet:
    context-path: /

# ==================== Database ====================
spring:
  application:
    name: auth-service

  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:globalpay_auth}
    username: ${DB_USERNAME:postgres}
    password: ${DB_PASSWORD:postgres}
    driver-class-name: org.postgresql.Driver
    # Connection pool (HikariCP — default)
    hikari:
      minimum-idle: 5
      maximum-pool-size: 20
      idle-timeout: 30000
      max-lifetime: 600000
      connection-timeout: 20000

  # ==================== JPA / Hibernate ====================
  jpa:
    hibernate:
      ddl-auto: validate          # Flyway manages schema — NEVER use "create" or "update" in prod
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        jdbc:
          batch_size: 50          # Batch INSERT/UPDATE for performance
        order_inserts: true
        order_updates: true
        format_sql: true
    show-sql: false               # Set to true for debugging SQL queries
    open-in-view: false           # Disable OSIV anti-pattern

  # ==================== Flyway Migrations ====================
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true

# ==================== JWT Configuration ====================
jwt:
  # CRITICAL: Change this in production! Must be at least 256 bits (32+ chars)
  secret: ${JWT_SECRET:globalpay-dev-secret-key-change-this-in-production-immediately-please}
  access-token-expiry-ms: 900000         # 15 minutes
  refresh-token-expiry-ms: 604800000     # 7 days

# ==================== Security ====================
app:
  security:
    max-pin-attempts: 5             # Lock account after N failed PINs
    lockout-duration-minutes: 30    # Account lockout duration
    otp-validity-seconds: 300       # OTP expires after 5 minutes
    otp-max-attempts: 3             # Max OTP verification attempts

  cors:
    allowed-origins:
      - http://localhost:5173                        # Vite dev server
      - http://localhost:8080                         # Preview
      - https://tesfapay-global-vision.lovable.app   # Production

# ==================== Actuator ====================
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
  endpoint:
    health:
      show-details: when-authorized

# ==================== Logging ====================
logging:
  level:
    com.globalpay: DEBUG
    org.springframework.security: DEBUG    # Remove in production
    org.hibernate.SQL: DEBUG               # Remove in production
    org.hibernate.type.descriptor.sql: TRACE  # Shows bind parameters
  pattern:
    console: "%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n"

# ==================== OpenAPI / Swagger ====================
springdoc:
  api-docs:
    path: /v3/api-docs
  swagger-ui:
    path: /swagger-ui.html
    tags-sorter: alpha
    operations-sorter: method
```

### Create `src/main/resources/application-dev.yml` (development overrides):

```yaml
# Dev profile — verbose logging, show SQL
spring:
  jpa:
    show-sql: true
  flyway:
    clean-disabled: false       # Allow flyway:clean in dev

logging:
  level:
    com.globalpay: TRACE
```

### Create `.env.example` (at project root):

```env
# Copy this to .env and fill in values
DB_HOST=localhost
DB_PORT=5432
DB_NAME=globalpay_auth
DB_USERNAME=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-256-bit-secret-key-at-least-32-characters-long
```

---

## 5. JPA Entities

### 5.1 Enums

Create these enum files in `com.globalpay.auth.enums`:

**`AppRole.java`**
```java
package com.globalpay.auth.enums;

public enum AppRole {
    USER,    // Regular wallet user
    AGENT,   // Cash-in/cash-out agent
    ADMIN    // System administrator
}
```

**`UserStatus.java`**
```java
package com.globalpay.auth.enums;

public enum UserStatus {
    ACTIVE,       // Normal active account
    SUSPENDED,    // Temporarily suspended by admin
    BLOCKED,      // Permanently blocked
    PENDING_KYC   // Awaiting KYC verification
}
```

**`DocumentType.java`**
```java
package com.globalpay.auth.enums;

public enum DocumentType {
    FAYDA_ID,         // Ethiopian national digital ID
    PASSPORT,
    DRIVING_LICENSE,
    KEBELE_ID          // Local government ID
}
```

**`KycStatus.java`**
```java
package com.globalpay.auth.enums;

public enum KycStatus {
    PENDING,      // Submitted, awaiting review
    PROCESSING,   // AI verification in progress
    APPROVED,     // Approved — user upgraded to KYC Level 2
    REJECTED      // Rejected — user stays at KYC Level 1
}
```

### 5.2 User Entity

Create `com.globalpay.auth.entity.User`:

```java
package com.globalpay.auth.entity;

import com.globalpay.auth.enums.UserStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * User entity — primary user account.
 *
 * Database table: users (see DATABASE_SCHEMA.md §2)
 * API endpoints:  POST /v1/auth/register, POST /v1/auth/login, GET /v1/users/me
 * Front-end:      LoginPage.tsx, Onboarding.tsx, UserProfile.tsx
 *
 * Key business rules:
 * - Phone number is unique and serves as the login identifier
 * - PIN is BCrypt-hashed (12 rounds) — NEVER store plain text
 * - Account locks after 5 failed PIN attempts for 30 minutes
 * - Wallet ID format: TPY-{YEAR}-{NAME}{SEQ} (e.g., TPY-2024-ABEBE001)
 * - KYC Level 1 = default (ETB 25,000/day), Level 2 = upgraded (ETB 50,000/day)
 */
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_users_phone", columnList = "phone"),
    @Index(name = "idx_users_wallet_id", columnList = "wallet_id"),
    @Index(name = "idx_users_status", columnList = "status")
})
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 20)
    private String phone;                              // +251911234567

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(name = "pin_hash", nullable = false)
    private String pinHash;                            // BCrypt hash of 6-digit MPIN

    @Column(name = "wallet_id", nullable = false, unique = true, length = 30)
    private String walletId;                           // TPY-2024-ABEBE001

    @Column(name = "kyc_level", nullable = false)
    @Builder.Default
    private Short kycLevel = 1;                        // 1 = basic, 2 = upgraded

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "biometric_token")
    private String biometricToken;

    @Column(name = "daily_limit", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal dailyLimit = new BigDecimal("25000.00");

    @Column(name = "monthly_limit", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal monthlyLimit = new BigDecimal("100000.00");

    @Column(name = "notifications_enabled")
    @Builder.Default
    private Boolean notificationsEnabled = true;

    @Column(name = "failed_pin_attempts")
    @Builder.Default
    private Short failedPinAttempts = 0;

    @Column(name = "locked_until")
    private Instant lockedUntil;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    // --- Lifecycle callbacks ---

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // --- Convenience methods ---

    public String getFullName() {
        return firstName + " " + lastName;
    }

    public boolean isLocked() {
        return lockedUntil != null && lockedUntil.isAfter(Instant.now());
    }
}
```

### 5.3 UserRole Entity

```java
package com.globalpay.auth.entity;

import com.globalpay.auth.enums.AppRole;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * User role — RBAC stored SEPARATELY from users to prevent privilege escalation.
 *
 * Database table: user_roles (see DATABASE_SCHEMA.md §2)
 * Security note:  Roles are NEVER stored on the users table directly.
 *                 Always query this table via UserRoleRepository.hasRole().
 */
@Entity
@Table(name = "user_roles",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "role"}))
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserRole {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppRole role;
}
```

### 5.4 UserSession Entity

```java
package com.globalpay.auth.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * User session — JWT refresh token management.
 * Each login creates a new session; logout deletes it.
 *
 * Database table: user_sessions (see DATABASE_SCHEMA.md §2)
 * API: POST /v1/auth/refresh, POST /v1/auth/logout
 */
@Entity
@Table(name = "user_sessions", indexes = {
    @Index(name = "idx_sessions_user", columnList = "user_id"),
    @Index(name = "idx_sessions_token", columnList = "refresh_token")
})
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "refresh_token", nullable = false, unique = true, length = 512)
    private String refreshToken;

    @Column(name = "device_info")
    private String deviceInfo;

    @Column(name = "ip_address", columnDefinition = "inet")
    private String ipAddress;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    public boolean isExpired() {
        return expiresAt.isBefore(Instant.now());
    }
}
```

### 5.5 OtpVerification Entity

```java
package com.globalpay.auth.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * OTP verification — phone verification, PIN reset, cash operations.
 *
 * Database table: otp_verifications (see DATABASE_SCHEMA.md §4)
 * API: POST /v1/auth/verify-otp
 *
 * Business rules:
 * - OTP is 6 digits, hashed before storage
 * - Valid for 5 minutes (configurable via app.security.otp-validity-seconds)
 * - Max 3 attempts before OTP is invalidated
 */
@Entity
@Table(name = "otp_verifications", indexes = {
    @Index(name = "idx_otp_user", columnList = "user_id"),
    @Index(name = "idx_otp_phone_purpose", columnList = "phone, purpose")
})
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OtpVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(nullable = false, length = 10)
    private String code;                      // BCrypt-hashed OTP

    @Column(nullable = false, length = 30)
    private String purpose;                   // REGISTRATION | CASH_IN | CASH_OUT | PIN_RESET

    @Builder.Default
    private Short attempts = 0;

    @Column(name = "max_attempts")
    @Builder.Default
    private Short maxAttempts = 3;

    @Builder.Default
    private Boolean verified = false;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    public boolean isExpired() {
        return expiresAt.isBefore(Instant.now());
    }

    public boolean hasAttemptsRemaining() {
        return attempts < maxAttempts;
    }
}
```

### 5.6 KycApplication Entity

```java
package com.globalpay.auth.entity;

import com.globalpay.auth.enums.DocumentType;
import com.globalpay.auth.enums.KycStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * KYC Level 2 upgrade application.
 *
 * Database table: kyc_applications (see DATABASE_SCHEMA.md §5)
 * API: POST /v1/users/me/kyc/upgrade, GET /v1/users/me/kyc/status
 * Front-end: KYCUpgrade.tsx (user), AdminKYC.tsx (admin review)
 */
@Entity
@Table(name = "kyc_applications", indexes = {
    @Index(name = "idx_kyc_user", columnList = "user_id"),
    @Index(name = "idx_kyc_status", columnList = "status")
})
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KycApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = 20)
    private DocumentType documentType;

    @Column(name = "document_front_url", nullable = false)
    private String documentFrontUrl;

    @Column(name = "document_back_url")
    private String documentBackUrl;

    @Column(name = "selfie_url", nullable = false)
    private String selfieUrl;

    @Column(name = "liveness_token")
    private String livenessToken;

    @Column(name = "ai_verification_score")
    private Integer aiVerificationScore;             // 0-100

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private KycStatus status = KycStatus.PENDING;

    @Column(name = "reviewer_admin_id")
    private UUID reviewerAdminId;

    @Column(name = "review_note")
    private String reviewNote;

    @Column(name = "submitted_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant submittedAt = Instant.now();

    @Column(name = "reviewed_at")
    private Instant reviewedAt;
}
```

---

## 6. Repositories

### `UserRepository.java`

```java
package com.globalpay.auth.repository;

import com.globalpay.auth.entity.User;
import com.globalpay.auth.enums.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    // Login lookup
    Optional<User> findByPhone(String phone);

    // Wallet lookup (used by transfer-service via Feign)
    Optional<User> findByWalletId(String walletId);

    // Registration uniqueness check
    boolean existsByPhone(String phone);

    // Admin user search (API_CONTRACT.md §15 — GET /admin/users)
    @Query("SELECT u FROM User u WHERE " +
           "(:search IS NULL OR LOWER(u.firstName) LIKE LOWER(CONCAT('%',:search,'%')) " +
           " OR LOWER(u.lastName) LIKE LOWER(CONCAT('%',:search,'%')) " +
           " OR u.phone LIKE CONCAT('%',:search,'%')) " +
           "AND (:kycLevel IS NULL OR u.kycLevel = :kycLevel) " +
           "AND (:status IS NULL OR u.status = :status)")
    Page<User> searchUsers(String search, Short kycLevel, UserStatus status, Pageable pageable);
}
```

### `UserRoleRepository.java`

```java
package com.globalpay.auth.repository;

import com.globalpay.auth.entity.UserRole;
import com.globalpay.auth.enums.AppRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, UUID> {

    List<UserRole> findByUserId(UUID userId);

    /**
     * Security-critical: Check if user has a specific role.
     * Equivalent to the has_role() PostgreSQL function in DATABASE_SCHEMA.md.
     */
    @Query("SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END " +
           "FROM UserRole r WHERE r.userId = :userId AND r.role = :role")
    boolean hasRole(UUID userId, AppRole role);
}
```

### `UserSessionRepository.java`

```java
package com.globalpay.auth.repository;

import com.globalpay.auth.entity.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, UUID> {

    Optional<UserSession> findByRefreshToken(String refreshToken);

    @Modifying
    @Transactional
    void deleteByRefreshToken(String refreshToken);

    @Modifying
    @Transactional
    void deleteByUserId(UUID userId);
}
```

### `OtpVerificationRepository.java`

```java
package com.globalpay.auth.repository;

import com.globalpay.auth.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OtpVerificationRepository extends JpaRepository<OtpVerification, UUID> {

    /**
     * Find the latest unverified OTP for a phone + purpose combination.
     * Used to validate OTP during registration, cash operations, PIN reset.
     */
    Optional<OtpVerification> findTopByPhoneAndPurposeAndVerifiedFalseOrderByCreatedAtDesc(
            String phone, String purpose);
}
```

---

## 7. DTOs — Request & Response

### Request DTOs

**`RegisterRequest.java`** — Maps to `API_CONTRACT.md §1 — POST /auth/register`

```java
package com.globalpay.auth.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\+251\\d{9}$",
             message = "Phone must be Ethiopian format: +251XXXXXXXXX")
    private String phone;

    @NotBlank(message = "First name is required")
    @Size(min = 2, max = 100, message = "First name must be 2-100 characters")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(min = 2, max = 100, message = "Last name must be 2-100 characters")
    private String lastName;

    @NotBlank(message = "PIN is required")
    @Pattern(regexp = "^\\d{6}$", message = "PIN must be exactly 6 digits")
    private String pin;
}
```

**`LoginRequest.java`** — Maps to `API_CONTRACT.md §1 — POST /auth/login`

```java
package com.globalpay.auth.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\+251\\d{9}$", message = "Invalid phone format")
    private String phone;

    @NotBlank(message = "PIN is required")
    @Pattern(regexp = "^\\d{6}$", message = "PIN must be 6 digits")
    private String pin;
}
```

**`VerifyOtpRequest.java`**
```java
package com.globalpay.auth.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class VerifyOtpRequest {
    @NotBlank private String phone;
    @NotBlank @Size(min = 6, max = 6) private String otp;
}
```

**`RefreshTokenRequest.java`**
```java
package com.globalpay.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RefreshTokenRequest {
    @NotBlank private String refreshToken;
}
```

**`BiometricLoginRequest.java`**
```java
package com.globalpay.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BiometricLoginRequest {
    @NotBlank private String userId;
    @NotBlank private String biometricToken;
}
```

### Response DTOs

**`RegisterResponse.java`**
```java
package com.globalpay.auth.dto.response;

import lombok.*;

@Data @Builder @AllArgsConstructor
public class RegisterResponse {
    private String userId;
    private String walletId;
    private String status;       // "PENDING_KYC"
    private boolean otpSent;
}
```

**`LoginResponse.java`**
```java
package com.globalpay.auth.dto.response;

import lombok.*;

@Data @Builder @AllArgsConstructor
public class LoginResponse {
    private String accessToken;
    private String refreshToken;
    private UserSummary user;

    @Data @Builder @AllArgsConstructor
    public static class UserSummary {
        private String id;
        private String name;
        private String walletId;
        private int kycLevel;
    }
}
```

**`UserProfileResponse.java`** — Maps to `API_CONTRACT.md §2 — GET /users/me`
```java
package com.globalpay.auth.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Data @Builder @AllArgsConstructor
public class UserProfileResponse {
    private String id;
    private String firstName;
    private String lastName;
    private String phone;
    private String walletId;
    private int kycLevel;
    private String loyaltyTier;
    private int loyaltyPoints;
    private int totalTransactions;
    private BigDecimal monthlyVolume;
    private String avatarUrl;
    private Instant createdAt;
}
```

**`OtpResponse.java`**
```java
package com.globalpay.auth.dto.response;

import lombok.*;

@Data @Builder @AllArgsConstructor
public class OtpResponse {
    private boolean verified;
    private String accessToken;
    private String refreshToken;
}
```

---

## 8. Service Layer

### `AuthService.java` — Complete Implementation

```java
package com.globalpay.auth.service;

import com.globalpay.auth.dto.request.*;
import com.globalpay.auth.dto.response.*;
import com.globalpay.auth.entity.*;
import com.globalpay.auth.enums.*;
import com.globalpay.auth.exception.*;
import com.globalpay.auth.repository.*;
import com.globalpay.auth.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.Year;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

/**
 * Auth Service — core authentication and registration logic.
 *
 * Implements: API_CONTRACT.md §1 (Authentication & Registration)
 * Front-end:  LoginPage.tsx (login), Onboarding.tsx (register)
 *
 * This is the most security-critical service. Key protections:
 * 1. BCrypt PIN hashing (12 rounds)
 * 2. Account lockout after 5 failed attempts
 * 3. JWT token rotation on refresh
 * 4. OTP rate limiting
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final UserRoleRepository roleRepository;
    private final UserSessionRepository sessionRepository;
    private final OtpVerificationRepository otpRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.security.max-pin-attempts:5}")
    private int maxPinAttempts;

    @Value("${app.security.lockout-duration-minutes:30}")
    private int lockoutMinutes;

    @Value("${app.security.otp-validity-seconds:300}")
    private int otpValiditySeconds;

    // ==========================================
    // POST /v1/auth/register
    // Front-end: Onboarding.tsx → Step 3 "Create Account"
    // ==========================================

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        log.info("Registration attempt for phone: {}", maskPhone(request.getPhone()));

        // 1. Check if phone already registered
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new DuplicateResourceException("Phone number already registered");
        }

        // 2. Generate unique wallet ID
        String walletId = generateWalletId(request.getFirstName());

        // 3. Create user with hashed PIN
        User user = User.builder()
                .phone(request.getPhone())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .pinHash(passwordEncoder.encode(request.getPin()))
                .walletId(walletId)
                .kycLevel((short) 1)
                .status(UserStatus.PENDING_KYC)
                .build();
        user = userRepository.save(user);

        // 4. Assign default USER role (in separate table — security best practice)
        roleRepository.save(UserRole.builder()
                .userId(user.getId())
                .role(AppRole.USER)
                .build());

        // 5. Generate and send OTP for phone verification
        String otp = generateAndSaveOtp(user.getId(), request.getPhone(), "REGISTRATION");

        // TODO: Send OTP via SMS gateway (Africa's Talking, Twilio, etc.)
        log.info("Registration OTP for {} (DEV ONLY): {}", maskPhone(request.getPhone()), otp);

        return RegisterResponse.builder()
                .userId(user.getId().toString())
                .walletId(walletId)
                .status("PENDING_KYC")
                .otpSent(true)
                .build();
    }

    // ==========================================
    // POST /v1/auth/verify-otp
    // Front-end: Onboarding.tsx → OTP input screen
    // ==========================================

    @Transactional
    public OtpResponse verifyOtp(VerifyOtpRequest request) {
        OtpVerification otp = otpRepository
                .findTopByPhoneAndPurposeAndVerifiedFalseOrderByCreatedAtDesc(
                        request.getPhone(), "REGISTRATION")
                .orElseThrow(() -> new InvalidPinException("No pending OTP found"));

        // Check expiry
        if (otp.isExpired()) {
            throw new InvalidPinException("OTP has expired. Please request a new one.");
        }

        // Check attempts
        if (!otp.hasAttemptsRemaining()) {
            throw new AccountLockedException("Too many OTP attempts. Request a new code.");
        }

        // Verify OTP
        otp.setAttempts((short) (otp.getAttempts() + 1));
        if (!passwordEncoder.matches(request.getOtp(), otp.getCode())) {
            otpRepository.save(otp);
            throw new InvalidPinException("Invalid OTP. " +
                    (otp.getMaxAttempts() - otp.getAttempts()) + " attempts remaining.");
        }

        // Mark verified
        otp.setVerified(true);
        otpRepository.save(otp);

        // Activate user account
        User user = userRepository.findByPhone(request.getPhone())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);

        // Generate tokens
        String role = getPrimaryRole(user.getId());
        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId(), user.getWalletId(), role, user.getKycLevel());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId());

        saveSession(user.getId(), refreshToken);

        return OtpResponse.builder()
                .verified(true)
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    // ==========================================
    // POST /v1/auth/login
    // Front-end: LoginPage.tsx → 6-digit MPIN keypad
    // Auto-submits when user enters 6th digit
    // ==========================================

    @Transactional
    public LoginResponse login(LoginRequest request) {
        log.info("Login attempt for phone: {}", maskPhone(request.getPhone()));

        // 1. Find user by phone
        User user = userRepository.findByPhone(request.getPhone())
                .orElseThrow(() -> new InvalidPinException("Invalid phone or PIN"));

        // 2. Check if account is locked
        if (user.isLocked()) {
            throw new AccountLockedException(
                    "Account is locked. Try again after " + user.getLockedUntil());
        }

        // 3. Check account status
        if (user.getStatus() == UserStatus.BLOCKED) {
            throw new AccountLockedException("Account has been permanently blocked");
        }
        if (user.getStatus() == UserStatus.SUSPENDED) {
            throw new AccountLockedException("Account is suspended. Contact support.");
        }

        // 4. Verify PIN against BCrypt hash
        if (!passwordEncoder.matches(request.getPin(), user.getPinHash())) {
            handleFailedPinAttempt(user);
            throw new InvalidPinException("Invalid phone or PIN");
        }

        // 5. Success — reset counters, update login timestamp
        user.setFailedPinAttempts((short) 0);
        user.setLockedUntil(null);
        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        // 6. Get user's primary role
        String role = getPrimaryRole(user.getId());

        // 7. Generate JWT tokens
        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId(), user.getWalletId(), role, user.getKycLevel());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId());

        // 8. Save session
        saveSession(user.getId(), refreshToken);

        log.info("User {} logged in successfully (role: {})", user.getId(), role);

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(LoginResponse.UserSummary.builder()
                        .id(user.getId().toString())
                        .name(user.getFullName())
                        .walletId(user.getWalletId())
                        .kycLevel(user.getKycLevel())
                        .build())
                .build();
    }

    // ==========================================
    // POST /v1/auth/refresh
    // Called automatically when access token expires
    // ==========================================

    @Transactional
    public LoginResponse refreshToken(RefreshTokenRequest request) {
        UserSession session = sessionRepository.findByRefreshToken(request.getRefreshToken())
                .orElseThrow(() -> new InvalidPinException("Invalid refresh token"));

        if (session.isExpired()) {
            sessionRepository.delete(session);
            throw new InvalidPinException("Refresh token expired. Please login again.");
        }

        User user = userRepository.findById(session.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String role = getPrimaryRole(user.getId());

        // Rotate tokens (old refresh token is invalidated)
        String newAccessToken = jwtTokenProvider.generateAccessToken(
                user.getId(), user.getWalletId(), role, user.getKycLevel());
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(user.getId());

        session.setRefreshToken(newRefreshToken);
        session.setExpiresAt(Instant.now().plus(7, ChronoUnit.DAYS));
        sessionRepository.save(session);

        return LoginResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .user(LoginResponse.UserSummary.builder()
                        .id(user.getId().toString())
                        .name(user.getFullName())
                        .walletId(user.getWalletId())
                        .kycLevel(user.getKycLevel())
                        .build())
                .build();
    }

    // ==========================================
    // POST /v1/auth/logout
    // ==========================================

    @Transactional
    public void logout(String refreshToken) {
        sessionRepository.deleteByRefreshToken(refreshToken);
        log.info("User logged out, session invalidated");
    }

    // ==========================================
    // Private helpers
    // ==========================================

    private void handleFailedPinAttempt(User user) {
        short attempts = (short) (user.getFailedPinAttempts() + 1);
        user.setFailedPinAttempts(attempts);

        if (attempts >= maxPinAttempts) {
            user.setLockedUntil(Instant.now().plus(lockoutMinutes, ChronoUnit.MINUTES));
            log.warn("SECURITY: Account {} locked after {} failed PIN attempts",
                    user.getId(), attempts);
        }

        userRepository.save(user);
    }

    private String getPrimaryRole(UUID userId) {
        return roleRepository.findByUserId(userId)
                .stream()
                .findFirst()
                .map(r -> r.getRole().name())
                .orElse("USER");
    }

    private void saveSession(UUID userId, String refreshToken) {
        sessionRepository.save(UserSession.builder()
                .userId(userId)
                .refreshToken(refreshToken)
                .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .build());
    }

    private String generateWalletId(String firstName) {
        String prefix = firstName.toUpperCase()
                .substring(0, Math.min(5, firstName.length()))
                .replaceAll("[^A-Z]", "");
        String year = String.valueOf(Year.now().getValue());
        String seq = String.format("%03d", (int) (Math.random() * 999) + 1);
        return "TPY-" + year + "-" + prefix + seq;
    }

    private String generateAndSaveOtp(UUID userId, String phone, String purpose) {
        String otp = String.format("%06d", (int) (Math.random() * 999999));
        otpRepository.save(OtpVerification.builder()
                .userId(userId)
                .phone(phone)
                .code(passwordEncoder.encode(otp))
                .purpose(purpose)
                .expiresAt(Instant.now().plus(otpValiditySeconds, ChronoUnit.SECONDS))
                .build());
        return otp;
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 6) return "***";
        return phone.substring(0, 4) + "****" + phone.substring(phone.length() - 3);
    }
}
```

---

## 9. Controller — REST Endpoints

### `AuthController.java`

```java
package com.globalpay.auth.controller;

import com.globalpay.auth.dto.request.*;
import com.globalpay.auth.dto.response.*;
import com.globalpay.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication Controller — public endpoints (no JWT required).
 *
 * API Contract: API_CONTRACT.md §1
 * Front-end mapping:
 *   - POST /register  → Onboarding.tsx (Step 3 "Create Account" button)
 *   - POST /verify-otp → Onboarding.tsx (OTP input after registration)
 *   - POST /login     → LoginPage.tsx (6-digit MPIN keypad, auto-submits on 6th digit)
 *   - POST /login/biometric → LoginPage.tsx ("Use Biometrics Instead" link)
 *   - POST /refresh   → Called automatically when accessToken expires
 *   - POST /logout    → UserProfile.tsx ("Log Out" button)
 */
@RestController
@RequestMapping("/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Registration, login, OTP, and token management")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register new user",
               description = "Creates user account, assigns wallet ID, sends OTP")
    public ResponseEntity<RegisterResponse> register(
            @Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(authService.register(request));
    }

    @PostMapping("/verify-otp")
    @Operation(summary = "Verify phone OTP",
               description = "Verifies 6-digit OTP sent during registration")
    public ResponseEntity<OtpResponse> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request) {
        return ResponseEntity.ok(authService.verifyOtp(request));
    }

    @PostMapping("/login")
    @Operation(summary = "Login with MPIN",
               description = "Authenticates user with phone + 6-digit PIN")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/login/biometric")
    @Operation(summary = "Biometric login",
               description = "Authenticates using device-signed biometric token")
    public ResponseEntity<LoginResponse> biometricLogin(
            @Valid @RequestBody BiometricLoginRequest request) {
        // TODO: Implement biometric token validation
        return ResponseEntity.ok().build();
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh JWT tokens",
               description = "Exchanges refresh token for new access + refresh tokens")
    public ResponseEntity<LoginResponse> refresh(
            @Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refreshToken(request));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout",
               description = "Invalidates refresh token, ending the session")
    public ResponseEntity<Void> logout(
            @RequestBody RefreshTokenRequest request) {
        authService.logout(request.getRefreshToken());
        return ResponseEntity.noContent().build();
    }
}
```

### `UserController.java`

```java
package com.globalpay.auth.controller;

import com.globalpay.auth.dto.response.UserProfileResponse;
import com.globalpay.auth.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * User Profile & KYC Controller — requires valid JWT.
 *
 * API Contract: API_CONTRACT.md §2
 * Front-end mapping:
 *   - GET  /users/me           → UserProfile.tsx (profile screen)
 *   - PUT  /users/me           → UserProfile.tsx (edit profile)
 *   - POST /users/me/kyc/upgrade → KYCUpgrade.tsx (document upload)
 *   - GET  /users/me/kyc/status  → KYCUpgrade.tsx (status check)
 */
@RestController
@RequestMapping("/v1/users")
@RequiredArgsConstructor
@Tag(name = "User Profile", description = "User profile and KYC management")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<UserProfileResponse> getProfile(
            @AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(userService.getProfile(userId));
    }

    @PutMapping("/me")
    @Operation(summary = "Update profile")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @AuthenticationPrincipal UUID userId,
            @RequestBody Object request) {
        // TODO: Implement profile update
        return ResponseEntity.ok().build();
    }

    @PostMapping("/me/kyc/upgrade")
    @Operation(summary = "Submit KYC Level 2 application")
    public ResponseEntity<?> submitKycUpgrade(
            @AuthenticationPrincipal UUID userId) {
        // TODO: Implement multipart file upload for KYC documents
        return ResponseEntity.accepted().build();
    }

    @GetMapping("/me/kyc/status")
    @Operation(summary = "Check KYC upgrade status")
    public ResponseEntity<?> getKycStatus(
            @AuthenticationPrincipal UUID userId) {
        // TODO: Implement KYC status check
        return ResponseEntity.ok().build();
    }
}
```

---

## 10. Security Configuration

```java
package com.globalpay.auth.config;

import com.globalpay.auth.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Spring Security configuration.
 *
 * Key decisions:
 * - Stateless sessions (JWT-based, no server-side session)
 * - CSRF disabled (not needed for stateless APIs)
 * - CORS configured for React frontend origins
 * - BCrypt(12) for PIN hashing
 * - /v1/auth/** endpoints are PUBLIC
 * - All other endpoints require valid JWT
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity  // Enables @PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Value("${app.cors.allowed-origins}")
    private List<String> allowedOrigins;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfig()))
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public — no authentication required
                        .requestMatchers("/v1/auth/**").permitAll()
                        .requestMatchers("/actuator/health").permitAll()
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        // Protected — valid JWT required
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public CorsConfigurationSource corsConfig() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(allowedOrigins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
```

---

## 11. JWT Token Provider

```java
package com.globalpay.auth.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

/**
 * JWT token generation and validation.
 *
 * Access token claims: { sub: userId, walletId, role, kycLevel }
 * Access token lifetime: 15 minutes
 * Refresh token lifetime: 7 days
 *
 * IMPORTANT: In production, use RS256 (asymmetric keys) instead of HS256,
 * so downstream services can verify tokens without sharing the secret.
 */
@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.access-token-expiry-ms}")
    private long accessTokenExpiry;

    @Value("${jwt.refresh-token-expiry-ms}")
    private long refreshTokenExpiry;

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(UUID userId, String walletId, String role, int kycLevel) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userId.toString())
                .claims(Map.of(
                        "walletId", walletId,
                        "role", role,
                        "kycLevel", kycLevel
                ))
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(accessTokenExpiry)))
                .signWith(getKey())
                .compact();
    }

    public String generateRefreshToken(UUID userId) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userId.toString())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(refreshTokenExpiry)))
                .signWith(getKey())
                .compact();
    }

    public Claims validateToken(String token) {
        return Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public UUID getUserId(String token) {
        return UUID.fromString(validateToken(token).getSubject());
    }

    public String getRole(String token) {
        return validateToken(token).get("role", String.class);
    }
}
```

### `JwtAuthFilter.java`

```java
package com.globalpay.auth.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

/**
 * JWT authentication filter — runs on every request.
 *
 * Extracts Bearer token from Authorization header,
 * validates it, and sets Spring Security context with:
 * - Principal: UUID userId
 * - Authorities: ROLE_{role} (e.g., ROLE_USER, ROLE_ADMIN)
 *
 * Use @AuthenticationPrincipal UUID userId in controllers
 * to access the authenticated user's ID.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwt;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String token = extractToken(request);

        if (token != null) {
            try {
                var claims = jwt.validateToken(token);
                UUID userId = UUID.fromString(claims.getSubject());
                String role = claims.get("role", String.class);

                var auth = new UsernamePasswordAuthenticationToken(
                        userId, null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + role)));
                auth.setDetails(claims);
                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (Exception e) {
                SecurityContextHolder.clearContext();
            }
        }

        chain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        return (StringUtils.hasText(header) && header.startsWith("Bearer "))
                ? header.substring(7) : null;
    }
}
```

---

## 12. Exception Handling

### Custom Exceptions

```java
// com.globalpay.auth.exception.InvalidPinException
package com.globalpay.auth.exception;
public class InvalidPinException extends RuntimeException {
    public InvalidPinException(String msg) { super(msg); }
}

// com.globalpay.auth.exception.AccountLockedException
package com.globalpay.auth.exception;
public class AccountLockedException extends RuntimeException {
    public AccountLockedException(String msg) { super(msg); }
}

// com.globalpay.auth.exception.ResourceNotFoundException
package com.globalpay.auth.exception;
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String msg) { super(msg); }
}

// com.globalpay.auth.exception.DuplicateResourceException
package com.globalpay.auth.exception;
public class DuplicateResourceException extends RuntimeException {
    public DuplicateResourceException(String msg) { super(msg); }
}
```

### Global Exception Handler

```java
package com.globalpay.auth.exception;

import lombok.*;
import org.springframework.http.*;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

/**
 * Maps to: API_CONTRACT.md §17 (Error Handling)
 *
 * Converts all exceptions to the standard GlobalPay error format:
 * { timestamp, status, error, code, message, path }
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(InvalidPinException.class)
    public ResponseEntity<ErrorResponse> handleInvalidPin(InvalidPinException ex) {
        return error(HttpStatus.UNAUTHORIZED, "INVALID_PIN", ex.getMessage());
    }

    @ExceptionHandler(AccountLockedException.class)
    public ResponseEntity<ErrorResponse> handleLocked(AccountLockedException ex) {
        return error(HttpStatus.FORBIDDEN, "ACCOUNT_LOCKED", ex.getMessage());
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        return error(HttpStatus.NOT_FOUND, "NOT_FOUND", ex.getMessage());
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorResponse> handleDuplicate(DuplicateResourceException ex) {
        return error(HttpStatus.CONFLICT, "DUPLICATE", ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(e -> errors.put(e.getField(), e.getDefaultMessage()));
        ErrorResponse body = new ErrorResponse(
                Instant.now(), 400, "Bad Request", "VALIDATION_ERROR",
                "Validation failed: " + errors, null);
        return ResponseEntity.badRequest().body(body);
    }

    private ResponseEntity<ErrorResponse> error(HttpStatus status, String code, String message) {
        return ResponseEntity.status(status).body(
                new ErrorResponse(Instant.now(), status.value(),
                        status.getReasonPhrase(), code, message, null));
    }

    @Data @AllArgsConstructor
    public static class ErrorResponse {
        private Instant timestamp;
        private int status;
        private String error;
        private String code;
        private String message;
        private String path;
    }
}
```

---

## 13. Flyway Database Migration

Create `src/main/resources/db/migration/V1__create_users_and_roles.sql`:

```sql
-- See backend-templates/infrastructure/flyway/V1__create_users_and_roles.sql
-- for the complete migration. Copy it here.
```

> **Tip:** Copy the SQL directly from `backend-templates/infrastructure/flyway/V1__create_users_and_roles.sql` which already has all tables, constraints, and indexes for the auth-service.

---

## 14. Run & Test

### Step 1: Create the database

```bash
createdb globalpay_auth
```

### Step 2: Run the application

```bash
# From the auth-service root directory
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# Or build and run JAR
mvn clean package -DskipTests
java -jar target/auth-service-1.0.0.jar
```

### Step 3: Verify it's running

```bash
# Health check
curl http://localhost:8081/actuator/health
# → {"status":"UP"}

# Swagger UI
open http://localhost:8081/swagger-ui.html
```

### Step 4: Test registration

```bash
curl -X POST http://localhost:8081/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+251911234567",
    "firstName": "Abebe",
    "lastName": "Girma",
    "pin": "123456"
  }'

# Expected response (201):
# {
#   "userId": "uuid",
#   "walletId": "TPY-2026-ABEBE001",
#   "status": "PENDING_KYC",
#   "otpSent": true
# }
```

### Step 5: Test login

```bash
curl -X POST http://localhost:8081/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+251911234567",
    "pin": "123456"
  }'

# Expected response (200):
# {
#   "accessToken": "eyJ...",
#   "refreshToken": "eyJ...",
#   "user": {
#     "id": "uuid",
#     "name": "Abebe Girma",
#     "walletId": "TPY-2026-ABEBE001",
#     "kycLevel": 1
#   }
# }
```

### Step 6: Test authenticated endpoint

```bash
# Use the accessToken from login
curl http://localhost:8081/v1/users/me \
  -H "Authorization: Bearer eyJ..."

# Expected response (200): User profile JSON
```

---

## 15. Postman Verification

Import `POSTMAN_COLLECTION.json` from the project root. It contains 55 pre-configured requests organized by service. For the Auth Service, test these requests:

| # | Request | Expected |
|---|---|---|
| 1 | `POST /v1/auth/register` | 201 + userId, walletId |
| 2 | `POST /v1/auth/verify-otp` | 200 + tokens |
| 3 | `POST /v1/auth/login` | 200 + accessToken, refreshToken, user |
| 4 | `POST /v1/auth/login` (wrong PIN) | 401 + INVALID_PIN |
| 5 | `POST /v1/auth/login` (5x wrong) | 403 + ACCOUNT_LOCKED |
| 6 | `POST /v1/auth/refresh` | 200 + new tokens |
| 7 | `POST /v1/auth/logout` | 204 |
| 8 | `GET /v1/users/me` (with JWT) | 200 + profile |
| 9 | `GET /v1/users/me` (no JWT) | 401 |

---

## 16. Next Steps — Scaffold Remaining Services

Once the Auth Service is working, scaffold additional services using the same pattern. For each service:

### Quick scaffold checklist:

1. **Spring Initializr** → generate project with same base dependencies
2. **Copy** shared code: `SecurityConfig`, `JwtAuthFilter`, `JwtTokenProvider`, `GlobalExceptionHandler`
3. **Create entities** from `DATABASE_SCHEMA.md` (relevant tables only)
4. **Create controllers** from `API_CONTRACT.md` (relevant endpoints)
5. **Create Flyway migration** from `backend-templates/infrastructure/flyway/`
6. **Update `application.yml`** with correct port and database name

### Service → Port → Database mapping:

| Service | Port | Database | Key Entity | API Prefix |
|---|---|---|---|---|
| auth-service | 8081 | globalpay_auth | User, UserRole | `/v1/auth/*`, `/v1/users/*` |
| wallet-service | 8082 | globalpay_wallet | Wallet | `/v1/wallet/*` |
| transfer-service | 8083 | globalpay_transfer | Transaction | `/v1/transfers/*`, `/v1/transactions/*` |
| payment-service | 8084 | globalpay_payment | Biller, Merchant | `/v1/billers/*`, `/v1/merchants/*` |
| savings-service | 8085 | globalpay_savings | SavingsGoal | `/v1/savings/*` |
| loan-service | 8086 | globalpay_loan | Loan, CreditScore | `/v1/loans/*` |
| loyalty-service | 8087 | globalpay_loyalty | LoyaltyAccount | `/v1/loyalty/*` |
| agent-service | 8088 | globalpay_agent | Agent | `/v1/agent/*`, `/v1/cash/*` |
| notification-service | 8089 | globalpay_notification | Notification | `/v1/notifications/*` |
| admin-service | 8090 | globalpay_admin | (aggregates) | `/v1/admin/*` |

### Adding inter-service communication:

When services need to call each other (e.g., transfer-service → wallet-service):

```xml
<!-- Add to pom.xml -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-openfeign</artifactId>
</dependency>
```

```java
// Create Feign client interface
@FeignClient(name = "wallet-service")
public interface WalletServiceClient {

    @PostMapping("/v1/wallet/internal/debit")
    BigDecimal debit(@RequestParam UUID userId, @RequestParam BigDecimal amount);

    @PostMapping("/v1/wallet/internal/credit")
    BigDecimal credit(@RequestParam UUID userId, @RequestParam BigDecimal amount);
}
```

### Adding Kafka events:

```xml
<!-- Add to pom.xml -->
<dependency>
    <groupId>org.springframework.kafka</groupId>
    <artifactId>spring-kafka</artifactId>
</dependency>
```

```java
// Producer (in transfer-service)
kafkaTemplate.send("transfer.completed", new TransferEvent(transactionId, amount));

// Consumer (in loyalty-service)
@KafkaListener(topics = "transfer.completed", groupId = "loyalty-service")
public void onTransferCompleted(TransferEvent event) {
    loyaltyService.awardPoints(event.getUserId(), event.getAmount());
}
```

---

## Related Documentation

| Document | Contents |
|---|---|
| `API_CONTRACT.md` | Complete endpoint specs with request/response JSON for all 50+ endpoints |
| `DATABASE_SCHEMA.md` | 31-table PostgreSQL schema with JPA entity samples and Flyway migrations |
| `MICROSERVICES_ARCHITECTURE.md` | Service boundaries, Kafka topics, Saga patterns, deployment topology |
| `DEVELOPER_GUIDE.md` | React-to-Spring concept mapping for Java developers |
| `POSTMAN_COLLECTION.json` | 55 pre-configured API test requests |
| `backend-templates/` | Copy-paste ready Java source files for all 11 microservices |

---

*Generated for the GlobalPay development team. This guide gets the Auth Service from zero to running in ~30 minutes.*
