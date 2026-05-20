import { cn } from "../lib/utils";

interface DatePickerFieldProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  min?: string;
  max?: string;
  required?: boolean;
}

export function DatePickerField({
  value,
  onChange,
  placeholder,
  disabled = false,
  className,
  min,
  max,
  required = false,
}: DatePickerFieldProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    onChange(val || undefined);
  }

  return (
    <input
      type="date"
      value={value ?? ""}
      onChange={handleChange}
      disabled={disabled}
      required={required}
      min={min}
      max={max}
      placeholder={placeholder}
      lang="vi"
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "[&::-webkit-calendar-picker-indicator]:cursor-pointer",
        "[&::-webkit-date-and-time-value]:text-left",
        className,
      )}
    />
  );
}
