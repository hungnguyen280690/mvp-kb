// ============================================================================
// S05 — Man hinh tu choi/tra lai (Dialog)
// Modal with required reason field, predefined reasons + free text
// ============================================================================

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { reasonSchema } from '@/lib/validation-rules';

interface S05RejectDialogProps {
  isOpen: boolean;
  lttRequestNumber?: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function S05RejectDialog({ isOpen, lttRequestNumber, onConfirm, onCancel, loading }: S05RejectDialogProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const predefinedReasons = t('s05.predefinedReasons', { returnObjects: true }) as string[];

  const handlePresetSelect = (preset: string) => {
    setSelectedPreset(preset);
    if (preset !== 'Khac (nhap ly do)') {
      setReason(preset);
    } else {
      setReason('');
    }
    setError('');
  };

  const handleSubmit = () => {
    const result = reasonSchema.safeParse({ reason });
    if (!result.success) {
      setError(result.error.errors[0]?.message || 'Ly do khong hop le');
      return;
    }
    onConfirm(reason);
  };

  const handleReasonChange = (value: string) => {
    setReason(value);
    setSelectedPreset('Khac (nhap ly do)');
    if (value.length >= 10) {
      setError('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onCancel} aria-hidden="true" />

      {/* Dialog */}
      <div
        className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6 z-10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-dialog-title"
      >
        <h3 id="reject-dialog-title" className="text-lg font-semibold text-gray-900 mb-2">
          {t('s05.title')}
        </h3>
        {lttRequestNumber && (
          <p className="text-sm text-gray-600 mb-4">
            LTT: <strong>{lttRequestNumber}</strong>
          </p>
        )}

        {/* Predefined reasons */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Ly do thuong gap:</p>
          <div className="space-y-2">
            {Array.isArray(predefinedReasons) && predefinedReasons.map((preset, index) => (
              <label key={index} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="preset-reason"
                  value={preset}
                  checked={selectedPreset === preset}
                  onChange={() => handlePresetSelect(preset)}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{preset}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Reason input */}
        <div className="mb-4">
          <label htmlFor="reject-reason-text" className="block text-sm font-medium text-gray-700 mb-1">
            {t('s05.reasonLabel')} *
          </label>
          <textarea
            id="reject-reason-text"
            value={reason}
            onChange={(e) => handleReasonChange(e.target.value)}
            className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500 ${
              error ? 'border-danger-500 bg-danger-50' : 'border-gray-300'
            }`}
            rows={4}
            maxLength={500}
            placeholder={t('s05.reasonPlaceholder')}
            aria-describedby="reject-reason-hint"
          />
          <div className="flex items-center justify-between mt-1">
            <p id="reject-reason-hint" className="text-xs text-gray-500">
              {t('s05.reasonHint')}
            </p>
            <span className={`text-xs ${reason.length < 10 ? 'text-danger-500' : 'text-gray-500'}`}>
              {reason.length}/500
            </span>
          </div>
          {error && <p className="mt-1 text-xs text-danger-500">{error}</p>}
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            {t('s05.cancelReject')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={reason.length < 10 || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-danger-600 rounded-md hover:bg-danger-700 disabled:opacity-50"
          >
            {loading ? t('app.saving') : t('s05.confirmReject')}
          </button>
        </div>
      </div>
    </div>
  );
}
