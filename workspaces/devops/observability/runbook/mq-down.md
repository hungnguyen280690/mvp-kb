---
generated_by: "Claude Opus 4.7 (DevOps/SRE)"
applies_adrs: [ADR-0007, ADR-SA-0001]
classification: Public
title: Runbook — IBM MQ Down
alert: MqQueueDepthHigh
severity: warning (may escalate to critical)
last_updated: 2026-05-10
---

# Runbook: IBM MQ Down

## Overview

IBM MQ is the message bus connecting VDBAS to NHNN, SP, and LKB channels (ref: container.mmd).
When MQ is unavailable, the outbox publisher cannot push events, and LTT state transitions
that require MQ messaging (SEND, CALLBACK) will stall.

The MQ channels are:
- **LNH** (Lien Ngan Hang): `LNH.LTT.REQUEST` / `LNH.LTT.REPLY`
- **SP** (San Phim): `SP.LTT.REQUEST` / `SP.LTT.REPLY`
- **LKB** (Lien Kho Bac): `LKB.LTT.REQUEST` / `LKB.LTT.REPLY`

## Symptoms

- Alert `MqQueueDepthHigh` fires: queue depth > 1000 for 3+ minutes.
- Grafana panel "MQ Message Throughput" shows zero inbound messages.
- Grafana panel "MQ Queue Depth" shows growing or stuck depth.
- `OutboxStuckEvents` may fire concurrently.
- Gateway service logs show: `JMSException: MQRC_Q_MGR_NOT_AVAILABLE` or `Connection refused`.
- LTT Service: saga instances stuck in `SENT` state (waiting for callback that never arrives).

## Diagnosis Steps

### Step 1: Verify MQ server status

```bash
# Check MQ pod status
oc get pods -n vdbas-prod -l app=ibm-mq -o wide

# Check MQ pod events
oc describe pod -n vdbas-prod -l app=ibm-mq | tail -30
```

Expected: Pod Running, Ready 1/1. If not, MQ is the root cause.

### Step 2: Check MQ queue manager status

```bash
# Exec into MQ pod and check queue manager
oc exec -n vdbas-prod deploy/ibm-mq -- \
  dspmq -m QM_PROD
```

Expected: `QMNAME(QM_PROD) STATUS(Running)`. If `Ended unexpectedly`, the QM crashed.

### Step 3: Check queue depths

```bash
oc exec -n vdbas-prod deploy/ibm-mq -- \
  echo "DISPLAY QSTATUS(LNH.LTT.REQUEST) CURDEPTH" | runmqsc QM_PROD
oc exec -n vdbas-prod deploy/ibm-mq -- \
  echo "DISPLAY QSTATUS(SP.LTT.REQUEST) CURDEPTH" | runmqsc QM_PROD
oc exec -n vdbas-prod deploy/ibm-mq -- \
  echo "DISPLAY QSTATUS(LKB.LTT.REQUEST) CURDEPTH" | runmqsc QM_PROD
```

Expected: CURDEPTH < 100. If > 1000, messages are accumulating.

### Step 4: Check DLQ (Dead Letter Queue)

```bash
oc exec -n vdbas-prod deploy/ibm-mq -- \
  echo "DISPLAY QSTATUS(DLQ.LNH.LTT.REQUEST) CURDEPTH" | runmqsc QM_PROD
```

If DLQ has messages, consumers are failing to process.

### Step 5: Check gateway-service health

```bash
# Health endpoint includes MQ connectivity
oc exec -n vdbas-prod deploy/vdbas-gateway-service -- \
  curl -sf http://localhost:8081/actuator/health | jq .

# Check recent errors
oc logs -n vdbas-prod deploy/vdbas-gateway-service --since=10m | grep -iE "error|exception|timeout|mq"
```

### Step 6: Check network connectivity

```bash
# From gateway pod, test MQ port
oc exec -n vdbas-prod deploy/vdbas-gateway-service -- \
  nc -zv ibm-mq-prod.vdbas-prod.svc 1414
```

Expected: Connection succeeds. If refused, MQ listener is not running.

## Failover

### Scenario A: MQ pod crashed

1. Restart MQ pod:
   ```bash
   oc delete pod -n vdbas-prod -l app=ibm-mq
   # Wait for recovery
   oc rollout status deploy/ibm-mq -n vdbas-prod --timeout=120s
   ```
2. Verify queue manager is running (see Step 2).
3. Verify listeners:
   ```bash
   oc exec -n vdbas-prod deploy/ibm-mq -- \
     echo "DISPLAY LISTENER(*)" | runmqsc QM_PROD
   ```
4. Restart consumers to re-establish connections:
   ```bash
   oc rollout restart deploy/vdbas-gateway-service -n vdbas-prod
   ```
5. Monitor queue depths return to normal.

### Scenario B: MQ queue manager ended unexpectedly

1. Start queue manager:
   ```bash
   oc exec -n vdbas-prod deploy/ibm-mq -- \
     strmqm QM_PROD
   ```
2. If strmqm fails, check MQ error logs:
   ```bash
   oc exec -n vdbas-prod deploy/ibm-mq -- \
     cat /var/mqm/qmgrs/QM_PROD/errors/AMQERR01.LOG | tail -100
   ```
3. If disk full, clear old logs (with DBA approval per SAFETY.md Level 2):
   ```bash
   oc exec -n vdbas-prod deploy/ibm-mq -- \
     find /var/mqm -name "*.LOG" -mtime +7 -ls
   # Do NOT delete without DBA approval
   ```
4. After QM starts, restart gateway-service:
   ```bash
   oc rollout restart deploy/vdbas-gateway-service -n vdbas-prod
   ```

### Scenario C: Network partition between gateway and MQ

1. Check Service and Endpoints:
   ```bash
   oc get svc ibm-mq-prod -n vdbas-prod
   oc get endpoints ibm-mq-prod -n vdbas-prod
   ```
2. If endpoints are empty but pod is running, check labels match.
3. If DNS resolution fails:
   ```bash
   oc exec -n vdbas-prod deploy/vdbas-gateway-service -- \
     nslookup ibm-mq-prod.vdbas-prod.svc
   ```
4. Escalate to OpenShift cluster admin if network policy is blocking.

## Recovery

After MQ is restored:

1. **Verify outbox drains**: Monitor `Outbox Pending Events Age` panel. All PENDING events should be published within 2 minutes.
2. **Verify saga instances resume**: Check `Active Saga Instances by State` panel. Instances in `SENT` state should transition to `CONFIRMED` as callbacks arrive.
3. **Verify queue depths normalize**: All queue depths should return below 100.
4. **Check for DLQ messages**: If messages landed in DLQ, they need manual reprocessing (see runbook: gl-failed-dlq.md).
5. **Business reconciliation**: After recovery, run reconciliation report to verify no LTT was lost.

## Prevention

1. **MQ HA**: Deploy MQ in HA mode (multi-instance or queue manager clustering).
2. **Connection retry**: Gateway-service config `retry.backoffDelaysMs: "5000,15000,45000"` provides 3 retries with backoff.
3. **Outbox as buffer**: The transactional outbox pattern (ADR-SA-0001) ensures no messages are lost — they remain in DB until successfully published.
4. **Monitoring**: Dashboard "MQ Message Throughput" and "MQ Queue Depth" panels provide early warning.
5. **Capacity planning**: Ensure MQ queue max depth is configured high enough for peak periods (end of month settlement).
