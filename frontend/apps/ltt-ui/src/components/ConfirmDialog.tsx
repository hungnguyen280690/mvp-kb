import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "../lib/utils";
import { LoadingSpinner } from "./LoadingSpinner";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: "default" | "destructive";
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  onConfirm,
  variant = "default",
  isLoading = false,
}: ConfirmDialogProps) {
  const confirmButtonClass = cn(
    "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    variant === "destructive"
      ? "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600"
      : "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600",
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <Dialog.Title className="text-base font-semibold text-gray-900">
            {title}
          </Dialog.Title>
          {description && (
            <Dialog.Description className="mt-2 text-sm text-gray-600">
              {description}
            </Dialog.Description>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close asChild>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                disabled={isLoading}
              >
                {cancelLabel}
              </button>
            </Dialog.Close>
            <button
              type="button"
              className={confirmButtonClass}
              onClick={onConfirm}
              disabled={isLoading}
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
