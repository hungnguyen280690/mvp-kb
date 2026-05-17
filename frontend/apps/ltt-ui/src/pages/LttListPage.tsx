import { useState } from 'react';
import { Link } from 'react-router-dom';
import LttStatusBadge from '../components/LttStatusBadge';
import type { LttFilter, LttHeader } from '../api/lttApi';

// ---------------------------------------------------------------------------
// Stub data — remove once API integration is complete
// ---------------------------------------------------------------------------
const STUB_ROWS: LttHeader[] = [
  {
    id: '1',
    lttCode: 'LTT-2026-0001',
    channel: 'INTERNAL',
    status: 'DRAFT',
    senderName: 'Nguyen Van A',
    senderAccount: '001234567890',
    receiverName: 'Tran Thi B',
    receiverAccount: '009876543210',
    currency: 'VND',
    amount: 100_000_000,
    valueDate: '2026-05-18',
    createdAt: '2026-05-18T08:00:00Z',
    createdBy: 'admin',
  },
  {
    id: '2',
    lttCode: 'LTT-2026-0002',
    channel: 'SWIFT',
    status: 'PENDING_APPROVE',
    senderName: 'Le Van C',
    senderAccount: '001111222222',
    receiverName: 'Pham Thi D',
    receiverAccount: '003333444444',
    currency: 'USD',
    amount: 50_000,
    valueDate: '2026-05-19',
    createdAt: '2026-05-18T09:30:00Z',
    createdBy: 'teller1',
  },
];

export default function LttListPage() {
  const [filters, setFilters] = useState<LttFilter>({});

  const handleFilterChange = (
    field: keyof LttFilter,
    value: string | undefined,
  ) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Danh sach Lenh Thanh Toan
        </h1>
        <div className="flex gap-3">
          <Link
            to="/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Tao moi
          </Link>
          <button
            type="button"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Xuat file
          </button>
        </div>
      </div>

      {/* Filter Area */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Bo loc</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Channel */}
          <div>
            <label className="block text-xs font-medium text-gray-600">
              Kenh
            </label>
            <select
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={filters.channel ?? ''}
              onChange={(e) =>
                handleFilterChange(
                  'channel',
                  e.target.value || undefined,
                )
              }
            >
              <option value="">-- Tat ca --</option>
              <option value="INTERNAL">Noi bo</option>
              <option value="SWIFT">SWIFT</option>
              <option value="RTGS">RTGS</option>
              <option value="NAPAS">NAPAS</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-gray-600">
              Trang thai
            </label>
            <select
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={filters.status ?? ''}
              onChange={(e) =>
                handleFilterChange(
                  'status',
                  e.target.value || undefined,
                )
              }
            >
              <option value="">-- Tat ca --</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_CHECK">Cho kiem tra</option>
              <option value="PENDING_APPROVE">Cho phe duyet</option>
              <option value="APPROVED">Da phe duyet</option>
              <option value="REJECTED">Tu choi</option>
              <option value="RETURNED">Tra lai</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-xs font-medium text-gray-600">
              Tu ngay
            </label>
            <input
              type="date"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={filters.fromDate ?? ''}
              onChange={(e) =>
                handleFilterChange(
                  'fromDate',
                  e.target.value || undefined,
                )
              }
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">
              Den ngay
            </label>
            <input
              type="date"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={filters.toDate ?? ''}
              onChange={(e) =>
                handleFilterChange(
                  'toDate',
                  e.target.value || undefined,
                )
              }
            />
          </div>

          {/* Amount Range (simplified) */}
          <div>
            <label className="block text-xs font-medium text-gray-600">
              So tu khoa
            </label>
            <input
              type="text"
              placeholder="Ma LTT, ten..."
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={filters.keyword ?? ''}
              onChange={(e) =>
                handleFilterChange(
                  'keyword',
                  e.target.value || undefined,
                )
              }
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={() => setFilters({})}
          >
            Xoa bo loc
          </button>
          <button
            type="button"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Tim kiem
          </button>
        </div>
      </div>

      {/* Data Grid */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Ma LTT
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Kenh
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Trang thai
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Nguoi gui
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Nguoi nhan
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                So tien
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Ngay hach toan
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {STUB_ROWS.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  <Link
                    to={`/${row.id}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {row.lttCode}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                  {row.channel}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  <LttStatusBadge status={row.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                  {row.senderName}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                  {row.receiverName}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">
                  {row.amount.toLocaleString()} {row.currency}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                  {row.valueDate}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty State */}
        {STUB_ROWS.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            Khong co du lieu. Nhan &quot;Tao moi&quot; de tao lenh thanh toan.
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Hien thi <span className="font-medium">1</span> -{' '}
          <span className="font-medium">{STUB_ROWS.length}</span> tren tong so{' '}
          <span className="font-medium">{STUB_ROWS.length}</span> ban ghi
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            disabled
            className="rounded border border-gray-300 bg-white px-3 py-1 text-sm text-gray-400"
          >
            Truoc
          </button>
          <button
            type="button"
            className="rounded border border-blue-600 bg-blue-600 px-3 py-1 text-sm text-white"
          >
            1
          </button>
          <button
            type="button"
            disabled
            className="rounded border border-gray-300 bg-white px-3 py-1 text-sm text-gray-400"
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
}
