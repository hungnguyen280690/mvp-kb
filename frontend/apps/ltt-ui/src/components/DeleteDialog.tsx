import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Checkbox from "@radix-ui/react-checkbox";
import { X, Check } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { FormField } from "./FormField";
import { LoadingSpinner } from "./LoadingSpinner";
import { payOutManualApi } from "../api/pay-out-manual";
import { queryKeys } from "../api/hooks";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  version: number;
  /** Called after successful deletion */
  onSuccess?: () => void;
  /** Alias for onSuccess — kept for backward compat with DetailPage */
  onDeleted?: () => void;
}

const MIN_REASON_LENGTH = 10;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function DeleteDialog({
  open,
  onOpenChange,
  orderId,
  version,
  onSuccess,
  onDeleted,
}: DeleteDialogProps) {
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [reasonError, setReasonError] = useState<string>("");

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => payOutManualApi.delete(orderId, reason, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pay-out-manual", "list"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.detail(orderId) });
      onOpenChange(false);
      onSuccess?.();
      onDeleted?.();
    },
  });

  function validate(): boolean {
    if (reason.trim().length < MIN_REASON_LENGTH) {
      setReasonError(
        `Lý do phải có ít nhất ${MIN_REASON_LENGTH} ký tự (hiện tại: ${reason.trim().length})`,
      );
      return false;
    }
    setReasonError("");
    return true;
  }

  function handleDelete() {
    if (!validate()) return;
    deleteMutation.mutate();
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setReason("");
      setConfirmed(false);
      setReasonError("");
      deleteMutation.reset();
    }
    onOpenChange(next);
  }

  const canSubmit =
    confirmed &&
    reason.trim().length >= MIN_REASON_LENGTH &&
    !deleteMutation.isPending;

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <Dialog.Title className="text-base font-semibold text-gray-900">
                Xóa lệnh thanh toán
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-gray-500">
                Hành động này không thể hoàn tác. Vui lòng nhập lý do xóa.
              </Dialog.Description>
            </div>
            <Dialog.Close className="ml-4 rounded-md p-1 text-gray-400 transition-colors hover:text-gray-600 focus:outline-none focus:ring-1 focus:ring-ring">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="mt-5 space-y-4">
            {/* Reason textarea */}
            <FormField
              label="Lý do xóa"
              required
              error={reasonError}
              hint={
                reason.trim().length > 0
                  ? `${reason.trim().length} ký tự`
                  : undefined
              }
            >
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (
                    reasonError &&
                    e.target.value.trim().length >= MIN_REASON_LENGTH
                  ) {
                    setReasonError("");
                  }
                }}
                placeholder="Nhập lý do xóa (tối thiểu 10 ký tự)"
                rows={4}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
              />
            </FormField>

            {/* Confirmation checkbox */}
            <div className="flex items-start gap-3">
              <Checkbox.Root
                id="delete-confirm-checkbox"
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(checked === true)}
                className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-gray-300 bg-white transition-colors data-[state=checked]:border-red-600 data-[state=checked]:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1"
              >
                <Checkbox.Indicator>
                  <Check className="h-3 w-3 text-white" strokeWidth={3} />
                </Checkbox.Indicator>
              </Checkbox.Root>
              <label
                htmlFor="delete-confirm-checkbox"
                className="cursor-pointer text-sm text-gray-700"
              >
                Tôi xác nhận muốn xóa lệnh này
              </label>
            </div>
          </div>

          {/* Error */}
          {deleteMutation.isError && (
            <p className="mt-3 text-sm text-red-600">
              {deleteMutation.error?.message ??
                "Xóa thất bại. Vui lòng thử lại."}
            </p>
          )}

          {/* Footer */}
          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close asChild>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={handleDelete}
              disabled={!canSubmit}
              className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleteMutation.isPending && (
                <LoadingSpinner size="sm" className="text-white" />
              )}
              Xóa
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
