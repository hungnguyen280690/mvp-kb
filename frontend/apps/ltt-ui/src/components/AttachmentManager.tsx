import { useState, useRef, useCallback } from "react";
import type { PayOrderAttachment, DocType } from "../types/pay-out-manual";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AttachmentManagerProps {
  attachments: PayOrderAttachment[];
  loading?: boolean;
  canUpload?: boolean;
  canDelete?: boolean;
  onUpload: (file: File, docType: DocType, note?: string) => Promise<unknown>;
  onDownload: (attachmentId: string) => Promise<Blob>;
  onDelete: (attachmentId: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Doc type options
// ---------------------------------------------------------------------------

const DOC_TYPE_OPTIONS: { value: DocType; label: string }[] = [
  { value: "CHUNG_TU_GOC", label: "Chứng từ gốc" },
  { value: "HOP_DONG", label: "Hợp đồng" },
  { value: "HOA_DON", label: "Hóa đơn" },
  { value: "BANG_KE", label: "Bảng kê" },
  { value: "VAN_BAN_KHAC", label: "Văn bản khác" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AttachmentManager({
  attachments,
  loading = false,
  canUpload = false,
  canDelete = false,
  onUpload,
  onDownload,
  onDelete,
}: AttachmentManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedDocType, setSelectedDocType] =
    useState<DocType>("CHUNG_TU_GOC");
  const [uploadNote, setUploadNote] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      setUploadProgress(0);

      // Simulate progress since we can't track actual upload progress with current API
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 20, 80));
      }, 200);

      try {
        await onUpload(file, selectedDocType, uploadNote || undefined);
        setUploadProgress(100);
        setUploadNote("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (err) {
        console.error("Upload failed:", err);
      } finally {
        clearInterval(progressInterval);
        setTimeout(() => {
          setUploading(false);
          setUploadProgress(0);
        }, 500);
      }
    },
    [onUpload, selectedDocType, uploadNote],
  );

  const handleDownload = useCallback(
    async (attachId: string, fileName: string) => {
      setDownloadingId(attachId);
      try {
        const blob = await onDownload(attachId);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Download failed:", err);
      } finally {
        setDownloadingId(null);
      }
    },
    [onDownload],
  );

  const handleDelete = useCallback(
    async (attachId: string) => {
      if (!window.confirm("Bạn có chắc chắn muốn xóa file đính kèm này?")) {
        return;
      }
      setDeletingId(attachId);
      try {
        await onDelete(attachId);
      } catch (err) {
        console.error("Delete failed:", err);
      } finally {
        setDeletingId(null);
      }
    },
    [onDelete],
  );

  return (
    <div className="rounded-lg border border-[#d7dbe0] bg-white">
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-lg bg-[#eef3f9] px-3.5 py-2.5">
        <h3 className="text-[13px] font-bold uppercase text-[#073763]">
          File đính kèm
        </h3>
        <span className="text-[11px] text-[#5f6368]">TT_LTT.DINHKEM</span>
      </div>

      <div className="p-3.5">
        {/* Upload area */}
        {canUpload && (
          <div className="mb-3 rounded border border-dashed border-[#d7dbe0] bg-[#fafcfe] p-3">
            <div className="mb-2 flex flex-wrap items-end gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-[11px] font-medium text-[#333]">
                  Loại tài liệu
                </label>
                <select
                  value={selectedDocType}
                  onChange={(e) =>
                    setSelectedDocType(e.target.value as DocType)
                  }
                  className="h-8 w-full rounded border border-[#d7dbe0] bg-white px-2 text-[13px] focus:border-[#0b5394] focus:outline-none focus:ring-2 focus:ring-[rgba(11,83,148,0.15)]"
                >
                  {DOC_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-[11px] font-medium text-[#333]">
                  Ghi chú
                </label>
                <input
                  type="text"
                  value={uploadNote}
                  onChange={(e) => setUploadNote(e.target.value)}
                  className="h-8 w-full rounded border border-[#d7dbe0] px-2 text-[13px] focus:border-[#0b5394] focus:outline-none focus:ring-2 focus:ring-[rgba(11,83,148,0.15)]"
                  placeholder="Ghi chú (không bắt buộc)…"
                />
              </div>
              <label className="flex h-8 cursor-pointer items-center rounded bg-[#0b5394] px-4 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#073763]">
                Chọn file
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
              </label>
            </div>
            {uploading && (
              <div className="mt-2">
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#eef3f9]">
                  <div
                    className="h-full rounded-full bg-[#0b5394] transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-[11px] text-[#5f6368]">
                  Đang tải lên… {uploadProgress}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* Attachment list */}
        {loading ? (
          <div className="py-8 text-center text-[12px] italic text-[#5f6368]">
            Đang tải danh sách file…
          </div>
        ) : attachments.length === 0 ? (
          <div className="py-8 text-center text-[12px] italic text-[#5f6368]">
            Chưa có file đính kèm.
            {canUpload && " Nhấn Chọn file để tải lên."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr className="border-b-2 border-[#c9d6e3] bg-[#eef3f9]">
                  <th className="px-2.5 py-2 text-left text-[12px] font-bold uppercase text-[#073763]">
                    Tên file
                  </th>
                  <th className="px-2.5 py-2 text-left text-[12px] font-bold uppercase text-[#073763]">
                    Loại
                  </th>
                  <th className="px-2.5 py-2 text-left text-[12px] font-bold uppercase text-[#073763]">
                    Kích thuốc
                  </th>
                  <th className="px-2.5 py-2 text-left text-[12px] font-bold uppercase text-[#073763]">
                    Nguời tải
                  </th>
                  <th className="px-2.5 py-2 text-left text-[12px] font-bold uppercase text-[#073763]">
                    Thời gian
                  </th>
                  <th className="w-[90px] px-2.5 py-2 text-center text-[12px] font-bold uppercase text-[#073763]">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {attachments.map((att, idx) => (
                  <tr
                    key={att.ID}
                    className={`border-b border-[#d7dbe0] ${
                      idx % 2 === 1 ? "bg-[#fafcfe]" : ""
                    } hover:bg-[#eef5fd]`}
                  >
                    <td className="px-2.5 py-2">
                      <span className="font-medium text-[#333]">
                        {att.FILE_NAME}
                      </span>
                      {att.NOTE && (
                        <div className="text-[11px] text-[#5f6368]">
                          {att.NOTE}
                        </div>
                      )}
                    </td>
                    <td className="px-2.5 py-2 text-[#5f6368]">
                      {DOC_TYPE_OPTIONS.find((o) => o.value === att.DOC_TYPE)
                        ?.label || att.DOC_TYPE}
                    </td>
                    <td className="px-2.5 py-2 text-[#5f6368]">
                      {formatFileSize(att.FILE_SIZE)}
                    </td>
                    <td className="px-2.5 py-2 text-[#5f6368]">
                      {att.UPLOADED_BY}
                    </td>
                    <td className="px-2.5 py-2 text-[#5f6368]">
                      {formatDateTime(att.UPLOADED_AT)}
                    </td>
                    <td className="px-2.5 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDownload(att.ID, att.FILE_NAME)}
                          disabled={downloadingId === att.ID}
                          className="flex h-[26px] w-[26px] items-center justify-center rounded border border-[#d7dbe0] text-[#0b5394] transition-colors hover:bg-[#e7f0f9]"
                          title="Tải về"
                          aria-label={`Tải về ${att.FILE_NAME}`}
                        >
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                        </button>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDelete(att.ID)}
                            disabled={deletingId === att.ID}
                            className="flex h-[26px] w-[26px] items-center justify-center rounded border border-[#e7c2c2] text-[#cc0000] transition-colors hover:bg-[#fdecec]"
                            title="Xóa file"
                            aria-label={`Xóa file ${att.FILE_NAME}`}
                          >
                            <svg
                              className="h-3.5 w-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AttachmentManager;
