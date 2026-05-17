import type { LttStatus } from '../api/lttApi';

interface LttStatusBadgeProps {
  status: LttStatus;
}

const STATUS_CONFIG: Record<
  LttStatus,
  { label: string; className: string }
> = {
  DRAFT: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-700',
  },
  PENDING_SUBMIT: {
    label: 'Pending Submit',
    className: 'bg-gray-100 text-gray-700',
  },
  PENDING_CHECK: {
    label: 'Pending Check',
    className: 'bg-yellow-100 text-yellow-800',
  },
  PENDING_APPROVE: {
    label: 'Pending Approve',
    className: 'bg-yellow-100 text-yellow-800',
  },
  APPROVED: {
    label: 'Approved',
    className: 'bg-green-100 text-green-800',
  },
  REJECTED: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-800',
  },
  RETURNED: {
    label: 'Returned',
    className: 'bg-orange-100 text-orange-800',
  },
};

export default function LttStatusBadge({ status }: LttStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: 'bg-gray-100 text-gray-700',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
