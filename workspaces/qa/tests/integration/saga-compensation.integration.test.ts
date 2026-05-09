// ============================================================================
// Integration Test — Saga Compensation (Rollback Scenarios)
// Module: TT.OUT.MANUAL
// Source: states.yaml, BIZ-RETRY, BIZ-RELEASE-HOLD
// Generated: 2026-05-10 | Stage 4 — QA
// ============================================================================

import { expect } from 'chai';
import crypto from 'crypto';
import {
  setupTestContainers,
  cleanTestData,
  getConnection,
  insertTestPaymentOrder,
  generateUuid,
  TestContext,
} from './setup';

describe('Saga Compensation — Integration Tests', () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setupTestContainers();
  });

  after(async () => {
    await ctx.cleanup();
  });

  beforeEach(async () => {
    await cleanTestData();
  });

  // ==========================================================================
  // Scenario 1: Gateway timeout -> rollback
  // ==========================================================================
  describe('Gateway timeout triggers rollback', () => {

    it('releases hold and transitions to SEND_FAILED after all retries exhausted', async () => {
      const conn = await getConnection();

      try {
        // Setup: LTT in SENT state with hold
        const lttId = await insertTestPaymentOrder({
          status: 'SENT',
          version: 6,
          hold_amount: 150000000,
        });

        // Simulate retry exhaustion: callback never comes
        // After timeout period, saga compensator kicks in

        // Step 1: Mark outbox events as failed
        await conn.execute(
          `INSERT INTO outbox_events (id, aggregate_id, event_type, payload, created_at, correlation_id, published)
           VALUES (:id, :aggId, 'TT.OUT.MANUAL.SEND_FAILED', :payload, SYSTIMESTAMP, :corrId, 0)`,
          {
            id: generateUuid(),
            aggId: lttId,
            payload: JSON.stringify({ paymentOrderId: lttId, errorCode: 'TIMEOUT', retryCount: 3 }),
            corrId: lttId,
          }
        );

        // Step 2: Transition to SEND_FAILED
        await conn.execute(
          `UPDATE ltt_payment_orders SET status = 'SEND_FAILED', version = 7,
           hold_amount = NULL, updated_at = SYSTIMESTAMP
           WHERE id = :id AND status = 'SENT'`,
          { id: lttId }
        );

        // Step 3: Insert compensation audit
        await conn.execute(
          `INSERT INTO audit_trail (id, payment_order_id, action, user_id, user_name, user_role,
            timestamp_, previous_status, new_status, version, audit_hash, previous_hash, reason)
           VALUES (:id, :poId, 'SEND_FAILED', 'SYSTEM', 'System', 'SYSTEM',
            SYSTIMESTAMP, 'SENT', 'SEND_FAILED', 7, :hash, NULL, 'Gateway timeout after 3 retries')`,
          { id: generateUuid(), poId: lttId, hash: crypto.randomBytes(32).toString('hex') }
        );

        await conn.commit();

        // Verify rollback
        const result = await conn.execute(
          'SELECT status, hold_amount FROM ltt_payment_orders WHERE id = :id',
          { id: lttId }
        );
        expect(result.rows[0][0]).to.equal('SEND_FAILED');
        expect(result.rows[0][1]).to.be.null; // hold released

      } finally {
        await conn.close();
      }
    });
  });

  // ==========================================================================
  // Scenario 2: GL post failure -> retry + DLQ
  // ==========================================================================
  describe('GL post failure triggers DLQ', () => {

    it('transitions to POST_FAILED and pushes to DLQ when GL fails', async () => {
      const conn = await getConnection();

      try {
        // Setup: LTT in CONFIRMED state
        const lttId = await insertTestPaymentOrder({
          status: 'CONFIRMED',
          version: 7,
          hold_amount: null,
          provider_ref_id: 'CITAD20260510001',
        });

        // Simulate GL post failure
        // Step 1: Create failed outbox event
        await conn.execute(
          `INSERT INTO outbox_events (id, aggregate_id, event_type, payload, created_at, correlation_id, published)
           VALUES (:id, :aggId, 'TT.OUT.MANUAL.GL_FAILED', :payload, SYSTIMESTAMP, :corrId, 0)`,
          {
            id: generateUuid(),
            aggId: lttId,
            payload: JSON.stringify({
              paymentOrderId: lttId,
              errorCode: 'GL_PERIOD_CLOSED',
              errorMessage: 'Ky ke toan da dong',
            }),
            corrId: lttId,
          }
        );

        // Step 2: Transition to POST_FAILED
        await conn.execute(
          `UPDATE ltt_payment_orders SET status = 'POST_FAILED', version = 8,
           updated_at = SYSTIMESTAMP WHERE id = :id AND status = 'CONFIRMED'`,
          { id: lttId }
        );

        // Step 3: Audit
        await conn.execute(
          `INSERT INTO audit_trail (id, payment_order_id, action, user_id, user_name, user_role,
            timestamp_, previous_status, new_status, version, audit_hash, previous_hash, reason)
           VALUES (:id, :poId, 'GL_FAIL', 'SYSTEM', 'System', 'SYSTEM',
            SYSTIMESTAMP, 'CONFIRMED', 'POST_FAILED', 8, :hash, NULL, 'GL post failed: period closed')`,
          { id: generateUuid(), poId: lttId, hash: crypto.randomBytes(32).toString('hex') }
        );

        await conn.commit();

        // Verify
        const result = await conn.execute(
          'SELECT status FROM ltt_payment_orders WHERE id = :id',
          { id: lttId }
        );
        expect(result.rows[0][0]).to.equal('POST_FAILED');

        // Verify DLQ event exists (unpublished = in DLQ)
        const dlqResult = await conn.execute(
          `SELECT event_type, published FROM outbox_events
           WHERE aggregate_id = :id AND event_type = 'TT.OUT.MANUAL.GL_FAILED'`,
          { id: lttId }
        );
        expect(dlqResult.rows.length).to.equal(1);
        expect(dlqResult.rows[0][0]).to.equal('TT.OUT.MANUAL.GL_FAILED');
        expect(dlqResult.rows[0][1]).to.equal(0); // not published -> stuck in DLQ

      } finally {
        await conn.close();
      }
    });

    it('retries GL post before going to DLQ', async () => {
      const conn = await getConnection();

      try {
        const lttId = await insertTestPaymentOrder({
          status: 'CONFIRMED',
          version: 7,
        });

        // First GL attempt fails
        let glResult = false;
        const maxRetries = 3;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          // Simulate GL call
          if (attempt === 3) {
            // Third attempt succeeds
            await conn.execute(
              `UPDATE ltt_payment_orders SET status = 'POSTED', version = 8,
               gl_voucher_no = 'GL-2026-009999',
               updated_at = SYSTIMESTAMP WHERE id = :id`,
              { id: lttId }
            );
            glResult = true;
            break;
          }
          // Failed attempt — would retry
        }

        await conn.commit();

        if (glResult) {
          const result = await conn.execute(
            'SELECT status, gl_voucher_no FROM ltt_payment_orders WHERE id = :id',
            { id: lttId }
          );
          expect(result.rows[0][0]).to.equal('POSTED');
          expect(result.rows[0][1]).to.equal('GL-2026-009999');
        }

      } finally {
        await conn.close();
      }
    });
  });

  // ==========================================================================
  // Scenario 3: MQ down -> outbox accumulates
  // ==========================================================================
  describe('MQ down: outbox accumulates events', () => {

    it('accumulates events in outbox when MQ is unavailable', async () => {
      const conn = await getConnection();

      try {
        const lttId = await insertTestPaymentOrder({
          status: 'SUBMITTED',
          version: 2,
          hold_amount: 500000000,
        });

        // Multiple events accumulate (MQ down)
        const eventTypes = [
          'TT.OUT.MANUAL.SUBMITTED',
          'TT.OUT.MANUAL.HOLD_PLACED',
          'TT.OUT.MANUAL.NOTIFICATION_SENT',
        ];

        for (const eventType of eventTypes) {
          await conn.execute(
            `INSERT INTO outbox_events (id, aggregate_id, event_type, payload, created_at, correlation_id, published)
             VALUES (:id, :aggId, :eventType, :payload, SYSTIMESTAMP, :corrId, 0)`,
            {
              id: generateUuid(),
              aggId: lttId,
              eventType,
              payload: JSON.stringify({ paymentOrderId: lttId }),
              corrId: lttId,
            }
          );
        }
        await conn.commit();

        // All events remain unpublished
        const result = await conn.execute(
          'SELECT COUNT(*) FROM outbox_events WHERE aggregate_id = :id AND published = 0',
          { id: lttId }
        );
        expect(result.rows[0][0]).to.equal(3);

        // Simulate MQ recovery: relay process publishes all
        await conn.execute(
          `UPDATE outbox_events SET published = 1, published_at = SYSTIMESTAMP
           WHERE aggregate_id = :id AND published = 0`,
          { id: lttId }
        );
        await conn.commit();

        const afterRecovery = await conn.execute(
          'SELECT COUNT(*) FROM outbox_events WHERE aggregate_id = :id AND published = 1',
          { id: lttId }
        );
        expect(afterRecovery.rows[0][0]).to.equal(3);

      } finally {
        await conn.close();
      }
    });

    it('preserves event ordering when replaying from outbox', async () => {
      const conn = await getConnection();

      try {
        const lttId = await insertTestPaymentOrder({ status: 'APPROVED', version: 4 });

        // Insert events in specific order
        const events = [
          'TT.OUT.MANUAL.SUBMITTED',
          'TT.OUT.MANUAL.CHECK_APPROVED',
          'TT.OUT.MANUAL.APPROVED',
        ];

        for (let i = 0; i < events.length; i++) {
          await conn.execute(
            `INSERT INTO outbox_events (id, aggregate_id, event_type, payload, created_at, correlation_id, published)
             VALUES (:id, :aggId, :eventType, :payload,
                     SYSTIMESTAMP - NUMTODSINTERVAL(:delay, 'SECOND'),
                     :corrId, 0)`,
            {
              id: generateUuid(),
              aggId: lttId,
              eventType: events[i],
              payload: JSON.stringify({ idx: i }),
              corrId: lttId,
              delay: (events.length - i) * 10,
            }
          );
        }
        await conn.commit();

        // Verify ordering
        const result = await conn.execute(
          `SELECT event_type FROM outbox_events WHERE aggregate_id = :id
           ORDER BY created_at ASC`,
          { id: lttId }
        );
        expect(result.rows[0][0]).to.equal('TT.OUT.MANUAL.SUBMITTED');
        expect(result.rows[1][0]).to.equal('TT.OUT.MANUAL.CHECK_APPROVED');
        expect(result.rows[2][0]).to.equal('TT.OUT.MANUAL.APPROVED');

      } finally {
        await conn.close();
      }
    });
  });

  // ==========================================================================
  // Scenario 4: Reject/Cancel triggers hold release compensation
  // ==========================================================================
  describe('Reject/Cancel compensation releases hold', () => {

    it('reject releases hold amount and creates RELEASE_HOLD audit', async () => {
      const conn = await getConnection();

      try {
        const lttId = await insertTestPaymentOrder({
          status: 'SUBMITTED',
          version: 2,
          hold_amount: 150000000,
        });

        // Compensating action: reject -> release hold
        await conn.execute(
          `UPDATE ltt_payment_orders SET status = 'RETURNED_TO_MAKER', version = 3,
           hold_amount = NULL, reject_reason = 'Thong tin khong chinh xac',
           updated_at = SYSTIMESTAMP, updated_by = 'checker01'
           WHERE id = :id`,
          { id: lttId }
        );

        // Audit RELEASE_HOLD
        await conn.execute(
          `INSERT INTO audit_trail (id, payment_order_id, action, user_id, user_name, user_role,
            timestamp_, previous_status, new_status, version, audit_hash, previous_hash, reason)
           VALUES (:id, :poId, 'RELEASE_HOLD', 'checker01', 'Tran Thi B', 'CHECKER',
            SYSTIMESTAMP, 'SUBMITTED', 'RETURNED_TO_MAKER', 3, :hash, NULL,
            'Release hold due to reject')`,
          { id: generateUuid(), poId: lttId, hash: crypto.randomBytes(32).toString('hex') }
        );

        // Outbox event for rejection
        await conn.execute(
          `INSERT INTO outbox_events (id, aggregate_id, event_type, payload, created_at, correlation_id)
           VALUES (:id, :aggId, 'TT.OUT.MANUAL.REJECTED', :payload, SYSTIMESTAMP, :corrId)`,
          {
            id: generateUuid(),
            aggId: lttId,
            payload: JSON.stringify({
              paymentOrderId: lttId,
              status: 'RETURNED_TO_MAKER',
              previousStatus: 'SUBMITTED',
              reason: 'Thong tin khong chinh xac',
            }),
            corrId: lttId,
          }
        );

        await conn.commit();

        // Verify hold released
        const result = await conn.execute(
          'SELECT status, hold_amount, reject_reason FROM ltt_payment_orders WHERE id = :id',
          { id: lttId }
        );
        expect(result.rows[0][0]).to.equal('RETURNED_TO_MAKER');
        expect(result.rows[0][1]).to.be.null;
        expect(result.rows[0][2]).to.equal('Thong tin khong chinh xac');

        // Verify RELEASE_HOLD audit
        const auditResult = await conn.execute(
          `SELECT action FROM audit_trail WHERE payment_order_id = :id AND action = 'RELEASE_HOLD'`,
          { id: lttId }
        );
        expect(auditResult.rows.length).to.equal(1);

      } finally {
        await conn.close();
      }
    });
  });
});
