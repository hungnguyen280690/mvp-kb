import type { ApprovalStatusEntry, OrderStatus } from "../types/pay-out-manual";

// ---------------------------------------------------------------------------
// Step definition for the 3-step workflow
// ---------------------------------------------------------------------------

interface WorkflowStep {
  label: string;
  role: string;
}

const STEPS: WorkflowStep[] = [
  { label: "Tạo lệnh", role: "Maker" },
  { label: "Kiểm soát", role: "Checker" },
  { label: "Phê duyệt", role: "Approver" },
];

// ---------------------------------------------------------------------------
// Determine which step is active based on current status
// ---------------------------------------------------------------------------

function getActiveStepIndex(status: OrderStatus): number {
  switch (status) {
    case "DRAFT":
    case "RETURNED_TO_MAKER":
      return 0;
    case "READY_FOR_APPROVAL":
      return 1;
    case "PENDING_APPROVER":
      return 2;
    case "APPROVED":
      return 3; // all complete
    case "REJECTED":
      return -1; // special
    case "DELETED":
      return -2; // special
    default:
      return 0;
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface WorkflowStepperProps {
  currentStatus: OrderStatus;
  steps?: ApprovalStatusEntry[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WorkflowStepper({
  currentStatus,
  steps = [],
}: WorkflowStepperProps) {
  const activeIdx = getActiveStepIndex(currentStatus);
  const isRejected = currentStatus === "REJECTED";
  const isDeleted = currentStatus === "DELETED";
  const isReturned = currentStatus === "RETURNED_TO_MAKER";

  return (
    <div className="rounded-lg border border-[#d7dbe0] bg-white p-4">
      <h3 className="mb-3 text-[13px] font-bold uppercase text-[#073763]">
        Quy trình phê duyệt
      </h3>

      {/* Stepper */}
      <div className="flex items-center">
        {STEPS.map((step, idx) => {
          const isCompleted = activeIdx > idx || activeIdx === 3;
          const isCurrent = activeIdx === idx;
          const isLast = idx === STEPS.length - 1;

          return (
            <div key={step.role} className="flex items-center">
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-[11px] font-bold transition-colors ${
                    isRejected && isCurrent
                      ? "border-[#cc0000] bg-[#cc0000] text-white"
                      : isDeleted && isCurrent
                        ? "border-gray-600 bg-gray-600 text-white"
                        : isCompleted
                          ? "border-[#137333] bg-[#137333] text-white"
                          : isCurrent
                            ? "border-[#0b5394] bg-[#0b5394] text-white"
                            : "border-[#d7dbe0] bg-white text-[#5f6368]"
                  }`}
                >
                  {isCompleted ? (
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
                  ) : isRejected && isCurrent ? (
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </div>
                <span className="mt-1 text-[11px] font-semibold text-[#333]">
                  {step.label}
                </span>
                <span className="text-[10px] text-[#5f6368]">{step.role}</span>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={`mx-2 h-[2px] w-12 flex-1 transition-colors sm:w-20 ${
                    isCompleted ? "bg-[#137333]" : "bg-[#d7dbe0]"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Status message for rejected/returned/deleted */}
      {isRejected && (
        <div className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
          Lệnh đã từ chối.
        </div>
      )}
      {isReturned && (
        <div className="mt-3 rounded border border-orange-200 bg-orange-50 px-3 py-2 text-[12px] text-orange-700">
          Lệnh đã được trả lại để chỉnh sửa.
        </div>
      )}
      {isDeleted && (
        <div className="mt-3 rounded border border-gray-300 bg-gray-100 px-3 py-2 text-[12px] text-gray-600">
          Lệnh đã xóa.
        </div>
      )}

      {/* Approval timeline */}
      {steps.length > 0 && (
        <div className="mt-4 border-t border-[#d7dbe0] pt-3">
          <h4 className="mb-2 text-[12px] font-semibold text-[#073763]">
            Lịch sử thao tác
          </h4>
          <div className="space-y-1">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2 text-[11.5px]">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#eef3f9] text-[10px] font-semibold text-[#073763]">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-[#333]">
                    {step.PERFORMED_BY}
                  </span>{" "}
                  <span className="text-[#5f6368]">
                    — {formatAction(step.ACTION)}
                  </span>
                  <br />
                  <span className="text-[#5f6368]">
                    {formatDateTime(step.PERFORMED_AT)}
                  </span>
                  {step.REASON && (
                    <div className="mt-0.5 text-[#cc0000]">
                      Lý do: {step.REASON}
                    </div>
                  )}
                  {step.PERFORMED_ROLE && (
                    <span className="ml-1 rounded bg-[#eef3f9] px-1 py-0.5 text-[10px] font-medium text-[#073763]">
                      {step.PERFORMED_ROLE}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatAction(action: string): string {
  const map: Record<string, string> = {
    CREATE: "Tạo mới",
    UPDATE: "Cập nhật",
    SUBMIT: "Gửi kiểm soát",
    CHECK_APPROVE: "Kiểm soát phê duyệt",
    APPROVE: "Phê duyệt",
    RETURN_BY_CHECKER: "Trả lại (Checker)",
    REJECT_BY_CHECKER: "Từ chối (Checker)",
    RETURN_BY_APPROVER: "Trả lại (Approver)",
    REJECT_BY_APPROVER: "Từ chối (Approver)",
    DELETE: "Xóa",
  };
  return map[action] || action;
}

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

export default WorkflowStepper;
