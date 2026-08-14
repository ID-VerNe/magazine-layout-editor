import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center p-8 bg-red-50/80 border border-red-200 rounded-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 shadow-sm">
            <AlertTriangle size={24} aria-hidden="true" />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="text-sm font-bold text-red-900 uppercase tracking-wider">
              {this.props.fallbackTitle || 'Render Error Occurred'}
            </h3>
            <p className="text-xs text-red-600 leading-relaxed font-mono break-all">
              {this.state.error?.message || 'Unknown render exception'}
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <RefreshCw size={14} aria-hidden="true" /> Retry Render
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
