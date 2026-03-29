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
      // For all time, calculate based on date range
      const dates = expenseItems.map((e) => new Date(e.date).getTime());
      const earliest = Math.min(...dates);
      const latest = Math.max(...dates);
      const monthsDiff = Math.max(1, Math.ceil((latest - earliest) / (1000 * 60 * 60 * 24 * 30)));
      return totalExpenses / monthsDiff;
    }
    return 0;
  })();

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
      <div
        className="main-content"
        style={{
          backgroundColor: '#000000',
          minHeight: '100vh',
          color: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: '#94a3b8' }}>
            Loading your expenses...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="main-content"
      style={{ backgroundColor: '#000000', minHeight: '100vh', color: '#f8fafc' }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header Section */}
        <div className="page-header">
          <div>
            <h1
              className="page-title"
              style={{
                background: 'linear-gradient(to right, #fff, #94a3b8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Expenses
            </h1>
            <p className="page-subtitle">Track and manage your spending across categories</p>
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'flex',
                background: '#050505',
                padding: '6px',
                borderRadius: '14px',
                border: '1px solid #111111',
              }}
            >
              {['This Year', 'All Time'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as 'This Year' | 'All Time')}
                  aria-pressed={activeTab === tab}
                  style={{
                    padding: 'clamp(10px, 2vw, 12px) clamp(16px, 3vw, 20px)',
                    borderRadius: '10px',
                    border: 'none',
                    background:
                      activeTab === tab
                        ? 'linear-gradient(135deg, #1a1a1a 0%, #111111 100%)'
                        : 'transparent',
                    color: activeTab === tab ? '#fff' : '#64748b',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: '0.3s',
                    fontSize: 'clamp(0.8rem, 2vw, 0.85rem)',
                    minHeight: '44px',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              aria-label="Add new expense"
              className="header-add-btn header-add-btn--red"
            >
              <Plus size={18} strokeWidth={3} /> Add Expense
            </button>
          </div>
        </div>

        {/* Key Summary Cards */}
        <div
          className="section-fade-in"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))',
            gap: '32px',
            marginBottom: '48px',
          }}
        >
          {[
            {
              label:
                activeTab === 'This Year' ? 'Total Expenses (Year)' : 'Total Expenses (All Time)',
              value: `₹${totalExpenses.toLocaleString()}`,
              icon: <TrendingDown size={22} />,
              color: '#ef4444',
              sub: 'Money spent',
              gradient: 'linear-gradient(135deg, #ef444420 0%, #dc262610 100%)',
              cardClass: 'stat-card stat-card--red',
            },
            {
              label: 'Average per Month',
              value: `₹${avgMonthlySpending.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
              icon: <Calendar size={22} />,
              color: '#f59e0b',
              sub: 'Monthly spending',
              gradient: 'linear-gradient(135deg, #f59e0b20 0%, #d9770610 100%)',
              cardClass: 'stat-card stat-card--amber',
            },
            {
              label: 'Expense Categories',
              value: categories.length,
              icon: <ShoppingBag size={22} />,
              color: '#6366f1',
              sub: 'Tracked categories',
              gradient: 'linear-gradient(135deg, #6366f120 0%, #4f46e510 100%)',
              cardClass: 'stat-card stat-card--indigo',
            },
          ].map((stat, i) => (
            <div key={i} className={stat.cardClass}>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '100%',
                  height: '100%',
                  background: stat.gradient,
                  opacity: 0.5,
                }}
                aria-hidden="true"
              />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '20px',
                  }}
                >
                  <div
                    style={{
                      background: `${stat.color}15`,
                      padding: '10px',
                      borderRadius: '14px',
                      color: stat.color,
                    }}
                    aria-hidden="true"
                  >
                    {stat.icon}
                  </div>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: '#94a3b8',
                    }}
                  >
                    {stat.label}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 'clamp(1.8rem, 3vw, 2.4rem)',
                    fontWeight: '900',
                    color: '#fff',
                    marginBottom: '8px',
                    letterSpacing: '-1px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.85rem', color: stat.color, fontWeight: '700' }}>
                  {stat.sub}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          className="section-fade-in"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
            gap: '40px',
          }}
        >
          {/* Categories List */}
          <div>
            <h3
              style={{
                fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
                fontWeight: '900',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#fff',
              }}
            >
              <ShoppingBag size={20} color="#6366f1" aria-hidden="true" /> Expense Categories
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {categories.length > 0 ? (
                categories.map(([name, stats]) => (
                  <div key={name} className="expense-category-card">
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px',
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          width: '52px',
                          height: '52px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          borderRadius: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#f87171',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          flexShrink: 0,
                        }}
                        aria-hidden="true"
                      >
                        {getCategoryIcon(name)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            color: '#fff',
                            fontWeight: '800',
                            fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
                            marginBottom: '4px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600' }}
                          >
                            {stats.count} entries
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          color: '#ef4444',
                          fontSize: 'clamp(1.2rem, 2.5vw, 1.4rem)',
                          fontWeight: '900',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        ₹{stats.total.toLocaleString()}
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: '#64748b',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                        }}
                      >
                        Total Spent
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: '80px 24px',
                    textAlign: 'center',
                    background: '#050505',
                    borderRadius: '24px',
                    border: '1px dashed #111111',
                    color: '#94a3b8',
                  }}
                >
                  <EmptyTransactionsVisual />
                  <p style={{ marginTop: '24px', fontWeight: '700' }}>No categories yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Expenses History */}
          <div>
            <h3
              style={{
                fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
                fontWeight: '900',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#fff',
              }}
            >
              <div
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  padding: '8px',
                  borderRadius: '12px',
                }}
                aria-hidden="true"
              >
                <Clock size={20} color="#fff" />
              </div>
              <span>Recent Expenses</span>
            </h3>
            <div
              style={{
                background: '#050505',
                borderRadius: '28px',
                border: '1px solid #111111',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {expenseItems.length > 0 ? (
                expenseItems.slice(0, 8).map((item) => (
                  <div
                    key={item.id}
                    className="tx-row tx-row--expense"
                    style={{ flexWrap: 'wrap' }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          color: '#ef4444',
                          background: 'rgba(239, 68, 68, 0.1)',
                          padding: '8px',
                          borderRadius: '10px',
                          flexShrink: 0,
                        }}
                        aria-hidden="true"
                      >
                        {getCategoryIcon(item.category)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: '800',
                            fontSize: '1rem',
                            color: '#e2e8f0',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.description}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600' }}>
                          {item.category} |{' '}
                          {new Date(item.date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        textAlign: 'right',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <div
                        style={{
                          color: '#ef4444',
                          fontWeight: '950',
                          fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        -₹{item.amount.toLocaleString()}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(item);
                          }}
                          className="action-btn action-btn--edit"
                          aria-label="Edit expense"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            const isConfirmed = await customConfirm({
                              title: 'Delete Expense',
                              message: 'Are you sure you want to delete this expense record?',
                              type: 'error',
                              confirmLabel: 'Delete',
                            });
                            if (isConfirmed) {
                              await deleteTransaction(item.id);
                              showNotification('success', 'Expense record removed');
                            }
                          }}
                          className="action-btn action-btn--delete"
                          aria-label="Delete expense"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <EmptyTransactionsVisual />
                  <p style={{ color: '#94a3b8', marginTop: '20px', fontWeight: '700' }}>
                    No expense history found.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Simple Modal - Add Expense */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px',
                gap: '12px',
              }}
            >
              <h2
                style={{
                  fontSize: 'clamp(1.3rem, 3vw, 1.8rem)',
                  fontWeight: '900',
                  margin: 0,
                  color: '#fff',
                }}
              >
                {editId ? 'Edit expense' : 'Add expense'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
                className="modal-close"
                style={{ flexShrink: 0 }}
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={handleLogExpense}
              aria-label="Log expense form"
              style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label className="form-label">What did you spend on?</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Groceries, Uber ride, Movie tickets"
                  required
                  aria-label="Expense description"
                  className="form-input"
                  autoFocus
                />
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
                  gap: '20px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label className="form-label">Amount (₹)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    aria-label="Expense amount"
                    className="form-input"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    aria-label="Expense date"
                    className="form-input"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label className="form-label">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  aria-label="Expense category"
                  className="form-input"
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label className="form-label">Bank Account (Optional)</label>
                <select
                  value={selectedAccountId}
                  onChange={(e) =>
                    setSelectedAccountId(e.target.value ? Number(e.target.value) : '')
                  }
                  aria-label="Select bank account"
                  className="form-input"
                >
                  <option value="">Log only, do not deduct from an account</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} - ₹{acc.balance.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                aria-label="Save expense"
                className="btn-primary btn-primary--red"
              >
                {editId ? 'Update Expense' : 'Track This Expense'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
