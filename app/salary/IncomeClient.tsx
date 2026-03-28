'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { useNotifications } from '../components/NotificationContext';
import { useLedger, useSettings } from '../components/FinanceContext';
import { EmptyTransactionsVisual } from '../components/Visuals';
import { Transaction } from '@/lib/types';
import {
  Briefcase,
  Calendar as CalendarIcon,
  DollarSign,
  Edit3,
  Gem,
  HandCoins,
  Home,
  Layers,
  LineChart,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  Waves,
  X,
} from 'lucide-react';

type IncomePeriod = 'month' | 'quarter' | 'year' | 'all';

type CategoryConfig = {
  icon: ReactNode;
  color: string;
  label: string;
  note: string;
};

const currencyFormatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });

const categoryConfig: Record<string, CategoryConfig> = {
  Salary: {
    icon: <Briefcase size={18} />,
    color: '#10b981',
    label: 'Salary',
    note: 'Primary payroll and fixed compensation',
  },
  Business: {
    icon: <HandCoins size={18} />,
    color: '#5aa7ff',
    label: 'Business',
    note: 'Consulting, freelance, and business inflow',
  },
  Investment: {
    icon: <LineChart size={18} />,
    color: '#f59e0b',
    label: 'Investment',
    note: 'Capital gains and investment payouts',
  },
  Dividend: {
    icon: <Gem size={18} />,
    color: '#ec4899',
    label: 'Dividend',
    note: 'Stock and fund distributions',
  },
  Rent: {
    icon: <Home size={18} />,
    color: '#8b5cf6',
    label: 'Rent',
    note: 'Rental income and property proceeds',
  },
  Bonus: {
    icon: <Waves size={18} />,
    color: '#06b6d4',
    label: 'Bonus',
    note: 'Incentives, rewards, and special payouts',
  },
  Other: {
    icon: <DollarSign size={18} />,
    color: '#94a3b8',
    label: 'Other',
    note: 'Additional income not captured elsewhere',
  },
};

function formatCurrency(value: number): string {
  return `Rs ${currencyFormatter.format(value)}`;
}

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatFullDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getPeriodLabel(period: IncomePeriod): string {
  switch (period) {
    case 'month':
      return 'This month';
    case 'quarter':
      return 'This quarter';
    case 'year':
      return 'This year';
    default:
      return 'All time';
  }
}

function matchesPeriod(dateValue: string, period: IncomePeriod, offset: number): boolean {
  if (period === 'all') return true;

  const current = new Date();
  const transactionDate = new Date(`${dateValue}T00:00:00`);

  if (period === 'month') {
    const target = new Date(current.getFullYear(), current.getMonth() + offset, 1);
    return (
      transactionDate.getMonth() === target.getMonth() &&
      transactionDate.getFullYear() === target.getFullYear()
    );
  }

  if (period === 'quarter') {
    const quarterIndex = current.getFullYear() * 4 + Math.floor(current.getMonth() / 3) + offset;
    const year = Math.floor(quarterIndex / 4);
    const quarter = ((quarterIndex % 4) + 4) % 4;

    return (
      transactionDate.getFullYear() === year &&
      Math.floor(transactionDate.getMonth() / 3) === quarter
    );
  }

  return transactionDate.getFullYear() === current.getFullYear() + offset;
}

