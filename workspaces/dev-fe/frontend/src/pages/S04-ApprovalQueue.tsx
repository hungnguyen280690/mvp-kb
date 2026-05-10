// ============================================================================
// S04 — Hang doi kiem soat/phe duyet
// List of LTT pending checker/approver action
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { PaymentOrderTable } from '@/components/payment/PaymentOrderTable';
import { Pagination } from '@/components/common/Pagination';
import { listPaymentOrders, approvePaymentOrder, rejectPaymentOrder } from '@/lib/api-client';
import { useAuth } from '@/auth';
import { useNotification } from '@/lib/notification-context';
import { UserRole } from '@/types';
import type { PaymentOrderSummary } from '@/types';

export function S04ApprovalQueue() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { notify } = useNotification();

  const [data, setData] = useState<PaymentOrderSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeQueue, setActiveQueue] = useState<'checker' | 'approver'>(
    user?.role === UserRole.CHECKER ? 'checker' : 'approver'
  );

  const fetchData = useCallback(
    async (page: number, size: number) => {
      setLoading(true);
      try {
        const status = activeQueue === 'checker' ? 'SUBMITTED' : 'IN_CONTROL';
        const response = await listPaymentOrders({
          page,
          size,
          sort: 'createdAt,asc',
          status,
        });
        setData(response.content);
        setTotalElements(response.page.totalElements);
        setTotalPages(response.page.totalPages);
        setCurrentPage(response.page.number);
      } catch (error: unknown) {
        const err = error as { message?: string };
        notify('error', err.message || t('app.networkError'));
      } finally {
        setLoading(false);
      }
    },
    [activeQueue, notify, t]
  );

  useEffect(() => {
    fetchData(currentPage, pageSize);
  }, [activeQueue]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApprove = useCallback(
    async (id: string) => {
      try {
        await approvePaymentOrder(id);
        notify('success', 'Phe duyet thanh cong');
        fetchData(currentPage, pageSize);
      } catch (error: unknown) {
        const err = error as { message?: string };
        notify('error', err.message || 'Loi phe duyet');
      }
    },
    [notify, fetchData, currentPage, pageSize]
  );

  const handleReject = useCallback(
    async (id: string, reason: string) => {
      try {
        await rejectPaymentOrder(id, { reason });
        notify('success', 'Tu choi thanh cong');
        fetchData(currentPage, pageSize);
      } catch (error: unknown) {
        const err = error as { message?: string };
        notify('error', err.message || 'Loi tu choi');
      }
    },
    [notify, fetchData, currentPage, pageSize]
  );

  const handleBatchApprove = useCallback(async () => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    let successCount = 0;
    let failCount = 0;
    for (const id of selectedIds) {
      try {
        await approvePaymentOrder(id);
        successCount++;
      } catch {
        failCount++;
      }
    }
    notify(
      successCount > 0 ? 'success' : 'error',
      `Phe duyet thanh cong: ${successCount}, that bai: ${failCount}`
    );
    setSelectedIds([]);
    fetchData(currentPage, pageSize);
    setLoading(false);
  }, [selectedIds, notify, fetchData, currentPage, pageSize]);

  const handlePageChange = useCallback(
    (page: number) => {
      fetchData(page, pageSize);
    },
    [fetchData, pageSize]
  );

  const handlePageSizeChange = useCallback(
    (size: number) => {
      fetchData(0, size);
    },
    [fetchData]
  );

  if (user?.role !== UserRole.CHECKER && user?.role !== UserRole.APPROVER) {
    return (
      <div className="text-center py-8 text-gray-500">
        Ban khong co quyen truy cap man hinh nay.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">{t('s04.title')}</h2>
        <div className="flex items-center gap-3">
          {/* Queue tab */}
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            <button
              onClick={() => setActiveQueue('checker')}
              className={`px-4 py-2 text-sm font-medium ${
                activeQueue === 'checker'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('s04.checkerQueue')}
            </button>
            <button
              onClick={() => setActiveQueue('approver')}
              className={`px-4 py-2 text-sm font-medium ${
                activeQueue === 'approver'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('s04.approverQueue')}
            </button>
          </div>

          {/* Batch approve */}
          {selectedIds.length > 0 && (
            <button
              onClick={handleBatchApprove}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-success-600 rounded-md hover:bg-success-700 disabled:opacity-50"
            >
              {t('s04.actions.batchApprove')} ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Data table */}
      <PaymentOrderTable
        data={data}
        loading={loading}
        onApprove={handleApprove}
        onReject={(id: string) => { handleReject(id, ''); }}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      {/* Pagination */}
      {data.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  );
}
