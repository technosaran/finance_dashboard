'use client';

import { useMemo, useState } from 'react';
import { useNotifications } from '../components/NotificationContext';
import { useLedger, useSettings } from '../components/FinanceContext';
import { Transaction, TransactionCategory } from '@/lib/types';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Briefcase,
  DollarSign,
  Edit3,
  Gem,
  HandCoins,
  Home,
  LineChart,
  Plus,
  Trash2,
  TrendingUp,
  Waves,
  X,
} from 'lucide-react';

const COLORS = ['#10b981', '#22c55e', '#14b8a6', '#f59e0b', '#ec4899', '#6366f1'];
const formatInr = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(value)
  );

const categoryConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  Salary: { icon: <Briefcase size={16} />, color: '#10b981' },
  Business: { icon: <HandCoins size={16} />, color: '#6366f1' },
  Investment: { icon: <LineChart size={16} />, color: '#f59e0b' },
  Dividend: { icon: <Gem size={16} />, color: '#ec4899' },
  Rent: { icon: <Home size={16} />, color: '#8b5cf6' },
  Bonus: { icon: <Waves size={16} />, color: '#06b6d4' },
  Other: { icon: <DollarSign size={16} />, color: '#94a3b8' },
};

export default function IncomeClient() {
  const { accounts, transactions, addTransaction, updateTransaction, deleteTransaction, loading } =
    useLedger();
  const { settings } = useSettings();
  const { showNotification, confirm: customConfirm } = useNotifications();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year' | 'all'>(
    'year'
  );
  const [selectedAccountId, setSelectedAccountId] = useState<number | ''>(
    settings.defaultSalaryAccountId || ''
  );
  const [amount, setAmount] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [category, setCategory] = useState<TransactionCategory>('Salary');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const incomeItems = useMemo(
    () =>
      transactions
        .filter((item) => item.type === 'Income')
        .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions]
  );

  const filteredItems = useMemo(() => {
    if (selectedPeriod === 'all') return incomeItems;
    const now = new Date();
    const start =
      selectedPeriod === 'month'
        ? new Date(now.getFullYear(), now.getMonth(), 1)
        : selectedPeriod === 'quarter'
          ? new Date(now.getFullYear(), now.getMonth() - 2, 1)
          : new Date(now.getFullYear(), 0, 1);

    return incomeItems.filter((item) => new Date(item.date) >= start);
  }, [incomeItems, selectedPeriod]);

  const stats = useMemo(() => {
    const total = filteredItems.reduce((sum, item) => sum + item.amount, 0);
    return {
      total,
      average: filteredItems.length ? total / filteredItems.length : 0,
      sources: new Set(filteredItems.map((item) => item.description)).size,
      count: filteredItems.length,
    };
  }, [filteredItems]);

  const categoryData = useMemo(() => {
    const grouped = filteredItems.reduce(
      (acc, item) => {
        const key = item.category || 'Other';
        acc[key] = (acc[key] || 0) + item.amount;
        return acc;
      },
      {} as Record<string, number>
    );
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [filteredItems]);

  const monthlyData = useMemo(() => {
    const grouped = filteredItems.reduce(
      (acc, item) => {
        const current = new Date(item.date);
        const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        if (!acc[key]) {
          acc[key] = {
            key,
            label: current.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
            total: 0,
          };
        }
        acc[key].total += item.amount;
        return acc;
      },
      {} as Record<string, { key: string; label: string; total: number }>
    );
    return Object.values(grouped)
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-6);
  }, [filteredItems]);

  const resetForm = () => {
    setAmount('');
    setSourceName('');
    setCategory('Salary');
    setDate(new Date().toISOString().split('T')[0]);
    setSelectedAccountId(settings.defaultSalaryAccountId || '');
    setEditId(null);
  };

  const handleEdit = (item: Transaction) => {
    setEditId(item.id);
    setAmount(item.amount.toString());
    setSourceName(item.description);
    setCategory(item.category as TransactionCategory);
    setDate(item.date);
    setSelectedAccountId(item.accountId || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!amount || !sourceName) return;
    const payload = {
      date,
      description: sourceName.trim(),
      category,
      type: 'Income' as const,
      amount: Number(amount),
      accountId: selectedAccountId ? Number(selectedAccountId) : undefined,
    };

    if (editId) {
      await updateTransaction(editId, payload);
      showNotification('success', 'Income updated');
    } else {
      await addTransaction(payload);
      showNotification('success', 'Income added');
    }

    setIsModalOpen(false);
    resetForm();
  };

  if (loading) return null;

  return (
    <div
      className="main-content"
      style={{ backgroundColor: '#000000', minHeight: '100vh', padding: '16px' }}
    >
      <div style={{ maxWidth: '1220px', margin: '0 auto' }}>
        <div className="page-header" style={{ marginBottom: '28px' }}>
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
            <p className="page-subtitle">Family-style overview with fast entry and live charts.</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="header-add-btn header-add-btn--green"
          >
            <Plus size={18} /> Add Income
          </button>
        </div>

        <div
          className="mobile-tab-scroll"
          style={{ display: 'flex', width: 'fit-content', gap: '8px', marginBottom: '16px' }}
        >
          {(['month', 'quarter', 'year', 'all'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={selectedPeriod === period ? 'period-btn period-btn--active' : 'period-btn'}
              style={selectedPeriod === period ? { borderColor: '#10b981', color: '#10b981' } : {}}
            >
              {period === 'all' ? 'All' : period}
            </button>
          ))}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          {[
            {
              label: 'Total Earned',
              value: formatInr(stats.total),
              sub: `${stats.count} entries`,
              icon: <DollarSign size={20} />,
              color: '#10b981',
            },
            {
              label: 'Average Credit',
              value: formatInr(stats.average),
              sub: 'Per entry',
              icon: <TrendingUp size={20} />,
              color: '#22c55e',
            },
            {
              label: 'Income Sources',
              value: String(stats.sources),
              sub: 'Active now',
              icon: <Briefcase size={20} />,
              color: '#06b6d4',
            },
          ].map((card) => (
            <div
              key={card.label}
              className="stat-card stat-card--green"
              style={{ minHeight: 'auto' }}
            >
              <div className="stat-card__glow" style={{ background: `${card.color}22` }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: `${card.color}18`,
                      color: card.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {card.icon}
                  </div>
                  <div
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: '800',
                      color: '#64748b',
                      textTransform: 'uppercase',
                    }}
                  >
                    {card.label}
                  </div>
                </div>
                <div style={{ fontSize: '1.7rem', fontWeight: '900' }}>{card.value}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
                  {card.sub}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          className="mobile-tab-scroll"
          style={{ display: 'flex', width: 'fit-content', gap: '8px', marginBottom: '20px' }}
        >
          {(['overview', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={activeTab === tab ? 'period-btn period-btn--active' : 'period-btn'}
              style={
                activeTab === tab
                  ? {
                      borderColor: '#10b981',
                      color: '#10b981',
                      background: 'rgba(16, 185, 129, 0.08)',
                    }
                  : {}
              }
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'overview' ? (
          <div style={{ display: 'grid', gap: '24px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
                gap: '24px',
              }}
            >
              <div className="premium-card" style={{ padding: '22px' }}>
                <div style={{ fontWeight: '800', color: '#fff', marginBottom: '16px' }}>
                  Income Trend
                </div>
                <div style={{ height: '260px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.38} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b' }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b' }}
                        tickFormatter={(value) => `₹${Math.round(value / 1000)}k`}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          background: '#020617',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '14px',
                        }}
                        formatter={(value) => formatInr(Number(value || 0))}
                      />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#10b981"
                        strokeWidth={3}
                        fill="url(#incomeFill)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="premium-card" style={{ padding: '22px' }}>
                <div style={{ fontWeight: '800', color: '#fff', marginBottom: '16px' }}>
                  Income Mix
                </div>
                <div style={{ height: '260px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={56}
                        outerRadius={90}
                        paddingAngle={3}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={
                              categoryConfig[entry.name]?.color || COLORS[index % COLORS.length]
                            }
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          background: '#020617',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '14px',
                        }}
                        formatter={(value) => formatInr(Number(value || 0))}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="premium-card" style={{ padding: '22px' }}>
              <div style={{ fontWeight: '800', color: '#fff', marginBottom: '14px' }}>
                Recent Income
              </div>
              <div style={{ display: 'grid', gap: '10px' }}>
                {filteredItems.slice(0, 5).map((item) => {
                  const config = categoryConfig[item.category as string] || categoryConfig.Other;
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 14px',
                        borderRadius: '16px',
                        background: 'rgba(255,255,255,0.03)',
                      }}
                    >
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '12px',
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
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: '800',
                            color: '#fff',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.description}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          {item.category} • {formatDate(item.date)}
                        </div>
                      </div>
                      <div style={{ fontWeight: '900', color: '#10b981' }}>
                        {formatInr(item.amount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="premium-card" style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gap: '8px' }}>
              {filteredItems.map((item) => {
                const config = categoryConfig[item.category as string] || categoryConfig.Other;
                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '14px',
                      borderRadius: '18px',
                      background: 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
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
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: '800',
                          color: '#fff',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.description}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        {item.category} • {formatDate(item.date)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '900', color: '#10b981' }}>
                        {formatInr(item.amount)}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          gap: '6px',
                          marginTop: '6px',
                        }}
                      >
                        <button
                          onClick={() => handleEdit(item)}
                          className="action-btn action-btn--edit"
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={async () => {
                            const ok = await customConfirm({
                              title: 'Delete Income',
                              message: `Delete ${item.description}?`,
                              type: 'error',
                              confirmLabel: 'Delete',
                            });
                            if (ok) {
                              await deleteTransaction(item.id);
                              showNotification('success', 'Income deleted');
                            }
                          }}
                          className="action-btn action-btn--delete"
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card entry-sheet">
            <div className="entry-sheet__handle" />
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
            <p className="modal-subtitle">Compact entry form for quick mobile logging.</p>
            <form onSubmit={handleSubmit} className="entry-form">
              <div className="entry-grid">
                <div>
                  <label className="form-label">Source</label>
                  <input
                    value={sourceName}
                    onChange={(event) => setSourceName(event.target.value)}
                    required
                    autoFocus
                    className="form-input form-input--green"
                  />
                </div>
                <div>
                  <label className="form-label">Amount</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    required
                    className="form-input form-input--green"
                  />
                </div>
              </div>
              <div className="entry-grid entry-grid--three">
                <div>
                  <label className="form-label">Category</label>
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value as TransactionCategory)}
                    className="form-input form-input--green"
                  >
                    {Object.keys(categoryConfig).map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className="form-input form-input--green"
                  />
                </div>
                <div>
                  <label className="form-label">Account</label>
                  <select
                    value={selectedAccountId}
                    onChange={(event) =>
                      setSelectedAccountId(event.target.value ? Number(event.target.value) : '')
                    }
                    className="form-input form-input--green"
                  >
                    <option value="">No account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div
                className="entry-summary"
                style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.16)',
                }}
              >
                <div className="entry-summary__row">
                  <span className="entry-summary__label">Source</span>
                  <span className="entry-summary__value">{sourceName || 'Untitled income'}</span>
                </div>
                <div className="entry-summary__row">
                  <span className="entry-summary__label">Credit</span>
                  <span className="entry-summary__value entry-summary__value--positive">
                    {formatInr(Number(amount) || 0)}
                  </span>
                </div>
              </div>
              <div className="entry-actions">
                <button
                  type="button"
                  className="entry-secondary-btn"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary btn-primary--green">
                  {editId ? 'Update Income' : 'Save Income'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
