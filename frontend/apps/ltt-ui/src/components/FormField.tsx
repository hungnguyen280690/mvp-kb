import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "../lib/utils";

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  hint?: string;
}

export function FormField({
  label,
  error,
  required,
  children,
  className,
  hint,
}: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <LabelPrimitive.Root className="text-sm font-medium text-gray-700">
        {label}
        {required && (
          <span className="ml-0.5 text-red-500" aria-hidden="true">
            *
          </span>
        )}
      </LabelPrimitive.Root>
      {children}
      {error ? (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-gray-500">{hint}</p>
      ) : null}
    </div>
  );
}
