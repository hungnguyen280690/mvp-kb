import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createLtt, updateLtt, getLtt } from "../api/lttApi";
import type { LttCreateRequest } from "../api/lttApi";

type FormTab = "general" | "details" | "sender" | "receiver";

export default function LttFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fVer, setFVer] = useState(1);
  const [activeTab, setActiveTab] = useState<FormTab>("general");

  const [form, setForm] = useState<LttCreateRequest>({
    channel: "TTSP",
    refNo: "",
    amount: 0,
    currencyCode: "VND",
    valueDate: new Date().toISOString().split("T")[0],
    description: "",
    sender: {
      senderName: "",
      senderGlSegment2: "",
      senderBankCode: "",
    },
    receiver: {
      receiverName: "",
      receiverGlSegment2: "",
      receiverBankName: "",
      receiverBankCode: "",
    },
  });

  useEffect(() => {
    if (!isEdit || !id) return;
    setLoading(true);
    getLtt(id)
      .then((res) => {
        const d = res.data;
        setFVer(d.fVer ?? 1);
        setForm({
          channel:
            d.channel === "LNH" || d.channel === "TTSP" ? d.channel : "TTSP",
          refNo: d.lttCode,
          amount: d.amount,
          currencyCode: d.currency,
          valueDate: d.valueDate,
          description: d.description ?? "",
          sender: {
            senderName: d.senderName,
            senderGlSegment2: d.senderAccount,
            senderBankCode: d.senderBank ?? "",
          },
          receiver: {
            receiverName: d.receiverName,
            receiverGlSegment2: d.receiverAccount,
            receiverBankName: d.receiverBank ?? "",
            receiverBankCode: "",
          },
        });
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Loi tai du lieu"),
      )
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const tabs: { key: FormTab; label: string }[] = [
    { key: "general", label: "Thong tin chung" },
    { key: "details", label: "Chi tiet" },
    { key: "sender", label: "Nguoi gui" },
    { key: "receiver", label: "Nguoi nhan" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      if (isEdit && id) {
        await updateLtt(id, { fVer, ...form });
      } else {
        await createLtt(form);
      }
      navigate("/ltt");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Loi xay ra");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setSubmitting(true);
    setError("");
    try {
      if (isEdit && id) {
        await updateLtt(id, { fVer, ...form });
      } else {
        await createLtt(form);
      }
      navigate("/ltt");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Loi xay ra");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Dang tai...</div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? `Chinh sua LTT #${id}` : "Tao moi Lenh Thanh Toan"}
        </h1>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Quay lai
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

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
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {activeTab === "general" && (
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
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      channel: e.target.value as "LNH" | "TTSP",
                    }))
                  }
                >
                  <option value="TTSP">Thanh toan song phuong</option>
                  <option value="LNH">Lien ngan hang</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  So YCTT <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.refNo}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, refNo: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  So tien <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.amount || ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, amount: Number(e.target.value) }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Loai tien <span className="text-red-500">*</span>
                </label>
                <select
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.currencyCode}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, currencyCode: e.target.value }))
                  }
                >
                  <option value="VND">VND</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Ngay thanh toan
                </label>
                <input
                  type="date"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.paymentDate ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, paymentDate: e.target.value }))
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Noi dung thanh toan
                </label>
                <textarea
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.description ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "sender" && (
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
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.sender?.senderName ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      sender: { ...p.sender!, senderName: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tai khoan gui <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.sender?.senderGlSegment2 ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      sender: {
                        ...p.sender!,
                        senderGlSegment2: e.target.value,
                      },
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Ma NH/KB gui
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.sender?.senderBankCode ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      sender: { ...p.sender!, senderBankCode: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "receiver" && (
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
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.receiver?.receiverName ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      receiver: {
                        ...p.receiver!,
                        receiverName: e.target.value,
                      },
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tai khoan nhan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.receiver?.receiverGlSegment2 ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      receiver: {
                        ...p.receiver!,
                        receiverGlSegment2: e.target.value,
                      },
                    }))
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
                  value={form.receiver?.receiverBankName ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      receiver: {
                        ...p.receiver!,
                        receiverBankName: e.target.value,
                      },
                    }))
                  }
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "details" && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">
              Chi tiet khoan muc (COA)
            </h2>
            <p className="text-sm text-gray-500">
              Tinh nang chi tiet khoan muc se duoc phat trien o phien ban tiep
              theo. Hien tai, he thong tu dong tao 1 dong chi tiet voi toan bo
              so tien.
            </p>
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
            disabled={submitting}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Luu nhap
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Dang xu ly..." : isEdit ? "Cap nhat" : "Tao moi"}
          </button>
        </div>
      </form>
    </div>
  );
}
