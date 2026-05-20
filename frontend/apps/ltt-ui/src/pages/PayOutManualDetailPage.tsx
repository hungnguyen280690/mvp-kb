import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import {
  usePayOrderDetail,
  useSubmitPayOrder,
  useWorkflowAction,
} from "../api/hooks";
import { useAuth } from "../contexts/AuthContext";
import { StatusBadge } from "../components/StatusBadge";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { AttachmentPanel } from "../components/AttachmentPanel";
import { ApprovalStepperPanel } from "../components/ApprovalStepperPanel";
import { AuditLogPanel } from "../components/AuditLogPanel";
import { CopyDialog } from "../components/CopyDialog";
import { DeleteDialog } from "../components/DeleteDialog";
import { formatCurrency, formatDate } from "../lib/utils";
import type { PayOrderStatus } from "../types/pay-order";

// ────────────────────────────────────────────────────────────
//  Action dialog state type
// ────────────────────────────────────────────────────────────
type ActionDialogKind =
  | "submit"
  | "checkApprove"
  | "approve"
  | "return"
  | "reject"
  | "copy"
  | "delete"
  | null;

// ────────────────────────────────────────────────────────────
//  VDBAS button style helpers
// ────────────────────────────────────────────────────────────
const BTN_BASE: React.CSSProperties = {
  height: "32px",
  padding: "0 14px",
  fontSize: "12.5px",
  fontWeight: 600,
  borderRadius: "4px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  transition: "all .15s",
  border: "none",
};

const btnStyles = {
  primary: {
    ...BTN_BASE,
    background: "#0b5394",
    color: "#fff",
    border: "1px solid #0b5394",
  } as React.CSSProperties,
  success: {
    ...BTN_BASE,
    background: "#137333",
    color: "#fff",
    border: "1px solid #137333",
  } as React.CSSProperties,
  ghost: {
    ...BTN_BASE,
    background: "#fff",
    color: "#0b5394",
    border: "1px solid #c6d6e6",
  } as React.CSSProperties,
  default: {
    ...BTN_BASE,
    background: "#fff",
    color: "#333",
    border: "1px solid #d7dbe0",
  } as React.CSSProperties,
  warning: {
    ...BTN_BASE,
    background: "#fff",
    color: "#b45309",
    border: "1px solid #b45309",
  } as React.CSSProperties,
  danger: {
    ...BTN_BASE,
    background: "#fff",
    color: "#cc0000",
    border: "1px solid #e7c2c2",
  } as React.CSSProperties,
};

function disabledStyle(base: React.CSSProperties): React.CSSProperties {
  return { ...base, opacity: 0.55, cursor: "not-allowed" };
}

// ────────────────────────────────────────────────────────────
//  Reason Dialog (for return / reject)
// ────────────────────────────────────────────────────────────
interface ReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  confirmLabel: string;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
  variant?: "default" | "destructive";
}

