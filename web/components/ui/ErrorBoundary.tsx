"use client";

import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// ─────────────────────────────────────────────────────────────
// Global Error Boundary
// Catches any runtime error in the component tree and shows
// a friendly UI instead of a blank/crashed page.
// ─────────────────────────────────────────────────────────────

export default class ErrorBoundary extends React.Component<
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

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console in dev — replace with Sentry/Datadog in production
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
              <AlertTriangle size={32} className="text-red-500" />
            </div>

            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Something went wrong
              </h1>
              <p className="text-gray-500 text-sm mt-2">
                An unexpected error occurred. Please reload the page or go back home.
              </p>
              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mt-4 text-left bg-red-50 border border-red-200 rounded-xl p-3">
                  <summary className="text-xs font-mono text-red-700 cursor-pointer">
                    Error details (dev only)
                  </summary>
                  <pre className="text-xs text-red-600 mt-2 overflow-auto whitespace-pre-wrap">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
              >
                <RefreshCw size={15} />
                Reload page
              </button>
              <a
                href="/"
                className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
              >
                <Home size={15} />
                Go home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
