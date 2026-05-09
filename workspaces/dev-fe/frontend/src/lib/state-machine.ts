// ============================================================================
// State Machine — client-side state transition validation
// Sinh tu states.yaml — preview truoc khi goi API
// ============================================================================

import { LttState, UserRole } from '@/types';

/** Dinh nghia transition */
interface Transition {
  event: string;
  from: LttState;
  to: LttState;
  allowedRoles: UserRole[];
}

/** Bang transition day du tu states.yaml */
const TRANSITIONS: Transition[] = [
  // DRAFT
  { event: 'SUBMIT', from: LttState.DRAFT, to: LttState.SUBMITTED, allowedRoles: [UserRole.MAKER] },
  { event: 'EDIT', from: LttState.DRAFT, to: LttState.DRAFT, allowedRoles: [UserRole.MAKER] },
  { event: 'DELETE', from: LttState.DRAFT, to: LttState.CANCELLED, allowedRoles: [UserRole.MAKER] },

  // SUBMITTED
  { event: 'APPROVE_CHECK', from: LttState.SUBMITTED, to: LttState.IN_CONTROL, allowedRoles: [UserRole.CHECKER] },
  { event: 'REJECT', from: LttState.SUBMITTED, to: LttState.RETURNED_TO_MAKER, allowedRoles: [UserRole.CHECKER] },

  // IN_CONTROL
  { event: 'APPROVE', from: LttState.IN_CONTROL, to: LttState.APPROVED, allowedRoles: [UserRole.APPROVER] },
  { event: 'REJECT', from: LttState.IN_CONTROL, to: LttState.RETURNED_TO_CHECKER, allowedRoles: [UserRole.APPROVER] },

  // RETURNED_TO_MAKER
  { event: 'SUBMIT', from: LttState.RETURNED_TO_MAKER, to: LttState.SUBMITTED, allowedRoles: [UserRole.MAKER] },
  { event: 'EDIT', from: LttState.RETURNED_TO_MAKER, to: LttState.DRAFT, allowedRoles: [UserRole.MAKER] },
  { event: 'DELETE', from: LttState.RETURNED_TO_MAKER, to: LttState.CANCELLED, allowedRoles: [UserRole.MAKER] },

  // RETURNED_TO_CHECKER
  { event: 'SUBMIT', from: LttState.RETURNED_TO_CHECKER, to: LttState.IN_CONTROL, allowedRoles: [UserRole.CHECKER] },

  // APPROVED
  { event: 'SIGN', from: LttState.APPROVED, to: LttState.SIGNED, allowedRoles: [UserRole.APPROVER] },

  // SIGNED
  { event: 'SEND', from: LttState.SIGNED, to: LttState.SENT, allowedRoles: [UserRole.APPROVER] },
  { event: 'CANCEL', from: LttState.SIGNED, to: LttState.CANCELLED, allowedRoles: [UserRole.APPROVER] },

  // SENT (chi he thong xu ly callback)
  // SEND_FAILED
  { event: 'RESEND', from: LttState.SEND_FAILED, to: LttState.SIGNED, allowedRoles: [UserRole.APPROVER] },
  { event: 'CANCEL', from: LttState.SEND_FAILED, to: LttState.CANCELLED, allowedRoles: [UserRole.APPROVER] },

  // POSTED
  { event: 'REVERSE', from: LttState.POSTED, to: LttState.REVERSED, allowedRoles: [UserRole.APPROVER] },
];

/** Kiem tra transition co hop le khong */
export function canTransition(
  currentStatus: LttState,
  event: string,
  userRole: UserRole
): boolean {
  return TRANSITIONS.some(
    (t) =>
      t.from === currentStatus &&
      t.event === event &&
      t.allowedRoles.includes(userRole)
  );
}

/** Lay trang thai tiep theo */
export function getNextState(
  currentStatus: LttState,
  event: string
): LttState | null {
  const transition = TRANSITIONS.find(
    (t) => t.from === currentStatus && t.event === event
  );
  return transition ? transition.to : null;
}

/** Lay danh sach action duoc phep cho trang thai + vai tro */
export function getAllowedActions(
  currentStatus: LttState,
  userRole: UserRole
): string[] {
  return TRANSITIONS
    .filter(
      (t) => t.from === currentStatus && t.allowedRoles.includes(userRole)
    )
    .map((t) => t.event);
}

/** Kiem tra trang thai co phai final khong */
export function isFinalState(status: LttState): boolean {
  return [LttState.POSTED, LttState.CANCELLED, LttState.REVERSED].includes(status);
}

/** Kiem tra trang thai co cho phep sua khong */
export function isEditableState(status: LttState): boolean {
  return [LttState.DRAFT, LttState.RETURNED_TO_MAKER].includes(status);
}

/** Kiem tra trang thai co cho phep xoa khong */
export function isDeletableState(status: LttState): boolean {
  return [LttState.DRAFT, LttState.RETURNED_TO_MAKER].includes(status);
}
