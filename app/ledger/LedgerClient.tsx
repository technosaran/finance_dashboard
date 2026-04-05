'use client';

import { CSSProperties, FormEvent, useEffect, useMemo, useState } from 'react';
import { Transaction } from '@/lib/types';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit3,
  Filter,
  Plus,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { useLedger } from '../components/FinanceContext';
import { useNotifications } from '../components/NotificationContext';
import { EmptyTransactionsVisual } from '../components/Visuals';
import { exportTransactionsToCSV } from '../../lib/utils/export';
import { formatDateForInput } from '@/lib/utils/date';
import {
  buildMonthlyTotals,
  COMMON_TRANSACTION_CATEGORIES,
  filterTransactionsByTimeRange,
  matchesTransactionQuery,
  summarizeCategories,
  type TransactionTimeRange,
} from '@/lib/utils/transaction-insights';
import { getTransactionSaveErrorMessage } from '@/lib/utils/transaction-form';

const currencySymbol = '\u20B9';
const tableHeaders: Array<{ label: string; align?: CSSProperties['textAlign'] }> = [
  { label: 'Entry' },
  { label: 'Category' },
  { label: 'Account' },
  { label: 'Date' },
  { label: 'Amount', align: 'right' },
  { label: 'Actions', align: 'right' },
];

const CALENDAR_DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const RANGE_OPTIONS: TransactionTimeRange[] = ['This Month', 'This Year', 'All Time'];
const TYPE_FILTER_OPTIONS: Array<'All' | 'Income' | 'Expense'> = ['All', 'Income', 'Expense'];
const LEDGER_SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'history', label: 'History' },
  { id: 'activity', label: 'Activity' },
] as const;

type LedgerSection = (typeof LEDGER_SECTIONS)[number]['id'];

const toCalendarDateStr = (year: number, month: number, day: number): string =>
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const getPillStyle = (background: string, color: string): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '4px 10px',
  borderRadius: '999px',
  background,
  color,
  fontSize: '0.72rem',
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
});

