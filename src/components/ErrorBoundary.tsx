import React from "react";

type Props = {
  title?: string;
  children: React.ReactNode;
};

type State = {
  error?: Error;
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Keep this console log to reveal the real crash cause during debugging.
    console.error("UI crashed:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="h-full w-full flex items-center justify-center p-6">
          <div className="glass-card rounded-xl p-6 max-w-xl w-full">
            <div className="text-lg font-semibold">{this.props.title ?? "Something went wrong"}</div>
            <div className="mt-2 text-sm text-muted-foreground">
              The UI hit a runtime error and was recovered to prevent a blank screen.
            </div>
            <pre className="mt-4 text-xs overflow-auto rounded-lg bg-background/60 border border-border/40 p-3">
{this.state.error.message}
            </pre>
            <div className="mt-4 text-xs text-muted-foreground">
              Open DevTools → Console to see the full stack trace.
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

