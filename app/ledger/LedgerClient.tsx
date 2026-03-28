'use client';

import { useMemo, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { exportTransactionsToCSV } from '../../lib/utils/export';
import { useLedger } from '../components/FinanceContext';
import { useNotifications } from '../components/NotificationContext';
import { EmptyTransactionsVisual } from '../components/Visuals';
import { Transaction } from '@/lib/types';
import {
  ArrowDownRight,
  ArrowUpRight,
  Book,
  Calendar as CalendarIcon,
  Clock,
  Download,
  Edit3,
  History,
  Layers,
  Plus,
  RotateCcw,
  Search,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';

function formatCurrency(value: number): string {
  return `Rs ${value.toLocaleString('en-IN')}`;
}

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatCompactDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatGroupLabel(date: string): string {
  const today = new Date();
  const groupDate = new Date(`${date}T00:00:00`);
  const isToday =
    groupDate.getDate() === today.getDate() &&
    groupDate.getMonth() === today.getMonth() &&
    groupDate.getFullYear() === today.getFullYear();

  if (isToday) return 'Today';

  return groupDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

export default function LedgerClient() {
  const { transactions, accounts, addTransaction, updateTransaction, deleteTransaction, loading } =
    useLedger();
  const { showNotification, confirm: customConfirm } = useNotifications();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterAccount, setFilterAccount] = useState<number | 'All'>('All');
  const [filterType, setFilterType] = useState<'All' | 'Income' | 'Expense'>('All');

  const [date, setDate] = useState(toLocalDateKey(new Date()));
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'Income' | 'Expense'>('Expense');
  const [accountId, setAccountId] = useState<string>('');

  const categories = [
    'All',
    ...new Set(transactions.map((transaction) => transaction.category)),
  ].sort() as string[];

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesSearch =
        transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (typeof transaction.category === 'string' &&
          transaction.category.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = filterCategory === 'All' || transaction.category === filterCategory;
      const matchesAccount = filterAccount === 'All' || transaction.accountId === filterAccount;
      const matchesType = filterType === 'All' || transaction.type === filterType;
      const matchesDate = !selectedDate || transaction.date === toLocalDateKey(selectedDate);

      return matchesSearch && matchesCategory && matchesAccount && matchesType && matchesDate;
    });
  }, [transactions, searchQuery, filterCategory, filterAccount, filterType, selectedDate]);

  const groupedTransactions = useMemo(() => {
    const grouped: Record<string, Transaction[]> = {};

    filteredTransactions.forEach((transaction) => {
      if (!grouped[transaction.date]) {
        grouped[transaction.date] = [];
      }

      grouped[transaction.date].push(transaction);
    });

    return Object.entries(grouped)
      .sort((first, second) => second[0].localeCompare(first[0]))
      .map(([groupDate, groupItems]) => ({
        date: groupDate,
        items: groupItems.sort((first, second) => second.id - first.id),
      }));
  }, [filteredTransactions]);

  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter((transaction) => transaction.type === 'Income')
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const expense = filteredTransactions
      .filter((transaction) => transaction.type === 'Expense')
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const movement = income + expense;
    const averageMovement =
      filteredTransactions.length > 0 ? movement / filteredTransactions.length : 0;
    const activeDays = new Set(filteredTransactions.map((transaction) => transaction.date)).size;
    const linkedAccounts = new Set(
      filteredTransactions
        .map((transaction) => transaction.accountId)
        .filter((value): value is number => typeof value === 'number')
    ).size;
    const largestMovement = filteredTransactions.reduce<Transaction | null>(
      (largest, transaction) => {
        if (!largest) return transaction;
        return transaction.amount > largest.amount ? transaction : largest;
      },
      null
    );

    return {
      income,
      expense,
      net: income - expense,
      count: filteredTransactions.length,
      averageMovement,
      activeDays,
      linkedAccounts,
      largestMovement,
    };
  }, [filteredTransactions]);

  const hasActiveFilters =
    selectedDate !== null ||
    searchQuery.length > 0 ||
    filterCategory !== 'All' ||
    filterAccount !== 'All' ||
    filterType !== 'All';

  const filterSummary = [
    selectedDate
      ? {
          label: `Date ${selectedDate.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
          })}`,
        }
      : null,
    filterType !== 'All' ? { label: `Type ${filterType}` } : null,
    filterCategory !== 'All' ? { label: `Category ${filterCategory}` } : null,
    filterAccount !== 'All'
      ? {
          label: `Account ${
            accounts.find((account) => account.id === filterAccount)?.name ?? 'Custom'
          }`,
        }
      : null,
    searchQuery.trim() ? { label: `Search "${searchQuery.trim()}"` } : null,
  ].filter((item): item is { label: string } => Boolean(item));

  const getAccountName = (id?: number) => {
    if (!id) return 'No account linked';

    const account = accounts.find((item) => item.id === id);
    return account ? account.name : 'Unknown account';
  };

  const resetForm = () => {
    setDescription('');
    setCategory('');
    setAmount('');
    setType('Expense');
    setDate(toLocalDateKey(new Date()));
    setAccountId('');
    setEditId(null);
  };

  const resetFilters = () => {
    setSelectedDate(null);
    setSearchQuery('');
    setFilterCategory('All');
    setFilterAccount('All');
    setFilterType('All');
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditId(transaction.id);
    setDescription(transaction.description);
    setCategory(transaction.category as string);
    setAmount(transaction.amount.toString());
    setType(transaction.type);
    setDate(transaction.date);
    setAccountId(transaction.accountId ? transaction.accountId.toString() : '');
    setIsModalOpen(true);
  };

  const handleAddTransaction = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!description || !amount || !category) return;

    const transactionData = {
      date,
      description,
      category,
      type,
      amount: parseFloat(amount),
      accountId: accountId ? parseInt(accountId, 10) : undefined,
    };

    try {
      if (editId) {
        await updateTransaction(editId, transactionData);
        showNotification('success', 'Transaction updated successfully');
      } else {
        await addTransaction(transactionData);
        showNotification('success', 'Transaction recorded successfully');
      }

      resetForm();
      setIsModalOpen(false);
    } catch {
      showNotification('error', 'Failed to save transaction');
    }
  };

  if (loading) {
    return (
      <div
        className="dashboard-page dashboard-page--wide"
        style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}
      >
        <div className="premium-card" style={{ minWidth: 'min(92vw, 320px)', textAlign: 'center' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              border: '3px solid rgba(255, 255, 255, 0.12)',
              borderTopColor: '#84d8ff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <div style={{ color: '#ffffff', fontWeight: '800' }}>Loading ledger activity...</div>
          <div style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
            Preparing records, balances, and filters.
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
            <Book size={14} />
            Finance operations ledger
          </div>
          <h1 className="page-title" style={{ marginTop: '14px' }}>
            Ledger
          </h1>
          <p className="page-subtitle" style={{ marginTop: '10px' }}>
            Review inflows and outflows with a cleaner operations dashboard, tighter filters, and a
            more readable activity feed.
          </p>
        </div>

        <div className="dashboard-toolbar__actions">
          <button
            type="button"
            className="toolbar-btn-secondary"
            onClick={() => {
              exportTransactionsToCSV(transactions);
              showNotification('success', 'Ledger exported to CSV');
            }}
          >
            <Download size={18} />
            Export
          </button>
          <button type="button" className="header-add-btn" onClick={openCreateModal}>
            <Plus size={18} />
            Record Entry
          </button>
        </div>
      </div>

      <section className="dashboard-hero-panel fade-in">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: '20px',
            alignItems: 'center',
          }}
        >
          <div>
            <div className="page-kicker" style={{ marginBottom: '12px' }}>
              <History size={14} />
              Live view
            </div>
            <div
              style={{
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                fontWeight: '900',
                color: '#ffffff',
                letterSpacing: '-0.05em',
                lineHeight: 0.96,
              }}
            >
              {stats.count} entries
            </div>
            <div style={{ marginTop: '10px', color: 'var(--text-secondary)', maxWidth: '620px' }}>
              {hasActiveFilters
                ? 'Your activity feed is narrowed by one or more filters.'
                : 'All recorded cash movement is visible across every account and category.'}
            </div>
          </div>

          <div className="dashboard-chip-row" style={{ justifyContent: 'flex-start' }}>
            <div className="dashboard-chip dashboard-chip--success">
              <TrendingUp size={14} />
              Inflow {formatCurrency(stats.income)}
            </div>
            <div className="dashboard-chip dashboard-chip--danger">
              <TrendingDown size={14} />
              Outflow {formatCurrency(stats.expense)}
            </div>
            <div className="dashboard-chip dashboard-chip--accent">
              <Layers size={14} />
              Active days {stats.activeDays}
            </div>
            {hasActiveFilters && (
              <button type="button" className="dashboard-chip" onClick={resetFilters}>
                <RotateCcw size={14} />
                Clear filters
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="dashboard-kpi-grid fade-in">
        <div className="dashboard-kpi-card">
          <div className="ios-section-subtitle">Total Inflow</div>
          <div
            style={{
              marginTop: '12px',
              fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
              fontWeight: '900',
              color: '#8de7ca',
              letterSpacing: '-0.05em',
            }}
          >
            {formatCurrency(stats.income)}
          </div>
          <div style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
            Money recorded as income in the current view.
          </div>
        </div>

        <div className="dashboard-kpi-card">
          <div className="ios-section-subtitle">Total Outflow</div>
          <div
            style={{
              marginTop: '12px',
              fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
              fontWeight: '900',
              color: '#fda4af',
              letterSpacing: '-0.05em',
            }}
          >
            {formatCurrency(stats.expense)}
          </div>
          <div style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
            Recorded expenses and cash exits.
          </div>
        </div>

        <div className="dashboard-kpi-card">
          <div className="ios-section-subtitle">Net Movement</div>
          <div
            style={{
              marginTop: '12px',
              fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
              fontWeight: '900',
              color: stats.net >= 0 ? '#8de7ca' : '#fda4af',
              letterSpacing: '-0.05em',
            }}
          >
            {stats.net >= 0 ? '+' : '-'}
            {formatCurrency(Math.abs(stats.net))}
          </div>
          <div style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
            Balance impact after all filtered entries.
          </div>
        </div>

        <div className="dashboard-kpi-card">
          <div className="ios-section-subtitle">Average Movement</div>
          <div
            style={{
              marginTop: '12px',
              fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
              fontWeight: '900',
              color: '#ffffff',
              letterSpacing: '-0.05em',
            }}
          >
            {formatCurrency(stats.averageMovement)}
          </div>
          <div style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
            Across {stats.count || 0} visible records.
          </div>
        </div>
      </section>

      <section className="dashboard-split">
        <aside className="dashboard-side-rail">
          <div className="dashboard-filter-panel">
            <div className="page-kicker" style={{ marginBottom: '14px' }}>
              <CalendarIcon size={14} />
              Date filter
            </div>
            <style>{`
              .ledger-calendar {
                width: 100% !important;
                background: transparent !important;
                border: none !important;
                color: var(--text-primary) !important;
                font-family: inherit !important;
                font-size: 0.78rem !important;
              }
              .ledger-calendar .react-calendar__tile {
                padding: 10px 4px !important;
                border-radius: 12px !important;
                color: var(--text-secondary) !important;
                font-weight: 700 !important;
                transition: all 0.2s ease;
              }
              .ledger-calendar .react-calendar__tile:hover {
                background: rgba(132, 216, 255, 0.12) !important;
                color: #ffffff !important;
              }
              .ledger-calendar .react-calendar__tile--now {
                background: rgba(132, 216, 255, 0.14) !important;
                color: #bfefff !important;
                border: 1px solid rgba(132, 216, 255, 0.24) !important;
              }
              .ledger-calendar .react-calendar__tile--active {
                background: #5aa7ff !important;
                color: #ffffff !important;
                box-shadow: 0 8px 18px rgba(90, 167, 255, 0.32);
              }
              .ledger-calendar .react-calendar__navigation button {
                color: var(--text-primary) !important;
                background: rgba(255, 255, 255, 0.06);
                border-radius: 12px;
                min-width: 32px !important;
              }
              .ledger-calendar .react-calendar__navigation__label {
                font-weight: 800 !important;
              }
              .ledger-calendar .react-calendar__month-view__weekdays__weekday abbr {
                text-decoration: none !important;
                color: var(--text-tertiary) !important;
                font-size: 0.64rem;
                text-transform: uppercase;
              }
            `}</style>
            <Calendar
              onChange={(value) => setSelectedDate(value as Date)}
              value={selectedDate}
              className="ledger-calendar"
            />
            {selectedDate && (
              <button
                type="button"
                className="toolbar-btn-secondary"
                style={{ width: '100%', marginTop: '14px' }}
                onClick={() => setSelectedDate(null)}
              >
                <RotateCcw size={16} />
                Clear date
              </button>
            )}
          </div>

          <div className="dashboard-filter-panel">
            <div className="page-kicker" style={{ marginBottom: '12px' }}>
              <Search size={14} />
              Search
            </div>
            <input
              className="form-input"
              type="text"
              placeholder="Description or category"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          <div className="dashboard-filter-panel">
            <div className="page-kicker" style={{ marginBottom: '12px' }}>
              <Layers size={14} />
              Movement type
            </div>
            <div className="dashboard-pill-switch">
              {(['All', 'Income', 'Expense'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  className={
                    filterType === value
                      ? 'dashboard-pill-switch__btn dashboard-pill-switch__btn--active'
                      : 'dashboard-pill-switch__btn'
                  }
                  onClick={() => setFilterType(value)}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          {categories.length > 1 && (
            <div className="dashboard-filter-panel">
              <div className="page-kicker" style={{ marginBottom: '12px' }}>
                <Tag size={14} />
                Category
              </div>
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
          )}

          {accounts.length > 0 && (
            <div className="dashboard-filter-panel">
              <div className="page-kicker" style={{ marginBottom: '12px' }}>
                <Wallet size={14} />
                Account
              </div>
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
          )}
        </aside>

        <div className="dashboard-feed-panel">
          <div className="content-panel">
            <div className="ios-section-header">
              <div className="ios-section-title">
                <div
                  className="ios-section-icon"
                  style={{
                    color: '#89dbff',
                    background: 'rgba(137, 219, 255, 0.14)',
                    borderColor: 'rgba(137, 219, 255, 0.24)',
                  }}
                >
                  <History size={18} />
                </div>
                <div>
                  <div className="ios-section-label">Activity Feed</div>
                  <div className="ios-section-subtitle">
                    {stats.count} visible records, {stats.linkedAccounts} linked account
                    {stats.linkedAccounts === 1 ? '' : 's'}
                  </div>
                </div>
              </div>
              {stats.largestMovement && (
                <div className="dashboard-chip">
                  <Clock size={14} />
                  Largest {formatCurrency(stats.largestMovement.amount)}
                </div>
              )}
            </div>

            <div className="dashboard-chip-row" style={{ marginBottom: '20px' }}>
              {filterSummary.length > 0 ? (
                filterSummary.map((item) => (
                  <div key={item.label} className="dashboard-chip dashboard-chip--accent">
                    {item.label}
                  </div>
                ))
              ) : (
                <div className="dashboard-chip">Showing all ledger records</div>
              )}
            </div>

            {groupedTransactions.length > 0 ? (
              <div className="dashboard-stack">
                {groupedTransactions.map((group) => (
                  <section key={group.date} className="dashboard-record-group">
                    <div className="dashboard-record-group__header">
                      <div className="dashboard-record-group__label">
                        <CalendarIcon size={14} />
                        {formatGroupLabel(group.date)}
                      </div>
                      <div className="dashboard-record-group__line" />
                      <div
                        style={{
                          color: 'var(--text-tertiary)',
                          fontSize: '0.74rem',
                          fontWeight: '800',
                        }}
                      >
                        {group.items.length} record{group.items.length === 1 ? '' : 's'}
                      </div>
                    </div>

                    {group.items.map((transaction) => {
                      const isIncome = transaction.type === 'Income';

                      return (
                        <div key={transaction.id} className="dashboard-record-card">
                          <div className="dashboard-record-card__main">
                            <div
                              className="dashboard-record-card__icon"
                              style={{
                                background: isIncome
                                  ? 'rgba(110, 231, 183, 0.14)'
                                  : 'rgba(253, 164, 175, 0.14)',
                                color: isIncome ? '#8de7ca' : '#fda4af',
                              }}
                            >
                              {isIncome ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                            </div>

                            <div style={{ minWidth: 0 }}>
                              <div className="dashboard-record-card__title">
                                {transaction.description}
                              </div>
                              <div className="dashboard-record-card__meta">
                                <span className="dashboard-chip" style={{ minHeight: '26px' }}>
                                  <Tag size={12} />
                                  {transaction.category}
                                </span>
                                <span>{formatCompactDate(transaction.date)}</span>
                                <span>{getAccountName(transaction.accountId)}</span>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div
                              className="dashboard-record-card__amount"
                              style={{ color: isIncome ? '#8de7ca' : '#fda4af' }}
                            >
                              {isIncome ? '+' : '-'}
                              {formatCurrency(transaction.amount)}
                            </div>

                            <div className="dashboard-record-card__actions">
                              <button
                                type="button"
                                className="action-btn action-btn--edit"
                                onClick={() => handleEdit(transaction)}
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                type="button"
                                className="action-btn action-btn--delete"
                                onClick={async () => {
                                  const confirmed = await customConfirm({
                                    title: 'Delete ledger entry?',
                                    message:
                                      'This transaction will be permanently removed from your ledger.',
                                    type: 'error',
                                    confirmLabel: 'Delete',
                                  });

                                  if (confirmed) {
                                    await deleteTransaction(transaction.id);
                                    showNotification('success', 'Entry removed from ledger');
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
                <h3 style={{ marginTop: '26px', color: '#ffffff' }}>No records match this view</h3>
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    maxWidth: '420px',
                    margin: '10px auto 0',
                  }}
                >
                  Try broadening your filters or record a new cash movement to start building your
                  ledger history.
                </p>
                <div
                  className="dashboard-chip-row"
                  style={{ justifyContent: 'center', marginTop: '20px' }}
                >
                  <button type="button" className="toolbar-btn-secondary" onClick={resetFilters}>
                    <RotateCcw size={16} />
                    Reset filters
                  </button>
                  <button type="button" className="header-add-btn" onClick={openCreateModal}>
                    <Plus size={16} />
                    Add entry
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
          onClick={(event) => event.target === event.currentTarget && setIsModalOpen(false)}
        >
          <div className="modal-card" style={{ maxWidth: '560px' }}>
            <button
              type="button"
              className="modal-close"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
            >
              <X size={20} />
            </button>

            <div className="modal-title">
              {editId ? 'Edit Ledger Entry' : 'Record Ledger Entry'}
            </div>
            <div className="modal-subtitle">
              Keep every inflow and outflow traceable with a structured operations record.
            </div>

            <form
              onSubmit={handleAddTransaction}
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              <div>
                <label className="form-label">Movement Type</label>
                <div className="dashboard-pill-switch">
                  <button
                    type="button"
                    className={
                      type === 'Expense'
                        ? 'dashboard-pill-switch__btn dashboard-pill-switch__btn--active'
                        : 'dashboard-pill-switch__btn'
                    }
                    onClick={() => setType('Expense')}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    className={
                      type === 'Income'
                        ? 'dashboard-pill-switch__btn dashboard-pill-switch__btn--active'
                        : 'dashboard-pill-switch__btn'
                    }
                    onClick={() => setType('Income')}
                  >
                    Income
                  </button>
                </div>
              </div>

              <div className="dashboard-insight-grid">
                <div>
                  <label className="form-label">Description</label>
                  <input
                    className="form-input"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Monthly rent, salary credit, grocery run"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Date</label>
                  <input
                    className="form-input"
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                  />
                </div>
              </div>

              <div className="dashboard-insight-grid">
                <div>
                  <label className="form-label">Category</label>
                  <input
                    className="form-input"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    placeholder="Food, rent, salary, transfer"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Amount</label>
                  <input
                    className="form-input"
                    type="number"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Linked Account</label>
                <select
                  className="form-input"
                  value={accountId}
                  onChange={(event) => setAccountId(event.target.value)}
                >
                  <option value="">No account linked</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({formatCurrency(account.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn-primary btn-primary--indigo">
                {editId ? 'Save Changes' : 'Record Transaction'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
