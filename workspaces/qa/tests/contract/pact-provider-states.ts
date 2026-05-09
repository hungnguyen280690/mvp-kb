// ============================================================================
// Pact Provider States — BFF <-> LTT Service
// Module: TT.OUT.MANUAL
// Generated: 2026-05-10 | Stage 4 — QA
// ============================================================================

import { ProviderState } from '@pact-foundation/pact';

// Provider states map: each key corresponds to a "given" clause in consumer tests
// The provider uses these to set up test data before verification
export const providerStates: Record<string, ProviderState> = {

  // ==========================================================================
  // Payment Orders — CRUD
  // ==========================================================================

  'a list of payment orders exists': {
    setup: async (params: Record<string, unknown>) => {
      // Seed 25 payment orders with varied statuses
      const orders = [];
      for (let i = 0; i < 25; i++) {
        orders.push({
          id: `seed-order-${i.toString().padStart(3, '0')}`,
          status: ['DRAFT', 'SUBMITTED', 'IN_CONTROL', 'APPROVED', 'SENT', 'CONFIRMED', 'POSTED'][i % 7],
          requestNumber: `1005202600${i.toString().padStart(4, '0')}`,
          channel: ['LNH', 'SP', 'LKB'][i % 3],
          orderType: 'OT-LNH-LCC',
          paymentDate: '2026-05-10',
          amount: 100000000 + i * 1000000,
          currency: 'VND',
          makerId: 'maker01',
          makerName: 'Nguyen Van A',
          createdAt: new Date(Date.now() - i * 60000).toISOString(),
          version: 1,
        });
      }
      return { seededOrders: orders.length };
    },
  },

  'no payment orders exist': {
    setup: async () => {
      return { seededOrders: 0 };
    },
  },

  'a draft payment order exists with id "a1b2c3d4-e5f6-7890-abcd-ef1234567890"': {
    setup: async () => {
      return {
        orderId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        status: 'DRAFT',
        version: 1,
      };
    },
  },

  'a submitted payment order exists with id "a1b2c3d4-e5f6-7890-abcd-ef1234567890"': {
    setup: async () => {
      return {
        orderId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        status: 'SUBMITTED',
        version: 2,
        makerId: 'maker01',
      };
    },
  },

  'an in-control payment order exists with id "a1b2c3d4-e5f6-7890-abcd-ef1234567890"': {
    setup: async () => {
      return {
        orderId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        status: 'IN_CONTROL',
        version: 3,
        makerId: 'maker01',
        checkerId: 'checker01',
      };
    },
  },

  'an approved payment order exists with id "a1b2c3d4-e5f6-7890-abcd-ef1234567890"': {
    setup: async () => {
      return {
        orderId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        status: 'APPROVED',
        version: 4,
        makerId: 'maker01',
        checkerId: 'checker01',
        approverId: 'approver01',
      };
    },
  },

  'a signed payment order exists with id "a1b2c3d4-e5f6-7890-abcd-ef1234567890"': {
    setup: async () => {
      return {
        orderId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        status: 'SIGNED',
        version: 5,
      };
    },
  },

  'a sent payment order exists with id "a1b2c3d4-e5f6-7890-abcd-ef1234567890"': {
    setup: async () => {
      return {
        orderId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        status: 'SENT',
        version: 6,
      };
    },
  },

  'a confirmed payment order exists with id "a1b2c3d4-e5f6-7890-abcd-ef1234567890"': {
    setup: async () => {
      return {
        orderId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        status: 'CONFIRMED',
        version: 7,
      };
    },
  },

  'a posted payment order exists with id "a1b2c3d4-e5f6-7890-abcd-ef1234567890"': {
    setup: async () => {
      return {
        orderId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        status: 'POSTED',
        version: 8,
        glVoucherNo: 'GL-2026-001234',
      };
    },
  },

  'a send_failed payment order exists with id "a1b2c3d4-e5f6-7890-abcd-ef1234567890"': {
    setup: async () => {
      return {
        orderId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        status: 'SEND_FAILED',
        version: 7,
      };
    },
  },

  'no payment order exists with id "00000000-0000-0000-0000-000000000000"': {
    setup: async () => {
      return { notFound: true };
    },
  },

  'sufficient account balance exists': {
    setup: async () => {
      return {
        accountNumber: '011010010001',
        balance: 1000000000,
        holdAmount: 0,
        availableBalance: 1000000000,
      };
    },
  },

  'insufficient account balance': {
    setup: async () => {
      return {
        accountNumber: '011010010001',
        balance: 300000000,
        holdAmount: 0,
        availableBalance: 300000000,
      };
    },
  },

  // ==========================================================================
  // Audit Trail
  // ==========================================================================

  'payment order "a1b2c3d4-e5f6-7890-abcd-ef1234567890" has audit trail entries': {
    setup: async () => {
      return {
        orderId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        auditEntries: [
          {
            action: 'CREATE',
            userId: 'maker01',
            timestamp: '2026-05-10T08:30:00.000+07:00',
          },
          {
            action: 'SUBMIT',
            userId: 'maker01',
            timestamp: '2026-05-10T09:00:00.000+07:00',
          },
          {
            action: 'APPROVE_CHECK',
            userId: 'checker01',
            timestamp: '2026-05-10T09:30:00.000+07:00',
          },
        ],
      };
    },
  },

  // ==========================================================================
  // Reference Data
  // ==========================================================================

  'reference data channels exist': {
    setup: async () => {
      return {
        channels: [
          { code: 'LNH', name: 'Lien ngan hang', description: 'Kenh NHNN/CITAD', status: 'ACTIVE' },
          { code: 'SP', name: 'Song phuong', description: 'Kenh NHTM', status: 'ACTIVE' },
          { code: 'LKB', name: 'Lien kho bac', description: 'Kenh KBNN', status: 'ACTIVE' },
        ],
      };
    },
  },

  'COA segment data exists': {
    setup: async () => {
      return { hasSegments: true };
    },
  },

  // ==========================================================================
  // Validation Scenarios
  // ==========================================================================

  'a payment order with duplicate request number exists': {
    setup: async () => {
      return {
        duplicateRequestNumber: '10052026000001',
        existingOrderId: 'existing-order-001',
      };
    },
  },

  'the payment order version is stale (optimistic lock conflict)': {
    setup: async () => {
      return {
        orderId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        clientVersion: 3,
        serverVersion: 4,
      };
    },
  },
};

export default providerStates;
