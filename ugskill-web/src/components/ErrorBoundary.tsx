import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import * as Sentry from '@sentry/react';
import { Button } from '../components/ui/Button';

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
    console.error('Uncaught error:', error, errorInfo);
    Sentry.captureException(error, { extra: { errorInfo } });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          padding: '2rem',
          textAlign: 'center',
          background: 'var(--surface-base)'
        }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'var(--error-transparent)',
            color: 'var(--error)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AlertCircle size={40} />
          </div>
          <div>
            <h1 style={{ color: 'var(--text-high)', fontSize: '1.5rem', marginBottom: '0.5rem', fontFamily: 'var(--font-display)' }}>Oops! Something went wrong</h1>
            <p style={{ color: 'var(--text-low)', fontSize: '0.875rem', maxWidth: 400, margin: '0 auto' }}>
              We've encountered an unexpected error. Please try refreshing the page or contact support if the issue persists.
            </p>
          </div>
          <Button variant="primary" leftIcon={<RefreshCw size={15} />} onClick={this.handleReload}>
            Reload Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
