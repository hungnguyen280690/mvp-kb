import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  Pencil,
  PlusCircle,
  Download,
  Search,
  XCircle,
} from "lucide-react";
import { usePayOrderList } from "../api/hooks";
import type { ListParams } from "../api/pay-out-manual";
import { DataTable } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { ExportDialog } from "../components/ExportDialog";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency, formatDate } from "../lib/utils";
import type {
  PayOrderSummary,
  PayOrderStatus,
  ChannelCode,
} from "../types/pay-order";

// ─── constants ───────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: PayOrderStatus; label: string }[] = [
  { value: "DRAFT", label: "Nháp" },
  { value: "READY_FOR_APPROVAL", label: "Chờ KT" },
  { value: "PENDING_APPROVER", label: "Chờ KD" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "RETURNED_TO_MAKER", label: "Trả lại" },
  { value: "REJECTED", label: "Từ chối" },
];

const CHANNEL_OPTIONS: { value: ChannelCode | ""; label: string }[] = [
  { value: "", label: "-- Tất cả kênh --" },
  { value: "LNH", label: "LNH" },
  { value: "TTSP", label: "TTSP" },
  { value: "LIEN_KHO_BAC", label: "Liên Kho Bạc" },
];

const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_SORT_KEY = "createdAt";
const DEFAULT_SORT_DIR = "desc" as const;

// ─── draft filter form state (before submit) ─────────────────────────────────

interface DraftFilter {
  refNo: string;
  receiverName: string;
  status: PayOrderStatus[];
  channel: ChannelCode | "";
  includeDeleted: boolean;
}

