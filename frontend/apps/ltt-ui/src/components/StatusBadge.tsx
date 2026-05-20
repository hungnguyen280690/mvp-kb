import type { OrderStatus } from "../types/pay-out-manual";

// ---------------------------------------------------------------------------
// Status label map
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: "Nháp",
  READY_FOR_APPROVAL: "Chờ kiểm soát",
  PENDING_APPROVER: "Chờ phê duyệt",
  APPROVED: "Đã phê duyệt",
  RETURNED_TO_MAKER: "Được trả lại",
  REJECTED: "Từ chối",
  DELETED: "Đã xóa",
};

// ---------------------------------------------------------------------------
// Badge color map — Tailwind classes per VDBAS status spec
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<OrderStatus, { bg: string; text: string }> = {
  DRAFT: { bg: "bg-gray-100", text: "text-gray-600" },
  READY_FOR_APPROVAL: { bg: "bg-blue-50", text: "text-blue-700" },
  PENDING_APPROVER: { bg: "bg-yellow-50", text: "text-yellow-700" },
  APPROVED: { bg: "bg-green-50", text: "text-green-700" },
  RETURNED_TO_MAKER: { bg: "bg-orange-50", text: "text-orange-700" },
  REJECTED: { bg: "bg-red-50", text: "text-red-700" },
  DELETED: { bg: "bg-gray-800", text: "text-gray-100" },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const label = STATUS_LABELS[status] || status;
  const { bg, text } = STATUS_STYLES[status] || STATUS_STYLES.DRAFT;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold leading-tight ${bg} ${text} ${className}`}
      aria-label={`Trạng thái: ${label}`}
    >
      {label}
    </span>
  );
}

export default StatusBadge;
