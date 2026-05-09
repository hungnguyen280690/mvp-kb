// ============================================================================
// Pact Consumer-Side Contract Tests — BFF -> LTT Service
// Module: TT.OUT.MANUAL
// Source: workspaces/sa/contracts/openapi/api-internal-v1.yaml (17 endpoints)
// Generated: 2026-05-10 | Stage 4 — QA
// ============================================================================

import { Pact } from '@pact-foundation/pact';
import { expect } from 'chai';
import path from 'path';
import { pactConfig, samplePaymentOrder, testUsers } from './pact.config';

// ---------------------------------------------------------------------------
// Pact mock provider setup
// ---------------------------------------------------------------------------
const mockProvider = new Pact({
  consumer: pactConfig.consumer,
  provider: pactConfig.provider,
  port: pactConfig.port,
  log: path.resolve(process.cwd(), 'logs', 'pact.log'),
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'warn',
  spec: 2,
});

// ---------------------------------------------------------------------------
// Helper: construct full API URL for a given path
// ---------------------------------------------------------------------------
const apiBase = pactConfig.apiBasePath;
const orderId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const nonExistentId = '00000000-0000-0000-0000-000000000000';

// Minimal create request per OpenAPI PaymentOrderCreateRequest
const createRequest = {
  channel: 'LNH',
  orderType: 'OT-LNH-LCC',
  transactionType: 'TX-LCC',
  receiverBankCode: '01101002',
  paymentDate: '2026-05-10',
  amount: 150000000.00,
  currency: 'VND',
  paymentContent: 'Thanh toan hop dong mua sam thiet bi van phong',
  lineItems: samplePaymentOrder.lineItems,
  senderInfo: samplePaymentOrder.senderInfo,
  receiverInfo: samplePaymentOrder.receiverInfo,
};

// Common error response shape
const errorResponseSchema = {
  code: 'string',
  message: 'string',
  traceId: 'string',
  timestamp: 'string',
};

