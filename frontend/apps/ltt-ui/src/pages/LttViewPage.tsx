import { useParams, useNavigate, Link } from 'react-router-dom';
import LttStatusBadge from '../components/LttStatusBadge';
import type { LttDetail } from '../api/lttApi';

// ---------------------------------------------------------------------------
// Stub data — remove once API integration is complete
// ---------------------------------------------------------------------------
const STUB_DETAIL: LttDetail = {
  id: '1',
  lttCode: 'LTT-2026-0001',
  channel: 'INTERNAL',
  status: 'DRAFT',
  senderName: 'Nguyen Van A',
  senderAccount: '001234567890',
  senderBank: 'Kho Bac Nha nuoc',
  senderBranch: 'Ha Noi',
  receiverName: 'Tran Thi B',
  receiverAccount: '009876543210',
  receiverBank: 'Kho Bac Nha nuoc',
  receiverBranch: 'TP.HCM',
  currency: 'VND',
  amount: 100_000_000,
  valueDate: '2026-05-18',
  description: 'Thanh toan khoan vay quoc te',
  paymentPurpose: 'Thanh toan von va lai',
  createdAt: '2026-05-18T08:00:00Z',
  createdBy: 'admin',
};

type ViewTab = 'detail' | 'attachments' | 'history' | 'approval';

export default function LttViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // TODO: fetch real data via getLtt(id)
  const data = STUB_DETAIL;

  const tabs: { key: ViewTab; label: string }[] = [
    { key: 'detail', label: 'Chi tiet' },
    { key: 'attachments', label: 'Dinh kem' },
    { key: 'history', label: 'Lich su' },
    { key: 'approval', label: 'Trang thai phe duyet' },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Lenh Thanh Toan: {data.lttCode}
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

      {/* Action Bar */}
      <div className="flex gap-2">
        <Link
          to={`/${id}/edit`}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Chinh sua
        </Link>
        <button
          type="button"
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Copy
        </button>
        <button
          type="button"
          className="rounded-md border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100"
        >
          Trinh duyet
        </button>
        <button
          type="button"
          className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
        >
          Xoa
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className="whitespace-nowrap border-b-2 border-transparent px-1 pb-3 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Detail Content (default tab) */}
      <div className="space-y-6">
        {/* General Info */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Thong tin chung
          </h2>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Ma LTT</dt>
              <dd className="mt-1 text-sm text-gray-900">{data.lttCode}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Kenh</dt>
              <dd className="mt-1 text-sm text-gray-900">{data.channel}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Loai tien</dt>
              <dd className="mt-1 text-sm text-gray-900">{data.currency}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">So tien</dt>
              <dd className="mt-1 text-sm font-semibold text-gray-900">
                {data.amount.toLocaleString()} {data.currency}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Ngay hach toan
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{data.valueDate}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Muc dich thanh toan
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {data.paymentPurpose ?? '-'}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Mo ta</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {data.description ?? '-'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Sender Info */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Thong tin nguoi gui
          </h2>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Ten nguoi gui
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {data.senderName}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">So TK gui</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {data.senderAccount}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Ngan hang gui
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {data.senderBank ?? '-'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Chi nhanh gui
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {data.senderBranch ?? '-'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Receiver Info */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Thong tin nguoi nhan
          </h2>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Ten nguoi nhan
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {data.receiverName}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">So TK nhan</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {data.receiverAccount}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Ngan hang nhan
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {data.receiverBank ?? '-'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Chi nhanh nhan
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {data.receiverBranch ?? '-'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Audit Info */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Thong tin he thong
          </h2>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Ngay tao</dt>
              <dd className="mt-1 text-sm text-gray-900">{data.createdAt}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Nguoi tao</dt>
              <dd className="mt-1 text-sm text-gray-900">{data.createdBy}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
