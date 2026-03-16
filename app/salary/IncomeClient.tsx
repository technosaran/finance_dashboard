'use client';

import { useState, useMemo } from 'react';
import { useNotifications } from '../components/NotificationContext';
import { useFinance } from '../components/FinanceContext';
import { Transaction, TransactionCategory } from '@/lib/types';
import {
  TrendingUp,
  Calendar as CalendarIcon,
  Plus,
  X,
  Briefcase,
  DollarSign,
  Edit3,
  Trash2,
  TrendingDown,
  BarChart3,
  PieChart,
  HandCoins,
  Gem,
  LineChart,
  Home,
  Waves,
} from 'lucide-react';

// Help map categories to icons and colors
const categoryConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  Salary: { icon: <Briefcase size={18} />, color: '#10b981', label: 'Salary' },
  Business: { icon: <HandCoins size={18} />, color: '#6366f1', label: 'Business' },
  Investment: { icon: <LineChart size={18} />, color: '#f59e0b', label: 'Investment' },
  Dividend: { icon: <Gem size={18} />, color: '#ec4899', label: 'Dividend' },
  Rent: { icon: <Home size={18} />, color: '#8b5cf6', label: 'Rent' },
  Bonus: { icon: <Waves size={18} />, color: '#06b6d4', label: 'Bonus' },
  Other: { icon: <DollarSign size={18} />, color: '#94a3b8', label: 'Other' },
};

