import { useState, useEffect, useRef, useCallback } from "react";
import { payOutManualClient } from "../api/pay-out-manual-client";
import type { LookupEntry, PageResponse } from "../types/pay-out-manual";

// ---------------------------------------------------------------------------
// Lookup types
// ---------------------------------------------------------------------------

export type LookupType = "BANK" | "USER" | "DVQHNS" | "CURRENCY" | "COA";

const LOOKUP_TITLES: Record<LookupType, string> = {
  BANK: "Tra cúu Ngân hàng",
  USER: "Tra cúu Nguời dùng",
  DVQHNS: "Tra cúu ĐVQHNS",
  CURRENCY: "Tra cúu Ngoại tệ",
  COA: "Tra cúu COA",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LookupPopupProps {
  open: boolean;
  type: LookupType;
  /** Optional parent code to filter hierarchical lookups */
  parentCode?: string;
  onSelect: (entry: LookupEntry) => void;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LookupPopup({
  open,
  type,
  parentCode,
  onSelect,
  onClose,
}: LookupPopupProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LookupEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setPage(0);
      setTotalPages(0);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [open]);

  // Esc handler
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Debounced search
  const doSearch = useCallback(
    async (q: string, p: number) => {
      setLoading(true);
      try {
        const data: PageResponse<LookupEntry> = await payOutManualClient.lookup(
          type,
          q || undefined,
          parentCode,
          p,
          20,
        );
        setResults(data.CONTENT);
        setTotalPages(data.PAGE.TOTAL_PAGES);
      } catch (err) {
        console.error("Lookup failed:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [type, parentCode],
  );

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      setPage(0);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        doSearch(value, 0);
      }, 300);
    },
    [doSearch],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (debounceRef.current) clearTimeout(debounceRef.current);
        doSearch(query, page);
      }
    },
    [doSearch, query, page],
  );

  const handleSelect = useCallback(
    (entry: LookupEntry) => {
      onSelect(entry);
      onClose();
    },
    [onSelect, onClose],
  );

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === overlayRef.current) onClose();
    },
    [onClose],
  );

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-5"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lookup-popup-title"
    >
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
        {/* Header */}
        <div className="flex items-center justify-between rounded-t-lg bg-gradient-to-r from-[#073763] to-[#0b5394] px-[18px] py-3">
          <h3
            id="lookup-popup-title"
            className="text-[14px] font-bold text-white"
          >
            {LOOKUP_TITLES[type]}
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

        {/* Search bar */}
        <div className="border-b border-[#d7dbe0] p-3">
          <div className="flex gap-2">
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-8 flex-1 rounded border border-[#d7dbe0] px-2 text-[13px] focus:border-[#0b5394] focus:outline-none focus:ring-2 focus:ring-[rgba(11,83,148,0.15)]"
              placeholder="Nhập từ khóa tìm kiếm…"
            />
            <button
              type="button"
              onClick={() => doSearch(query, 0)}
              className="flex h-8 items-center gap-1 rounded bg-[#0b5394] px-3 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#073763]"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              Tìm kiếm
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-auto p-3">
          {loading && results.length === 0 ? (
            <div className="py-8 text-center text-[12px] italic text-[#5f6368]">
              Đang tìm kiếm…
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-[12px] italic text-[#5f6368]">
              Không tìm thấy kết quả. Nhập từ khóa để tìm kiếm.
            </div>
          ) : (
            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr className="border-b-2 border-[#c9d6e3] bg-[#eef3f9]">
                  <th className="px-2.5 py-2 text-left text-[12px] font-bold uppercase text-[#073763]">
                    Mã
                  </th>
                  <th className="px-2.5 py-2 text-left text-[12px] font-bold uppercase text-[#073763]">
                    Tên
                  </th>
                  <th className="w-[70px] px-2.5 py-2 text-center text-[12px] font-bold uppercase text-[#073763]">
                    Chọn
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((entry, idx) => (
                  <tr
                    key={entry.CODE}
                    className={`cursor-pointer border-b border-[#d7dbe0] ${
                      idx % 2 === 1 ? "bg-[#fafcfe]" : ""
                    } hover:bg-[#eef5fd]`}
                    onClick={() => handleSelect(entry)}
                  >
                    <td className="px-2.5 py-2 font-medium text-[#333]">
                      {entry.CODE}
                    </td>
                    <td className="px-2.5 py-2 text-[#5f6368]">{entry.NAME}</td>
                    <td className="px-2.5 py-2 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(entry);
                        }}
                        className="rounded bg-[#e7f0f9] px-2 py-1 text-[11px] font-semibold text-[#0b5394] transition-colors hover:bg-[#0b5394] hover:text-white"
                      >
                        Chọn
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#d7dbe0] bg-[#fafcfe] px-3 py-2">
            <span className="text-[11px] text-[#5f6368]">
              Trang {page + 1}/{totalPages}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={page <= 0}
                onClick={() => {
                  const p = page - 1;
                  setPage(p);
                  doSearch(query, p);
                }}
                className="h-7 rounded border border-[#d7dbe0] bg-white px-2 text-[11px] disabled:cursor-not-allowed disabled:opacity-55"
              >
                &laquo;
              </button>
              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => {
                  const p = page + 1;
                  setPage(p);
                  doSearch(query, p);
                }}
                className="h-7 rounded border border-[#d7dbe0] bg-white px-2 text-[11px] disabled:cursor-not-allowed disabled:opacity-55"
              >
                &raquo;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LookupPopup;
