'use client';

import { useState, useMemo } from 'react';
import { useNotifications } from '../components/NotificationContext';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useLedger } from '../components/FinanceContext';
import { Transaction } from '@/lib/types';
import { exportTransactionsToCSV } from '../../lib/utils/export';
import {
  Book,
  Plus,
  X,
  Calendar as CalendarIcon,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Edit3,
  Trash2,
  ArrowRight,
  Wallet,
  Tag,
  History,
  TrendingUp,
  TrendingDown,
  Layers,
  Clock,
} from 'lucide-react';
import { EmptyTransactionsVisual } from '../components/Visuals';

export default function LedgerClient() {
  const { transactions, accounts, addTransaction, updateTransaction, deleteTransaction, loading } =
    useLedger();
  const { showNotification, confirm: customConfirm } = useNotifications();

  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterAccount, setFilterAccount] = useState<number | 'All'>('All');
  const [filterType, setFilterType] = useState<'All' | 'Income' | 'Expense'>('All');

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
      const matchesDate = !selectedDate || t.date === selectedDate.toISOString().split('T')[0];

      return matchesSearch && matchesCategory && matchesAccount && matchesType && matchesDate;
    });
  }, [transactions, searchQuery, filterCategory, filterAccount, filterType, selectedDate]);

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
          backgroundColor: 'var(--ui-page-bg)',
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

  return (
    <div
      className="dashboard-page dashboard-page--wide"
      style={{
        minHeight: '100vh',
      }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header Section */}
        <div
          className="page-header"
          style={{
            alignItems: 'flex-start',
            gap: '24px',
          }}
        >
          <div>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}
            >
              <div
                style={{
                  background: 'rgba(99, 102, 241, 0.1)',
                  padding: '10px',
                  borderRadius: '12px',
                  color: '#6366f1',
                }}
              >
                <Book size={24} strokeWidth={2.5} />
              </div>
              <h1
                className="page-title"
                style={{
                  background:
                    'linear-gradient(to bottom, var(--text-primary), var(--text-secondary))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Ledger
              </h1>
            </div>
            <p
              className="page-subtitle"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <History size={16} /> History of all your transactions
            </p>
          </div>

          <div className="dashboard-toolbar__actions">
            <button
              onClick={() => {
                exportTransactionsToCSV(transactions);
                showNotification('success', 'Ledger exported to CSV');
              }}
              className="toolbar-btn-secondary"
              style={{
                background: 'rgba(0, 0, 0, 0.6)',
                color: '#94a3b8',
                fontWeight: '700',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Download size={18} /> Export
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="header-add-btn"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)',
              }}
            >
              <Plus size={20} strokeWidth={3} /> Record Entry
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div
          className="section-fade-in"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            marginBottom: '32px',
          }}
        >
          <div
            className="stat-card stat-card--green"
            style={{
              background:
                'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.02) 100%)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                right: '-20px',
                top: '-20px',
                color: 'rgba(16, 185, 129, 0.05)',
              }}
            >
              <TrendingUp size={120} />
            </div>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}
            >
              <div
                style={{
                  background: '#10b981',
                  padding: '6px',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              >
                <ArrowUpRight size={16} strokeWidth={3} />
              </div>
              <span
                style={{
                  color: '#34d399',
                  fontWeight: '800',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Total Inflow
              </span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '950', color: '#fff' }}>
              ₹{stats.income.toLocaleString()}
            </div>
          </div>

          <div
            className="stat-card stat-card--red"
            style={{
              background:
                'linear-gradient(135deg, rgba(244, 63, 94, 0.1) 0%, rgba(244, 63, 94, 0.02) 100%)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                right: '-20px',
                top: '-20px',
                color: 'rgba(244, 63, 94, 0.05)',
              }}
            >
              <TrendingDown size={120} />
            </div>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}
            >
              <div
                style={{
                  background: '#f43f5e',
                  padding: '6px',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              >
                <ArrowDownRight size={16} strokeWidth={3} />
              </div>
              <span
                style={{
                  color: '#f87171',
                  fontWeight: '800',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Total Outflow
              </span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '950', color: '#fff' }}>
              ₹{stats.expense.toLocaleString()}
            </div>
          </div>

          <div
            className="stat-card stat-card--indigo"
            style={{
              background:
                'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(10, 10, 10, 0.4) 100%)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                right: '-20px',
                top: '-10px',
                color: 'rgba(99, 102, 241, 0.05)',
              }}
            >
              <Wallet size={120} />
            </div>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}
            >
              <div
                style={{
                  background: '#6366f1',
                  padding: '6px',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              >
                <Layers size={16} />
              </div>
              <span
                style={{
                  color: '#a5b4fc',
                  fontWeight: '800',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Net Movement
              </span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '950', color: '#fff' }}>
              ₹{stats.balance.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div
          className="flex-col-mobile"
          style={{
            display: 'flex',
            gap: '32px',
            alignItems: 'start',
          }}
        >
          {/* Left Sidebar: Calendar + Filters */}
          <div
            style={{
              flex: '0 0 300px',
              width: '300px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              position: 'sticky',
              top: '24px',
            }}
          >
            {/* Calendar Component */}
            <div
              style={{
                background: 'var(--surface)',
                padding: '20px',
                borderRadius: '20px',
                border: '1px solid var(--surface-border)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px',
                  color: '#818cf8',
                }}
              >
                <CalendarIcon size={14} strokeWidth={2.5} />
                <span
                  style={{
                    fontWeight: '900',
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}
                >
                  Date Filter
                </span>
                {selectedDate && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: '0.65rem',
                      fontWeight: '800',
                      color: '#6366f1',
                      background: 'rgba(99, 102, 241, 0.15)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                    }}
                  >
                    {selectedDate.toLocaleDateString(undefined, {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                )}
              </div>
              <style>{`
                .custom-calendar {
                  width: 100% !important;
                  background: transparent !important;
                  border: none !important;
                  color: var(--text-primary) !important;
                  font-family: inherit !important;
                  font-size: 0.78rem !important;
                }
                .custom-calendar .react-calendar__tile {
                  padding: 10px 4px !important;
                  font-size: 0.72rem !important;
                  font-weight: 700 !important;
                  border-radius: 8px !important;
                  color: var(--text-secondary) !important;
                  transition: all 0.2s;
                }
                .custom-calendar .react-calendar__tile:hover {
                  background: rgba(99, 102, 241, 0.12) !important;
                  color: #c7d2fe !important;
                }
                .custom-calendar .react-calendar__month-view__days__day--weekend {
                  color: var(--text-secondary) !important;
                }
                .custom-calendar .react-calendar__tile--now {
                  background: rgba(99, 102, 241, 0.15) !important;
                  color: #818cf8 !important;
                  font-weight: 900 !important;
                  border: 1px solid rgba(99, 102, 241, 0.3) !important;
                }
                .custom-calendar .react-calendar__tile--active {
                  background: #6366f1 !important;
                  color: white !important;
                  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.45);
                }
                .custom-calendar .react-calendar__tile--active:hover {
                  background: #4f46e5 !important;
                  color: white !important;
                }
                .custom-calendar .react-calendar__navigation {
                  margin-bottom: 12px !important;
                  display: flex;
                  gap: 4px;
                  align-items: center;
                }
                .custom-calendar .react-calendar__navigation button {
                  color: var(--text-primary) !important;
                  font-weight: 800 !important;
                  border-radius: 8px;
                  font-size: 0.78rem;
                  min-width: 32px !important;
                  padding: 6px 4px !important;
                  background: rgba(255,255,255,0.04);
                  transition: background 0.2s;
                }
                .custom-calendar .react-calendar__navigation button:hover {
                  background: rgba(99, 102, 241, 0.12) !important;
                  color: #c7d2fe !important;
                }
                .custom-calendar .react-calendar__navigation__label {
                  flex-grow: 1 !important;
                  font-weight: 900 !important;
                  font-size: 0.8rem !important;
                  color: var(--text-primary) !important;
                }
                .custom-calendar .react-calendar__month-view__weekdays {
                  margin-bottom: 4px;
                }
                .custom-calendar .react-calendar__month-view__weekdays__weekday abbr {
                  text-decoration: none !important;
                  color: #475569 !important;
                  font-weight: 900 !important;
                  font-size: 0.65rem;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                }
                .custom-calendar .react-calendar__month-view__days {
                  gap: 2px;
                }
                .custom-calendar .react-calendar__tile:disabled {
                  color: #1e293b !important;
                }
              `}</style>
              <Calendar
                onChange={(val) => setSelectedDate(val as Date)}
                value={selectedDate}
                className="custom-calendar"
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate(null)}
                  style={{
                    width: '100%',
                    marginTop: '16px',
                    background: 'rgba(244, 63, 94, 0.08)',
                    color: '#f43f5e',
                    border: '1px solid rgba(244, 63, 94, 0.2)',
                    padding: '10px',
                    borderRadius: '12px',
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'background 0.2s',
                    letterSpacing: '0.5px',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'rgba(244, 63, 94, 0.15)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'rgba(244, 63, 94, 0.08)')
                  }
                >
                  <X size={13} /> CLEAR DATE
                </button>
              )}
            </div>

            {/* Search */}
            <div
              style={{
                background: 'var(--surface)',
                padding: '16px 20px',
                borderRadius: '20px',
                border: '1px solid var(--surface-border)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                  color: '#818cf8',
                }}
              >
                <Tag size={13} strokeWidth={2.5} />
                <span
                  style={{
                    fontWeight: '900',
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}
                >
                  Search
                </span>
              </div>
              <input
                className="form-input"
                type="text"
                placeholder="Description or category…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ fontSize: '0.82rem' }}
              />
            </div>

            {/* Type Filter */}
            <div
              style={{
                background: 'var(--surface)',
                padding: '16px 20px',
                borderRadius: '20px',
                border: '1px solid var(--surface-border)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                  color: '#818cf8',
                }}
              >
                <Layers size={13} strokeWidth={2.5} />
                <span
                  style={{
                    fontWeight: '900',
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}
                >
                  Type
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {(['All', 'Income', 'Expense'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    style={{
                      flex: 1,
                      padding: '9px 4px',
                      borderRadius: '10px',
                      border: '1px solid',
                      borderColor:
                        filterType === t
                          ? t === 'Income'
                            ? 'rgba(16, 185, 129, 0.4)'
                            : t === 'Expense'
                              ? 'rgba(244, 63, 94, 0.4)'
                              : 'rgba(99, 102, 241, 0.4)'
                          : 'rgba(255, 255, 255, 0.12)',
                      background:
                        filterType === t
                          ? t === 'Income'
                            ? 'rgba(16, 185, 129, 0.12)'
                            : t === 'Expense'
                              ? 'rgba(244, 63, 94, 0.12)'
                              : 'rgba(99, 102, 241, 0.12)'
                          : 'transparent',
                      color:
                        filterType === t
                          ? t === 'Income'
                            ? '#34d399'
                            : t === 'Expense'
                              ? '#fb7185'
                              : '#a5b4fc'
                          : '#475569',
                      fontSize: '0.65rem',
                      fontWeight: '900',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            {categories.length > 2 && (
              <div
                style={{
                  background: 'var(--surface)',
                  padding: '16px 20px',
                  borderRadius: '20px',
                  border: '1px solid var(--surface-border)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px',
                    color: '#818cf8',
                  }}
                >
                  <Tag size={13} strokeWidth={2.5} />
                  <span
                    style={{
                      fontWeight: '900',
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                    }}
                  >
                    Category
                  </span>
                </div>
                <select
                  className="form-input"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  style={{ fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Account Filter */}
            {accounts.length > 0 && (
              <div
                style={{
                  background: 'var(--surface)',
                  padding: '16px 20px',
                  borderRadius: '20px',
                  border: '1px solid var(--surface-border)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px',
                    color: '#818cf8',
                  }}
                >
                  <Wallet size={13} strokeWidth={2.5} />
                  <span
                    style={{
                      fontWeight: '900',
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                    }}
                  >
                    Account
                  </span>
                </div>
                <select
                  className="form-input"
                  value={filterAccount}
                  onChange={(e) =>
                    setFilterAccount(
                      e.target.value === 'All' ? 'All' : parseInt(e.target.value, 10)
                    )
                  }
                  style={{ fontSize: '0.82rem', cursor: 'pointer' }}
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

          {/* Right Side: Timeline of Transactions */}
          <div style={{ flex: '1 1 500px', minWidth: 0 }}>
            {/* Results bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px',
                padding: '12px 20px',
                background: 'var(--surface)',
                borderRadius: '16px',
                border: '1px solid var(--surface-border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '900',
                    color: '#475569',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Showing
                </span>
                <span
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: '900',
                    color: '#fff',
                  }}
                >
                  {filteredTransactions.length}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: '#475569',
                  }}
                >
                  of {transactions.length} entries
                </span>
                {(searchQuery ||
                  filterCategory !== 'All' ||
                  filterType !== 'All' ||
                  filterAccount !== 'All' ||
                  selectedDate) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterCategory('All');
                      setFilterAccount('All');
                      setFilterType('All');
                      setSelectedDate(null);
                    }}
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: '800',
                      color: '#f43f5e',
                      background: 'rgba(244, 63, 94, 0.08)',
                      border: '1px solid rgba(244, 63, 94, 0.2)',
                      padding: '3px 10px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      letterSpacing: '0.3px',
                    }}
                  >
                    CLEAR ALL
                  </button>
                )}
              </div>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: '800',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Clock size={12} />
                {groupedTransactions.length} {groupedTransactions.length === 1 ? 'DAY' : 'DAYS'}
              </div>
            </div>
            {groupedTransactions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                {groupedTransactions.map(([dateString, group]) => {
                  const dateObj = new Date(dateString);
                  const isToday = new Date().toISOString().split('T')[0] === dateString;

                  return (
                    <div key={dateString}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          marginBottom: '20px',
                          position: 'sticky',
                          top: '0',
                          zIndex: 10,
                          background: 'rgba(0, 0, 0, 0.8)',
                          backdropFilter: 'blur(12px)',
                          padding: '10px 0',
                        }}
                      >
                        <div
                          style={{
                            background: isToday ? '#6366f1' : 'rgba(255, 255, 255, 0.12)',
                            color: '#fff',
                            padding: '6px 16px',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: '900',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                          }}
                        >
                          {isToday
                            ? 'Today'
                            : dateObj.toLocaleDateString(undefined, {
                                day: 'numeric',
                                month: 'short',
                              })}
                        </div>
                        <div
                          style={{
                            height: '1px',
                            flex: 1,
                            background:
                              'linear-gradient(to right, rgba(255, 255, 255, 0.08), transparent)',
                          }}
                        ></div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#475569' }}>
                          {group.length} {group.length === 1 ? 'RECORD' : 'RECORDS'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {group.map((tx) => (
                          <div
                            key={tx.id}
                            onClick={() => handleEdit(tx)}
                            className="ledger-tx-card"
                          >
                            {/* Color side indicator */}
                            <div
                              style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: '4px',
                                background: tx.type === 'Income' ? '#10b981' : '#f43f5e',
                              }}
                            ></div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                              <div
                                style={{
                                  width: '48px',
                                  height: '48px',
                                  borderRadius: '14px',
                                  background:
                                    tx.type === 'Income'
                                      ? 'rgba(16, 185, 129, 0.1)'
                                      : 'rgba(244, 63, 94, 0.1)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: tx.type === 'Income' ? '#10b981' : '#f43f5e',
                                }}
                              >
                                {tx.type === 'Income' ? (
                                  <ArrowUpRight size={20} strokeWidth={2.5} />
                                ) : (
                                  <ArrowDownRight size={20} strokeWidth={2.5} />
                                )}
                              </div>
                              <div>
                                <div
                                  style={{
                                    fontWeight: '800',
                                    fontSize: '1.05rem',
                                    color: '#fff',
                                    marginBottom: '4px',
                                  }}
                                >
                                  {tx.description}
                                </div>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
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
                                    }}
                                  >
                                    <Tag
                                      size={10}
                                      style={{ marginRight: '4px', verticalAlign: 'middle' }}
                                    />{' '}
                                    {tx.category}
                                  </span>
                                  {getAccountName(tx.accountId) && (
                                    <span
                                      style={{
                                        fontSize: '0.75rem',
                                        color: '#475569',
                                        fontWeight: '700',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                      }}
                                    >
                                      <Wallet size={12} /> {getAccountName(tx.accountId)}
                                    </span>
                                  )}
                                  {/* Detect Source (Automated entries usually have keywords) */}
                                  {['Stock', 'MF:', 'FnO'].some((key) =>
                                    tx.description.includes(key)
                                  ) && (
                                    <span
                                      style={{
                                        fontSize: '0.65rem',
                                        fontWeight: '900',
                                        color: '#f59e0b',
                                        background: 'rgba(245, 158, 11, 0.1)',
                                        padding: '2px 8px',
                                        borderRadius: '6px',
                                      }}
                                    >
                                      SYSTEM LOG
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div
                              style={{
                                textAlign: 'right',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '24px',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'flex-end',
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: '1.25rem',
                                    fontWeight: '950',
                                    color: tx.type === 'Income' ? '#10b981' : '#f43f5e',
                                  }}
                                >
                                  {tx.type === 'Income' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.7rem',
                                    color: '#475569',
                                    fontWeight: '600',
                                    textTransform: 'uppercase',
                                    marginTop: '2px',
                                  }}
                                >
                                  <Clock
                                    size={10}
                                    style={{ marginRight: '4px', verticalAlign: 'baseline' }}
                                  />{' '}
                                  Verified
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  className="action-btn action-btn--edit"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(tx);
                                  }}
                                >
                                  <Edit3 size={16} />
                                </button>
                                <button
                                  className="action-btn action-btn--delete"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const isConfirmed = await customConfirm({
                                      title: 'Purge Record?',
                                      message:
                                        'This ledger entry will be permanently erased. Proceed with caution.',
                                      type: 'error',
                                      confirmLabel: 'Erase',
                                    });
                                    if (isConfirmed) {
                                      await deleteTransaction(tx.id);
                                      showNotification('success', 'Entry purged from ledger');
                                    }
                                  }}
                                >
                                  <Trash2 size={16} />
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
                  padding: '120px 40px',
                  textAlign: 'center',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '32px',
                  border: '1px dashed rgba(255, 255, 255, 0.18)',
                }}
              >
                <EmptyTransactionsVisual />
                <h3
                  style={{
                    color: '#fff',
                    margin: '0 0 12px 0',
                  }}
                >
                  Zero Movements Detected
                </h3>
                <p
                  style={{
                    color: '#64748b',
                    maxWidth: '300px',
                    margin: '0 auto 24px',
                    lineHeight: '1.6',
                  }}
                >
                  No records match your current filter parameters. Try adjusting your search or
                  matrix view.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterCategory('All');
                    setFilterAccount('All');
                    setFilterType('All');
                    setSelectedDate(null);
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.12)',
                    border: 'none',
                    color: '#fff',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    margin: '0 auto',
                  }}
                >
                  Reset Filters <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Entry Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div
            className="modal-card"
            style={{
              maxWidth: '540px',
            }}
          >
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
                {editId ? 'Edit Entry' : 'New Ledger Record'}
              </h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <form
              onSubmit={handleAddTransaction}
              style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label className="form-label">Operation Type</label>
                  <div
                    style={{
                      display: 'flex',
                      gap: '4px',
                      background: 'var(--ui-input-bg)',
                      padding: '4px',
                      borderRadius: '12px',
                      border: 'var(--ui-border)',
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
                {editId ? 'Commit Changes' : 'Record Transaction'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
