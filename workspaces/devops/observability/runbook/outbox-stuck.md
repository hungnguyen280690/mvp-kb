---
generated_by: "Claude Opus 4.7 (DevOps/SRE)"
applies_adrs: [ADR-0007, ADR-SA-0001]
classification: Public
title: Runbook — Outbox Events Stuck
alert: OutboxStuckEvents
severity: critical
last_updated: 2026-05-10
---

# Runbook: Outbox Events Stuck

## Overview

Outbox events in `PENDING` status are not being picked up by the polling publisher.
Per ADR-SA-0001, the outbox publisher polls `outbox_events` every 500ms.
When events exceed 100 for 5+ minutes, this alert fires.

## Symptoms

- Alert `OutboxStuckEvents` fires in Prometheus/Alertmanager.
- Grafana dashboard panel "Outbox Pending Events Age" shows > 100 events and rising.
- Downstream systems (QLChi, QLT, So cai, ECM) report missing notifications.
- MQ queues show reduced or zero inbound message rate.
- Business impact: LTT state transitions are recorded in DB but external systems are not notified.

## Diagnosis Steps

### Step 1: Check outbox event count and age

```sql
-- Connect to Oracle: sqlplus vdbas_app/<password>@//oracle-prod:1521/VDBASPROD
SELECT status, COUNT(*), MIN(created_at), MAX(created_at),
       EXTRACT(SECOND FROM (SYSTIMESTAMP - MIN(created_at))) AS oldest_age_seconds
FROM   outbox_events
WHERE  status = 'PENDING'
GROUP BY status;
```

Expected: 0 rows or oldest_age_seconds < 2. If PENDING rows exist with age > 10s, the publisher is stuck.

### Step 2: Check the publishing service pod health

```bash
# Identify which service owns the outbox (gateway-service and audit-service both publish)
oc get pods -n vdbas-prod -l app.kubernetes.io/name=gateway-service
oc get pods -n vdbas-prod -l app.kubernetes.io/name=audit-service

# Check pod restarts
oc get pods -n vdbas-prod -l app.kubernetes.io/part-of=vdbas -o wide
```

### Step 3: Check publisher logs

```bash
# Gateway service outbox publisher logs
oc logs -n vdbas-prod -l app.kubernetes.io/name=gateway-service --tail=200 | grep -i "outbox"

# Audit service outbox publisher logs
oc logs -n vdbas-prod -l app.kubernetes.io/name=audit-service --tail=200 | grep -i "outbox"

# Look for: "Failed to publish", "MQ connection lost", "exception"
```

### Step 4: Check MQ connectivity

```bash
# From gateway-service pod, test MQ connection
oc exec -n vdbas-prod deploy/vdbas-gateway-service -- \
  curl -s http://localhost:8081/actuator/health | jq '.components.ibmMq'
```

Expected: `{"status": "UP"}`. If DOWN, MQ is unreachable.

### Step 5: Check Oracle connectivity

```bash
oc exec -n vdbas-prod deploy/vdbas-ltt-service -- \
  curl -s http://localhost:8081/actuator/health | jq '.components.db'
```

Expected: `{"status": "UP"}`.

## Resolution

### Scenario A: MQ connection lost

1. Verify MQ server is running:
   ```bash
   oc get pods -n vdbas-prod -l app=ibm-mq
   ```
2. If MQ pod is down, restart it:
   ```bash
   oc delete pod -n vdbas-prod -l app=ibm-mq
   # Wait for pod to come back healthy
   oc rollout status deploy/ibm-mq -n vdbas-prod
   ```
3. Restart the publishing service to re-establish MQ connections:
   ```bash
   oc rollout restart deploy/vdbas-gateway-service -n vdbas-prod
   oc rollout restart deploy/vdbas-audit-service -n vdbas-prod
   ```
4. Verify outbox events are draining:
   ```sql
   SELECT COUNT(*) FROM outbox_events WHERE status = 'PENDING';
   -- Should decrease within 1-2 seconds
   ```

### Scenario B: Publisher thread deadlocked

1. Check thread dump:
   ```bash
   oc exec -n vdbas-prod deploy/vdbas-gateway-service -- \
     curl -s http://localhost:8081/actuator/threaddump > /tmp/threaddump.txt
   grep -A5 "outbox" /tmp/threaddump.txt
   ```
2. If BLOCKED threads found, restart the pod:
   ```bash
   oc rollout restart deploy/vdbas-gateway-service -n vdbas-prod
   ```
3. Monitor that events drain (see Scenario A, step 4).

### Scenario C: Event payload too large / malformed

1. Identify problematic events:
   ```sql
   SELECT id, aggregate_type, aggregate_id, event_type, retry_count, LENGTH(payload)
   FROM   outbox_events
   WHERE  status = 'PENDING' AND retry_count >= 5
   ORDER  BY created_at;
   ```
2. If specific events consistently fail (retry_count >= max_retries):
   ```sql
   -- Mark as FAILED for manual investigation
   UPDATE outbox_events
   SET    status = 'FAILED'
   WHERE  id = '<uuid>';
   COMMIT;
   ```
3. Create incident ticket with the aggregate_id for business investigation.
4. Remaining PENDING events should resume processing automatically.

## Prevention

1. **MQ health check**: Ensure Spring Boot MQ health indicator is configured in readiness probe.
2. **Outbox alert tuning**: Current threshold is 100 events for 5 min. Adjust if normal batch processing exceeds this.
3. **Connection pooling**: Verify MQ connection pool settings match the expected concurrent publisher count.
4. **Retention**: Outbox cleanup job (retention 7 days) prevents table bloat.
5. **Monitoring**: Grafana panel "Outbox Pending Events Age" should be watched during peak hours (end of month settlement).
