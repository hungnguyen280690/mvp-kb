// ============================================================================
// S03 — Man hinh xem chi tiet LTT
// Read-only view + Audit trail + Action buttons
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { StatusBadge } from '@/components/payment/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { CoaGrid } from '@/components/payment/CoaGrid';
import { ApprovalActions } from '@/components/approval/ApprovalActions';
import { getPaymentOrder, getAuditTrail, approvePaymentOrder, rejectPaymentOrder, cancelPaymentOrder, reversePaymentOrder } from '@/lib/api-client';
import { useAuth } from '@/auth';
import { useNotification } from '@/lib/notification-context';
import { EDITABLE_STATES, UserRole } from '@/types';
import { formatAmount, formatDate, formatDateTime, maskAccountNumber } from '@/lib/utils';
import type { PaymentOrder, AuditEntry } from '@/types';

export function S03PaymentOrderDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify } = useNotification();

  const [data, setData] = useState<PaymentOrder | null>(null);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'detail' | 'audit'>('detail');

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [{ data: orderData }] = await Promise.all([
        getPaymentOrder(id),
      ]);
      setData(orderData);

      // Load audit trail
      try {
        const auditResponse = await getAuditTrail(id);
        setAuditEntries(auditResponse.content);
      } catch {
        // Audit trail is optional
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      notify('error', err.message || 'Loi tai du lieu');
    } finally {
      setLoading(false);
    }
  }, [id, notify]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = useCallback(async (orderId: string) => {
    try {
      await approvePaymentOrder(orderId);
      notify('success', 'Phe duyet thanh cong');
      fetchData();
    } catch (error: unknown) {
      const err = error as { message?: string };
      notify('error', err.message || 'Loi phe duyet');
    }
  }, [notify, fetchData]);

  const handleReject = useCallback(async (orderId: string, reason: string) => {
    try {
      const result = await rejectPaymentOrder(orderId, { reason });
      setData(result);
      notify('success', 'Tu choi thanh cong');
      fetchData();
    } catch (error: unknown) {
      const err = error as { message?: string };
      notify('error', err.message || 'Loi tu choi');
    }
  }, [notify, fetchData]);

  const handleCancel = useCallback(async (orderId: string, reason: string) => {
    try {
      const result = await cancelPaymentOrder(orderId, { reason });
      setData(result);
      notify('success', 'Huy thanh cong');
      fetchData();
    } catch (error: unknown) {
      const err = error as { message?: string };
      notify('error', err.message || 'Loi huy');
    }
  }, [notify, fetchData]);

  const handleReverse = useCallback(async (orderId: string, reason: string) => {
    try {
      await reversePaymentOrder(orderId, { reason });
      notify('success', 'Tao but toan dao thanh cong');
      navigate('/');
    } catch (error: unknown) {
      const err = error as { message?: string };
      notify('error', err.message || 'Loi tao but toan dao');
    }
  }, [notify, navigate]);

  if (loading) {
    return <LoadingSpinner size="lg" message={t('app.loading')} />;
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Khong tim thay LTT</p>
        <button onClick={() => navigate('/')} className="mt-4 text-primary-600 hover:underline">
          {t('app.back')}
        </button>
      </div>
    );
  }

  const canEdit = user && EDITABLE_STATES.includes(data.status as LttState) && data.makerId === user.userId && user.role === UserRole.MAKER;
  const canClone = user?.role === UserRole.MAKER;

  const infoClass = 'text-sm text-gray-900';
  const labelClass = 'text-sm font-medium text-gray-500';

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-700" aria-label={t('app.back')}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-semibold text-gray-900">
            {t('s03.title')} — {data.requestNumber}
          </h2>
          <StatusBadge status={data.status} size="md" />
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={() => navigate(`/payment-orders/${data.id}/edit?mode=edit`)}
              className="px-4 py-2 text-sm font-medium text-primary-600 border border-primary-300 rounded-md hover:bg-primary-50"
            >
              {t('app.edit')}
            </button>
          )}
          {canClone && (
            <button
              onClick={() => navigate(`/payment-orders/new?cloneFrom=${data.id}`)}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {t('app.clone')}
            </button>
          )}
          {/* Approval actions */}
          <ApprovalActions
            paymentOrderId={data.id}
            status={data.status}
            makerId={data.makerId}
            onApprove={handleApprove}
            onReject={handleReject}
            onCancel={handleCancel}
            onReverse={handleReverse}
          />
        </div>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'detail'}
            onClick={() => setActiveTab('detail')}
            className={`py-2 text-sm font-medium border-b-2 ${
              activeTab === 'detail'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('s03.sections.general')}
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'audit'}
            onClick={() => setActiveTab('audit')}
            className={`py-2 text-sm font-medium border-b-2 ${
              activeTab === 'audit'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('s03.sections.audit')}
          </button>
        </nav>
      </div>

      {/* Detail tab */}
      {activeTab === 'detail' && (
        <div className="space-y-6">
          {/* General info */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('s03.sections.general')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div><span className={labelClass}>{t('s02.fields.requestNumber')}:</span> <span className={infoClass}>{data.requestNumber}</span></div>
              <div><span className={labelClass}>{t('s02.fields.channel')}:</span> <span className={infoClass}>{data.channel}</span></div>
              <div><span className={labelClass}>{t('s02.fields.orderType')}:</span> <span className={infoClass}>{data.orderType}</span></div>
              <div><span className={labelClass}>{t('s02.fields.senderBankCode')}:</span> <span className={infoClass}>{data.senderBankName} ({data.senderBankCode})</span></div>
              <div><span className={labelClass}>{t('s02.fields.receiverBankCode')}:</span> <span className={infoClass}>{data.receiverBankName} ({data.receiverBankCode})</span></div>
              <div><span className={labelClass}>{t('s02.fields.paymentDate')}:</span> <span className={infoClass}>{formatDate(data.paymentDate)}</span></div>
              <div><span className={labelClass}>{t('s02.fields.amount')}:</span> <span className={`${infoClass} font-bold`}>{formatAmount(data.amount, data.currency)}</span></div>
              <div><span className={labelClass}>{t('s02.fields.currency')}:</span> <span className={infoClass}>{data.currency}</span></div>
              {data.exchangeRate && <div><span className={labelClass}>{t('s02.fields.exchangeRate')}:</span> <span className={infoClass}>{data.exchangeRate}</span></div>}
              {data.transactionType && <div><span className={labelClass}>{t('s02.fields.transactionType')}:</span> <span className={infoClass}>{data.transactionType}</span></div>}
              {data.originalDocNo && <div><span className={labelClass}>{t('s02.fields.originalDocNo')}:</span> <span className={infoClass}>{data.originalDocNo}</span></div>}
              <div className="md:col-span-2 lg:col-span-3"><span className={labelClass}>{t('s02.fields.paymentContent')}:</span> <span className={infoClass}>{data.paymentContent}</span></div>
              <div><span className={labelClass}>{t('s02.fields.makerName')}:</span> <span className={infoClass}>{data.makerName}</span></div>
              <div><span className={labelClass}>{t('s02.fields.createdAt')}:</span> <span className={infoClass}>{formatDateTime(data.createdAt)}</span></div>
              {data.checkerName && <div><span className={labelClass}>Nguoi kiem soat:</span> <span className={infoClass}>{data.checkerName} ({formatDateTime(data.checkedAt!)})</span></div>}
              {data.approverName && <div><span className={labelClass}>Nguoi phe duyet:</span> <span className={infoClass}>{data.approverName} ({formatDateTime(data.approvedAt!)})</span></div>}
              {data.signedAt && <div><span className={labelClass}>Ngay ky so:</span> <span className={infoClass}>{formatDateTime(data.signedAt)}</span></div>}
              {data.rejectReason && <div className="md:col-span-2"><span className={labelClass}>Ly do tu choi:</span> <span className="text-sm text-danger-600">{data.rejectReason}</span></div>}
            </div>
          </div>

          {/* COA Grid (read-only) */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('s03.sections.lineItems')}</h3>
            <CoaGrid lineItems={data.lineItems} onChange={() => {}} readOnly />
          </div>

          {/* Sender info */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('s03.sections.sender')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div><span className={labelClass}>Ten:</span> <span className={infoClass}>{data.senderInfo.name}</span></div>
              <div><span className={labelClass}>Dia chi:</span> <span className={infoClass}>{data.senderInfo.address}</span></div>
              <div><span className={labelClass}>Tai khoan:</span> <span className={infoClass}>{maskAccountNumber(data.senderInfo.accountNumber)}</span></div>
              <div><span className={labelClass}>NH/KB:</span> <span className={infoClass}>{data.senderInfo.bankName} ({data.senderInfo.bankCode})</span></div>
              {data.senderInfo.identityDoc && <div><span className={labelClass}>Giay to:</span> <span className={infoClass}>{data.senderInfo.identityDoc}</span></div>}
              {data.senderInfo.tpcpCode && <div><span className={labelClass}>Ma TPCP:</span> <span className={infoClass}>{data.senderInfo.tpcpCode}</span></div>}
            </div>
          </div>

          {/* Receiver info */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('s03.sections.receiver')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div><span className={labelClass}>Ten:</span> <span className={infoClass}>{data.receiverInfo.name}</span></div>
              <div><span className={labelClass}>Tai khoan:</span> <span className={infoClass}>{maskAccountNumber(data.receiverInfo.accountNumber)}</span></div>
              <div><span className={labelClass}>Ten TK:</span> <span className={infoClass}>{data.receiverInfo.accountName}</span></div>
              <div><span className={labelClass}>NH/KB:</span> <span className={infoClass}>{data.receiverInfo.bankName} ({data.receiverInfo.bankCode})</span></div>
              {data.receiverInfo.address && <div><span className={labelClass}>Dia chi:</span> <span className={infoClass}>{data.receiverInfo.address}</span></div>}
            </div>
          </div>
        </div>
      )}

      {/* Audit tab */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('s03.audit.action')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('s03.audit.user')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('s03.audit.role')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('s03.audit.timestamp')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('s03.audit.fromStatus')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('s03.audit.toStatus')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('s03.audit.reason')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('s03.audit.version')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {auditEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{entry.action}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{entry.userName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{entry.userRole}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDateTime(entry.timestamp)}</td>
                  <td className="px-4 py-3">{entry.previousStatus ? <StatusBadge status={entry.previousStatus} /> : '-'}</td>
                  <td className="px-4 py-3">{entry.newStatus ? <StatusBadge status={entry.newStatus} /> : '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{entry.reason || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{entry.version ?? '-'}</td>
                </tr>
              ))}
              {auditEntries.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">{t('app.noData')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
