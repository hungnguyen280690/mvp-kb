import React from "react";
import { AlertTriangle } from "lucide-react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  override render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback != null) {
      return this.props.fallback;
    }

    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
        <AlertTriangle className="h-8 w-8" aria-hidden="true" />
        <p className="text-sm font-semibold">Đã xảy ra lỗi</p>
        {this.state.error?.message && (
          <p className="text-xs text-red-500">{this.state.error.message}</p>
        )}
      </div>
    );
  }
}
