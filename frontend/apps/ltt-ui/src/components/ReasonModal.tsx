import { useState, useEffect, useRef, useCallback } from "react";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ReasonModalProps {
  /** Whether the modal is visible */
  open: boolean;
  /** Title displayed in the modal header */
  title: string;
  /** Descriptive label above the textarea */
  label?: string;
  /** Callback with the reason text when user confirms */
  onConfirm: (reason: string) => void;
  /** Callback when user cancels */
  onCancel: () => void;
  /** Whether the confirm action is loading */
  loading?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MIN_LENGTH = 10;
const MAX_LENGTH = 500;

export function ReasonModal({
  open,
  title,
  label = "Lý do",
  onConfirm,
  onCancel,
  loading = false,
}: ReasonModalProps) {
  const [reason, setReason] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const isValid =
    reason.trim().length >= MIN_LENGTH && reason.length <= MAX_LENGTH;
  const charCount = reason.length;

  // Focus textarea on open
  useEffect(() => {
    if (open) {
      setReason("");
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [open]);

  // Esc key handler
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === overlayRef.current) {
        onCancel();
      }
    },
    [onCancel],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (isValid && !loading) {
        onConfirm(reason.trim());
      }
    },
    [isValid, loading, onConfirm, reason],
  );

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-5"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reason-modal-title"
    >
      <div className="w-full max-w-lg rounded-lg bg-white shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
        {/* Header */}
        <div className="flex items-center justify-between rounded-t-lg bg-gradient-to-r from-[#073763] to-[#0b5394] px-[18px] py-3">
          <h3
            id="reason-modal-title"
            className="text-[14px] font-bold text-white"
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-7 w-7 items-center justify-center rounded text-white/85 transition-colors hover:bg-white/20"
            aria-label="Đóng"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4">
          <label className="mb-1 block text-[12px] font-medium text-[#333]">
            {label} <span className="text-[#cc0000]">*</span>
          </label>
          <textarea
            ref={textareaRef}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded border border-[#d7dbe0] p-2 text-[13px] focus:border-[#0b5394] focus:outline-none focus:ring-2 focus:ring-[rgba(11,83,148,0.15)]"
            rows={5}
            placeholder={`Nhập lý do (tối thiểu ${MIN_LENGTH} ký tự)…`}
            maxLength={MAX_LENGTH}
            disabled={loading}
          />
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span
              className={
                charCount > 0 && charCount < MIN_LENGTH
                  ? "text-[#cc0000]"
                  : "text-[#5f6368]"
              }
            >
              {charCount < MIN_LENGTH
                ? `Còn thiếu ${MIN_LENGTH - charCount} ký tự`
                : `${charCount}/${MAX_LENGTH}`}
            </span>
            {charCount > MAX_LENGTH && (
              <span className="text-[#cc0000]">Vượt quá giới hạn</span>
            )}
          </div>

          {/* Footer buttons */}
          <div className="mt-4 flex items-center justify-end gap-2 border-t border-[#d7dbe0] pt-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="h-8 rounded border border-[#d7dbe0] bg-white px-4 text-[12.5px] font-semibold text-[#333] transition-colors hover:bg-[#f3f5f8] disabled:cursor-not-allowed disabled:opacity-55"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={!isValid || loading}
              className="h-8 rounded bg-[#cc0000] px-4 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#a30000] disabled:cursor-not-allowed disabled:opacity-55"
            >
              {loading ? "Đang xử lý…" : "Xác nhận"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReasonModal;
