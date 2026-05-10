// ============================================================================
// ApprovalActions — action buttons for approval workflow
// ============================================================================

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserRole, LttState } from '@/types';
import { useAuth } from '@/auth';
import { canTransition } from '@/lib/state-machine';

interface ApprovalActionsProps {
  paymentOrderId: string;
  status: string;
  makerId: string;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  onSign?: (id: string) => Promise<void>;
  onSend?: (id: string) => Promise<void>;
  onCancel?: (id: string, reason: string) => Promise<void>;
  onReverse?: (id: string, reason: string) => Promise<void>;
}

export function ApprovalActions({
  paymentOrderId,
  status,
  makerId,
  onApprove,
  onReject,
  onSign,
  onSend,
  onCancel,
  onReverse,
}: ApprovalActionsProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const currentStatus = status as LttState;
  const role = user.role as UserRole;

  // SoD: Checker != Maker, Approver != Checker != Maker
  const isMakerOfThisLtt = user.userId === makerId;

  const canApprove = canTransition(currentStatus, 'APPROVE_CHECK', role) ||
                     canTransition(currentStatus, 'APPROVE', role);
  const canRejectAction = canTransition(currentStatus, 'REJECT', role);
  const canSignAction = onSign && canTransition(currentStatus, 'SIGN', role);
  const canSendAction = onSend && canTransition(currentStatus, 'SEND', role);
  const canCancelAction = onCancel && canTransition(currentStatus, 'CANCEL', role);
  const canReverseAction = onReverse && canTransition(currentStatus, 'REVERSE', role);

  // For Checker, check SoD
  const canCheckerApprove = role === UserRole.CHECKER && !isMakerOfThisLtt && canApprove;
  // For Approver, check SoD (simplified for frontend)
  const canApproverApprove = role === UserRole.APPROVER && canApprove;

  const handleApprove = async () => {
    setLoading(true);
    try {
      await onApprove(paymentOrderId);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (rejectReason.length < 10) return;
    setLoading(true);
    try {
      await onReject(paymentOrderId, rejectReason);
      setShowRejectDialog(false);
      setRejectReason('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {(canCheckerApprove || canApproverApprove) && (
          <button
            type="button"
            onClick={handleApprove}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-success-600 rounded-md hover:bg-success-700 disabled:opacity-50"
            data-testid="btn-approve"
          >
            {t('app.approve')}
          </button>
        )}

        {canRejectAction && !isMakerOfThisLtt && (
          <button
            type="button"
            onClick={() => setShowRejectDialog(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-danger-600 rounded-md hover:bg-danger-700"
            data-testid="btn-reject"
          >
            {t('app.reject')}
          </button>
        )}

        {canSignAction && (
          <button
            type="button"
            onClick={() => onSign?.(paymentOrderId)}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
            data-testid="btn-sign"
          >
            {t('app.sign')}
          </button>
        )}

        {canSendAction && (
          <button
            type="button"
            onClick={() => onSend?.(paymentOrderId)}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
            data-testid="btn-send"
          >
            {t('app.send')}
          </button>
        )}

        {canCancelAction && (
          <button
            type="button"
            onClick={() => onCancel?.(paymentOrderId, '')}
            className="px-4 py-2 text-sm font-medium text-white bg-danger-600 rounded-md hover:bg-danger-700"
            data-testid="btn-cancel"
          >
            {t('app.cancel')}
          </button>
        )}

        {canReverseAction && (
          <button
            type="button"
            onClick={() => onReverse?.(paymentOrderId, '')}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
            data-testid="btn-reverse"
          >
            {t('app.reverse')}
          </button>
        )}
      </div>

      {/* Reject dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowRejectDialog(false)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 z-10" role="dialog" aria-modal="true">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('s05.title')}</h3>
            <div className="mb-4">
              <label htmlFor="reject-reason" className="block text-sm font-medium text-gray-700 mb-1">
                {t('s05.reasonLabel')}
              </label>
              <textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                rows={4}
                maxLength={500}
                placeholder={t('s05.reasonPlaceholder')}
                aria-describedby="reject-reason-hint"
              />
              <p id="reject-reason-hint" className="mt-1 text-xs text-gray-500">
                {t('s05.reasonHint')} ({rejectReason.length}/500)
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRejectDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {t('s05.cancelReject')}
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                disabled={rejectReason.length < 10 || loading}
                className="px-4 py-2 text-sm font-medium text-white bg-danger-600 rounded-md hover:bg-danger-700 disabled:opacity-50"
              >
                {t('s05.confirmReject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
