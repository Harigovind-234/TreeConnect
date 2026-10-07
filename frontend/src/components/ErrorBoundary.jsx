import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#060c08] text-white flex items-center justify-center p-6">
          <div className="max-w-xl w-full bg-[#0b1c12] border border-red-500/30 rounded-3xl p-8 shadow-2xl flex flex-col gap-5 text-center items-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <AlertTriangle size={32} />
            </div>
            
            <div>
              <h2 className="text-xl font-black text-white">Something went wrong</h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                An unexpected error occurred while rendering this page. You can reload the page or return to the home screen.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="w-full p-3 rounded-xl bg-black/60 border border-red-500/30 text-left font-mono text-xs text-red-300 overflow-x-auto">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <RefreshCw size={14} /> Reload Page
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer border border-slate-700"
              >
                <Home size={14} /> Return Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
