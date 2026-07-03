import { Component, ErrorInfo, ReactNode } from "react";
import { AlertOctagon, RotateCcw } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in boundary:", error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-3 bg-red-50 text-red-600 rounded-full mb-4">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-500 max-w-md mb-6">
            An unexpected error occurred: {this.state.error?.message || "Unknown error"}. Please try reloading the page.
          </p>
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center px-4 py-2 bg-civic-blue hover:bg-civic-blue-dark text-white rounded-md text-sm font-medium transition-colors"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
