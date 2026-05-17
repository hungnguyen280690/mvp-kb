FROM eclipse-temurin:21-jdk AS build
WORKDIR /build
COPY . .
RUN ./mvnw -pl audit-service -am package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /build/audit-service/target/*.jar app.jar
EXPOSE 8083
ENTRYPOINT ["java", "-jar", "app.jar"]
