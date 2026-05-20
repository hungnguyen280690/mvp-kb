import { useState, useRef } from "react";
import { cn } from "../lib/utils";

interface MoneyInputProps {
  value?: number;
  onChange: (value: number | undefined) => void;
  currency?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  min?: number;
  max?: number;
}

function formatThousands(num: number): string {
  return new Intl.NumberFormat("vi-VN").format(num);
}

function parseRaw(str: string): number | undefined {
  const digits = str.replace(/\D/g, "");
  if (!digits) return undefined;
  const parsed = parseInt(digits, 10);
  return isNaN(parsed) ? undefined : parsed;
}

export function MoneyInput({
  value,
  onChange,
  currency = "VND",
  placeholder = "0",
  disabled = false,
  className,
  min = 0,
  max,
}: MoneyInputProps) {
  const [focused, setFocused] = useState(false);
  const [rawText, setRawText] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const displayValue = focused
    ? rawText
    : value !== undefined
      ? formatThousands(value)
      : "";

  function handleFocus() {
    setFocused(true);
    setRawText(value !== undefined ? String(value) : "");
  }

  function handleBlur() {
    setFocused(false);
    const parsed = parseRaw(rawText);
    if (parsed === undefined) {
      onChange(undefined);
      return;
    }
    const clamped =
      max !== undefined
        ? Math.min(max, Math.max(min, parsed))
        : Math.max(min, parsed);
    onChange(clamped);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "");
    setRawText(digits);
    const parsed = parseRaw(digits);
    if (parsed === undefined) {
      onChange(undefined);
      return;
    }
    const clamped =
      max !== undefined
        ? Math.min(max, Math.max(min, parsed))
        : Math.max(min, parsed);
    onChange(clamped);
  }

  return (
    <div className="relative flex items-center">
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={displayValue}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 pr-12 text-right text-sm shadow-sm transition-colors",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      />
      <span className="pointer-events-none absolute right-3 text-xs text-muted-foreground">
        {currency}
      </span>
    </div>
  );
}
