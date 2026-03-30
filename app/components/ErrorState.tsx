'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  /** User-facing error summary */
  title?: string;
  /** Optional detail message or technical info */
  message?: string;
  /** Called when the "Retry" button is clicked */
  onRetry?: () => void;
}

/**
 * Reusable error state component.
 *
 * Renders a centred alert icon, heading, optional message and an optional
 * Retry button.  Use inside any module page when a data fetch fails so the
 * user is never left staring at a blank screen.
 *
 * @example
 * if (error) return <ErrorState message={error.message} onRetry={refetch} />;
 */
export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        gap: '16px',
        textAlign: 'center',
      }}
    >
      {/* Icon */}
      <div
        aria-hidden="true"
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'var(--danger-light, rgba(239,68,68,0.1))',
          border: '1px solid rgba(239,68,68,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--danger, #ef4444)',
        }}
      >
        <AlertTriangle size={28} />
      </div>

      {/* Heading */}
      <p
        style={{
          margin: 0,
          fontSize: '15px',
          fontWeight: 600,
          color: 'var(--text-primary)',
        }}
      >
        {title}
      </p>

      {/* Detail */}
      {message && (
        <p
          style={{
            margin: 0,
            fontSize: '13px',
            color: 'var(--text-secondary)',
            maxWidth: '360px',
            lineHeight: 1.5,
          }}
        >
          {message}
        </p>
      )}

      {/* Retry */}
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 20px',
            background: 'rgba(255,255,255,0.06)',
            color: 'var(--text-primary)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.18s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
        >
          <RefreshCw size={14} aria-hidden="true" />
          Retry
        </button>
      )}
    </div>
  );
}
