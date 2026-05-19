import { useState, useCallback } from "react";
import type { ExportFormat, ExportFilters } from "../types/pay-out-manual";

// ---------------------------------------------------------------------------
// Column definitions for field selection
// ---------------------------------------------------------------------------

interface ColumnDef {
  key: string;
  label: string;
  defaultSelected: boolean;
}

const EXPORT_COLUMNS: ColumnDef[] = [
  { key: "REF_NO", label: "Số tham chiếu", defaultSelected: true },
  { key: "CHANNEL", label: "Kenh", defaultSelected: true },
  { key: "ORDER_TYPE", label: "Loại lệnh", defaultSelected: true },
  { key: "SENDER_NAME", label: "Nguời chứng triệt", defaultSelected: true },
  { key: "RECEIVER_NAME", label: "Nguời hưởng", defaultSelected: true },
  { key: "AMOUNT", label: "Số tiền", defaultSelected: true },
  { key: "CURRENCY_CODE", label: "Ngoại tệ", defaultSelected: true },
  { key: "PAYMENT_DATE", label: "Ngày thanh toán", defaultSelected: true },
  { key: "STATUS", label: "Trạng thái", defaultSelected: true },
  { key: "CREATED_BY", label: "Nguời tạo", defaultSelected: true },
  { key: "CREATED_AT", label: "Ngày tạo", defaultSelected: true },
  { key: "KBNN_ID", label: "Mã KBNN", defaultSelected: false },
  { key: "DESCRIPTION", label: "Mô tả", defaultSelected: false },
  { key: "EXCHANGE_RATE", label: "Tỉ giá", defaultSelected: false },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ExportDialogProps {
  open: boolean;
  filters?: ExportFilters;
  onExport: (columns: string[], format: ExportFormat) => void;
  onClose: () => void;
  loading?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const FORMAT_OPTIONS: { value: ExportFormat; label: string; icon: string }[] = [
  { value: "XLSX", label: "Excel (.xlsx)", icon: "X" },
  { value: "PDF", label: "PDF (.pdf)", icon: "P" },
  { value: "CSV", label: "CSV (.csv)", icon: "C" },
];

export function ExportDialog({
  open,
  onExport,
  onClose,
  loading = false,
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>("XLSX");
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    EXPORT_COLUMNS.filter((c) => c.defaultSelected).map((c) => c.key),
  );
  const [selectAll, setSelectAll] = useState(true);

  const handleToggleColumn = useCallback((key: string) => {
    setSelectedColumns((prev) => {
      const next = prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key];
      setSelectAll(next.length === EXPORT_COLUMNS.length);
      return next;
    });
  }, []);

  const handleToggleAll = useCallback(() => {
    if (selectAll) {
      setSelectedColumns([]);
      setSelectAll(false);
    } else {
      setSelectedColumns(EXPORT_COLUMNS.map((c) => c.key));
      setSelectAll(true);
    }
  }, [selectAll]);

  const handleExport = useCallback(() => {
    if (selectedColumns.length === 0 || loading) return;
    onExport(selectedColumns, format);
  }, [selectedColumns, format, loading, onExport]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-dialog-title"
    >
      <div className="w-full max-w-md rounded-lg bg-white shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
        {/* Header */}
        <div className="flex items-center justify-between rounded-t-lg bg-gradient-to-r from-[#073763] to-[#0b5394] px-[18px] py-3">
          <h3
            id="export-dialog-title"
            className="text-[14px] font-bold text-white"
          >
            Xuất dữ liệu
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded text-white/85 transition-colors hover:bg-white/20"
            aria-label="Đóng"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          {/* Format selection */}
          <label className="mb-1 block text-[12px] font-medium text-[#333]">
            Định dạng xuất
          </label>
          <div className="mb-4 flex gap-2">
            {FORMAT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFormat(opt.value)}
                className={`flex h-9 flex-1 items-center justify-center gap-1 rounded border text-[12.5px] font-semibold transition-colors ${
                  format === opt.value
                    ? "border-[#0b5394] bg-[#0b5394] text-white"
                    : "border-[#d7dbe0] bg-white text-[#333] hover:bg-[#f3f5f8]"
                }`}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded bg-white/20 text-[10px] font-bold">
                  {opt.icon}
                </span>
                {opt.label}
              </button>
            ))}
          </div>

          {/* Column selection */}
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-[12px] font-medium text-[#333]">
                Trường xuất
              </label>
              <label className="flex cursor-pointer items-center gap-1 text-[11px] text-[#0b5394]">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleToggleAll}
                  className="h-4 w-4 rounded accent-[#0b5394]"
                />
                Chọn tất cả
              </label>
            </div>
            <div className="grid max-h-48 grid-cols-2 gap-1 overflow-y-auto rounded border border-[#d7dbe0] p-2">
              {EXPORT_COLUMNS.map((col) => (
                <label
                  key={col.key}
                  className="flex cursor-pointer items-center gap-1.5 text-[12px] text-[#333]"
                >
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(col.key)}
                    onChange={() => handleToggleColumn(col.key)}
                    className="h-4 w-4 rounded accent-[#0b5394]"
                  />
                  {col.label}
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-[#d7dbe0] pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-8 rounded border border-[#d7dbe0] bg-white px-4 text-[12.5px] font-semibold text-[#333] transition-colors hover:bg-[#f3f5f8] disabled:cursor-not-allowed disabled:opacity-55"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={selectedColumns.length === 0 || loading}
              className="h-8 rounded bg-[#0b5394] px-4 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#073763] disabled:cursor-not-allowed disabled:opacity-55"
            >
              {loading ? "Đang xuất…" : "Xuất file"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExportDialog;
