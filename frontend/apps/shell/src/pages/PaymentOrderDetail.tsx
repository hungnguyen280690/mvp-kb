import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockPaymentOrderDetail, formatNumber, transactionTypeLabels } from '../api/mockData';
import { useRole } from '../components/RoleContext';
import { usePaymentOrders } from '../api/usePaymentOrders';

type TabKey = 'info' | 'approval' | 'attachments' | 'history';

// ===== Status Badge =====
function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    DRAFT: 'bg-[#eef0f2] text-[#8a8f98]',
    READY_FOR_APPROVAL: 'bg-[#e7f0f9] text-[#0b5394]',
    PENDING_APPROVER: 'bg-[#fff4e2] text-[#b45309]',
    APPROVED: 'bg-[#e6f4ea] text-[#137333]',
    RETURNED_TO_MAKER: 'bg-[#fff4e2] text-[#b45309]',
    REJECTED: 'bg-[#fde7e7] text-[#c0392b]',
  };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold ${colorMap[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

// ===== Workflow Steps =====
function WorkflowBar({ status }: { status: string }) {
  const steps = [
    { key: 'DRAFT', label: 'Nhap lieu', done: true },
    { key: 'READY_FOR_APPROVAL', label: 'Gui KS', done: ['READY_FOR_APPROVAL', 'PENDING_APPROVER', 'APPROVED'].includes(status) },
    { key: 'PENDING_APPROVER', label: 'Kiem soat', done: ['PENDING_APPROVER', 'APPROVED'].includes(status) },
    { key: 'APPROVED', label: 'Phe duyet', done: status === 'APPROVED' },
  ];

  return (
    <div className="flex items-center bg-white border rounded-md px-3.5 py-2.5 mb-3.5 gap-1.5 text-xs" style={{ borderColor: '#d7dbe0' }}>
      {steps.map((step, i) => {
        const isCurrent = step.key === status;
        return (
          <div key={step.key} className="flex items-center gap-1.5">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
                step.done
                  ? isCurrent
                    ? 'bg-[#e7f0f9] text-[#073763] font-semibold'
                    : 'bg-[#e6f4ea] text-[#137333]'
                  : 'bg-[#f3f5f8] text-[#5f6368]'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${step.done ? (isCurrent ? 'bg-[#073763]' : 'bg-[#137333]') : 'bg-[#5f6368]'}`} />
              {step.label}
            </div>
            {i < steps.length - 1 && <span className="text-[#c9d2dc] mx-0.5">&rarr;</span>}
          </div>
        );
      })}
    </div>
  );
}

// ===== KV Row =====
function KvRow({ label, value, className = '' }: { label: string; value: string | number; className?: string }) {
  return (
    <div className={`grid grid-cols-[180px_1fr] gap-x-3 gap-y-1.5 text-[12.5px] ${className}`}>
      <dt className="text-[#5f6368]">{label}</dt>
      <dd className="text-[#1f2328] font-medium">{value}</dd>
    </div>
  );
}

export default function PaymentOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('info');
  const role = useRole();
  const { getOrder, transitionStatus } = usePaymentOrders();

  const order = getOrder(id ?? '') ?? { id: '0', refNo: '', channel: 'LNH' as const, transactionType: 'LENH_THONG_THUONG' as const, createdDate: '', paymentDate: '', senderCode: '', senderName: '', receiverCode: '', receiverName: '', amount: 0, currency: 'VND' as const, status: 'DRAFT' as const, createdBy: '', checkedBy: '', approvedBy: '', version: 1 };
  const detail = mockPaymentOrderDetail;

  const isEditableStatus = order.status === 'DRAFT' || order.status === 'RETURNED_TO_MAKER';
  const canEdit = isEditableStatus && role.canEdit(order.createdBy);
  const canDelete = isEditableStatus && role.canDelete(order.createdBy);
  const canSubmit = isEditableStatus && role.canSubmit(order.createdBy);
  const canCheck = order.status === 'READY_FOR_APPROVAL' && role.canCheck;
  const canApprove = order.status === 'PENDING_APPROVER' && role.canApprove;
  const canReturn = (order.status === 'READY_FOR_APPROVAL' && role.canCheck) || (order.status === 'PENDING_APPROVER' && role.canApprove);

  const tabs: { key: TabKey; label: string; shortcut: string }[] = [
    { key: 'info', label: 'Thong tin giao dich', shortcut: '' },
    { key: 'approval', label: 'Lich su phe duyet', shortcut: 'Alt+P' },
    { key: 'attachments', label: 'Dinh kem', shortcut: 'Ctrl+U' },
    { key: 'history', label: 'Lich su giao dich', shortcut: 'Alt+H' },
  ];

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold" style={{ color: '#073763' }}>
          Chi tiet Lenh thanh toan #{order.refNo}
        </h1>
        <div className="flex items-center gap-2">
          <StatusBadge status={order.status} />
          <span className="text-xs text-[#5f6368]">Phien ban: {order.version}</span>
        </div>
      </div>

      {/* Workflow bar */}
      <WorkflowBar status={order.status} />

      {/* Action buttons */}
      <div className="flex items-center gap-2 mb-3">
        {canEdit && (
          <button
            type="button"
            className="h-8 px-3.5 rounded text-[12.5px] font-semibold inline-flex items-center gap-1.5 text-white transition"
            style={{ background: '#0b5394' }}
            onClick={() => navigate(`/payment-orders/${order.id}/edit`)}
          >
            <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            </svg>
            Sua <span className="font-mono text-[10.5px] bg-white/20 rounded px-1 ml-0.5">F2</span>
          </button>
        )}
        {canDelete && (
          <button
            type="button"
            className="h-8 px-3.5 rounded text-[12.5px] font-semibold inline-flex items-center gap-1.5 bg-white border hover:bg-[#fdecec] hover:text-[#c0392b] transition-colors"
            style={{ borderColor: '#d7dbe0', color: '#c0392b' }}
            onClick={() => { transitionStatus(order.id, 'DELETED'); navigate('/payment-orders'); }}
          >
            <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Xoa
          </button>
        )}
        {canSubmit && (
          <button
            type="button"
            className="h-8 px-3.5 rounded text-[12.5px] font-semibold inline-flex items-center gap-1.5 text-white transition"
            style={{ background: '#2563eb' }}
            onClick={() => transitionStatus(order.id, 'READY_FOR_APPROVAL')}
          >
            <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2 11 13" />
              <path d="M22 2 15 22 11 13 2 9Z" />
            </svg>
            Gui kiem soat
          </button>
        )}
        {canCheck && (
          <button
            type="button"
            className="h-8 px-3.5 rounded text-[12.5px] font-semibold inline-flex items-center gap-1.5 text-white transition"
            style={{ background: '#d97706' }}
            onClick={() => transitionStatus(order.id, 'PENDING_APPROVER')}
          >
            <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Kiem soat <span className="font-mono text-[10.5px] bg-white/20 rounded px-1 ml-0.5">F8</span>
          </button>
        )}
        {canApprove && (
          <button
            type="button"
            className="h-8 px-3.5 rounded text-[12.5px] font-semibold inline-flex items-center gap-1.5 text-white transition"
            style={{ background: '#059669' }}
            onClick={() => transitionStatus(order.id, 'APPROVED')}
          >
            <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Phe duyet <span className="font-mono text-[10.5px] bg-white/20 rounded px-1 ml-0.5">F9</span>
          </button>
        )}
        {canReturn && (
          <button
            type="button"
            className="h-8 px-3.5 rounded text-[12.5px] font-semibold inline-flex items-center gap-1.5 bg-white border hover:bg-[#fff4e2] transition-colors"
            style={{ borderColor: '#d97706', color: '#b45309' }}
            onClick={() => transitionStatus(order.id, 'RETURNED_TO_MAKER')}
          >
            <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="M12 19-5 12 12 5" />
            </svg>
            Tra lai
          </button>
        )}
        <button
          type="button"
          className="h-8 px-3.5 rounded text-[12.5px] font-semibold inline-flex items-center gap-1.5 bg-white border hover:bg-[#f3f5f8] transition-colors"
          style={{ borderColor: '#d7dbe0', color: '#0b5394' }}
        >
          <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9V2h12v7" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <path d="M6 14h12v8H6z" />
          </svg>
          In phieu <span className="font-mono text-[10.5px] bg-[rgba(0,0,0,.08)] rounded px-1 ml-0.5">Ctrl+P</span>
        </button>
        <button
          type="button"
          className="h-8 px-3.5 rounded text-[12.5px] font-semibold inline-flex items-center gap-1.5 bg-white border hover:bg-[#f3f5f8] transition-colors"
          style={{ borderColor: '#d7dbe0', color: '#0b5394' }}
          onClick={() => navigate('/payment-orders')}
        >
          <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M12 19-5 12 12 5" />
          </svg>
          Quay lai
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b bg-white px-3.5" style={{ borderColor: '#d7dbe0' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`px-3.5 py-2 text-[12.5px] font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'text-[#073763] font-bold border-[#0b5394]'
                : 'text-[#5f6368] border-transparent hover:text-[#0b5394]'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white border border-t-0 rounded-b-md p-4" style={{ borderColor: '#d7dbe0' }}>
        {activeTab === 'info' && (
          <>
            {/* General info */}
            <h3 className="text-[12.5px] font-bold uppercase tracking-wide pb-1 mb-3 border-b border-dashed" style={{ color: '#073763', borderColor: '#d7dbe0' }}>
              Thong tin chung
            </h3>
            <div className="grid grid-cols-[180px_1fr] gap-x-3 gap-y-1.5 text-[12.5px] mb-5">
              <KvRow label="So YCTT" value={order.refNo} />
              <KvRow label="Kenh" value={order.channel === 'LNH' ? 'Lien ngan hang' : 'Thanh toan song phuong'} />
              <KvRow label="Loai lenh" value={transactionTypeLabels[order.transactionType] ?? order.transactionType} />
              <KvRow label="Ngay lap" value={order.createdDate} />
              <KvRow label="Ngay thanh toan" value={order.paymentDate} />
              <KvRow label="So tien" value={`${formatNumber(order.amount)} ${order.currency}`} />
              <KvRow label="Noi dung" value={detail.description} />
              <KvRow label="So chung tu goc" value={detail.orginNum || '(trong)'} />
              <KvRow label="Nguoi lap" value={order.createdBy} />
            </div>

            {/* Sender info */}
            <h3 className="text-[12.5px] font-bold uppercase tracking-wide pb-1 mb-3 border-b border-dashed" style={{ color: '#073763', borderColor: '#d7dbe0' }}>
              Thong tin nguoi chuyen
            </h3>
            <div className="grid grid-cols-[180px_1fr] gap-x-3 gap-y-1.5 text-[12.5px] mb-5">
              <KvRow label="Ten" value={detail.sender.name} />
              <KvRow label="Dia chi" value={detail.sender.address} />
              <KvRow label="Tai khoan" value={detail.sender.account} />
              <KvRow label="Mo tai NH/KB" value={detail.sender.bankCode} />
              <KvRow label="Ma KH" value={detail.sender.customerCode || '(trong)'} />
            </div>

            {/* Receiver info */}
            <h3 className="text-[12.5px] font-bold uppercase tracking-wide pb-1 mb-3 border-b border-dashed" style={{ color: '#073763', borderColor: '#d7dbe0' }}>
              Thong tin nguoi nhan
            </h3>
            <div className="grid grid-cols-[180px_1fr] gap-x-3 gap-y-1.5 text-[12.5px] mb-5">
              <KvRow label="Ten" value={detail.receiver.name} />
              <KvRow label="Dia chi" value={detail.receiver.address || '(trong)'} />
              <KvRow label="Tai khoan" value={detail.receiver.account} />
              <KvRow label="Mo tai NH/KB" value={detail.receiver.bankName} />
            </div>

            {/* Accounting detail */}
            <h3 className="text-[12.5px] font-bold uppercase tracking-wide pb-1 mb-3 border-b border-dashed" style={{ color: '#073763', borderColor: '#d7dbe0' }}>
              Chi tiet hack toan
            </h3>
            <div className="overflow-x-auto border rounded" style={{ borderColor: '#d7dbe0' }}>
              <table className="w-full border-collapse text-[12.5px]">
                <thead>
                  <tr>
                    <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2 py-1.5 text-left border-b border-[#c9d6e3]">STT</th>
                    <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2 py-1.5 text-left border-b border-[#c9d6e3]">Ma quy</th>
                    <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2 py-1.5 text-left border-b border-[#c9d6e3]">TK tu nhien</th>
                    <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2 py-1.5 text-left border-b border-[#c9d6e3]">DVQHNS</th>
                    <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2 py-1.5 text-left border-b border-[#c9d6e3]">Chuong</th>
                    <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2 py-1.5 text-left border-b border-[#c9d6e3]">Dien giai</th>
                    <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2 py-1.5 text-right border-b border-[#c9d6e3]">So tien</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.details.map((d) => (
                    <tr key={d.lineNo} className="hover:bg-[#eef5fd] even:bg-[#fafcfe]">
                      <td className="px-2 py-1.5 border-b text-center" style={{ borderColor: '#d7dbe0' }}>{d.lineNo}</td>
                      <td className="px-2 py-1.5 border-b" style={{ borderColor: '#d7dbe0' }}>{d.glSegment1}</td>
                      <td className="px-2 py-1.5 border-b" style={{ borderColor: '#d7dbe0' }}>{d.glSegment2}</td>
                      <td className="px-2 py-1.5 border-b" style={{ borderColor: '#d7dbe0' }}>{d.glSegment3}</td>
                      <td className="px-2 py-1.5 border-b" style={{ borderColor: '#d7dbe0' }}>{d.glSegment5}</td>
                      <td className="px-2 py-1.5 border-b" style={{ borderColor: '#d7dbe0' }}>{d.description}</td>
                      <td className="px-2 py-1.5 border-b text-right font-medium" style={{ borderColor: '#d7dbe0' }}>{formatNumber(d.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'approval' && (
          <div className="space-y-0">
            <h3 className="text-[12.5px] font-bold uppercase tracking-wide pb-1 mb-3" style={{ color: '#073763' }}>
              Lich su phe duyet
            </h3>
            <div className="relative pl-6">
              {detail.approvalHistory.map((entry, idx) => (
                <div key={entry.id} className="relative pb-5 last:pb-0">
                  {/* Vertical line */}
                  {idx < detail.approvalHistory.length - 1 && (
                    <div className="absolute left-[-16px] top-3 w-0.5 bottom-0 bg-[#d7dbe0]" />
                  )}
                  {/* Dot */}
                  <div
                    className={`absolute left-[-20px] top-1.5 w-3 h-3 rounded-full border-2 ${
                      entry.action.includes('APPROVE') && !entry.action.includes('RETURN') && !entry.action.includes('REJECT')
                        ? 'bg-[#137333] border-[#137333]'
                        : 'bg-white border-[#0b5394]'
                    }`}
                  />
                  <div className="bg-[#fafcfe] border rounded-md p-3" style={{ borderColor: '#d7dbe0' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-[#073763]">
                        {entry.actorName} ({entry.actor})
                      </span>
                      <span className="text-[11px] text-[#5f6368]">{entry.actionDate}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#eef0f2] text-[#5f6368]">{entry.actorRole}</span>
                      <span className="text-[#5f6368]">{entry.action}</span>
                      <span className="text-[#5f6368]">
                        {entry.statusFrom} &rarr; {entry.statusTo}
                      </span>
                    </div>
                    {entry.note && (
                      <p className="text-xs text-[#1f2328] mt-1.5">{entry.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'attachments' && (
          <>
            <h3 className="text-[12.5px] font-bold uppercase tracking-wide pb-1 mb-3" style={{ color: '#073763' }}>
              Tai lieu dinh kem
            </h3>
            {detail.attachments.length === 0 ? (
              <p className="italic text-[#5f6368] text-center py-6">Chua co tai lieu dinh kem</p>
            ) : (
              <div className="overflow-x-auto border rounded" style={{ borderColor: '#d7dbe0' }}>
                <table className="w-full border-collapse text-[12.5px]">
                  <thead>
                    <tr>
                      <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2 py-1.5 text-left border-b border-[#c9d6e3]">Ten file</th>
                      <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2 py-1.5 text-left border-b border-[#c9d6e3]">Loai tai lieu</th>
                      <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2 py-1.5 text-left border-b border-[#c9d6e3]">Ghi chu</th>
                      <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2 py-1.5 text-right border-b border-[#c9d6e3]">Kich thuoc</th>
                      <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2 py-1.5 text-left border-b border-[#c9d6e3]">Nguoi upload</th>
                      <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2 py-1.5 text-left border-b border-[#c9d6e3]">Ngay upload</th>
                      <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2 py-1.5 text-center border-b border-[#c9d6e3] w-[60px]">Tai ve</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.attachments.map((att) => (
                      <tr key={att.id} className="hover:bg-[#eef5fd] even:bg-[#fafcfe]">
                        <td className="px-2 py-1.5 border-b" style={{ borderColor: '#d7dbe0' }}>
                          <span className="text-[#0b5394] font-medium">{att.fileName}</span>
                        </td>
                        <td className="px-2 py-1.5 border-b" style={{ borderColor: '#d7dbe0' }}>{att.docType}</td>
                        <td className="px-2 py-1.5 border-b" style={{ borderColor: '#d7dbe0' }}>{att.note}</td>
                        <td className="px-2 py-1.5 border-b text-right" style={{ borderColor: '#d7dbe0' }}>
                          {(att.fileSize / 1024).toFixed(0)} KB
                        </td>
                        <td className="px-2 py-1.5 border-b" style={{ borderColor: '#d7dbe0' }}>{att.uploadedBy}</td>
                        <td className="px-2 py-1.5 border-b" style={{ borderColor: '#d7dbe0' }}>{att.uploadedDate}</td>
                        <td className="px-2 py-1.5 border-b text-center" style={{ borderColor: '#d7dbe0' }}>
                          <button
                            type="button"
                            className="w-[26px] h-[26px] border rounded inline-flex items-center justify-center bg-white hover:bg-[#e7f0f9] transition-colors"
                            style={{ borderColor: '#d7dbe0', color: '#0b5394' }}
                            title="Tai ve (Ctrl+J)"
                          >
                            <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="text-xs text-[#5f6368] mt-2">
              Tong so file: <b>{detail.attachments.length}</b> | Tong dung luong: <b>{(detail.attachments.reduce((s, a) => s + a.fileSize, 0) / (1024 * 1024)).toFixed(2)} MB</b>
            </div>
          </>
        )}

        {activeTab === 'history' && (
          <>
            <h3 className="text-[12.5px] font-bold uppercase tracking-wide pb-1 mb-3" style={{ color: '#073763' }}>
              Lich su giao dich (Audit log)
            </h3>
            <div className="overflow-x-auto border rounded" style={{ borderColor: '#d7dbe0' }}>
              <table className="w-full border-collapse text-[12.5px]">
                <thead>
                  <tr>
                    <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2 py-1.5 text-left border-b border-[#c9d6e3]">STT</th>
                    <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2 py-1.5 text-left border-b border-[#c9d6e3]">Thoi diem</th>
                    <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2 py-1.5 text-left border-b border-[#c9d6e3]">Nguoi thuc hien</th>
                    <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2 py-1.5 text-left border-b border-[#c9d6e3]">Vai tro</th>
                    <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2 py-1.5 text-left border-b border-[#c9d6e3]">Hanh dong</th>
                    <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2 py-1.5 text-left border-b border-[#c9d6e3]">Trang thai</th>
                    <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2 py-1.5 text-left border-b border-[#c9d6e3]">Ghi chu</th>
                    <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2 py-1.5 text-left border-b border-[#c9d6e3]">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.auditLog.map((log, idx) => (
                    <tr key={log.id} className="hover:bg-[#eef5fd] even:bg-[#fafcfe]">
                      <td className="px-2 py-1.5 border-b text-center" style={{ borderColor: '#d7dbe0' }}>{idx + 1}</td>
                      <td className="px-2 py-1.5 border-b whitespace-nowrap" style={{ borderColor: '#d7dbe0' }}>{log.actionDate}</td>
                      <td className="px-2 py-1.5 border-b" style={{ borderColor: '#d7dbe0' }}>{log.actorName} ({log.actor})</td>
                      <td className="px-2 py-1.5 border-b" style={{ borderColor: '#d7dbe0' }}>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#eef0f2] text-[#5f6368] text-[11px]">{log.actorRole}</span>
                      </td>
                      <td className="px-2 py-1.5 border-b font-mono text-[11px]" style={{ borderColor: '#d7dbe0' }}>{log.action}</td>
                      <td className="px-2 py-1.5 border-b" style={{ borderColor: '#d7dbe0' }}>
                        {log.statusFrom && <span>{log.statusFrom}</span>}
                        {log.statusFrom && log.statusTo && <span className="mx-1 text-[#c9d2dc]">&rarr;</span>}
                        {log.statusTo && <span className="font-medium">{log.statusTo}</span>}
                      </td>
                      <td className="px-2 py-1.5 border-b" style={{ borderColor: '#d7dbe0' }}>{log.note}</td>
                      <td className="px-2 py-1.5 border-b font-mono text-[11px] text-[#5f6368]" style={{ borderColor: '#d7dbe0' }}>{log.clientIp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
