import React, { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePayOrderAttachments } from "../api/hooks";
import { payOutManualApi } from "../api/pay-out-manual";
import { ConfirmDialog } from "./ConfirmDialog";
import { LoadingSpinner } from "./LoadingSpinner";
import { formatDateTime } from "../lib/utils";
import { queryKeys } from "../api/hooks";
import type { AttachmentResponse } from "../types/pay-order";

interface AttachmentPanelProps {
  orderId: string;
  canUpload?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ACCEPTED_TYPES =
  ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.txt,.zip";

export function AttachmentPanel({
  orderId,
  canUpload = false,
}: AttachmentPanelProps) {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { data: attachments = [], isLoading } = usePayOrderAttachments(orderId);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => payOutManualApi.uploadAttachment(orderId, file),
    onSuccess: () => {
      setUploadError(null);
      void qc.invalidateQueries({ queryKey: queryKeys.attachments(orderId) });
    },
    onError: (err: Error) => {
      setUploadError(err.message ?? "Tải lên thất bại. Vui lòng thử lại.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (attachId: string) =>
      payOutManualApi.deleteAttachment(orderId, attachId),
    onSuccess: () => {
      setDeleteTarget(null);
      void qc.invalidateQueries({ queryKey: queryKeys.attachments(orderId) });
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadMutation.mutate(file);
    // reset input so same file can be re-selected
    e.target.value = "";
  }

  async function handleDownload(attach: AttachmentResponse) {
    try {
      const response = await payOutManualApi.downloadAttachment(
        orderId,
        attach.id,
      );
      const url = URL.createObjectURL(response.data as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = attach.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // silently fail — could show toast in production
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {canUpload && (
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            multiple={false}
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploadMutation.isPending && <LoadingSpinner size="sm" />}
            Tải lên
          </button>
          {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
        </div>
      )}

      {attachments.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Chưa có tài liệu đính kèm
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Tên tệp
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Kích thước
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Người tải
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Thời gian
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {attachments.map((att) => (
                <tr
                  key={att.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{att.fileName}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatFileSize(att.fileSizeBytes)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {att.uploadedBy}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(att.uploadedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void handleDownload(att)}
                        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        Tải về
                      </button>
                      {canUpload && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(att.id)}
                          className="rounded-md border border-red-300 bg-white px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                        >
                          Xóa
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

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Xóa tài liệu đính kèm"
        description="Bạn có chắc chắn muốn xóa tệp này? Thao tác không thể hoàn tác."
        confirmLabel="Xóa"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget);
        }}
      />
    </div>
  );
}
