'use client';

import { CSSProperties, FormEvent, useMemo, useState } from 'react';
import { Transaction } from '@/lib/types';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit3,
  Plus,
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

const toCalendarDateStr = (year: number, month: number, day: number): string =>
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const getHeaderCellStyle = (align: CSSProperties['textAlign'] = 'left'): CSSProperties => ({
  padding: '16px 18px',
  textAlign: align,
  color: '#7e928e',
  fontSize: '0.72rem',
  fontWeight: 900,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  position: 'sticky',
  top: 0,
  background: 'rgba(6, 12, 16, 0.96)',
  zIndex: 1,
});

const getBodyCellStyle = (align: CSSProperties['textAlign'] = 'left'): CSSProperties => ({
  padding: '18px',
  borderTop: '1px solid rgba(255, 255, 255, 0.04)',
  verticalAlign: 'middle',
  textAlign: align,
});

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

  const accountNameById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account.name])),
    [accounts]
  );

  const sortedTransactions = useMemo(() => {
    let result = transactions;
    if (selectedCalendarDate) {
      result = result.filter((t) => t.date === selectedCalendarDate);
    }
    return result.sort((left, right) => {
      const dateCompare = right.date.localeCompare(left.date);
      return dateCompare !== 0 ? dateCompare : right.id - left.id;
    });
  }, [transactions, selectedCalendarDate]);

  const totalIncome = useMemo(
    () => transactions.filter((t) => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const totalExpenses = useMemo(
    () => transactions.filter((t) => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const netBalance = totalIncome - totalExpenses;

  const transactionDates = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => set.add(t.date));
    return set;
  }, [transactions]);

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
    setDate(new Date().toISOString().split('T')[0]);
    setAccountId('');
    setEditId(null);
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
        showNotification('success', 'Transaction updated');
      } else {
        await addTransaction(transactionData);
        showNotification('success', 'Transaction recorded');
      }

      resetForm();
      setIsModalOpen(false);
    } catch (_error) {
      showNotification('error', 'Failed to save transaction');
    }
  };

  if (loading) {
    return (
      <div
        className="main-content"
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
    <div className="main-content fade-in">
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div>
          <h1 className="page-title gradient-text">Ledger</h1>
          <p className="page-subtitle">
            {sortedTransactions.length.toLocaleString()} entries across all accounts
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => {
              exportTransactionsToCSV(transactions);
              showNotification('success', 'Ledger exported successfully');
            }}
            className="glass-button hide-xs"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Download size={18} /> Export
          </button>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="header-add-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={20} /> Add Entry
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div
        className="dashboard-grid"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          marginBottom: '32px',
        }}
      >
        <div className="premium-card" style={{ padding: '24px' }}>
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
          >
            <div>
              <div className="stat-label">Total Income</div>
              <div
                className="stat-value"
                style={{
                  fontSize: '2rem',
                  marginTop: '4px',
                  background: 'linear-gradient(to bottom, #4ade80, #22c55e)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
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
              <div className="stat-label">Total Expenses</div>
              <div
                className="stat-value"
                style={{
                  fontSize: '2rem',
                  marginTop: '4px',
                  background: 'linear-gradient(to bottom, #fb7185, #ef4444)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
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
              <div className="stat-label">Net Balance</div>
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
      </div>

      <div
        className="dashboard-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 340px',
          gap: '24px',
          alignItems: 'start',
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
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Transactions</h3>
            <div className="hide-sm" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--surface-hover)',
                  padding: '6px 12px',
                  borderRadius: '100px',
                  fontSize: '0.75rem',
                  color: selectedCalendarDate ? 'var(--accent)' : 'var(--text-secondary)',
                  border: '1px solid var(--surface-border)',
                  fontWeight: selectedCalendarDate ? 700 : 400,
                }}
              >
                <Activity size={14} />{' '}
                {selectedCalendarDate ? formatDate(selectedCalendarDate) : 'All Time'}
              </div>
              {selectedCalendarDate && (
                <button
                  onClick={() => setSelectedCalendarDate(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                  }}
                  className="action-btn--hover"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div style={{ maxHeight: '600px', overflowY: 'auto', position: 'relative' }}>
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

                    return (
                      <tr
                        key={transaction.id}
                        onClick={() => handleEdit(transaction)}
                        style={{
                          borderBottom: '1px solid var(--surface-border)',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
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
                              {isIncome ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                            </div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {transaction.description}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              background: 'var(--accent-light)',
                              color: 'var(--accent-hover)',
                              fontSize: '0.75rem',
                              fontWeight: 700,
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
                            fontWeight: 700,
                            color: isIncome ? '#22c55e' : '#ef4444',
                            fontSize: '1rem',
                          }}
                        >
                          {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(transaction);
                              }}
                              style={{
                                color: 'var(--text-secondary)',
                                padding: '6px',
                                borderRadius: '6px',
                                transition: 'all 0.2s',
                              }}
                              className="action-btn--hover"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
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
                                padding: '6px',
                                borderRadius: '6px',
                                transition: 'all 0.2s',
                              }}
                              className="action-btn-danger--hover"
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
                      <div className="stat-label" style={{ marginTop: '16px' }}>
                        No transactions found
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Calendar & Mini Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
            {/* Standard Calendar Rendering */}
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
                        onClick={() => setCalendarDate(new Date(calYear, calMonth - 1, 1))}
                        className="glass-button"
                        style={{ padding: '4px', borderRadius: '8px' }}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
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
                      if (day === null) return <div key={`empty-${idx}`} />;
                      const dateStr = toCalendarDateStr(calYear, calMonth, day);
                      const isToday = dateStr === today.toISOString().split('T')[0];
                      const hasTx = transactionDates.has(dateStr);
                      const isSelected = selectedCalendarDate === dateStr;

                      return (
                        <div
                          key={dateStr}
                          onClick={() => {
                            setSelectedCalendarDate(isSelected ? null : dateStr);
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
                                width: '4px',
                                height: '4px',
                                borderRadius: '50%',
                                background: isToday ? '#fff' : 'var(--accent)',
                                position: 'absolute',
                                bottom: '4px',
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Modern Modal */}
      {isModalOpen && (
        <div className="modal-overlay fade-in">
          <div className="modal-card slide-up" style={{ maxWidth: '500px', width: '100%' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
              }}
            >
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                  {editId ? 'Edit Entry' : 'New Entry'}
                </h2>
                <p className="stat-label">Fill in the details below</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="modal-close">
                <X size={24} />
              </button>
            </div>

            <form
              onSubmit={handleAddTransaction}
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              <div
                style={{
                  display: 'flex',
                  background: 'var(--surface-hover)',
                  padding: '4px',
                  borderRadius: '12px',
                  border: '1px solid var(--surface-border)',
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
                <label className="form-label">Description</label>
                <input
                  className="form-input"
                  placeholder="What was this for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="form-label">Amount ({currencySymbol})</label>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="form-label">Date</label>
                  <input
                    className="form-input"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="form-label">Category</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Food"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="form-label">Account</label>
                  <select
                    className="form-input"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
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

              <button
                type="submit"
                className="btn-primary"
                style={{ marginTop: '12px', padding: '14px', fontSize: '1rem' }}
              >
                {editId ? 'Update Entry' : 'Save Entry'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .ledger-row-hover:hover {
          background: var(--surface-hover);
          transform: scale(1.002);
        }
        .action-btn--hover:hover {
          background: var(--accent-light);
          color: var(--accent-hover) !important;
        }
        .action-btn-danger--hover:hover {
          background: var(--error-light);
          color: var(--error) !important;
        }
      `}</style>
    </div>
  );
}
