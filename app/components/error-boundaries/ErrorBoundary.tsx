'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { logError } from '@/lib/utils/logger';
import { colors } from '@/lib/styles/constants';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component to catch and handle React errors
 * Prevents the entire app from crashing when a component error occurs
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to monitoring service
    logError('ErrorBoundary caught an error', error, {
      componentStack: errorInfo.componentStack,
    });

    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div
          style={{
            minHeight: '100vh',
            backgroundColor: colors.bgPage,
            color: colors.textHeading,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            style={{
              maxWidth: '600px',
              width: '100%',
              background: colors.bgCard,
              border: `1px solid ${colors.border}`,
              borderRadius: '24px',
              padding: '40px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 24px',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={40} color={colors.danger} />
            </div>

            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: '900',
                marginBottom: '16px',
                color: '#fff',
              }}
            >
              Something Went Wrong
            </h1>

            <p
              style={{
                fontSize: '1rem',
                color: colors.textMuted,
                marginBottom: '32px',
                lineHeight: '1.6',
              }}
            >
              We encountered an unexpected error. Please try refreshing the page or returning to
              the home screen.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div
                style={{
                  background: colors.border,
                  padding: '16px',
                  borderRadius: '12px',
                  marginBottom: '24px',
                  textAlign: 'left',
                  overflow: 'auto',
                  maxHeight: '200px',
                }}
              >
                <p
                  style={{
                    fontSize: '0.875rem',
                    color: colors.danger,
                    fontWeight: '700',
                    marginBottom: '8px',
                  }}
                >
                  Error Details (Development Only):
                </p>
                <pre style={{ fontSize: '0.75rem', color: '#cbd5e1', whiteSpace: 'pre-wrap' }}>
                  {this.state.error.toString()}
                </pre>
              </div>
            )}

            <div
              style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}
            >
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  padding: '12px 24px',
                  background: '#6366f1',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#4f46e5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#6366f1';
                }}
              >
                <RefreshCw size={16} />
                Try Again
              </button>

              <button
                type="button"
                onClick={() => (window.location.href = '/')}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  color: '#818cf8',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: '12px',
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                }}
              >
                <Home size={16} />
                Go Home
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
