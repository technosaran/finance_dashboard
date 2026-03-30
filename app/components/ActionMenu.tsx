'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';

export interface ActionMenuItem {
  /** Text label shown in the menu */
  label: string;
  /** Optional icon rendered before the label */
  icon?: React.ReactNode;
  /** Called when the item is clicked */
  onClick: () => void;
  /** Whether this action is destructive (renders in danger colour) */
  danger?: boolean;
  /** Disable the item */
  disabled?: boolean;
}

interface ActionMenuProps {
  /** Items to show in the dropdown menu */
  items: ActionMenuItem[];
  /** Accessible label for the trigger button (screen readers) */
  triggerLabel?: string;
}

/**
 * Accessible kebab-menu (⋯) that renders labeled action items.
 *
 * Keyboard: Enter/Space opens the menu; Arrow keys navigate items;
 * Escape closes; Tab closes and moves focus forward.
 * All items have explicit text labels – no icon-only ambiguity.
 */
export function ActionMenu({ items, triggerLabel = 'More actions' }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const focusIndexRef = useRef<number>(-1);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  // Close on outside click or scroll
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, close]);

  // Keyboard navigation inside menu
  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const items = menuRef.current?.querySelectorAll<HTMLButtonElement>(
      '[role="menuitem"]:not(:disabled)'
    );
    if (!items || items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusIndexRef.current = Math.min(focusIndexRef.current + 1, items.length - 1);
      items[focusIndexRef.current]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusIndexRef.current = Math.max(focusIndexRef.current - 1, 0);
      items[focusIndexRef.current]?.focus();
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      close();
    }
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' && !open) {
      e.preventDefault();
      setOpen(true);
      // Focus first item once the menu renders
      requestAnimationFrame(() => {
        const first = menuRef.current?.querySelector<HTMLButtonElement>(
          '[role="menuitem"]:not(:disabled)'
        );
        first?.focus();
        focusIndexRef.current = 0;
      });
    }
  };

  const handleToggle = () => {
    if (!open) {
      setOpen(true);
      focusIndexRef.current = -1;
      requestAnimationFrame(() => {
        const first = menuRef.current?.querySelector<HTMLButtonElement>(
          '[role="menuitem"]:not(:disabled)'
        );
        first?.focus();
        focusIndexRef.current = 0;
      });
    } else {
      close();
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={menuRef}>
      <button
        ref={triggerRef}
        className="icon-btn"
        aria-label={triggerLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={handleToggle}
        onKeyDown={handleTriggerKeyDown}
        style={{ color: 'var(--text-secondary)' }}
      >
        <MoreHorizontal size={16} aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={triggerLabel}
          onKeyDown={handleMenuKeyDown}
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 4px)',
            minWidth: '160px',
            background: 'var(--card, #121a24)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.55)',
            zIndex: 50,
            padding: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          {items.map((item, i) => (
            <button
              key={i}
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                item.onClick();
                close();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                background: 'none',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: item.disabled ? 'not-allowed' : 'pointer',
                color: item.danger
                  ? 'var(--danger, #ef4444)'
                  : item.disabled
                    ? 'var(--text-tertiary)'
                    : 'var(--text-primary)',
                fontSize: '13px',
                textAlign: 'left',
                transition: 'background 0.15s',
                opacity: item.disabled ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!item.disabled)
                  e.currentTarget.style.background = item.danger
                    ? 'var(--danger-light, rgba(239,68,68,0.1))'
                    : 'rgba(255,255,255,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              {item.icon && (
                <span aria-hidden="true" style={{ flexShrink: 0, display: 'flex' }}>
                  {item.icon}
                </span>
              )}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
