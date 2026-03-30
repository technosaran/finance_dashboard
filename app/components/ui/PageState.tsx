'use client';

import type { ReactNode } from 'react';
import { AlertTriangle, Inbox, RefreshCcw } from 'lucide-react';

interface PageStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
  variant?: 'empty' | 'error';
}

export function PageState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  variant = 'empty',
}: PageStateProps) {
  const defaultIcon = variant === 'error' ? <AlertTriangle size={28} /> : <Inbox size={28} />;

  return (
    <div className={`page-state page-state--${variant}`}>
      <div className="page-state__icon">{icon ?? defaultIcon}</div>
      <h3 className="page-state__title">{title}</h3>
      <p className="page-state__description">{description}</p>
      {actionLabel && onAction ? (
        <button type="button" className="page-state__button" onClick={onAction}>
          {variant === 'error' ? <RefreshCcw size={16} /> : null}
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

interface PageSkeletonProps {
  cardCount?: number;
  rowCount?: number;
}

export function PageSkeleton({ cardCount = 3, rowCount = 5 }: PageSkeletonProps) {
  return (
    <div className="page-skeleton">
      <div className="page-skeleton__header">
        <div className="skeleton page-skeleton__title" />
        <div className="skeleton page-skeleton__subtitle" />
      </div>
      <div className="page-skeleton__cards">
        {Array.from({ length: cardCount }).map((_, index) => (
          <div key={index} className="premium-card page-skeleton__card">
            <div className="skeleton page-skeleton__label" />
            <div className="skeleton page-skeleton__value" />
            <div className="skeleton page-skeleton__meta" />
          </div>
        ))}
      </div>
      <div className="premium-card page-skeleton__panel">
        {Array.from({ length: rowCount }).map((_, index) => (
          <div key={index} className="page-skeleton__row">
            <div className="skeleton page-skeleton__avatar" />
            <div className="page-skeleton__content">
              <div className="skeleton page-skeleton__line page-skeleton__line--wide" />
              <div className="skeleton page-skeleton__line" />
            </div>
            <div className="skeleton page-skeleton__amount" />
          </div>
        ))}
      </div>
    </div>
  );
}
