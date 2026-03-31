'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/config/supabase';
import { useAuth } from '@/app/components/AuthContext';
import { useNotifications } from '@/app/components/NotificationContext';
import { useLedger } from '@/app/components/FinanceContext';
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
  Calendar,
  DollarSign,
  Edit3,
  History,
  LineChart,
  Plus,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import { EmptyPortfolioVisual } from '@/app/components/Visuals';

export interface ForexTrade {
  id: number;
  transaction_type: string;
  notes: string | null;
  amount: number;
  account_id: number | null;
  transaction_date: string | null;
}

const formatUsd = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(
        new Date(value)
      )
    : 'N/A';

export default function ForexClient() {
  const { user } = useAuth();
  const { accounts } = useLedger();
  const { showNotification, confirm: customConfirm } = useNotifications();
  const [trades, setTrades] = useState<ForexTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'lifetime'>('overview');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'BUY' | 'SELL'>('BUY');
  const [notes, setNotes] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState<number | ''>('');

  const fetchTrades = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('forex_transactions')
        .select('*')
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTrades((data || []) as ForexTrade[]);
    } catch (error: unknown) {
      showNotification(
        'error',
        error instanceof Error ? error.message : 'Failed to load forex trades'
      );
    } finally {
      setLoading(false);
    }
  }, [showNotification, user]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const stats = useMemo(() => {
    const buyVolume = trades
      .filter((trade) => trade.transaction_type === 'BUY')
      .reduce((sum, trade) => sum + trade.amount, 0);
    const sellVolume = trades
      .filter((trade) => trade.transaction_type === 'SELL')
      .reduce((sum, trade) => sum + trade.amount, 0);
    return {
      totalVolume: buyVolume + sellVolume,
      buyVolume,
      sellVolume,
      averageTicket: trades.length ? (buyVolume + sellVolume) / trades.length : 0,
    };
  }, [trades]);

  const monthlyFlow = useMemo(() => {
    const grouped = trades.reduce(
      (acc, trade) => {
        const baseDate = new Date(trade.transaction_date || new Date().toISOString());
        const key = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}`;
        if (!acc[key]) {
          acc[key] = {
            key,
            label: baseDate.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
            buy: 0,
            sell: 0,
          };
        }
        if (trade.transaction_type === 'BUY') acc[key].buy += trade.amount;
        else acc[key].sell += trade.amount;
        return acc;
      },
      {} as Record<string, { key: string; label: string; buy: number; sell: number }>
    );

    return Object.values(grouped)
      .sort((left, right) => left.key.localeCompare(right.key))
      .slice(-6)
      .map((item) => ({ ...item, net: item.sell - item.buy, volume: item.buy + item.sell }));
  }, [trades]);

  const sideMix = useMemo(
    () => [
      { name: 'BUY', value: stats.buyVolume, color: '#10b981' },
      { name: 'SELL', value: stats.sellVolume, color: '#f97316' },
    ],
    [stats.buyVolume, stats.sellVolume]
  );

  const resetForm = () => {
    setEditId(null);
    setAmount('');
    setTransactionType('BUY');
    setNotes('');
    setTransactionDate(new Date().toISOString().split('T')[0]);
    setAccountId('');
  };

  const handleEdit = (trade: ForexTrade) => {
    setEditId(trade.id);
    setAmount(trade.amount.toString());
    setTransactionType((trade.transaction_type as 'BUY' | 'SELL') || 'BUY');
    setNotes(trade.notes || '');
    setTransactionDate(trade.transaction_date || new Date().toISOString().split('T')[0]);
    setAccountId(trade.account_id || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !amount) return;

    const payload = {
      user_id: user.id,
      amount: Number(amount),
      transaction_type: transactionType,
      notes: notes || null,
      transaction_date: transactionDate || null,
      account_id: accountId ? Number(accountId) : null,
    };

    try {
      if (editId) {
        const { error } = await supabase
          .from('forex_transactions')
          .update(payload)
          .eq('id', editId);
        if (error) throw error;
        showNotification('success', 'Forex trade updated');
      } else {
        const { error } = await supabase.from('forex_transactions').insert([payload]);
        if (error) throw error;
        showNotification('success', 'Forex trade added');
      }
      setIsModalOpen(false);
      resetForm();
      fetchTrades();
    } catch (error: unknown) {
      showNotification(
        'error',
        error instanceof Error ? error.message : 'Unable to save forex trade'
      );
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await customConfirm({
      title: 'Delete Trade',
      message: 'Delete this forex transaction?',
      type: 'warning',
      confirmLabel: 'Delete',
    });

    if (!confirmed) return;

    const { error } = await supabase.from('forex_transactions').delete().eq('id', id);
    if (error) {
      showNotification('error', error.message);
      return;
    }

    showNotification('success', 'Forex trade removed');
    fetchTrades();
  };

  if (loading) {
    return (
      <div
        className="page-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
        }}
      >
        <div style={{ color: '#38bdf8', fontWeight: 800 }}>Loading forex history...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: '28px' }}>
        <div>
          <h1
            className="page-title"
            style={{
              background: 'linear-gradient(135deg, #38bdf8 0%, #2dd4bf 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Forex Terminal
          </h1>
          <p className="page-subtitle">
            USD-first tracking with overview, history, and lifetime flow.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="header-add-btn"
          style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)' }}
        >
          <Plus size={18} /> Record Trade
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {[
          {
            label: 'Total Volume',
            value: formatUsd(stats.totalVolume),
            sub: `${trades.length} trades`,
            icon: <DollarSign size={20} />,
            color: '#38bdf8',
          },
          {
            label: 'Buy Volume',
            value: formatUsd(stats.buyVolume),
            sub: 'USD outflow',
            icon: <TrendingUp size={20} />,
            color: '#10b981',
          },
          {
            label: 'Sell Volume',
            value: formatUsd(stats.sellVolume),
            sub: 'USD inflow',
            icon: <LineChart size={20} />,
            color: '#f97316',
          },
          {
            label: 'Average Ticket',
            value: formatUsd(stats.averageTicket),
            sub: 'Per trade',
            icon: <Calendar size={20} />,
            color: '#2dd4bf',
          },
        ].map((card) => (
          <div key={card.label} className="premium-card" style={{ padding: '20px' }}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}
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
                  color: '#64748b',
                  textTransform: 'uppercase',
                  fontWeight: 800,
                }}
              >
                {card.label}
              </div>
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900 }}>{card.value}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      <div
        className="mobile-tab-scroll"
        style={{ display: 'flex', width: 'fit-content', gap: '8px', marginBottom: '20px' }}
      >
        {(['overview', 'history', 'lifetime'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={activeTab === tab ? 'period-btn period-btn--active' : 'period-btn'}
            style={
              activeTab === tab
                ? {
                    borderColor: '#38bdf8',
                    color: '#38bdf8',
                    background: 'rgba(56, 189, 248, 0.08)',
                  }
                : {}
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab !== 'history' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
            gap: '24px',
            marginBottom: '24px',
          }}
        >
          <div className="premium-card" style={{ padding: '22px' }}>
            <div style={{ fontWeight: 800, color: '#fff', marginBottom: '14px' }}>
              {activeTab === 'overview' ? 'Monthly Flow' : 'Lifetime Volume Trend'}
            </div>
            <div style={{ height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyFlow}>
                  <defs>
                    <linearGradient id="forexFlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.36} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.05} />
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
                    tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      background: '#020617',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '14px',
                    }}
                    formatter={(value) => formatUsd(Number(value || 0))}
                  />
                  <Area
                    type="monotone"
                    dataKey={activeTab === 'overview' ? 'net' : 'volume'}
                    stroke="#38bdf8"
                    strokeWidth={3}
                    fill="url(#forexFlow)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="premium-card" style={{ padding: '22px' }}>
            <div style={{ fontWeight: 800, color: '#fff', marginBottom: '14px' }}>Buy vs Sell</div>
            <div style={{ height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sideMix.filter((item) => item.value > 0)}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={56}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {sideMix
                      .filter((item) => item.value > 0)
                      .map((item) => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      background: '#020617',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '14px',
                    }}
                    formatter={(value) => formatUsd(Number(value || 0))}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="premium-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <History size={18} color="#38bdf8" />
          <div style={{ fontWeight: 800, color: '#fff' }}>
            {activeTab === 'history' ? 'Trade History' : 'Latest Forex Entries'}
          </div>
        </div>
        {trades.length > 0 ? (
          <div style={{ display: 'grid', gap: '8px' }}>
            {trades.map((trade) => (
              <div
                key={trade.id}
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
                    width: '42px',
                    height: '42px',
                    borderRadius: '14px',
                    background:
                      trade.transaction_type === 'BUY'
                        ? 'rgba(16,185,129,0.12)'
                        : 'rgba(249,115,22,0.12)',
                    color: trade.transaction_type === 'BUY' ? '#10b981' : '#f97316',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <DollarSign size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, color: '#fff' }}>{trade.transaction_type}</div>
                  <div
                    style={{
                      fontSize: '0.74rem',
                      color: '#64748b',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {trade.notes || 'No pair/desk note'} • {formatDate(trade.transaction_date)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontWeight: 900,
                      color: trade.transaction_type === 'BUY' ? '#10b981' : '#f97316',
                    }}
                  >
                    {formatUsd(trade.amount)}
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
                      onClick={() => handleEdit(trade)}
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
                      onClick={() => handleDelete(trade.id)}
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
            ))}
          </div>
        ) : (
          <div style={{ padding: '56px 20px', textAlign: 'center', color: '#64748b' }}>
            <EmptyPortfolioVisual />
            <div style={{ marginTop: '16px', fontWeight: 700 }}>No forex transactions found.</div>
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
            <h2 className="modal-title">{editId ? 'Edit Forex Trade' : 'Add Forex Trade'}</h2>
            <p className="modal-subtitle">
              USD-focused entry form with account linking and desk notes.
            </p>
            <form onSubmit={handleSubmit} className="entry-form">
              <div className="entry-inline-toggle">
                <button
                  type="button"
                  className={
                    transactionType === 'BUY'
                      ? 'entry-toggle-btn entry-toggle-btn--active'
                      : 'entry-toggle-btn'
                  }
                  onClick={() => setTransactionType('BUY')}
                >
                  BUY
                </button>
                <button
                  type="button"
                  className={
                    transactionType === 'SELL'
                      ? 'entry-toggle-btn entry-toggle-btn--active'
                      : 'entry-toggle-btn'
                  }
                  onClick={() => setTransactionType('SELL')}
                >
                  SELL
                </button>
              </div>
              <div className="entry-grid">
                <div>
                  <label className="form-label">Amount (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    required
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Trade Date</label>
                  <input
                    type="date"
                    value={transactionDate}
                    onChange={(event) => setTransactionDate(event.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="entry-grid">
                <div>
                  <label className="form-label">Pair / Notes</label>
                  <input
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="USDINR, travel card, remittance..."
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Linked Account</label>
                  <select
                    value={accountId}
                    onChange={(event) =>
                      setAccountId(event.target.value ? Number(event.target.value) : '')
                    }
                    className="form-input"
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
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.16)',
                }}
              >
                <div className="entry-summary__row">
                  <span className="entry-summary__label">Side</span>
                  <span className="entry-summary__value">{transactionType}</span>
                </div>
                <div className="entry-summary__row">
                  <span className="entry-summary__label">Amount</span>
                  <span className="entry-summary__value">{formatUsd(Number(amount) || 0)}</span>
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
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)' }}
                >
                  {editId ? 'Update Trade' : 'Save Trade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
