FROM eclipse-temurin:21-jdk AS build
WORKDIR /build
COPY . .
RUN ./mvnw -pl ltt-core -am package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /build/ltt-core/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