function ReasonDialog({
  open,
  onOpenChange,
  title,
  confirmLabel,
  onConfirm,
  isLoading,
  variant = "default",
}: ReasonDialogProps) {
  const [reason, setReason] = useState("");

  const confirmBtnStyle: React.CSSProperties =
    variant === "destructive"
      ? {
          ...btnStyles.danger,
          border: "1px solid #cc0000",
          background: "#cc0000",
          color: "#fff",
        }
      : btnStyles.primary;

  function handleConfirm() {
    onConfirm(reason);
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) setReason("");
        onOpenChange(o);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            background: "rgba(15,20,25,.5)",
          }}
        />
        <Dialog.Content
          style={{
            position: "fixed",
            left: "50%",
            top: "50%",
            zIndex: 50,
            width: "100%",
            maxWidth: "480px",
            transform: "translate(-50%,-50%)",
            borderRadius: "8px",
            background: "#fff",
            padding: "0",
            boxShadow: "0 10px 40px rgba(0,0,0,.25)",
            outline: "none",
          }}
        >
          {/* Modal head */}
          <div
            style={{
              background: "linear-gradient(90deg,#073763,#0b5394)",
              padding: "12px 18px",
              borderRadius: "8px 8px 0 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Dialog.Title
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#fff",
                margin: 0,
              }}
            >
              {title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Đóng"
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255,255,255,.85)",
                  fontSize: "18px",
                  cursor: "pointer",
                  lineHeight: 1,
                  padding: "0 2px",
                }}
              >
                ×
              </button>
            </Dialog.Close>
          </div>

          {/* Modal body */}
          <div style={{ padding: "16px 18px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 500,
                color: "#333",
                marginBottom: "4px",
              }}
            >
              Lý do <span style={{ color: "#cc0000" }}>*</span>
            </label>
            <textarea
              style={{
                width: "100%",
                padding: "6px 8px",
                fontSize: "13px",
                border: "1px solid #d7dbe0",
                borderRadius: "4px",
                outline: "none",
                resize: "none",
                minHeight: "96px",
                boxSizing: "border-box",
              }}
              placeholder="Nhập lý do…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Modal toolbar */}
          <div
            style={{
              background: "#fafcfe",
              borderTop: "1px solid #d7dbe0",
              padding: "10px 18px",
              display: "flex",
              justifyContent: "flex-end",
              gap: "8px",
              borderRadius: "0 0 8px 8px",
            }}
          >
            <Dialog.Close asChild>
              <button
                type="button"
                style={
                  isLoading
                    ? disabledStyle(btnStyles.default)
                    : btnStyles.default
                }
                disabled={isLoading}
              >
                Hủy
              </button>
            </Dialog.Close>
            <button
              type="button"
              style={
                isLoading || reason.trim() === ""
                  ? disabledStyle(confirmBtnStyle)
                  : confirmBtnStyle
              }
              onClick={handleConfirm}
              disabled={isLoading || reason.trim() === ""}
            >
              {isLoading && <LoadingSpinner size="sm" />}
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ────────────────────────────────────────────────────────────
//  Info row helper
// ────────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: "11px",
          color: "#5f6368",
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: ".3px",
          marginBottom: "4px",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: "13px", fontWeight: 600, color: "#1f2328" }}>
        {value ?? "—"}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
//  Card wrapper helper
// ────────────────────────────────────────────────────────────
function SectionCard({
  title,
  screenCode,
  children,
}: {
  title: string;
  screenCode?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #d7dbe0",
        borderRadius: "6px",
        boxShadow: "0 1px 2px rgba(15,20,25,.04)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderBottom: "1px solid #d7dbe0",
          background: "#eef3f9",
        }}
      >
        <h2
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "#073763",
            textTransform: "uppercase",
            letterSpacing: ".3px",
            margin: 0,
          }}
        >
          {title}
        </h2>
        {screenCode && (
          <span style={{ fontSize: "11px", color: "#5f6368", fontWeight: 500 }}>
            {screenCode}
          </span>
        )}
      </div>
      <div style={{ padding: "14px" }}>{children}</div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
