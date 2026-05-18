import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import LttStatusBadge from "../components/LttStatusBadge";
import { getLtt, submitLtt, copyLtt, deleteLtt } from "../api/lttApi";
import type { LttDetail } from "../api/lttApi";

type ViewTab = "detail" | "attachments" | "history" | "approval";

export default function LttViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<LttDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<ViewTab>("detail");
  const [deleteReason, setDeleteReason] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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

  const handleSubmit = async () => {
    if (!id) return;
    setSubmitting(true);
    try {
      await submitLtt(id);
      const res = await getLtt(id);
      setData(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Loi xay ra");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!id) return;
    try {
      const res = await copyLtt(id);
      navigate(`/ltt/${res.data.id}/edit`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Loi xay ra");
    }
  };

  const handleDelete = async () => {
    if (!id || deleteReason.length < 10) return;
    setSubmitting(true);
    try {
      await deleteLtt(id, { fVer: data?.fVer ?? 1, deleteReason });
      navigate("/ltt");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Loi xay ra");
    } finally {
      setSubmitting(false);
    }
  };

  const canEdit =
    data?.status === "DRAFT" || data?.status === "RETURNED_TO_MAKER";
  const canSubmit = canEdit;
  const canDelete = canEdit;
  const canCheck = data?.status === "READY_FOR_APPROVAL";
  const canApprove = data?.status === "PENDING_APPROVER";

  const tabs: { key: ViewTab; label: string }[] = [
    { key: "detail", label: "Chi tiet" },
    { key: "attachments", label: "Dinh kem" },
    { key: "history", label: "Lich su" },
    { key: "approval", label: "Trang thai phe duyet" },
  ];

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

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-wrap gap-2">
        {canEdit && (
          <Link
            to={`/ltt/${id}/edit`}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Chinh sua
          </Link>
        )}
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Sao chep
        </button>
        {canSubmit && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-md border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100 disabled:opacity-50"
          >
            {submitting ? "Dang xu ly..." : "Trinh duyet"}
          </button>
        )}
        {canCheck && (
          <Link
            to={`/ltt/${id}/check`}
            className="rounded-md border border-purple-300 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100"
          >
            Kiem soat
          </Link>
        )}
        {canApprove && (
          <Link
            to={`/ltt/${id}/approve`}
            className="rounded-md border border-green-300 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
          >
            Phe duyet
          </Link>
        )}
        {canDelete && (
          <button
            type="button"
            onClick={() => setShowDeleteDialog(true)}
            className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            Xoa
          </button>
        )}
      </div>

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h3 className="text-lg font-semibold text-red-800">Xac nhan xoa</h3>
          <p className="mt-2 text-sm text-gray-700">
            Ban co chac muon xoa LTT <strong>{data.lttCode}</strong>?
          </p>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">
              Ly do xoa <span className="text-red-500">*</span>
            </label>
            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Nhap ly do (toi thieu 10 ky tu)"
            />
            {deleteReason.length > 0 && deleteReason.length < 10 && (
              <p className="mt-1 text-xs text-red-500">
                Can toi thieu 10 ky tu ({deleteReason.length}/10)
              </p>
            )}
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteReason.length < 10 || submitting}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? "Dang xu ly..." : "Xac nhan xoa"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteReason("");
              }}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Huy
            </button>
          </div>
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
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "detail" && (
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
                <dt className="text-sm font-medium text-gray-500">Mo ta</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {data.description ?? "-"}
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
                  {data.senderBank ?? "-"}
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
                <dt className="text-sm font-medium text-gray-500">
                  So TK nhan
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {data.receiverAccount}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Ngan hang nhan
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {data.receiverBank ?? "-"}
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
              {data.checkedBy && (
                <>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Nguoi kiem soat
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {data.checkedBy}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Ngay kiem soat
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {data.checkedDate ?? "-"}
                    </dd>
                  </div>
                </>
              )}
              {data.approvedBy && (
                <>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Nguoi phe duyet
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {data.approvedBy}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Ngay phe duyet
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {data.approvedDate ?? "-"}
                    </dd>
                  </div>
                </>
              )}
              {data.fVer !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Phien ban
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{data.fVer}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}

      {activeTab === "attachments" && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Tai lieu dinh kem
          </h2>
          {data.attachments && data.attachments.length > 0 ? (
            <ul className="space-y-2">
              {data.attachments.map((att) => (
                <li
                  key={att.id}
                  className="flex items-center justify-between rounded-md border px-4 py-2"
                >
                  <span className="text-sm text-gray-700">{att.fileName}</span>
                  <span className="text-xs text-gray-500">
                    {(att.fileSize / 1024).toFixed(1)} KB
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">Chua co tai lieu dinh kem.</p>
          )}
        </div>
      )}

      {activeTab === "history" && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Lich su giao dich
          </h2>
          <p className="text-sm text-gray-500">
            Lich su se duoc hien thi khi API audit san sang.
          </p>
        </div>
      )}

      {activeTab === "approval" && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Trang thai phe duyet
          </h2>
          <div className="flex items-center gap-4">
            {(
              [
                "DRAFT",
                "READY_FOR_APPROVAL",
                "PENDING_APPROVER",
                "APPROVED",
              ] as LttDetail["status"][]
            ).map((step, i) => {
              const statusOrder = [
                "DRAFT",
                "READY_FOR_APPROVAL",
                "PENDING_APPROVER",
                "APPROVED",
              ];
              const currentIdx = statusOrder.indexOf(data.status);
              const stepIdx = statusOrder.indexOf(step);
              const isDone = stepIdx <= currentIdx && currentIdx >= 0;
              return (
                <div key={step} className="flex items-center gap-2">
                  {i > 0 && (
                    <div
                      className={`h-0.5 w-8 ${isDone ? "bg-blue-500" : "bg-gray-200"}`}
                    />
                  )}
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                      isDone
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span
                    className={`text-xs ${isDone ? "text-blue-600 font-medium" : "text-gray-400"}`}
                  >
                    {step === "DRAFT"
                      ? "Nhap"
                      : step === "READY_FOR_APPROVAL"
                        ? "Kiem soat"
                        : step === "PENDING_APPROVER"
                          ? "Phe duyet"
                          : "Hoan thanh"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
