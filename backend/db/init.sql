-- ============================================================
-- MVP Kho Bạc — Initial Schema (Skeleton)
-- Oracle Free 23c / 19c compatible
-- ============================================================

-- Create application user (run as SYSTEM)
-- ALTER SESSION SET "_ORACLE_SCRIPT" = TRUE;
-- CREATE USER KB IDENTIFIED BY KB DEFAULT TABLESPACE USERS QUOTA UNLIMITED ON USERS;
-- GRANT CONNECT, RESOURCE TO KB;

-- Tables will be created per-feature via Flyway/Liquibase migrations.
-- This file serves as the Docker entrypoint init script.
-- Each feature (FT-XXX) ships its own 03-schema.sql.

-- Placeholder: verify connection
SELECT 'MVP Kho Bac DB initialized' AS status FROM DUAL;
