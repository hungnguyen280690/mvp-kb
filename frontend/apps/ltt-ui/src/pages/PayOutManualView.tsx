import { useState, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useAppNavigate } from "../hooks/useAppNavigate";
import type {
  OrderStatus,
  PayOrderLineRequest,
  CreateOrderRequest,
} from "../types/pay-out-manual";
import {
  useOrder,
  useAttachments,
  useAuditLog,
  useApprovalStatus,
  useDeleteOrder,
  useWorkflowAction,
} from "../hooks/usePayOutManual";
import { StatusBadge } from "../components/StatusBadge";
import { WorkflowStepper } from "../components/WorkflowStepper";
import { AttachmentManager } from "../components/AttachmentManager";
import { AuditLogTimeline } from "../components/AuditLogTimeline";
import { ReasonModal } from "../components/ReasonModal";
import { OrderFormTabs } from "../components/OrderForm/OrderFormTabs";
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

/** Determines which actions are available based on status and role */
function getAvailableActions(status: OrderStatus): {
  canEdit: boolean;
  canSubmit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canReturn: boolean;
  canReject: boolean;
  canCopy: boolean;
} {
  switch (status) {
    case "DRAFT":
    case "RETURNED_TO_MAKER":
      return {
        canEdit: true,
        canSubmit: true,
        canDelete: true,
        canApprove: false,
        canReturn: false,
        canReject: false,
        canCopy: true,
      };
    case "READY_FOR_APPROVAL":
      return {
        canEdit: false,
        canSubmit: false,
        canDelete: false,
        canApprove: true,
        canReturn: true,
        canReject: true,
        canCopy: true,
      };
    case "PENDING_APPROVER":
      return {
        canEdit: false,
        canSubmit: false,
        canDelete: false,
        canApprove: true,
        canReturn: true,
        canReject: true,
        canCopy: true,
      };
    default:
      return {
        canEdit: false,
        canSubmit: false,
        canDelete: false,
        canApprove: false,
        canReturn: false,
        canReject: false,
        canCopy: status === "APPROVED" || status === "REJECTED",
      };
  }
}

// ---------------------------------------------------------------------------
// Inner component
// ---------------------------------------------------------------------------

