// ============================================================================
// PaymentOrderFilter — filter bar for S01
// ============================================================================

import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { PaymentOrderListParams } from '@/types';

interface PaymentOrderFilterProps {
  onSearch: (params: PaymentOrderListParams) => void;
  onReset: () => void;
  loading?: boolean;
}

export function PaymentOrderFilter({ onSearch, onReset, loading }: PaymentOrderFilterProps) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<PaymentOrderListParams>({});

  const handleChange = useCallback(
    (field: keyof PaymentOrderListParams, value: string | number | undefined) => {
      setFilters((prev) => ({ ...prev, [field]: value || undefined }));
    },
    []
  );

  const handleSearch = useCallback(() => {
    onSearch(filters);
  }, [filters, onSearch]);

  const handleReset = useCallback(() => {
    setFilters({});
    onReset();
  }, [onReset]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    },
    [handleSearch]
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4" role="search" aria-label="Loc danh sach LTT">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Kenh */}
        <div>
          <label htmlFor="filter-channel" className="block text-sm font-medium text-gray-700 mb-1">
            {t('s01.filter.channel')}
          </label>
          <select
            id="filter-channel"
            value={filters.channel || ''}
            onChange={(e) => handleChange('channel', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
            data-testid="filter-channel"
          >
            <option value="">-- Tat ca --</option>
            <option value="LNH">LNH - Lien ngan hang</option>
            <option value="SP">SP - Song phuong</option>
            <option value="LKB">LKB - Lien kho bac</option>
          </select>
        </div>

        {/* Loai lenh */}
        <div>
          <label htmlFor="filter-orderType" className="block text-sm font-medium text-gray-700 mb-1">
            {t('s01.filter.orderType')}
          </label>
          <input
            id="filter-orderType"
            type="text"
            value={filters.orderType || ''}
            onChange={(e) => handleChange('orderType', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
            placeholder={t('s01.filter.orderType')}
          />
        </div>

        {/* Trang thai */}
        <div>
          <label htmlFor="filter-status" className="block text-sm font-medium text-gray-700 mb-1">
            {t('s01.filter.status')}
          </label>
          <select
            id="filter-status"
            value={filters.status || ''}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
            data-testid="filter-status"
          >
            <option value="">-- Tat ca --</option>
            <option value="DRAFT">Nhap</option>
            <option value="SUBMITTED">Cho kiem soat</option>
            <option value="IN_CONTROL">Cho phe duyet</option>
            <option value="RETURNED_TO_MAKER">Tra lai nguoi lap</option>
            <option value="RETURNED_TO_CHECKER">Tra lai kiem soat</option>
            <option value="APPROVED">Da phe duyet</option>
            <option value="SIGNED">Da ky so</option>
            <option value="SENT">Da gui</option>
            <option value="SEND_FAILED">Gui loi</option>
            <option value="CONFIRMED">Da xac nhan</option>
            <option value="POSTED">Da hach toan</option>
            <option value="CANCELLED">Da huy</option>
            <option value="REVERSED">Da dao</option>
            <option value="BLOCKED">Bi khoa</option>
          </select>
        </div>

        {/* Don vi */}
        <div>
          <label htmlFor="filter-unitCode" className="block text-sm font-medium text-gray-700 mb-1">
            {t('s01.filter.unitCode')}
          </label>
          <input
            id="filter-unitCode"
            type="text"
            value={filters.unitCode || ''}
            onChange={(e) => handleChange('unitCode', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
            placeholder={t('s01.filter.unitCode')}
          />
        </div>

        {/* Tu ngay */}
        <div>
          <label htmlFor="filter-dateFrom" className="block text-sm font-medium text-gray-700 mb-1">
            {t('s01.filter.dateFrom')}
          </label>
          <input
            id="filter-dateFrom"
            type="date"
            value={filters.paymentDateFrom || ''}
            onChange={(e) => handleChange('paymentDateFrom', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
            data-testid="filter-date-from"
          />
        </div>

        {/* Den ngay */}
        <div>
          <label htmlFor="filter-dateTo" className="block text-sm font-medium text-gray-700 mb-1">
            {t('s01.filter.dateTo')}
          </label>
          <input
            id="filter-dateTo"
            type="date"
            value={filters.paymentDateTo || ''}
            onChange={(e) => handleChange('paymentDateTo', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
            data-testid="filter-date-to"
          />
        </div>

        {/* So YCTT */}
        <div>
          <label htmlFor="filter-requestNumber" className="block text-sm font-medium text-gray-700 mb-1">
            {t('s01.filter.requestNumber')}
          </label>
          <input
            id="filter-requestNumber"
            type="text"
            value={filters.requestNumber || ''}
            onChange={(e) => handleChange('requestNumber', e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
            placeholder={t('s01.filter.requestNumber')}
          />
        </div>

        {/* NH chuyen */}
        <div>
          <label htmlFor="filter-senderBank" className="block text-sm font-medium text-gray-700 mb-1">
            {t('s01.filter.senderBankCode')}
          </label>
          <input
            id="filter-senderBank"
            type="text"
            value={filters.senderBankCode || ''}
            onChange={(e) => handleChange('senderBankCode', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* NH nhan */}
        <div>
          <label htmlFor="filter-receiverBank" className="block text-sm font-medium text-gray-700 mb-1">
            {t('s01.filter.receiverBankCode')}
          </label>
          <input
            id="filter-receiverBank"
            type="text"
            value={filters.receiverBankCode || ''}
            onChange={(e) => handleChange('receiverBankCode', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* So tien tu */}
        <div>
          <label htmlFor="filter-amountFrom" className="block text-sm font-medium text-gray-700 mb-1">
            {t('s01.filter.amountFrom')}
          </label>
          <input
            id="filter-amountFrom"
            type="number"
            value={filters.amountFrom ?? ''}
            onChange={(e) => handleChange('amountFrom', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
            min="0"
          />
        </div>

        {/* So tien den */}
        <div>
          <label htmlFor="filter-amountTo" className="block text-sm font-medium text-gray-700 mb-1">
            {t('s01.filter.amountTo')}
          </label>
          <input
            id="filter-amountTo"
            type="number"
            value={filters.amountTo ?? ''}
            onChange={(e) => handleChange('amountTo', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
            min="0"
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          {t('app.reset')}
        </button>
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
          data-testid="btn-search"
        >
          {loading ? t('app.loading') : t('app.search')}
        </button>
      </div>
    </div>
  );
}
