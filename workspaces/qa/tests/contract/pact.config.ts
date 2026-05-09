// ============================================================================
// Pact Configuration — BFF <-> LTT Service Consumer Contract Tests
// Module: TT.OUT.MANUAL
// Source: workspaces/sa/contracts/openapi/api-internal-v1.yaml
// Generated: 2026-05-10 | Stage 4 — QA
// ============================================================================

import { Pact } from '@pact-foundation/pact';

export const pactConfig = {
  consumer: 'vdbas-bff',
  provider: 'vdbas-ltt-service',

  // Local mock provider for consumer-side tests
  port: 8989,
  host: '127.0.0.1',

  // Pact broker for sharing contracts
  brokerUrl: process.env.PACT_BROKER_URL || 'http://localhost:9292',
  brokerToken: process.env.PACT_BROKER_TOKEN || '',

  // Publish to broker in CI
  publishVerificationResult: process.env.CI === 'true',

  // API base path
  apiBasePath: '/api/internal/v1',

  // Default headers required by OpenAPI spec
  defaultHeaders: {
    'Content-Type': 'application/json',
    'X-Request-Id': '550e8400-e29b-41d4-a716-446655440000',
    'X-User-Id': 'maker01',
    'X-User-Role': 'MAKER',
  },

  // Timeout for provider verification
  timeout: 30000,

  // Pact file output directory
  pactFileWriteMode: 'merge' as const,
};

// Common test data
export const testUsers = {
  maker: { id: 'maker01', name: 'Nguyen Van A', role: 'MAKER' },
  checker: { id: 'checker01', name: 'Tran Thi B', role: 'CHECKER' },
  approver: { id: 'approver01', name: 'Le Van C', role: 'APPROVER' },
};

// Standard payment order for contract tests
export const samplePaymentOrder = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  version: 1,
  status: 'DRAFT',
  requestNumber: '10052026000001',
  channel: 'LNH',
  orderType: 'OT-LNH-LCC',
  transactionType: 'TX-LCC',
  senderBankCode: '01101001',
  senderBankName: 'KBNN Cục DB',
  receiverBankCode: '01101002',
  receiverBankName: 'KBNN Cục DB - Chi nhánh',
  paymentDate: '2026-05-10',
  amount: 150000000.00,
  currency: 'VND',
  exchangeRate: null,
  originalDocNo: null,
  originalDocDate: null,
  paymentContent: 'Thanh toan hop dong mua sam thiet bi van phong',
  makerId: 'maker01',
  makerName: 'Nguyen Van A',
  createdAt: '2026-05-10T08:30:00.000+07:00',
  lineItems: [
    {
      id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
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
      description: 'Mua sam thiet bi van phong',
      itemAmount: 150000000.00,
    },
  ],
  senderInfo: {
    name: 'KBNN Cục DB',
    address: '01 Dai Lo Thang Long, Ha Noi',
    accountNumber: '011010010001',
    customerCode: 'KB001',
    bankCode: '01101001',
    bankName: 'KBNN Cục DB',
    identityDoc: null,
    identityDocIssueDate: null,
    identityDocIssuePlace: null,
    tpcpCode: null,
  },
  receiverInfo: {
    name: 'Cong ty ABC',
    address: '123 Nguyen Trai, Ha Noi',
    accountNumber: '011010020001',
    bankCode: '01101002',
    bankName: 'KBNN Cục DB - Chi nhánh',
    accountName: 'Cong ty ABC',
    identityDoc: null,
    identityDocIssueDate: null,
    identityDocIssuePlace: null,
  },
  attachments: [],
  checkerId: null,
  checkerName: null,
  checkedAt: null,
  approverId: null,
  approverName: null,
  approvedAt: null,
  signedAt: null,
  providerRefId: null,
  settlementDate: null,
  glVoucherNo: null,
  reversalOfId: null,
  holdAmount: null,
  rejectReason: null,
  isDeleted: false,
  updatedAt: null,
  updatedBy: null,
};

export default pactConfig;