function PayOutManualViewInner() {
  const { id } = useParams<{ id: string }>();
  const nav = useAppNavigate();

  const { data: order, loading, error, refetch } = useOrder(id || null);
  const attachmentsHook = useAttachments(id || null);
  const auditLogHook = useAuditLog(id || null, 0, 20);
  const approvalStatusHook = useApprovalStatus(id || null);
  const deleteHook = useDeleteOrder();
  const workflowHook = useWorkflowAction();

  // Reason modal
  const [reasonModalOpen, setReasonModalOpen] = useState(false);
  const [reasonModalAction, setReasonModalAction] = useState<
    "return" | "reject" | "delete" | null
  >(null);
  const [reasonModalLoading, setReasonModalLoading] = useState(false);

  const actions = useMemo(
    () =>
      order
        ? getAvailableActions(order.STATUS)
        : {
            canEdit: false,
            canSubmit: false,
            canDelete: false,
            canApprove: false,
            canReturn: false,
            canReject: false,
            canCopy: false,
          },
    [order],
  );

  // Determine the correct approve action based on status
  const getApproveAction = useCallback((): "checkApprove" | "approve" => {
    if (order?.STATUS === "READY_FOR_APPROVAL") return "checkApprove";
    return "approve";
  }, [order?.STATUS]);

  const handleSubmit = useCallback(async () => {
    if (!id) return;
    try {
      await workflowHook.execute({ action: "submit", id });
      refetch();
    } catch (err) {
      console.error("Submit failed:", err);
    }
  }, [id, workflowHook, refetch]);

  const handleApprove = useCallback(async () => {
    if (!id) return;
    try {
      await workflowHook.execute({ action: getApproveAction(), id });
      refetch();
    } catch (err) {
      console.error("Approve failed:", err);
    }
  }, [id, workflowHook, refetch, getApproveAction]);

  const handleCopy = useCallback(async () => {
    if (!id) return;
    try {
      const result = await workflowHook.execute({ action: "copy", id });
      nav.toView(result.ID);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  }, [id, workflowHook, nav]);

  const openReasonModal = useCallback(
    (action: "return" | "reject" | "delete") => {
      setReasonModalAction(action);
      setReasonModalOpen(true);
    },
    [],
  );

  const handleReasonConfirm = useCallback(
    async (reason: string) => {
      if (!id || !reasonModalAction) return;
      setReasonModalLoading(true);
      try {
        if (reasonModalAction === "delete") {
          await deleteHook.deleteOrder(id, {
            DELETE_REASON: reason,
            CONFIRMED: true,
          });
        } else if (reasonModalAction === "return") {
          await workflowHook.execute({ action: "return", id, reason });
        } else if (reasonModalAction === "reject") {
          await workflowHook.execute({ action: "reject", id, reason });
        }
        setReasonModalOpen(false);
        if (reasonModalAction === "delete") {
          nav.toHome();
        } else {
          refetch();
        }
      } catch (err) {
        console.error(`${reasonModalAction} failed:`, err);
      } finally {
        setReasonModalLoading(false);
      }
    },
    [id, reasonModalAction, deleteHook, workflowHook, nav, refetch],
  );

  const handleEdit = useCallback(() => {
    if (id) nav.toEdit(id);
  }, [id, nav]);

  const handleBack = useCallback(() => {
    nav.toHome();
  }, [nav]);

  // Convert order to form data for read-only tabs
  const formData = useMemo((): Partial<CreateOrderRequest> => {
    if (!order) return {};
    return {
      CHANNEL: order.CHANNEL,
      ORDER_TYPE: order.ORDER_TYPE,
      LNH_TRANSACTION_TYPE: order.LNH_TRANSACTION_TYPE,
      SENDER: order.SENDER,
      RECEIVER: order.RECEIVER,
      PAYMENT_DATE: order.PAYMENT_DATE,
      AMOUNT: order.AMOUNT,
      CURRENCY_CODE: order.CURRENCY_CODE,
      EXCHANGE_RATE: order.EXCHANGE_RATE,
      ORIGIN_NUM: order.ORIGIN_NUM,
      TRANSACTION_DATE: order.TRANSACTION_DATE,
      EXP_TYPE: order.EXP_TYPE,
      DESCRIPTION: order.DESCRIPTION,
      FN_CODE1: order.FN_CODE1,
      FN_CODE2: order.FN_CODE2,
      FN_AMOUNT: order.FN_AMOUNT,
      LINES: order.LINES.map((l) => ({
        GL_SEGMENT1: l.GL_SEGMENT1,
        GL_SEGMENT2: l.GL_SEGMENT2,
        GL_SEGMENT3: l.GL_SEGMENT3,
        GL_SEGMENT4: l.GL_SEGMENT4,
        GL_SEGMENT5: l.GL_SEGMENT5,
        GL_SEGMENT6: l.GL_SEGMENT6,
        GL_SEGMENT7: l.GL_SEGMENT7,
        GL_SEGMENT8: l.GL_SEGMENT8,
        GL_SEGMENT9: l.GL_SEGMENT9,
        GL_SEGMENT10: l.GL_SEGMENT10,
        GL_SEGMENT11: l.GL_SEGMENT11,
        GL_SEGMENT12: l.GL_SEGMENT12,
        LINE_DESCRIPTION: l.LINE_DESCRIPTION,
        LINE_AMOUNT: l.LINE_AMOUNT,
      })),
      SENDER_NAME: order.SENDER_NAME,
      SENDER_ADDRESS: order.SENDER_ADDRESS,
      SENDER_GL_SEGMENT2: order.SENDER_GL_SEGMENT2,
      SENDER_NUM: order.SENDER_NUM,
      SENDER_BANK_CODE: order.SENDER_BANK_CODE,
      SENDER_IDENTIFY_ID: order.SENDER_IDENTIFY_ID,
      SENDER_ISSUED_DATE: order.SENDER_ISSUED_DATE,
      SENDER_ISSUED_PLACE: order.SENDER_ISSUED_PLACE,
      TPCP_CODE: order.TPCP_CODE,
      RECEIVER_NAME: order.RECEIVER_NAME,
      RECEIVER_ADDRESS: order.RECEIVER_ADDRESS,
      RECEIVER_GL_SEGMENT2: order.RECEIVER_GL_SEGMENT2,
      RECEIVER_BANK_CODE: order.RECEIVER_BANK_CODE,
      RECEIVER_ACCOUNT_NAME: order.RECEIVER_ACCOUNT_NAME,
      RECEIVER_IDENTIFY_ID: order.RECEIVER_IDENTIFY_ID,
      RECEIVER_ISSUED_DATE: order.RECEIVER_ISSUED_DATE,
      RECEIVER_ISSUED_PLACE: order.RECEIVER_ISSUED_PLACE,
    };
  }, [order]);

  // Stub handlers for read-only mode
  const handleFormChange = useCallback(() => {}, []);
  const handleLinesChange = useCallback((_: PayOrderLineRequest[]) => {}, []);

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
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const canManageAttachments =
    order.STATUS === "DRAFT" || order.STATUS === "RETURNED_TO_MAKER";

  return (
    <div className="min-h-screen bg-[#f4f6fa] px-5 pb-10 pt-4">
      {/* Breadcrumb */}
      <nav className="mb-3 bg-white px-5 py-2 text-[12px]">
        <span className="cursor-pointer text-[#0b5394]" onClick={handleBack}>
          Lệnh thanh toán đi
        </span>
        <span className="mx-1.5 text-[#bbb]">&rsaquo;</span>
        <span className="font-semibold text-[#1f2328]">{order.REF_NO}</span>
      </nav>

      {/* Header info */}
      <div className="mb-3.5 rounded-md border border-[#d7dbe0] bg-white p-3.5 shadow-[0_1px_2px_rgba(15,20,25,0.04)]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[16px] font-bold text-[#073763]">
              Lệnh thanh toán đi — {order.REF_NO}
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
                Phiên bản:{" "}
                <strong className="text-[#333]">v{order.VERSION}</strong>
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

      {/* Order detail tabs */}
      <div className="mb-3.5 rounded-md border border-[#d7dbe0] bg-white shadow-[0_1px_2px_rgba(15,20,25,0.04)]">
        <div className="flex items-center justify-between rounded-t-md bg-[#eef3f9] px-3.5 py-2.5">
          <h2 className="text-[13px] font-bold uppercase text-[#073763]">
            Chi tiết lệnh
          </h2>
          <span className="text-[11px] text-[#5f6368]">TT_LTT.VIEW</span>
        </div>
        <div className="p-3.5">
          <OrderFormTabs
            data={formData}
            onChange={handleFormChange}
            onLinesChange={handleLinesChange}
            readOnly
          />
        </div>
      </div>

      {/* Attachments */}
      <div className="mb-3.5">
        <AttachmentManager
          attachments={attachmentsHook.attachments}
          loading={attachmentsHook.loading}
          canUpload={canManageAttachments}
          canDelete={canManageAttachments}
          onUpload={attachmentsHook.upload}
          onDownload={attachmentsHook.download}
          onDelete={attachmentsHook.remove}
        />
      </div>

      {/* Audit log */}
      <div className="mb-3.5">
        <AuditLogTimeline
          entries={auditLogHook.data?.CONTENT || []}
          loading={auditLogHook.loading}
        />
      </div>

      {/* Action bar */}
      <div className="sticky bottom-0 rounded-md border border-[#d7dbe0] bg-white shadow-[0_1px_2px_rgba(15,20,25,0.04)]">
        <div className="flex items-center justify-between px-3.5 py-2.5">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-8 items-center gap-1 rounded border border-[#d7dbe0] bg-white px-4 text-[12.5px] font-semibold text-[#333] transition-colors hover:bg-[#f3f5f8]"
          >
            Quay lại
          </button>

          <div className="flex gap-2">
            {actions.canEdit && (
              <button
                type="button"
                onClick={handleEdit}
                className="flex h-8 items-center gap-1 rounded border border-[#c6d6e6] bg-white px-4 text-[12.5px] font-semibold text-[#0b5394] transition-colors hover:bg-[#e7f0f9]"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                  />
                </svg>
                Chỉnh sửa
              </button>
            )}

            {actions.canSubmit && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={workflowHook.loading}
                className="flex h-8 items-center gap-1 rounded bg-[#0b5394] px-4 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#073763] disabled:cursor-not-allowed disabled:opacity-55"
              >
                Gửi kiểm soát
              </button>
            )}

            {actions.canApprove && (
              <button
                type="button"
                onClick={handleApprove}
                disabled={workflowHook.loading}
                className="flex h-8 items-center gap-1 rounded bg-[#137333] px-4 text-[12.5px] font-semibold text-white transition-colors hover:brightness-[0.92] disabled:cursor-not-allowed disabled:opacity-55"
              >
                Phê duyệt
              </button>
            )}

            {actions.canReturn && (
              <button
                type="button"
                onClick={() => openReasonModal("return")}
                disabled={workflowHook.loading}
                className="flex h-8 items-center gap-1 rounded border border-orange-300 bg-white px-4 text-[12.5px] font-semibold text-orange-700 transition-colors hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-55"
              >
                Trả lại
              </button>
            )}

            {actions.canReject && (
              <button
                type="button"
                onClick={() => openReasonModal("reject")}
                disabled={workflowHook.loading}
                className="flex h-8 items-center gap-1 rounded border border-[#e7c2c2] bg-white px-4 text-[12.5px] font-semibold text-[#cc0000] transition-colors hover:bg-[#fdecec] disabled:cursor-not-allowed disabled:opacity-55"
              >
                Từ chối
              </button>
            )}

            {actions.canDelete && (
              <button
                type="button"
                onClick={() => openReasonModal("delete")}
                disabled={deleteHook.loading}
                className="flex h-8 items-center gap-1 rounded border border-[#e7c2c2] bg-white px-4 text-[12.5px] font-semibold text-[#cc0000] transition-colors hover:bg-[#fdecec] disabled:cursor-not-allowed disabled:opacity-55"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                  />
                </svg>
                Xóa
              </button>
            )}

            {actions.canCopy && (
              <button
                type="button"
                onClick={handleCopy}
                disabled={workflowHook.loading}
                className="flex h-8 items-center gap-1 rounded border border-[#d7dbe0] bg-white px-4 text-[12.5px] font-semibold text-[#333] transition-colors hover:bg-[#f3f5f8] disabled:cursor-not-allowed disabled:opacity-55"
              >
                Sao chép
              </button>
            )}

            {(order.STATUS === "READY_FOR_APPROVAL" ||
              order.STATUS === "PENDING_APPROVER") && (
              <button
                type="button"
                onClick={() => id && nav.toApprove(id)}
                className="flex h-8 items-center gap-1 rounded bg-[#137333] px-4 text-[12.5px] font-semibold text-white transition-colors hover:brightness-[0.92]"
              >
                Phê duyệt chi tiết
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reason modal */}
      <ReasonModal
        open={reasonModalOpen}
        title={
          reasonModalAction === "return"
            ? "Trả lại lệnh"
            : reasonModalAction === "reject"
              ? "Từ chối lệnh"
              : "Xóa lệnh"
        }
        label={reasonModalAction === "delete" ? "Lý do xóa" : "Lý do"}
        onConfirm={handleReasonConfirm}
        onCancel={() => setReasonModalOpen(false)}
        loading={reasonModalLoading}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Wrapped with ErrorBoundary
// ---------------------------------------------------------------------------

export function PayOutManualView() {
  return (
    <ErrorBoundary>
      <PayOutManualViewInner />
    </ErrorBoundary>
  );
}

export default PayOutManualView;
