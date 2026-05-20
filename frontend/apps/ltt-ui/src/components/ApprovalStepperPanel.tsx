import { useApprovalStatus } from "../api/hooks";
import { LoadingSpinner } from "./LoadingSpinner";
import { formatDateTime } from "../lib/utils";
import type { ApprovalStep } from "../types/pay-order";

interface ApprovalStepperPanelProps {
  orderId: string;
}

const STEP_LABELS: Record<ApprovalStep["step"], string> = {
  MAKER: "Người lập",
  CHECKER: "Kiểm tra",
  APPROVER: "Phê duyệt",
};

const ACTION_LABELS: Record<string, string> = {
  CREATED: "Đã tạo",
  SUBMITTED: "Đã nộp duyệt",
  CHECK_APPROVED: "Đã kiểm tra",
  APPROVED: "Đã phê duyệt",
  RETURNED: "Đã trả lại",
  REJECTED: "Đã từ chối",
};

function StepIcon({
  isCompleted,
  isActive,
}: {
  isCompleted: boolean;
  isActive: boolean;
}) {
  if (isCompleted) {
    return (
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-500 text-white shadow">
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
    );
  }
  if (isActive) {
    return (
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-blue-500 bg-blue-50 text-blue-600 shadow">
        <LoadingSpinner size="sm" className="text-blue-500" />
      </div>
    );
  }
  return (
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-300 bg-gray-50 text-gray-400" />
  );
}

interface StepRowProps {
  step: ApprovalStep;
  isLast: boolean;
  isActive: boolean;
}

function StepRow({ step, isLast, isActive }: StepRowProps) {
  const labelText = step.action
    ? (ACTION_LABELS[step.action] ?? step.action)
    : undefined;

  return (
    <div className="flex gap-4">
      {/* Icon + connecting line */}
      <div className="flex flex-col items-center">
        <StepIcon isCompleted={step.isCompleted} isActive={isActive} />
        {!isLast && (
          <div
            className={`mt-1 w-0.5 flex-1 ${step.isCompleted ? "bg-green-300" : "bg-gray-200"}`}
            style={{ minHeight: "32px" }}
          />
        )}
      </div>

      {/* Content */}
      <div className="pb-6">
        <p
          className={`text-sm font-semibold ${
            step.isCompleted
              ? "text-green-700"
              : isActive
                ? "text-blue-700"
                : "text-gray-400"
          }`}
        >
          {STEP_LABELS[step.step]}
        </p>

        {(step.userId || step.userName) && (
          <p className="mt-0.5 text-xs text-gray-600">
            {step.userName ?? step.userId}
          </p>
        )}

        {labelText && (
          <p className="mt-0.5 text-xs text-gray-500">{labelText}</p>
        )}

        {step.actionAt && (
          <p className="mt-0.5 text-xs text-gray-400">
            {formatDateTime(step.actionAt)}
          </p>
        )}

        {step.comment && (
          <p className="mt-1 max-w-xs rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-800 border border-amber-200">
            {step.comment}
          </p>
        )}
      </div>
    </div>
  );
}

export function ApprovalStepperPanel({ orderId }: ApprovalStepperPanelProps) {
  const { data, isLoading, error } = useApprovalStatus(orderId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="py-4 text-sm text-red-500">
        Không thể tải trạng thái phê duyệt.
      </p>
    );
  }

  const steps = data.steps;

  return (
    <div className="space-y-0 py-2">
      {steps.map((step, idx) => {
        const isActive = !step.isCompleted && data.currentStep === step.step;
        const isLast = idx === steps.length - 1;
        return (
          <StepRow
            key={step.step}
            step={step}
            isLast={isLast}
            isActive={isActive}
          />
        );
      })}
    </div>
  );
}
