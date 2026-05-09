// ============================================================================
// CoaGrid — COA segment input grid for S02
// ============================================================================

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { LineItem } from '@/types';
import { createEmptyLineItem, calculateTotalAmount } from '@/lib/coa-validator';
import { formatAmount } from '@/lib/utils';

interface CoaGridProps {
  lineItems: LineItem[];
  onChange: (items: LineItem[]) => void;
  readOnly?: boolean;
  errors?: Record<string, string>;
}

export function CoaGrid({ lineItems, onChange, readOnly = false, errors }: CoaGridProps) {
  const { t } = useTranslation();

  const handleAddRow = useCallback(() => {
    onChange([...lineItems, createEmptyLineItem()]);
  }, [lineItems, onChange]);

  const handleRemoveRow = useCallback(
    (index: number) => {
      const newItems = lineItems.filter((_, i) => i !== index);
      onChange(newItems);
    },
    [lineItems, onChange]
  );

  const handleCellChange = useCallback(
    (index: number, field: keyof LineItem, value: string | number) => {
      const newItems = [...lineItems];
      newItems[index] = { ...newItems[index], [field]: value };
      onChange(newItems);
    },
    [lineItems, onChange]
  );

  const totalAmount = calculateTotalAmount(lineItems);

  const columns = [
    { key: 'fundCode', label: t('s02.fields.fundCode'), width: 'w-20', maxLength: 2 },
    { key: 'naturalAccount', label: t('s02.fields.naturalAccount'), width: 'w-24', maxLength: 4 },
    { key: 'dvqhns', label: t('s02.fields.dvqhns'), width: 'w-28', maxLength: 7 },
    { key: 'budgetLevel', label: t('s02.fields.budgetLevel'), width: 'w-20', maxLength: 1 },
    { key: 'chapter', label: t('s02.fields.chapter'), width: 'w-20', maxLength: 3 },
    { key: 'economicSector', label: t('s02.fields.economicSector'), width: 'w-20', maxLength: 3 },
    { key: 'ndkt', label: t('s02.fields.ndkt'), width: 'w-20', maxLength: 4 },
    { key: 'area', label: t('s02.fields.area'), width: 'w-24', maxLength: 5 },
    { key: 'program', label: t('s02.fields.program'), width: 'w-24', maxLength: 5 },
    { key: 'fundSource', label: t('s02.fields.fundSource'), width: 'w-20', maxLength: 2 },
    { key: 'treasuryCode', label: t('s02.fields.treasuryCode'), width: 'w-24', maxLength: 4 },
    { key: 'reserve', label: t('s02.fields.reserve'), width: 'w-20', maxLength: 3 },
    { key: 'description', label: t('s02.fields.itemDescription'), width: 'w-40', maxLength: 250 },
    { key: 'itemAmount', label: t('s02.fields.itemAmount'), width: 'w-32', isAmount: true },
  ] as const;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">
          {t('s02.groups.lineItems')}
        </h4>
        {!readOnly && (
          <button
            type="button"
            onClick={handleAddRow}
            className="px-3 py-1.5 text-sm font-medium text-primary-600 border border-primary-300 rounded-md hover:bg-primary-50"
            aria-label={t('s02.actions.addRow')}
          >
            + {t('s02.actions.addRow')}
          </button>
        )}
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200" role="table" aria-label="Luoi khoan muc COA">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-2 text-xs font-medium text-gray-500 w-10">STT</th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-2 py-2 text-xs font-medium text-gray-500 ${col.width}`}
                >
                  {col.label}
                </th>
              ))}
              {!readOnly && (
                <th className="px-2 py-2 text-xs font-medium text-gray-500 w-10"></th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {lineItems.map((item, index) => (
              <tr key={item.id || index} className="hover:bg-gray-50">
                <td className="px-2 py-1 text-xs text-gray-500 text-center">{index + 1}</td>
                {columns.map((col) => {
                  const key = col.key;
                  const value = item[key];
                  const cellError = errors?.[`lineItems.${index}.${key}`];

                  if (col.isAmount) {
                    return (
                      <td key={key} className={`px-2 py-1 ${col.width}`}>
                        {readOnly ? (
                          <span className="text-sm text-right block">
                            {formatAmount(value as number)}
                          </span>
                        ) : (
                          <input
                            type="number"
                            value={value as number || ''}
                            onChange={(e) =>
                              handleCellChange(index, key, e.target.value ? Number(e.target.value) : 0)
                            }
                            className={`w-full text-sm border rounded px-1 py-1 text-right ${
                              cellError ? 'border-danger-500 bg-danger-50' : 'border-gray-300'
                            }`}
                            min="0"
                            aria-label={`${col.label} dong ${index + 1}`}
                          />
                        )}
                      </td>
                    );
                  }

                  return (
                    <td key={key} className={`px-2 py-1 ${col.width}`}>
                      {readOnly ? (
                        <span className="text-sm">{String(value)}</span>
                      ) : (
                        <input
                          type="text"
                          value={String(value || '')}
                          onChange={(e) => handleCellChange(index, key, e.target.value)}
                          maxLength={col.maxLength}
                          className={`w-full text-sm border rounded px-1 py-1 ${
                            cellError ? 'border-danger-500 bg-danger-50' : 'border-gray-300'
                          }`}
                          aria-label={`${col.label} dong ${index + 1}`}
                        />
                      )}
                    </td>
                  );
                })}
                {!readOnly && (
                  <td className="px-2 py-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(index)}
                      className="text-danger-500 hover:text-danger-700 p-1"
                      title={t('s02.actions.removeRow')}
                      aria-label={`Xoa dong ${index + 1}`}
                      disabled={lineItems.length <= 1}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={13} className="px-4 py-2 text-sm font-medium text-right text-gray-700">
                {t('s02.totalLineItems', { total: '' }).split(':')[0]}:
              </td>
              <td className="px-4 py-2 text-sm font-bold text-right text-gray-900">
                {formatAmount(totalAmount)}
              </td>
              {!readOnly && <td></td>}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
