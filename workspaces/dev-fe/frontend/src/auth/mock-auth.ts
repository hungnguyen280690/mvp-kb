// ============================================================================
// Mock Auth — 3 mock users: Maker / Checker / Approver
// Sinh theo permissions.yaml (4 roles: MAKER, CHECKER, APPROVER, ADMIN)
// ============================================================================

import type { UserInfo } from '@/types';

export const MOCK_USERS: UserInfo[] = [
  {
    userId: 'USR001',
    userName: 'Nguyen Van A',
    role: 'MAKER',
    unitCode: 'KB001',
    unitName: 'KBNN Ha Noi',
    bankCode: '0700',
    bankName: 'KBNN Ha Noi',
  },
  {
    userId: 'USR002',
    userName: 'Tran Thi B',
    role: 'CHECKER',
    unitCode: 'KB001',
    unitName: 'KBNN Ha Noi',
    bankCode: '0700',
    bankName: 'KBNN Ha Noi',
  },
  {
    userId: 'USR003',
    userName: 'Le Van C',
    role: 'APPROVER',
    unitCode: 'KB001',
    unitName: 'KBNN Ha Noi',
    bankCode: '0700',
    bankName: 'KBNN Ha Noi',
  },
];

const AUTH_STORAGE_KEY = 'vdbas_auth_user';

/** Lay user hien tai tu localStorage */
export function getCurrentUser(): UserInfo | null {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as UserInfo;
    }
  } catch {
    // ignore
  }
  return null;
}

/** Dang nhap voi mock user */
export function loginAs(role: string): UserInfo {
  const user = MOCK_USERS.find((u) => u.role === role);
  if (!user) {
    throw new Error(`Khong tim thay mock user voi role: ${role}`);
  }
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  return user;
}

/** Dang xuat */
export function logout(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

/** Kiem tra da dang nhap */
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

/** Kiem tra quyen */
export function hasPermission(user: UserInfo, permission: string): boolean {
  const ROLE_PERMISSIONS: Record<string, string[]> = {
    MAKER: [
      'TT_OUT_MANUAL_VIEW',
      'TT_OUT_MANUAL_SEARCH',
      'TT_OUT_MANUAL_VIEW_DETAIL',
      'TT_OUT_MANUAL_CREATE',
      'TT_OUT_MANUAL_EDIT_DRAFT',
      'TT_OUT_MANUAL_EDIT_RETURNED',
      'TT_OUT_MANUAL_SAVE_DRAFT',
      'TT_OUT_MANUAL_SUBMIT',
      'TT_OUT_MANUAL_DELETE_DRAFT',
      'TT_OUT_MANUAL_COPY',
      'TT_OUT_MANUAL_ATTACH',
      'TT_OUT_MANUAL_PRINT',
    ],
    CHECKER: [
      'TT_OUT_MANUAL_VIEW',
      'TT_OUT_MANUAL_VIEW_DETAIL',
      'TT_OUT_MANUAL_SEARCH',
      'TT_OUT_MANUAL_APPROVE_CHECK',
      'TT_OUT_MANUAL_REJECT_CHECK',
      'TT_OUT_MANUAL_RESUBMIT_CHECK',
      'TT_OUT_MANUAL_PRINT',
    ],
    APPROVER: [
      'TT_OUT_MANUAL_VIEW',
      'TT_OUT_MANUAL_VIEW_DETAIL',
      'TT_OUT_MANUAL_SEARCH',
      'TT_OUT_MANUAL_APPROVE',
      'TT_OUT_MANUAL_REJECT',
      'TT_OUT_MANUAL_SIGN',
      'TT_OUT_MANUAL_SEND',
      'TT_OUT_MANUAL_CANCEL',
      'TT_OUT_MANUAL_RESEND',
      'TT_OUT_MANUAL_REVERSE',
      'TT_OUT_MANUAL_PRINT',
    ],
    ADMIN: [
      'TT_OUT_MANUAL_VIEW',
      'TT_OUT_MANUAL_VIEW_DETAIL',
      'TT_OUT_MANUAL_SEARCH',
      'TT_OUT_MANUAL_EXPORT',
      'TT_OUT_MANUAL_PRINT',
    ],
  };

  const permissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.includes(permission);
}
