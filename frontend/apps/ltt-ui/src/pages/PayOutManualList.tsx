import { useState, useCallback, useMemo } from "react";
import { useAppNavigate } from "../hooks/useAppNavigate";
import type {
  OrderStatus,
  OrderChannel,
  ListOrdersParams,
} from "../types/pay-out-manual";
import {
  useOrders,
  useWorkflowAction,
  useExport,
} from "../hooks/usePayOutManual";
import { StatusBadge } from "../components/StatusBadge";
import { ExportDialog } from "../components/ExportDialog";
import { ErrorBoundary } from "../components/ErrorBoundary";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "DRAFT", label: "Nháp" },
  { value: "READY_FOR_APPROVAL", label: "Chờ kiểm soát" },
  { value: "PENDING_APPROVER", label: "Chờ phê duyệt" },
  { value: "APPROVED", label: "Đã phê duyệt" },
  { value: "RETURNED_TO_MAKER", label: "Được trả lại" },
  { value: "REJECTED", label: "Từ chối" },
  { value: "DELETED", label: "Đã xóa" },
];

const CHANNEL_OPTIONS: { value: OrderChannel; label: string }[] = [
  { value: "LNH", label: "LNH" },
  { value: "TTSP", label: "TTSP" },
  { value: "LIEN_KHO_BAC", label: "Liên Kho Bạc" },
];

type SortDir = "asc" | "desc";
interface SortState {
  field: string;
  dir: SortDir;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return iso;
  }
}

function formatAmount(n: number): string {
  return n.toLocaleString("vi-VN");
}

function getSortParam(sort: SortState): string {
  return `${sort.field},${sort.dir}`;
}

// ---------------------------------------------------------------------------
// Component (inner)
// ---------------------------------------------------------------------------