export default function IncomeClient() {
  const {
    accounts,
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    settings,
    loading,
  } = useFinance();
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
      case 'quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3);
        filteredItems = incomeItems.filter((item) => {
          const itemDate = new Date(item.date);
          const itemQuarter = Math.floor(itemDate.getMonth() / 3);
          return itemQuarter === currentQuarter && itemDate.getFullYear() === now.getFullYear();
        });
        break;
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
      showNotification('success', 'Income added! 💰');
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
        {/* Header Section */}
        <div className="page-header" style={{ marginBottom: '40px' }}>
          <div>
            <h1
              className="page-title"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Income Tracker
            </h1>
            <p className="page-subtitle">Manage and track your earnings across all sources</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="header-add-btn header-add-btn--green pulse-on-hover"
          >
            <Plus size={20} strokeWidth={3} /> Add Income
          </button>
        </div>

        {/* Period Selector & Quick Filters */}
        <div
          className="mobile-tab-scroll"
          style={{ marginBottom: '32px', display: 'flex', gap: '8px', paddingBottom: '8px' }}
        >
          {(['month', 'quarter', 'year', 'all'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={selectedPeriod === period ? 'period-btn period-btn--active' : 'period-btn'}
              style={{ padding: '10px 20px', fontSize: '0.85rem' }}
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

        {/* Stats Row */}
        <div
          className="section-fade-in"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
            gap: '20px',
            marginBottom: '40px',
          }}
        >
          <div className="stat-card stat-card--green">
            <div className="stat-card__glow" style={{ background: 'rgba(16, 185, 129, 0.15)' }} />
            <div
              className="stat-card__icon-box"
              style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}
            >
              <DollarSign size={24} />
            </div>
            <div className="stat-card__meta">Total Earned ({getPeriodLabel()})</div>
            <div className="stat-card__value">₹{stats.total.toLocaleString()}</div>
            {selectedPeriod === 'month' && stats.trend !== 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.85rem',
                  color: stats.trend > 0 ? '#10b981' : '#ef4444',
                  fontWeight: '800',
                  marginTop: '4px',
                }}
              >
                {stats.trend > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {Math.abs(stats.trend).toFixed(1)}% vs last month
              </div>
            )}
          </div>

          <div className="stat-card stat-card--indigo">
            <div className="stat-card__glow" style={{ background: 'rgba(99, 102, 241, 0.15)' }} />
            <div
              className="stat-card__icon-box"
              style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}
            >
              <BarChart3 size={24} />
            </div>
            <div className="stat-card__meta">Average Entry</div>
            <div className="stat-card__value">
              ₹{stats.average.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div
              style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px', fontWeight: '600' }}
            >
              From {stats.count} payment{stats.count !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="stat-card stat-card--amber">
            <div className="stat-card__glow" style={{ background: 'rgba(245, 158, 11, 0.15)' }} />
            <div
              className="stat-card__icon-box"
              style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}
            >
              <Briefcase size={24} />
            </div>
            <div className="stat-card__meta">Income Sources</div>
            <div className="stat-card__value">{stats.sourcesCount}</div>
            <div
              style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px', fontWeight: '600' }}
            >
              Active {getPeriodLabel().toLowerCase()}
            </div>
          </div>
        </div>

        {/* Major Content Row */}
        <div
          className="section-fade-in"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 500px), 1fr))',
            gap: '32px',
          }}
        >
          {/* Category & Source Breakdown */}
          <div className="premium-card">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '24px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                paddingBottom: '16px',
              }}
            >
              <div
                style={{
                  padding: '10px',
                  borderRadius: '12px',
                  background: 'rgba(168, 85, 247, 0.1)',
                  color: '#a855f7',
                }}
              >
                <PieChart size={20} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff', margin: 0 }}>
                Breakdown by Type
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {categoryData.length > 0 ? (
                categoryData.map((cat) => {
                  const config = categoryConfig[cat.name] || categoryConfig.Other;
                  const percentage = (cat.total / stats.total) * 100;
                  return (
                    <div
                      key={cat.name}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        padding: '16px',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.05)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '10px',
                              background: `${config.color}20`,
                              color: config.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifySelf: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {config.icon}
                          </div>
                          <div>
                            <div style={{ fontWeight: '800', color: '#fff', fontSize: '1rem' }}>
                              {config.label}
                            </div>
                            <div
                              style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}
                            >
                              {percentage.toFixed(1)}% of total
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div
                            style={{ fontWeight: '900', color: config.color, fontSize: '1.1rem' }}
                          >
                            ₹{cat.total.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: '6px',
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: '10px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${percentage}%`,
                            height: '100%',
                            background: config.color,
                            borderRadius: '10px',
                            transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  <HandCoins size={40} style={{ opacity: 0.2, marginBottom: '16px' }} />
                  <p>No income data for this period</p>
                </div>
              )}
            </div>
          </div>

          {/* History / Timeline */}
          <div className="premium-card">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '24px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                paddingBottom: '16px',
              }}
            >
              <div
                style={{
                  padding: '10px',
                  borderRadius: '12px',
                  background: 'rgba(6, 182, 212, 0.1)',
                  color: '#06b6d4',
                }}
              >
                <CalendarIcon size={20} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff', margin: 0 }}>
                Recent Payments
              </h3>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                maxHeight: '550px',
                overflowY: 'auto',
                paddingRight: '8px',
              }}
            >
              {stats.filteredItems.length > 0 ? (
                stats.filteredItems.slice(0, 15).map((item) => {
                  const config = categoryConfig[item.category as string] || categoryConfig.Other;
                  return (
                    <div
                      key={item.id}
                      className="tx-row"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px',
                        borderRadius: '14px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.05)',
                      }}
                    >
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
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: '700',
                              color: '#fff',
                              fontSize: '0.95rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.description}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>
                            {new Date(item.date).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontWeight: '900', color: '#10b981', fontSize: '1rem' }}>
                          +₹{item.amount.toLocaleString()}
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => handleEdit(item)}
                            className="mobile-action-btn"
                            style={{
                              background: 'rgba(255,255,255,0.05)',
                              border: 'none',
                              color: '#94a3b8',
                              padding: '8px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                            }}
                          >
                            <Edit3 size={14} />
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
                            className="mobile-action-btn"
                            style={{
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: 'none',
                              color: '#ef4444',
                              padding: '8px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
                  <TrendingUp size={48} style={{ opacity: 0.1, marginBottom: '20px' }} />
                  <p style={{ fontWeight: '700', fontSize: '1.1rem', color: '#94a3b8' }}>
                    No income history found
                  </p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    style={{
                      marginTop: '20px',
                      padding: '12px 24px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#fff',
                      border: 'none',
                      fontWeight: '800',
                      cursor: 'pointer',
                    }}
                  >
                    Record First Income
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '500px' }}>
            <button
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="modal-close"
            >
              <X size={20} />
            </button>

            <h2 className="modal-title">{editId ? 'Edit Income' : 'Add Income'}</h2>
            <p className="modal-subtitle">
              {editId
                ? 'Modify your earning details'
                : 'Keep track of your latest paycheck or reward'}
            </p>

            <form
              onSubmit={handleLogIncome}
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              <div>
                <label className="form-label">Source / Employer</label>
                <input
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder="e.g. Google, Fiverr, Rental"
                  required
                  className="form-input form-input--green"
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                    style={{ padding: '16px' }}
                  >
                    {Object.keys(categoryConfig).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                  <label className="form-label">Credit to</label>
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
                style={{ marginTop: '10px' }}
              >
                {editId ? 'Update Record' : 'Save Income Entry'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
