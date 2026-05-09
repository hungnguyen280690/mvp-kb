// ============================================================================
// k6 Stress Test — VDBAS TT.OUT.MANUAL
// Ramp to 200 RPS to find breaking point
// Generated: 2026-05-10 | Stage 4 — QA
// ============================================================================

import http from 'k6/http';
import { check, sleep } from 'k6';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const API_BASE = `${BASE_URL}/api/internal/v1`;

const defaultHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${__ENV.JWT_TOKEN || 'test-jwt-token'}`,
  'X-User-Id': 'maker01',
  'X-User-Role': 'MAKER',
};

// ==========================================================================
// Stress Test Configuration
// ==========================================================================
export const options = {
  stages: [
    // Warm up: 10 VUs
    { duration: '30s', target: 10 },
    // Ramp to 100 VUs (moderate load)
    { duration: '1m', target: 100 },
    // Ramp to 200 VUs (stress)
    { duration: '2m', target: 200 },
    // Hold at 200 VUs
    { duration: '3m', target: 200 },
    // Spike to 300 VUs
    { duration: '30s', target: 300 },
    // Ramp down
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'], // Relaxed for stress
    http_req_failed: ['rate<0.15'],                    // Allow more failures under stress
  },
};

export default function () {
  const res = http.get(
    `${API_BASE}/payment-orders?page=0&size=20&sort=paymentDate,desc`,
    { headers: defaultHeaders, tags: { test: 'stress' } }
  );

  check(res, {
    'stress: status is 2xx or 4xx': (r) => r.status >= 200 && r.status < 500,
    'stress: response time < 5s': (r) => r.timings.duration < 5000,
  });

  // Intermix create operations at 20% rate
  if (Math.random() < 0.2) {
    const idemKey = uuidv4();
    const createRes = http.post(
      `${API_BASE}/payment-orders`,
      JSON.stringify({
        channel: 'LNH',
        orderType: 'OT-LNH-LCC',
        transactionType: 'TX-LCC',
        receiverBankCode: '01101002',
        paymentDate: '2026-05-10',
        amount: Math.floor(Math.random() * 1000000000) + 100000,
        currency: 'VND',
        paymentContent: `Stress test ${uuidv4()}`,
        lineItems: [{
          fundCode: '01', naturalAccount: '1121', dvqhns: '1054321',
          budgetLevel: '1', chapter: '168', economicSector: '080',
          ndkt: '6000', area: '00001', program: '00000',
          fundSource: '14', treasuryCode: '0010', reserve: '000',
          description: 'Stress test item', itemAmount: 150000000,
        }],
        senderInfo: { name: 'KBNN Test', address: 'Test', accountNumber: '011010010001', bankCode: '01101001' },
        receiverInfo: { name: 'Receiver', accountNumber: '011010020001', bankCode: '01101002', accountName: 'Receiver' },
      }),
      {
        headers: { ...defaultHeaders, 'Idempotency-Key': idemKey },
        tags: { test: 'stress', operation: 'create' },
      }
    );

    check(createRes, {
      'stress create: status 201 or 4xx': (r) => r.status === 201 || (r.status >= 400 && r.status < 500),
    });
  }

  sleep(0.05);
}