const INITIAL_DRAFT: DraftFilter = {
  refNo: "",
  receiverName: "",
  status: [],
  channel: "",
  includeDeleted: false,
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function draftToListParams(
  draft: DraftFilter,
  page: number,
  size: number,
  sortKey: string,
  sortDir: "asc" | "desc",
): ListParams {
  return {
    ...(draft.refNo ? { refNo: draft.refNo } : {}),
    ...(draft.receiverName ? { receiverName: draft.receiverName } : {}),
    ...(draft.status.length > 0 ? { status: draft.status } : {}),
    ...(draft.channel ? { channel: [draft.channel] } : {}),
    ...(draft.includeDeleted ? { includeDeleted: true } : {}),
    page,
    size,
    sort: `${sortKey},${sortDir}`,
  };
}

// ─── sub-components ──────────────────────────────────────────────────────────

interface StatusCheckboxGroupProps {
  selected: PayOrderStatus[];
  onChange: (next: PayOrderStatus[]) => void;
}

function StatusCheckboxGroup({ selected, onChange }: StatusCheckboxGroupProps) {
  function toggle(value: PayOrderStatus) {
    onChange(
      selected.includes(value)
        ? selected.filter((s) => s !== value)
        : [...selected, value],
    );
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
      {STATUS_OPTIONS.map((opt) => (
        <label
          key={opt.value}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            color: "#333",
            cursor: "pointer",
            fontWeight: 400,
          }}
        >
          <input
            type="checkbox"
            checked={selected.includes(opt.value)}
            onChange={() => toggle(opt.value)}
            style={{ width: "14px", height: "14px", accentColor: "#0b5394" }}
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  height: "32px",
  padding: "4px 8px",
  fontSize: "13px",
  border: "1px solid #d7dbe0",
  borderRadius: "4px",
  background: "#fff",
  color: "#1f2328",
  width: "100%",
  boxSizing: "border-box",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 500,
  color: "#333",
  marginBottom: "4px",
  display: "block",
};

// ─── main page ───────────────────────────────────────────────────────────────

export default function PayOutManualListPage() {
  const navigate = useNavigate();
  const { isMaker, isApprover, isViewer } = useAuth();

  // draft filter — only committed on "Tìm kiếm"
  const [draft, setDraft] = useState<DraftFilter>(INITIAL_DRAFT);

  // committed query params
  const [committedParams, setCommittedParams] = useState<ListParams>(
    draftToListParams(
      INITIAL_DRAFT,
      0,
      DEFAULT_PAGE_SIZE,
      DEFAULT_SORT_KEY,
      DEFAULT_SORT_DIR,
    ),
  );

  // pagination & sort (derived from committedParams, kept as own state for DataTable callbacks)
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [sortKey, setSortKey] = useState<string>(DEFAULT_SORT_KEY);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(DEFAULT_SORT_DIR);

  const [exportOpen, setExportOpen] = useState(false);

  // hover states for buttons
  const [searchHover, setSearchHover] = useState(false);
  const [clearHover, setClearHover] = useState(false);
  const [createHover, setCreateHover] = useState(false);
  const [exportHover, setExportHover] = useState(false);

  // ─── query ─────────────────────────────────────────────────────────────

  const { data, isLoading, isError } = usePayOrderList(committedParams);

  const rows: PayOrderSummary[] = data?.content ?? [];
  const totalElements = data?.totalElements ?? 0;

  // ─── handlers ──────────────────────────────────────────────────────────

  function buildParams(
    overrides: Partial<{
      page: number;
      size: number;
      sortKey: string;
      sortDir: "asc" | "desc";
    }>,
  ): ListParams {
    return draftToListParams(
      draft,
      overrides.page ?? page,
      overrides.size ?? size,
      overrides.sortKey ?? sortKey,
      overrides.sortDir ?? sortDir,
    );
  }

  function handleSearch() {
    const nextPage = 0;
    setPage(nextPage);
    setCommittedParams(buildParams({ page: nextPage }));
  }

  function handleClearFilter() {
    setDraft(INITIAL_DRAFT);
    const nextPage = 0;
    setPage(nextPage);
    setSortKey(DEFAULT_SORT_KEY);
    setSortDir(DEFAULT_SORT_DIR);
    setCommittedParams(
      draftToListParams(
        INITIAL_DRAFT,
        nextPage,
        size,
        DEFAULT_SORT_KEY,
        DEFAULT_SORT_DIR,
      ),
    );
  }

  function handlePageChange(nextPage: number) {
    setPage(nextPage);
    setCommittedParams(buildParams({ page: nextPage }));
  }

  function handleSizeChange(nextSize: number) {
    setSize(nextSize);
    const nextPage = 0;
    setPage(nextPage);
    setCommittedParams(buildParams({ size: nextSize, page: nextPage }));
  }

  function handleSortChange(key: string, dir: "asc" | "desc") {
    setSortKey(key);
    setSortDir(dir);
    setCommittedParams(buildParams({ sortKey: key, sortDir: dir }));
  }

  // ─── columns ───────────────────────────────────────────────────────────

  const columns = [
    {
      key: "refNo",
      header: "Số hiệu",
      sortable: true,
      render: (row: PayOrderSummary) => (
        <Link
          to={`/pay-out-manual/${row.id}`}
          style={{ color: "#0b5394", fontWeight: 500, textDecoration: "none" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.textDecoration = "underline")
          }
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
        >
          {row.refNo}
        </Link>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (row: PayOrderSummary) => <StatusBadge status={row.status} />,
    },
    {
      key: "channel",
      header: "Kênh",
    },
    {
      key: "paymentDate",
      header: "Ngày TT",
      sortable: true,
      render: (row: PayOrderSummary) => formatDate(row.paymentDate),
    },
    {
      key: "amount",
      header: "Số tiền",
      sortable: true,
      className: "text-right",
      render: (row: PayOrderSummary) => (
        <span style={{ fontFamily: "'Consolas', 'Menlo', monospace" }}>
          {formatCurrency(row.amount, row.currencyCode)}
        </span>
      ),
    },
    {
      key: "receiverName",
      header: "Người nhận",
    },
    {
      key: "createdBy",
      header: "Người tạo",
    },
    {
      key: "createdAt",
      header: "Ngày tạo",
      sortable: true,
      render: (row: PayOrderSummary) => formatDate(row.createdAt),
    },
    {
      key: "actions",
      header: "",
      className: "w-20",
      render: (row: PayOrderSummary) => (
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <button
            type="button"
            title="Xem chi tiết"
            aria-label={`Xem chi tiết lệnh ${row.refNo}`}
            onClick={() => navigate(`/pay-out-manual/${row.id}`)}
            style={{
              width: "26px",
              height: "26px",
              borderRadius: "4px",
              border: "1px solid #d7dbe0",
              background: "#fff",
              color: "#5f6368",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all .15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#e7f0f9";
              e.currentTarget.style.color = "#0b5394";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.color = "#5f6368";
            }}
          >
            <Eye aria-hidden="true" style={{ width: "14px", height: "14px" }} />
          </button>
          {isMaker && row.status === "DRAFT" && (
            <button
              type="button"
              title="Chỉnh sửa"
              aria-label={`Chỉnh sửa lệnh ${row.refNo}`}
              onClick={() => navigate(`/pay-out-manual/${row.id}/edit`)}
              style={{
                width: "26px",
                height: "26px",
                borderRadius: "4px",
                border: "1px solid #d7dbe0",
                background: "#fff",
                color: "#5f6368",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all .15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#e7f0f9";
                e.currentTarget.style.color = "#0b5394";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.color = "#5f6368";
              }}
            >
              <Pencil
                aria-hidden="true"
                style={{ width: "14px", height: "14px" }}
              />
            </button>
          )}
        </div>
      ),
    },
  ];

  // ─── render ────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        padding: "16px 20px 40px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      {/* ── Card 1: Bộ lọc tìm kiếm ── */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #d7dbe0",
          borderRadius: "6px",
          boxShadow: "0 1px 2px rgba(15,20,25,.04)",
        }}
      >
        {/* card-header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 14px",
            borderBottom: "1px solid #d7dbe0",
            background: "#eef3f9",
            borderRadius: "6px 6px 0 0",
          }}
        >
          <h2
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "#073763",
              textTransform: "uppercase",
              letterSpacing: ".3px",
              margin: 0,
            }}
          >
            Bộ lọc tìm kiếm
          </h2>
          <span style={{ fontSize: "11px", color: "#5f6368", fontWeight: 500 }}>
            TT_LTT.1
          </span>
        </div>

        {/* card-body */}
        <div style={{ padding: "14px" }}>
          {/* filter fields grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "12px 18px",
            }}
          >
            {/* refNo */}
            <div>
              <label htmlFor="filter-refNo" style={labelStyle}>
                Số hiệu
              </label>
              <input
                id="filter-refNo"
                type="text"
                placeholder="Nhập số hiệu…"
                value={draft.refNo}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, refNo: e.target.value }))
                }
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#0b5394";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 2px rgba(11,83,148,.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#d7dbe0";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* receiverName */}
            <div>
              <label htmlFor="filter-receiverName" style={labelStyle}>
                Người nhận
              </label>
              <input
                id="filter-receiverName"
                type="text"
                placeholder="Nhập tên người nhận…"
                value={draft.receiverName}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    receiverName: e.target.value,
                  }))
                }
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#0b5394";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 2px rgba(11,83,148,.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#d7dbe0";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* channel */}
            <div>
              <label htmlFor="filter-channel" style={labelStyle}>
                Kênh
              </label>
              <select
                id="filter-channel"
                value={draft.channel}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    channel: e.target.value as ChannelCode | "",
                  }))
                }
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#0b5394";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 2px rgba(11,83,148,.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#d7dbe0";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {CHANNEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* includeDeleted — only for VIEWER or APPROVER */}
            {(isViewer || isApprover) && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  paddingBottom: "2px",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                    color: "#333",
                    cursor: "pointer",
                    fontWeight: 400,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={draft.includeDeleted}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        includeDeleted: e.target.checked,
                      }))
                    }
                    style={{
                      width: "14px",
                      height: "14px",
                      accentColor: "#0b5394",
                    }}
                  />
                  Bao gồm đã xóa
                </label>
              </div>
            )}
          </div>

          {/* status multi-checkbox — spans full row */}
          <div style={{ marginTop: "12px" }}>
            <span
              style={{ ...labelStyle, display: "block", marginBottom: "6px" }}
            >
              Trạng thái
            </span>
            <StatusCheckboxGroup
              selected={draft.status}
              onChange={(next) =>
                setDraft((prev) => ({ ...prev, status: next }))
              }
            />
          </div>
        </div>

        {/* toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 14px",
            borderTop: "1px solid #d7dbe0",
            background: "#fafcfe",
            borderRadius: "0 0 6px 6px",
          }}
        >
          <button
            type="button"
            onClick={handleSearch}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              height: "32px",
              padding: "0 14px",
              borderRadius: "4px",
              border: "1px solid #0b5394",
              background: searchHover ? "#073763" : "#0b5394",
              color: "#fff",
              fontSize: "12.5px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "background .15s",
            }}
            onMouseEnter={() => setSearchHover(true)}
            onMouseLeave={() => setSearchHover(false)}
          >
            <Search
              aria-hidden="true"
              style={{ width: "14px", height: "14px" }}
            />
            Tìm kiếm
          </button>
          <button
            type="button"
            onClick={handleClearFilter}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              height: "32px",
              padding: "0 14px",
              borderRadius: "4px",
              border: "1px solid #d7dbe0",
              background: clearHover ? "#f3f5f8" : "#fff",
              color: "#333",
              fontSize: "12.5px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "background .15s",
            }}
            onMouseEnter={() => setClearHover(true)}
            onMouseLeave={() => setClearHover(false)}
          >
            <XCircle
              aria-hidden="true"
              style={{ width: "14px", height: "14px" }}
            />
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* ── Inline error ── */}
      {isError && (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            borderRadius: "4px",
            border: "1px solid #e7c2c2",
            background: "#fdecec",
            padding: "8px 14px",
            fontSize: "13px",
            color: "#cc0000",
            borderLeft: "3px solid #cc0000",
          }}
        >
          Tải dữ liệu thất bại. Vui lòng thử lại.
        </div>
      )}

      {/* ── Card 2: Danh sách dữ liệu ── */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #d7dbe0",
          borderRadius: "6px",
          boxShadow: "0 1px 2px rgba(15,20,25,.04)",
        }}
      >
        {/* card-header with action buttons */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 14px",
            borderBottom: "1px solid #d7dbe0",
            background: "#eef3f9",
            borderRadius: "6px 6px 0 0",
          }}
        >
          <h2
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "#073763",
              textTransform: "uppercase",
              letterSpacing: ".3px",
              margin: 0,
            }}
          >
            Danh sách lệnh thanh toán
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{ fontSize: "11px", color: "#5f6368", fontWeight: 500 }}
            >
              TT_LTT.2
            </span>
            {isMaker && (
              <button
                type="button"
                onClick={() => navigate("/pay-out-manual/new")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  height: "32px",
                  padding: "0 14px",
                  borderRadius: "4px",
                  border: "1px solid #137333",
                  background: createHover ? "#0f5c2b" : "#137333",
                  color: "#fff",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background .15s",
                }}
                onMouseEnter={() => setCreateHover(true)}
                onMouseLeave={() => setCreateHover(false)}
              >
                <PlusCircle
                  aria-hidden="true"
                  style={{ width: "14px", height: "14px" }}
                />
                Tạo mới
              </button>
            )}
            <button
              type="button"
              onClick={() => setExportOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                height: "32px",
                padding: "0 14px",
                borderRadius: "4px",
                border: "1px solid #c6d6e6",
                background: exportHover ? "#e7f0f9" : "#fff",
                color: "#0b5394",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "background .15s",
              }}
              onMouseEnter={() => setExportHover(true)}
              onMouseLeave={() => setExportHover(false)}
            >
              <Download
                aria-hidden="true"
                style={{ width: "14px", height: "14px" }}
              />
              Xuất dữ liệu
            </button>
          </div>
        </div>

        {/* DataTable — no extra padding, table fills card */}
        <DataTable<PayOrderSummary & Record<string, unknown>>
          columns={columns}
          data={rows as (PayOrderSummary & Record<string, unknown>)[]}
          totalElements={totalElements}
          page={page}
          size={size}
          onPageChange={handlePageChange}
          onSizeChange={handleSizeChange}
          onSortChange={handleSortChange}
          sortKey={sortKey}
          sortDir={sortDir}
          isLoading={isLoading}
          emptyMessage="Không tìm thấy lệnh thanh toán nào."
        />
      </div>

      {/* ── Export dialog ── */}
      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        currentFilter={committedParams}
      />
    </div>
  );
}
