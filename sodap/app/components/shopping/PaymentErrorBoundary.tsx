import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class PaymentErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Payment error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-red-800 font-medium mb-2">Payment Error</h3>
          <p className="text-red-600 text-sm mb-3">
            {this.state.error?.message || "An error occurred during payment"}
          </p>
          <button
            className="text-sm text-red-700 hover:text-red-800"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
