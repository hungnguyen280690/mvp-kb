import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LttStatusBadge from '../components/LttStatusBadge';
import type { LttDetail } from '../api/lttApi';

// ---------------------------------------------------------------------------
// Stub data — remove once API integration is complete
// ---------------------------------------------------------------------------
const STUB_DETAIL: LttDetail = {
  id: '2',
  lttCode: 'LTT-2026-0002',
  channel: 'SWIFT',
  status: 'PENDING_APPROVE',
  senderName: 'Le Van C',
  senderAccount: '001111222222',
  senderBank: 'Kho Bac Nha nuoc',
  senderBranch: 'Da Nang',
  receiverName: 'Pham Thi D',
  receiverAccount: '003333444444',
  receiverBank: 'Bank of America',
  receiverBranch: 'New York',
  currency: 'USD',
  amount: 50_000,
  valueDate: '2026-05-19',
  description: 'Thanh toan nhap khau thiet bi',
  paymentPurpose: 'Thanh toan hang hoa',
  createdAt: '2026-05-18T09:30:00Z',
  createdBy: 'teller1',
};

type ApproveAction = 'APPROVE' | 'RETURN' | 'REJECT';

export default function LttApprovePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // TODO: fetch real data via getLtt(id)
  const data = STUB_DETAIL;

  const [action, setAction] = useState<ApproveAction | null>(null);
  const [note, setNote] = useState('');

  const handleAction = () => {
    if (!action) return;
    // TODO: call approveLtt(id, { action, note }) API
    console.log('Approve action:', { id, action, note });
    navigate(-1);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Phe duyet Lenh Thanh Toan: {data.lttCode}
          </h1>
          <p className="mt-1 text-sm text-gray-500">ID: {id}</p>
        </div>
        <div className="flex items-center gap-3">
          <LttStatusBadge status={data.status} />
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            &larr; Quay lai
          </button>
        </div>
      </div>

      {/* Read-only Summary */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-blue-800">
          Thong tin lenh thanh toan
        </h2>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium text-blue-600">Ma LTT</dt>
            <dd className="mt-1 text-sm font-semibold text-blue-900">
              {data.lttCode}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-blue-600">Kenh</dt>
            <dd className="mt-1 text-sm text-blue-900">{data.channel}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-blue-600">Loai tien</dt>
            <dd className="mt-1 text-sm text-blue-900">{data.currency}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-blue-600">So tien</dt>
            <dd className="mt-1 text-sm font-bold text-blue-900">
              {data.amount.toLocaleString()} {data.currency}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-blue-600">Nguoi gui</dt>
            <dd className="mt-1 text-sm text-blue-900">{data.senderName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-blue-600">Nguoi nhan</dt>
            <dd className="mt-1 text-sm text-blue-900">{data.receiverName}</dd>
          </div>
          <div className="sm:col-span-3">
            <dt className="text-xs font-medium text-blue-600">Mo ta</dt>
            <dd className="mt-1 text-sm text-blue-900">
              {data.description ?? '-'}
            </dd>
          </div>
        </dl>
      </div>

      {/* Approval Actions */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          Thao tac phe duyet
        </h2>

        {/* Action Selection */}
        <div className="mb-4 flex gap-3">
          <button
            type="button"
            onClick={() => setAction('APPROVE')}
            className={`rounded-md border px-6 py-3 text-sm font-medium transition-colors ${
              action === 'APPROVE'
                ? 'border-green-600 bg-green-600 text-white'
                : 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
            }`}
          >
            Phe duyet
          </button>
          <button
            type="button"
            onClick={() => setAction('RETURN')}
            className={`rounded-md border px-6 py-3 text-sm font-medium transition-colors ${
              action === 'RETURN'
                ? 'border-orange-600 bg-orange-600 text-white'
                : 'border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100'
            }`}
          >
            Tra lai
          </button>
          <button
            type="button"
            onClick={() => setAction('REJECT')}
            className={`rounded-md border px-6 py-3 text-sm font-medium transition-colors ${
              action === 'REJECT'
                ? 'border-red-600 bg-red-600 text-white'
                : 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          >
            Tu choi
          </button>
        </div>

        {/* Note Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Y kien ghi chu
          </label>
          <textarea
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Nhap y kien..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Huy
          </button>
          <button
            type="button"
            disabled={!action}
            onClick={handleAction}
            className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Xac nhan
          </button>
        </div>
      </div>
    </div>
  );
}
