// ============================================================================
// Pagination component — phan trang voi chon so dong/trang
// ============================================================================

import React from 'react';
import { useTranslation } from 'react-i18next';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export function Pagination({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const { t } = useTranslation();

  if (totalPages <= 0) return null;

  const canPrevious = currentPage > 0;
  const canNext = currentPage < totalPages - 1;

  // Generate page numbers to show
  const getPageNumbers = (): number[] => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(0, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible);
    start = Math.max(0, end - maxVisible);
    for (let i = start; i < end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 border-t border-gray-200" role="navigation" aria-label="Phan trang">
      {/* Left: total info */}
      <div className="text-sm text-gray-600">
        {t('s01.pagination.total', { total: totalElements })}
      </div>

      {/* Center: page buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(0)}
          disabled={!canPrevious}
          className="px-2 py-1 text-sm rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          aria-label={t('pagination.first')}
        >
          {t('pagination.first')}
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canPrevious}
          className="px-2 py-1 text-sm rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          aria-label={t('pagination.previous')}
        >
          {t('pagination.previous')}
        </button>

        {getPageNumbers().map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1 text-sm rounded border ${
              page === currentPage
                ? 'bg-primary-600 text-white border-primary-600'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page + 1}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canNext}
          className="px-2 py-1 text-sm rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          aria-label={t('pagination.next')}
        >
          {t('pagination.next')}
        </button>
        <button
          onClick={() => onPageChange(totalPages - 1)}
          disabled={!canNext}
          className="px-2 py-1 text-sm rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          aria-label={t('pagination.last')}
        >
          {t('pagination.last')}
        </button>
      </div>

      {/* Right: page size selector */}
      <div className="flex items-center gap-2 text-sm">
        <label htmlFor="page-size" className="text-gray-600">{t('s01.pagination.size')}:</label>
        <select
          id="page-size"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="border border-gray-300 rounded px-2 py-1 text-sm"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
