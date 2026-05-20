import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { payOutManualApi, type ListParams } from "../api/pay-out-manual";
import { LoadingSpinner } from "./LoadingSpinner";
import { cn } from "../lib/utils";

type ExportFormat = "EXCEL" | "CSV" | "PDF";

const FORMAT_OPTIONS: { value: ExportFormat; label: string; ext: string }[] = [
  { value: "EXCEL", label: "Excel (.xlsx)", ext: "xlsx" },
  { value: "CSV", label: "CSV (.csv)", ext: "csv" },
  { value: "PDF", label: "PDF (.pdf)", ext: "pdf" },
];

export interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFilter?: ListParams;
}

export function ExportDialog({
  open,
  onOpenChange,
  currentFilter,
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>("EXCEL");
  const [useCurrentFilter, setUseCurrentFilter] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function triggerDownload(blob: Blob, format: ExportFormat) {
    const ext = FORMAT_OPTIONS.find((o) => o.value === format)?.ext ?? "bin";
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T]/g, "")
      .slice(0, 14);
    const fileName = `LTT_Export_${timestamp}.${ext}`;

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function handleExport() {
    setError(null);
    setIsExporting(true);
    try {
      const filter = useCurrentFilter ? currentFilter : undefined;
      const response = await payOutManualApi.export(format, filter);
      const blob = response.data as Blob;
      triggerDownload(blob, format);
      onOpenChange(false);
    } catch {
      setError("Xuất dữ liệu thất bại. Vui lòng thử lại.");
    } finally {
      setIsExporting(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!isExporting) {
      if (!nextOpen) {
        setError(null);
        setFormat("EXCEL");
        setUseCurrentFilter(true);
      }
      onOpenChange(nextOpen);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-gray-900">
              Xuất dữ liệu
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                disabled={isExporting}
                aria-label="Đóng"
                className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:pointer-events-none disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="mt-1 text-sm text-gray-500">
            Chọn định dạng file và phạm vi dữ liệu cần xuất.
          </Dialog.Description>

          {/* Format selection */}
          <fieldset className="mt-5">
            <legend className="mb-2 text-sm font-medium text-gray-700">
              Định dạng
            </legend>
            <div className="flex flex-col gap-2">
              {FORMAT_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm transition-colors",
                    format === opt.value
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50",
                  )}
                >
                  <input
                    type="radio"
                    name="export-format"
                    value={opt.value}
                    checked={format === opt.value}
                    onChange={() => setFormat(opt.value)}
                    className="accent-blue-600"
                    disabled={isExporting}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Use current filter checkbox */}
          <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={useCurrentFilter}
              onChange={(e) => setUseCurrentFilter(e.target.checked)}
              disabled={isExporting}
              className="h-4 w-4 rounded accent-blue-600"
            />
            Dùng bộ lọc hiện tại
          </label>

          {/* Inline error */}
          {error && (
            <p
              role="alert"
              className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600"
            >
              {error}
            </p>
          )}

          {/* Footer buttons */}
          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close asChild>
              <button
                type="button"
                disabled={isExporting}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              >
                Hủy
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              {isExporting && <LoadingSpinner size="sm" />}
              {isExporting ? "Đang xuất..." : "Xuất"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
