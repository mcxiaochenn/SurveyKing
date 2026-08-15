# syntax=docker/dockerfile:1

FROM maven:3.9-eclipse-temurin-8 AS build

WORKDIR /workspace/server
COPY server/ ./
RUN mvn -B -ntp -Ppro -DskipTests package

FROM eclipse-temurin:8-jre

WORKDIR /app
COPY --from=build /workspace/server/api/target/surveyking-*.jar /app/surveyking.jar

EXPOSE 1991

ENTRYPOINT ["sh", "-c", "exec java ${JAVA_OPTS} -jar /app/surveyking.jar"]
