import { useState } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "../lib/utils";

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  totalElements: number;
  page: number;
  size: number;
  onPageChange: (page: number) => void;
  onSizeChange?: (size: number) => void;
  onSortChange?: (key: string, dir: "asc" | "desc") => void;
  sortKey?: string;
  sortDir?: "asc" | "desc";
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

const PAGE_SIZES = [10, 20, 50];

// ── Skeleton row ────────────────────────────────────────────────────────────
function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td
          key={i}
          style={{ padding: "8px 10px", borderBottom: "1px solid #d7dbe0" }}
        >
          <div
            style={{
              height: "14px",
              borderRadius: "4px",
              background: "#e9ecef",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        </td>
      ))}
    </tr>
  );
}

// ── Sort icon ────────────────────────────────────────────────────────────────
function SortIcon({
  columnKey,
  sortKey,
  sortDir,
}: {
  columnKey: string;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}) {
  if (sortKey !== columnKey) {
    return (
      <ChevronsUpDown
        style={{
          marginLeft: "4px",
          display: "inline",
          height: "14px",
          width: "14px",
          opacity: 0.45,
          verticalAlign: "middle",
        }}
      />
    );
  }
  if (sortDir === "asc") {
    return (
      <ChevronUp
        style={{
          marginLeft: "4px",
          display: "inline",
          height: "14px",
          width: "14px",
          verticalAlign: "middle",
        }}
      />
    );
  }
  return (
    <ChevronDown
      style={{
        marginLeft: "4px",
        display: "inline",
        height: "14px",
        width: "14px",
        verticalAlign: "middle",
      }}
    />
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  totalElements,
  page,
  size,
  onPageChange,
  onSizeChange,
  onSortChange,
  sortKey,
  sortDir,
  isLoading = false,
  emptyMessage = "Không có dữ liệu",
  className,
}: DataTableProps<T>) {
  const totalPages = Math.max(1, Math.ceil(totalElements / size));

  // hover state tracked per-row index
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  function handleHeaderClick(col: Column<T>) {
    if (!col.sortable || !onSortChange) return;
    if (sortKey !== col.key) {
      onSortChange(col.key, "asc");
    } else if (sortDir === "asc") {
      onSortChange(col.key, "desc");
    } else {
      onSortChange(col.key, "asc");
    }
  }

  const startRecord = totalElements === 0 ? 0 : page * size + 1;
  const endRecord = Math.min((page + 1) * size, totalElements);

  return (
    <div
      className={cn(className)}
      style={{ display: "flex", flexDirection: "column", gap: "12px" }}
    >
      {/* table-wrap */}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "12.5px",
          }}
        >
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleHeaderClick(col)}
                  className={col.className}
                  style={{
                    padding: "8px 10px",
                    background: "#eef3f9",
                    color: "#073763",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: ".3px",
                    borderBottom: "2px solid #c9d6e3",
                    textAlign: "left",
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                    whiteSpace: "nowrap",
                    cursor:
                      col.sortable && onSortChange ? "pointer" : "default",
                    userSelect:
                      col.sortable && onSortChange ? "none" : undefined,
                  }}
                >
                  {col.header}
                  {col.sortable && onSortChange && (
                    <SortIcon
                      columnKey={col.key}
                      sortKey={sortKey}
                      sortDir={sortDir}
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <>
                <SkeletonRow cols={columns.length} />
                <SkeletonRow cols={columns.length} />
                <SkeletonRow cols={columns.length} />
              </>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    padding: "30px 10px",
                    textAlign: "center",
                    color: "#5f6368",
                    fontStyle: "italic",
                    borderBottom: "1px solid #d7dbe0",
                  }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => {
                const isEven = rowIdx % 2 === 1; // 0-based: odd index = even row visually
                const isHovered = hoveredRow === rowIdx;

                let rowBg = "#ffffff";
                if (isHovered) {
                  rowBg = "#eef5fd";
                } else if (isEven) {
                  rowBg = "#fafcfe";
                }

                return (
                  <tr
                    key={rowIdx}
                    style={{
                      background: rowBg,
                      transition: "background 120ms",
                    }}
                    onMouseEnter={() => setHoveredRow(rowIdx)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={col.className}
                        style={{
                          padding: "8px 10px",
                          borderBottom: "1px solid #d7dbe0",
                          verticalAlign: "middle",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {col.render
                          ? col.render(row)
                          : (row[col.key] as React.ReactNode)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          background: "#fafcfe",
          borderTop: "1px solid #d7dbe0",
          padding: "10px 14px",
          fontSize: "12.5px",
          color: "#5f6368",
        }}
      >
        {/* Page-size selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span>Hiển thị:</span>
          <select
            value={size}
            onChange={(e) => onSizeChange?.(Number(e.target.value))}
            disabled={!onSizeChange}
            style={{
              border: "1px solid #d7dbe0",
              borderRadius: "4px",
              background: "#ffffff",
              padding: "2px 6px",
              fontSize: "12.5px",
              color: "#073763",
              cursor: onSizeChange ? "pointer" : "not-allowed",
              opacity: onSizeChange ? 1 : 0.5,
            }}
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <span>bản ghi / trang</span>
        </div>

        {/* Page navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>
            Trang {totalElements === 0 ? 0 : page + 1} / {totalPages} (
            {startRecord}
            {totalElements > 0 && startRecord !== endRecord
              ? `–${endRecord}`
              : ""}{" "}
            / {totalElements} bản ghi)
          </span>

          <PaginationButton
            label="Trước"
            disabled={page === 0 || isLoading}
            onClick={() => onPageChange(page - 1)}
          />
          <PaginationButton
            label="Sau"
            disabled={page >= totalPages - 1 || isLoading}
            onClick={() => onPageChange(page + 1)}
          />
        </div>
      </div>
    </div>
  );
}

// ── Pagination button (extracted to manage its own hover state) ──────────────
function PaginationButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const bg = disabled ? "#f3f4f6" : hovered ? "#0b5394" : "#ffffff";
  const color = disabled ? "#9ca3af" : hovered ? "#ffffff" : "#073763";
  const borderColor = disabled ? "#d7dbe0" : hovered ? "#0b5394" : "#d7dbe0";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `1px solid ${borderColor}`,
        borderRadius: "4px",
        background: bg,
        color,
        padding: "3px 12px",
        fontSize: "12.5px",
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 120ms, color 120ms, border-color 120ms",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {label}
    </button>
  );
}
