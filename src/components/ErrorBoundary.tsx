import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-[hsl(var(--destructive))]" />
          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">
            Something went wrong
          </h2>
          <p className="max-w-md text-sm text-[hsl(var(--muted-foreground))]">
            An unexpected error occurred. Please try refreshing the component or
            restart the application.
          </p>
          {this.state.error && (
            <pre className="max-w-md overflow-auto rounded-[var(--radius)] bg-[hsl(var(--muted))] p-3 text-left text-xs text-[hsl(var(--destructive))]">
              {this.state.error.message}
            </pre>
          )}
          <Button variant="outline" onClick={this.handleReset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
