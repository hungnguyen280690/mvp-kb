---
generated_by: "Claude Opus 4.7 (DevOps/SRE)"
applies_adrs: [ADR-0007, ADR-SA-0002]
classification: Public
title: Runbook — GL Post Failure / DLQ Processing
alert: SagaCompensationRate, HighErrorRate5xx
severity: warning (business impact: financial reconciliation required)
last_updated: 2026-05-10
---

# Runbook: GL Post Failure and DLQ Processing

## Overview

After an LTT is confirmed by NHNN (state: CONFIRMED), the Saga Orchestrator (ADR-SA-0002)
calls GL (So cai) to post the accounting entry via API-004. If GL fails, the LTT enters
state `POST_FAILED`. Per ADR-SA-0002, this does NOT rollback — the NH has already confirmed
the payment. The LTT remains in POST_FAILED until ops manually resolves it.

Messages that fail MQ delivery after max retries are moved to the Dead Letter Queue (DLQ).
DLQ messages require manual investigation and reprocessing.

## Symptoms

- Grafana panel "Saga Timeout / Failure Rate" shows elevated saga compensation.
- LTT list in UI shows items in `POST_FAILED` state.
- MQ DLQ has messages:
  ```bash
  oc exec -n vdbas-prod deploy/ibm-mq -- \
    echo "DISPLAY QSTATUS(DLQ.*) CURDEPTH" | runmqsc QM_PROD
  ```
- Alert `SagaCompensationRate` fires.
- Alert `HighErrorRate5xx` fires (GL service returning 500).

## Diagnosis Steps

### Step 1: Identify POST_FAILED LTTs

```sql
-- Connect to Oracle
SELECT id, so_yctt, trang_thai, nguoi_tao, ngay_tao, ngay_cap_nhat,
       EXTRACT(EPOCH FROM (SYSTIMESTAMP - ngay_cap_nhat)) / 60 AS minutes_in_post_failed
FROM   payment_order
WHERE  trang_thai = 'POST_FAILED'
ORDER  BY ngay_cap_nhat;
```

Record the `so_yctt` (LTT reference number) for each failed LTT.

### Step 2: Check saga step history for failed LTTs

```sql
SELECT s.saga_id, s.aggregate_id, st.step_name, st.status, st.started_at,
       st.completed_at, st.error_message
FROM   saga_instance s
JOIN   saga_step st ON st.saga_id = s.id
WHERE  s.aggregate_id IN (
    SELECT so_yctt FROM payment_order WHERE trang_thai = 'POST_FAILED'
)
ORDER  BY s.aggregate_id, st.started_at;
```

Look for the step where the GL call failed. Note the `error_message`.

### Step 3: Check GL service health

```bash
# GL service health
oc exec -n vdbas-prod deploy/vdbas-ltt-service -- \
  curl -sf http://gl-service:8080/actuator/health | jq .

# GL service recent errors
oc logs -n vdbas-prod deploy/vdbas-ltt-service --since=30m | grep -i "GL.*error\|GL.*fail\|POST_FAILED"
```

### Step 4: Check DLQ message contents

```bash
# Browse DLQ messages (do NOT consume yet)
oc exec -n vdbas-prod deploy/ibm-mq -- \
  echo "DISPLAY Q(DLQ.LNH.LTT.REQUEST) CURDEPTH" | runmqsc QM_PROD

# Use amqsget or amqsbcg to browse without destructively reading:
oc exec -n vdbas-prod deploy/ibm-mq -- \
  amqsbcg DLQ.LNH.LTT.REQUEST QM_PROD > /tmp/dlq-messages.txt 2>&1
  cat /tmp/dlq-messages.txt
```

Look for: message ID, correlation ID, original queue, reason for DLQ placement, payload.

## Manual Reprocessing

### Reprocess POST_FAILED LTTs

**IMPORTANT**: This requires G5 (SRE) approval per SAFETY.md Level 2.

