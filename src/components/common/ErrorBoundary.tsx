import React, { FC, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary that catches rendering errors and shows a fallback UI.
 */
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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
            <i className="pi pi-exclamation-triangle text-4xl text-red-500" />
            <h2 className="text-xl font-bold text-gray-700">
              Something went wrong
            </h2>
            <p className="text-gray-500">
              {this.state.error?.message ?? 'An unexpected error occurred.'}
            </p>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Try Again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

/**
 * Functional wrapper for pages/sections that should catch errors gracefully.
 */
export const ErrorFallback: FC<{ message?: string }> = ({
  message = 'Something went wrong.',
}) => (
  <div className="flex flex-col items-center justify-center p-8 gap-3">
    <i className="pi pi-exclamation-triangle text-3xl text-red-500" />
    <p className="text-gray-600">{message}</p>
  </div>
);