function PayOutManualListInner() {
  const nav = useAppNavigate();

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [channelFilter, setChannelFilter] = useState<OrderChannel | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountFrom, setAmountFrom] = useState("");
  const [amountTo, setAmountTo] = useState("");
  const [refNoSearch, setRefNoSearch] = useState("");
  const [kbnnIdSearch, setKbnnIdSearch] = useState("");

  // Pagination
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Sort
  const [sort, setSort] = useState<SortState>({
    field: "CREATED_AT",
    dir: "desc",
  });

  // Export dialog
  const [exportOpen, setExportOpen] = useState(false);

  // Build query params
  const params: ListOrdersParams = useMemo(
    () => ({
      page,
      size: pageSize,
      sort: [getSortParam(sort)],
      STATUS: statusFilter || undefined,
      CHANNEL: channelFilter || undefined,
      PAYMENT_DATE_FROM: dateFrom || undefined,
      PAYMENT_DATE_TO: dateTo || undefined,
      AMOUNT_FROM: amountFrom ? parseFloat(amountFrom) : undefined,
      AMOUNT_TO: amountTo ? parseFloat(amountTo) : undefined,
      REF_NO: refNoSearch || undefined,
      KBNN_ID: kbnnIdSearch || undefined,
    }),
    [
      page,
      pageSize,
      sort,
      statusFilter,
      channelFilter,
      dateFrom,
      dateTo,
      amountFrom,
      amountTo,
      refNoSearch,
      kbnnIdSearch,
    ],
  );

  const { data, loading, error } = useOrders(params);
  const workflowHook = useWorkflowAction();
  const exportHook = useExport();

  // Handlers
  const handleSort = useCallback((field: string) => {
    setSort((prev) => ({
      field,
      dir: prev.field === field && prev.dir === "asc" ? "desc" : "asc",
    }));
    setPage(0);
  }, []);

  const handlePageSizeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setPageSize(Number(e.target.value));
      setPage(0);
    },
    [],
  );

  const handleResetFilters = useCallback(() => {
    setStatusFilter("");
    setChannelFilter("");
    setDateFrom("");
    setDateTo("");
    setAmountFrom("");
    setAmountTo("");
    setRefNoSearch("");
    setKbnnIdSearch("");
    setPage(0);
  }, []);

  const handleCopy = useCallback(
    async (id: string) => {
      try {
        const result = await workflowHook.execute({ action: "copy", id });
        nav.toView(result.ID);
      } catch (err) {
        console.error("Copy failed:", err);
      }
    },
    [workflowHook, nav],
  );

  const handleExport = useCallback(
    async (columns: string[], format: "XLSX" | "PDF" | "CSV") => {
      try {
        await exportHook.exportOrders({
          FORMAT: format,
          FILTERS: {
            STATUS: statusFilter ? [statusFilter as OrderStatus] : undefined,
            CHANNEL: channelFilter || undefined,
            PAYMENT_DATE_FROM: dateFrom || undefined,
            PAYMENT_DATE_TO: dateTo || undefined,
            AMOUNT_FROM: amountFrom ? parseFloat(amountFrom) : undefined,
            AMOUNT_TO: amountTo ? parseFloat(amountTo) : undefined,
            REF_NO: refNoSearch || undefined,
            KBNN_ID: kbnnIdSearch || undefined,
          },
          COLUMNS: columns,
        });
        setExportOpen(false);
      } catch (err) {
        console.error("Export failed:", err);
      }
    },
    [
      exportHook,
      statusFilter,
      channelFilter,
      dateFrom,
      dateTo,
      amountFrom,
      amountTo,
      refNoSearch,
      kbnnIdSearch,
    ],
  );

  const totalPages = data?.PAGE.TOTAL_PAGES || 0;
  const totalElements = data?.PAGE.TOTAL_ELEMENTS || 0;
  const content = data?.CONTENT || [];

  const inputCls =
    "h-8 rounded border border-[#d7dbe0] px-2 text-[13px] focus:border-[#0b5394] focus:outline-none focus:ring-2 focus:ring-[rgba(11,83,148,0.15)]";
  const selectCls = inputCls;

  return (
    <div className="min-h-screen bg-[#f4f6fa] px-5 pb-10 pt-4">
      {/* Breadcrumb */}
      <nav className="mb-3 bg-white px-5 py-2 text-[12px]">
        <span className="text-[#0b5394]">Lệnh thanh toán đi</span>
        <span className="mx-1.5 text-[#bbb]">&rsaquo;</span>
        <span className="font-semibold text-[#1f2328]">Danh sách lệnh</span>
      </nav>

      {/* Filter card */}
      <div className="mb-3.5 rounded-md border border-[#d7dbe0] bg-white shadow-[0_1px_2px_rgba(15,20,25,0.04)]">
        <div className="flex items-center justify-between rounded-t-md bg-[#eef3f9] px-3.5 py-2.5">
          <h2 className="text-[13px] font-bold uppercase text-[#073763]">
            Bộ lọc
          </h2>
          <span className="text-[11px] text-[#5f6368]">TT_LTT.LIST.FILTER</span>
        </div>
        <div className="grid grid-cols-3 gap-x-[18px] gap-y-3 p-3.5 max-[960px]:grid-cols-2 max-[600px]:grid-cols-1">
          {/* Ref No */}
          <div>
            <label className="mb-1 block text-[12px] font-medium text-[#333]">
              Số tham chiếu
            </label>
            <input
              type="text"
              value={refNoSearch}
              onChange={(e) => setRefNoSearch(e.target.value)}
              className={inputCls}
              style={{ width: "100%" }}
              placeholder="Nhập số tham chiếu…"
            />
          </div>

          {/* Status */}
          <div>
            <label className="mb-1 block text-[12px] font-medium text-[#333]">
              Trạng thái
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={selectCls}
              style={{ width: "100%" }}
            >
              <option value="">-- Tất cả --</option>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Channel */}
          <div>
            <label className="mb-1 block text-[12px] font-medium text-[#333]">
              Kênh
            </label>
            <select
              value={channelFilter}
              onChange={(e) =>
                setChannelFilter(e.target.value as OrderChannel | "")
              }
              className={selectCls}
              style={{ width: "100%" }}
            >
              <option value="">-- Tất cả --</option>
              {CHANNEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div>
            <label className="mb-1 block text-[12px] font-medium text-[#333]">
              Ngày thanh toán
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className={inputCls}
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Amount range */}
          <div>
            <label className="mb-1 block text-[12px] font-medium text-[#333]">
              Số tiền
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="number"
                value={amountFrom}
                onChange={(e) => setAmountFrom(e.target.value)}
                className={inputCls}
                placeholder="Từ…"
              />
              <input
                type="number"
                value={amountTo}
                onChange={(e) => setAmountTo(e.target.value)}
                className={inputCls}
                placeholder="Đến…"
              />
            </div>
          </div>

          {/* KBNN ID */}
          <div>
            <label className="mb-1 block text-[12px] font-medium text-[#333]">
              Mã KBNN
            </label>
            <input
              type="text"
              value={kbnnIdSearch}
              onChange={(e) => setKbnnIdSearch(e.target.value)}
              className={inputCls}
              style={{ width: "100%" }}
              placeholder="Nhập mã KBNN…"
            />
          </div>
        </div>

        {/* Filter actions */}
        <div className="flex items-center justify-between border-t border-[#d7dbe0] bg-[#fafcfe] px-3.5 py-2.5">
          <span className="text-[12px] text-[#5f6368]">
            {totalElements > 0 ? `Tổng: ${totalElements} lệnh` : ""}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex h-8 items-center gap-1 rounded border border-[#c6d6e6] bg-white px-3.5 text-[12.5px] font-semibold text-[#0b5394] transition-colors hover:bg-[#e7f0f9]"
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Đặt lại
            </button>
          </div>
        </div>
      </div>

      {/* Data card */}
      <div className="rounded-md border border-[#d7dbe0] bg-white shadow-[0_1px_2px_rgba(15,20,25,0.04)]">
        {/* Toolbar top */}
        <div className="flex items-center justify-between border-b border-[#d7dbe0] bg-[#fafcfe] px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <h2 className="text-[13px] font-bold uppercase text-[#073763]">
              Danh sách lệnh thanh toán đi
            </h2>
            <span className="text-[11px] text-[#5f6368]">TT_LTT.LIST</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setExportOpen(true)}
              className="flex h-8 items-center gap-1 rounded border border-[#c6d6e6] bg-white px-3.5 text-[12.5px] font-semibold text-[#0b5394] transition-colors hover:bg-[#e7f0f9]"
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
              Xuất file
            </button>
            <button
              type="button"
              onClick={() => nav.toCreate()}
              className="flex h-8 items-center gap-1 rounded bg-[#137333] px-3.5 text-[12.5px] font-semibold text-white transition-colors hover:brightness-[0.92]"
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
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              Tạo mới
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="border-l-4 border-[#cc0000] bg-white px-4 py-3 text-[12.5px] text-[#cc0000]">
            Lỗi khi tải dữ liệu: {error.message}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table
            className="w-full border-collapse text-[12.5px]"
            aria-label="Danh sách lệnh thanh toán đi"
          >
            <thead>
              <tr className="border-b-2 border-[#c9d6e3] bg-[#eef3f9]">
                <th className="w-[50px] px-2.5 py-2 text-center text-[12px] font-bold uppercase text-[#073763]">
                  STT
                </th>
                {(
                  [
                    { field: "REF_NO", label: "Số tham chiếu" },
                    { field: "CHANNEL", label: "Kênh" },
                    { field: "ORDER_TYPE", label: "Loại lệnh" },
                    {
                      field: "AMOUNT",
                      label: "Số tiền",
                      align: "right" as const,
                    },
                    { field: "CURRENCY_CODE", label: "Ngoại tệ" },
                    { field: "STATUS", label: "Trạng thái" },
                    { field: "CREATED_BY", label: "Nguời tạo" },
                    { field: "CREATED_AT", label: "Ngày tạo" },
                    { field: "PAYMENT_DATE", label: "Ngày thanh toán" },
                  ] as { field: string; label: string; align?: string }[]
                ).map((col) => (
                  <th
                    key={col.field}
                    className={`cursor-pointer whitespace-nowrap px-2.5 py-2 text-[12px] font-bold uppercase text-[#073763] hover:text-[#0b5394] ${
                      col.align === "right" ? "text-right" : "text-left"
                    }`}
                    onClick={() => handleSort(col.field)}
                  >
                    {col.label}
                    {sort.field === col.field && (
                      <span className="ml-1">
                        {sort.dir === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                ))}
                <th className="w-[90px] px-2.5 py-2 text-center text-[12px] font-bold uppercase text-[#073763]">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={11}
                    className="py-8 text-center text-[12px] italic text-[#5f6368]"
                  >
                    Đang tải dữ liệu…
                  </td>
                </tr>
              ) : content.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="py-8 text-center text-[12px] italic text-[#5f6368]"
                  >
                    Không có dữ liệu. Nhấn "Tạo mới" để thêm lệnh thanh toán.
                  </td>
                </tr>
              ) : (
                content.map((item, idx) => (
                  <tr
                    key={item.ID}
                    className="cursor-pointer border-b border-[#d7dbe0] hover:bg-[#eef5fd]"
                    onClick={() => nav.toView(item.ID)}
                  >
                    <td className="px-2.5 py-2 text-center text-[#5f6368]">
                      {page * pageSize + idx + 1}
                    </td>
                    <td className="px-2.5 py-2 font-medium text-[#333]">
                      {item.REF_NO}
                    </td>
                    <td className="px-2.5 py-2 text-[#5f6368]">
                      {item.CHANNEL}
                    </td>
                    <td className="px-2.5 py-2 text-[#5f6368]">
                      {item.ORDER_TYPE || ""}
                    </td>
                    <td className="px-2.5 py-2 text-right font-medium text-[#333]">
                      {formatAmount(item.AMOUNT)}
                    </td>
                    <td className="px-2.5 py-2 text-[#5f6368]">
                      {item.CURRENCY_CODE}
                    </td>
                    <td className="px-2.5 py-2">
                      <StatusBadge status={item.STATUS} />
                    </td>
                    <td className="px-2.5 py-2 text-[#5f6368]">
                      {item.CREATED_BY}
                    </td>
                    <td className="px-2.5 py-2 text-[#5f6368]">
                      {formatDate(item.CREATED_AT)}
                    </td>
                    <td className="px-2.5 py-2 text-[#5f6368]">
                      {formatDate(item.PAYMENT_DATE)}
                    </td>
                    <td
                      className="px-2.5 py-2 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {/* View */}
                        <button
                          type="button"
                          onClick={() => nav.toView(item.ID)}
                          className="flex h-[26px] w-[26px] items-center justify-center rounded border border-[#d7dbe0] text-[#0b5394] transition-colors hover:bg-[#e7f0f9]"
                          title="Xem chi tiết"
                          aria-label={`Xem chi tiết ${item.REF_NO}`}
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
                              d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        </button>
                        {/* Edit */}
                        {(item.STATUS === "DRAFT" ||
                          item.STATUS === "RETURNED_TO_MAKER") && (
                          <button
                            type="button"
                            onClick={() => nav.toEdit(item.ID)}
                            className="flex h-[26px] w-[26px] items-center justify-center rounded border border-[#d7dbe0] text-[#0b5394] transition-colors hover:bg-[#e7f0f9]"
                            title="Chỉnh sửa"
                            aria-label={`Chỉnh sửa ${item.REF_NO}`}
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
                                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                              />
                            </svg>
                          </button>
                        )}
                        {/* Copy */}
                        <button
                          type="button"
                          onClick={() => handleCopy(item.ID)}
                          className="flex h-[26px] w-[26px] items-center justify-center rounded border border-[#d7dbe0] text-[#0b5394] transition-colors hover:bg-[#e7f0f9]"
                          title="Sao chép"
                          aria-label={`Sao chép ${item.REF_NO}`}
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
                              d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-[#d7dbe0] bg-[#fafcfe] px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="h-7 rounded border border-[#d7dbe0] bg-white px-1.5 text-[11px]"
            >
              {PAGE_SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-[#5f6368]">
              Tổng {totalElements} lệnh
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 0}
              onClick={() => setPage(0)}
              className="flex h-7 w-7 items-center justify-center rounded border border-[#d7dbe0] bg-white text-[12px] disabled:cursor-not-allowed disabled:opacity-55"
            >
              &laquo;
            </button>
            <button
              type="button"
              disabled={page <= 0}
              onClick={() => setPage((p) => p - 1)}
              className="flex h-7 w-7 items-center justify-center rounded border border-[#d7dbe0] bg-white text-[12px] disabled:cursor-not-allowed disabled:opacity-55"
            >
              &lsaquo;
            </button>
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(0, Math.min(page - 2, totalPages - 5));
              const p = start + i;
              if (p >= totalPages) return null;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`flex h-7 w-7 items-center justify-center rounded text-[12px] font-semibold ${
                    page === p
                      ? "bg-[#0b5394] text-white"
                      : "border border-[#d7dbe0] bg-white text-[#333] hover:bg-[#f3f5f8]"
                  }`}
                >
                  {p + 1}
                </button>
              );
            })}
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="flex h-7 w-7 items-center justify-center rounded border border-[#d7dbe0] bg-white text-[12px] disabled:cursor-not-allowed disabled:opacity-55"
            >
              &rsaquo;
            </button>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(totalPages - 1)}
              className="flex h-7 w-7 items-center justify-center rounded border border-[#d7dbe0] bg-white text-[12px] disabled:cursor-not-allowed disabled:opacity-55"
            >
              &raquo;
            </button>
          </div>
        </div>
      </div>

      {/* Export dialog */}
      <ExportDialog
        open={exportOpen}
        onExport={handleExport}
        onClose={() => setExportOpen(false)}
        loading={exportHook.loading}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Wrapped with ErrorBoundary
// ---------------------------------------------------------------------------

export function PayOutManualList() {
  return (
    <ErrorBoundary>
      <PayOutManualListInner />
    </ErrorBoundary>
  );
}

export default PayOutManualList;
