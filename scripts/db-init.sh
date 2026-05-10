#!/bin/bash
set -e
echo "=== VDBAS DB Init ==="

# Wait for Oracle PDB to be fully ready
echo "Waiting for Oracle database to be ready..."
for i in {1..50}; do
  # The `sqlplus` command will exit with a non-zero status if it fails to connect or execute.
  # We suppress stdout and stderr to keep the log clean during checks.
  if echo "SELECT 1 FROM DUAL;" | sqlplus -S -L sys/changeme@oracle:1521/FREEPDB1 as sysdba > /dev/null 2>&1; then
    echo "Oracle is ready to accept connections."
    break
  fi
  echo "Oracle not ready yet (attempt $i/50). Retrying in 6 seconds..."
  sleep 6
  if [ $i -eq 50 ]; then
    echo "Oracle DB did not become ready in time. Exiting."
    exit 1
  fi
done

# Create users and tablespace (ignore errors if already exists)
sqlplus -S sys/changeme@oracle:1521/FREEPDB1 as sysdba <<'EOSQL'
ALTER SESSION SET CONTAINER = FREEPDB1;
BEGIN
  EXECUTE IMMEDIATE 'CREATE TABLESPACE users DATAFILE ''/opt/oracle/oradata/FREE/FREEPDB1/users01.dbf'' SIZE 100M AUTOEXTEND ON NEXT 10M MAXSIZE UNLIMITED';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
  EXECUTE IMMEDIATE 'CREATE USER vdbas_app IDENTIFIED BY "changeme" DEFAULT TABLESPACE users QUOTA UNLIMITED ON users';
EXCEPTION WHEN OTHERS THEN
  EXECUTE IMMEDIATE 'ALTER USER vdbas_app IDENTIFIED BY "changeme"';
END;
/
GRANT CONNECT, RESOURCE, CREATE VIEW, CREATE PROCEDURE, CREATE SEQUENCE, CREATE TRIGGER TO vdbas_app;
GRANT EXECUTE ON SYS.DBMS_CRYPTO TO vdbas_app;

BEGIN
  EXECUTE IMMEDIATE 'CREATE USER vdbas_audit IDENTIFIED BY "changeme" DEFAULT TABLESPACE users QUOTA UNLIMITED ON users';
EXCEPTION WHEN OTHERS THEN
  EXECUTE IMMEDIATE 'ALTER USER vdbas_audit IDENTIFIED BY "changeme"';
END;
/
GRANT CONNECT, RESOURCE, CREATE USER, CREATE TABLESPACE TO vdbas_audit;
GRANT SELECT, INSERT, UPDATE, DELETE ON vdbas_app.LTT_AUDIT_HASH TO vdbas_audit;
GRANT SELECT, INSERT, UPDATE, DELETE ON vdbas_app.OUTBOX TO vdbas_audit;
GRANT SELECT ON vdbas_app.LTT TO vdbas_audit;
GRANT EXECUTE ON SYS.DBMS_CRYPTO TO vdbas_audit;
ALTER USER vdbas_audit QUOTA UNLIMITED ON users;
EXIT;
EOSQL

echo "Running schema migrations..."
sqlplus -S vdbas_app/changeme@oracle:1521/FREEPDB1 @/tmp/setup_all.sql

echo "=== DB Init Complete ==="