export default function LedgerClient() {
  const { transactions, accounts, addTransaction, updateTransaction, deleteTransaction, loading } =
    useLedger();
  const { showNotification, confirm: customConfirm } = useNotifications();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'Income' | 'Expense'>('Expense');
  const [accountId, setAccountId] = useState<string>('');

  const today = new Date();
  const [calendarDate, setCalendarDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [rangeFilter, setRangeFilter] = useState<TransactionTimeRange>('All Time');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Income' | 'Expense'>('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [accountFilter, setAccountFilter] = useState('All');
  const [activeSection, setActiveSection] = useState<LedgerSection>('overview');

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  const accountNameById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account.name])),
    [accounts]
  );

  const rangeScopedTransactions = useMemo(
    () => filterTransactionsByTimeRange(transactions, rangeFilter),
    [rangeFilter, transactions]
  );

  const availableCategories = useMemo(
    () =>
      [
        ...new Set(
          rangeScopedTransactions.map((transaction) => String(transaction.category || 'Other'))
        ),
      ].sort((left, right) => left.localeCompare(right)),
    [rangeScopedTransactions]
  );

  const effectiveCategoryFilter =
    categoryFilter !== 'All' && !availableCategories.includes(categoryFilter)
      ? 'All'
      : categoryFilter;

  const filteredTransactions = useMemo(() => {
    let result = rangeScopedTransactions;

    if (selectedCalendarDate) {
      result = result.filter((transaction) => transaction.date === selectedCalendarDate);
    }

    if (typeFilter !== 'All') {
      result = result.filter((transaction) => transaction.type === typeFilter);
    }

    if (effectiveCategoryFilter !== 'All') {
      result = result.filter(
        (transaction) => String(transaction.category) === effectiveCategoryFilter
      );
    }

    if (accountFilter === 'unassigned') {
      result = result.filter((transaction) => !transaction.accountId);
    } else if (accountFilter !== 'All') {
      result = result.filter((transaction) => String(transaction.accountId) === accountFilter);
    }

    return result;
  }, [
    accountFilter,
    effectiveCategoryFilter,
    rangeScopedTransactions,
    selectedCalendarDate,
    typeFilter,
  ]);

  const sortedTransactions = useMemo(() => {
    let result = filteredTransactions;

    if (searchQuery) {
      result = result.filter((transaction) =>
        matchesTransactionQuery(
          transaction,
          searchQuery,
          transaction.accountId ? (accountNameById.get(transaction.accountId) ?? '') : ''
        )
      );
    }

    return result.sort((left, right) => {
      const dateCompare = right.date.localeCompare(left.date);
      return dateCompare !== 0 ? dateCompare : right.id - left.id;
    });
  }, [accountNameById, filteredTransactions, searchQuery]);

  const totalIncome = useMemo(
    () =>
      sortedTransactions.filter((t) => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0),
    [sortedTransactions]
  );

  const totalExpenses = useMemo(
    () =>
      sortedTransactions.filter((t) => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0),
    [sortedTransactions]
  );

  const netBalance = totalIncome - totalExpenses;

  const transactionCountByDate = useMemo(() => {
    const counts = new Map<string, number>();
    transactions.forEach((transaction) => {
      counts.set(transaction.date, (counts.get(transaction.date) || 0) + 1);
    });
    return counts;
  }, [transactions]);

  const insightTransactions = searchQuery ? sortedTransactions : filteredTransactions;
  const monthlyData = useMemo(
    () => buildMonthlyTotals(insightTransactions, 6),
    [insightTransactions]
  );
  const categoryBreakdown = useMemo(
    () => summarizeCategories(insightTransactions),
    [insightTransactions]
  );
  const topCategory = categoryBreakdown[0];
  const maxMonthlyTotal = Math.max(...monthlyData.map((item) => item.total), 1);

  const topAccountName = useMemo(() => {
    const grouped = new Map<string, number>();

    insightTransactions.forEach((transaction) => {
      const key = transaction.accountId
        ? (accountNameById.get(transaction.accountId) ?? 'Unknown Account')
        : 'No Account';
      grouped.set(key, (grouped.get(key) || 0) + transaction.amount);
    });

    return [...grouped.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? 'No Account';
  }, [accountNameById, insightTransactions]);

  const activeFilterCount =
    (rangeFilter !== 'All Time' ? 1 : 0) +
    (typeFilter !== 'All' ? 1 : 0) +
    (effectiveCategoryFilter !== 'All' ? 1 : 0) +
    (accountFilter !== 'All' ? 1 : 0) +
    (selectedCalendarDate ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const canResetFilters = activeFilterCount > 0;

  const formatCurrency = (value: number) => `${currencySymbol}${value.toLocaleString()}`;
  const formatDate = (value: string) =>
    new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const resetForm = () => {
    setDescription('');
    setCategory('');
    setAmount('');
    setType('Expense');
    setDate(formatDateForInput(new Date()));
    setAccountId('');
    setEditId(null);
  };

  const handleClearFilters = () => {
    setRangeFilter('All Time');
    setTypeFilter('All');
    setCategoryFilter('All');
    setAccountFilter('All');
    setSelectedCalendarDate(null);
    setSearchQuery('');
  };

  const handleExport = () => {
    if (sortedTransactions.length === 0) {
      showNotification('error', 'No transactions match the current filters');
      return;
    }

    exportTransactionsToCSV(
      sortedTransactions.map((transaction) => ({
        date: transaction.date,
        description: transaction.description,
        category: transaction.category,
        type: transaction.type,
        account: transaction.accountId
          ? (accountNameById.get(transaction.accountId) ?? 'No Account')
          : 'No Account',
        amount: transaction.amount,
      })),
      {
        headers: ['date', 'description', 'category', 'type', 'account', 'amount'],
        filenamePrefix: 'ledger',
      }
    );

    showNotification('success', 'Filtered ledger exported successfully');
  };

  const handleEdit = (transaction: Transaction) => {
    setEditId(transaction.id);
    setDescription(transaction.description);
    setCategory(String(transaction.category));
    setAmount(transaction.amount.toString());
    setType(transaction.type);
    setDate(transaction.date);
    setAccountId(transaction.accountId ? transaction.accountId.toString() : '');
    setIsModalOpen(true);
  };

  const handleAddTransaction = async (event: FormEvent) => {
    event.preventDefault();
    const parsedAmount = parseFloat(amount);

    if (
      !description.trim() ||
      !category.trim() ||
      Number.isNaN(parsedAmount) ||
      parsedAmount <= 0
    ) {
      showNotification('error', 'Enter a valid description, category, and amount');
      return;
    }

    const transactionData = {
      date,
      description: description.trim(),
      category: category.trim(),
      type,
      amount: parsedAmount,
      accountId: accountId ? parseInt(accountId, 10) : undefined,
    };

    try {
      if (editId) {
        await updateTransaction(editId, transactionData);
        showNotification('success', 'Transaction updated');
      } else {
        await addTransaction(transactionData);
        showNotification('success', 'Transaction recorded');
      }

      resetForm();
      setIsModalOpen(false);
    } catch (error) {
      showNotification(
        'error',
        getTransactionSaveErrorMessage(error, 'Failed to save transaction')
      );
    }
  };

  if (loading) {
    return (
      <div
        className="page-container page-surface"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            className="spin-animation"
            style={{
              width: '48px',
              height: '48px',
              border: '4px solid var(--accent-light)',
              borderTopColor: 'var(--accent)',
              borderRadius: '50%',
              margin: '0 auto 20px',
            }}
          />
          <div className="stat-label">Analyzing Ledger...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container page-surface fade-in page-shell">
      <div className="dashboard-header page-shell__header">
        <div>
          <h1 className="dashboard-title">Ledger</h1>
          <p className="stat-label" style={{ marginTop: '8px' }}>
            Filter, export, and review every income and expense movement in one place
          </p>
        </div>

        <div className="page-toolbar" style={{ display: 'flex', gap: '14px' }}>
          <button
            onClick={handleExport}
            className="secondary-btn hide-xs"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 20px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--surface-border)',
              color: 'var(--text-primary)',
              fontWeight: 700,
              fontSize: '0.9rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              e.currentTarget.style.borderColor = 'var(--surface-border)';
            }}
          >
            <Download size={18} /> Export
          </button>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="header-add-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 24px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.9rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(79, 70, 229, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.2)';
            }}
          >
            <Plus size={20} /> Add Entry
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div
        className="dashboard-grid page-shell__summary-grid"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          marginBottom: '32px',
          gap: '24px',
        }}
      >
        <div className="premium-card" style={{ padding: '24px' }}>
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
          >
            <div>
              <div className="stat-label">Filtered Income</div>
              <div
                className="stat-value"
                style={{
                  fontSize: '2rem',
                  marginTop: '4px',
                  background: 'linear-gradient(to bottom, #4ade80, #22c55e)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 950,
                }}
              >
                {formatCurrency(totalIncome)}
              </div>
            </div>
            <div
              style={{
                background: 'rgba(34, 197, 94, 0.1)',
                color: '#22c55e',
                padding: '12px',
                borderRadius: '12px',
              }}
            >
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        <div className="premium-card" style={{ padding: '24px' }}>
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
          >
            <div>
              <div className="stat-label">Filtered Expenses</div>
              <div
                className="stat-value"
                style={{
                  fontSize: '2rem',
                  marginTop: '4px',
                  background: 'linear-gradient(to bottom, #fb7185, #ef4444)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 950,
                }}
              >
                {formatCurrency(totalExpenses)}
              </div>
            </div>
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                padding: '12px',
                borderRadius: '12px',
              }}
            >
              <TrendingDown size={24} />
            </div>
          </div>
        </div>

        <div className="premium-card" style={{ padding: '24px' }}>
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
          >
            <div>
              <div className="stat-label">Net Cashflow</div>
              <div
                className="stat-value"
                style={{
                  fontSize: '2rem',
                  marginTop: '4px',
                  background:
                    netBalance >= 0
                      ? 'linear-gradient(to bottom, #1ea672, #146d63)'
                      : 'linear-gradient(to bottom, #f59e0b, #d97706)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 950,
                }}
              >
                {netBalance >= 0 ? '+' : '-'}
                {formatCurrency(Math.abs(netBalance))}
              </div>
            </div>
            <div
              style={{
                background: netBalance >= 0 ? 'rgba(30, 166, 114, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                color: netBalance >= 0 ? '#1ea672' : '#f59e0b',
                padding: '12px',
                borderRadius: '12px',
              }}
            >
              <Wallet size={24} />
            </div>
          </div>
        </div>

        <div className="premium-card" style={{ padding: '24px' }}>
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
          >
            <div>
              <div className="stat-label">Visible Entries</div>
              <div
                className="stat-value"
                style={{
                  fontSize: '2rem',
                  marginTop: '4px',
                  color: '#fff',
                  fontWeight: 950,
                }}
              >
                {sortedTransactions.length}
              </div>
              <div
                style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}
              >
                Results after filters
              </div>
            </div>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#94a3b8',
                padding: '12px',
                borderRadius: '12px',
              }}
            >
              <Activity size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="premium-card" style={{ padding: '20px', display: 'grid', gap: '16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '12px',
                background: 'rgba(99, 102, 241, 0.12)',
                color: '#818cf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Filter size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800 }}>Filter Workspace</div>
              <div className="stat-label" style={{ fontSize: '0.66rem', marginTop: '2px' }}>
                Export respects everything selected here
              </div>
            </div>
          </div>

          {canResetFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              style={{
                padding: '10px 14px',
                borderRadius: '999px',
                border: '1px solid var(--surface-border)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              Clear All Filters
            </button>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div className="page-tab-bar" style={{ display: 'flex', gap: '8px' }}>
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRangeFilter(option)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '999px',
                  border:
                    rangeFilter === option
                      ? '1px solid rgba(99, 102, 241, 0.32)'
                      : '1px solid transparent',
                  background:
                    rangeFilter === option ? 'rgba(99, 102, 241, 0.14)' : 'var(--surface-hover)',
                  color: rangeFilter === option ? '#c7d2fe' : 'var(--text-secondary)',
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {option}
              </button>
            ))}
          </div>

          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              minWidth: 'min(100%, 280px)',
              flex: '1 1 280px',
            }}
          >
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '12px',
                color: 'var(--text-secondary)',
              }}
            />
            <input
              type="text"
              placeholder="Search entry, category, account, or amount"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              style={{
                background: 'var(--surface-hover)',
                border: '1px solid var(--surface-border)',
                borderRadius: '999px',
                padding: '10px 14px 10px 36px',
                fontSize: '0.82rem',
                color: 'var(--text-primary)',
                width: '100%',
                outline: 'none',
              }}
            />
          </div>
        </div>

        <div
          className="form-grid-2"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}
        >
          <select
            value={effectiveCategoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="form-input"
            style={{ background: 'var(--surface-hover)' }}
          >
            <option value="All">All categories</option>
            {availableCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={accountFilter}
            onChange={(event) => setAccountFilter(event.target.value)}
            className="form-input"
            style={{ background: 'var(--surface-hover)' }}
          >
            <option value="All">All accounts</option>
            <option value="unassigned">No account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {TYPE_FILTER_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTypeFilter(option)}
                style={{
                  flex: 1,
                  minWidth: '88px',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: '1px solid transparent',
                  background:
                    typeFilter === option
                      ? option === 'Income'
                        ? 'rgba(34, 197, 94, 0.15)'
                        : option === 'Expense'
                          ? 'rgba(239, 68, 68, 0.15)'
                          : 'rgba(255, 255, 255, 0.08)'
                      : 'var(--surface-hover)',
                  color:
                    typeFilter === option
                      ? option === 'Income'
                        ? '#86efac'
                        : option === 'Expense'
                          ? '#fca5a5'
                          : '#fff'
                      : 'var(--text-secondary)',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {(selectedCalendarDate || activeFilterCount > 0) && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {selectedCalendarDate && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '999px',
                  background: 'rgba(99, 102, 241, 0.14)',
                  color: '#c7d2fe',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}
              >
                <Activity size={14} /> {formatDate(selectedCalendarDate)}
              </div>
            )}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '999px',
                background: 'rgba(255, 255, 255, 0.04)',
                color: 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.75rem',
              }}
            >
              {sortedTransactions.length} result{sortedTransactions.length === 1 ? '' : 's'}
            </div>
          </div>
        )}
      </div>

      <div
        className="mobile-tab-scroll page-tab-bar page-shell__tabs"
        style={{
          display: 'flex',
          width: 'fit-content',
          maxWidth: '100%',
          overflowX: 'auto',
          gap: '8px',
          padding: '6px',
          borderRadius: '20px',
          border: '1px solid var(--surface-border)',
          background: 'rgba(255,255,255,0.02)',
          marginTop: '24px',
        }}
      >
        {LEDGER_SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setActiveSection(section.id)}
            style={{
              padding: '10px 18px',
              borderRadius: '16px',
              border: 'none',
              background: activeSection === section.id ? '#6366f1' : 'transparent',
              color: activeSection === section.id ? '#fff' : 'var(--text-secondary)',
              fontWeight: 800,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {section.label}
          </button>
        ))}
      </div>

      {activeSection !== 'activity' && (
        <div
          className="dashboard-grid page-split-layout page-split-layout--aside-340"
          style={{
            display: 'grid',
            gridTemplateColumns:
              activeSection === 'history' ? 'minmax(0, 1fr)' : 'minmax(0, 1fr) 340px',
            gap: '24px',
            alignItems: 'start',
            marginTop: '24px',
          }}
        >
          <div className="premium-card" style={{ padding: 0, overflow: 'visible' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 24px',
                borderBottom: '1px solid var(--surface-border)',
              }}
            >
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {activeSection === 'history' ? 'Transaction History' : 'Transactions'}
              </h3>
              <div
                className="stat-label"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.66rem' }}
              >
                <Filter size={14} />
                {activeSection === 'history'
                  ? 'Full filtered ledger'
                  : canResetFilters
                    ? 'Filtered view'
                    : 'Full ledger'}
              </div>
            </div>

            <div
              className="hide-mobile"
              style={{
                position: 'relative',
                maxHeight: 'min(800px, 75vh)',
                overflowY: 'auto',
                scrollbarWidth: 'thin',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr
                    style={{
                      background: 'var(--surface)',
                      borderBottom: '1px solid var(--surface-border)',
                    }}
                  >
                    {tableHeaders.map((header) => (
                      <th
                        key={header.label}
                        style={{
                          padding: '12px 16px',
                          textAlign: header.align || 'left',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: 'var(--text-secondary)',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {header.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedTransactions.length > 0 ? (
                    sortedTransactions.map((transaction) => {
                      const isIncome = transaction.type === 'Income';
                      const accountName = transaction.accountId
                        ? (accountNameById.get(transaction.accountId) ?? 'N/A')
                        : 'N/A';

                      const getCategoryColor = (cat: string) => {
                        const c = cat.toLowerCase();
                        if (c.includes('food'))
                          return { bg: 'rgba(217, 119, 6, 0.15)', text: '#f59e0b' };
                        if (c.includes('transport'))
                          return { bg: 'rgba(99, 102, 241, 0.15)', text: '#818cf8' };
                        if (c.includes('shop'))
                          return { bg: 'rgba(236, 72, 153, 0.15)', text: '#f472b6' };
                        if (c.includes('health'))
                          return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399' };
                        if (c.includes('salary'))
                          return { bg: 'rgba(5, 150, 105, 0.2)', text: '#10b981' };
                        if (c.includes('invest'))
                          return { bg: 'rgba(139, 92, 246, 0.15)', text: '#a78bfa' };
                        return { bg: 'var(--accent-light)', text: 'var(--accent-hover)' };
                      };

                      const catColor = getCategoryColor(String(transaction.category));

                      return (
                        <tr
                          key={transaction.id}
                          onClick={() => handleEdit(transaction)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                          style={{
                            borderBottom: '1px solid var(--surface-border)',
                            cursor: 'pointer',
                            transition: 'all 0.24s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                          className="ledger-row-hover"
                        >
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <div
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '10px',
                                  background: isIncome
                                    ? 'rgba(34, 197, 94, 0.1)'
                                    : 'rgba(239, 68, 68, 0.1)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: isIncome ? '#22c55e' : '#ef4444',
                                }}
                              >
                                {isIncome ? (
                                  <ArrowUpRight size={18} />
                                ) : (
                                  <ArrowDownRight size={18} />
                                )}
                              </div>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {transaction.description}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span
                              style={{
                                padding: '6px 12px',
                                borderRadius: '100px',
                                background: catColor.bg,
                                color: catColor.text,
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                border: `1px solid ${catColor.bg.replace('0.15', '0.2').replace('0.2', '0.3')}`,
                              }}
                            >
                              {transaction.category}
                            </span>
                          </td>

                          <td style={{ padding: '12px 16px' }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '0.85rem',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              <Wallet size={14} /> {accountName}
                            </div>
                          </td>
                          <td
                            style={{
                              padding: '12px 16px',
                              fontSize: '0.85rem',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            {formatDate(transaction.date)}
                          </td>
                          <td
                            style={{
                              padding: '12px 16px',
                              textAlign: 'right',
                              fontWeight: 800,
                              color: isIncome ? '#22c55e' : '#ef4444',
                              fontSize: '1rem',
                              fontFamily:
                                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                              letterSpacing: '-0.02em',
                            }}
                          >
                            {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '8px',
                                alignItems: 'center',
                              }}
                            >
                              <button
                                title="Edit Entry"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(transaction);
                                }}
                                style={{
                                  color: 'var(--text-secondary)',
                                  padding: '8px',
                                  borderRadius: '10px',
                                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                  background: 'rgba(255, 255, 255, 0.03)',
                                  border: '1px solid rgba(255, 255, 255, 0.05)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    'rgba(99, 102, 241, 0.15)';
                                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.2)';
                                  e.currentTarget.style.color = '#818cf8';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    'rgba(255, 255, 255, 0.03)';
                                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                                  e.currentTarget.style.color = 'var(--text-secondary)';
                                }}
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                title="Delete Entry"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const confirmed = await customConfirm({
                                    title: 'Delete entry',
                                    message: 'Are you sure you want to delete this transaction?',
                                    type: 'error',
                                    confirmLabel: 'Delete',
                                  });
                                  if (confirmed) {
                                    await deleteTransaction(transaction.id);
                                    showNotification('success', 'Transaction deleted');
                                  }
                                }}
                                style={{
                                  color: 'var(--error)',
                                  padding: '8px',
                                  borderRadius: '10px',
                                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                  background: 'rgba(255, 255, 255, 0.03)',
                                  border: '1px solid rgba(255, 255, 255, 0.05)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                                  e.currentTarget.style.color = '#f87171';
                                  e.currentTarget.style.boxShadow =
                                    '0 0 10px rgba(239, 68, 68, 0.1)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    'rgba(255, 255, 255, 0.03)';
                                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                                  e.currentTarget.style.color = 'var(--error)';
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ padding: '80px 24px', textAlign: 'center' }}>
                        <EmptyTransactionsVisual />
                        <div
                          style={{
                            marginTop: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '1.1rem',
                              fontWeight: 800,
                              color: 'var(--text-primary)',
                            }}
                          >
                            {searchQuery || canResetFilters
                              ? 'No matches found'
                              : 'Clear as crystal'}
                          </div>
                          <div
                            style={{
                              fontSize: '0.85rem',
                              color: 'var(--text-secondary)',
                              fontWeight: 500,
                            }}
                          >
                            {searchQuery
                              ? `Try adjusting your search for "${searchQuery}"`
                              : canResetFilters
                                ? 'Clear one or more filters to widen the result set'
                                : 'Start by adding your first transaction to the ledger'}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mobile-card-list">
              {sortedTransactions.length > 0 ? (
                sortedTransactions.map((transaction) => {
                  const isIncome = transaction.type === 'Income';
                  const accountName = transaction.accountId
                    ? (accountNameById.get(transaction.accountId) ?? 'No Account')
                    : 'No Account';

                  return (
                    <div
                      key={transaction.id}
                      className="premium-card"
                      style={{
                        padding: '18px',
                        display: 'grid',
                        gap: '12px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: '12px',
                          alignItems: 'flex-start',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '12px', minWidth: 0 }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '12px',
                              background: isIncome
                                ? 'rgba(34, 197, 94, 0.1)'
                                : 'rgba(239, 68, 68, 0.1)',
                              color: isIncome ? '#22c55e' : '#ef4444',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {isIncome ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 800,
                                color: '#fff',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {transaction.description}
                            </div>
                            <div
                              className="stat-label"
                              style={{ marginTop: '4px', fontSize: '0.64rem' }}
                            >
                              {formatDate(transaction.date)}
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            fontWeight: 900,
                            color: isIncome ? '#22c55e' : '#ef4444',
                            fontSize: '0.98rem',
                            textAlign: 'right',
                          }}
                        >
                          {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={getPillStyle('rgba(255,255,255,0.06)', '#dbe4e2')}>
                          {transaction.category}
                        </span>
                        <span style={getPillStyle('rgba(255,255,255,0.04)', '#94a3b8')}>
                          {accountName}
                        </span>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          gap: '8px',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleEdit(transaction)}
                          className="action-btn--hover"
                          style={{
                            padding: '8px',
                            borderRadius: '10px',
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                          }}
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const confirmed = await customConfirm({
                              title: 'Delete entry',
                              message: 'Are you sure you want to delete this transaction?',
                              type: 'error',
                              confirmLabel: 'Delete',
                            });

                            if (confirmed) {
                              await deleteTransaction(transaction.id);
                              showNotification('success', 'Transaction deleted');
                            }
                          }}
                          className="action-btn-danger--hover"
                          style={{
                            padding: '8px',
                            borderRadius: '10px',
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--error)',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="premium-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
                  <EmptyTransactionsVisual />
                  <div style={{ marginTop: '16px', fontWeight: 800 }}>
                    {searchQuery || canResetFilters ? 'No matches found' : 'Clear as crystal'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {activeSection === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div
                className="premium-card"
                style={{ padding: '24px', display: 'grid', gap: '16px' }}
              >
                <h3
                  style={{
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <Wallet size={18} /> View Summary
                </h3>

                <div style={{ display: 'grid', gap: '12px' }}>
                  {[
                    {
                      label: 'Range',
                      value: rangeFilter,
                      meta: selectedCalendarDate
                        ? formatDate(selectedCalendarDate)
                        : 'No day pinned',
                      tone: 'rgba(255, 255, 255, 0.04)',
                      border: 'rgba(255, 255, 255, 0.06)',
                      color: 'var(--text-primary)',
                    },
                    {
                      label: 'Focus',
                      value: topCategory ? topCategory.name : 'No category yet',
                      meta: topCategory
                        ? `${formatCurrency(topCategory.total)} across ${topCategory.count} entr${
                            topCategory.count === 1 ? 'y' : 'ies'
                          }`
                        : 'Add transactions to see category concentration',
                      tone: 'rgba(34, 197, 94, 0.07)',
                      border: 'rgba(34, 197, 94, 0.12)',
                      color: '#86efac',
                    },
                    {
                      label: 'Lead Account',
                      value: topAccountName,
                      meta: `${sortedTransactions.length} visible entr${sortedTransactions.length === 1 ? 'y' : 'ies'}`,
                      tone: 'rgba(99, 102, 241, 0.08)',
                      border: 'rgba(99, 102, 241, 0.12)',
                      color: '#c7d2fe',
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '16px',
                        background: item.tone,
                        border: `1px solid ${item.border}`,
                      }}
                    >
                      <div className="stat-label" style={{ color: item.color }}>
                        {item.label}
                      </div>
                      <div style={{ marginTop: '6px', fontWeight: 800 }}>{item.value}</div>
                      <div className="stat-label" style={{ marginTop: '4px', fontSize: '0.64rem' }}>
                        {item.meta}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="premium-card"
                style={{ padding: '24px', display: 'grid', gap: '16px' }}
              >
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 900 }}>Momentum Note</h3>
                  <p className="stat-label" style={{ marginTop: '6px', fontSize: '0.68rem' }}>
                    Clean summary for the current ledger scope without repeating the activity
                    section
                  </p>
                </div>

                <div
                  style={{
                    padding: '16px',
                    borderRadius: '18px',
                    background:
                      netBalance >= 0 ? 'rgba(34, 197, 94, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                    border:
                      netBalance >= 0
                        ? '1px solid rgba(34, 197, 94, 0.14)'
                        : '1px solid rgba(245, 158, 11, 0.14)',
                  }}
                >
                  <div
                    className="stat-label"
                    style={{ color: netBalance >= 0 ? '#86efac' : '#fcd34d' }}
                  >
                    Net direction
                  </div>
                  <div style={{ marginTop: '8px', fontWeight: 900 }}>
                    {netBalance >= 0
                      ? 'Cashflow is positive in this view'
                      : 'Expenses are leading in this view'}
                  </div>
                  <div className="stat-label" style={{ marginTop: '6px', fontSize: '0.68rem' }}>
                    {netBalance >= 0 ? '+' : '-'}
                    {formatCurrency(Math.abs(netBalance))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveSection('activity')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '14px',
                    border: '1px solid var(--surface-border)',
                    background: 'rgba(255,255,255,0.03)',
                    color: 'var(--text-primary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Open activity workspace
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSection === 'activity' && (
        <div
          className="dashboard-grid page-split-layout"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            alignItems: 'start',
            marginTop: '24px',
          }}
        >
          <div className="premium-card" style={{ padding: '24px' }}>
            <h3
              style={{
                fontSize: '1.1rem',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <Activity size={20} className="text-glow" /> Activity Calendar
            </h3>
            {(() => {
              const calYear = calendarDate.getFullYear();
              const calMonth = calendarDate.getMonth();
              const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
              const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
              const monthName = calendarDate.toLocaleDateString(undefined, {
                month: 'long',
                year: 'numeric',
              });
              const cells = [
                ...Array(firstDayOfWeek).fill(null),
                ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
              ];

              return (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '16px',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{monthName}</div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => setCalendarDate(new Date(calYear, calMonth - 1, 1))}
                        className="glass-button"
                        style={{ padding: '4px', borderRadius: '8px' }}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalendarDate(new Date(calYear, calMonth + 1, 1))}
                        className="glass-button"
                        style={{ padding: '4px', borderRadius: '8px' }}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 1fr)',
                      gap: '8px',
                      textAlign: 'center',
                    }}
                  >
                    {CALENDAR_DAY_LABELS.map((label) => (
                      <div key={label} className="stat-label" style={{ fontSize: '0.65rem' }}>
                        {label}
                      </div>
                    ))}
                    {cells.map((day, idx) => {
                      if (day === null) return <div key={`activity-empty-${idx}`} />;

                      const dateStr = toCalendarDateStr(calYear, calMonth, day);
                      const isToday = dateStr === today.toISOString().split('T')[0];
                      const txCount = transactionCountByDate.get(dateStr) || 0;
                      const hasTx = txCount > 0;
                      const isSelected = selectedCalendarDate === dateStr;

                      return (
                        <div
                          key={`activity-${dateStr}`}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedCalendarDate(null);
                              return;
                            }

                            setRangeFilter('All Time');
                            setSelectedCalendarDate(dateStr);
                          }}
                          style={{
                            aspectRatio: '1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                            borderRadius: '8px',
                            background: isSelected
                              ? 'var(--accent)'
                              : isToday
                                ? 'var(--surface-hover)'
                                : hasTx
                                  ? 'var(--accent-light)'
                                  : 'transparent',
                            color: isSelected
                              ? '#fff'
                              : isToday
                                ? '#fff'
                                : hasTx
                                  ? 'var(--accent-hover)'
                                  : 'var(--text-secondary)',
                            fontWeight: isToday || hasTx || isSelected ? 700 : 400,
                            position: 'relative',
                            cursor: 'pointer',
                            border: isSelected
                              ? 'none'
                              : isToday
                                ? '1px solid var(--surface-border)'
                                : '1px solid transparent',
                            transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                            transition: 'all 0.2s',
                          }}
                        >
                          {day}
                          {hasTx && !isSelected && (
                            <div
                              style={{
                                minWidth: txCount > 1 ? '14px' : '4px',
                                height: txCount > 1 ? '14px' : '4px',
                                borderRadius: '999px',
                                background: isToday ? '#fff' : 'var(--accent)',
                                position: 'absolute',
                                bottom: '4px',
                                padding: txCount > 1 ? '0 4px' : '0',
                                color: '#071018',
                                fontSize: '0.55rem',
                                fontWeight: 900,
                                lineHeight: txCount > 1 ? '14px' : '4px',
                              }}
                            >
                              {txCount > 1 ? txCount : null}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="premium-card" style={{ padding: '24px', display: 'grid', gap: '16px' }}>
            <h3
              style={{
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <Wallet size={18} /> Snapshot
            </h3>

            <div style={{ display: 'grid', gap: '12px' }}>
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '16px',
                  background: 'rgba(34, 197, 94, 0.07)',
                  border: '1px solid rgba(34, 197, 94, 0.12)',
                }}
              >
                <div className="stat-label" style={{ color: '#86efac' }}>
                  Top Category
                </div>
                <div style={{ marginTop: '6px', fontWeight: 800 }}>
                  {topCategory ? topCategory.name : 'No category yet'}
                </div>
                <div className="stat-label" style={{ marginTop: '4px', fontSize: '0.64rem' }}>
                  {topCategory
                    ? `${formatCurrency(topCategory.total)} across ${topCategory.count} entr${
                        topCategory.count === 1 ? 'y' : 'ies'
                      }`
                    : 'Add transactions to see category concentration'}
                </div>
              </div>

              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '16px',
                  background: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.12)',
                }}
              >
                <div className="stat-label" style={{ color: '#c7d2fe' }}>
                  Top Account
                </div>
                <div style={{ marginTop: '6px', fontWeight: 800 }}>{topAccountName}</div>
                <div className="stat-label" style={{ marginTop: '4px', fontSize: '0.64rem' }}>
                  Highest tracked value in the current view
                </div>
              </div>

              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div className="stat-label">6-Month Pattern</div>
                <div
                  style={{ marginTop: '10px', display: 'flex', alignItems: 'flex-end', gap: '8px' }}
                >
                  {monthlyData.map((item, index) => (
                    <div
                      key={`activity-pattern-${item.key}`}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          minHeight: item.total > 0 ? '8px' : '4px',
                          height: `${(item.total / maxMonthlyTotal) * 72}px`,
                          borderRadius: '999px',
                          background:
                            index === monthlyData.length - 1
                              ? 'linear-gradient(180deg, #818cf8 0%, #6366f1 100%)'
                              : 'rgba(255, 255, 255, 0.12)',
                        }}
                      />
                      <span className="stat-label" style={{ fontSize: '0.58rem' }}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="premium-card" style={{ padding: '24px', display: 'grid', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 900 }}>Category Pulse</h3>
              <p className="stat-label" style={{ marginTop: '6px', fontSize: '0.68rem' }}>
                Top categories in the current ledger view
              </p>
            </div>

            {categoryBreakdown.length > 0 ? (
              categoryBreakdown.slice(0, 5).map((item) => (
                <div key={`pulse-${item.name}`} style={{ display: 'grid', gap: '8px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '12px',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ fontWeight: 800 }}>{item.name}</div>
                    <div style={{ fontWeight: 900 }}>{formatCurrency(item.total)}</div>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      borderRadius: '999px',
                      background: 'rgba(255,255,255,0.05)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(item.share, 100)}%`,
                        height: '100%',
                        borderRadius: '999px',
                        background: 'linear-gradient(90deg, #6366f1 0%, #22c55e 100%)',
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="stat-label">No category data yet.</div>
            )}
          </div>
        </div>
      )}

      {/* Modern Modal */}
      {isModalOpen && (
        <div
          className="ledger-modal-overlay fade-in"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '24px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            className="ledger-modal-card slide-up"
            style={{
              maxWidth: '500px',
              width: '100%',
              background: '#050505',
              borderRadius: '24px',
              border: '1px solid #111111',
              padding: '32px',
              boxShadow: '0 32px 64px rgba(0,0,0,0.6)',
              maxHeight: 'min(90vh, 800px)', // Fixed size, but allows content scroll if strictly needed for small screens
              overflow: 'hidden', // Non-scrollable overall
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              className="page-toolbar page-toolbar--spread"
              style={{
                marginBottom: '32px',
                flexShrink: 0,
              }}
            >
              <div>
                <h2 className="modal-title">{editId ? 'Edit Entry' : 'New Entry'}</h2>
                <p
                  className="modal-subtitle"
                  style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}
                >
                  Fill in the details below to record your transaction
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="modal-close"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleAddTransaction}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                overflowY: 'auto', // Scroll ONLY the form fields if vertical space is tight
                paddingRight: '4px',
                marginRight: '-4px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  background: 'rgba(255,255,255,0.02)',
                  padding: '4px',
                  borderRadius: '12px',
                  border: '1px solid #111111',
                  flexShrink: 0,
                }}
              >
                <button
                  type="button"
                  onClick={() => setType('Expense')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: type === 'Expense' ? '#ef4444' : 'transparent',
                    color: type === 'Expense' ? '#fff' : 'var(--text-secondary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setType('Income')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: type === 'Income' ? '#22c55e' : 'transparent',
                    color: type === 'Income' ? '#fff' : 'var(--text-secondary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  Income
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label
                  className="form-label"
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                  }}
                >
                  Description
                </label>
                <input
                  className="form-input"
                  placeholder="What was this for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  style={{
                    background: '#000',
                    border: '1px solid #111',
                    padding: '14px',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
              </div>

              <div
                className="form-grid-2"
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label
                    className="form-label"
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                    }}
                  >
                    Amount ({currencySymbol})
                  </label>
                  <input
                    className="form-input"
                    type="number"
                    step="any"
                    min="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    style={{
                      background: '#000',
                      border: '1px solid #111',
                      padding: '14px',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label
                    className="form-label"
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                    }}
                  >
                    Date
                  </label>
                  <input
                    className="form-input"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    style={{
                      background: '#000',
                      border: '1px solid #111',
                      padding: '14px',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  />
                </div>
              </div>

              <div
                className="form-grid-2"
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label
                    className="form-label"
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                    }}
                  >
                    Category
                  </label>
                  <input
                    className="form-input"
                    placeholder="e.g. Food"
                    list="ledger-category-options"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    style={{
                      background: '#000',
                      border: '1px solid #111',
                      padding: '14px',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label
                    className="form-label"
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                    }}
                  >
                    Account
                  </label>
                  <select
                    className="form-input"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    style={{
                      background: '#000',
                      border: '1px solid #111',
                      padding: '14px',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  >
                    <option value="">No Account</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <datalist id="ledger-category-options">
                {[...new Set([...COMMON_TRANSACTION_CATEGORIES, ...availableCategories])].map(
                  (item) => (
                    <option key={item} value={item} />
                  )
                )}
              </datalist>

              <button
                type="submit"
                className="btn-primary w-full"
                style={{
                  marginTop: '12px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4438ca 100%)',
                  padding: '16px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 8px 16px rgba(99, 102, 241, 0.25)',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '1rem',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(99, 102, 241, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(99, 102, 241, 0.25)';
                }}
              >
                {editId ? 'Update Entry' : 'Save Entry'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes ledgerFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes ledgerSlideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .fade-in {
          animation: ledgerFadeIn 0.35s ease-out;
        }
        .slide-up {
          animation: ledgerSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}
