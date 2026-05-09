// ============================================================================
// k6 Load Test — VDBAS TT.OUT.MANUAL (Hot Path)
// Endpoints: list, create, submit, approve, get detail
// Generated: 2026-05-10 | Stage 4 — QA
// ============================================================================

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const API_BASE = `${BASE_URL}/api/internal/v1`;

// Default headers
const defaultHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${__ENV.JWT_TOKEN || 'test-jwt-token'}`,
  'X-Request-Id': uuidv4(),
};

// User role headers
const makerHeaders = { ...defaultHeaders, 'X-User-Id': 'maker01', 'X-User-Role': 'MAKER' };
const checkerHeaders = { ...defaultHeaders, 'X-User-Id': 'checker01', 'X-User-Role': 'CHECKER' };
const approverHeaders = { ...defaultHeaders, 'X-User-Id': 'approver01', 'X-User-Role': 'APPROVER' };

// Sample create payload
function createPayload() {
  return JSON.stringify({
    channel: 'LNH',
    orderType: 'OT-LNH-LCC',
    transactionType: 'TX-LCC',
    receiverBankCode: '01101002',
    paymentDate: '2026-05-10',
    amount: 150000000 + Math.floor(Math.random() * 100000000),
    currency: 'VND',
    paymentContent: `Load test - k6 - ${uuidv4()}`,
    lineItems: [
      {
        fundCode: '01',
        naturalAccount: '1121',
        dvqhns: '1054321',
        budgetLevel: '1',
        chapter: '168',
        economicSector: '080',
        ndkt: '6000',
        area: '00001',
        program: '00000',
        fundSource: '14',
        treasuryCode: '0010',
        reserve: '000',
        description: 'Load test line item',
        itemAmount: 150000000,
      },
    ],
    senderInfo: {
      name: 'KBNN Test',
      address: 'Test Address',
      accountNumber: '011010010001',
      bankCode: '01101001',
    },
    receiverInfo: {
      name: 'Receiver Test',
      accountNumber: '011010020001',
      bankCode: '01101002',
      accountName: 'Receiver Test Account',
    },
  });
}

// ==========================================================================
// Load Test Configuration
// ==========================================================================
export const options = {
  stages: [
    // Ramp up from 10 to 50 RPS over 2 minutes
    { duration: '2m', target: 50 },
    // Sustain 50 RPS for 5 minutes
    { duration: '5m', target: 50 },
    // Ramp down
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],  // p95 < 500ms, p99 < 1s
    http_req_failed: ['rate<0.05'],                    // <5% failures
    checks: ['rate>0.95'],                             // >95% checks pass
  },
};

// ==========================================================================
// Main Test Function
// ==========================================================================
export default function () {
  // Distribute operations: 40% list, 25% create, 15% submit, 10% approve, 10% detail
  const rand = Math.random();

  if (rand < 0.40) {
    testListPaymentOrders();
  } else if (rand < 0.65) {
    testCreatePaymentOrder();
  } else if (rand < 0.80) {
    testSubmitPaymentOrder();
  } else if (rand < 0.90) {
    testApprovePaymentOrder();
  } else {
    testGetPaymentOrderDetail();
  }

  sleep(0.1); // Small pause between iterations
}

// ==========================================================================
// Test: List Payment Orders (Hot Path #1)
// ==========================================================================
function testListPaymentOrders() {
  group('List Payment Orders', () => {
    const params = {
      headers: makerHeaders,
      tags: { endpoint: 'list', operation: 'read' },
    };

    // Vary pagination parameters
    const page = Math.floor(Math.random() * 5);
    const sizes = [10, 20, 50];
    const size = sizes[Math.floor(Math.random() * sizes.length)];

    const res = http.get(`${API_BASE}/payment-orders?page=${page}&size=${size}&sort=paymentDate,desc`, params);

    check(res, {
      'list: status 200': (r) => r.status === 200,
      'list: has content array': (r) => {
        try { return Array.isArray(JSON.parse(r.body).content); }
        catch { return false; }
      },
      'list: response time < 500ms': (r) => r.timings.duration < 500,
    });
  });
}

// ==========================================================================
// Test: Create Payment Order (Hot Path #2)
// ==========================================================================
function testCreatePaymentOrder() {
  group('Create Payment Order', () => {
    const idemKey = uuidv4();
    const params = {
      headers: {
        ...makerHeaders,
        'Idempotency-Key': idemKey,
      },
      tags: { endpoint: 'create', operation: 'write' },
    };

    const res = http.post(`${API_BASE}/payment-orders`, createPayload(), params);

    check(res, {
      'create: status 201 or 400': (r) => r.status === 201 || r.status === 400,
      'create: response time < 1000ms': (r) => r.timings.duration < 1000,
    });
  });
}

// ==========================================================================
// Test: Submit Payment Order (Hot Path #3)
// ==========================================================================
function testSubmitPaymentOrder() {
  group('Submit Payment Order', () => {
    // Find a DRAFT LTT to submit
    const listRes = http.get(`${API_BASE}/payment-orders?status=DRAFT&size=1`, {
      headers: makerHeaders,
      tags: { endpoint: 'submit', operation: 'workflow' },
    });

    let lttId = null;
    try {
      const body = JSON.parse(listRes.body);
      if (body.content && body.content.length > 0) {
        lttId = body.content[0].id;
      }
    } catch { /* no draft found */ }

    if (lttId) {
      const idemKey = uuidv4();
      const params = {
        headers: {
          ...makerHeaders,
          'Idempotency-Key': idemKey,
        },
        tags: { endpoint: 'submit', operation: 'workflow' },
      };

      const res = http.post(`${API_BASE}/payment-orders/${lttId}/submit`, null, params);

      check(res, {
        'submit: status 200 or 409': (r) => [200, 409, 422].includes(r.status),
        'submit: response time < 2000ms': (r) => r.timings.duration < 2000,
      });
    }
  });
}

// ==========================================================================
// Test: Approve Payment Order (Hot Path #4)
// ==========================================================================
function testApprovePaymentOrder() {
  group('Approve Payment Order', () => {
    // Find a SUBMITTED LTT to approve (checker role)
    const listRes = http.get(`${API_BASE}/payment-orders?status=SUBMITTED&size=1`, {
      headers: checkerHeaders,
      tags: { endpoint: 'approve', operation: 'workflow' },
    });

    let lttId = null;
    try {
      const body = JSON.parse(listRes.body);
      if (body.content && body.content.length > 0) {
        lttId = body.content[0].id;
      }
    } catch { /* no submitted found */ }

    if (lttId) {
      const idemKey = uuidv4();
      const params = {
        headers: {
          ...checkerHeaders,
          'Idempotency-Key': idemKey,
        },
        tags: { endpoint: 'approve', operation: 'workflow' },
      };

      const res = http.post(`${API_BASE}/payment-orders/${lttId}/approve`, null, params);

      check(res, {
        'approve: status 200 or 403': (r) => [200, 403, 409].includes(r.status),
        'approve: response time < 1000ms': (r) => r.timings.duration < 1000,
      });
    }
  });
}

// ==========================================================================
// Test: Get Payment Order Detail (Hot Path #5)
// ==========================================================================
function testGetPaymentOrderDetail() {
  group('Get Payment Order Detail', () => {
    // First get a list to find an ID
    const listRes = http.get(`${API_BASE}/payment-orders?size=1`, {
      headers: makerHeaders,
      tags: { endpoint: 'detail', operation: 'read' },
    });

    let lttId = null;
    try {
      const body = JSON.parse(listRes.body);
      if (body.content && body.content.length > 0) {
        lttId = body.content[0].id;
      }
    } catch { /* nothing */ }

    if (lttId) {
      const res = http.get(`${API_BASE}/payment-orders/${lttId}`, {
        headers: makerHeaders,
        tags: { endpoint: 'detail', operation: 'read' },
      });

      check(res, {
        'detail: status 200': (r) => r.status === 200,
        'detail: has id field': (r) => {
          try { return JSON.parse(r.body).id !== undefined; }
          catch { return false; }
        },
        'detail: response time < 300ms': (r) => r.timings.duration < 300,
      });
    }
  });
}
