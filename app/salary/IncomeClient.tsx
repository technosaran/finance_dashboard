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
    <div className="main-content fade-in" style={{ padding: '40px' }}>
      <div style={{ margin: '0 auto' }}>
        {/* Header - Ultra Minimalist Emerald */}
        <div
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
              Income<span style={{ color: '#10b981' }}>.</span>
            </h1>
            <p className="stat-label" style={{ fontSize: '0.85rem' }}>
              Family-wide earnings and inflow overview
            </p>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div
              className="glass-container"
              style={{ display: 'flex', padding: '5px', borderRadius: '14px' }}
            >
              {(['month', 'quarter', 'year', 'all'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    background: selectedPeriod === period ? '#10b981' : 'transparent',
                    color: selectedPeriod === period ? '#fff' : 'var(--text-secondary)',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {period}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="header-add-btn header-add-btn--green"
              style={{
                padding: '14px 24px',
                borderRadius: '16px',
                boxShadow: '0 12px 30px rgba(16, 185, 129, 0.2)',
              }}
            >
              <Plus size={20} /> New Entry
            </button>
          </div>
        </div>

        {/* High-Impact Stat Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '32px',
            marginBottom: '64px',
          }}
        >
          {[
            {
              label: 'Total Earned',
              value: formatInr(stats.total),
              icon: <TrendingUp size={16} />,
              color: '#10b981',
              subtitle: `${stats.count} individual credits`,
            },
            {
              label: 'Monthly Velocity',
              value: formatInr(stats.average),
              icon: <Waves size={16} />,
              color: '#06b6d4',
              subtitle: 'Average per payment cycle',
            },
          ].map((card) => (
            <div
              key={card.label}
              className="premium-card"
              style={{ padding: '32px', position: 'relative' }}
            >
              <div
                style={{
                  background: `radial-gradient(circle at top right, ${card.color}22, transparent 70%)`,
                  position: 'absolute',
                  inset: 0,
                  opacity: 0.6,
                }}
              />
              <div style={{ position: 'relative' }}>
                <span
                  className="stat-label"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', color: card.color }}
                >
                  {card.icon} {card.label}
                </span>
                <div
                  style={{
                    fontSize: '3.5rem',
                    fontWeight: 950,
                    letterSpacing: '-3px',
                    marginTop: '12px',
                  }}
                >
                  {card.value}
                </div>
                <p className="stat-label" style={{ marginTop: '12px', fontSize: '0.75rem' }}>
                  {card.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Content Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 340px',
            gap: '40px',
            alignItems: 'start',
          }}
          className="dashboard-grid"
        >
          {/* Main List */}
          <div>
            <div
              className="glass-container"
              style={{
                display: 'flex',
                padding: '4px',
                borderRadius: '12px',
                width: 'fit-content',
                marginBottom: '32px',
              }}
            >
              {(['overview', 'history'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '8px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: activeTab === tab ? 'white' : 'transparent',
                    color: activeTab === tab ? '#000' : 'var(--text-secondary)',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    transition: '0.2s',
                    textTransform: 'uppercase',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'overview' ? (
              <div style={{ display: 'grid', gap: '40px' }}>
                {/* Visual Chart Panel */}
                <div className="premium-card" style={{ padding: '32px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '32px',
                    }}
                  >
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900 }}>Credit Velocity</h3>
                    <LineChart size={18} className="stat-label" />
                  </div>
                  <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyData}>
                        <defs>
                          <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis
                          dataKey="label"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: 'var(--text-tertiary)', fontSize: 10, fontWeight: 700 }}
                        />
                        <YAxis hide axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                        <RechartsTooltip
                          contentStyle={{
                            background: '#0a0a0a',
                            border: '1px solid var(--surface-border)',
                            borderRadius: '16px',
                            padding: '16px',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                          }}
                          formatter={(value) => [
                            `₹${(Number(value) || 0).toLocaleString()}`,
                            'Total',
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="total"
                          stroke="#10b981"
                          strokeWidth={3}
                          fill="url(#incomeFill)"
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Sub-list of Recent */}
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 950, marginBottom: '24px' }}>
                    History
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {filteredItems.slice(0, 8).map((item) => {
                      const config =
                        categoryConfig[item.category as string] || categoryConfig.Other;
                      return (
                        <div
                          key={item.id}
                          className="ledger-row-hover"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '20px 24px',
                            borderRadius: '20px',
                            background: 'rgba(255,255,255,0.01)',
                            border: '1px solid var(--surface-border)',
                          }}
                        >
                          <div
                            style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '14px',
                              background: 'var(--surface-hover)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: config.color,
                              marginRight: '20px',
                            }}
                          >
                            {config.icon}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>
                              {item.description}
                            </div>
                            <div
                              className="stat-label"
                              style={{ fontSize: '0.75rem', marginTop: '2px' }}
                            >
                              {item.category} • {formatDate(item.date)}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 950, color: '#10b981', fontSize: '1.2rem' }}>
                              +{formatInr(item.amount)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {filteredItems.map((item) => {
                  const config = categoryConfig[item.category as string] || categoryConfig.Other;
                  return (
                    <div
                      key={item.id}
                      className="ledger-row-hover"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 24px',
                        borderRadius: '16px',
                        background: 'rgba(255,255,255,0.01)',
                        border: '1px solid var(--surface-border)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          flexShrink: 0,
                        }}
                      >
                        <div style={{ color: config.color }}>{config.icon}</div>
                        <div style={{ width: '120px', fontWeight: 800 }}>{item.description}</div>
                        <div className="stat-label" style={{ fontSize: '0.75rem', width: '90px' }}>
                          {item.category}
                        </div>
                        <div className="stat-label" style={{ fontSize: '0.75rem', width: '100px' }}>
                          {formatDate(item.date)}
                        </div>
                      </div>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: '24px', minWidth: 0 }}
                      >
                        <div style={{ fontWeight: 950, color: '#10b981', fontSize: '1.1rem' }}>
                          {formatInr(item.amount)}
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => handleEdit(item)}
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
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={async () => {
                              const ok = await customConfirm({
                                title: 'Delete Inflow',
                                message: 'Permanently remove this entry?',
                                type: 'error',
                                confirmLabel: 'Delete',
                              });
                              if (ok) await deleteTransaction(item.id);
                            }}
                            className="action-btn-danger--hover"
                            style={{
                              padding: '8px',
                              borderRadius: '10px',
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar Analytics - Emerald Style */}
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}
            className="hide-md"
          >
            <div className="premium-card" style={{ padding: '32px' }}>
              <h3
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 900,
                  color: 'var(--text-secondary)',
                  letterSpacing: '1px',
                  marginBottom: '32px',
                  textTransform: 'uppercase',
                }}
              >
                Inflow Dynamics
              </h3>
              <div style={{ height: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={68}
                      outerRadius={90}
                      paddingAngle={4}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={categoryConfig[entry.name]?.color || COLORS[index % COLORS.length]}
                          stroke="transparent"
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        background: '#0a0a0a',
                        border: '1px solid var(--surface-border)',
                        borderRadius: '12px',
                      }}
                      formatter={(value) => formatInr(Number(value || 0))}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ marginTop: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                {categoryData.map((entry) => (
                  <div
                    key={entry.name}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: categoryConfig[entry.name]?.color || '#fff',
                      }}
                    />
                    <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="premium-card" style={{ padding: '32px' }}>
              <h3
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 900,
                  color: 'var(--text-secondary)',
                  letterSpacing: '1px',
                  marginBottom: '24px',
                  textTransform: 'uppercase',
                }}
              >
                Recent Accumulation
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {monthlyData.map((d, i) => (
                  <div key={d.key}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        marginBottom: '8px',
                      }}
                    >
                      <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{d.label}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 950, color: '#10b981' }}>
                        {formatInr(d.total)}
                      </span>
                    </div>
                    <div
                      style={{
                        height: '4px',
                        background: 'var(--surface-hover)',
                        borderRadius: '100px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${(d.total / Math.max(...monthlyData.map((v) => v.total))) * 100}%`,
                          height: '100%',
                          background: '#10b981',
                          opacity: 0.8,
                          borderRadius: '100px',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
