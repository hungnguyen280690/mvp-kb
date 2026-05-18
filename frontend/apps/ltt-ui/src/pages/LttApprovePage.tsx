import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import LttStatusBadge from "../components/LttStatusBadge";
import { getLtt, approveLtt } from "../api/lttApi";
import type { LttDetail } from "../api/lttApi";

type ApproveAction = "APPROVE" | "RETURN" | "REJECT";

export default function LttApprovePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<LttDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [action, setAction] = useState<ApproveAction | "">("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getLtt(id)
      .then((res) => setData(res.data))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Loi tai du lieu"),
      )
      .finally(() => setLoading(false));
  }, [id]);

  const canSubmit = () => {
    if (!action) return false;
    if ((action === "RETURN" || action === "REJECT") && note.length < 10)
      return false;
    return true;
  };

  const handleAction = async () => {
    if (!id || !action || !canSubmit()) return;
    setSubmitting(true);
    setError("");
    try {
      await approveLtt(id, {
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
            Phe duyet Lenh Thanh Toan: {data.lttCode}
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
          {data.checkedBy && (
            <div>
              <dt className="text-xs font-medium text-blue-600">
                Nguoi kiem soat
              </dt>
              <dd className="mt-1 text-sm text-blue-900">{data.checkedBy}</dd>
            </div>
          )}
          <div className="sm:col-span-3">
            <dt className="text-xs font-medium text-blue-600">Mo ta</dt>
            <dd className="mt-1 text-sm text-blue-900">
              {data.description ?? "-"}
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
            onClick={() => setAction("APPROVE")}
            className={`rounded-md border px-6 py-3 text-sm font-medium transition-colors ${
              action === "APPROVE"
                ? "border-green-600 bg-green-600 text-white"
                : "border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
            }`}
          >
            Dong y phe duyet
          </button>
          <button
            type="button"
            onClick={() => setAction("RETURN")}
            className={`rounded-md border px-6 py-3 text-sm font-medium transition-colors ${
              action === "RETURN"
                ? "border-orange-600 bg-orange-600 text-white"
                : "border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100"
            }`}
          >
            Tra lai
          </button>
          <button
            type="button"
            onClick={() => setAction("REJECT")}
            className={`rounded-md border px-6 py-3 text-sm font-medium transition-colors ${
              action === "REJECT"
                ? "border-red-600 bg-red-600 text-white"
                : "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
            }`}
          >
            Tu choi
          </button>
        </div>

        {/* Note */}
        {(action === "RETURN" || action === "REJECT") && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Y kien ghi chu <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Nhap y kien (toi thieu 10 ky tu)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            {note.length > 0 && note.length < 10 && (
              <p className="mt-1 text-xs text-red-500">
                Can toi thieu 10 ky tu ({note.length}/10)
              </p>
            )}
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
          <Link
            to={`/ltt/${id}`}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Huy
          </Link>
          <button
            type="button"
            disabled={!canSubmit() || submitting}
            onClick={handleAction}
            className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Dang xu ly..." : "Xac nhan"}
          </button>
        </div>
      </div>
    </div>
  );
}
