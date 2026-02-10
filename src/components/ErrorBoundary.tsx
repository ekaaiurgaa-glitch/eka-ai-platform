import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('EKA-AI Error Boundary caught error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState(prev => ({
      hasError: false,
      error: null,
      retryCount: prev.retryCount + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isAIFailure = this.state.error?.message?.toLowerCase().includes('ai') ||
                         this.state.error?.message?.toLowerCase().includes('gemini') ||
                         this.state.error?.message?.toLowerCase().includes('api');

      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
          <div className="max-w-md w-full border border-black rounded p-8 text-center">
            <h1 className="text-2xl font-bold text-black mb-4">Something went wrong</h1>
            <p className="text-black mb-6">We're sorry for the inconvenience. Please refresh the page.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={this.handleRetry} className="btn-primary">Retry</button>
              <button onClick={() => window.location.reload()} className="bg-white text-black border border-black px-6 py-3 rounded hover:bg-black hover:text-white transition-colors">Reload</button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
