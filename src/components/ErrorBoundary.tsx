import { Component, type ReactNode } from 'react';
import { RotateCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// React only supports catching render errors via a class component's
// getDerivedStateFromError/componentDidCatch — there's no hook equivalent.
// Wraps just the routed page (see App.tsx) so a crash in one page shows a
// fallback with a reload button instead of the blank white screen a visitor
// otherwise gets with nothing to catch the error — Navbar/Footer/ChatWidget
// stay mounted outside this boundary, same as they already survive a page's
// own Suspense fallback.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Unhandled error while rendering page:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="font-display text-lg font-bold text-gray-900 dark:text-white">
            Something went wrong loading this page.
          </p>
          <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">
            This is usually fixed by reloading — sorry for the trouble.
          </p>
          <button onClick={() => window.location.reload()} className="btn-primary">
            Reload page <RotateCw className="h-4 w-4" />
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
