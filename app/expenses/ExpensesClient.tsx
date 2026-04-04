'use client';

import { useState } from 'react';
import { useNotifications } from '../components/NotificationContext';
import { useLedger, useSettings } from '../components/FinanceContext';
import { Transaction } from '@/lib/types';
import {
  TrendingDown,
  Calendar,
  Plus,
  X,
  Clock,
  ShoppingBag,
  Coffee,
  Edit3,
  Trash2,
  Car,
  Home,
  Heart,
  GraduationCap,
  Zap,
} from 'lucide-react';
import { EmptyTransactionsVisual } from '../components/Visuals';

export default function ExpensesClient() {
  const { accounts, transactions, addTransaction, updateTransaction, deleteTransaction, loading } =
    useLedger();
  const { settings } = useSettings();
  const { showNotification, confirm: customConfirm } = useNotifications();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'This Year' | 'All Time'>('This Year');
  const [selectedAccountId, setSelectedAccountId] = useState<number | ''>(
    settings.defaultSalaryAccountId || ''
  );

  // Expense Data Filtering
  const expenseItems = transactions.filter(
    (t) => t.type === 'Expense' && t.category !== 'Investment'
  );

  // Process Categories
  const categoriesMap = expenseItems.reduce(
    (acc, item) => {
      const category = item.category || 'Other';
      if (!acc[category]) acc[category] = { total: 0, count: 0 };
      acc[category].total += item.amount;
      acc[category].count += 1;
      return acc;
    },
    {} as Record<string, { total: number; count: number }>
  );

  const categories = Object.entries(categoriesMap).sort((a, b) => b[1].total - a[1].total);
  const totalExpenses = expenseItems.reduce((sum, item) => sum + item.amount, 0);

  // Calculate average monthly spending
  const avgMonthlySpending = (() => {
    if (activeTab === 'This Year') {
      return totalExpenses / Math.max(new Date().getMonth() + 1, 1);
    } else if (expenseItems.length > 0) {
      const dates = expenseItems.map((e) => new Date(e.date).getTime());
      const earliest = Math.min(...dates);
      const latest = Math.max(...dates);
      const monthsDiff = Math.max(1, Math.ceil((latest - earliest) / (1000 * 60 * 60 * 24 * 30)));
      return totalExpenses / monthsDiff;
    }
    return 0;
  })();

  // Calculate monthly data for the last 6 months
  const monthlyData = (() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleString('default', { month: 'short' });
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const total = expenseItems
        .filter((item) => item.date.startsWith(monthKey))
        .reduce((sum, item) => sum + item.amount, 0);
      months.push({ label: monthLabel, total });
    }
    return months;
  })();

  const maxMonthSpend = Math.max(...monthlyData.map((d) => d.total), 1);

  // Form State
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleLogExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    const txData = {
      date,
      description,
      category,
      type: 'Expense' as const,
      amount: parseFloat(amount),
      accountId: selectedAccountId ? Number(selectedAccountId) : undefined,
    };

    if (editId) {
      await updateTransaction(editId, txData);
      showNotification('success', 'Expense record updated');
    } else {
      await addTransaction(txData);
      showNotification('success', 'Expense saved');
    }

    resetForm();
    setIsModalOpen(false);
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setCategory('Food');
    setDate(new Date().toISOString().split('T')[0]);
    setEditId(null);
  };

  const handleEdit = (item: Transaction) => {
    setEditId(item.id);
    setAmount(item.amount.toString());
    setDescription(item.description);
    setCategory(item.category);
    setDate(item.date);
    setIsModalOpen(true);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Food':
        return <Coffee size={24} />;
      case 'Transport':
        return <Car size={24} />;
      case 'Shopping':
        return <ShoppingBag size={24} />;
      case 'Healthcare':
        return <Heart size={24} />;
      case 'Education':
        return <GraduationCap size={24} />;
      case 'Utilities':
        return <Zap size={24} />;
      case 'Entertainment':
        return <Home size={24} />;
      default:
        return <ShoppingBag size={24} />;
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            color: '#94a3b8',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(30, 166, 114, 0.1)',
                borderTopColor: '#1ea672',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px',
              }}
            />
            <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>Loading your expenses...</div>
          </div>
          <style jsx>{`
            @keyframes spin {
              to {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container page-surface page-shell">
      {/* Header Section: Ultra-minimalist */}
      <div
        className="page-header page-shell__header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '56px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '3rem',
              fontWeight: 950,
              letterSpacing: '-2px',
              fontFamily: 'var(--font-outfit)',
            }}
          >
            Expenses<span style={{ color: 'var(--error)' }}>.</span>
          </h1>
          <p className="stat-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Real-time spending intelligence
          </p>
        </div>
        <div
          className="page-toolbar"
          style={{ display: 'flex', gap: '16px', alignItems: 'center' }}
        >
          <div
            className="glass-container"
            style={{ display: 'flex', padding: '5px', borderRadius: '14px' }}
          >
            {['This Year', 'All Time'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as 'This Year' | 'All Time')}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === tab ? 'var(--error)' : 'transparent',
                  color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="header-add-btn header-add-btn--red"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 24px',
              borderRadius: '16px',
              boxShadow: '0 12px 30px rgba(239, 68, 68, 0.2)',
            }}
          >
            <Plus size={20} /> New Expense
          </button>
        </div>
      </div>

      {/* Hero Analytics Section */}
      <div
        className="page-shell__hero"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '32px',
          marginBottom: '64px',
        }}
      >
        <div className="premium-card" style={{ padding: '32px', position: 'relative' }}>
          <div
            style={{
              background:
                'radial-gradient(circle at top right, var(--error-light), transparent 70%)',
              position: 'absolute',
              inset: 0,
              opacity: 0.5,
            }}
          />
          <div style={{ position: 'relative' }}>
            <span
              className="stat-label"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--error)' }}
            >
              <TrendingDown size={14} /> Total Outflow
            </span>
            <div
              style={{
                fontSize: '3.5rem',
                fontWeight: 950,
                letterSpacing: '-3px',
                marginTop: '12px',
              }}
            >
              ₹{totalExpenses.toLocaleString()}
            </div>
            <p className="stat-label" style={{ marginTop: '12px', fontSize: '0.75rem' }}>
              {activeTab === 'This Year' ? 'Since Jan 1st' : 'Accumulated total spend'}
            </p>
          </div>
        </div>

        <div className="premium-card" style={{ padding: '32px', position: 'relative' }}>
          <div
            style={{
              background:
                'radial-gradient(circle at top right, var(--warning-light), transparent 70%)',
              position: 'absolute',
              inset: 0,
              opacity: 0.5,
            }}
          />
          <div style={{ position: 'relative' }}>
            <span
              className="stat-label"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning)' }}
            >
              <Calendar size={14} /> Monthly Velocity
            </span>
            <div
              style={{
                fontSize: '3.5rem',
                fontWeight: 950,
                letterSpacing: '-3px',
                marginTop: '12px',
              }}
            >
              ₹{avgMonthlySpending.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <p className="stat-label" style={{ marginTop: '12px', fontSize: '0.75rem' }}>
              Typical monthly expenditure
            </p>
          </div>
        </div>
      </div>

      {/* Detail Grid */}
      <div
        className="dashboard-grid page-split-layout page-split-layout--aside-360"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 360px',
          gap: '40px',
          alignItems: 'start',
        }}
      >
        {/* Recent History Table-less List */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '32px',
            }}
          >
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900 }}>Recent Transactions</h3>
            <span className="stat-label" style={{ fontSize: '0.6rem' }}>
              Last 15 ENTRIES
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {expenseItems.length > 0 ? (
              expenseItems.slice(0, 15).map((item) => (
                <div
                  key={item.id}
                  className="ledger-row-hover"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '20px 24px',
                    borderRadius: '20px',
                    background: 'rgba(255, 255, 255, 0.01)',
                    border: '1px solid var(--surface-border)',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '16px',
                      background: 'var(--surface-hover)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-secondary)',
                      marginRight: '20px',
                    }}
                  >
                    {getCategoryIcon(item.category)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, marginRight: '24px' }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '1rem',
                        marginBottom: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.description}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: '12px',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <span style={{ fontWeight: 700, color: 'var(--text-tertiary)' }}>
                        {item.category}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(item.date).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', marginRight: '24px' }}>
                    <div style={{ fontWeight: 950, color: '#ff4d4d', fontSize: '1.1rem' }}>
                      -₹{item.amount.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleEdit(item)}
                      style={{
                        padding: '10px',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: '0.2s',
                      }}
                      className="action-btn--hover"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={async () => {
                        const confirmed = await customConfirm({
                          title: 'Delete record',
                          message: 'This action cannot be undone.',
                          type: 'error',
                          confirmLabel: 'Delete',
                        });
                        if (confirmed) await deleteTransaction(item.id);
                      }}
                      style={{
                        padding: '10px',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: '0.2s',
                      }}
                      className="action-btn-danger--hover"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div
                style={{
                  padding: '100px 40px',
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.01)',
                  borderRadius: '32px',
                  border: '1px dashed var(--surface-border)',
                }}
              >
                <EmptyTransactionsVisual />
                <p className="stat-label" style={{ marginTop: '24px' }}>
                  Awaiting your first expense...
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Analytics & Insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }} className="hide-md">
          {/* Monthly Trend - Linear Style */}
          <div className="premium-card" style={{ padding: '32px' }}>
            <h3
              style={{
                fontSize: '0.9rem',
                fontWeight: 800,
                marginBottom: '40px',
                color: 'var(--text-secondary)',
                letterSpacing: '1px',
              }}
            >
              MONTHLY VELOCITY
            </h3>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                height: '160px',
                gap: '12px',
                position: 'relative',
              }}
            >
              {monthlyData.map((d, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: `${(d.total / maxMonthSpend) * 100}%`,
                      background:
                        i === monthlyData.length - 1
                          ? 'linear-gradient(to top, var(--error), #ff6b6b)'
                          : 'var(--surface-hover)',
                      borderRadius: '8px 8px 4px 4px',
                      minHeight: d.total > 0 ? '6px' : '0',
                      transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)',
                      position: 'relative',
                      border:
                        i === monthlyData.length - 1 ? 'none' : '1px solid var(--surface-border)',
                    }}
                  >
                    {d.total > 0 && (
                      <div
                        className="stat-label"
                        style={{
                          position: 'absolute',
                          top: '-24px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: '0.6rem',
                          color: i === monthlyData.length - 1 ? '#fff' : 'var(--text-secondary)',
                        }}
                      >
                        {d.total > 1000 ? `${(d.total / 1000).toFixed(0)}k` : d.total}
                      </div>
                    )}
                  </div>
                  <span
                    className="stat-label"
                    style={{
                      fontSize: '0.65rem',
                      color: i === monthlyData.length - 1 ? '#fff' : 'var(--text-secondary)',
                    }}
                  >
                    {d.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Expenditures */}
          <div className="premium-card" style={{ padding: '32px' }}>
            <h3
              style={{
                fontSize: '0.9rem',
                fontWeight: 800,
                marginBottom: '32px',
                color: 'var(--text-secondary)',
                letterSpacing: '1px',
              }}
            >
              BURN BY CATEGORY
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {categories.slice(0, 5).map(([name, stats]) => {
                const perc = (stats.total / totalExpenses) * 100;
                return (
                  <div key={name}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        marginBottom: '10px',
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{name}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 950, color: 'var(--error)' }}>
                        ₹{stats.total.toLocaleString()}
                      </span>
                    </div>
                    <div
                      style={{
                        height: '6px',
                        background: 'var(--surface-hover)',
                        borderRadius: '100px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${perc}%`,
                          height: '100%',
                          background: 'var(--error)',
                          borderRadius: '100px',
                          opacity: 0.8,
                          transition: 'width 1s ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Refined Modal - New UI */}
      {isModalOpen && (
        <div
          className="modal-overlay"
          style={{ backdropFilter: 'blur(30px) saturate(200%)', background: 'rgba(0,0,0,0.6)' }}
        >
          <div
            className="modal-card"
            style={{ maxWidth: '520px', padding: '48px', borderRadius: '40px' }}
          >
            <div
              className="page-toolbar page-toolbar--spread"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: '40px',
              }}
            >
              <div>
                <h2 style={{ fontSize: '2rem', fontWeight: 950, letterSpacing: '-1.5px' }}>
                  {editId ? 'Modify Entry' : 'Log Expense'}
                </h2>
                <p className="stat-label" style={{ fontSize: '0.7rem' }}>
                  Keep your records precise
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="modal-close"
                style={{ position: 'relative', top: 'auto', right: 'auto' }}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleLogExpense}
              style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label className="form-label" style={{ fontSize: '0.7rem' }}>
                  What did you spend on?
                </label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Groceries, Uber, etc."
                  required
                  className="form-input"
                  style={{
                    fontSize: '1.1rem',
                    padding: '20px',
                    borderRadius: '20px',
                    borderColor: 'var(--surface-border)',
                  }}
                  autoFocus
                />
              </div>

              <div
                className="form-grid-2"
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="form-input"
                    style={{ fontSize: '1.1rem', padding: '20px', borderRadius: '20px' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="form-input"
                    style={{ fontSize: '1rem', padding: '20px', borderRadius: '20px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label className="form-label" style={{ fontSize: '0.7rem' }}>
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '1rem', padding: '18px', borderRadius: '20px' }}
                >
                  <option value="Food">Food & Dining</option>
                  <option value="Transport">Transport</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Education">Education</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn-primary btn-primary--red"
                style={{
                  padding: '24px',
                  borderRadius: '24px',
                  fontSize: '1.05rem',
                  fontWeight: 900,
                  marginTop: '12px',
                  boxShadow: '0 20px 40px rgba(239, 68, 68, 0.25)',
                }}
              >
                {editId ? 'Confirm Updates' : 'Sync Expense'}
              </button>
            </form>
          </div>
        </div>
      )}
      <style>{`
        .ledger-row-hover:hover {
          background: var(--surface-hover);
        }
        .action-btn--hover:hover {
          background: var(--accent-light);
          color: var(--accent-hover) !important;
        }
        .action-btn-danger--hover:hover {
          background: var(--error-light);
          color: var(--error) !important;
        }
        .glass-container {
          background: var(--surface-hover);
          border: 1px solid var(--surface-border);
          box-shadow: inset 0 0 20px rgba(255,255,255,0.02);
        }
      `}</style>
    </div>
  );
}
