import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

import { FormField } from "./FormField";
import { DatePickerField } from "./DatePickerField";
import { LoadingSpinner } from "./LoadingSpinner";
import { payOutManualApi } from "../api/pay-out-manual";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface CopyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  onSuccess?: (newId: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function CopyDialog({
  open,
  onOpenChange,
  orderId,
  onSuccess,
}: CopyDialogProps) {
  const [paymentDate, setPaymentDate] = useState<string>(todayIso());
  const [dateError, setDateError] = useState<string>("");

  const copyMutation = useMutation({
    mutationFn: () => payOutManualApi.copy(orderId, paymentDate || undefined),
    onSuccess: (res) => {
      const newOrder = res.data;
      onOpenChange(false);
      onSuccess?.(newOrder.id);
    },
  });

  function handleCopy() {
    if (!paymentDate) {
      setDateError("Ngày thanh toán là bắt buộc");
      return;
    }
    setDateError("");
    copyMutation.mutate();
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      // Reset state when closing
      setPaymentDate(todayIso());
      setDateError("");
      copyMutation.reset();
    }
    onOpenChange(next);
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <Dialog.Title className="text-base font-semibold text-gray-900">
                Sao chép lệnh thanh toán
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-gray-500">
                Chọn ngày thanh toán cho lệnh mới được sao chép.
              </Dialog.Description>
            </div>
            <Dialog.Close className="ml-4 rounded-md p-1 text-gray-400 transition-colors hover:text-gray-600 focus:outline-none focus:ring-1 focus:ring-ring">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="mt-5">
            <FormField label="Ngày thanh toán mới" required error={dateError}>
              <DatePickerField
                value={paymentDate}
                onChange={(v) => {
                  setPaymentDate(v ?? "");
                  if (v) setDateError("");
                }}
                min={todayIso()}
              />
            </FormField>
          </div>

          {/* Error */}
          {copyMutation.isError && (
            <p className="mt-3 text-sm text-red-600">
              {copyMutation.error?.message ??
                "Sao chép thất bại. Vui lòng thử lại."}
            </p>
          )}

          {/* Footer */}
          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close asChild>
              <button
                type="button"
                disabled={copyMutation.isPending}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={handleCopy}
              disabled={copyMutation.isPending}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {copyMutation.isPending && <LoadingSpinner size="sm" />}
              Sao chép
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
