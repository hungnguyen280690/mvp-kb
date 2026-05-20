import { useState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Search, X, ChevronDown, Check } from "lucide-react";
import { cn } from "../lib/utils";
import type { LookupItem } from "../types/pay-order";
import { useLookup } from "../api/hooks";

interface LovSelectProps {
  type: string;
  value?: string;
  onChange: (code: string, item: LookupItem) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
}

function useDebounce(val: string, ms: number) {
  const [debounced, setDebounced] = useState(val);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(val), ms);
    return () => clearTimeout(t);
  }, [val, ms]);
  return debounced;
}

function ResultSkeleton() {
  return (
    <div className="space-y-2 px-3 py-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

export function LovSelect({
  type,
  value,
  onChange,
  placeholder = "-- Chọn --",
  disabled = false,
  className,
  label,
}: LovSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const searchRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useLookup(type, debouncedSearch || undefined);

  const items: LookupItem[] = data?.content ?? [];

  const selectedItem = value
    ? (items.find((i) => i.code === value) ?? null)
    : null;

  const displayText =
    label ??
    (selectedItem ? `${selectedItem.code} - ${selectedItem.name}` : undefined);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setSearch("");
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }

  function handleSelect(item: LookupItem) {
    onChange(item.code, item);
    setOpen(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !displayText && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{displayText ?? placeholder}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background shadow-lg focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <Dialog.Title className="text-sm font-semibold">
              Chọn danh mục
            </Dialog.Title>
            <Dialog.Close className="rounded-md p-1 opacity-70 hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-ring">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="border-b px-3 py-2">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm..."
                className={cn(
                  "h-8 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm",
                  "focus:outline-none focus:ring-1 focus:ring-ring",
                )}
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {isLoading ? (
              <ResultSkeleton />
            ) : items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                Không tìm thấy kết quả
              </p>
            ) : (
              <ul>
                {items.map((item) => (
                  <li key={item.code}>
                    <button
                      type="button"
                      onClick={() => handleSelect(item)}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted/60",
                        item.code === value && "bg-muted",
                      )}
                    >
                      <span className="w-20 shrink-0 font-mono text-xs text-muted-foreground">
                        {item.code}
                      </span>
                      <span className="flex-1 truncate">{item.name}</span>
                      {item.code === value && (
                        <Check className="h-4 w-4 shrink-0 text-primary" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t px-4 py-2 text-xs text-muted-foreground">
            {data?.totalElements !== undefined
              ? `${data.totalElements} bản ghi`
              : ""}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
