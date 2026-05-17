import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { LttCreateRequest } from '../api/lttApi';

type FormTab = 'general' | 'details' | 'sender' | 'receiver';

export default function LttFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [activeTab, setActiveTab] = useState<FormTab>('general');
  const [form, setForm] = useState<LttCreateRequest>({
    channel: 'INTERNAL',
    senderName: '',
    senderAccount: '',
    receiverName: '',
    receiverAccount: '',
    currency: 'VND',
    amount: 0,
    valueDate: new Date().toISOString().split('T')[0],
    description: '',
    paymentPurpose: '',
  });

  const tabs: { key: FormTab; label: string }[] = [
    { key: 'general', label: 'Thong tin chung' },
    { key: 'details', label: 'Chi tiet' },
    { key: 'sender', label: 'Nguoi gui' },
    { key: 'receiver', label: 'Nguoi nhan' },
  ];

  const handleChange = (
    field: keyof LttCreateRequest,
    value: string | number,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: call createLtt / updateLtt API
    console.log('Submit form:', form);
  };

  const handleSaveDraft = () => {
    // TODO: save draft via API
    console.log('Save draft:', form);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? `Chinh sua LTT #${id}` : 'Tao moi Lenh Thanh Toan'}
        </h1>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Quay lai
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {activeTab === 'general' && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">
              Thong tin chung
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Kenh thanh toan <span className="text-red-500">*</span>
                </label>
                <select
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.channel}
                  onChange={(e) => handleChange('channel', e.target.value)}
                >
                  <option value="INTERNAL">Noi bo</option>
                  <option value="SWIFT">SWIFT</option>
                  <option value="RTGS">RTGS</option>
                  <option value="NAPAS">NAPAS</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Loai tien <span className="text-red-500">*</span>
                </label>
                <select
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                >
                  <option value="VND">VND</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  So tien <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.amount || ''}
                  onChange={(e) =>
                    handleChange('amount', Number(e.target.value))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Ngay hach toan <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.valueDate}
                  onChange={(e) => handleChange('valueDate', e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Mo ta
                </label>
                <textarea
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.description ?? ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'details' && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">
              Chi tiet lenh
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Muc dich thanh toan
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.paymentPurpose ?? ''}
                  onChange={(e) =>
                    handleChange('paymentPurpose', e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nguoi chiu phi
                </label>
                <select className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="OUR">Nguoi gui (OUR)</option>
                  <option value="BEN">Nguoi nhan (BEN)</option>
                  <option value="SHA">Chia se (SHA)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Ty gia
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Tu dong lay ty gia"
                />
              </div>
            </div>
            <p className="mt-4 text-sm italic text-gray-400">
              Placeholder: Cac truong chi tiet bo sung se duoc day du khi tich
              hop API.
            </p>
          </div>
        )}

        {activeTab === 'sender' && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">
              Thong tin nguoi gui
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Ten nguoi gui <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.senderName}
                  onChange={(e) => handleChange('senderName', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  So tai khoan gui <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.senderAccount}
                  onChange={(e) =>
                    handleChange('senderAccount', e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Ngan hang gui
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.senderBank ?? ''}
                  onChange={(e) => handleChange('senderBank', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Chi nhanh gui
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.senderBranch ?? ''}
                  onChange={(e) =>
                    handleChange('senderBranch', e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'receiver' && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">
              Thong tin nguoi nhan
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Ten nguoi nhan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.receiverName}
                  onChange={(e) => handleChange('receiverName', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  So tai khoan nhan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.receiverAccount}
                  onChange={(e) =>
                    handleChange('receiverAccount', e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Ngan hang nhan
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.receiverBank ?? ''}
                  onChange={(e) =>
                    handleChange('receiverBank', e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Chi nhanh nhan
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.receiverBranch ?? ''}
                  onChange={(e) =>
                    handleChange('receiverBranch', e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
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
            onClick={handleSaveDraft}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Luu nhap
          </button>
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {isEdit ? 'Cap nhat' : 'Tao moi'}
          </button>
        </div>
      </form>
    </div>
  );
}
