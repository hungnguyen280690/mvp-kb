// ============================================================================
// Integration Test Setup — Testcontainers + Oracle + IBM MQ Mock
// Module: TT.OUT.MANUAL
// Generated: 2026-05-10 | Stage 4 — QA
// ============================================================================

import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import oracle from 'oracledb';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
export const CONTAINER_CONFIG = {
  oracle: {
    image: 'gvenzl/oracle-free:23-slim-faststart',
    port: 1521,
    database: 'FREEPDB1',
    username: 'system',
    password: 'testpwd123',
    initScript: '../../db/migrations/V1__init_ltt.sql',
  },
  mockMq: {
    // Using a mock MQ server for integration tests
    image: 'ibmcom/mq:9.3.4.0-r1',
    port: 1414,
    queueManager: 'TEST.QM',
    channel: 'DEV.APP.SVRCONN',
    user: 'app',
    password: 'passw0rd',
  },
};

// ---------------------------------------------------------------------------
// Oracle connection pool
// ---------------------------------------------------------------------------
let oracleContainer: StartedTestContainer;
let connectionPool: oracle.Pool;

export interface TestContext {
  oracleContainer: StartedTestContainer;
  connectionPool: oracle.Pool;
  mqMockUrl: string;
  cleanup: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Setup: Start containers and initialize schema
// ---------------------------------------------------------------------------
export async function setupTestContainers(): Promise<TestContext> {
  // Start Oracle container
  oracleContainer = await new GenericContainer(CONTAINER_CONFIG.oracle.image)
    .withExposedPorts(CONTAINER_CONFIG.oracle.port)
    .withEnvironment({
      ORACLE_PASSWORD: CONTAINER_CONFIG.oracle.password,
      APP_USER: 'ltt_test',
      APP_USER_PASSWORD: 'ltt_test_pwd',
    })
    .withWaitStrategy(Wait.forLogMessage('DATABASE IS READY TO USE', 120000))
    .start();

  const oraclePort = oracleContainer.getMappedPort(CONTAINER_CONFIG.oracle.port);
  const oracleHost = oracleContainer.getHost();

  const connectString = `${oracleHost}:${oraclePort}/${CONTAINER_CONFIG.oracle.database}`;

  // Create connection pool
  connectionPool = await oracle.createPool({
    user: 'ltt_test',
    password: 'ltt_test_pwd',
    connectString,
    poolMin: 2,
    poolMax: 10,
  });

  // Run migrations
  await runMigrations(connectionPool);

  return {
    oracleContainer,
    connectionPool,
    mqMockUrl: 'mock://localhost:1414',
    cleanup: async () => {
      if (connectionPool) {
        await connectionPool.close(0);
      }
      if (oracleContainer) {
        await oracleContainer.stop();
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Run DDL migrations
// ---------------------------------------------------------------------------
async function runMigrations(pool: oracle.Pool): Promise<void> {
  const conn = await pool.getConnection();

  try {
    // V1: Create LTT table
    await conn.execute(`
      CREATE TABLE ltt_payment_orders (
        id                VARCHAR2(36) PRIMARY KEY,
        version           NUMBER(10) NOT NULL,
        status            VARCHAR2(30) NOT NULL,
        request_number    VARCHAR2(30) NOT NULL,
        channel           VARCHAR2(3) NOT NULL,
        order_type        VARCHAR2(20) NOT NULL,
        transaction_type  VARCHAR2(20),
        sender_bank_code  VARCHAR2(8) NOT NULL,
        sender_bank_name  VARCHAR2(200),
        receiver_bank_code VARCHAR2(8) NOT NULL,
        receiver_bank_name VARCHAR2(200),
        payment_date      DATE NOT NULL,
        amount            NUMBER(15,2) NOT NULL,
        currency          VARCHAR2(3) DEFAULT 'VND',
        exchange_rate     NUMBER(12,4),
        original_doc_no   VARCHAR2(30),
        original_doc_date DATE,
        payment_content   VARCHAR2(500) NOT NULL,
        maker_id          VARCHAR2(50) NOT NULL,
        maker_name        VARCHAR2(200),
        created_at        TIMESTAMP NOT NULL,
        updated_at        TIMESTAMP,
        updated_by        VARCHAR2(50),
        line_items_json   CLOB,
        sender_info_json  CLOB,
        receiver_info_json CLOB,
        checker_id        VARCHAR2(50),
        checker_name      VARCHAR2(200),
        checked_at        TIMESTAMP,
        approver_id       VARCHAR2(50),
        approver_name     VARCHAR2(200),
        approved_at       TIMESTAMP,
        signed_at         TIMESTAMP,
        signature_data    CLOB,
        signature_hash    VARCHAR2(64),
        signer_cert       CLOB,
        provider_ref_id   VARCHAR2(50),
        settlement_date   DATE,
        gl_voucher_no     VARCHAR2(30),
        reversal_of_id    VARCHAR2(36),
        hold_amount       NUMBER(15,2),
        reject_reason     VARCHAR2(500),
        is_deleted        NUMBER(1) DEFAULT 0,
        deleted_by        VARCHAR2(50),
        deleted_at        TIMESTAMP,
        delete_reason     VARCHAR2(500),
        audit_hash        VARCHAR2(64),
        CONSTRAINT uk_request_number UNIQUE (request_number, channel)
      )
    `);

    // V2: Outbox table
    await conn.execute(`
      CREATE TABLE outbox_events (
        id              VARCHAR2(36) PRIMARY KEY,
        aggregate_id    VARCHAR2(36) NOT NULL,
        event_type      VARCHAR2(50) NOT NULL,
        payload         CLOB NOT NULL,
        created_at      TIMESTAMP NOT NULL,
        published       NUMBER(1) DEFAULT 0,
        published_at    TIMESTAMP,
        correlation_id  VARCHAR2(36),
        causation_id    VARCHAR2(36),
        CONSTRAINT ck_outbox_published CHECK (published IN (0, 1))
      )
    `);

    // V3: Audit hash chain table
    await conn.execute(`
      CREATE TABLE audit_trail (
        id                VARCHAR2(36) PRIMARY KEY,
        payment_order_id  VARCHAR2(36) NOT NULL,
        action            VARCHAR2(30) NOT NULL,
        user_id           VARCHAR2(50) NOT NULL,
        user_name         VARCHAR2(200),
        user_role         VARCHAR2(20),
        timestamp_        TIMESTAMP NOT NULL,
        previous_status   VARCHAR2(30),
        new_status        VARCHAR2(30),
        version           NUMBER(10),
        diffs             CLOB,
        reason            VARCHAR2(500),
        ip_address        VARCHAR2(45),
        audit_hash        VARCHAR2(64) NOT NULL,
        previous_hash     VARCHAR2(64),
        CONSTRAINT fk_audit_payment_order FOREIGN KEY (payment_order_id)
          REFERENCES ltt_payment_orders(id)
      )
    `);

    // V4: Lock table for optimistic locking
    await conn.execute(`
      CREATE TABLE entity_locks (
        entity_type  VARCHAR2(30) NOT NULL,
        entity_id    VARCHAR2(36) NOT NULL,
        locked_by    VARCHAR2(50) NOT NULL,
        locked_at    TIMESTAMP NOT NULL,
        expires_at   TIMESTAMP NOT NULL,
        CONSTRAINT pk_entity_locks PRIMARY KEY (entity_type, entity_id)
      )
    `);

    // Index for audit chain integrity verification
    await conn.execute(`
      CREATE INDEX idx_audit_payment_order ON audit_trail(payment_order_id, timestamp_)
    `);

    await conn.commit();
  } finally {
    await conn.close();
  }
}

// ---------------------------------------------------------------------------
// Helper: Get DB connection from pool
// ---------------------------------------------------------------------------
export async function getConnection(): Promise<oracle.Connection> {
  return connectionPool.getConnection();
}

// ---------------------------------------------------------------------------
// Helper: Clean all tables between tests
// ---------------------------------------------------------------------------
export async function cleanTestData(): Promise<void> {
  const conn = await connectionPool.getConnection();
  try {
    await conn.execute('DELETE FROM audit_trail');
    await conn.execute('DELETE FROM outbox_events');
    await conn.execute('DELETE FROM entity_locks');
    await conn.execute('DELETE FROM ltt_payment_orders');
    await conn.commit();
  } finally {
    await conn.close();
  }
}

// ---------------------------------------------------------------------------
// Helper: Generate UUID
// ---------------------------------------------------------------------------
export function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ---------------------------------------------------------------------------
// Helper: Insert a test payment order
// ---------------------------------------------------------------------------
export async function insertTestPaymentOrder(
  overrides: Record<string, unknown> = {}
): Promise<string> {
  const id = (overrides.id as string) || generateUuid();
  const defaults = {
    version: 1,
    status: 'DRAFT',
    request_number: `10052026000001`,
    channel: 'LNH',
    order_type: 'OT-LNH-LCC',
    transaction_type: 'TX-LCC',
    sender_bank_code: '01101001',
    sender_bank_name: 'KBNN Cục DB',
    receiver_bank_code: '01101002',
    receiver_bank_name: 'KBNN Cục DB - CN',
    payment_date: '2026-05-10',
    amount: 150000000.00,
    currency: 'VND',
    payment_content: 'Thanh toan hop dong mua sam',
    maker_id: 'maker01',
    maker_name: 'Nguyen Van A',
    created_at: new Date(),
    is_deleted: 0,
    line_items_json: JSON.stringify([]),
    sender_info_json: JSON.stringify({}),
    receiver_info_json: JSON.stringify({}),
  };

  const data = { ...defaults, ...overrides, id };

  const conn = await connectionPool.getConnection();
  try {
    await conn.execute(
      `INSERT INTO ltt_payment_orders (
        id, version, status, request_number, channel, order_type, transaction_type,
        sender_bank_code, sender_bank_name, receiver_bank_code, receiver_bank_name,
        payment_date, amount, currency, payment_content, maker_id, maker_name,
        created_at, is_deleted, line_items_json, sender_info_json, receiver_info_json
      ) VALUES (
        :id, :version, :status, :request_number, :channel, :order_type, :transaction_type,
        :sender_bank_code, :sender_bank_name, :receiver_bank_code, :receiver_bank_name,
        TO_DATE(:payment_date, 'YYYY-MM-DD'), :amount, :currency, :payment_content,
        :maker_id, :maker_name, :created_at, :is_deleted,
        :line_items_json, :sender_info_json, :receiver_info_json
      )`,
      data
    );
    await conn.commit();
    return id;
  } finally {
    await conn.close();
  }
}

export default { setupTestContainers, cleanTestData, getConnection, insertTestPaymentOrder, generateUuid };
