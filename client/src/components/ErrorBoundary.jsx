import React from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Error Boundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="card max-w-md w-full text-center p-8 border-accent ring-1 ring-accent">
            <div className="mx-auto w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-6 text-accent">
              <AlertTriangle size={32} />
            </div>
            <h1 className="font-heading font-bold text-2xl text-text-dark mb-4">Something went wrong</h1>
            <p className="text-text-muted mb-6 text-sm">
              We've encountered an unexpected error.
            </p>
            {this.state.error && (
              <div className="bg-highlight/30 rounded-xl p-4 mb-6 text-left overflow-auto max-h-48 text-xs font-mono text-text-dark">
                <p className="font-bold text-accent mb-2">{this.state.error.toString()}</p>
                <p className="text-text-muted">{this.state.errorInfo?.componentStack}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => window.location.href = '/'} className="btn-secondary flex-1 flex items-center justify-center gap-2">
                <Home size={16} /> Home
              </button>
              <button onClick={() => window.location.reload()} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <RefreshCw size={16} /> Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
