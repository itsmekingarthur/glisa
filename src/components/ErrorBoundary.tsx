import { Component, ErrorInfo, ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-[#313338] text-[#dbdee1]">
          <div className="text-center space-y-4 p-8">
            <div className="text-6xl">⚠️</div>
            <p className="text-xl font-semibold">Something went wrong</p>
            <pre className="text-sm text-red-400 bg-[#1e1f22] p-4 rounded-lg max-w-lg mx-auto overflow-auto">
              {this.state.error?.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-[#5865f2] hover:bg-[#4752c4] rounded font-semibold"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
