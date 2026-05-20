import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { payOutManualApi } from "../api/pay-out-manual";
import { formatDateTime } from "../lib/utils";
import { LoadingSpinner } from "./LoadingSpinner";
import type { AuditLogEntry } from "../types/pay-order";

interface AuditLogPanelProps {
  orderId: string;
}

const PAGE_SIZE = 10;

export function AuditLogPanel({ orderId }: AuditLogPanelProps) {
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["audit-log", orderId, page],
    queryFn: () =>
      payOutManualApi.getAuditLog(orderId, page, PAGE_SIZE).then((r) => r.data),
    enabled: !!orderId,
  });

  const entries: AuditLogEntry[] = data?.content ?? [];
  const totalElements = data?.totalElements ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE));

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Chưa có lịch sử thay đổi
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground w-12">
                #
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Hành động
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Người thực hiện
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Thời gian
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Phiên bản
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {entries.map((entry) => (
              <tr
                key={entry.id}
                className="hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-3 text-muted-foreground">{entry.id}</td>
                <td className="px-4 py-3 font-medium">{entry.action}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {entry.performedBy}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDateTime(entry.performedAt)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {entry.versionBefore !== undefined
                    ? String(entry.versionBefore)
                    : "—"}{" "}
                  →{" "}
                  {entry.versionAfter !== undefined
                    ? String(entry.versionAfter)
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Trang {page + 1} / {totalPages} ({totalElements} bản ghi)
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Trước
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
}
