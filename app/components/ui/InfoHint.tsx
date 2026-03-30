'use client';

import { Info } from 'lucide-react';

interface InfoHintProps {
  label: string;
  description: string;
}

export function InfoHint({ label, description }: InfoHintProps) {
  return (
    <span className="info-hint">
      <span>{label}</span>
      <button
        type="button"
        className="info-hint__button"
        aria-label={`${label}: ${description}`}
        title={description}
      >
        <Info size={14} />
      </button>
    </span>
  );
}
