'use client';

import { useState, useMemo } from 'react';
import { useNotifications } from '../components/NotificationContext';
import { useLedger, useSettings } from '../components/FinanceContext';
import { Transaction, TransactionCategory } from '@/lib/types';
import {
  TrendingUp,
  Plus,
  X,
  Briefcase,
  DollarSign,
  Edit3,
  Trash2,
  TrendingDown,
  ArrowUpRight,
  HandCoins,
  Gem,
  LineChart,
  Home,
  Waves,
  Banknote,
  Layers,
  ListFilter,
} from 'lucide-react';

// Help map categories to icons and colors
const categoryConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  Salary: { icon: <Briefcase size={16} />, color: '#10b981', label: 'Salary' },
  Business: { icon: <HandCoins size={16} />, color: '#6366f1', label: 'Business' },
  Investment: { icon: <LineChart size={16} />, color: '#f59e0b', label: 'Investment' },
  Dividend: { icon: <Gem size={16} />, color: '#ec4899', label: 'Dividend' },
  Rent: { icon: <Home size={16} />, color: '#8b5cf6', label: 'Rent' },
  Bonus: { icon: <Waves size={16} />, color: '#06b6d4', label: 'Bonus' },
  Other: { icon: <DollarSign size={16} />, color: '#94a3b8', label: 'Other' },
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function IncomeClient() {
  const { accounts, transactions, addTransaction, updateTransaction, deleteTransaction, loading } =
    useLedger();
  const { settings } = useSettings();
  const { showNotification, confirm: customConfirm } = useNotifications();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year' | 'all'>(
    'year'
  );
  const [selectedAccountId, setSelectedAccountId] = useState<number | ''>(
    settings.defaultSalaryAccountId || ''
  );

  // Income Data Filtering (Global Income)
  const incomeItems = useMemo(
    () => transactions.filter((t) => t.type === 'Income'),
    [transactions]
  );

  // Calculate stats based on selected period
  const stats = useMemo(() => {
    const now = new Date();
    let filteredItems = incomeItems;

    switch (selectedPeriod) {
      case 'month':
        filteredItems = incomeItems.filter((item) => {
          const itemDate = new Date(item.date);
          return (
            itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear()
          );
        });
        break;
      case 'quarter': {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        filteredItems = incomeItems.filter((item) => {
          const itemDate = new Date(item.date);
          const itemQuarter = Math.floor(itemDate.getMonth() / 3);
          return itemQuarter === currentQuarter && itemDate.getFullYear() === now.getFullYear();
        });
        break;
      }
      case 'year':
        filteredItems = incomeItems.filter((item) => {
          const itemDate = new Date(item.date);
          return itemDate.getFullYear() === now.getFullYear();
        });
        break;
      default:
        filteredItems = incomeItems;
    }

    const total = filteredItems.reduce((sum, item) => sum + item.amount, 0);
    const count = filteredItems.length;
    const average = count > 0 ? total / count : 0;

    // Get unique sources
    const sourcesSet = new Set(filteredItems.map((item) => item.description || 'Unknown'));
    const sourcesCount = sourcesSet.size;

    // Calculate trend (comparing to previous period)
    let previousTotal = 0;
    if (selectedPeriod === 'month') {
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthItems = incomeItems.filter((item) => {
        const itemDate = new Date(item.date);
        return (
          itemDate.getMonth() === prevMonth.getMonth() &&
          itemDate.getFullYear() === prevMonth.getFullYear()
        );
      });
      previousTotal = prevMonthItems.reduce((sum, item) => sum + item.amount, 0);
    }

    const trend = previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : 0;

    return { total, count, average, sourcesCount, trend, filteredItems };
  }, [incomeItems, selectedPeriod]);

  // Process Category Breakdown
  const categoryData = useMemo(() => {
    const map = stats.filteredItems.reduce(
      (acc, item) => {
        const cat = (item.category as string) || 'Other';
        if (!acc[cat]) acc[cat] = 0;
        acc[cat] += item.amount;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(map)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [stats.filteredItems]);

  // Monthly breakdown for the current year (used in chart)
  const monthlyData = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    return MONTHS.map((label, monthIndex) => {
      const total = incomeItems
        .filter((item) => {
          const d = new Date(item.date);
          return d.getFullYear() === year && d.getMonth() === monthIndex;
        })
        .reduce((sum, item) => sum + item.amount, 0);
      return { label, total, isCurrentMonth: monthIndex === now.getMonth() };
    });
  }, [incomeItems]);

  const maxMonthly = Math.max(...monthlyData.map((m) => m.total), 1);

  // Form State
  const [amount, setAmount] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [category, setCategory] = useState<TransactionCategory>('Salary');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleLogIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !sourceName) return;

    const txData = {
      date,
      description: sourceName,
      category,
      type: 'Income' as const,
      amount: parseFloat(amount),
      accountId: selectedAccountId ? Number(selectedAccountId) : undefined,
    };

    if (editId) {
      await updateTransaction(editId, txData);
      showNotification('success', 'Income updated successfully');
    } else {
      await addTransaction(txData);
      showNotification('success', 'Income saved');
    }

    resetForm();
    setIsModalOpen(false);
  };

  const resetForm = () => {
    setAmount('');
    setSourceName('');
    setCategory('Salary');
    setDate(new Date().toISOString().split('T')[0]);
    setEditId(null);
  };

  const handleEdit = (item: Transaction) => {
    setEditId(item.id);
    setAmount(item.amount.toString());
    setSourceName(item.description);
    setCategory(item.category as TransactionCategory);
    setDate(item.date);
    setIsModalOpen(true);
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'month':
        return 'This Month';
      case 'quarter':
        return 'This Quarter';
      case 'year':
        return 'This Year';
      default:
        return 'All Time';
    }
  };

  if (loading) return null;

  return (
    <div
      className="main-content"
      style={{ backgroundColor: '#000000', minHeight: '100vh', paddingBottom: '100px' }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>
        {/* ── Header ── */}
        <div className="page-header" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '16px',
                background:
                  'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(52,211,153,0.1) 100%)',
                border: '1px solid rgba(16,185,129,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
                flexShrink: 0,
              }}
            >
              <Banknote size={24} />
            </div>
            <div>
              <h1
                className="page-title"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '2px',
                }}
              >
                Income
              </h1>
              <p className="page-subtitle" style={{ margin: 0 }}>
                Track all your earnings in one place
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="header-add-btn header-add-btn--green pulse-on-hover"
          >
            <Plus size={18} strokeWidth={3} /> Log Income
          </button>
        </div>

        {/* ── Period Selector ── */}
        <div
          style={{
            display: 'inline-flex',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            padding: '4px',
            gap: '4px',
            marginBottom: '32px',
          }}
        >
          {(['month', 'quarter', 'year', 'all'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              style={{
                padding: '8px 18px',
                borderRadius: '10px',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background:
                  selectedPeriod === period
                    ? 'linear-gradient(135deg, rgba(16,185,129,0.25) 0%, rgba(16,185,129,0.1) 100%)'
                    : 'transparent',
                color: selectedPeriod === period ? '#10b981' : '#64748b',
                boxShadow: selectedPeriod === period ? '0 0 0 1px rgba(16,185,129,0.3)' : 'none',
              }}
            >
              {period === 'month'
                ? 'Month'
                : period === 'quarter'
                  ? 'Quarter'
                  : period === 'year'
                    ? 'Year'
                    : 'All'}
            </button>
          ))}
        </div>

        {/* ── Hero Stats ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          {/* Total Earned */}
          <div
            className="premium-card"
            style={{
              background:
                'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.04) 100%)',
              border: '1px solid rgba(16,185,129,0.2)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-40px',
                right: '-40px',
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                background: 'rgba(16,185,129,0.08)',
              }}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(16,185,129,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10b981',
                }}
              >
                <TrendingUp size={20} />
              </div>
              {selectedPeriod === 'month' && stats.trend !== 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.78rem',
                    color: stats.trend > 0 ? '#10b981' : '#ef4444',
                    fontWeight: '700',
                    background: stats.trend > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    padding: '4px 8px',
                    borderRadius: '8px',
                  }}
                >
                  {stats.trend > 0 ? <ArrowUpRight size={12} /> : <TrendingDown size={12} />}
                  {Math.abs(stats.trend).toFixed(1)}%
                </div>
              )}
            </div>
            <div
              style={{
                fontSize: '0.8rem',
                color: '#64748b',
                fontWeight: '700',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Total Earned · {getPeriodLabel()}
            </div>
            <div
              style={{
                fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
                fontWeight: '900',
                color: '#fff',
                lineHeight: 1,
              }}
            >
              ₹{stats.total.toLocaleString()}
            </div>
          </div>

          {/* Avg per Entry */}
          <div
            className="premium-card"
            style={{
              background: 'rgba(99,102,241,0.06)',
              border: '1px solid rgba(99,102,241,0.18)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-40px',
                right: '-40px',
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                background: 'rgba(99,102,241,0.06)',
              }}
            />
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(99,102,241,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6366f1',
                }}
              >
                <Layers size={20} />
              </div>
            </div>
            <div
              style={{
                fontSize: '0.8rem',
                color: '#64748b',
                fontWeight: '700',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Avg per Entry
            </div>
            <div
              style={{
                fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
                fontWeight: '900',
                color: '#fff',
                lineHeight: 1,
                marginBottom: '6px',
              }}
            >
              ₹{stats.average.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>
              From {stats.count} entr{stats.count !== 1 ? 'ies' : 'y'}
            </div>
          </div>

          {/* Active Sources */}
          <div
            className="premium-card"
            style={{
              background: 'rgba(245,158,11,0.06)',
              border: '1px solid rgba(245,158,11,0.18)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-40px',
                right: '-40px',
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                background: 'rgba(245,158,11,0.06)',
              }}
            />
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(245,158,11,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f59e0b',
                }}
              >
                <ListFilter size={20} />
              </div>
            </div>
            <div
              style={{
                fontSize: '0.8rem',
                color: '#64748b',
                fontWeight: '700',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Active Sources
            </div>
            <div
              style={{
                fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
                fontWeight: '900',
                color: '#fff',
                lineHeight: 1,
                marginBottom: '6px',
              }}
            >
              {stats.sourcesCount}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>
              {getPeriodLabel()}
            </div>
          </div>
        </div>

        {/* ── Monthly Bar Chart ── */}
        <div className="premium-card" style={{ marginBottom: '32px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff', margin: 0 }}>
                Monthly Overview
              </h3>
              <p
                style={{
                  fontSize: '0.8rem',
                  color: '#64748b',
                  margin: '4px 0 0',
                  fontWeight: '600',
                }}
              >
                {new Date().getFullYear()} earnings month by month
              </p>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '700' }}>
              {MONTHS[new Date().getMonth()]} {new Date().getFullYear()}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 'clamp(4px, 1.2vw, 12px)',
              height: '120px',
              overflowX: 'auto',
              paddingBottom: '8px',
            }}
          >
            {monthlyData.map((m) => {
              const pct = maxMonthly > 0 ? (m.total / maxMonthly) * 100 : 0;
              return (
                <div
                  key={m.label}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    flex: '1 0 auto',
                    minWidth: '32px',
                  }}
                >
                  <div
                    title={`₹${m.total.toLocaleString()}`}
                    style={{
                      width: '100%',
                      height: `${Math.max(pct, m.total > 0 ? 4 : 0)}%`,
                      minHeight: m.total > 0 ? '4px' : '0',
                      borderRadius: '6px 6px 3px 3px',
                      background: m.isCurrentMonth
                        ? 'linear-gradient(180deg, #34d399 0%, #10b981 100%)'
                        : m.total > 0
                          ? 'rgba(16,185,129,0.35)'
                          : 'rgba(255,255,255,0.05)',
                      transition: 'height 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: m.isCurrentMonth ? '0 0 12px rgba(16,185,129,0.4)' : 'none',
                      alignSelf: 'flex-end',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.65rem',
                      color: m.isCurrentMonth ? '#10b981' : '#475569',
                      fontWeight: m.isCurrentMonth ? '800' : '600',
                    }}
                  >
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Bottom Grid: Category Breakdown + Transactions ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
            gap: '24px',
          }}
        >
          {/* Category Breakdown */}
          <div className="premium-card">
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: 'rgba(168,85,247,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#a855f7',
                  flexShrink: 0,
                }}
              >
                <Layers size={16} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#fff', margin: 0 }}>
                  By Category
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0, fontWeight: '600' }}>
                  {getPeriodLabel()}
                </p>
              </div>
            </div>

            {categoryData.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {categoryData.map((cat) => {
                  const config = categoryConfig[cat.name] || categoryConfig.Other;
                  const pct = stats.total > 0 ? (cat.total / stats.total) * 100 : 0;
                  return (
                    <div key={cat.name}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '6px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '8px',
                              background: `${config.color}18`,
                              color: config.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {config.icon}
                          </div>
                          <span style={{ fontWeight: '700', color: '#e2e8f0', fontSize: '0.9rem' }}>
                            {config.label}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span
                            style={{ fontSize: '0.75rem', color: '#475569', fontWeight: '600' }}
                          >
                            {pct.toFixed(1)}%
                          </span>
                          <span
                            style={{
                              fontWeight: '800',
                              color: config.color,
                              fontSize: '0.95rem',
                              minWidth: '80px',
                              textAlign: 'right',
                            }}
                          >
                            ₹{cat.total.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          height: '4px',
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: '4px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: `linear-gradient(90deg, ${config.color}90, ${config.color})`,
                            borderRadius: '4px',
                            transition: 'width 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#475569' }}>
                <HandCoins size={36} style={{ opacity: 0.2, marginBottom: '12px' }} />
                <p style={{ fontWeight: '600', margin: 0 }}>No data for this period</p>
              </div>
            )}
          </div>

          {/* Transactions List */}
          <div className="premium-card">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: 'rgba(6,182,212,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#06b6d4',
                    flexShrink: 0,
                  }}
                >
                  <Banknote size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#fff', margin: 0 }}>
                    Transactions
                  </h3>
                  <p
                    style={{ fontSize: '0.75rem', color: '#64748b', margin: 0, fontWeight: '600' }}
                  >
                    {stats.filteredItems.length} entr
                    {stats.filteredItems.length !== 1 ? 'ies' : 'y'}
                  </p>
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                maxHeight: '460px',
                overflowY: 'auto',
                paddingRight: '4px',
              }}
            >
              {stats.filteredItems.length > 0 ? (
                [...stats.filteredItems]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((item) => {
                    const config = categoryConfig[item.category as string] || categoryConfig.Other;
                    return (
                      <div
                        key={item.id}
                        className="tx-row"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 14px',
                          borderRadius: '12px',
                          background: 'rgba(255,255,255,0.025)',
                          border: '1px solid rgba(255,255,255,0.05)',
                        }}
                      >
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: `${config.color}15`,
                            color: config.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {config.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: '700',
                              color: '#e2e8f0',
                              fontSize: '0.9rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.description}
                          </div>
                          <div
                            style={{
                              fontSize: '0.72rem',
                              color: '#475569',
                              fontWeight: '600',
                              marginTop: '2px',
                            }}
                          >
                            {config.label} ·{' '}
                            {new Date(item.date).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                        <div
                          style={{
                            fontWeight: '800',
                            color: '#10b981',
                            fontSize: '0.95rem',
                            flexShrink: 0,
                          }}
                        >
                          +₹{item.amount.toLocaleString()}
                        </div>
                        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                          <button
                            onClick={() => handleEdit(item)}
                            className="mobile-action-btn mobile-action-btn--edit"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={async () => {
                              const ok = await customConfirm({
                                title: 'Delete Entry',
                                message: 'Delete this income record?',
                                type: 'error',
                                confirmLabel: 'Delete',
                              });
                              if (ok) {
                                await deleteTransaction(item.id);
                                showNotification('success', 'Income deleted');
                              }
                            }}
                            className="mobile-action-btn mobile-action-btn--delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '20px',
                      background: 'rgba(16,185,129,0.08)',
                      border: '1px solid rgba(16,185,129,0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 20px',
                      color: '#10b981',
                      opacity: 0.5,
                    }}
                  >
                    <TrendingUp size={28} />
                  </div>
                  <p
                    style={{
                      fontWeight: '700',
                      fontSize: '1rem',
                      color: '#94a3b8',
                      margin: '0 0 6px',
                    }}
                  >
                    No income found
                  </p>
                  <p
                    style={{
                      fontSize: '0.82rem',
                      color: '#475569',
                      margin: '0 0 20px',
                      fontWeight: '600',
                    }}
                  >
                    Start logging your earnings
                  </p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    style={{
                      padding: '10px 22px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#fff',
                      border: 'none',
                      fontWeight: '800',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    + Add first income
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '480px', width: '100%' }}>
            <button
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="modal-close"
            >
              <X size={20} />
            </button>

            <div
              style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'rgba(16,185,129,0.12)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10b981',
                }}
              >
                <Banknote size={20} />
              </div>
              <div>
                <h2 className="modal-title" style={{ margin: 0 }}>
                  {editId ? 'Edit Income' : 'Log Income'}
                </h2>
              </div>
            </div>
            <p className="modal-subtitle" style={{ marginBottom: '24px' }}>
              {editId
                ? 'Update the details of this income entry'
                : 'Record a salary, freelance payment, dividend, or any other credit'}
            </p>

            <form
              onSubmit={handleLogIncome}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div>
                <label className="form-label">Source Name</label>
                <input
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder="e.g. Acme Corp, Fiverr, Rental"
                  required
                  className="form-input form-input--green"
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="form-label">Amount (₹)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    className="form-input form-input--green"
                  />
                </div>
                <div>
                  <label className="form-label">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                    className="form-input form-input--green"
                  >
                    {Object.keys(categoryConfig).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="form-input form-input--green"
                  />
                </div>
                <div>
                  <label className="form-label">Credit Account</label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) =>
                      setSelectedAccountId(e.target.value ? Number(e.target.value) : '')
                    }
                    className="form-input form-input--green"
                  >
                    <option value="">No account link</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} (₹{acc.balance.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary btn-primary--green"
                style={{ marginTop: '8px' }}
              >
                {editId ? 'Update Entry' : 'Save Income'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
