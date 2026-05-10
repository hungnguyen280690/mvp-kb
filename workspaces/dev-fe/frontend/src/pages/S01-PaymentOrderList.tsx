// ============================================================================
// S01 — Man hinh tra cuu/danh sach LTT thu cong
// Filter bar + Data table with pagination + Actions
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { PaymentOrderFilter } from '@/components/payment/PaymentOrderFilter';
import { PaymentOrderTable } from '@/components/payment/PaymentOrderTable';
import { Pagination } from '@/components/common/Pagination';
import { listPaymentOrders, deletePaymentOrder } from '@/lib/api-client';
import { useNotification } from '@/lib/notification-context';
import type { PaymentOrderListParams, PaymentOrderSummary, DeleteRequest } from '@/types';

export function S01PaymentOrderList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { notify } = useNotification();

  const [data, setData] = useState<PaymentOrderSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentParams, setCurrentParams] = useState<PaymentOrderListParams>({});
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; version: number } | null>(null);

  const fetchData = useCallback(
    async (params: PaymentOrderListParams, page: number, size: number) => {
      setLoading(true);
      try {
        const response = await listPaymentOrders({
          ...params,
          page,
          size,
          sort: 'paymentDate,desc',
        });
        setData(response.content);
        setTotalElements(response.totalElements);
        setTotalPages(response.totalPages);
        setCurrentPage(response.number);
      } catch (error: unknown) {
        const err = error as { message?: string };
        notify('error', err.message || t('app.networkError'));
      } finally {
        setLoading(false);
      }
    },
    [notify, t]
  );

  useEffect(() => {
    fetchData(currentParams, currentPage, pageSize);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = useCallback(
    (params: PaymentOrderListParams) => {
      setCurrentParams(params);
      setCurrentPage(0);
      fetchData(params, 0, pageSize);
    },
    [fetchData, pageSize]
  );

  const handleReset = useCallback(() => {
    setCurrentParams({});
    setCurrentPage(0);
    fetchData({}, 0, pageSize);
  }, [fetchData, pageSize]);

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      fetchData(currentParams, page, pageSize);
    },
    [currentParams, fetchData, pageSize]
  );

  const handlePageSizeChange = useCallback(
    (size: number) => {
      setPageSize(size);
      setCurrentPage(0);
      fetchData(currentParams, 0, size);
    },
    [currentParams, fetchData]
  );

  const handleEdit = useCallback(
    (id: string) => {
      navigate(`/payment-orders/${id}/edit`);
    },
    [navigate]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const item = data.find((d) => d.id === id);
      if (item) {
        setDeleteTarget({ id, version: item.version });
      }
    },
    [data]
  );

  const handleDeleteConfirm = useCallback(
    async (reason: string) => {
      if (!deleteTarget) return;
      try {
        const request: DeleteRequest = { reason, confirmed: true };
        await deletePaymentOrder(deleteTarget.id, request, deleteTarget.version);
        notify('success', t('app.success'));
        setDeleteTarget(null);
        fetchData(currentParams, currentPage, pageSize);
      } catch (error: unknown) {
        const err = error as { message?: string };
        notify('error', err.message || t('app.error'));
      }
    },
    [deleteTarget, notify, t, fetchData, currentParams, currentPage, pageSize]
  );

  const handleClone = useCallback(
    (id: string) => {
      navigate(`/payment-orders/new?cloneFrom=${id}`);
    },
    [navigate]
  );

  const handleExport = useCallback(async () => {
    try {
      const allData: PaymentOrderSummary[] = [];
      let page = 0;
      let hasMore = true;
      while (hasMore) {
        const res = await listPaymentOrders({ ...currentParams, page, size: 100, sort: 'paymentDate,desc' });
        allData.push(...res.content);
        hasMore = res.content.length === 100 && allData.length < 10000;
        page++;
      }

      const rows = allData.map((item) => ({
        [t('s01.table.requestNumber')]: item.requestNumber,
        [t('s01.table.paymentDate')]: item.paymentDate ? new Date(item.paymentDate).toLocaleDateString('vi-VN') : '',
        [t('s01.table.channel')]: item.channel,
        [t('s01.table.orderType')]: item.orderType,
        [t('s01.table.senderBank')]: item.senderBankName || item.senderBankCode,
        [t('s01.table.receiverBank')]: item.receiverBankName || item.receiverBankCode,
        [t('s01.table.amount')]: item.amount,
        [t('s01.table.status')]: item.status,
        [t('s01.table.makerName')]: item.makerName,
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [{ wch: 20 }, { wch: 14 }, { wch: 8 }, { wch: 14 }, { wch: 20 }, { wch: 20 }, { wch: 18 }, { wch: 16 }, { wch: 20 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'LTT');
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([buf], { type: 'application/octet-stream' }), `LTT_${new Date().toISOString().slice(0, 10)}.xlsx`);
      notify('success', t('app.success'));
    } catch (error: unknown) {
      const err = error as { message?: string };
      notify('error', err.message || t('app.error'));
    }
  }, [currentParams, notify, t]);

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">{t('s01.title')}</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/payment-orders/new')}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
            data-testid="btn-create-ltt"
          >
            + {t('s01.actions.new')}
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {t('s01.actions.export')}
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <PaymentOrderFilter onSearch={handleSearch} onReset={handleReset} loading={loading} />

      {/* Data table */}
      <PaymentOrderTable
        data={data}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onClone={handleClone}
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

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <DeleteConfirmDialog
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

// Inline delete confirmation dialog component
function DeleteConfirmDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const isValid = reason.length >= 10 && confirmed;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onCancel} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 z-10" role="dialog" aria-modal="true">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('s07.title')}</h3>
        <p className="text-sm text-danger-600 mb-4">{t('s07.warning')}</p>

        <div className="mb-4">
          <label htmlFor="delete-reason" className="block text-sm font-medium text-gray-700 mb-1">
            {t('s07.reasonLabel')}
          </label>
          <textarea
            id="delete-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            rows={3}
            maxLength={500}
            placeholder={t('s07.reasonPlaceholder')}
          />
          <p className="mt-1 text-xs text-gray-500">{reason.length}/500</p>
        </div>

        <div className="mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">{t('s07.confirmLabel')}</span>
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {t('s07.cancelDelete')}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason)}
            disabled={!isValid}
            className="px-4 py-2 text-sm font-medium text-white bg-danger-600 rounded-md hover:bg-danger-700 disabled:opacity-50"
          >
            {t('s07.confirmDelete')}
          </button>
        </div>
      </div>
    </div>
  );
}
