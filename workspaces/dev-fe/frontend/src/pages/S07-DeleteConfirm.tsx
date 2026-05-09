// ============================================================================
// S07 — Popup xac nhan Xoa LTT (Draft)
// Two-step confirmation: Reason + Checkbox
// ============================================================================

import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { deleteConfirmSchema } from '@/lib/validation-rules';

interface S07DeleteConfirmProps {
  isOpen: boolean;
  lttRequestNumber?: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function S07DeleteConfirm({ isOpen, lttRequestNumber, onConfirm, onCancel, loading }: S07DeleteConfirmProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2>(1);
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [errors, setErrors] = useState<{ reason?: string; confirmed?: string }>({});

  if (!isOpen) return null;

  const handleNext = () => {
    if (reason.length < 10) {
      setErrors({ reason: `Vui long nhap ly do toi thieu 10 ky tu (VAL-030)` });
      return;
    }
    setErrors({});
    setStep(2);
  };

  const handleConfirm = () => {
    const result = deleteConfirmSchema.safeParse({ reason, confirmed });
    if (!result.success) {
      const fieldErrors: { reason?: string; confirmed?: string } = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        if (field === 'reason') fieldErrors.reason = err.message;
        if (field === 'confirmed') fieldErrors.confirmed = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    onConfirm(reason);
  };

  const handleClose = () => {
    setStep(1);
    setReason('');
    setConfirmed(false);
    setErrors({});
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleClose} aria-hidden="true" />

      {/* Dialog */}
      <div
        className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 z-10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
      >
        <h3 id="delete-dialog-title" className="text-lg font-semibold text-danger-700 mb-2">
          {t('s07.title')}
        </h3>

        {lttRequestNumber && (
          <p className="text-sm text-gray-600 mb-4">
            LTT: <strong>{lttRequestNumber}</strong>
          </p>
        )}

        {/* Warning */}
        <div className="bg-danger-50 border border-danger-200 rounded-md p-3 mb-4">
          <p className="text-sm text-danger-700">{t('s07.warning')}</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-4">
          <div className={`flex items-center gap-1 ${step >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>1</span>
            <span className="text-xs font-medium">{t('s07.step1')}</span>
          </div>
          <div className="flex-1 h-px bg-gray-300" />
          <div className={`flex items-center gap-1 ${step >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>2</span>
            <span className="text-xs font-medium">{t('s07.step2')}</span>
          </div>
        </div>

        {step === 1 && (
          <>
            {/* Step 1: Reason */}
            <div className="mb-4">
              <label htmlFor="delete-reason" className="block text-sm font-medium text-gray-700 mb-1">
                {t('s07.reasonLabel')} *
              </label>
              <textarea
                id="delete-reason"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (e.target.value.length >= 10) {
                    setErrors((prev) => ({ ...prev, reason: undefined }));
                  }
                }}
                className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500 ${
                  errors.reason ? 'border-danger-500 bg-danger-50' : 'border-gray-300'
                }`}
                rows={3}
                maxLength={500}
                placeholder={t('s07.reasonPlaceholder')}
                autoFocus
              />
              <div className="flex items-center justify-between mt-1">
                {errors.reason && <p className="text-xs text-danger-500">{errors.reason}</p>}
                <span className={`text-xs ml-auto ${reason.length < 10 ? 'text-danger-500' : 'text-gray-500'}`}>
                  {reason.length}/500
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {t('s07.cancelDelete')}
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={reason.length < 10}
                className="px-4 py-2 text-sm font-medium text-white bg-danger-600 rounded-md hover:bg-danger-700 disabled:opacity-50"
              >
                Tiep theo
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            {/* Step 2: Confirm */}
            <div className="mb-4">
              <p className="text-sm text-gray-700 mb-2">
                Ly do xoa: <strong>{reason}</strong>
              </p>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => {
                    setConfirmed(e.target.checked);
                    if (e.target.checked) {
                      setErrors((prev) => ({ ...prev, confirmed: undefined }));
                    }
                  }}
                  className="rounded border-gray-300 text-danger-600 focus:ring-danger-500 mt-0.5"
                />
                <span className="text-sm text-gray-700">{t('s07.confirmLabel')}</span>
              </label>
              {errors.confirmed && <p className="mt-1 text-xs text-danger-500">{errors.confirmed}</p>}
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Quay lai
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!confirmed || loading}
                className="px-4 py-2 text-sm font-medium text-white bg-danger-600 rounded-md hover:bg-danger-700 disabled:opacity-50"
              >
                {loading ? t('app.saving') : t('s07.confirmDelete')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
