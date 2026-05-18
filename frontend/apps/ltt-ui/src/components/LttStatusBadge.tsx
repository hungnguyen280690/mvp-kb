import type { LttStatus } from "../api/lttApi";

interface LttStatusBadgeProps {
  status: LttStatus;
}

const STATUS_CONFIG: Record<LttStatus, { label: string; className: string }> = {
  DRAFT: {
    label: "Ban nhap",
    className: "bg-gray-100 text-gray-700",
  },
  READY_FOR_APPROVAL: {
    label: "Cho kiem soat",
    className: "bg-yellow-100 text-yellow-800",
  },
  PENDING_APPROVER: {
    label: "Cho phe duyet",
    className: "bg-yellow-100 text-yellow-800",
  },
  APPROVED: {
    label: "Da phe duyet",
    className: "bg-green-100 text-green-800",
  },
  TRANSFERRED_TO_GL: {
    label: "Da chuyen GL",
    className: "bg-purple-100 text-purple-800",
  },
  POSTED: {
    label: "Da ghi so",
    className: "bg-green-100 text-green-800",
  },
  RETURNED_TO_MAKER: {
    label: "Tra lai Maker",
    className: "bg-orange-100 text-orange-800",
  },
  REJECTED: {
    label: "Tu choi",
    className: "bg-red-100 text-red-800",
  },
  DELETED: {
    label: "Da xoa",
    className: "bg-gray-200 text-gray-500",
  },
};

export default function LttStatusBadge({ status }: LttStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-gray-100 text-gray-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
