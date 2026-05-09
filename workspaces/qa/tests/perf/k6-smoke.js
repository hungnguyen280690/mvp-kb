// ============================================================================
// k6 Smoke Test — VDBAS TT.OUT.MANUAL
// Quick validation of API endpoints
// Generated: 2026-05-10 | Stage 4 — QA
// ============================================================================

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const API_BASE = `${BASE_URL}/api/internal/v1`;

// Default headers with valid JWT for test user
const defaultHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${__ENV.JWT_TOKEN || 'test-jwt-token'}`,
  'X-User-Id': 'maker01',
  'X-User-Role': 'MAKER',
  'X-Request-Id': '550e8400-e29b-41d4-a716-446655440000',
};

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<2000'],   // p95 under 2s for smoke
    http_req_failed: ['rate<0.1'],        // less than 10% failures
  },
};

export default function () {
  // 1. List payment orders
  const listRes = http.get(`${API_BASE}/payment-orders?page=0&size=10`, {
    headers: defaultHeaders,
  });
  check(listRes, {
    'list status 200': (r) => r.status === 200,
    'list has content': (r) => JSON.parse(r.body).content !== undefined,
  });

  sleep(0.5);

  // 2. Get channels reference data
  const channelRes = http.get(`${API_BASE}/dm/channels`, {
    headers: defaultHeaders,
  });
  check(channelRes, {
    'channels status 200': (r) => r.status === 200,
    'channels is array': (r) => Array.isArray(JSON.parse(r.body)),
  });

  sleep(0.5);

  // 3. Get balance
  const balanceRes = http.get(
    `${API_BASE}/balance?accountNumber=011010010001&currency=VND`,
    { headers: defaultHeaders }
  );
  check(balanceRes, {
    'balance status 200 or 400': (r) => r.status === 200 || r.status === 400,
  });

  sleep(0.5);
}
