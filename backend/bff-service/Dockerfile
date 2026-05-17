FROM eclipse-temurin:21-jdk AS build
WORKDIR /build
COPY . .
RUN ./mvnw -pl bff-service -am package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /build/bff-service/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
