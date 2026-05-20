import { useState, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useAppNavigate } from "../hooks/useAppNavigate";
import {
  useOrder,
  useWorkflowAction,
  useApprovalStatus,
} from "../hooks/usePayOutManual";
import { StatusBadge } from "../components/StatusBadge";
import { WorkflowStepper } from "../components/WorkflowStepper";
import { ReasonModal } from "../components/ReasonModal";
import { ErrorBoundary } from "../components/ErrorBoundary";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${mi}:${ss}`;
  } catch {
    return iso;
  }
}

function formatAmount(n: number): string {
  return n.toLocaleString("vi-VN");
}

/** Segment labels for COA lines */
const SEGMENT_KEYS = [
  "GL_SEGMENT1",
  "GL_SEGMENT2",
  "GL_SEGMENT3",
  "GL_SEGMENT4",
  "GL_SEGMENT5",
  "GL_SEGMENT6",
  "GL_SEGMENT7",
  "GL_SEGMENT8",
  "GL_SEGMENT9",
  "GL_SEGMENT10",
  "GL_SEGMENT11",
  "GL_SEGMENT12",
] as const;

// ---------------------------------------------------------------------------
// Inner component
// ---------------------------------------------------------------------------

function PayOutManualApproveInner() {
  const { id } = useParams<{ id: string }>();
  const nav = useAppNavigate();

  const { data: order, loading, error } = useOrder(id || null);
  const approvalStatusHook = useApprovalStatus(id || null);
  const workflowHook = useWorkflowAction();

  // Reason modal
  const [reasonModalOpen, setReasonModalOpen] = useState(false);
  const [reasonAction, setReasonAction] = useState<"return" | "reject" | null>(
    null,
  );
  const [reasonLoading, setReasonLoading] = useState(false);

  // Determine the approve action type
  const approveAction = useMemo((): "checkApprove" | "approve" => {
    if (order?.STATUS === "READY_FOR_APPROVAL") return "checkApprove";
    return "approve";
  }, [order?.STATUS]);

  const handleApprove = useCallback(async () => {
    if (!id) return;
    try {
      await workflowHook.execute({ action: approveAction, id });
      nav.toView(id);
    } catch (err) {
      console.error("Approve failed:", err);
    }
  }, [id, approveAction, workflowHook, nav]);

  const openReasonModal = useCallback((action: "return" | "reject") => {
    setReasonAction(action);
    setReasonModalOpen(true);
  }, []);

  const handleReasonConfirm = useCallback(
    async (reason: string) => {
      if (!id || !reasonAction) return;
      setReasonLoading(true);
      try {
        await workflowHook.execute({ action: reasonAction, id, reason });
        setReasonModalOpen(false);
        nav.toView(id);
      } catch (err) {
        console.error(`${reasonAction} failed:`, err);
      } finally {
        setReasonLoading(false);
      }
    },
    [id, reasonAction, workflowHook, nav],
  );

  const handleBack = useCallback(() => {
    if (id) nav.toView(id);
    else nav.toHome();
  }, [id, nav]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f6fa]">
        <span className="text-[13px] text-[#5f6368]">Đang tải dữ liệu…</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f4f6fa]">
        <span className="text-[13px] text-[#cc0000]">
          Lỗi tải dữ liệu: {error?.message || "Không tìm thấy lệnh"}
        </span>
        <button
          type="button"
          onClick={handleBack}
          className="mt-3 rounded bg-[#0b5394] px-4 py-2 text-[12.5px] font-semibold text-white"
        >
          Quay lại
        </button>
      </div>
    );
  }

  const isActionable =
    order.STATUS === "READY_FOR_APPROVAL" ||
    order.STATUS === "PENDING_APPROVER";

  return (
    <div className="min-h-screen bg-[#f4f6fa] px-5 pb-10 pt-4">
      {/* Breadcrumb */}
      <nav className="mb-3 bg-white px-5 py-2 text-[12px]">
        <span
          className="cursor-pointer text-[#0b5394]"
          onClick={() => nav.toHome()}
        >
          Lệnh thanh toán đi
        </span>
        <span className="mx-1.5 text-[#bbb]">&rsaquo;</span>
        <span className="cursor-pointer text-[#0b5394]" onClick={handleBack}>
          {order.REF_NO}
        </span>
        <span className="mx-1.5 text-[#bbb]">&rsaquo;</span>
        <span className="font-semibold text-[#1f2328]">Phê duyệt</span>
      </nav>

      {/* Header */}
      <div className="mb-3.5 rounded-md border border-[#d7dbe0] bg-white p-3.5 shadow-[0_1px_2px_rgba(15,20,25,0.04)]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[16px] font-bold text-[#073763]">
              Phê duyệt lệnh — {order.REF_NO}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-[12px] text-[#5f6368]">
              <span>
                Kênh: <strong className="text-[#333]">{order.CHANNEL}</strong>
              </span>
              <span>
                Số tiền:{" "}
                <strong className="text-[#333]">
                  {formatAmount(order.AMOUNT)} {order.CURRENCY_CODE}
                </strong>
              </span>
              <span>
                Ngày TT:{" "}
                <strong className="text-[#333]">
                  {formatDateTime(order.PAYMENT_DATE)}
                </strong>
              </span>
              <span>
                Nguời tạo:{" "}
                <strong className="text-[#333]">{order.CREATED_BY}</strong>
              </span>
              <span>
                Mô tả:{" "}
                <strong className="text-[#333]">{order.DESCRIPTION}</strong>
              </span>
            </div>
          </div>
          <StatusBadge status={order.STATUS} />
        </div>
      </div>

      {/* Workflow stepper */}
      <div className="mb-3.5">
        <WorkflowStepper
          currentStatus={order.STATUS}
          steps={approvalStatusHook.steps}
        />
      </div>

      {/* Summary card */}
      <div className="mb-3.5 rounded-md border border-[#d7dbe0] bg-white shadow-[0_1px_2px_rgba(15,20,25,0.04)]">
        <div className="flex items-center justify-between rounded-t-md bg-[#eef3f9] px-3.5 py-2.5">
          <h2 className="text-[13px] font-bold uppercase text-[#073763]">
            Tổng hợp lệnh
          </h2>
          <span className="text-[11px] text-[#5f6368]">TT_LTT.APPROVE.SUM</span>
        </div>
        <div className="grid grid-cols-3 gap-x-[18px] gap-y-3 p-3.5 max-[960px]:grid-cols-2 max-[600px]:grid-cols-1">
          <div>
            <span className="text-[11px] text-[#5f6368]">
              Nguời chứng triệt
            </span>
            <div className="text-[13px] font-semibold text-[#333]">
              {order.SENDER_NAME}
            </div>
          </div>
          <div>
            <span className="text-[11px] text-[#5f6368]">
              Mã ngân hàng (Nguời CT)
            </span>
            <div className="text-[13px] font-semibold text-[#333]">
              {order.SENDER_BANK_CODE}
            </div>
          </div>
          <div>
            <span className="text-[11px] text-[#5f6368]">Nguời hưởng</span>
            <div className="text-[13px] font-semibold text-[#333]">
              {order.RECEIVER_NAME}
            </div>
          </div>
          <div>
            <span className="text-[11px] text-[#5f6368]">
              Mã ngân hàng (Nguời hưởng)
            </span>
            <div className="text-[13px] font-semibold text-[#333]">
              {order.RECEIVER_BANK_CODE}
            </div>
          </div>
          <div>
            <span className="text-[11px] text-[#5f6368]">Tên tài khoản</span>
            <div className="text-[13px] font-semibold text-[#333]">
              {order.RECEIVER_ACCOUNT_NAME}
            </div>
          </div>
          <div>
            <span className="text-[11px] text-[#5f6368]">Tỷ giá</span>
            <div className="text-[13px] font-semibold text-[#333]">
              {order.EXCHANGE_RATE || "N/A"}
            </div>
          </div>
          <div className="col-span-2">
            <span className="text-[11px] text-[#5f6368]">Mô tả</span>
            <div className="text-[13px] font-semibold text-[#333]">
              {order.DESCRIPTION}
            </div>
          </div>
        </div>
      </div>

      {/* COA Lines */}
      <div className="mb-3.5 rounded-md border border-[#d7dbe0] bg-white shadow-[0_1px_2px_rgba(15,20,25,0.04)]">
        <div className="flex items-center justify-between rounded-t-md bg-[#eef3f9] px-3.5 py-2.5">
          <h2 className="text-[13px] font-bold uppercase text-[#073763]">
            Khoản mục COA
          </h2>
          <span className="text-[11px] text-[#5f6368]">TT_LTT.APPROVE.COA</span>
        </div>
        <div className="p-3.5">
          {order.LINES.length === 0 ? (
            <div className="py-6 text-center text-[12px] italic text-[#5f6368]">
              Không có khoản mục COA.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12.5px]">
                <thead>
                  <tr className="border-b-2 border-[#c9d6e3] bg-[#eef3f9]">
                    <th className="w-[50px] px-2.5 py-2 text-center text-[12px] font-bold uppercase text-[#073763]">
                      STT
                    </th>
                    {SEGMENT_KEYS.map((key) => (
                      <th
                        key={key}
                        className="whitespace-nowrap px-2 py-2 text-center text-[12px] font-bold uppercase text-[#073763]"
                      >
                        {key.replace("GL_", "").replace("_", " ")}
                      </th>
                    ))}
                    <th className="px-2 py-2 text-left text-[12px] font-bold uppercase text-[#073763]">
                      Mô tả
                    </th>
                    <th className="px-2 py-2 text-right text-[12px] font-bold uppercase text-[#073763]">
                      Số tiền
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order.LINES.map((line, idx) => (
                    <tr
                      key={line.ID || idx}
                      className={`border-b border-[#d7dbe0] ${
                        idx % 2 === 1 ? "bg-[#fafcfe]" : ""
                      }`}
                    >
                      <td className="px-2.5 py-2 text-center text-[#5f6368]">
                        {idx + 1}
                      </td>
                      {SEGMENT_KEYS.map((seg) => (
                        <td key={seg} className="px-2 py-2 text-[#5f6368]">
                          {(line as unknown as Record<string, string>)[seg] ||
                            ""}
                        </td>
                      ))}
                      <td className="px-2 py-2 text-[#333]">
                        {line.LINE_DESCRIPTION}
                      </td>
                      <td className="px-2 py-2 text-right font-medium text-[#333]">
                        {formatAmount(line.LINE_AMOUNT)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[#c9d6e3] bg-[#eef3f9]">
                    <td
                      colSpan={SEGMENT_KEYS.length + 2}
                      className="px-2.5 py-2 text-right text-[12px] font-bold text-[#073763]"
                    >
                      Tổng cộng
                    </td>
                    <td className="px-2.5 py-2 text-right text-[12.5px] font-bold text-[#073763]">
                      {formatAmount(
                        order.LINES.reduce((sum, l) => sum + l.LINE_AMOUNT, 0),
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Approval actions */}
      <div className="sticky bottom-0 rounded-md border border-[#d7dbe0] bg-white shadow-[0_1px_2px_rgba(15,20,25,0.04)]">
        <div className="flex items-center justify-between px-3.5 py-2.5">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-8 items-center gap-1 rounded border border-[#d7dbe0] bg-white px-4 text-[12.5px] font-semibold text-[#333] transition-colors hover:bg-[#f3f5f8]"
          >
            Quay lại
          </button>

          {isActionable ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => openReasonModal("return")}
                disabled={workflowHook.loading}
                className="flex h-8 items-center gap-1 rounded border border-orange-300 bg-white px-4 text-[12.5px] font-semibold text-orange-700 transition-colors hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-55"
              >
                Trả lại
              </button>
              <button
                type="button"
                onClick={() => openReasonModal("reject")}
                disabled={workflowHook.loading}
                className="flex h-8 items-center gap-1 rounded border border-[#e7c2c2] bg-white px-4 text-[12.5px] font-semibold text-[#cc0000] transition-colors hover:bg-[#fdecec] disabled:cursor-not-allowed disabled:opacity-55"
              >
                Từ chối
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={workflowHook.loading}
                className="flex h-8 items-center gap-1 rounded bg-[#137333] px-4 text-[12.5px] font-semibold text-white transition-colors hover:brightness-[0.92] disabled:cursor-not-allowed disabled:opacity-55"
              >
                Phê duyệt
              </button>
            </div>
          ) : (
            <span className="text-[12px] text-[#5f6368]">
              Lệnh không còn trong trạng thái cho phép phê duyệt.
            </span>
          )}
        </div>
      </div>

      {/* Reason modal */}
      <ReasonModal
        open={reasonModalOpen}
        title={reasonAction === "return" ? "Trả lại lệnh" : "Từ chối lệnh"}
        label="Lý do"
        onConfirm={handleReasonConfirm}
        onCancel={() => setReasonModalOpen(false)}
        loading={reasonLoading}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Wrapped with ErrorBoundary
// ---------------------------------------------------------------------------

export function PayOutManualApprove() {
  return (
    <ErrorBoundary>
      <PayOutManualApproveInner />
    </ErrorBoundary>
  );
}

export default PayOutManualApprove;
