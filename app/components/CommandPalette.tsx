'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  BarChart3,
  Wallet,
  TrendingUp,
  Target,
  Settings,
  BookOpen,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  DollarSign,
  Command,
  Zap,
} from 'lucide-react';
import { useFinance } from './FinanceContext';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  category: 'navigation' | 'stock' | 'mutualfund' | 'action';
  keywords?: string[];
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { stocks, mutualFunds } = useFinance();

  // Register global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  const navigate = useCallback(
    (path: string) => {
      setIsOpen(false);
      router.push(path);
    },
    [router]
  );

  // Build command items list
  const commands = useMemo<CommandItem[]>(() => {
    const navItems: CommandItem[] = [
      {
        id: 'nav-dashboard',
        label: 'Dashboard',
        description: 'Overview & Quick Stats',
        icon: <BarChart3 size={16} />,
        action: () => navigate('/'),
        category: 'navigation',
        keywords: ['home', 'overview'],
      },
      {
        id: 'nav-stocks',
        label: 'Stocks',
        description: 'Equity Portfolio',
        icon: <TrendingUp size={16} />,
        action: () => navigate('/stocks'),
        category: 'navigation',
        keywords: ['equity', 'shares'],
      },
      {
        id: 'nav-mutualfunds',
        label: 'Mutual Funds',
        description: 'SIP & Lumpsum',
        icon: <Wallet size={16} />,
        action: () => navigate('/mutual-funds'),
        category: 'navigation',
        keywords: ['sip', 'mf'],
      },
      {
        id: 'nav-ledger',
        label: 'Ledger',
        description: 'Income & Expenses',
        icon: <BookOpen size={16} />,
        action: () => navigate('/ledger'),
        category: 'navigation',
        keywords: ['transactions', 'history'],
      },
      {
        id: 'nav-income',
        label: 'Income',
        description: 'Salary & Earnings',
        icon: <ArrowUpRight size={16} />,
        action: () => navigate('/salary'),
        category: 'navigation',
        keywords: ['salary', 'earnings', 'pay'],
      },
      {
        id: 'nav-expenses',
        label: 'Expenses',
        description: 'Spending Tracker',
        icon: <ArrowDownRight size={16} />,
        action: () => navigate('/expenses'),
        category: 'navigation',
        keywords: ['spending', 'bills'],
      },
      {
        id: 'nav-goals',
        label: 'Goals',
        description: 'Financial Targets',
        icon: <Target size={16} />,
        action: () => navigate('/goals'),
        category: 'navigation',
        keywords: ['targets', 'savings'],
      },
      {
        id: 'nav-family',
        label: 'Family',
        description: 'Transfers & Gifts',
        icon: <Users size={16} />,
        action: () => navigate('/family'),
        category: 'navigation',
        keywords: ['transfers', 'gifts'],
      },
      {
        id: 'nav-fno',
        label: 'F&O',
        description: 'Futures & Options',
        icon: <Zap size={16} />,
        action: () => navigate('/fno'),
        category: 'navigation',
        keywords: ['futures', 'options', 'derivatives'],
      },
      {
        id: 'nav-settings',
        label: 'Settings',
        description: 'Preferences',
        icon: <Settings size={16} />,
        action: () => navigate('/settings'),
        category: 'navigation',
        keywords: ['preferences', 'config'],
      },
    ];

    // Add stocks as searchable items
    const stockItems: CommandItem[] = stocks
      .filter((s) => s.quantity > 0)
      .map((s) => ({
        id: `stock-${s.id}`,
        label: s.symbol,
        description: `${s.companyName} • ₹${s.currentValue.toLocaleString()}`,
        icon: <DollarSign size={16} />,
        action: () => navigate('/stocks'),
        category: 'stock' as const,
        keywords: [s.companyName.toLowerCase(), s.symbol.toLowerCase()],
      }));

    // Add mutual funds as searchable items
    const mfItems: CommandItem[] = mutualFunds.map((m) => ({
      id: `mf-${m.id}`,
      label: m.schemeName.length > 35 ? m.schemeName.substring(0, 35) + '…' : m.schemeName,
      description: `₹${m.currentValue.toLocaleString()}`,
      icon: <Wallet size={16} />,
      action: () => navigate('/mutual-funds'),
      category: 'mutualfund' as const,
      keywords: [m.schemeName.toLowerCase()],
    }));

    return [...navItems, ...stockItems, ...mfItems];
  }, [stocks, mutualFunds, navigate]);

  // Filter commands based on query
  const filtered = useMemo(() => {
    if (!query.trim()) return commands.slice(0, 10);
    const q = query.toLowerCase();
    return commands
      .filter(
        (c) =>
          c.label.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.keywords?.some((k) => k.includes(q))
      )
      .slice(0, 10);
  }, [commands, query]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      filtered[selectedIndex]?.action();
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const el = listRef.current.children[selectedIndex] as HTMLElement;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const categoryLabels: Record<string, string> = {
    navigation: 'Pages',
    stock: 'Stocks',
    mutualfund: 'Mutual Funds',
    action: 'Actions',
  };

  // Group by category
  const grouped = filtered.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, CommandItem[]>
  );

  let globalIndex = -1;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: 'max(15vh, 80px)',
        animation: 'fadeIn 0.15s ease',
      }}
      onClick={() => setIsOpen(false)}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          margin: '0 16px',
          background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '20px',
          border: '1px solid rgba(99, 102, 241, 0.15)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(99, 102, 241, 0.08)',
          overflow: 'hidden',
          animation: 'modalSlideUp 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <Search size={18} color="#6366f1" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, stocks, funds…"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: '500',
            }}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.06)',
              fontSize: '0.65rem',
              fontWeight: '700',
              color: '#64748b',
            }}
          >
            ESC
          </div>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          style={{
            maxHeight: '360px',
            overflowY: 'auto',
            padding: '8px',
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                padding: '32px',
                textAlign: 'center',
                color: '#475569',
                fontSize: '0.85rem',
              }}
            >
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <div
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.65rem',
                    fontWeight: '800',
                    color: '#475569',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {categoryLabels[category] || category}
                </div>
                {items.map((item) => {
                  globalIndex++;
                  const idx = globalIndex;
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: 'none',
                        background: isSelected ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                        color: '#fff',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.1s',
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: isSelected
                            ? 'rgba(99, 102, 241, 0.15)'
                            : 'rgba(255,255,255,0.04)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isSelected ? '#818cf8' : '#64748b',
                          flexShrink: 0,
                        }}
                      >
                        {item.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.label}
                        </div>
                        {item.description && (
                          <div
                            style={{
                              fontSize: '0.7rem',
                              color: '#475569',
                              fontWeight: '500',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.description}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '10px 16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '0.65rem',
            color: '#475569',
            fontWeight: '600',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Command size={10} /> K to toggle
          </span>
          <span>↑↓ navigate</span>
          <span>↵ select</span>
        </div>
      </div>
    </div>
  );
}
