import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PaymentOrderListItem, FilterState } from '../types';
import {
  transactionTypeLabels,
  formatNumber,
} from '../api/mockData';
import { useRole, MOCK_USER } from '../components/RoleContext';
import { usePaymentOrders } from '../api/usePaymentOrders';

// ===== STATUS BADGE =====
function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    DRAFT: 'bg-[#eef0f2] text-[#8a8f98]',
    READY_FOR_APPROVAL: 'bg-[#e7f0f9] text-[#0b5394]',
    PENDING_APPROVER: 'bg-[#fff4e2] text-[#b45309]',
    APPROVED: 'bg-[#e6f4ea] text-[#137333]',
    RETURNED_TO_MAKER: 'bg-[#fff4e2] text-[#b45309]',
    REJECTED: 'bg-[#fde7e7] text-[#c0392b]',
    DELETED: 'bg-[#eef0f2] text-[#8a8f98]',
  };
  const labelMap: Record<string, string> = {
    DRAFT: 'Draft',
    READY_FOR_APPROVAL: 'Ready_For_Approval',
    PENDING_APPROVER: 'Pending_Approver',
    APPROVED: 'Approved',
    RETURNED_TO_MAKER: 'Returned_To_Maker',
    REJECTED: 'Rejected',
    DELETED: 'Deleted',
  };
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold whitespace-nowrap ${colorMap[status] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {labelMap[status] ?? status}
    </span>
  );
}

// ===== ACTION BUTTONS =====
function ActionButtons({ order }: { order: PaymentOrderListItem }) {
  const navigate = useNavigate();
  const role = useRole();
  const { transitionStatus } = usePaymentOrders();
  const isEditableStatus = order.status === 'DRAFT' || order.status === 'RETURNED_TO_MAKER';

  return (
    <span className="inline-flex gap-1">
      {/* View */}
      <button
        type="button"
        className="w-[26px] h-[26px] border rounded flex items-center justify-center bg-white text-[#5f6368] hover:bg-[#e7f0f9] hover:text-[#0b5394] hover:border-[#c6d6e6] transition-colors"
        title="Xem (F3)"
        onClick={() => navigate(`/payment-orders/${order.id}`)}
      >
        <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
      {/* Edit */}
      {isEditableStatus && role.canEdit(order.createdBy) && (
        <button
          type="button"
          className="w-[26px] h-[26px] border rounded flex items-center justify-center bg-white text-[#5f6368] hover:bg-[#e7f0f9] hover:text-[#0b5394] hover:border-[#c6d6e6] transition-colors"
          title="Sua (F2)"
          onClick={() => navigate(`/payment-orders/${order.id}/edit`)}
        >
          <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          </svg>
        </button>
      )}
      {/* Delete */}
      {isEditableStatus && role.canDelete(order.createdBy) && (
        <button
          type="button"
          className="w-[26px] h-[26px] border rounded flex items-center justify-center bg-white text-[#5f6368] hover:bg-[#fdecec] hover:text-[#c0392b] hover:border-[#e7c2c2] transition-colors"
          title="Xoa (Delete)"
        >
          <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      )}
      {/* Submit for check */}
      {isEditableStatus && role.canSubmit(order.createdBy) && (
        <button
          type="button"
          className="w-[26px] h-[26px] border rounded flex items-center justify-center bg-white text-[#5f6368] hover:bg-[#e7f0f9] hover:text-[#0b5394] hover:border-[#c6d6e6] transition-colors"
          title="Gui kiem soat"
          onClick={() => transitionStatus(order.id, 'READY_FOR_APPROVAL')}
        >
          <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2 11 13" />
            <path d="M22 2 15 22 11 13 2 9Z" />
          </svg>
        </button>
      )}
      {/* Check */}
      {order.status === 'READY_FOR_APPROVAL' && role.canCheck && (
        <button
          type="button"
          className="w-[26px] h-[26px] border rounded flex items-center justify-center bg-white text-[#5f6368] hover:bg-[#e6f4ea] hover:text-[#137333] hover:border-[#b2d9be] transition-colors"
          title="Kiem soat (F8)"
          onClick={() => transitionStatus(order.id, 'PENDING_APPROVER')}
        >
          <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </button>
      )}
      {/* Approve */}
      {order.status === 'PENDING_APPROVER' && role.canApprove && (
        <button
          type="button"
          className="w-[26px] h-[26px] border rounded flex items-center justify-center bg-white text-[#5f6368] hover:bg-[#e6f4ea] hover:text-[#137333] hover:border-[#b2d9be] transition-colors"
          title="Phe duyet (F9)"
          onClick={() => transitionStatus(order.id, 'APPROVED')}
        >
          <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </button>
      )}
    </span>
  );
}

