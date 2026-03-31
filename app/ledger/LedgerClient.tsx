'use client';

import { useState, useMemo } from 'react';
import { useNotifications } from '../components/NotificationContext';
import { useLedger } from '../components/FinanceContext';
import { Transaction } from '@/lib/types';
import { exportTransactionsToCSV } from '../../lib/utils/export';
import {
  Plus,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Edit3,
  Trash2,
  ArrowRight,
  Wallet,
  Tag,
  TrendingUp,
  TrendingDown,
  Activity,
  Search,
  SlidersHorizontal,
  CalendarDays,
} from 'lucide-react';
import { EmptyTransactionsVisual } from '../components/Visuals';

const AUTO_ENTRY_KEYWORDS = ['Stock', 'MF:', 'FnO'];

export default function LedgerClient() {
  const { transactions, accounts, addTransaction, updateTransaction, deleteTransaction, loading } =
    useLedger();
  const { showNotification, confirm: customConfirm } = useNotifications();

  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterAccount, setFilterAccount] = useState<number | 'All'>('All');
  const [filterType, setFilterType] = useState<'All' | 'Income' | 'Expense'>('All');
  const [showFilters, setShowFilters] = useState(false);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'Income' | 'Expense'>('Expense');
  const [accountId, setAccountId] = useState<string>('');

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !category) return;

    const transactionData = {
      date,
      description,
      category,
      type,
      amount: parseFloat(amount),
      accountId: accountId ? parseInt(accountId) : undefined,
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
    } catch (_err) {
      showNotification('error', 'Failed to save transaction');
    }
  };

  const resetForm = () => {
    setDescription('');
    setCategory('');
    setAmount('');
    setType('Expense');
    setDate(new Date().toISOString().split('T')[0]);
    setAccountId('');
    setEditId(null);
  };

  const handleEdit = (tx: Transaction) => {
    setEditId(tx.id);
    setDescription(tx.description);
    setCategory(tx.category as string);
    setAmount(tx.amount.toString());
    setType(tx.type);
    setDate(tx.date);
    setAccountId(tx.accountId ? tx.accountId.toString() : '');
    setIsModalOpen(true);
  };

  const getAccountName = (id?: number) => {
    if (!id) return null;
    const account = accounts.find((a) => a.id === id);
    return account ? account.name : null;
  };

  const categories = ['All', ...new Set(transactions.map((t) => t.category))].sort() as string[];

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (typeof t.category === 'string' &&
          t.category.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = filterCategory === 'All' || t.category === filterCategory;
      const matchesAccount = filterAccount === 'All' || t.accountId === filterAccount;
      const matchesType = filterType === 'All' || t.type === filterType;
      const matchesDate = !selectedDateStr || t.date === selectedDateStr;

      return matchesSearch && matchesCategory && matchesAccount && matchesType && matchesDate;
    });
  }, [transactions, searchQuery, filterCategory, filterAccount, filterType, selectedDateStr]);

  // Grouping by date
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};
    filteredTransactions.forEach((t) => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredTransactions]);

  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === 'Income')
      .reduce((s, t) => s + t.amount, 0);
    const expense = filteredTransactions
      .filter((t) => t.type === 'Expense')
      .reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [filteredTransactions]);

  if (loading) {
    return (
      <div
        className="main-content"
        style={{
          backgroundColor: '#000000',
          minHeight: '100vh',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            className="loader"
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(99, 102, 241, 0.1)',
              borderTopColor: '#6366f1',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px',
            }}
          ></div>
          <div style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: '500' }}>
            Loading transactions...
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const hasActiveFilters =
    searchQuery ||
    filterCategory !== 'All' ||
    filterType !== 'All' ||
    filterAccount !== 'All' ||
    selectedDateStr;

  const clearFilters = () => {
    setSearchQuery('');
    setFilterCategory('All');
    setFilterAccount('All');
    setFilterType('All');
    setSelectedDateStr('');
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div
        className="mobile-page-header"
        style={{ marginBottom: '32px', gap: '24px', width: '100%' }}
      >
        <div style={{ flexShrink: 0 }}>
          <h1
            style={{
              fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
              fontWeight: '900',
              margin: 0,
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Ledger
          </h1>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: '0.82rem',
              color: '#475569',
              fontWeight: '600',
            }}
          >
            {transactions.length} entries across all accounts
          </p>
        </div>
        <div
          className="mobile-page-header__actions"
          style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end' }}
        >
          <button
            onClick={() => {
              exportTransactionsToCSV(transactions);
              showNotification('success', 'Ledger exported to CSV');
            }}
            style={{
              padding: '12px',
              borderRadius: '14px',
              background: '#050505',
              color: '#818cf8',
              border: '1px solid #111111',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              minWidth: '44px',
              minHeight: '44px',
            }}
            title="Export CSV"
          >
            <Download size={20} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              padding: '10px 20px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
              color: 'white',
              border: 'none',
              fontWeight: '800',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 8px 16px rgba(99, 102, 241, 0.2)',
              transition: '0.2s',
              flexShrink: 0,
              minHeight: '44px',
            }}
          >
            <Plus size={18} strokeWidth={3} />
            <span className="hide-sm">Add Entry</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid-responsive-4" style={{ marginBottom: '32px' }}>
        <div
          className="premium-card"
          style={{
            background: '#050505',
            padding: '20px',
            borderRadius: '24px',
            border: '1px solid #111111',
          }}
        >
          <div
            style={{
              color: '#34d399',
              fontSize: '0.7rem',
              fontWeight: '800',
              textTransform: 'uppercase',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <TrendingUp size={14} /> Total Inflow
          </div>
          <div
            style={{ fontSize: 'clamp(1.2rem, 2vw, 1.5rem)', fontWeight: '900', color: '#34d399' }}
          >
            ₹{stats.income.toLocaleString()}
          </div>
        </div>

        <div
          className="premium-card"
          style={{
            background: '#050505',
            padding: '20px',
            borderRadius: '24px',
            border: '1px solid #111111',
          }}
        >
          <div
            style={{
              color: '#f87171',
              fontSize: '0.7rem',
              fontWeight: '800',
              textTransform: 'uppercase',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <TrendingDown size={14} /> Total Outflow
          </div>
          <div
            style={{ fontSize: 'clamp(1.2rem, 2vw, 1.5rem)', fontWeight: '900', color: '#f87171' }}
          >
            ₹{stats.expense.toLocaleString()}
          </div>
        </div>

        <div
          className="premium-card"
          style={{
            background: '#050505',
            padding: '20px',
            borderRadius: '24px',
            border: '1px solid #111111',
          }}
        >
          <div
            style={{
              color: stats.balance >= 0 ? '#34d399' : '#f87171',
              fontSize: '0.7rem',
              fontWeight: '800',
              textTransform: 'uppercase',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Activity size={14} /> Net Balance
          </div>
          <div
            style={{
              fontSize: 'clamp(1.2rem, 2vw, 1.5rem)',
              fontWeight: '900',
              color: stats.balance >= 0 ? '#34d399' : '#f87171',
            }}
          >
            {stats.balance >= 0 ? '+' : ''}₹{stats.balance.toLocaleString()}
          </div>
        </div>

        <div
          className="premium-card"
          style={{
            background: '#050505',
            padding: '20px',
            borderRadius: '24px',
            border: '1px solid #111111',
          }}
        >
          <div
            style={{
              color: '#64748b',
              fontSize: '0.7rem',
              fontWeight: '800',
              textTransform: 'uppercase',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Wallet size={14} /> Entries
          </div>
          <div style={{ fontSize: 'clamp(1.2rem, 2vw, 1.5rem)', fontWeight: '900' }}>
            {filteredTransactions.length}
            {filteredTransactions.length !== transactions.length && (
              <span
                style={{
                  fontSize: '0.75rem',
                  color: '#475569',
                  fontWeight: '700',
                  marginLeft: '6px',
                }}
              >
                / {transactions.length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        className="premium-card"
        style={{
          background: '#050505',
          padding: '16px 20px',
          borderRadius: '20px',
          border: '1px solid #111111',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ flex: '1 1 200px', position: 'relative', minWidth: '160px' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#475569',
                pointerEvents: 'none',
              }}
            />
            <input
              className="form-input"
              type="text"
              placeholder="Search description or category…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '34px', fontSize: '0.82rem', height: '40px' }}
            />
          </div>

          {/* Type filter pills */}
          <div
            style={{
              display: 'flex',
              background: '#000',
              borderRadius: '12px',
              border: '1px solid #111111',
              padding: '3px',
              gap: '2px',
              flexShrink: 0,
            }}
          >
            {(['All', 'Income', 'Expense'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '9px',
                  border: 'none',
                  background:
                    filterType === t
                      ? t === 'Income'
                        ? '#10b981'
                        : t === 'Expense'
                          ? '#f43f5e'
                          : '#6366f1'
                      : 'transparent',
                  color: filterType === t ? '#fff' : '#475569',
                  fontSize: '0.7rem',
                  fontWeight: '900',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  letterSpacing: '0.5px',
                  whiteSpace: 'nowrap',
                }}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Advanced filters toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '9px 14px',
              borderRadius: '12px',
              border: showFilters ? '1px solid rgba(99,102,241,0.4)' : '1px solid #111111',
              background: showFilters ? 'rgba(99,102,241,0.1)' : 'transparent',
              color: showFilters ? '#818cf8' : '#475569',
              fontSize: '0.75rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s',
              flexShrink: 0,
            }}
          >
            <SlidersHorizontal size={14} />
            <span className="hide-sm">Filters</span>
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                padding: '9px 14px',
                borderRadius: '12px',
                border: '1px solid rgba(244,63,94,0.3)',
                background: 'rgba(244,63,94,0.08)',
                color: '#f43f5e',
                fontSize: '0.7rem',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s',
                flexShrink: 0,
                letterSpacing: '0.3px',
              }}
            >
              <X size={12} /> CLEAR
            </button>
          )}
        </div>

        {/* Expanded filter row */}
        {showFilters && (
          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid #111111',
              flexWrap: 'wrap',
            }}
          >
            {/* Date */}
            <div style={{ flex: '1 1 160px', minWidth: '140px', position: 'relative' }}>
              <CalendarDays
                size={14}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#475569',
                  pointerEvents: 'none',
                }}
              />
              <input
                className="form-input"
                type="date"
                value={selectedDateStr}
                onChange={(e) => setSelectedDateStr(e.target.value)}
                style={{
                  paddingLeft: '34px',
                  fontSize: '0.82rem',
                  height: '40px',
                  cursor: 'pointer',
                }}
              />
            </div>

            {/* Category */}
            {categories.length > 2 && (
              <div style={{ flex: '1 1 160px', minWidth: '140px', position: 'relative' }}>
                <Tag
                  size={14}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#475569',
                    pointerEvents: 'none',
                  }}
                />
                <select
                  className="form-input"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  style={{
                    paddingLeft: '34px',
                    fontSize: '0.82rem',
                    height: '40px',
                    cursor: 'pointer',
                  }}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Account */}
            {accounts.length > 0 && (
              <div style={{ flex: '1 1 160px', minWidth: '140px', position: 'relative' }}>
                <Wallet
                  size={14}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#475569',
                    pointerEvents: 'none',
                  }}
                />
                <select
                  className="form-input"
                  value={filterAccount}
                  onChange={(e) =>
                    setFilterAccount(
                      e.target.value === 'All' ? 'All' : parseInt(e.target.value, 10)
                    )
                  }
                  style={{
                    paddingLeft: '34px',
                    fontSize: '0.82rem',
                    height: '40px',
                    cursor: 'pointer',
                  }}
                >
                  <option value="All">All Accounts</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transaction Timeline */}
      {groupedTransactions.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {groupedTransactions.map(([dateString, group]) => {
            const dateObj = new Date(dateString);
            const isToday = new Date().toISOString().split('T')[0] === dateString;

            const dayInflow = group
              .filter((t) => t.type === 'Income')
              .reduce((s, t) => s + t.amount, 0);
            const dayOutflow = group
              .filter((t) => t.type === 'Expense')
              .reduce((s, t) => s + t.amount, 0);

            return (
              <div key={dateString}>
                {/* Date Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '12px',
                    position: 'sticky',
                    top: '0',
                    zIndex: 10,
                    background: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(12px)',
                    padding: '8px 0',
                  }}
                >
                  <div
                    style={{
                      background: isToday
                        ? 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)'
                        : '#111111',
                      color: '#fff',
                      padding: '5px 14px',
                      borderRadius: '10px',
                      fontSize: '0.78rem',
                      fontWeight: '900',
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px',
                      flexShrink: 0,
                    }}
                  >
                    {isToday
                      ? 'Today'
                      : dateObj.toLocaleDateString(undefined, {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                  </div>
                  <div
                    style={{
                      height: '1px',
                      flex: 1,
                      background: 'linear-gradient(to right, #1e293b, transparent)',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                    {dayInflow > 0 && (
                      <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#34d399' }}>
                        +₹{dayInflow.toLocaleString()}
                      </span>
                    )}
                    {dayOutflow > 0 && (
                      <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#f87171' }}>
                        -₹{dayOutflow.toLocaleString()}
                      </span>
                    )}
                    <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#334155' }}>
                      {group.length} {group.length === 1 ? 'entry' : 'entries'}
                    </span>
                  </div>
                </div>

                {/* Transaction Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {group.map((tx) => (
                    <div
                      key={tx.id}
                      className="premium-card"
                      style={{
                        background: 'linear-gradient(135deg, #050505 0%, #0a0a0a 100%)',
                        padding: '16px 20px',
                        borderRadius: '16px',
                        border: '1px solid #111111',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px',
                        cursor: 'pointer',
                        borderLeft: '3px solid ' + (tx.type === 'Income' ? '#10b981' : '#f43f5e'),
                        transition: 'all 0.2s',
                      }}
                      onClick={() => handleEdit(tx)}
                    >
                      {/* Left: Icon + Details */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background:
                              tx.type === 'Income'
                                ? 'rgba(16, 185, 129, 0.12)'
                                : 'rgba(244, 63, 94, 0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: tx.type === 'Income' ? '#10b981' : '#f43f5e',
                            flexShrink: 0,
                          }}
                        >
                          {tx.type === 'Income' ? (
                            <ArrowUpRight size={18} strokeWidth={2.5} />
                          ) : (
                            <ArrowDownRight size={18} strokeWidth={2.5} />
                          )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: '800',
                              fontSize: '0.95rem',
                              color: '#fff',
                              marginBottom: '4px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {tx.description}
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              flexWrap: 'wrap',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: '900',
                                textTransform: 'uppercase',
                                color: '#6366f1',
                                background: 'rgba(99, 102, 241, 0.1)',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                letterSpacing: '0.5px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Tag size={9} />
                              {tx.category}
                            </span>
                            {getAccountName(tx.accountId) && (
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  color: '#475569',
                                  fontWeight: '700',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <Wallet size={11} />
                                {getAccountName(tx.accountId)}
                              </span>
                            )}
                            {AUTO_ENTRY_KEYWORDS.some((key) => tx.description.includes(key)) && (
                              <span
                                style={{
                                  fontSize: '0.6rem',
                                  fontWeight: '900',
                                  color: '#f59e0b',
                                  background: 'rgba(245, 158, 11, 0.1)',
                                  padding: '2px 6px',
                                  borderRadius: '5px',
                                  letterSpacing: '0.3px',
                                }}
                              >
                                AUTO ENTRY
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount + Actions */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                            fontWeight: '900',
                            color: tx.type === 'Income' ? '#10b981' : '#f43f5e',
                            textAlign: 'right',
                          }}
                        >
                          {tx.type === 'Income' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="mobile-action-btn mobile-action-btn--edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(tx);
                            }}
                            style={{ padding: '8px' }}
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            className="mobile-action-btn mobile-action-btn--delete"
                            onClick={async (e) => {
                              e.stopPropagation();
                              const isConfirmed = await customConfirm({
                                title: 'Delete entry?',
                                message: 'This ledger entry will be permanently deleted.',
                                type: 'error',
                                confirmLabel: 'Delete',
                              });
                              if (isConfirmed) {
                                await deleteTransaction(tx.id);
                                showNotification('success', 'Entry deleted');
                              }
                            }}
                            style={{ padding: '8px' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            padding: '80px 40px',
            textAlign: 'center',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '24px',
            border: '1px dashed #1e293b',
          }}
        >
          <EmptyTransactionsVisual />
          <h3 style={{ color: '#fff', margin: '0 0 10px 0', fontWeight: '800' }}>
            No matching entries
          </h3>
          <p
            style={{
              color: '#64748b',
              maxWidth: '300px',
              margin: '0 auto 24px',
              lineHeight: '1.6',
              fontSize: '0.9rem',
            }}
          >
            No records match the current filters. Try adjusting your search or clearing filters.
          </p>
          <button
            onClick={clearFilters}
            style={{
              background: '#111111',
              border: '1px solid #1e293b',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: '12px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: '0 auto',
              fontSize: '0.85rem',
            }}
          >
            Reset Filters <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Entry Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '540px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px',
              }}
            >
              <h2
                style={{
                  fontSize: 'clamp(1.4rem, 3vw, 1.75rem)',
                  fontWeight: '950',
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}
              >
                {editId ? 'Edit entry' : 'New ledger entry'}
              </h2>
              <button
                className="modal-close"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
              >
                <X size={24} />
              </button>
            </div>

            <form
              onSubmit={handleAddTransaction}
              style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label className="form-label">Entry type</label>
                  <div
                    style={{
                      display: 'flex',
                      gap: '4px',
                      background: '#000000',
                      padding: '4px',
                      borderRadius: '12px',
                      border: '1px solid #111111',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setType('Expense')}
                      style={{
                        flex: 1,
                        padding: '12px',
                        minHeight: '44px',
                        borderRadius: '10px',
                        border: 'none',
                        background: type === 'Expense' ? '#f43f5e' : 'transparent',
                        color: type === 'Expense' ? '#fff' : '#475569',
                        fontWeight: '950',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                      }}
                    >
                      EXPENSE
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('Income')}
                      style={{
                        flex: 1,
                        padding: '12px',
                        minHeight: '44px',
                        borderRadius: '10px',
                        border: 'none',
                        background: type === 'Income' ? '#10b981' : 'transparent',
                        color: type === 'Income' ? '#fff' : '#475569',
                        fontWeight: '950',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                      }}
                    >
                      INCOME
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label className="form-label">Date</label>
                  <input
                    className="form-input"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label className="form-label">Description</label>
                <input
                  className="form-input"
                  placeholder="e.g. Monthly Rent Payment"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
                  gap: '20px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label className="form-label">Category</label>
                  <input
                    className="form-input"
                    placeholder="Food, Rent, etc."
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label className="form-label">Amount (₹)</label>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label className="form-label">Source Account</label>
                <select
                  className="form-input"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="">No Account Linked</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (₹{acc.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn-primary btn-primary--indigo">
                {editId ? 'Save changes' : 'Save entry'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
