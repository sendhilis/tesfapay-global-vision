# ── Build Stage ────────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Cache dependencies first
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Build the app
COPY src ./src
RUN mvn clean package -DskipTests -q

# ── Runtime Stage ───────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Security: non-root user
RUN addgroup -S globalpay && adduser -S globalpay -G globalpay
USER globalpay

# Copy jar
COPY --from=build /app/target/gp-auth-service-1.0.0.jar app.jar

# JVM tuning for containers
ENV JAVA_OPTS="-XX:+UseContainerSupport \
               -XX:MaxRAMPercentage=75.0 \
               -XX:+UseG1GC \
               -Djava.security.egd=file:/dev/./urandom"

EXPOSE 8081

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:8081/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