// ===== MAIN PAGE =====
export default function PaymentOrderList() {
  const navigate = useNavigate();
  const { canCreate } = useRole();
  const { orders } = usePaymentOrders();
  const [filter, setFilter] = useState<FilterState>({
    channel: '',
    transactionType: '',
    refNo: '',
    status: '',
    senderCode: '',
    receiverCode: '',
    dateType: 'Ngay lap',
    fromDate: '2026-05-05',
    toDate: '2026-05-12',
    amountFrom: '',
    amountTo: '',
    currency: '',
    createdBy: '',
  });

  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data
  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (filter.channel && o.channel !== filter.channel) return false;
      if (filter.status && o.status !== filter.status) return false;
      if (filter.refNo && !o.refNo.toLowerCase().includes(filter.refNo.toLowerCase())) return false;
      if (filter.senderCode && !o.senderCode.includes(filter.senderCode)) return false;
      if (filter.receiverCode && !o.receiverCode.includes(filter.receiverCode)) return false;
      if (filter.currency && o.currency !== filter.currency) return false;
      if (filter.transactionType && o.transactionType !== filter.transactionType) return false;
      if (filter.createdBy && !o.createdBy.toLowerCase().includes(filter.createdBy.toLowerCase())) return false;
      return true;
    });
  }, [filter]);

  const totalRecords = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const pageData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Total amount for non-deleted, VND records
  const totalVND = filtered
    .filter((o) => o.status !== 'DELETED' && o.currency === 'VND')
    .reduce((s, o) => s + o.amount, 0);

  function handleReset() {
    setFilter({
      channel: '',
      transactionType: '',
      refNo: '',
      status: '',
      senderCode: '',
      receiverCode: '',
      dateType: 'Ngay lap',
      fromDate: '2026-05-05',
      toDate: '2026-05-12',
      amountFrom: '',
      amountTo: '',
      currency: '',
      createdBy: '',
    });
    setCurrentPage(1);
  }

  return (
    <>
      <h1 className="text-lg font-bold mb-3" style={{ color: '#073763' }}>
        Danh sach Lenh thanh toan
      </h1>

      {/* ===== FILTER CARD ===== */}
      <section className="bg-white border rounded-md mb-3.5 overflow-hidden" style={{ borderColor: '#d7dbe0', boxShadow: '0 1px 2px rgba(15,20,25,.04)' }}>
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b" style={{ background: '#eef3f9', borderColor: '#d7dbe0' }}>
          <h2 className="text-[13px] font-bold uppercase tracking-wide" style={{ color: '#073763' }}>
            Bo loc tim kiem
          </h2>
          <span className="text-[11px] font-mono text-[#5f6368]">TT_LENHTT.LIST.1</span>
        </div>

        <div className="p-3.5">
          <div className="grid grid-cols-4 gap-x-4 gap-y-3 max-[1100px]:grid-cols-3 max-[800px]:grid-cols-2 max-[520px]:grid-cols-1">
            {/* Kenh */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">Kenh</label>
              <select
                className="h-8 px-2 text-[13px] border rounded outline-none focus:border-[#0b5394] focus:ring-2 focus:ring-[rgba(11,83,148,.15)]"
                style={{ borderColor: '#d7dbe0' }}
                value={filter.channel}
                onChange={(e) => setFilter({ ...filter, channel: e.target.value })}
              >
                <option value="">-- Tat ca --</option>
                <option value="LNH">Lien ngan hang</option>
                <option value="TTSP">Thanh toan song phuong</option>
              </select>
            </div>

            {/* Loai lenh */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">Loai lenh</label>
              <select
                className="h-8 px-2 text-[13px] border rounded outline-none focus:border-[#0b5394] focus:ring-2 focus:ring-[rgba(11,83,148,.15)]"
                style={{ borderColor: '#d7dbe0' }}
                value={filter.transactionType}
                onChange={(e) => setFilter({ ...filter, transactionType: e.target.value })}
              >
                <option value="">-- Tat ca --</option>
                <option value="LENH_THONG_THUONG">Lenh thong thuong</option>
                <option value="LENH_TRAI_PHIEU_CHINH_PHU">Lenh trai phieu chinh phu</option>
                <option value="LENH_THU_NSNN">Lenh co thong tin thu NSNN</option>
                <option value="LENH_CHUYEN_KHOAN">Lenh chuyen khoan</option>
                <option value="LENH_CHI_TM_KBNN">Lenh chi TM cho KBNN</option>
                <option value="LENH_CHI_TM_KH">Lenh chi TM cho KH</option>
                <option value="TT_NGOAI_TE">TT bang ngoai te khac</option>
              </select>
            </div>

            {/* So YCTT */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">So YCTT / So but toan</label>
              <input
                type="text"
                className="h-8 px-2 text-[13px] border rounded outline-none focus:border-[#0b5394] focus:ring-2 focus:ring-[rgba(11,83,148,.15)]"
                style={{ borderColor: '#d7dbe0' }}
                placeholder="Nhap chinh xac hoac bat dau bang..."
                value={filter.refNo}
                onChange={(e) => setFilter({ ...filter, refNo: e.target.value })}
              />
            </div>

            {/* Trang thai */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">Trang thai</label>
              <select
                className="h-8 px-2 text-[13px] border rounded outline-none focus:border-[#0b5394] focus:ring-2 focus:ring-[rgba(11,83,148,.15)]"
                style={{ borderColor: '#d7dbe0' }}
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              >
                <option value="">-- Tat ca --</option>
                <option value="DRAFT">Draft</option>
                <option value="READY_FOR_APPROVAL">Ready_For_Approval</option>
                <option value="PENDING_APPROVER">Pending_Approver</option>
                <option value="APPROVED">Approved</option>
                <option value="RETURNED_TO_MAKER">Returned_To_Maker</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* NH/KB chuyen */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">NH/KB chuyen</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  className="h-8 px-2 text-[13px] border rounded flex-1 outline-none focus:border-[#0b5394] focus:ring-2 focus:ring-[rgba(11,83,148,.15)]"
                  style={{ borderColor: '#d7dbe0' }}
                  placeholder="01202001 - KBNN Ha Noi"
                  value={filter.senderCode}
                  onChange={(e) => setFilter({ ...filter, senderCode: e.target.value })}
                />
                <button
                  type="button"
                  className="w-8 h-8 border rounded flex items-center justify-center bg-white hover:bg-[#e7f0f9]"
                  style={{ borderColor: '#d7dbe0', color: '#0b5394' }}
                  title="Tra cuu (F4)"
                >
                  <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.3-4.3" />
                  </svg>
                </button>
              </div>
            </div>

            {/* NH/KB nhan */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">NH/KB nhan</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  className="h-8 px-2 text-[13px] border rounded flex-1 outline-none focus:border-[#0b5394] focus:ring-2 focus:ring-[rgba(11,83,148,.15)]"
                  style={{ borderColor: '#d7dbe0' }}
                  placeholder="Nhap ma NH/KB nhan..."
                  value={filter.receiverCode}
                  onChange={(e) => setFilter({ ...filter, receiverCode: e.target.value })}
                />
                <button
                  type="button"
                  className="w-8 h-8 border rounded flex items-center justify-center bg-white hover:bg-[#e7f0f9]"
                  style={{ borderColor: '#d7dbe0', color: '#0b5394' }}
                  title="Tra cuu (F4)"
                >
                  <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.3-4.3" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Loai ngay loc */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">Loai ngay loc</label>
              <select
                className="h-8 px-2 text-[13px] border rounded outline-none focus:border-[#0b5394] focus:ring-2 focus:ring-[rgba(11,83,148,.15)]"
                style={{ borderColor: '#d7dbe0' }}
                value={filter.dateType}
                onChange={(e) => setFilter({ ...filter, dateType: e.target.value })}
              >
                <option>Ngay lap</option>
                <option>Ngay thanh toan</option>
                <option>Ngay kiem soat</option>
                <option>Ngay phe duyet</option>
              </select>
            </div>

            {/* Khoang ngay */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">
                Khoang ngay <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="date"
                  className="h-8 px-2 text-[13px] border rounded outline-none focus:border-[#0b5394] focus:ring-2 focus:ring-[rgba(11,83,148,.15)]"
                  style={{ borderColor: '#d7dbe0' }}
                  value={filter.fromDate}
                  onChange={(e) => setFilter({ ...filter, fromDate: e.target.value })}
                />
                <input
                  type="date"
                  className="h-8 px-2 text-[13px] border rounded outline-none focus:border-[#0b5394] focus:ring-2 focus:ring-[rgba(11,83,148,.15)]"
                  style={{ borderColor: '#d7dbe0' }}
                  value={filter.toDate}
                  onChange={(e) => setFilter({ ...filter, toDate: e.target.value })}
                />
              </div>
              <span className="text-[11px] text-[#5f6368]">Khoang &le; 90 ngay</span>
            </div>

            {/* So tien tu */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">So tien tu</label>
              <input
                type="text"
                className="h-8 px-2 text-[13px] border rounded outline-none focus:border-[#0b5394] focus:ring-2 focus:ring-[rgba(11,83,148,.15)]"
                style={{ borderColor: '#d7dbe0' }}
                placeholder="0"
                value={filter.amountFrom}
                onChange={(e) => setFilter({ ...filter, amountFrom: e.target.value })}
              />
            </div>

            {/* So tien den */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">So tien den</label>
              <input
                type="text"
                className="h-8 px-2 text-[13px] border rounded outline-none focus:border-[#0b5394] focus:ring-2 focus:ring-[rgba(11,83,148,.15)]"
                style={{ borderColor: '#d7dbe0' }}
                placeholder="999.999.999.999"
                value={filter.amountTo}
                onChange={(e) => setFilter({ ...filter, amountTo: e.target.value })}
              />
            </div>

            {/* Loai tien */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">Loai tien</label>
              <select
                className="h-8 px-2 text-[13px] border rounded outline-none focus:border-[#0b5394] focus:ring-2 focus:ring-[rgba(11,83,148,.15)]"
                style={{ borderColor: '#d7dbe0' }}
                value={filter.currency}
                onChange={(e) => setFilter({ ...filter, currency: e.target.value })}
              >
                <option value="">-- Tat ca --</option>
                <option value="VND">VND</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="JPY">JPY</option>
              </select>
            </div>

            {/* Nguoi lap */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">Nguoi lap</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  className="h-8 px-2 text-[13px] border rounded flex-1 outline-none focus:border-[#0b5394] focus:ring-2 focus:ring-[rgba(11,83,148,.15)]"
                  style={{ borderColor: '#d7dbe0' }}
                  placeholder="Tim theo username/ho ten..."
                  value={filter.createdBy}
                  onChange={(e) => setFilter({ ...filter, createdBy: e.target.value })}
                />
                <button
                  type="button"
                  className="w-8 h-8 border rounded flex items-center justify-center bg-white hover:bg-[#e7f0f9]"
                  style={{ borderColor: '#d7dbe0', color: '#0b5394' }}
                  title="Tra cuu (F4)"
                >
                  <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.3-4.3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center px-3.5 py-2.5 border-t" style={{ background: '#fafcfe', borderColor: '#d7dbe0' }}>
          <span className="text-[11px] text-[#5f6368] mr-auto">
            Bo loc dang luu: <b>(Mac dinh)</b>
          </span>
          <button
            type="button"
            className="h-8 px-3.5 rounded text-[12.5px] font-semibold inline-flex items-center gap-1.5 bg-white border hover:bg-[#f3f5f8] transition-colors"
            style={{ borderColor: '#d7dbe0', color: '#0b5394' }}
            onClick={handleReset}
          >
            <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <path d="M3 4v5h5" />
            </svg>
            Dat lai <span className="font-mono text-[10.5px] bg-gray-100 rounded px-1 ml-0.5">F5</span>
          </button>
          <button
            type="button"
            className="h-8 px-3.5 rounded text-[12.5px] font-semibold inline-flex items-center gap-1.5 text-white ml-2 hover:brightness-110 transition"
            style={{ background: '#0b5394' }}
            onClick={() => setCurrentPage(1)}
          >
            <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            Tim kiem <span className="font-mono text-[10.5px] bg-white/20 rounded px-1 ml-0.5">Enter</span>
          </button>
        </div>
      </section>

      {/* ===== RESULT CARD ===== */}
      <section className="bg-white border rounded-md overflow-hidden" style={{ borderColor: '#d7dbe0', boxShadow: '0 1px 2px rgba(15,20,25,.04)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b" style={{ background: '#eef3f9', borderColor: '#d7dbe0' }}>
          <h2 className="text-[13px] font-bold uppercase tracking-wide" style={{ color: '#073763' }}>
            Ket qua &middot; {totalRecords} ban ghi
          </h2>
          <span className="text-[11px] font-mono text-[#5f6368]">TT_LENHTT.LIST.2</span>
        </div>

        {/* Toolbar top */}
        <div className="flex items-center gap-2 px-3.5 py-2.5 border-b" style={{ background: '#fafcfe', borderColor: '#d7dbe0' }}>
          {canCreate && (
          <button
            type="button"
            className="h-8 px-3.5 rounded text-[12.5px] font-semibold inline-flex items-center gap-1.5 text-white hover:brightness-110 transition"
            style={{ background: '#137333' }}
            onClick={() => navigate('/payment-orders/new')}
          >
            <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            Tao moi <span className="font-mono text-[10.5px] bg-white/20 rounded px-1 ml-0.5">Ctrl+N</span>
          </button>
          )}
          <button
            type="button"
            className="h-8 px-3.5 rounded text-[12.5px] font-semibold inline-flex items-center gap-1.5 bg-white border hover:bg-[#e7f0f9] transition-colors"
            style={{ borderColor: '#c6d6e6', color: '#0b5394' }}
          >
            <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Xuat file <span className="font-mono text-[10.5px] bg-[rgba(0,0,0,.08)] rounded px-1 ml-0.5">Ctrl+Shift+E</span>
          </button>
          <button
            type="button"
            className="h-8 px-3.5 rounded text-[12.5px] font-semibold inline-flex items-center gap-1.5 bg-white border hover:bg-[#e7f0f9] transition-colors"
            style={{ borderColor: '#c6d6e6', color: '#0b5394' }}
          >
            <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9V2h12v7" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <path d="M6 14h12v8H6z" />
            </svg>
            In phieu <span className="font-mono text-[10.5px] bg-[rgba(0,0,0,.08)] rounded px-1 ml-0.5">Ctrl+P</span>
          </button>

          <div className="flex-1" />

          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold bg-[#e7f0f9] text-[#0b5394]">
            Tong tien VND: <b>{formatNumber(totalVND)}</b>
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>
                <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2.5 py-2 text-left border-b-2 border-[#c9d6e3] whitespace-nowrap w-[50px] text-center">
                  STT
                </th>
                <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2.5 py-2 text-left border-b-2 border-[#c9d6e3] whitespace-nowrap">
                  So YCTT / But toan
                </th>
                <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2.5 py-2 text-left border-b-2 border-[#c9d6e3] whitespace-nowrap">
                  Kenh
                </th>
                <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2.5 py-2 text-left border-b-2 border-[#c9d6e3] whitespace-nowrap">
                  Loai lenh
                </th>
                <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2.5 py-2 text-left border-b-2 border-[#c9d6e3] whitespace-nowrap">
                  Ngay lap
                </th>
                <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2.5 py-2 text-left border-b-2 border-[#c9d6e3] whitespace-nowrap">
                  Ngay TT
                </th>
                <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2.5 py-2 text-left border-b-2 border-[#c9d6e3] whitespace-nowrap">
                  NH/KB chuyen
                </th>
                <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2.5 py-2 text-left border-b-2 border-[#c9d6e3] whitespace-nowrap">
                  NH/KB nhan
                </th>
                <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2.5 py-2 text-right border-b-2 border-[#c9d6e3] whitespace-nowrap">
                  So tien
                </th>
                <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2.5 py-2 text-center border-b-2 border-[#c9d6e3] whitespace-nowrap">
                  Tien
                </th>
                <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2.5 py-2 text-center border-b-2 border-[#c9d6e3] whitespace-nowrap">
                  Trang thai
                </th>
                <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2.5 py-2 text-left border-b-2 border-[#c9d6e3] whitespace-nowrap">
                  Nguoi lap
                </th>
                <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2.5 py-2 text-center border-b-2 border-[#c9d6e3] whitespace-nowrap w-[130px]">
                  Thao tac
                </th>
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={13} className="italic text-[#5f6368] text-center py-8">
                    Khong tim thay ban ghi nao
                  </td>
                </tr>
              ) : (
                pageData.map((order, idx) => (
                  <tr key={order.id} className="hover:bg-[#eef5fd] even:bg-[#fafcfe]">
                    <td className="px-2.5 py-2 border-b text-center" style={{ borderColor: '#d7dbe0' }}>
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>
                    <td className="px-2.5 py-2 border-b" style={{ borderColor: '#d7dbe0' }}>
                      <button
                        type="button"
                        className="text-[#0b5394] font-medium hover:underline"
                        onClick={() => navigate(`/payment-orders/${order.id}`)}
                      >
                        {order.refNo}
                      </button>
                    </td>
                    <td className="px-2.5 py-2 border-b whitespace-nowrap" style={{ borderColor: '#d7dbe0' }}>
                      {order.channel}
                    </td>
                    <td className="px-2.5 py-2 border-b whitespace-nowrap" style={{ borderColor: '#d7dbe0' }}>
                      {transactionTypeLabels[order.transactionType] ?? order.transactionType}
                    </td>
                    <td className="px-2.5 py-2 border-b whitespace-nowrap" style={{ borderColor: '#d7dbe0' }}>
                      {order.createdDate}
                    </td>
                    <td className="px-2.5 py-2 border-b whitespace-nowrap" style={{ borderColor: '#d7dbe0' }}>
                      {order.paymentDate}
                    </td>
                    <td className="px-2.5 py-2 border-b whitespace-nowrap" style={{ borderColor: '#d7dbe0' }}>
                      {order.senderCode}
                    </td>
                    <td className="px-2.5 py-2 border-b whitespace-nowrap" style={{ borderColor: '#d7dbe0' }}>
                      {order.receiverCode}
                    </td>
                    <td className="px-2.5 py-2 border-b whitespace-nowrap text-right font-medium" style={{ borderColor: '#d7dbe0' }}>
                      {formatNumber(order.amount)}
                    </td>
                    <td className="px-2.5 py-2 border-b text-center" style={{ borderColor: '#d7dbe0' }}>
                      {order.currency}
                    </td>
                    <td className="px-2.5 py-2 border-b text-center" style={{ borderColor: '#d7dbe0' }}>
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-2.5 py-2 border-b whitespace-nowrap" style={{ borderColor: '#d7dbe0' }}>
                      {order.createdBy}
                    </td>
                    <td className="px-2.5 py-2 border-b text-center" style={{ borderColor: '#d7dbe0' }}>
                      <ActionButtons order={order} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-3.5 py-2 border-t text-xs" style={{ background: '#fafcfe', borderColor: '#d7dbe0' }}>
          <div className="flex items-center gap-2">
            <span>Hien thi</span>
            <select
              className="h-7 border rounded px-1.5 text-xs"
              style={{ borderColor: '#d7dbe0' }}
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
            <span>
              / tong <b>{totalRecords}</b> ban ghi
            </span>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              className="min-w-[28px] h-7 border rounded text-xs bg-white"
              style={{ borderColor: '#d7dbe0' }}
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              title="Trang dau"
            >
              &laquo;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                className={`min-w-[28px] h-7 border rounded text-xs ${p === currentPage ? 'text-white border-[#0b5394]' : 'bg-white'}`}
                style={{
                  borderColor: p === currentPage ? '#0b5394' : '#d7dbe0',
                  background: p === currentPage ? '#0b5394' : '#fff',
                }}
                onClick={() => setCurrentPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              className="min-w-[28px] h-7 border rounded text-xs bg-white"
              style={{ borderColor: '#d7dbe0' }}
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              title="Trang cuoi"
            >
              &raquo;
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
