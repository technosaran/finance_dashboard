'use client';

import React from 'react';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
  /** Heading shown below the icon */
  title: string;
  /** Explanatory subtitle */
  description?: string;
  /** Label for the primary CTA button */
  actionLabel?: string;
  /** Called when the CTA is clicked */
  onAction?: () => void;
  /** Custom icon/illustration (defaults to a simple '+' circle) */
  icon?: React.ReactNode;
}

/**
 * Reusable empty state component.
 *
 * Renders a centred illustration, heading, optional description and an
 * optional call-to-action button.  Use it wherever a list/table has no data
 * so the user never sees a blank screen.
 *
 * @example
 * <EmptyState
 *   title="No stocks yet"
 *   description="Add your first holding to start tracking your portfolio."
 *   actionLabel="Add Stock"
 *   onAction={() => setShowAddModal(true)}
 * />
 */
export function EmptyState({ title, description, actionLabel, onAction, icon }: EmptyStateProps) {
  return (
    <div
      role="status"
      aria-label={title}
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
      {/* Illustration */}
      <div
        aria-hidden="true"
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-tertiary)',
        }}
      >
        {icon ?? <Plus size={28} />}
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

      {/* Description */}
      {description && (
        <p
          style={{
            margin: 0,
            fontSize: '13px',
            color: 'var(--text-secondary)',
            maxWidth: '320px',
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      )}

      {/* CTA */}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            marginTop: '4px',
            padding: '8px 20px',
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.18s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
