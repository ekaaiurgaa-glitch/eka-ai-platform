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
        <div className="bg-[#050505] border-4 border-red-500/50 rounded-xl p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Error Icon */}
            <div className="w-20 h-20 rounded-2xl bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
            </div>

            {/* Error Title */}
            <div>
              <h3 className="text-[16px] font-black text-red-500 uppercase tracking-wider font-mono mb-2">
                {isAIFailure ? 'Governance Failure' : 'System Error'}
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono max-w-md">
                {isAIFailure 
                  ? 'EKA-AI intelligence engine encountered an error. Switching to fallback mode.'
                  : 'An unexpected error occurred in the application.'
                }
              </p>
            </div>

            {/* Error Details (collapsed by default) */}
            <details className="w-full max-w-md">
              <summary className="text-[9px] text-zinc-600 font-mono cursor-pointer hover:text-zinc-400">
                Technical Details
              </summary>
              <div className="mt-2 p-3 bg-black rounded-lg border border-zinc-900 text-left overflow-auto max-h-32">
                <code className="text-[9px] text-red-400 font-mono break-all">
                  {this.state.error?.message || 'Unknown error'}
                </code>
              </div>
            </details>

            {/* Retry Count Warning */}
            {this.state.retryCount >= 2 && (
              <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-[9px] text-yellow-500 font-mono">
                  Multiple retry attempts. Consider switching to THINKING mode for more stable responses.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={this.handleRetry}
                className="px-6 py-3 bg-[#f18a22] text-black rounded-xl text-[11px] font-black uppercase tracking-wider font-mono hover:bg-white transition-colors"
              >
                Retry
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-zinc-800 text-zinc-400 rounded-xl text-[11px] font-bold uppercase tracking-wider font-mono hover:bg-zinc-700 transition-colors"
              >
                Reload Page
              </button>
            </div>

            {/* Status Footer */}
            <div className="flex items-center gap-2 text-[8px] text-zinc-700 font-mono">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span>Error ID: ERR-{Date.now().toString(36).toUpperCase()}</span>
              <span className="text-zinc-800">|</span>
              <span>Retry #{this.state.retryCount}</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
