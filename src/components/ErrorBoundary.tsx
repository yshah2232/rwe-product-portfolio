// App-wide safety net. Catches render-time crashes (e.g. Radix portal
// reconciliation hiccups when subtrees swap) and shows a recoverable
// message instead of a blank white screen.

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  /** Optional key — when it changes, the boundary resets automatically. */
  resetKey?: string | number | boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: unknown) {
    // Surface in dev tools / Lovable console
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] caught:', error, info);
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-sm bg-destructive/10 mb-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <h2 className="text-[20px] font-bold text-foreground mb-2">
            Something interrupted this view.
          </h2>
          <p className="text-[14px] text-muted-foreground leading-relaxed mb-5">
            The page hit a render glitch — usually a transient UI hiccup. Click below to recover without losing your place.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button onClick={this.reset} className="gap-2" size="sm">
              <RefreshCw className="h-4 w-4" /> Reload this view
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Hard refresh
            </Button>
          </div>
          {this.state.error?.message && (
            <p className="mt-4 text-[11px] text-muted-foreground/70 font-mono">
              {this.state.error.message}
            </p>
          )}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
