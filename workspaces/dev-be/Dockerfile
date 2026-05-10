# Multi-stage build cho tất cả Spring Boot services
# Usage: docker build --build-arg SERVICE=bff -t vdbas-bff .
#        docker build --build-arg SERVICE=ltt-service -t vdbas-ltt .
#        docker build --build-arg SERVICE=gateway-service -t vdbas-gateway .
#        docker build --build-arg SERVICE=audit-service -t vdbas-audit .

# ---- Stage 1: Build ----
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /build

# Copy Maven wrapper + POM trước (cache dependencies)
COPY services/pom.xml ./
COPY services/bff/pom.xml ./bff/pom.xml
COPY services/ltt-service/pom.xml ./ltt-service/pom.xml
COPY services/gateway-service/pom.xml ./gateway-service/pom.xml
COPY services/audit-service/pom.xml ./audit-service/pom.xml

# Download dependencies (cached layer)
RUN apk add --no-cache maven && \
    mvn dependency:go-offline -B 2>/dev/null || true

# Copy source code
COPY services/ ./

# Build chỉ service được chỉ định
ARG SERVICE
RUN mvn package -pl ${SERVICE} -am -DskipTests -B

# ---- Stage 2: Runtime ----
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

ARG SERVICE
COPY --from=builder /build/${SERVICE}/target/*.jar app.jar

# Non-root user
RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
