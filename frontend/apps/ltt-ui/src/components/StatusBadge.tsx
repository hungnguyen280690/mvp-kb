import type { PayOrderStatus } from "../types/pay-order";

const STATUS_MAP: Record<
  PayOrderStatus,
  { label: string; color: string; bg: string }
> = {
  DRAFT: { label: "Nháp", color: "#8a8f98", bg: "#eef0f2" },
  READY_FOR_APPROVAL: { label: "Chờ KT", color: "#b45309", bg: "#fff3e0" },
  PENDING_APPROVER: { label: "Chờ KD", color: "#0369a1", bg: "#e0f2fe" },
  APPROVED: { label: "Đã duyệt", color: "#137333", bg: "#e6f4ea" },
  RETURNED_TO_MAKER: { label: "Trả lại", color: "#b45309", bg: "#fff8e1" },
  REJECTED: { label: "Từ chối", color: "#c0392b", bg: "#fde7e7" },
  DELETED: { label: "Đã xóa", color: "#9ca3af", bg: "#f3f4f6" },
};

interface StatusBadgeProps {
  status: PayOrderStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const map = STATUS_MAP[status] ?? STATUS_MAP.DRAFT;

  return (
    <span
      className={className}
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: "12px",
        fontSize: "11.5px",
        fontWeight: 600,
        letterSpacing: ".2px",
        color: map.color,
        backgroundColor: map.bg,
      }}
    >
      {map.label}
    </span>
  );
}
