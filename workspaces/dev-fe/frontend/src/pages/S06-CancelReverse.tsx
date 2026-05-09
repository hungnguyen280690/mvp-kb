// ============================================================================
// S06 — Man hinh huy/dao but toan LTT
// Cancel form for DRAFT/SUBMITTED, Reverse form for POSTED
// Confirmation step
// ============================================================================

import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { getPaymentOrder, cancelPaymentOrder, reversePaymentOrder } from '@/lib/api-client';
import { useAuth } from '@/auth';
import { useNotification } from '@/lib/notification-context';
import { LttState } from '@/types';
import type { PaymentOrder } from '@/types';

export function S06CancelReverse() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { notify } = useNotification();

  const [mode, setMode] = useState<'cancel' | 'reverse'>('cancel');
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lttData, setLttData] = useState<PaymentOrder | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Load LTT data
  React.useEffect(() => {
    if (!id) return;
    setLoading(true);
    getPaymentOrder(id)
      .then(({ data }) => {
        setLttData(data);
        // Determine mode based on status
        if (data.status === LttState.POSTED) {
          setMode('reverse');
        } else {
          setMode('cancel');
        }
      })
      .catch((error: unknown) => {
        const err = error as { message?: string };
        notify('error', err.message || 'Loi tai du lieu');
      })
      .finally(() => setLoading(false));
  }, [id, notify]);

  const handleSubmit = useCallback(() => {
    if (reason.length < 10) {
      notify('error', 'Vui long nhap ly do toi thieu 10 ky tu (VAL-030)');
      return;
    }
    setShowConfirm(true);
  }, [reason, notify]);

  const handleConfirm = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      if (mode === 'cancel') {
        await cancelPaymentOrder(id, { reason });
        notify('success', 'Huy LTT thanh cong');
      } else {
        await reversePaymentOrder(id, { reason });
        notify('success', 'Tao but toan dao thanh cong');
      }
      navigate('/');
    } catch (error: unknown) {
      const err = error as { message?: string };
      notify('error', err.message || 'Loi thuc hien thao tac');
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  }, [id, mode, reason, notify, navigate]);

  if (loading && !lttData) {
    return <LoadingSpinner size="lg" message={t('app.loading')} />;
  }

  const isCancelMode = mode === 'cancel';
  const isValid = reason.length >= 10 && confirmed;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700" aria-label={t('app.back')}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl font-semibold text-gray-900">
          {isCancelMode ? t('s06.cancelTitle') : t('s06.reverseTitle')}
        </h2>
      </div>

      {/* Warning */}
      <div className={`p-4 rounded-lg border ${
        isCancelMode ? 'bg-yellow-50 border-yellow-200' : 'bg-purple-50 border-purple-200'
      }`}>
        <p className={`text-sm font-medium ${isCancelMode ? 'text-yellow-800' : 'text-purple-800'}`}>
          {isCancelMode ? t('s06.cancelWarning') : t('s06.reverseWarning')}
        </p>
        {lttData && (
          <div className="mt-2 text-sm text-gray-700">
            <p>So YCTT: <strong>{lttData.requestNumber}</strong></p>
            <p>So tien: <strong>{lttData.amount.toLocaleString('vi-VN')} {lttData.currency}</strong></p>
            <p>Trang thai: <strong>{lttData.status}</strong></p>
          </div>
        )}
      </div>

      {/* Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        {/* Step 1: Reason */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">{t('s06.confirmationStep')}</h4>
          <label htmlFor="s06-reason" className="block text-sm font-medium text-gray-700 mb-1">
            {t('s06.reasonLabel')} *
          </label>
          <textarea
            id="s06-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
            rows={4}
            maxLength={500}
            placeholder={t('s06.reasonPlaceholder')}
          />
          <p className="mt-1 text-xs text-gray-500">{reason.length}/500 ky tu</p>
        </div>

        {/* File upload */}
        <div>
          <label htmlFor="s06-attachment" className="block text-sm font-medium text-gray-700 mb-1">
            {t('s06.attachLabel')}
          </label>
          <input
            id="s06-attachment"
            type="file"
            accept=".pdf,.jpg,.png,.docx"
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
          <p className="mt-1 text-xs text-gray-500">{t('s06.attachHint')}</p>
        </div>

        {/* Confirmation checkbox */}
        <div className="border-t border-gray-200 pt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">
              Toi xac nhan {isCancelMode ? 'huy' : 'tao but toan dao'} LTT nay
            </span>
          </label>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {t('s06.cancelTitle') && 'Quay lai'}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || loading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50 ${
              isCancelMode
                ? 'bg-danger-600 hover:bg-danger-700'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {isCancelMode ? t('s06.confirmCancel') : t('s06.confirmReverse')}
          </button>
        </div>
      </div>

      {/* Final confirmation dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        title={isCancelMode ? t('s06.confirmCancel') : t('s06.confirmReverse')}
        message={
          <div>
            <p>Ban co chac chan muon {isCancelMode ? 'huy' : 'tao but toan dao cho'} LTT nay?</p>
            {lttData && (
              <p className="mt-2">
                <strong>{lttData.requestNumber}</strong> — {lttData.amount.toLocaleString('vi-VN')} {lttData.currency}
              </p>
            )}
          </div>
        }
        variant={isCancelMode ? 'danger' : 'warning'}
        confirmLabel="Xac nhan"
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