//  Main Page
// ────────────────────────────────────────────────────────────
export default function PayOutManualDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isMaker, isChecker, isApprover } = useAuth();

  const { data: order, isLoading, error } = usePayOrderDetail(id);

  const submitMutation = useSubmitPayOrder();
  const checkApproveMutation = useWorkflowAction("checkApprove");
  const approveMutation = useWorkflowAction("approve");
  const returnMutation = useWorkflowAction("return");
  const rejectMutation = useWorkflowAction("reject");

  const [activeDialog, setActiveDialog] = useState<ActionDialogKind>(null);

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          height: "256px",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <ErrorBoundary>
        <div style={{ padding: "32px", textAlign: "center", color: "#cc0000" }}>
          Không thể tải dữ liệu lệnh thanh toán.
        </div>
      </ErrorBoundary>
    );
  }

  const status: PayOrderStatus = order.status;
  const canEditOrSubmit =
    isMaker && (status === "DRAFT" || status === "RETURNED_TO_MAKER");
  const canCheckApprove = isChecker && status === "READY_FOR_APPROVAL";
  const canApprove = isApprover && status === "PENDING_APPROVER";
  const canReturn =
    (isChecker && status === "READY_FOR_APPROVAL") ||
    (isApprover && status === "PENDING_APPROVER");
  const canReject = isApprover && status === "PENDING_APPROVER";
  const canDelete = isMaker && status === "DRAFT";

  // Mutation loading state
  const anyActionLoading =
    submitMutation.isPending ||
    checkApproveMutation.isPending ||
    approveMutation.isPending ||
    returnMutation.isPending ||
    rejectMutation.isPending;

  function handleSubmit() {
    submitMutation.mutate(
      { id: order!.id, version: order!.version },
      { onSuccess: () => setActiveDialog(null) },
    );
  }

  function handleCheckApprove() {
    checkApproveMutation.mutate(
      { id: order!.id, version: order!.version },
      { onSuccess: () => setActiveDialog(null) },
    );
  }

  function handleApprove() {
    approveMutation.mutate(
      { id: order!.id, version: order!.version },
      { onSuccess: () => setActiveDialog(null) },
    );
  }

  function handleReturn(reason: string) {
    returnMutation.mutate(
      { id: order!.id, version: order!.version, reasonOrComment: reason },
      { onSuccess: () => setActiveDialog(null) },
    );
  }

  function handleReject(reason: string) {
    rejectMutation.mutate(
      { id: order!.id, version: order!.version, reasonOrComment: reason },
      { onSuccess: () => setActiveDialog(null) },
    );
  }

  return (
    <div
      style={{
        padding: "16px 20px 40px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      {/* ── Header Card ── */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #d7dbe0",
          borderRadius: "6px",
          boxShadow: "0 1px 2px rgba(15,20,25,.04)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 14px",
            borderBottom: "1px solid #d7dbe0",
            background: "#eef3f9",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "13px",
              color: "#0b5394",
              padding: 0,
              fontWeight: 500,
            }}
          >
            ← Quay lại
          </button>
          <span style={{ color: "#d7dbe0", userSelect: "none" }}>|</span>
          <span
            style={{
              fontWeight: 700,
              fontSize: "14px",
              color: "#073763",
              fontFamily: "Consolas,Menlo,monospace",
            }}
          >
            {order.refNo}
          </span>
          <StatusBadge status={status} />
          <div style={{ flex: 1 }} />

          {/* Action buttons */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {canEditOrSubmit && (
              <button
                type="button"
                style={btnStyles.ghost}
                onClick={() => navigate(`/pay-out-manual/${id}/edit`)}
              >
                Sửa
              </button>
            )}
            {canEditOrSubmit && (
              <button
                type="button"
                style={
                  anyActionLoading
                    ? disabledStyle(btnStyles.primary)
                    : btnStyles.primary
                }
                disabled={anyActionLoading}
                onClick={() => setActiveDialog("submit")}
              >
                {submitMutation.isPending && <LoadingSpinner size="sm" />}
                Nộp duyệt
              </button>
            )}
            {canCheckApprove && (
              <button
                type="button"
                style={
                  anyActionLoading
                    ? disabledStyle(btnStyles.primary)
                    : btnStyles.primary
                }
                disabled={anyActionLoading}
                onClick={() => setActiveDialog("checkApprove")}
              >
                {checkApproveMutation.isPending && <LoadingSpinner size="sm" />}
                Kiểm duyệt
              </button>
            )}
            {canApprove && (
              <button
                type="button"
                style={
                  anyActionLoading
                    ? disabledStyle(btnStyles.success)
                    : btnStyles.success
                }
                disabled={anyActionLoading}
                onClick={() => setActiveDialog("approve")}
              >
                {approveMutation.isPending && <LoadingSpinner size="sm" />}
                Phê duyệt
              </button>
            )}
            {canReturn && (
              <button
                type="button"
                style={
                  anyActionLoading
                    ? disabledStyle(btnStyles.warning)
                    : btnStyles.warning
                }
                disabled={anyActionLoading}
                onClick={() => setActiveDialog("return")}
              >
                {returnMutation.isPending && <LoadingSpinner size="sm" />}
                Trả lại
              </button>
            )}
            {canReject && (
              <button
                type="button"
                style={
                  anyActionLoading
                    ? disabledStyle(btnStyles.danger)
                    : btnStyles.danger
                }
                disabled={anyActionLoading}
                onClick={() => setActiveDialog("reject")}
              >
                {rejectMutation.isPending && <LoadingSpinner size="sm" />}
                Từ chối
              </button>
            )}
            {isMaker && (
              <button
                type="button"
                style={btnStyles.ghost}
                onClick={() => setActiveDialog("copy")}
              >
                Sao chép
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                style={btnStyles.danger}
                onClick={() => setActiveDialog("delete")}
              >
                Xóa
              </button>
            )}
          </div>

          <span
            style={{
              fontSize: "11px",
              color: "#5f6368",
              fontWeight: 500,
              marginLeft: "4px",
            }}
          >
            TT_LTT.4
          </span>
        </div>
      </div>

      {/* ── Section 1: General Info ── */}
      <SectionCard title="THÔNG TIN CHUNG">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: "12px 18px",
          }}
        >
          <InfoRow label="KÊNH THANH TOÁN" value={order.channel} />
          <InfoRow
            label="NGÀY THANH TOÁN"
            value={formatDate(order.paymentDate)}
          />
          <InfoRow
            label="SỐ TIỀN"
            value={
              <span style={{ color: "#0b5394" }}>
                {formatCurrency(order.amount)}
              </span>
            }
          />
          <InfoRow label="LOẠI TIỀN" value={order.currencyCode} />
          <InfoRow label="ĐƠN VỊ CHI" value={order.sender} />
          <InfoRow label="ĐƠN VỊ THỤ HƯỞNG" value={order.receiver} />
          <InfoRow label="MÃ KBNN" value={order.kbnnId} />
          <div style={{ gridColumn: "span 3" }}>
            <InfoRow label="NỘI DUNG" value={order.description} />
          </div>
        </div>
      </SectionCard>

      {/* ── Section 2: Line Items ── */}
      <SectionCard title="KHOẢN MỤC">
        {order.lines.length === 0 ? (
          <p
            style={{
              fontSize: "13px",
              color: "#5f6368",
              fontStyle: "italic",
              padding: "18px 0",
              textAlign: "center",
            }}
          >
            Không có khoản mục.
          </p>
        ) : (
          <div
            style={{
              overflowX: "auto",
              borderRadius: "4px",
              border: "1px solid #d7dbe0",
            }}
          >
            <table
              style={{
                width: "100%",
                minWidth: "600px",
                fontSize: "12.5px",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr style={{ background: "#eef3f9" }}>
                  {["STT", "Số tiền", "Diễn giải", "CCID hợp lệ"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "8px 10px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#073763",
                        textTransform: "uppercase",
                        letterSpacing: ".3px",
                        borderBottom: "2px solid #c9d6e3",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {order.lines.map((line, idx) => (
                  <tr
                    key={line.id}
                    style={{
                      background: idx % 2 === 1 ? "#fafcfe" : "#fff",
                      borderBottom: "1px solid #d7dbe0",
                    }}
                  >
                    <td style={{ padding: "8px 10px", color: "#1f2328" }}>
                      {line.lineNum}
                    </td>
                    <td
                      style={{
                        padding: "8px 10px",
                        fontWeight: 600,
                        color: "#0b5394",
                      }}
                    >
                      {formatCurrency(line.lineAmount)}
                    </td>
                    <td style={{ padding: "8px 10px", color: "#5f6368" }}>
                      {line.lineDescription ?? "—"}
                    </td>
                    <td style={{ padding: "8px 10px" }}>
                      {line.ccidValid ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            borderRadius: "12px",
                            padding: "2px 10px",
                            fontSize: "11.5px",
                            fontWeight: 600,
                            letterSpacing: ".2px",
                            background: "#e6f4ea",
                            color: "#137333",
                            border: "1px solid #b7dfbf",
                          }}
                        >
                          Hợp lệ
                        </span>
                      ) : (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            borderRadius: "12px",
                            padding: "2px 10px",
                            fontSize: "11.5px",
                            fontWeight: 600,
                            letterSpacing: ".2px",
                            background: "#fde7e7",
                            color: "#cc0000",
                            border: "1px solid #e7c2c2",
                          }}
                        >
                          Không hợp lệ
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ── Section 3: Panels (Phê duyệt / Tài liệu / Lịch sử) ── */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #d7dbe0",
          borderRadius: "6px",
          boxShadow: "0 1px 2px rgba(15,20,25,.04)",
          overflow: "hidden",
        }}
      >
        <Tabs.Root defaultValue="approval">
          <Tabs.List
            style={{
              display: "flex",
              borderBottom: "1px solid #d7dbe0",
              padding: "0 14px",
              background: "#eef3f9",
            }}
          >
            {(
              [
                { value: "approval", label: "Phê duyệt" },
                {
                  value: "attachment",
                  label: `Tài liệu (${order.attachmentCount})`,
                },
                { value: "audit", label: "Lịch sử" },
              ] as const
            ).map((tab) => (
              <Tabs.Trigger
                key={tab.value}
                value={tab.value}
                style={{
                  background: "none",
                  border: "none",
                  borderBottom: "2px solid transparent",
                  padding: "10px 14px",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#5f6368",
                  cursor: "pointer",
                  transition: "all .15s",
                  marginBottom: "-1px",
                }}
                className="vdbas-tab-trigger"
              >
                {tab.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <div style={{ padding: "14px" }}>
            <Tabs.Content value="approval">
              <ApprovalStepperPanel orderId={id} />
            </Tabs.Content>

            <Tabs.Content value="attachment">
              <AttachmentPanel orderId={id} canUpload={canEditOrSubmit} />
            </Tabs.Content>

            <Tabs.Content value="audit">
              <AuditLogPanel orderId={id} />
            </Tabs.Content>
          </div>
        </Tabs.Root>
      </div>

      {/* Inline style for active tab trigger */}
      <style>{`
        .vdbas-tab-trigger[data-state=active] {
          border-bottom: 2px solid #0b5394 !important;
          color: #0b5394 !important;
          font-weight: 600 !important;
        }
        .vdbas-tab-trigger:hover {
          color: #0b5394 !important;
        }
      `}</style>

      {/* ── Action Dialogs ── */}
      <ConfirmDialog
        open={activeDialog === "submit"}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        title="Nộp duyệt lệnh thanh toán"
        description={`Xác nhận nộp lệnh ${order.refNo} vào quy trình phê duyệt?`}
        confirmLabel="Nộp duyệt"
        isLoading={submitMutation.isPending}
        onConfirm={handleSubmit}
      />

      <ConfirmDialog
        open={activeDialog === "checkApprove"}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        title="Kiểm tra lệnh thanh toán"
        description={`Xác nhận kiểm tra và chuyển lệnh ${order.refNo} lên Phê duyệt?`}
        confirmLabel="Kiểm tra"
        isLoading={checkApproveMutation.isPending}
        onConfirm={handleCheckApprove}
      />

      <ConfirmDialog
        open={activeDialog === "approve"}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        title="Phê duyệt lệnh thanh toán"
        description={`Xác nhận phê duyệt lệnh ${order.refNo}?`}
        confirmLabel="Phê duyệt"
        isLoading={approveMutation.isPending}
        onConfirm={handleApprove}
      />

      <ReasonDialog
        open={activeDialog === "return"}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        title="Trả lại lệnh thanh toán"
        confirmLabel="Trả lại"
        isLoading={returnMutation.isPending}
        onConfirm={handleReturn}
        variant="default"
      />

      <ReasonDialog
        open={activeDialog === "reject"}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        title="Từ chối lệnh thanh toán"
        confirmLabel="Từ chối"
        isLoading={rejectMutation.isPending}
        onConfirm={handleReject}
        variant="destructive"
      />

      {activeDialog === "copy" && (
        <CopyDialog
          orderId={id}
          open
          onOpenChange={(open) => !open && setActiveDialog(null)}
        />
      )}

      {activeDialog === "delete" && (
        <DeleteDialog
          orderId={id}
          version={order.version}
          open
          onOpenChange={(open) => !open && setActiveDialog(null)}
          onDeleted={() => navigate("/pay-out-manual")}
        />
      )}
    </div>
  );
}
