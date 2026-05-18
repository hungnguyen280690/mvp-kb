import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { AccountingDetail, Channel, CurrencyCode, TransactionType } from '../types';
import { mockPaymentOrders, mockPaymentOrderDetail, formatNumber } from '../api/mockData';

// ===== Section wrapper =====
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3
        className="text-[12.5px] font-bold uppercase tracking-wide pb-1 mb-2 border-b border-dashed"
        style={{ color: '#073763', borderColor: '#d7dbe0' }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

// ===== Form field wrapper =====
function Field({
  label,
  required,
  children,
  conditional,
  error,
  className = '',
}: {
  label: string;
  required?: boolean;
  conditional?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs font-medium text-gray-700">
        {label}
        {required && <span className="text-red-600 ml-0.5">*</span>}
        {conditional && <span className="text-[#b45309] ml-0.5 text-[10px]">(*)</span>}
      </label>
      {children}
      {error && <span className="text-[11.5px] text-red-600 mt-0.5">{error}</span>}
    </div>
  );
}

const emptyDetail: AccountingDetail = {
  lineNo: 1,
  glSegment1: '01',
  glSegment2: '',
  glSegment3: '',
  glSegment4: '',
  glSegment5: '000',
  glSegment6: '000',
  glSegment7: '0000',
  glSegment8: '00000',
  glSegment9: '00000',
  glSegment10: '00',
  glSegment11: '0000',
  glSegment12: '00',
  description: '',
  amount: 0,
};

export default function PaymentOrderForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  // Load existing data for edit
  const existingOrder = isEdit
    ? mockPaymentOrders.find((o) => o.id === id) ?? mockPaymentOrders[0]
    : null;

  const [channel, setChannel] = useState<Channel>(existingOrder?.channel ?? 'LNH');
  const [transactionType, setTransactionType] = useState<TransactionType>(
    existingOrder?.transactionType ?? 'LENH_THONG_THUONG',
  );
  const [refNo, setRefNo] = useState(existingOrder?.refNo ?? '');
  const [paymentDate] = useState(existingOrder?.paymentDate ?? new Date().toLocaleDateString('vi-VN'));
  const [amount] = useState(existingOrder?.amount ?? 0);
  const [currency, setCurrency] = useState<CurrencyCode>(existingOrder?.currency ?? 'VND');
  const [description, setDescription] = useState(isEdit ? mockPaymentOrderDetail.description : '');
  const [orginNum, setOrginNum] = useState(isEdit ? mockPaymentOrderDetail.orginNum : '');

  // Sender
  const [senderName, setSenderName] = useState(isEdit ? mockPaymentOrderDetail.sender.name : 'KBNN Ha Noi');
  const [senderAddress, setSenderAddress] = useState(isEdit ? mockPaymentOrderDetail.sender.address : '');
  const [senderAccount, setSenderAccount] = useState(isEdit ? mockPaymentOrderDetail.sender.account : '');
  const [senderBankCode] = useState(isEdit ? mockPaymentOrderDetail.sender.bankCode : '01202001');

  // Receiver
  const [receiverName, setReceiverName] = useState(isEdit ? mockPaymentOrderDetail.receiver.name : '');
  const [receiverAddress, setReceiverAddress] = useState(isEdit ? mockPaymentOrderDetail.receiver.address : '');
  const [receiverAccount, setReceiverAccount] = useState(isEdit ? mockPaymentOrderDetail.receiver.account : '');
  const [receiverBankName, setReceiverBankName] = useState(isEdit ? mockPaymentOrderDetail.receiver.bankName : '');

  // Detail lines
  const [details, setDetails] = useState<AccountingDetail[]>(
    isEdit ? mockPaymentOrderDetail.details : [{ ...emptyDetail, lineNo: 1 }],
  );

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!refNo.trim()) e.refNo = 'So YCTT la bat buoc';
    if (!description.trim()) e.description = 'Noi dung thanh toan la bat buoc';
    if (!senderName.trim()) e.senderName = 'Ten nguoi gui la bat buoc';
    if (!senderAccount.trim()) e.senderAccount = 'Tai khoan gui la bat buoc';
    if (!receiverName.trim()) e.receiverName = 'Ten nguoi nhan la bat buoc';
    if (!receiverAccount.trim()) e.receiverAccount = 'Tai khoan nhan la bat buoc';
    if (amount <= 0) e.amount = 'So tien phai lon hon 0';
    if (channel === 'TTSP' && !orginNum.trim()) e.orginNum = 'So chung tu goc la bat buoc voi kenh TTSP';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSaveDraft() {
    // Light validation only
    alert(isEdit ? 'Da cap nhat nhap thanh cong!' : 'Da luu nhap thanh cong!');
    navigate('/payment-orders');
  }

  function handleSubmit() {
    if (!validate()) return;
    alert(isEdit ? 'Da gui kiem soat thanh cong!' : 'Da gui kiem soat thanh cong!');
    navigate('/payment-orders');
  }

  function handleCancel() {
    navigate('/payment-orders');
  }

  function addDetailLine() {
    setDetails([...details, { ...emptyDetail, lineNo: details.length + 1 }]);
  }

  function removeDetailLine(idx: number) {
    setDetails(details.filter((_, i) => i !== idx).map((d, i) => ({ ...d, lineNo: i + 1 })));
  }

  function updateDetail(idx: number, field: keyof AccountingDetail, value: string | number) {
    const updated = [...details];
    updated[idx] = { ...updated[idx], [field]: value };
    setDetails(updated);
  }

  const detailTotal = details.reduce((s, d) => s + d.amount, 0);

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold" style={{ color: '#073763' }}>
          {isEdit ? `Sua Lenh thanh toan #${existingOrder?.refNo ?? id}` : 'Them moi Lenh thanh toan'}
        </h1>
        {existingOrder && (
          <span className="text-xs text-[#5f6368]">
            Trang thai: <span className="font-semibold">{existingOrder.status}</span> | Phien ban: {existingOrder.version}
          </span>
        )}
      </div>

      <div className="bg-white border rounded-md overflow-hidden" style={{ borderColor: '#d7dbe0', boxShadow: '0 1px 2px rgba(15,20,25,.04)' }}>
        <div className="p-4">
          {/* Section 1: Thong tin chung */}
          <Section title="1. Thong tin chung">
            <div className="grid grid-cols-3 gap-x-4 gap-y-3 max-[960px]:grid-cols-2 max-[600px]:grid-cols-1">
              <Field label="Kenh" required>
                <select
                  className="h-8 px-2 text-[13px] border rounded outline-none focus:border-[#0b5394] focus:ring-2 focus:ring-[rgba(11,83,148,.15)]"
                  style={{ borderColor: '#d7dbe0' }}
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as Channel)}
                >
                  <option value="LNH">Lien ngan hang</option>
                  <option value="TTSP">Thanh toan song phuong</option>
                </select>
              </Field>

              <Field label="Loai lenh" required>
                <select
                  className="h-8 px-2 text-[13px] border rounded outline-none focus:border-[#0b5394] focus:ring-2 focus:ring-[rgba(11,83,148,.15)]"
                  style={{ borderColor: '#d7dbe0' }}
                  value={transactionType}
                  onChange={(e) => setTransactionType(e.target.value as TransactionType)}
                >
                  {channel === 'LNH' ? (
                    <>
                      <option value="LENH_THONG_THUONG">Lenh thong thuong</option>
                      <option value="LENH_TRAI_PHIEU_CHINH_PHU">Lenh trai phieu chinh phu</option>
                      <option value="LENH_THU_NSNN">Lenh co thong tin thu NSNN</option>
                    </>
                  ) : (
                    <>
                      <option value="LENH_CHUYEN_KHOAN">Lenh chuyen khoan</option>
                      <option value="LENH_CHI_TM_KBNN">Lenh chi TM cho KBNN</option>
                      <option value="LENH_CHI_TM_KH">Lenh chi TM cho KH</option>
                      <option value="TT_NGOAI_TE">TT bang ngoai te khac</option>
                    </>
                  )}
                </select>
              </Field>

              <Field label="So YCTT / So but toan" required error={errors.refNo}>
                <input
                  type="text"
                  className="h-8 px-2 text-[13px] border rounded outline-none focus:border-[#0b5394] focus:ring-2 focus:ring-[rgba(11,83,148,.15)]"
                  style={{ borderColor: errors.refNo ? '#cc0000' : '#d7dbe0' }}
                  placeholder="VD: YCTT-2026-0001"
                  value={refNo}
                  onChange={(e) => setRefNo(e.target.value)}
                />
              </Field>

              <Field label="Ngay thanh toan" required>
                <input
                  type="text"
                  className="h-8 px-2 text-[13px] border rounded bg-[#f3f5f8] cursor-not-allowed"
                  style={{ borderColor: '#d7dbe0' }}
                  value={paymentDate}
                  readOnly
                />
              </Field>

              <Field label="So tien chuyen" required error={errors.amount}>
                <input
                  type="text"
                  className="h-8 px-2 text-[13px] border rounded text-right outline-none focus:border-[#0b5394] focus:ring-2 focus:ring-[rgba(11,83,148,.15)]"
                  style={{ borderColor: errors.amount ? '#cc0000' : '#d7dbe0' }}
                  value={formatNumber(amount)}
                  readOnly
                />
                <span className="text-[11px] text-[#5f6368]">Tu dong tong tu chi tiet khoan muc</span>
              </Field>

              <Field label="Loai tien" required>
                <select
                  className="h-8 px-2 text-[13px] border rounded outline-none focus:border-[#0b5394] focus:ring-2 focus:ring-[rgba(11,83,148,.15)]"
                  style={{ borderColor: '#d7dbe0' }}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                >
                  <option value="VND">VND</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="JPY">JPY</option>
                </select>
              </Field>

              <Field label="So chung tu goc" conditional={channel === 'TTSP'} error={errors.orginNum}>
                <input
                  type="text"
                  className="h-8 px-2 text-[13px] border rounded outline-none focus:border-[#0b5394] focus:ring-2 focus:ring-[rgba(11,83,148,.15)]"
                  style={{ borderColor: errors.orginNum ? '#cc0000' : '#d7dbe0' }}
                  placeholder="Nhap so chung tu goc..."
                  value={orginNum}
                  onChange={(e) => setOrginNum(e.target.value)}
                />
              </Field>

              <Field label="Noi dung thanh toan" required error={errors.description} className="col-span-3 max-[600px]:col-span-1">
                <textarea
                  className="h-auto min-h-[64px] resize-y px-2 py-1.5 text-[13px] border rounded outline-none focus:border-[#0b5394] focus:ring-2 focus:ring-[rgba(11,83,148,.15)]"
                  style={{ borderColor: errors.description ? '#cc0000' : '#d7dbe0' }}
                  placeholder="Nhap noi dung thanh toan..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Field>

              <Field label="Nguoi lap">
                <input
                  type="text"
                  className="h-8 px-2 text-[13px] border rounded bg-[#f3f5f8] cursor-not-allowed"
                  style={{ borderColor: '#d7dbe0' }}
                  value="phongtd16"
                  readOnly
                />
              </Field>
            </div>
          </Section>

          {/* Section 2: Thong tin nguoi gui */}
          <Section title="2. Thong tin nguoi chuyen">
            <div className="grid grid-cols-3 gap-x-4 gap-y-3 max-[960px]:grid-cols-2 max-[600px]:grid-cols-1">
              <Field label="Ten" required error={errors.senderName}>
                <input
                  type="text"
                  className="h-8 px-2 text-[13px] border rounded outline-none focus:border-[#0b5394] focus:ring-2 focus:ring-[rgba(11,83,148,.15)]"
                  style={{ borderColor: errors.senderName ? '#cc0000' : '#d7dbe0' }}
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                />
              </Field>
              <Field label="Dia chi" required>
                <input
                  type="text"
                  className="h-8 px-2 text-[13px] border rounded outline-none focus:border-[#0b5394] focus:ring-2 focus:ring-[rgba(11,83,148,.15)]"
                  style={{ borderColor: '#d7dbe0' }}
                  placeholder="Nhap dia chi..."
                  value={senderAddress}
                  onChange={(e) => setSenderAddress(e.target.value)}
                />
              </Field>
              <Field label="Tai khoan" required error={errors.senderAccount}>
                <input
                  type="text"
                  className="h-8 px-2 text-[13px] border rounded outline-none focus:border-[#0b5394] focus:ring-2 focus:ring-[rgba(11,83,148,.15)]"
                  style={{ borderColor: errors.senderAccount ? '#cc0000' : '#d7dbe0' }}
                  placeholder="Nhap tai khoan..."
                  value={senderAccount}
                  onChange={(e) => setSenderAccount(e.target.value)}
                />
              </Field>
              <Field label="Mo tai NH/KB">
                <input
                  type="text"
                  className="h-8 px-2 text-[13px] border rounded bg-[#f3f5f8] cursor-not-allowed"
                  style={{ borderColor: '#d7dbe0' }}
                  value={senderBankCode}
                  readOnly
                />
              </Field>
            </div>
          </Section>

          {/* Section 3: Thong tin nguoi nhan */}
          <Section title="3. Thong tin nguoi nhan">
            <div className="grid grid-cols-3 gap-x-4 gap-y-3 max-[960px]:grid-cols-2 max-[600px]:grid-cols-1">
              <Field label="Ten" required error={errors.receiverName}>
                <input
                  type="text"
                  className="h-8 px-2 text-[13px] border rounded outline-none focus:border-[#0b5394] focus:ring-2 focus:ring-[rgba(11,83,148,.15)]"
                  style={{ borderColor: errors.receiverName ? '#cc0000' : '#d7dbe0' }}
                  placeholder="Nhap ten nguoi nhan..."
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                />
              </Field>
              <Field label="Dia chi">
                <input
                  type="text"
                  className="h-8 px-2 text-[13px] border rounded outline-none focus:border-[#0b5394] focus:ring-2 focus:ring-[rgba(11,83,148,.15)]"
                  style={{ borderColor: '#d7dbe0' }}
                  placeholder="Nhap dia chi..."
                  value={receiverAddress}
                  onChange={(e) => setReceiverAddress(e.target.value)}
                />
              </Field>
              <Field label="Tai khoan" required error={errors.receiverAccount}>
                <input
                  type="text"
                  className="h-8 px-2 text-[13px] border rounded outline-none focus:border-[#0b5394] focus:ring-2 focus:ring-[rgba(11,83,148,.15)]"
                  style={{ borderColor: errors.receiverAccount ? '#cc0000' : '#d7dbe0' }}
                  placeholder="Nhap tai khoan..."
                  value={receiverAccount}
                  onChange={(e) => setReceiverAccount(e.target.value)}
                />
              </Field>
              <Field label="Mo tai NH/KB" required>
                <input
                  type="text"
                  className="h-8 px-2 text-[13px] border rounded outline-none focus:border-[#0b5394] focus:ring-2 focus:ring-[rgba(11,83,148,.15)]"
                  style={{ borderColor: '#d7dbe0' }}
                  placeholder="Nhap ten NH/KB..."
                  value={receiverBankName}
                  onChange={(e) => setReceiverBankName(e.target.value)}
                />
              </Field>
            </div>
          </Section>

          {/* Section 4: Chi tiet hack toan */}
          <Section title="4. Chi tiet hack toan (COA)">
            <div className="overflow-x-auto border rounded" style={{ borderColor: '#d7dbe0' }}>
              <table className="w-full border-collapse text-[12.5px]">
                <thead>
                  <tr>
                    <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2 py-1.5 text-left border-b border-[#c9d6e3] whitespace-nowrap w-[40px] text-center">STT</th>
                    <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2 py-1.5 text-left border-b border-[#c9d6e3] whitespace-nowrap">Ma quy</th>
                    <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2 py-1.5 text-left border-b border-[#c9d6e3] whitespace-nowrap">TK tu nhien</th>
                    <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2 py-1.5 text-left border-b border-[#c9d6e3] whitespace-nowrap">DVQHNS</th>
                    <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2 py-1.5 text-left border-b border-[#c9d6e3] whitespace-nowrap">Cap NS</th>
                    <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2 py-1.5 text-left border-b border-[#c9d6e3] whitespace-nowrap">Chuong</th>
                    <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2 py-1.5 text-left border-b border-[#c9d6e3] whitespace-nowrap">Nganh KT</th>
                    <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2 py-1.5 text-left border-b border-[#c9d6e3] whitespace-nowrap">NDKT</th>
                    <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2 py-1.5 text-left border-b border-[#c9d6e3] whitespace-nowrap">Dien giai</th>
                    <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2 py-1.5 text-right border-b border-[#c9d6e3] whitespace-nowrap">So tien</th>
                    <th className="bg-[#eef3f9] text-[#073763] text-xs font-bold uppercase tracking-wide px-2 py-1.5 text-center border-b border-[#c9d6e3] whitespace-nowrap w-[60px]">Xoa</th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((d, idx) => (
                    <tr key={idx} className="hover:bg-[#eef5fd] even:bg-[#fafcfe]">
                      <td className="px-2 py-1 border-b text-center" style={{ borderColor: '#d7dbe0' }}>{idx + 1}</td>
                      <td className="px-1 py-1 border-b" style={{ borderColor: '#d7dbe0' }}>
                        <input className="h-7 px-1 text-[12.5px] border rounded w-full" style={{ borderColor: '#d7dbe0' }} value={d.glSegment1} onChange={(e) => updateDetail(idx, 'glSegment1', e.target.value)} />
                      </td>
                      <td className="px-1 py-1 border-b" style={{ borderColor: '#d7dbe0' }}>
                        <input className="h-7 px-1 text-[12.5px] border rounded w-full" style={{ borderColor: '#d7dbe0' }} value={d.glSegment2} onChange={(e) => updateDetail(idx, 'glSegment2', e.target.value)} />
                      </td>
                      <td className="px-1 py-1 border-b" style={{ borderColor: '#d7dbe0' }}>
                        <input className="h-7 px-1 text-[12.5px] border rounded w-full" style={{ borderColor: '#d7dbe0' }} value={d.glSegment3} onChange={(e) => updateDetail(idx, 'glSegment3', e.target.value)} />
                      </td>
                      <td className="px-1 py-1 border-b" style={{ borderColor: '#d7dbe0' }}>
                        <input className="h-7 px-1 text-[12.5px] border rounded w-full" style={{ borderColor: '#d7dbe0' }} value={d.glSegment4} onChange={(e) => updateDetail(idx, 'glSegment4', e.target.value)} />
                      </td>
                      <td className="px-1 py-1 border-b" style={{ borderColor: '#d7dbe0' }}>
                        <input className="h-7 px-1 text-[12.5px] border rounded w-full" style={{ borderColor: '#d7dbe0' }} value={d.glSegment5} onChange={(e) => updateDetail(idx, 'glSegment5', e.target.value)} />
                      </td>
                      <td className="px-1 py-1 border-b" style={{ borderColor: '#d7dbe0' }}>
                        <input className="h-7 px-1 text-[12.5px] border rounded w-full" style={{ borderColor: '#d7dbe0' }} value={d.glSegment6} onChange={(e) => updateDetail(idx, 'glSegment6', e.target.value)} />
                      </td>
                      <td className="px-1 py-1 border-b" style={{ borderColor: '#d7dbe0' }}>
                        <input className="h-7 px-1 text-[12.5px] border rounded w-full" style={{ borderColor: '#d7dbe0' }} value={d.glSegment7} onChange={(e) => updateDetail(idx, 'glSegment7', e.target.value)} />
                      </td>
                      <td className="px-1 py-1 border-b" style={{ borderColor: '#d7dbe0' }}>
                        <input className="h-7 px-1 text-[12.5px] border rounded w-full min-w-[120px]" style={{ borderColor: '#d7dbe0' }} value={d.description} onChange={(e) => updateDetail(idx, 'description', e.target.value)} placeholder="Dien giai..." />
                      </td>
                      <td className="px-1 py-1 border-b" style={{ borderColor: '#d7dbe0' }}>
                        <input className="h-7 px-1 text-[12.5px] border rounded w-full text-right" style={{ borderColor: '#d7dbe0' }} value={d.amount || ''} onChange={(e) => updateDetail(idx, 'amount', Number(e.target.value.replace(/,/g, '')) || 0)} placeholder="0" />
                      </td>
                      <td className="px-1 py-1 border-b text-center" style={{ borderColor: '#d7dbe0' }}>
                        <button
                          type="button"
                          className="w-[26px] h-[26px] border rounded flex items-center justify-center bg-white text-[#c0392b] hover:bg-[#fdecec] transition-colors"
                          style={{ borderColor: '#e7c2c2' }}
                          onClick={() => removeDetailLine(idx)}
                          disabled={details.length <= 1}
                          title="Xoa dong"
                        >
                          <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                className="h-8 px-3 rounded text-[12.5px] font-semibold inline-flex items-center gap-1.5 bg-white border hover:bg-[#f3f5f8] transition-colors"
                style={{ borderColor: '#d7dbe0', color: '#0b5394' }}
                onClick={addDetailLine}
              >
                <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
                Them dong
              </button>
              <span className="text-xs text-[#5f6368] ml-auto">
                Tong so dong: <b>{details.length}</b> | Tong so tien: <b>{formatNumber(detailTotal)}</b>
              </span>
            </div>
          </Section>
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-t" style={{ background: '#fafcfe', borderColor: '#d7dbe0' }}>
          <button
            type="button"
            className="h-8 px-4 rounded text-[12.5px] font-semibold inline-flex items-center gap-1.5 text-white transition"
            style={{ background: '#0b5394' }}
            onClick={handleSaveDraft}
          >
            <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            Luu nhap <span className="font-mono text-[10.5px] bg-white/20 rounded px-1 ml-0.5">Ctrl+Shift+S</span>
          </button>
          <button
            type="button"
            className="h-8 px-4 rounded text-[12.5px] font-semibold inline-flex items-center gap-1.5 text-white hover:brightness-110 transition"
            style={{ background: '#137333' }}
            onClick={handleSubmit}
          >
            <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2 11 13" />
              <path d="M22 2 15 22 11 13 2 9z" />
            </svg>
            Gui kiem soat <span className="font-mono text-[10.5px] bg-white/20 rounded px-1 ml-0.5">Ctrl+Enter</span>
          </button>
          <button
            type="button"
            className="h-8 px-4 rounded text-[12.5px] font-semibold inline-flex items-center gap-1.5 bg-white border hover:bg-[#fdecec] transition-colors"
            style={{ borderColor: '#e7c2c2', color: '#cc0000' }}
            onClick={handleCancel}
          >
            Huy <span className="font-mono text-[10.5px] bg-[rgba(0,0,0,.08)] rounded px-1 ml-0.5">Esc</span>
          </button>
        </div>
      </div>
    </>
  );
}
