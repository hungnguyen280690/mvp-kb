import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import LttStatusBadge from "../components/LttStatusBadge";
import { getLtt, checkLtt } from "../api/lttApi";
import type { LttDetail } from "../api/lttApi";

export default function LttCheckPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<LttDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<"APPROVE" | "RETURN" | "REJECT" | "">(
    "",
  );
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [checklist, setChecklist] = useState({
    tkChuyen: false,
    tkNhan: false,
    coaHopLe: false,
    hanMuc: false,
    tongTienKhop: false,
    dinhKemHopLe: false,
  });

  const allChecked = Object.values(checklist).every(Boolean);

  useEffect(() => {
    if (!id) return;
    getLtt(id)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const canSubmit = () => {
    if (!action) return false;
    if (action === "APPROVE" && !allChecked) return false;
    if ((action === "RETURN" || action === "REJECT") && note.length < 10)
      return false;
    return true;
  };

  const handleSubmit = async () => {
    if (!id || !action || !canSubmit()) return;
    setSubmitting(true);
    setError("");
    try {
      await checkLtt(id, {
        action,
        note: action !== "APPROVE" ? note : undefined,
      });
      navigate(`/ltt/${id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Loi xay ra");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Dang tai...</div>;
  }

  if (!data) {
    return (
      <div className="p-6 text-center text-red-500">
        {error || "Khong tim thay LTT"}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Kiem soat LTT: {data.lttCode}
          </h1>
          <p className="mt-1 text-sm text-gray-500">ID: {id}</p>
        </div>
        <div className="flex items-center gap-3">
          <LttStatusBadge status={data.status} />
          <Link
            to={`/ltt/${id}`}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            &larr; Quay lai
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Read-only Detail */}
      <div className="space-y-6">
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
              <dt className="text-sm font-medium text-gray-500">Mo ta</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {data.description ?? "-"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Thong tin nguoi gui
          </h2>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Ten nguoi gui
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{data.senderName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">So TK gui</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {data.senderAccount}
              </dd>
            </div>
          </dl>
        </div>

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
          </dl>
        </div>
      </div>

      {/* Checker Action Area */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-blue-800">
          Khu vuc Kiem soat
        </h2>

        {/* Checklist */}
        <div className="mb-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Checklist ra soat (bat buoc tick tat ca de Dong y kiem soat):
          </p>
          {[
            { key: "tkChuyen" as const, label: "TK chuyen dung" },
            { key: "tkNhan" as const, label: "TK nhan dung" },
            { key: "coaHopLe" as const, label: "COA hop le" },
            { key: "hanMuc" as const, label: "Han muc OK" },
            { key: "tongTienKhop" as const, label: "Tong tien khop" },
            { key: "dinhKemHopLe" as const, label: "Dinh kem hop le" },
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-center gap-2 text-sm text-gray-700"
            >
              <input
                type="checkbox"
                checked={checklist[item.key]}
                onChange={(e) =>
                  setChecklist((prev) => ({
                    ...prev,
                    [item.key]: e.target.checked,
                  }))
                }
                className="rounded border-gray-300"
              />
              {item.label}
            </label>
          ))}
        </div>

        {/* Action Selection */}
        <div className="mb-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Ket qua kiem soat:
          </p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="checkAction"
                value="APPROVE"
                checked={action === "APPROVE"}
                onChange={() => setAction("APPROVE")}
                disabled={!allChecked}
              />
              Dong y kiem soat
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="checkAction"
                value="RETURN"
                checked={action === "RETURN"}
                onChange={() => setAction("RETURN")}
              />
              Tra lai Maker
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="checkAction"
                value="REJECT"
                checked={action === "REJECT"}
                onChange={() => setAction("REJECT")}
              />
              Tu choi
            </label>
          </div>
          {!allChecked && (
            <p className="text-xs text-gray-500">
              Can tick tat ca checklist moi duoc chon "Dong y kiem soat"
            </p>
          )}
        </div>

        {/* Note */}
        {(action === "RETURN" || action === "REJECT") && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Ghi chu kiem soat <span className="text-red-500">*</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Nhap ly do (toi thieu 10 ky tu)"
            />
            {note.length > 0 && note.length < 10 && (
              <p className="mt-1 text-xs text-red-500">
                Can toi thieu 10 ky tu ({note.length}/10)
              </p>
            )}
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit() || submitting}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Dang xu ly..." : "Xac nhan"}
          </button>
          <Link
            to={`/ltt/${id}`}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Huy
          </Link>
        </div>
      </div>
    </div>
  );
}