// Validation error response shape
const validationErrorSchema = {
  code: '422',
  message: 'string',
  traceId: 'string',
  timestamp: 'string',
  violations: [
    {
      rule: 'string',
      field: 'string',
      message: 'string',
    },
  ],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('BFF -> LTT Service Contract Tests', () => {

  before(async () => {
    await mockProvider.setup();
  });

  after(async () => {
    await mockProvider.finalize();
  });

  afterEach(async () => {
    await mockProvider.verify();
  });

  // ==========================================================================
  // 1. GET /api/internal/v1/payment-orders — List Payment Orders
  // ==========================================================================
  describe('GET /payment-orders — listPaymentOrders', () => {

    it('returns paginated list of payment orders (200)', async () => {
      await mockProvider.addInteraction({
        state: 'a list of payment orders exists',
        uponReceiving: 'a request to list payment orders',
        withRequest: {
          method: 'GET',
          path: `${apiBase}/payment-orders`,
          query: 'page=0&size=20&sort=paymentDate,desc',
          headers: {
            Authorization: 'Bearer valid-jwt-token',
            'X-User-Id': testUsers.maker.id,
            'X-User-Role': testUsers.maker.role,
          },
        },
        willRespondWith: {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            content: [
              {
                id: like('a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
                requestNumber: like('10052026000001'),
                channel: like('LNH'),
                orderType: like('OT-LNH-LCC'),
                senderBankCode: like('01101001'),
                senderBankName: like('KBNN Cục DB'),
                receiverBankCode: like('01101002'),
                receiverBankName: like('KBNN Cục DB - CN'),
                paymentDate: like('2026-05-10'),
                amount: like(150000000.00),
                currency: like('VND'),
                status: like('DRAFT'),
                makerName: like('Nguyen Van A'),
                createdAt: like('2026-05-10T08:30:00.000+07:00'),
                updatedAt: like('2026-05-10T08:30:00.000+07:00'),
                version: like(1),
              },
            ],
            page: {
              number: 0,
              size: 20,
              totalElements: 25,
              totalPages: 2,
            },
          },
        },
      });
    });

    it('returns 400 for invalid query parameters', async () => {
      await mockProvider.addInteraction({
        state: 'a list of payment orders exists',
        uponReceiving: 'a request with invalid date range (from > to)',
        withRequest: {
          method: 'GET',
          path: `${apiBase}/payment-orders`,
          query: 'paymentDateFrom=2026-05-15&paymentDateTo=2026-05-10',
          headers: {
            Authorization: 'Bearer valid-jwt-token',
            'X-User-Id': testUsers.maker.id,
            'X-User-Role': testUsers.maker.role,
          },
        },
        willRespondWith: {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: errorResponseSchema,
        },
      });
    });

    it('returns 401 when unauthenticated', async () => {
      await mockProvider.addInteraction({
        state: 'a list of payment orders exists',
        uponReceiving: 'an unauthenticated request to list payment orders',
        withRequest: {
          method: 'GET',
          path: `${apiBase}/payment-orders`,
        },
        willRespondWith: {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
          body: { code: '401', message: 'Chua xac thuc' },
        },
      });
    });
  });

  // ==========================================================================
  // 2. POST /api/internal/v1/payment-orders — Create Payment Order
  // ==========================================================================
  describe('POST /payment-orders — createPaymentOrder', () => {

    it('creates a new payment order successfully (201)', async () => {
      await mockProvider.addInteraction({
        state: 'no payment orders exist',
        uponReceiving: 'a valid create payment order request',
        withRequest: {
          method: 'POST',
          path: `${apiBase}/payment-orders`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-jwt-token',
            'Idempotency-Key': 'idem-key-create-001',
            'X-User-Id': testUsers.maker.id,
            'X-User-Role': testUsers.maker.role,
          },
          body: createRequest,
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
            ETag: '"1"',
          },
          body: {
            id: like('a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
            version: 1,
            status: 'DRAFT',
            requestNumber: like('10052026000001'),
            channel: 'LNH',
            orderType: 'OT-LNH-LCC',
            transactionType: 'TX-LCC',
            senderBankCode: like('01101001'),
            senderBankName: like('KBNN Cục DB'),
            receiverBankCode: '01101002',
            receiverBankName: like('KBNN Cục DB - CN'),
            paymentDate: '2026-05-10',
            amount: 150000000.00,
            currency: 'VND',
            paymentContent: like('Thanh toan hop dong'),
            makerId: testUsers.maker.id,
            makerName: testUsers.maker.name,
            createdAt: like('2026-05-10T08:30:00.000+07:00'),
            lineItems: eachLike({
              fundCode: '01',
              naturalAccount: '1121',
              itemAmount: 150000000.00,
              description: like('Mua sam thiet bi'),
            }),
            isDeleted: false,
          },
        },
      });
    });

    it('returns 400 for malformed request body', async () => {
      await mockProvider.addInteraction({
        state: 'no payment orders exist',
        uponReceiving: 'a create request with missing required fields',
        withRequest: {
          method: 'POST',
          path: `${apiBase}/payment-orders`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-jwt-token',
            'Idempotency-Key': 'idem-key-create-002',
            'X-User-Id': testUsers.maker.id,
            'X-User-Role': testUsers.maker.role,
          },
          body: { channel: 'LNH' }, // missing many required fields
        },
        willRespondWith: {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: errorResponseSchema,
        },
      });
    });

    it('returns 409 for duplicate idempotency key', async () => {
      await mockProvider.addInteraction({
        state: 'a draft payment order exists with id "a1b2c3d4-e5f6-7890-abcd-ef1234567890"',
        uponReceiving: 'a create request with duplicate idempotency key',
        withRequest: {
          method: 'POST',
          path: `${apiBase}/payment-orders`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-jwt-token',
            'Idempotency-Key': 'duplicate-idem-key',
            'X-User-Id': testUsers.maker.id,
            'X-User-Role': testUsers.maker.role,
          },
          body: createRequest,
        },
        willRespondWith: {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
          body: {
            code: '409',
            message: like('Duplicate idempotency key'),
          },
        },
      });
    });

    it('returns 422 for validation errors', async () => {
      await mockProvider.addInteraction({
        state: 'no payment orders exist',
        uponReceiving: 'a create request that violates validation rules',
        withRequest: {
          method: 'POST',
          path: `${apiBase}/payment-orders`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-jwt-token',
            'Idempotency-Key': 'idem-key-create-val-001',
            'X-User-Id': testUsers.maker.id,
            'X-User-Role': testUsers.maker.role,
          },
          body: {
            ...createRequest,
            receiverBankCode: createRequest.senderBankCode || '01101001', // same as sender (VAL-009)
          },
        },
        willRespondWith: {
          status: 422,
          headers: { 'Content-Type': 'application/json' },
          body: {
            code: '422',
            message: 'Validate that bai',
            violations: eachLike({
              rule: like('E-VAL-009'),
              field: like('receiverBankCode'),
              message: like('NH chuyen va NH nhan khong duoc trung nhau'),
            }),
          },
        },
      });
    });
  });

  // ==========================================================================
  // 3. GET /api/internal/v1/payment-orders/{id} — Get Payment Order
  // ==========================================================================
  describe('GET /payment-orders/{id} — getPaymentOrder', () => {

    it('returns payment order detail (200)', async () => {
      await mockProvider.addInteraction({
        state: 'a draft payment order exists with id "a1b2c3d4-e5f6-7890-abcd-ef1234567890"',
        uponReceiving: 'a request to get payment order detail',
        withRequest: {
          method: 'GET',
          path: `${apiBase}/payment-orders/${orderId}`,
          headers: {
            Authorization: 'Bearer valid-jwt-token',
            'X-User-Id': testUsers.maker.id,
            'X-User-Role': testUsers.maker.role,
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ETag: '"1"',
          },
          body: {
            id: orderId,
            version: 1,
            status: 'DRAFT',
            requestNumber: like('10052026000001'),
            channel: 'LNH',
            orderType: like('OT-LNH-LCC'),
            amount: like(150000000.00),
            currency: 'VND',
            makerId: testUsers.maker.id,
            isDeleted: false,
          },
        },
      });
    });

    it('returns 404 for non-existent payment order', async () => {
      await mockProvider.addInteraction({
        state: 'no payment order exists with id "00000000-0000-0000-0000-000000000000"',
        uponReceiving: 'a request for a non-existent payment order',
        withRequest: {
          method: 'GET',
          path: `${apiBase}/payment-orders/${nonExistentId}`,
          headers: {
            Authorization: 'Bearer valid-jwt-token',
            'X-User-Id': testUsers.maker.id,
            'X-User-Role': testUsers.maker.role,
          },
        },
        willRespondWith: {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
          body: { code: '404', message: 'Khong tim thay LTT' },
        },
      });
    });
  });

  // ==========================================================================
  // 4. PUT /api/internal/v1/payment-orders/{id} — Update Payment Order
  // ==========================================================================
  describe('PUT /payment-orders/{id} — updatePaymentOrder', () => {

    it('updates a draft payment order successfully (200)', async () => {
      await mockProvider.addInteraction({
        state: 'a draft payment order exists with id "a1b2c3d4-e5f6-7890-abcd-ef1234567890"',
        uponReceiving: 'a valid update request for a draft payment order',
        withRequest: {
          method: 'PUT',
          path: `${apiBase}/payment-orders/${orderId}`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-jwt-token',
            'If-Match': '"1"',
            'X-User-Id': testUsers.maker.id,
            'X-User-Role': testUsers.maker.role,
          },
          body: {
            ...createRequest,
            amount: 200000000.00,
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ETag: '"2"',
          },
          body: {
            id: orderId,
            version: 2,
            status: 'DRAFT',
            amount: 200000000.00,
          },
        },
      });
    });

    it('returns 409 when version mismatch (optimistic lock)', async () => {
      await mockProvider.addInteraction({
        state: 'the payment order version is stale (optimistic lock conflict)',
        uponReceiving: 'an update request with stale version',
        withRequest: {
          method: 'PUT',
          path: `${apiBase}/payment-orders/${orderId}`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-jwt-token',
            'If-Match': '"3"',
            'X-User-Id': testUsers.maker.id,
            'X-User-Role': testUsers.maker.role,
          },
          body: createRequest,
        },
        willRespondWith: {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
          body: {
            code: '409',
            message: like('Ban ghi da bi thay doi'),
          },
        },
      });
    });

    it('returns 423 when locked by another user', async () => {
      await mockProvider.addInteraction({
        state: 'a draft payment order exists with id "a1b2c3d4-e5f6-7890-abcd-ef1234567890"',
        uponReceiving: 'an update request when LTT is locked by another user',
        withRequest: {
          method: 'PUT',
          path: `${apiBase}/payment-orders/${orderId}`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-jwt-token',
            'If-Match': '"1"',
            'X-User-Id': 'maker02',
            'X-User-Role': testUsers.maker.role,
          },
          body: createRequest,
        },
        willRespondWith: {
          status: 423,
          headers: { 'Content-Type': 'application/json' },
          body: {
            code: '423',
            message: like('dang duoc user khac chinh sua'),
          },
        },
      });
    });
  });

  // ==========================================================================
  // 5. DELETE /api/internal/v1/payment-orders/{id} — Delete Payment Order
  // ==========================================================================
  describe('DELETE /payment-orders/{id} — deletePaymentOrder', () => {

    it('soft-deletes a draft payment order (200)', async () => {
      await mockProvider.addInteraction({
        state: 'a draft payment order exists with id "a1b2c3d4-e5f6-7890-abcd-ef1234567890"',
        uponReceiving: 'a valid delete request with reason and confirmation',
        withRequest: {
          method: 'DELETE',
          path: `${apiBase}/payment-orders/${orderId}`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-jwt-token',
            'If-Match': '"1"',
            'X-User-Id': testUsers.maker.id,
            'X-User-Role': testUsers.maker.role,
          },
          body: {
            reason: 'Khong can thanh toan nua do sai thong tin nguoi thuong',
            confirmed: true,
          },
        },
        willRespondWith: {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            id: orderId,
            status: 'DELETED',
            deletedAt: like('2026-05-10T10:00:00.000+07:00'),
          },
        },
      });
    });

    it('returns 412 when trying to delete from invalid state', async () => {
      await mockProvider.addInteraction({
        state: 'a submitted payment order exists with id "a1b2c3d4-e5f6-7890-abcd-ef1234567890"',
        uponReceiving: 'a delete request for a submitted payment order',
        withRequest: {
          method: 'DELETE',
          path: `${apiBase}/payment-orders/${orderId}`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-jwt-token',
            'If-Match': '"2"',
            'X-User-Id': testUsers.maker.id,
            'X-User-Role': testUsers.maker.role,
          },
          body: {
            reason: 'Khong can thanh toan nua',
            confirmed: true,
          },
        },
        willRespondWith: {
          status: 412,
          headers: { 'Content-Type': 'application/json' },
          body: {
            code: '412',
            message: like('trang thai khong cho phep'),
          },
        },
      });
    });
  });

  // ==========================================================================
  // 6. POST /payment-orders/{id}/submit — Submit Payment Order
  // ==========================================================================
  describe('POST /payment-orders/{id}/submit — submitPaymentOrder', () => {

    it('submits a draft payment order successfully (200)', async () => {
      await mockProvider.addInteraction({
        state: 'a draft payment order exists with id "a1b2c3d4-e5f6-7890-abcd-ef1234567890"',
        uponReceiving: 'a submit request for a draft payment order',
        withRequest: {
          method: 'POST',
          path: `${apiBase}/payment-orders/${orderId}/submit`,
          headers: {
            Authorization: 'Bearer valid-jwt-token',
            'Idempotency-Key': 'idem-key-submit-001',
            'X-User-Id': testUsers.maker.id,
            'X-User-Role': testUsers.maker.role,
          },
        },
        willRespondWith: {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            id: orderId,
            version: 2,
            status: 'SUBMITTED',
            holdAmount: 150000000.00,
          },
        },
      });
    });

    it('returns 422 when validation fails on submit', async () => {
      await mockProvider.addInteraction({
        state: 'a draft payment order exists with id "a1b2c3d4-e5f6-7890-abcd-ef1234567890"',
        uponReceiving: 'a submit request when validation rules are violated',
        withRequest: {
          method: 'POST',
          path: `${apiBase}/payment-orders/${orderId}/submit`,
          headers: {
            Authorization: 'Bearer valid-jwt-token',
            'Idempotency-Key': 'idem-key-submit-val-001',
            'X-User-Id': testUsers.maker.id,
            'X-User-Role': testUsers.maker.role,
          },
        },
        willRespondWith: {
          status: 422,
          headers: { 'Content-Type': 'application/json' },
          body: validationErrorSchema,
        },
      });
    });
  });

  // ==========================================================================
  // 7. POST /payment-orders/{id}/approve — Approve Payment Order
  // ==========================================================================
  describe('POST /payment-orders/{id}/approve — approvePaymentOrder', () => {

    it('checker approves a submitted payment order (200)', async () => {
      await mockProvider.addInteraction({
        state: 'a submitted payment order exists with id "a1b2c3d4-e5f6-7890-abcd-ef1234567890"',
        uponReceiving: 'a checker approve request',
        withRequest: {
          method: 'POST',
          path: `${apiBase}/payment-orders/${orderId}/approve`,
          headers: {
            Authorization: 'Bearer valid-jwt-token',
            'Idempotency-Key': 'idem-key-checker-approve-001',
            'X-User-Id': testUsers.checker.id,
            'X-User-Role': testUsers.checker.role,
          },
        },
        willRespondWith: {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            id: orderId,
            version: 3,
            status: 'IN_CONTROL',
            checkerId: testUsers.checker.id,
            checkerName: testUsers.checker.name,
            checkedAt: like('2026-05-10T09:30:00.000+07:00'),
          },
        },
      });
    });

    it('approver approves an in-control payment order (200)', async () => {
      await mockProvider.addInteraction({
        state: 'an in-control payment order exists with id "a1b2c3d4-e5f6-7890-abcd-ef1234567890"',
        uponReceiving: 'an approver approve request',
        withRequest: {
          method: 'POST',
          path: `${apiBase}/payment-orders/${orderId}/approve`,
          headers: {
            Authorization: 'Bearer valid-jwt-token',
            'Idempotency-Key': 'idem-key-approver-approve-001',
            'X-User-Id': testUsers.approver.id,
            'X-User-Role': testUsers.approver.role,
          },
        },
        willRespondWith: {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            id: orderId,
            version: 4,
            status: 'APPROVED',
            approverId: testUsers.approver.id,
            approverName: testUsers.approver.name,
            approvedAt: like('2026-05-10T10:00:00.000+07:00'),
          },
        },
      });
    });

    it('returns 403 when SoD violated (maker = checker)', async () => {
      await mockProvider.addInteraction({
        state: 'a submitted payment order exists with id "a1b2c3d4-e5f6-7890-abcd-ef1234567890"',
        uponReceiving: 'an approve request from the maker (SoD violation)',
        withRequest: {
          method: 'POST',
          path: `${apiBase}/payment-orders/${orderId}/approve`,
          headers: {
            Authorization: 'Bearer valid-jwt-token',
            'Idempotency-Key': 'idem-key-sod-violation-001',
            'X-User-Id': testUsers.maker.id, // same as maker
            'X-User-Role': testUsers.checker.role,
          },
        },
        willRespondWith: {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
          body: {
            code: '403',
            message: like('phan tach trach nhiem'),
          },
        },
      });
    });
  });

  // ==========================================================================
  // 8. POST /payment-orders/{id}/reject — Reject Payment Order
  // ==========================================================================
  describe('POST /payment-orders/{id}/reject — rejectPaymentOrder', () => {

    it('rejects a submitted payment order (200)', async () => {
      await mockProvider.addInteraction({
        state: 'a submitted payment order exists with id "a1b2c3d4-e5f6-7890-abcd-ef1234567890"',
        uponReceiving: 'a reject request from checker with valid reason',
        withRequest: {
          method: 'POST',
          path: `${apiBase}/payment-orders/${orderId}/reject`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-jwt-token',
            'Idempotency-Key': 'idem-key-reject-001',
            'X-User-Id': testUsers.checker.id,
            'X-User-Role': testUsers.checker.role,
          },
          body: {
            reason: 'Thong tin nguoi thuong khong chinh xac, can kiem tra lai',
          },
        },
        willRespondWith: {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            id: orderId,
            version: 3,
            status: 'RETURNED_TO_MAKER',
            rejectReason: 'Thong tin nguoi thuong khong chinh xac, can kiem tra lai',
          },
        },
      });
    });

    it('returns 422 when reject reason is too short', async () => {
      await mockProvider.addInteraction({
        state: 'a submitted payment order exists with id "a1b2c3d4-e5f6-7890-abcd-ef1234567890"',
        uponReceiving: 'a reject request with reason shorter than 10 chars',
        withRequest: {
          method: 'POST',
          path: `${apiBase}/payment-orders/${orderId}/reject`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-jwt-token',
            'Idempotency-Key': 'idem-key-reject-short-001',
            'X-User-Id': testUsers.checker.id,
            'X-User-Role': testUsers.checker.role,
          },
          body: {
            reason: 'Sai',
          },
        },
        willRespondWith: {
          status: 422,
          headers: { 'Content-Type': 'application/json' },
          body: validationErrorSchema,
        },
      });
    });
  });

  // ==========================================================================
  // 9. POST /payment-orders/{id}/sign — Sign Payment Order
  // ==========================================================================
  describe('POST /payment-orders/{id}/sign — signPaymentOrder', () => {

    it('signs an approved payment order (200)', async () => {
      await mockProvider.addInteraction({
        state: 'an approved payment order exists with id "a1b2c3d4-e5f6-7890-abcd-ef1234567890"',
        uponReceiving: 'a sign request with valid digital certificate',
        withRequest: {
          method: 'POST',
          path: `${apiBase}/payment-orders/${orderId}/sign`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-jwt-token',
            'Idempotency-Key': 'idem-key-sign-001',
            'X-User-Id': testUsers.approver.id,
            'X-User-Role': testUsers.approver.role,
          },
          body: {
            signatureData: 'base64-encoded-signature-data',
            signerCert: 'base64-encoded-certificate',
          },
        },
        willRespondWith: {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            id: orderId,
            version: 5,
            status: 'SIGNED',
            signedAt: like('2026-05-10T11:00:00.000+07:00'),
          },
        },
      });
    });

    it('returns 400 for expired certificate', async () => {
      await mockProvider.addInteraction({
        state: 'an approved payment order exists with id "a1b2c3d4-e5f6-7890-abcd-ef1234567890"',
        uponReceiving: 'a sign request with expired certificate',
        withRequest: {
          method: 'POST',
          path: `${apiBase}/payment-orders/${orderId}/sign`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-jwt-token',
            'Idempotency-Key': 'idem-key-sign-expired-001',
            'X-User-Id': testUsers.approver.id,
            'X-User-Role': testUsers.approver.role,
          },
          body: {
            signatureData: 'base64-encoded-signature-data',
            signerCert: 'base64-encoded-expired-certificate',
          },
        },
        willRespondWith: {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: {
            code: '400',
            message: like('Chung thu so da het han'),
          },
        },
      });
    });
  });

  // ==========================================================================
  // 10. POST /payment-orders/{id}/send — Send Payment Order
  // ==========================================================================
  describe('POST /payment-orders/{id}/send — sendPaymentOrder', () => {

    it('sends a signed payment order to gateway (200)', async () => {
      await mockProvider.addInteraction({
        state: 'a signed payment order exists with id "a1b2c3d4-e5f6-7890-abcd-ef1234567890"',
        uponReceiving: 'a send request for a signed payment order',
        withRequest: {
          method: 'POST',
          path: `${apiBase}/payment-orders/${orderId}/send`,
          headers: {
            Authorization: 'Bearer valid-jwt-token',
            'Idempotency-Key': 'idem-key-send-001',
            'X-User-Id': testUsers.approver.id,
            'X-User-Role': testUsers.approver.role,
          },
        },
        willRespondWith: {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            id: orderId,
            version: 6,
            status: 'SENT',
          },
        },
      });
    });
  });

  // ==========================================================================
  // 11. POST /payment-orders/{id}/cancel — Cancel Payment Order
  // ==========================================================================
  describe('POST /payment-orders/{id}/cancel — cancelPaymentOrder', () => {

    it('cancels a signed payment order (200)', async () => {
      await mockProvider.addInteraction({
        state: 'a signed payment order exists with id "a1b2c3d4-e5f6-7890-abcd-ef1234567890"',
        uponReceiving: 'a cancel request with valid reason',
        withRequest: {
          method: 'POST',
          path: `${apiBase}/payment-orders/${orderId}/cancel`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-jwt-token',
            'Idempotency-Key': 'idem-key-cancel-001',
            'X-User-Id': testUsers.approver.id,
            'X-User-Role': testUsers.approver.role,
          },
          body: {
            reason: 'Huy lenh do phat hien sai thong tin nguoi thuong',
          },
        },
        willRespondWith: {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            id: orderId,
            version: 6,
            status: 'CANCELLED',
          },
        },
      });
    });

    it('returns 422 when cancel reason is too short', async () => {
      await mockProvider.addInteraction({
        state: 'a signed payment order exists with id "a1b2c3d4-e5f6-7890-abcd-ef1234567890"',
        uponReceiving: 'a cancel request with reason shorter than 10 chars',
        withRequest: {
          method: 'POST',
          path: `${apiBase}/payment-orders/${orderId}/cancel`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-jwt-token',
            'Idempotency-Key': 'idem-key-cancel-short-001',
            'X-User-Id': testUsers.approver.id,
            'X-User-Role': testUsers.approver.role,
          },
          body: {
            reason: 'Huy',
          },
        },
        willRespondWith: {
          status: 422,
          headers: { 'Content-Type': 'application/json' },
          body: validationErrorSchema,
        },
      });
    });
  });

  // ==========================================================================
  // 12. POST /payment-orders/{id}/reverse — Reverse Payment Order
  // ==========================================================================
  describe('POST /payment-orders/{id}/reverse — reversePaymentOrder', () => {

    it('creates a reversal for a posted payment order (201)', async () => {
      await mockProvider.addInteraction({
        state: 'a posted payment order exists with id "a1b2c3d4-e5f6-7890-abcd-ef1234567890"',
        uponReceiving: 'a reverse request for a posted payment order',
        withRequest: {
          method: 'POST',
          path: `${apiBase}/payment-orders/${orderId}/reverse`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-jwt-token',
            'Idempotency-Key': 'idem-key-reverse-001',
            'X-User-Id': testUsers.approver.id,
            'X-User-Role': testUsers.approver.role,
          },
          body: {
            reason: 'Sai thong tin thanh toan, can dao but toan de dieu chinh',
          },
        },
        willRespondWith: {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
          body: {
            id: like('c3d4e5f6-a7b8-9012-cdef-123456789012'),
            version: 1,
            status: 'DRAFT',
            reversalOfId: orderId,
          },
        },
      });
    });
  });

  // ==========================================================================
  // 13. GET /payment-orders/{id}/audit-trail — Get Audit Trail
  // ==========================================================================
  describe('GET /payment-orders/{id}/audit-trail — getAuditTrail', () => {

    it('returns audit trail for a payment order (200)', async () => {
      await mockProvider.addInteraction({
        state: 'payment order "a1b2c3d4-e5f6-7890-abcd-ef1234567890" has audit trail entries',
        uponReceiving: 'a request for audit trail',
        withRequest: {
          method: 'GET',
          path: `${apiBase}/payment-orders/${orderId}/audit-trail`,
          query: 'page=0&size=50',
          headers: {
            Authorization: 'Bearer valid-jwt-token',
            'X-User-Id': testUsers.maker.id,
            'X-User-Role': testUsers.maker.role,
          },
        },
        willRespondWith: {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            content: eachLike({
              id: like('audit-entry-001'),
              paymentOrderId: orderId,
              action: like('CREATE'),
              userId: like('maker01'),
              userName: like('Nguyen Van A'),
              userRole: like('MAKER'),
              timestamp: like('2026-05-10T08:30:00.000+07:00'),
              previousStatus: null,
              newStatus: like('DRAFT'),
              version: 1,
              diffs: null,
              reason: null,
              ipAddress: like('192.168.1.100'),
              auditHash: like('sha256-hash-value'),
            }),
            page: {
              number: 0,
              size: 50,
              totalElements: 3,
              totalPages: 1,
            },
          },
        },
      });
    });
  });

  // ==========================================================================
  // 14. GET /api/internal/v1/dm/channels — Get Channels
  // ==========================================================================
  describe('GET /dm/channels — getChannels', () => {

    it('returns list of payment channels (200)', async () => {
      await mockProvider.addInteraction({
        state: 'reference data channels exist',
        uponReceiving: 'a request to get channels',
        withRequest: {
          method: 'GET',
          path: `${apiBase}/dm/channels`,
          headers: {
            Authorization: 'Bearer valid-jwt-token',
            'X-User-Id': testUsers.maker.id,
            'X-User-Role': testUsers.maker.role,
          },
        },
        willRespondWith: {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: eachLike({
            code: like('LNH'),
            name: like('Lien ngan hang'),
            description: like('Kenh NHNN/CITAD'),
            status: like('ACTIVE'),
          }),
        },
      });
    });
  });

  // ==========================================================================
  // 15. GET /api/internal/v1/dm/coa-segments — Get COA Segments
  // ==========================================================================
  describe('GET /dm/coa-segments — getCoaSegments', () => {

    it('returns COA segment data (200)', async () => {
      await mockProvider.addInteraction({
        state: 'COA segment data exists',
        uponReceiving: 'a request to get COA segments for DM-MAQUY',
        withRequest: {
          method: 'GET',
          path: `${apiBase}/dm/coa-segments`,
          query: 'segmentType=DM-MAQUY',
          headers: {
            Authorization: 'Bearer valid-jwt-token',
            'X-User-Id': testUsers.maker.id,
            'X-User-Role': testUsers.maker.role,
          },
        },
        willRespondWith: {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            segmentType: 'DM-MAQUY',
            items: eachLike({
              code: like('01'),
              name: like('Quy NSNN'),
              channel: null,
              status: like('ACTIVE'),
              description: like('Quy ngan sach nha nuoc'),
            }),
          },
        },
      });
    });
  });

  // ==========================================================================
  // 16. GET /api/internal/v1/balance — Get Balance
  // ==========================================================================
  describe('GET /balance — getBalance', () => {

    it('returns account balance (200)', async () => {
      await mockProvider.addInteraction({
        state: 'sufficient account balance exists',
        uponReceiving: 'a request to check account balance',
        withRequest: {
          method: 'GET',
          path: `${apiBase}/balance`,
          query: 'accountNumber=011010010001&currency=VND',
          headers: {
            Authorization: 'Bearer valid-jwt-token',
            'X-User-Id': testUsers.maker.id,
            'X-User-Role': testUsers.maker.role,
          },
        },
        willRespondWith: {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            accountNumber: '011010010001',
            currency: 'VND',
            balance: 1000000000,
            holdAmount: 0,
            availableBalance: 1000000000,
            asOfTimestamp: like('2026-05-10T08:30:00.000+07:00'),
          },
        },
      });
    });

    it('returns 400 when account number is missing', async () => {
      await mockProvider.addInteraction({
        state: 'sufficient account balance exists',
        uponReceiving: 'a balance request without account number',
        withRequest: {
          method: 'GET',
          path: `${apiBase}/balance`,
          query: 'currency=VND',
          headers: {
            Authorization: 'Bearer valid-jwt-token',
            'X-User-Id': testUsers.maker.id,
            'X-User-Role': testUsers.maker.role,
          },
        },
        willRespondWith: {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: errorResponseSchema,
        },
      });
    });
  });
});