export default function IncomeClient() {
  const { accounts, transactions, addTransaction, updateTransaction, deleteTransaction, loading } =
    useLedger();
  const { settings } = useSettings();
  const { showNotification, confirm: customConfirm } = useNotifications();

  const defaultDepositAccountId = settings.defaultSalaryAccountId || '';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<IncomePeriod>('year');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterAccount, setFilterAccount] = useState<number | 'All'>('All');

  const [amount, setAmount] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [category, setCategory] = useState('Salary');
  const [date, setDate] = useState(toLocalDateKey(new Date()));
  const [formAccountId, setFormAccountId] = useState<number | ''>(defaultDepositAccountId);

  const incomeItems = useMemo(
    () => transactions.filter((transaction) => transaction.type === 'Income'),
    [transactions]
  );

  const categories = useMemo(
    () => ['All', ...new Set(incomeItems.map((item) => String(item.category)))].sort(),
    [incomeItems]
  );

  const filteredIncome = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return incomeItems.filter((item) => {
      const matchesSelectedPeriod = matchesPeriod(item.date, selectedPeriod, 0);
      const matchesQuery =
        normalizedQuery.length === 0 ||
        item.description.toLowerCase().includes(normalizedQuery) ||
        String(item.category).toLowerCase().includes(normalizedQuery);
      const matchesCategory = filterCategory === 'All' || String(item.category) === filterCategory;
      const matchesAccount = filterAccount === 'All' || item.accountId === filterAccount;

      return matchesSelectedPeriod && matchesQuery && matchesCategory && matchesAccount;
    });
  }, [filterAccount, filterCategory, incomeItems, searchQuery, selectedPeriod]);

  const previousPeriodIncome = useMemo(() => {
    if (selectedPeriod === 'all') return [] as Transaction[];

    const normalizedQuery = searchQuery.trim().toLowerCase();

    return incomeItems.filter((item) => {
      const matchesSelectedPeriod = matchesPeriod(item.date, selectedPeriod, -1);
      const matchesQuery =
        normalizedQuery.length === 0 ||
        item.description.toLowerCase().includes(normalizedQuery) ||
        String(item.category).toLowerCase().includes(normalizedQuery);
      const matchesCategory = filterCategory === 'All' || String(item.category) === filterCategory;
      const matchesAccount = filterAccount === 'All' || item.accountId === filterAccount;

      return matchesSelectedPeriod && matchesQuery && matchesCategory && matchesAccount;
    });
  }, [filterAccount, filterCategory, incomeItems, searchQuery, selectedPeriod]);

  const stats = useMemo(() => {
    const total = filteredIncome.reduce((sum, item) => sum + item.amount, 0);
    const count = filteredIncome.length;
    const average = count > 0 ? total / count : 0;
    const sourcesCount = new Set(filteredIncome.map((item) => item.description.trim())).size;
    const previousTotal = previousPeriodIncome.reduce((sum, item) => sum + item.amount, 0);
    const trend =
      previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : total > 0 ? 100 : 0;
    const largestIncome = filteredIncome.reduce<Transaction | null>((largest, item) => {
      if (!largest || item.amount > largest.amount) return item;
      return largest;
    }, null);

    const categoryTotals = filteredIncome.reduce(
      (accumulator, item) => {
        const key = String(item.category);
        accumulator[key] = (accumulator[key] || 0) + item.amount;
        return accumulator;
      },
      {} as Record<string, number>
    );

    const sourceTotals = filteredIncome.reduce(
      (accumulator, item) => {
        const key = item.description.trim() || 'Unknown';
        if (!accumulator[key]) accumulator[key] = { total: 0, count: 0 };
        accumulator[key].total += item.amount;
        accumulator[key].count += 1;
        return accumulator;
      },
      {} as Record<string, { total: number; count: number }>
    );

    const topCategoryEntry = Object.entries(categoryTotals).sort(
      (first, second) => second[1] - first[1]
    )[0];
    const topSourceEntry = Object.entries(sourceTotals).sort(
      (first, second) => second[1].total - first[1].total
    )[0];
    const lastReceived = [...filteredIncome].sort((first, second) => {
      const firstValue = new Date(`${first.date}T00:00:00`).getTime();
      const secondValue = new Date(`${second.date}T00:00:00`).getTime();
      if (firstValue !== secondValue) return secondValue - firstValue;
      return second.id - first.id;
    })[0];

    return {
      total,
      count,
      average,
      sourcesCount,
      trend,
      largestIncome,
      topCategory: topCategoryEntry?.[0] ?? 'No category',
      topCategoryTotal: topCategoryEntry?.[1] ?? 0,
      topSource: topSourceEntry?.[0] ?? 'No source',
      topSourceTotal: topSourceEntry?.[1].total ?? 0,
      lastReceived,
    };
  }, [filteredIncome, previousPeriodIncome]);

  const categoryBreakdown = useMemo(
    () =>
      Object.entries(
        filteredIncome.reduce(
          (accumulator, item) => {
            const key = String(item.category);
            accumulator[key] = (accumulator[key] || 0) + item.amount;
            return accumulator;
          },
          {} as Record<string, number>
        )
      )
        .map(([name, total]) => ({
          name,
          total,
          share: stats.total > 0 ? (total / stats.total) * 100 : 0,
        }))
        .sort((first, second) => second.total - first.total),
    [filteredIncome, stats.total]
  );

  const sourceBreakdown = useMemo(
    () =>
      Object.entries(
        filteredIncome.reduce(
          (accumulator, item) => {
            const key = item.description.trim() || 'Unknown';
            if (!accumulator[key]) {
              accumulator[key] = { total: 0, count: 0, lastDate: item.date };
            }
            accumulator[key].total += item.amount;
            accumulator[key].count += 1;
            if (item.date > accumulator[key].lastDate) {
              accumulator[key].lastDate = item.date;
            }
            return accumulator;
          },
          {} as Record<string, { total: number; count: number; lastDate: string }>
        )
      )
        .map(([name, details]) => ({ name, ...details }))
        .sort((first, second) => second.total - first.total),
    [filteredIncome]
  );

  const groupedIncome = useMemo(() => {
    const grouped: Record<string, Transaction[]> = {};

    filteredIncome.forEach((item) => {
      const dateValue = new Date(`${item.date}T00:00:00`);
      const key = `${dateValue.getFullYear()}-${`${dateValue.getMonth() + 1}`.padStart(2, '0')}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });

    return Object.entries(grouped)
      .sort((first, second) => second[0].localeCompare(first[0]))
      .map(([key, items]) => {
        const monthDate = new Date(`${key}-01T00:00:00`);
        const sortedItems = [...items].sort((first, second) => {
          const firstValue = new Date(`${first.date}T00:00:00`).getTime();
          const secondValue = new Date(`${second.date}T00:00:00`).getTime();
          if (firstValue !== secondValue) return secondValue - firstValue;
          return second.id - first.id;
        });

        return {
          key,
          label: monthDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
          total: sortedItems.reduce((sum, item) => sum + item.amount, 0),
          items: sortedItems,
        };
      });
  }, [filteredIncome]);

  const hasActiveFilters =
    selectedPeriod !== 'year' ||
    searchQuery.trim().length > 0 ||
    filterCategory !== 'All' ||
    filterAccount !== 'All';

  const getAccountName = (id?: number) => {
    if (!id) return 'No account linked';
    const account = accounts.find((item) => item.id === id);
    return account ? account.name : 'Unknown account';
  };

  const resetForm = () => {
    setAmount('');
    setSourceName('');
    setCategory('Salary');
    setDate(toLocalDateKey(new Date()));
    setFormAccountId(defaultDepositAccountId);
    setEditId(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const resetFilters = () => {
    setSelectedPeriod('year');
    setSearchQuery('');
    setFilterCategory('All');
    setFilterAccount('All');
  };

  const handleEdit = (item: Transaction) => {
    setEditId(item.id);
    setAmount(item.amount.toString());
    setSourceName(item.description);
    setCategory(String(item.category));
    setDate(item.date);
    setFormAccountId(item.accountId ?? defaultDepositAccountId);
    setIsModalOpen(true);
  };

  const handleLogIncome = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!amount || !sourceName) return;

    const transactionData = {
      date,
      description: sourceName,
      category,
      type: 'Income' as const,
      amount: parseFloat(amount),
      accountId: formAccountId ? Number(formAccountId) : undefined,
    };

    try {
      if (editId) {
        await updateTransaction(editId, transactionData);
        showNotification('success', 'Income updated successfully');
      } else {
        await addTransaction(transactionData);
        showNotification('success', 'Income recorded successfully');
      }
      closeModal();
    } catch {
      showNotification('error', 'Failed to save income entry');
    }
  };

  if (loading) {
    return (
      <div
        className="dashboard-page dashboard-page--wide"
        style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}
      >
        <div
          className="content-panel"
          style={{ minWidth: 'min(92vw, 340px)', textAlign: 'center' }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              border: '3px solid rgba(255, 255, 255, 0.12)',
              borderTopColor: '#34d399',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <div style={{ color: '#ffffff', fontWeight: '800' }}>Loading income dashboard...</div>
          <div style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
            Preparing source, period, and payout analytics.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page dashboard-page--wide">
      <div className="page-header">
        <div>
          <div className="page-kicker">
            <Sparkles size={14} />
            Income command center
          </div>
          <h1 className="page-title" style={{ marginTop: '14px' }}>
            Income
          </h1>
          <p className="page-subtitle" style={{ marginTop: '10px', maxWidth: '740px' }}>
            Manage salaries, side income, and recurring payouts in a clearer operating dashboard
            with better filters, stronger source visibility, and a cleaner edit flow.
          </p>
        </div>

        <div className="dashboard-toolbar__actions">
          <button type="button" className="toolbar-btn-secondary" onClick={resetFilters}>
            <RotateCcw size={18} />
            Reset view
          </button>
          <button
            type="button"
            className="header-add-btn header-add-btn--green"
            onClick={openCreateModal}
          >
            <Plus size={18} />
            Add Income
          </button>
        </div>
      </div>

      <section className="dashboard-hero-panel fade-in">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
            gap: '24px',
            alignItems: 'center',
          }}
        >
          <div>
            <div className="page-kicker" style={{ marginBottom: '12px' }}>
              <TrendingUp size={14} />
              {getPeriodLabel(selectedPeriod)}
            </div>
            <div
              style={{
                fontSize: 'clamp(2.2rem, 6vw, 4rem)',
                fontWeight: '900',
                color: '#ffffff',
                letterSpacing: '-0.06em',
                lineHeight: 0.94,
              }}
            >
              {formatCurrency(stats.total)}
            </div>
            <div style={{ marginTop: '10px', color: 'var(--text-secondary)', maxWidth: '620px' }}>
              {stats.count > 0
                ? `${stats.count} recorded payment${stats.count === 1 ? '' : 's'} from ${
                    stats.sourcesCount
                  } active source${stats.sourcesCount === 1 ? '' : 's'}.`
                : 'No income entries match the current filters. Adjust the view or record a new payout.'}
            </div>
          </div>

          <div className="dashboard-insight-grid">
            <div className="dashboard-progress-row">
              <div className="ios-section-subtitle">Top source</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#ffffff' }}>
                {stats.topSource}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
                {formatCurrency(stats.topSourceTotal)} in visible entries
              </div>
            </div>
            <div className="dashboard-progress-row">
              <div className="ios-section-subtitle">Top category</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#ffffff' }}>
                {stats.topCategory}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
                {formatCurrency(stats.topCategoryTotal)} in the current slice
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-chip-row" style={{ marginTop: '18px' }}>
          <div className="dashboard-chip dashboard-chip--success">
            <TrendingUp size={14} />
            Average payment {formatCurrency(stats.average)}
          </div>
          <div className="dashboard-chip dashboard-chip--accent">
            <Layers size={14} />
            Active sources {stats.sourcesCount}
          </div>
          <div className="dashboard-chip">
            <Wallet size={14} />
            Default deposit {getAccountName(settings.defaultSalaryAccountId)}
          </div>
          {selectedPeriod !== 'all' && (
            <div
              className={
                stats.trend >= 0
                  ? 'dashboard-chip dashboard-chip--success'
                  : 'dashboard-chip dashboard-chip--danger'
              }
            >
              {stats.trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {Math.abs(stats.trend).toFixed(1)}% vs previous period
            </div>
          )}
        </div>
      </section>

      <section className="dashboard-kpi-grid fade-in">
        <div className="dashboard-kpi-card">
          <div className="ios-section-subtitle">Total Received</div>
          <div
            style={{
              marginTop: '12px',
              fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
              fontWeight: '900',
              color: '#8de7ca',
              letterSpacing: '-0.05em',
            }}
          >
            {formatCurrency(stats.total)}
          </div>
          <div style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
            Total visible income for {getPeriodLabel(selectedPeriod).toLowerCase()}.
          </div>
        </div>
        <div className="dashboard-kpi-card">
          <div className="ios-section-subtitle">Average Payment</div>
          <div
            style={{
              marginTop: '12px',
              fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
              fontWeight: '900',
              color: '#ffffff',
              letterSpacing: '-0.05em',
            }}
          >
            {formatCurrency(stats.average)}
          </div>
          <div style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
            Across {stats.count} payment{stats.count === 1 ? '' : 's'} in view.
          </div>
        </div>
        <div className="dashboard-kpi-card">
          <div className="ios-section-subtitle">Active Sources</div>
          <div
            style={{
              marginTop: '12px',
              fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
              fontWeight: '900',
              color: '#5aa7ff',
              letterSpacing: '-0.05em',
            }}
          >
            {stats.sourcesCount}
          </div>
          <div style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
            Unique employers, gigs, or payout streams.
          </div>
        </div>
        <div className="dashboard-kpi-card">
          <div className="ios-section-subtitle">Largest Payment</div>
          <div
            style={{
              marginTop: '12px',
              fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
              fontWeight: '900',
              color: '#ffffff',
              letterSpacing: '-0.05em',
            }}
          >
            {stats.largestIncome ? formatCurrency(stats.largestIncome.amount) : 'No data'}
          </div>
          <div style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
            {stats.largestIncome
              ? stats.largestIncome.description
              : 'Record income to populate this card.'}
          </div>
        </div>
      </section>

      <section className="dashboard-split">
        <aside className="dashboard-side-rail">
          <div className="dashboard-filter-panel">
            <div className="page-kicker" style={{ marginBottom: '12px' }}>
              <CalendarIcon size={14} />
              Period
            </div>
            <div className="dashboard-pill-switch">
              {(['month', 'quarter', 'year', 'all'] as const).map((period) => (
                <button
                  key={period}
                  type="button"
                  className={
                    selectedPeriod === period
                      ? 'dashboard-pill-switch__btn dashboard-pill-switch__btn--active'
                      : 'dashboard-pill-switch__btn'
                  }
                  onClick={() => setSelectedPeriod(period)}
                >
                  {period === 'month'
                    ? 'Month'
                    : period === 'quarter'
                      ? 'Quarter'
                      : period === 'year'
                        ? 'Year'
                        : 'All time'}
                </button>
              ))}
            </div>
          </div>

          <div className="dashboard-filter-panel">
            <div className="page-kicker" style={{ marginBottom: '12px' }}>
              <Search size={14} />
              Search and filter
            </div>
            <div style={{ display: 'grid', gap: '14px' }}>
              <div>
                <label className="form-label">Source</label>
                <input
                  className="form-input"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Employer, client, or income note"
                />
              </div>
              <div>
                <label className="form-label">Category</label>
                <select
                  className="form-input"
                  value={filterCategory}
                  onChange={(event) => setFilterCategory(event.target.value)}
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Deposit account</label>
                <select
                  className="form-input"
                  value={filterAccount}
                  onChange={(event) =>
                    setFilterAccount(
                      event.target.value === 'All' ? 'All' : Number(event.target.value)
                    )
                  }
                >
                  <option value="All">All accounts</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>
              {hasActiveFilters && (
                <button type="button" className="toolbar-btn-secondary" onClick={resetFilters}>
                  <RotateCcw size={16} />
                  Reset filters
                </button>
              )}
            </div>
          </div>

          <div className="dashboard-surface">
            <div className="ios-section-header">
              <div className="ios-section-title">
                <div
                  className="ios-section-icon"
                  style={{
                    color: '#34d399',
                    background: 'rgba(52, 211, 153, 0.14)',
                    borderColor: 'rgba(52, 211, 153, 0.24)',
                  }}
                >
                  <Sparkles size={18} />
                </div>
                <div>
                  <div className="ios-section-label">Income lens</div>
                  <div className="ios-section-subtitle">
                    Operational highlights for the current slice
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-stack">
              <div className="dashboard-progress-row">
                <div className="ios-section-subtitle">Last received</div>
                <div style={{ fontSize: '1rem', fontWeight: '900', color: '#ffffff' }}>
                  {stats.lastReceived ? stats.lastReceived.description : 'No data'}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                  {stats.lastReceived
                    ? formatFullDate(stats.lastReceived.date)
                    : 'No visible income yet'}
                </div>
              </div>
              <div className="dashboard-progress-row">
                <div className="ios-section-subtitle">Default deposit account</div>
                <div style={{ fontSize: '1rem', fontWeight: '900', color: '#ffffff' }}>
                  {getAccountName(settings.defaultSalaryAccountId)}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                  Used as the starting account when creating a new income entry.
                </div>
              </div>
              <div className="dashboard-progress-row">
                <div className="ios-section-subtitle">Top category</div>
                <div style={{ fontSize: '1rem', fontWeight: '900', color: '#ffffff' }}>
                  {stats.topCategory}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                  {formatCurrency(stats.topCategoryTotal)} in this category.
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="dashboard-feed-panel">
          <div className="content-panel">
            <div className="ios-section-header">
              <div className="ios-section-title">
                <div
                  className="ios-section-icon"
                  style={{
                    color: '#34d399',
                    background: 'rgba(52, 211, 153, 0.14)',
                    borderColor: 'rgba(52, 211, 153, 0.24)',
                  }}
                >
                  <Layers size={18} />
                </div>
                <div>
                  <div className="ios-section-label">Source and category mix</div>
                  <div className="ios-section-subtitle">
                    {stats.count} payment{stats.count === 1 ? '' : 's'} in{' '}
                    {getPeriodLabel(selectedPeriod)}
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-insight-grid">
              <div className="dashboard-stack">
                {categoryBreakdown.length > 0 ? (
                  categoryBreakdown.slice(0, 5).map((item) => {
                    const config = categoryConfig[item.name] || categoryConfig.Other;
                    return (
                      <div key={item.name} className="dashboard-progress-row">
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: '12px',
                            alignItems: 'center',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div
                              className="dashboard-record-card__icon"
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '14px',
                                background: `${config.color}22`,
                                color: config.color,
                              }}
                            >
                              {config.icon}
                            </div>
                            <div>
                              <div style={{ fontWeight: '800', color: '#ffffff' }}>
                                {config.label}
                              </div>
                              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                {config.note}
                              </div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ color: '#ffffff', fontWeight: '900' }}>
                              {formatCurrency(item.total)}
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                              {item.share.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        <div
                          style={{
                            height: '8px',
                            borderRadius: '999px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.max(item.share, 4)}%`,
                              height: '100%',
                              borderRadius: '999px',
                              background: config.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="dashboard-empty">
                    <EmptyTransactionsVisual />
                    <h3 style={{ marginTop: '22px', color: '#ffffff' }}>
                      No income distribution yet
                    </h3>
                    <p
                      style={{
                        color: 'var(--text-secondary)',
                        maxWidth: '360px',
                        margin: '10px auto 0',
                      }}
                    >
                      Add an income record to start seeing category trends and source mix.
                    </p>
                  </div>
                )}
              </div>

              <div className="dashboard-stack">
                {sourceBreakdown.length > 0 ? (
                  sourceBreakdown.slice(0, 5).map((source) => (
                    <div key={source.name} className="dashboard-progress-row">
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: '12px',
                          alignItems: 'flex-start',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: '800', color: '#ffffff' }}>{source.name}</div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                            {source.count} payment{source.count === 1 ? '' : 's'} • Last{' '}
                            {formatFullDate(source.lastDate)}
                          </div>
                        </div>
                        <div style={{ color: '#8de7ca', fontWeight: '900' }}>
                          {formatCurrency(source.total)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="dashboard-empty">
                    <EmptyTransactionsVisual />
                    <h3 style={{ marginTop: '22px', color: '#ffffff' }}>No source history yet</h3>
                    <p
                      style={{
                        color: 'var(--text-secondary)',
                        maxWidth: '360px',
                        margin: '10px auto 0',
                      }}
                    >
                      Visible income sources will appear here as soon as entries are recorded.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="content-panel">
            <div className="ios-section-header">
              <div className="ios-section-title">
                <div
                  className="ios-section-icon"
                  style={{
                    color: '#5aa7ff',
                    background: 'rgba(90, 167, 255, 0.14)',
                    borderColor: 'rgba(90, 167, 255, 0.24)',
                  }}
                >
                  <CalendarIcon size={18} />
                </div>
                <div>
                  <div className="ios-section-label">Income timeline</div>
                  <div className="ios-section-subtitle">
                    Grouped monthly for faster review and cleaner editing
                  </div>
                </div>
              </div>
            </div>

            {groupedIncome.length > 0 ? (
              <div className="dashboard-stack">
                {groupedIncome.map((group) => (
                  <section key={group.key} className="dashboard-record-group">
                    <div className="dashboard-record-group__header">
                      <div className="dashboard-record-group__label">
                        <CalendarIcon size={14} />
                        {group.label}
                      </div>
                      <div className="dashboard-record-group__line" />
                      <div
                        style={{
                          color: 'var(--text-tertiary)',
                          fontSize: '0.74rem',
                          fontWeight: '800',
                        }}
                      >
                        {formatCurrency(group.total)}
                      </div>
                    </div>

                    {group.items.map((item) => {
                      const config = categoryConfig[String(item.category)] || categoryConfig.Other;

                      return (
                        <div key={item.id} className="dashboard-record-card">
                          <div className="dashboard-record-card__main">
                            <div
                              className="dashboard-record-card__icon"
                              style={{ background: `${config.color}22`, color: config.color }}
                            >
                              {config.icon}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div className="dashboard-record-card__title">{item.description}</div>
                              <div className="dashboard-record-card__meta">
                                <span className="dashboard-chip" style={{ minHeight: '26px' }}>
                                  {config.label}
                                </span>
                                <span>{formatFullDate(item.date)}</span>
                                <span>{getAccountName(item.accountId)}</span>
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '14px',
                              flexWrap: 'wrap',
                              justifyContent: 'flex-end',
                            }}
                          >
                            <div
                              className="dashboard-record-card__amount"
                              style={{ color: '#8de7ca' }}
                            >
                              +{formatCurrency(item.amount)}
                            </div>
                            <div className="dashboard-record-card__actions">
                              <button
                                type="button"
                                className="action-btn action-btn--edit"
                                onClick={() => handleEdit(item)}
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                type="button"
                                className="action-btn action-btn--delete"
                                onClick={async () => {
                                  const confirmed = await customConfirm({
                                    title: 'Delete income entry?',
                                    message: 'This income record will be permanently removed.',
                                    type: 'error',
                                    confirmLabel: 'Delete',
                                  });
                                  if (confirmed) {
                                    await deleteTransaction(item.id);
                                    showNotification('success', 'Income entry removed');
                                  }
                                }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </section>
                ))}
              </div>
            ) : (
              <div className="dashboard-empty">
                <EmptyTransactionsVisual />
                <h3 style={{ marginTop: '24px', color: '#ffffff' }}>No income matches this view</h3>
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    maxWidth: '420px',
                    margin: '10px auto 0',
                  }}
                >
                  Try broadening your filters or record a new payout to populate the timeline.
                </p>
                <div
                  className="dashboard-chip-row"
                  style={{ justifyContent: 'center', marginTop: '20px' }}
                >
                  <button type="button" className="toolbar-btn-secondary" onClick={resetFilters}>
                    <RotateCcw size={16} />
                    Reset filters
                  </button>
                  <button
                    type="button"
                    className="header-add-btn header-add-btn--green"
                    onClick={openCreateModal}
                  >
                    <Plus size={16} />
                    Add income
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {isModalOpen && (
        <div
          className="modal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="modal-card" style={{ maxWidth: '560px' }}>
            <button type="button" className="modal-close" onClick={closeModal}>
              <X size={20} />
            </button>

            <div className="modal-title">
              {editId ? 'Edit Income Entry' : 'Record Income Entry'}
            </div>
            <div className="modal-subtitle">
              Capture salary, freelance, and investment payouts in a cleaner workflow.
            </div>

            <form
              onSubmit={handleLogIncome}
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              <div>
                <label className="form-label">Source</label>
                <input
                  className="form-input form-input--green"
                  value={sourceName}
                  onChange={(event) => setSourceName(event.target.value)}
                  placeholder="Employer, client, rental unit"
                  required
                />
              </div>

              <div className="dashboard-insight-grid">
                <div>
                  <label className="form-label">Amount</label>
                  <input
                    className="form-input form-input--green"
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Date</label>
                  <input
                    className="form-input form-input--green"
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                  />
                </div>
              </div>

              <div className="dashboard-insight-grid">
                <div>
                  <label className="form-label">Category</label>
                  <select
                    className="form-input form-input--green"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                  >
                    {Object.keys(categoryConfig).map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Deposit account</label>
                  <select
                    className="form-input form-input--green"
                    value={formAccountId}
                    onChange={(event) =>
                      setFormAccountId(event.target.value ? Number(event.target.value) : '')
                    }
                  >
                    <option value="">No account link</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({formatCurrency(account.balance)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="dashboard-chip-row">
                <div className="dashboard-chip dashboard-chip--success">
                  {categoryConfig[category]?.label ?? category}
                </div>
                <div className="dashboard-chip">
                  Deposit account {getAccountName(formAccountId || undefined)}
                </div>
              </div>

              <button type="submit" className="btn-primary btn-primary--green">
                {editId ? 'Save Income Changes' : 'Record Income'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