1. **Verify the root cause is fixed** (GL service is healthy, network restored).
2. **For each POST_FAILED LTT**:
   ```sql
   -- Step 1: Verify current state
   SELECT so_yctt, trang_thai, version
   FROM   payment_order
   WHERE  so_yctt = '<LTT_REFERENCE>';
   ```
3. **Trigger reprocessing via API** (using the BFF endpoint):
   ```bash
   # Get auth token
   TOKEN=$(oc exec -n vdbas-prod deploy/vdbas-bff -- \
     curl -s -X POST https://sso.kbnn.gov.vn/realms/vdbas/protocol/openid-connect/token \
     -d "grant_type=client_credentials&client_id=vdbas-ops&client_secret=$CLIENT_SECRET" | jq -r .access_token)

   # Retry GL post for specific LTT
   curl -X POST "https://vdbas.kbnn.gov.vn/api/v1/ltt/<LTT_REFERENCE>/retry-gl" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Idempotency-Key: $(uuidgen)" \
     -H "Content-Type: application/json"
   ```
4. **Verify state transition**:
   ```sql
   SELECT so_yctt, trang_thai FROM payment_order WHERE so_yctt = '<LTT_REFERENCE>';
   -- Expected: POSTED
   ```

### Reprocess DLQ Messages

**IMPORTANT**: Requires G5 (SRE) + G2 (SA) approval for financial data reprocessing.

1. **Extract message from DLQ** (save payload before any action):
   ```bash
   # Save DLQ message to file for audit trail
   oc exec -n vdbas-prod deploy/ibm-mq -- \
     amqsget DLQ.LNH.LTT.REQUEST QM_PROD > /tmp/dlq-msg-$(date +%Y%m%d-%H%M%S).txt
   ```
2. **Determine original destination** from DLQ headers (ReplyToQueue, ReplyToQMgr).
3. **Validate message payload**:
   - Check correlation ID matches a known LTT.
   - Check message format against schema.
   - Verify the LTT has not already been processed (idempotency check).
4. **Move message back to original queue**:
   ```bash
   oc exec -n vdbas-prod deploy/ibm-mq -- \
     echo "MOVE Q(DLQ.LNH.LTT.REQUEST) Q(LNH.LTT.REQUEST) SELECT('$CORRELATION_ID')" | runmqsc QM_PROD
   ```
   Or use amqsput to manually republish:
   ```bash
   oc exec -n vdbas-prod deploy/ibm-mq -- \
     amqsput LNH.LTT.REQUEST QM_PROD < /tmp/reprocessed-msg.txt
   ```
5. **Verify processing**: Check that the message was consumed and the LTT state advanced.

## Data Reconciliation

After reprocessing all failed items:

1. **Reconciliation query** — compare LTT states vs GL entries:
   ```sql
   SELECT po.so_yctt, po.trang_thai, gl.gl_status, gl.gl_posting_date
   FROM   payment_order po
   LEFT   JOIN gl_posting gl ON gl.ltt_reference = po.so_yctt
   WHERE  po.ngay_tao >= TRUNC(SYSDATE) - 1
   ORDER  BY po.so_yctt;
   ```
2. **Missing GL entries** for CONFIRMED/POSTED LTTs indicate incomplete processing.
3. **Extra GL entries** without matching LTTs indicate duplicate processing (idempotency failure).
4. **Generate reconciliation report** and submit to finance team for sign-off.

## Prevention

1. **GL retry in Saga**: The Saga Orchestrator should retry GL post up to 3 times with backoff (5s, 15s, 45s per BIZ-RETRY) before entering POST_FAILED.
2. **Circuit breaker**: Add circuit breaker on GL service client. If GL is consistently failing, stop trying and alert immediately.
3. **DLQ monitoring**: Alert on DLQ depth > 0 (any message in DLQ warrants investigation).
4. **Idempotency key**: Every GL post request includes an idempotency key (ref: ADR-SA-0005) to prevent duplicate postings.
5. **Reconciliation batch job**: Daily reconciliation job that compares LTT state vs GL entries and flags discrepancies.
6. **Audit trail**: All manual reprocessing actions are logged in the audit hash chain (ADR-SA-0003) for compliance.
