// ============================================================================
// PaymentOrderTable — data table for S01 and S04
// ============================================================================

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { PaymentOrderSummary } from '@/types';
import { UserRole } from '@/types';
import { StatusBadge } from './StatusBadge';
import { useAuth } from '@/auth';

/** Format currency */
function formatAmount(amount: number, currency: string = 'VND'): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Format date */
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

interface PaymentOrderTableProps {
  data: PaymentOrderSummary[];
  loading?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onCancel?: (id: string) => void;
  onClone?: (id: string) => void;
  onPrint?: (id: string) => void;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

export function PaymentOrderTable({
  data,
  loading,
  onEdit,
  onDelete,
  onApprove,
  onReject: _onReject,
  onCancel: _onCancel,
  onClone,
  onPrint: _onPrint,
  selectable,
  selectedIds = [],
  onSelectionChange,
}: PaymentOrderTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleRowClick = (id: string) => {
    navigate(`/payment-orders/${id}`);
  };

  const handleCheckboxChange = (id: string, checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
        {t('app.noData')}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200" role="table">
          <thead className="bg-gray-50">
            <tr>
              {selectable && (
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === data.length && data.length > 0}
                    onChange={(e) => {
                      if (onSelectionChange) {
                        onSelectionChange(e.target.checked ? data.map((d) => d.id) : []);
                      }
                    }}
                    className="rounded border-gray-300"
                    aria-label="Chon tat ca"
                  />
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('s01.table.requestNumber')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('s01.table.paymentDate')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('s01.table.channel')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('s01.table.orderType')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('s01.table.senderBank')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('s01.table.receiverBank')}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('s01.table.amount')}
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('s01.table.status')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('s01.table.makerName')}
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('s01.table.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleRowClick(item.id)}
                role="row"
                tabIndex={0}
                data-testid="ltt-row"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleRowClick(item.id);
                  }
                }}
              >
                {selectable && (
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={(e) => handleCheckboxChange(item.id, e.target.checked)}
                      className="rounded border-gray-300"
                      aria-label={`Chon LTT ${item.requestNumber}`}
                    />
                  </td>
                )}
                <td className="px-4 py-3 text-sm font-medium text-primary-600 whitespace-nowrap">
                  {item.requestNumber}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap" data-testid="row-payment-date">
                  {formatDate(item.paymentDate)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600" data-testid="row-channel">{item.channel}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{item.orderType}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{item.senderBankName || item.senderBankCode}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{item.receiverBankName || item.receiverBankCode}</td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium whitespace-nowrap">
                  {formatAmount(item.amount, item.currency)}
                </td>
                <td className="px-4 py-3 text-center" data-testid="row-status">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{item.makerName}</td>
                <td
                  className="px-4 py-3 text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1 justify-center">
                    {/* Role-based action buttons */}
                    {user?.role === UserRole.MAKER && (
                      <>
                        {onEdit && (item.status === 'DRAFT' || item.status === 'RETURNED_TO_MAKER') && (
                          <button
                            onClick={() => onEdit(item.id)}
                            className="text-primary-600 hover:text-primary-800 p-1"
                            title={t('s01.actions.edit')}
                            aria-label={`Sua LTT ${item.requestNumber}`}
                          >
                            <EditIcon />
                          </button>
                        )}
                        {onDelete && (item.status === 'DRAFT' || item.status === 'RETURNED_TO_MAKER') && (
                          <button
                            onClick={() => onDelete(item.id)}
                            className="text-danger-600 hover:text-danger-800 p-1"
                            title={t('s01.actions.delete')}
                            aria-label={`Xoa LTT ${item.requestNumber}`}
                          >
                            <DeleteIcon />
                          </button>
                        )}
                        {onClone && (
                          <button
                            onClick={() => onClone(item.id)}
                            className="text-gray-600 hover:text-gray-800 p-1"
                            title={t('s01.actions.copy')}
                            aria-label={`Sao chep LTT ${item.requestNumber}`}
                          >
                            <CopyIcon />
                          </button>
                        )}
                      </>
                    )}
                    {(user?.role === UserRole.CHECKER || user?.role === UserRole.APPROVER) && onApprove && (
                      <button
                        onClick={() => onApprove(item.id)}
                        className="text-success-600 hover:text-success-800 p-1"
                        title={t('s01.actions.approve')}
                        aria-label={`Phe duyet LTT ${item.requestNumber}`}
                      >
                        <CheckIcon />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Simple inline SVG icons
function EditIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
