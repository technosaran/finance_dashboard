'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Edit,
  Trash2,
  Calendar,
  Search,
  Globe,
  RefreshCw,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { useFinance } from '../components/FinanceContext';
import { ForexTransaction } from '@/lib/types';
import { SkeletonCard } from '../components/SkeletonLoader';
import { useNotifications } from '../components/NotificationContext';

type TransactionFilter = 'ALL' | 'DEPOSIT' | 'WITHDRAWAL' | 'PROFIT' | 'LOSS';

interface ExchangeRates {
  [pair: string]: { rate: number; updatedAt: string };
}

export default function ForexClient() {
  const {
    forexTransactions,
    loading,
    addForexTransaction,
    updateForexTransaction,
    deleteForexTransaction,
    accounts,
    settings,
  } = useFinance();
  const { showNotification, confirm } = useNotifications();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<ForexTransaction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<TransactionFilter>('ALL');
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({});
  const [isLoadingRates, setIsLoadingRates] = useState(false);

  // Fetch live exchange rates
  useEffect(() => {
    const fetchRates = async () => {
      setIsLoadingRates(true);
      try {
        const res = await fetch(
          `/api/forex/batch?pairs=USDINR,EURINR,GBPINR,JPYINR&t=${Date.now()}`
        );
        const data = await res.json();
        if (data && !data.error) {
          setExchangeRates(data);
        }
      } catch {
        // Silent fail — rates are supplementary
      } finally {
        setIsLoadingRates(false);
      }
    };
    fetchRates();
  }, []);

  const refreshRates = async () => {
    setIsLoadingRates(true);
    try {
      const res = await fetch(`/api/forex/batch?pairs=USDINR,EURINR,GBPINR,JPYINR&t=${Date.now()}`);
      const data = await res.json();
      if (data && !data.error) {
        setExchangeRates(data);
        showNotification('success', 'Exchange rates refreshed');
      }
    } catch {
      showNotification('error', 'Failed to refresh rates');
    } finally {
      setIsLoadingRates(false);
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const deposits = forexTransactions
      .filter((t) => t.transactionType === 'DEPOSIT')
      .reduce((sum, t) => sum + t.amount, 0);

    const withdrawals = forexTransactions
      .filter((t) => t.transactionType === 'WITHDRAWAL')
      .reduce((sum, t) => sum + t.amount, 0);

    const profits = forexTransactions
      .filter((t) => t.transactionType === 'PROFIT')
      .reduce((sum, t) => sum + t.amount, 0);

    const losses = forexTransactions
      .filter((t) => t.transactionType === 'LOSS')
      .reduce((sum, t) => sum + t.amount, 0);

    const netPnL = profits - losses;
    const currentBalance = deposits + profits - losses - withdrawals;
    const totalTrades = forexTransactions.filter(
      (t) => t.transactionType === 'PROFIT' || t.transactionType === 'LOSS'
    ).length;
    const winRate =
      totalTrades > 0
        ? (forexTransactions.filter((t) => t.transactionType === 'PROFIT').length / totalTrades) *
          100
        : 0;

    return { deposits, withdrawals, profits, losses, netPnL, currentBalance, totalTrades, winRate };
  }, [forexTransactions]);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    return forexTransactions
      .filter((t) => {
        if (filterType !== 'ALL' && t.transactionType !== filterType) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return (
            t.transactionType.toLowerCase().includes(q) ||
            t.notes?.toLowerCase().includes(q) ||
            t.amount.toString().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [forexTransactions, filterType, searchQuery]);

  // P&L breakdown for mini chart
  const pnlBreakdown = useMemo(() => {
    const total = stats.profits + stats.losses;
    return {
      profitPct: total > 0 ? (stats.profits / total) * 100 : 0,
      lossPct: total > 0 ? (stats.losses / total) * 100 : 0,
    };
  }, [stats]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="bg-mesh" />
        <div className="dashboard-header">
          <div className="skeleton" style={{ height: '40px', width: 'min(100%, 250px)' }} />
        </div>
        <div className="grid-responsive-3 mb-xl">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!settings.forexEnabled) {
    return (
      <div
        className="page-container"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}
      >
        <div className="bg-mesh" />
        <div
          className="premium-card p-2xl text-center"
          style={{ maxWidth: '500px', padding: '48px' }}
        >
          <DollarSign
            size={48}
            className="mb-md"
            style={{ color: '#64748b', opacity: 0.5, margin: '0 auto 24px auto' }}
          />
          <h2 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '12px' }}>
            Forex Section Disabled
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            You have disabled the forex trading section in your settings. Enable it to track your
            forex deposits, trades, and withdrawals.
          </p>
        </div>
      </div>
    );
  }

  const typeColors: Record<string, string> = {
    DEPOSIT: '#3b82f6',
    WITHDRAWAL: '#f59e0b',
    PROFIT: '#10b981',
    LOSS: '#ef4444',
  };

  const typeIcons: Record<string, React.ReactNode> = {
    DEPOSIT: <ArrowDownRight size={18} />,
    WITHDRAWAL: <ArrowUpRight size={18} />,
    PROFIT: <TrendingUp size={18} />,
    LOSS: <TrendingDown size={18} />,
  };

  return (
    <div className="page-container">
      <div className="bg-mesh" />

      <header className="dashboard-header">
        <div className="fade-in">
          <h1
            className="dashboard-title"
            style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
          >
            <DollarSign className="text-glow" style={{ color: 'var(--accent)' }} size={32} />
            <span>
              Forex <span className="title-accent">Trading</span>
            </span>
          </h1>
        </div>

        <div className="flex gap-sm" style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={refreshRates}
            className="glass-button"
            style={{
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: '14px',
            }}
            title="Refresh Exchange Rates"
          >
            <RefreshCw size={18} className={isLoadingRates ? 'spin-animation' : ''} />
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="glass-button glow-primary"
            style={{
              padding: '12px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--accent)',
              borderColor: 'transparent',
            }}
          >
            <Plus size={18} /> Add Transaction
          </button>
        </div>
      </header>

      {/* Live Exchange Rates Ticker */}
      {Object.keys(exchangeRates).length > 0 && (
        <div
          className="fade-in"
          style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '24px',
            overflowX: 'auto',
            paddingBottom: '4px',
          }}
        >
          {Object.entries(exchangeRates).map(([pair, data]) => (
            <div
              key={pair}
              style={{
                padding: '12px 20px',
                borderRadius: '16px',
                background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.4))',
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexShrink: 0,
                minWidth: '150px',
              }}
            >
              <Globe size={16} style={{ color: '#6366f1', flexShrink: 0 }} />
              <div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    color: '#64748b',
                    textTransform: 'uppercase',
                  }}
                >
                  {pair.slice(0, 3)}/{pair.slice(3)}
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#fff' }}>
                  ₹{data.rate.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Overview */}
      <div
        className="fade-in"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {/* Current Balance */}
        <div
          className="premium-card"
          style={{
            padding: '20px',
            background: 'linear-gradient(145deg, rgba(99, 102, 241, 0.08), rgba(15, 23, 42, 0.6))',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: '800',
                color: '#64748b',
                textTransform: 'uppercase',
              }}
            >
              Balance
            </span>
            <Wallet size={16} style={{ color: '#6366f1' }} />
          </div>
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: '900',
              color: stats.currentBalance >= 0 ? '#fff' : '#ef4444',
            }}
          >
            ₹{Math.abs(stats.currentBalance).toLocaleString()}
          </div>
        </div>

        {/* Total Deposits */}
        <div
          className="premium-card"
          style={{
            padding: '20px',
            background: 'linear-gradient(145deg, rgba(59, 130, 246, 0.06), rgba(15, 23, 42, 0.6))',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: '800',
                color: '#64748b',
                textTransform: 'uppercase',
              }}
            >
              Deposited
            </span>
            <ArrowDownRight size={16} style={{ color: '#3b82f6' }} />
          </div>
          <div className="stat-value" style={{ fontSize: '1.5rem', fontWeight: '900' }}>
            ₹{stats.deposits.toLocaleString()}
          </div>
        </div>

        {/* Net P&L with mini chart */}
        <div
          className="premium-card"
          style={{
            padding: '20px',
            background:
              stats.netPnL >= 0
                ? 'linear-gradient(145deg, rgba(16, 185, 129, 0.06), rgba(15, 23, 42, 0.6))'
                : 'linear-gradient(145deg, rgba(239, 68, 68, 0.06), rgba(15, 23, 42, 0.6))',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: '800',
                color: '#64748b',
                textTransform: 'uppercase',
              }}
            >
              Net P&L
            </span>
            {stats.netPnL >= 0 ? (
              <TrendingUp size={16} style={{ color: '#10b981' }} />
            ) : (
              <TrendingDown size={16} style={{ color: '#ef4444' }} />
            )}
          </div>
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: '900',
              color: stats.netPnL >= 0 ? '#10b981' : '#ef4444',
            }}
          >
            {stats.netPnL >= 0 ? '+' : ''}₹{stats.netPnL.toLocaleString()}
          </div>
          {/* Mini P&L bar */}
          <div
            style={{
              display: 'flex',
              height: '4px',
              borderRadius: '100px',
              overflow: 'hidden',
              marginTop: '10px',
              background: 'rgba(255,255,255,0.04)',
            }}
          >
            <div
              style={{
                width: `${pnlBreakdown.profitPct}%`,
                background: '#10b981',
                borderRadius: '100px 0 0 100px',
              }}
            />
            <div
              style={{
                width: `${pnlBreakdown.lossPct}%`,
                background: '#ef4444',
                borderRadius: '0 100px 100px 0',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
            <span style={{ fontSize: '0.6rem', color: '#10b981', fontWeight: '700' }}>
              Profit: ₹{stats.profits.toLocaleString()}
            </span>
            <span style={{ fontSize: '0.6rem', color: '#ef4444', fontWeight: '700' }}>
              Loss: ₹{stats.losses.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Trade Stats */}
        <div
          className="premium-card"
          style={{
            padding: '20px',
            background: 'linear-gradient(145deg, rgba(245, 158, 11, 0.06), rgba(15, 23, 42, 0.6))',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: '800',
                color: '#64748b',
                textTransform: 'uppercase',
              }}
            >
              Win Rate
            </span>
            <BarChart3 size={16} style={{ color: '#f59e0b' }} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#f59e0b' }}>
            {stats.winRate.toFixed(0)}%
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
            {stats.totalTrades} total trades • ₹{stats.withdrawals.toLocaleString()} withdrawn
          </div>
        </div>
      </div>

      {/* Toolbar: Search + Filter */}
      <div
        className="fade-in"
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 250px', minWidth: 0 }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#475569',
            }}
          />
          <input
            type="text"
            placeholder="Search transactions…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 40px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '14px',
              color: '#fff',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {(['ALL', 'DEPOSIT', 'WITHDRAWAL', 'PROFIT', 'LOSS'] as TransactionFilter[]).map(
            (type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: `1px solid ${filterType === type ? (typeColors[type] || '#6366f1') + '40' : 'rgba(255,255,255,0.06)'}`,
                  background:
                    filterType === type
                      ? (typeColors[type] || '#6366f1') + '15'
                      : 'rgba(15, 23, 42, 0.4)',
                  color: filterType === type ? typeColors[type] || '#6366f1' : '#64748b',
                  fontSize: '0.7rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  transition: 'all 0.2s',
                }}
              >
                {type === 'ALL' ? '⊕ All' : type}
              </button>
            )
          )}
        </div>
      </div>

      {/* Transactions List */}
      <div className="premium-card p-lg fade-in" style={{ padding: '20px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}
        >
          <h2
            style={{
              fontSize: '1.1rem',
              fontWeight: '900',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <PieChart size={18} style={{ color: '#6366f1' }} />
            Transaction History
          </h2>
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700' }}>
            {filteredTransactions.length} entries
          </span>
        </div>

        {filteredTransactions.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredTransactions.map((transaction) => {
              const account = accounts.find((a) => a.id === transaction.accountId);
              const isPositive =
                transaction.transactionType === 'DEPOSIT' ||
                transaction.transactionType === 'PROFIT';
              const color = typeColors[transaction.transactionType] || '#6366f1';

              return (
                <div
                  key={transaction.id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '14px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px',
                    flexWrap: 'wrap',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    e.currentTarget.style.borderColor = color + '25';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)';
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      flex: '1 1 200px',
                    }}
                  >
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '12px',
                        background: color + '12',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: color,
                        flexShrink: 0,
                      }}
                    >
                      {typeIcons[transaction.transactionType]}
                    </div>
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '0.9rem', color: '#e2e8f0' }}>
                        {transaction.transactionType}
                      </div>
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: '#475569',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginTop: '2px',
                          fontWeight: '600',
                        }}
                      >
                        <Calendar size={11} />
                        {new Date(transaction.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                        {account && <span>• {account.name}</span>}
                      </div>
                      {transaction.notes && (
                        <div
                          style={{
                            fontSize: '0.7rem',
                            color: '#475569',
                            marginTop: '4px',
                            fontStyle: 'italic',
                          }}
                        >
                          {transaction.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: '900',
                        color: color,
                      }}
                    >
                      {isPositive ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => setEditingTransaction(transaction)}
                        style={{
                          color: '#818cf8',
                          padding: '7px',
                          borderRadius: '8px',
                          border: '1px solid rgba(129, 140, 248, 0.15)',
                          background: 'rgba(129, 140, 248, 0.06)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title="Edit"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={async () => {
                          const isConfirmed = await confirm({
                            title: 'Delete Transaction?',
                            message: 'Are you sure you want to delete this forex transaction?',
                            type: 'error',
                          });
                          if (isConfirmed) {
                            await deleteForexTransaction(transaction.id);
                            showNotification('success', 'Transaction deleted');
                          }
                        }}
                        style={{
                          color: '#f87171',
                          padding: '7px',
                          borderRadius: '8px',
                          border: '1px solid rgba(248, 113, 113, 0.15)',
                          background: 'rgba(239, 68, 68, 0.06)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--text-tertiary)' }}>
            <DollarSign size={64} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
            <h3
              style={{
                fontSize: '1.25rem',
                fontWeight: '800',
                marginBottom: '8px',
                color: '#e2e8f0',
              }}
            >
              {searchQuery || filterType !== 'ALL'
                ? 'No Matching Transactions'
                : 'No Transactions Yet'}
            </h3>
            <p style={{ marginBottom: '24px', color: '#475569' }}>
              {searchQuery || filterType !== 'ALL'
                ? 'Try adjusting your search or filter.'
                : 'Start tracking your forex trading by adding your first transaction.'}
            </p>
            {!searchQuery && filterType === 'ALL' && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="glass-button glow-primary"
                style={{
                  padding: '14px 28px',
                  background: 'var(--accent)',
                  borderColor: 'transparent',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderRadius: '14px',
                  fontWeight: '800',
                }}
              >
                <Plus size={18} /> Add Transaction
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(isAddModalOpen || editingTransaction) && (
        <ForexTransactionModal
          transaction={editingTransaction}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingTransaction(null);
          }}
          onSave={async (data) => {
            try {
              if (editingTransaction) {
                await updateForexTransaction(editingTransaction.id, data);
                showNotification('success', 'Transaction updated successfully');
              } else {
                await addForexTransaction(data);
                showNotification('success', 'Transaction added successfully');
              }
              setIsAddModalOpen(false);
              setEditingTransaction(null);
            } catch (error) {
              showNotification(
                'error',
                error instanceof Error ? error.message : 'Failed to save transaction'
              );
            }
          }}
          accounts={accounts}
        />
      )}
    </div>
  );
}

interface ForexTransactionModalProps {
  transaction: ForexTransaction | null;
  onClose: () => void;
  onSave: (data: Omit<ForexTransaction, 'id'>) => Promise<void>;
  accounts: Array<{ id: number; name: string; balance: number }>;
}

function ForexTransactionModal({
  transaction,
  onClose,
  onSave,
  accounts,
}: ForexTransactionModalProps) {
  const [transactionType, setTransactionType] = useState<ForexTransaction['transactionType']>(
    transaction?.transactionType || 'DEPOSIT'
  );
  const [amount, setAmount] = useState(transaction?.amount.toString() || '');
  const [date, setDate] = useState(transaction?.date || new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(transaction?.notes || '');
  const [accountId, setAccountId] = useState<number | undefined>(transaction?.accountId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        transactionType,
        amount: parseFloat(amount),
        date,
        notes: notes || undefined,
        accountId: accountId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeColors: Record<string, string> = {
    DEPOSIT: '#3b82f6',
    WITHDRAWAL: '#f59e0b',
    PROFIT: '#10b981',
    LOSS: '#ef4444',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(12px, 3vw, 20px)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(12px)',
        }}
        onClick={onClose}
      />

      <div
        className="premium-card fade-in"
        style={{
          width: '100%',
          maxWidth: '500px',
          position: 'relative',
          zIndex: 1,
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '28px',
          padding: 'clamp(24px, 5vw, 32px)',
          maxHeight: '95vh',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '28px',
          }}
        >
          <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 1.75rem)', fontWeight: '900', margin: 0 }}>
            {transaction ? 'Edit Transaction' : 'New Transaction'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              color: '#94a3b8',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Plus size={18} style={{ transform: 'rotate(45deg)' }} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
        >
          {/* Transaction Type Selector */}
          <div>
            <label
              style={{
                fontSize: '0.75rem',
                fontWeight: '800',
                color: '#94a3b8',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '10px',
                letterSpacing: '0.5px',
              }}
            >
              Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {(['DEPOSIT', 'PROFIT', 'LOSS', 'WITHDRAWAL'] as const).map((type) => {
                const color = typeColors[type];
                const isSelected = transactionType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setTransactionType(type)}
                    style={{
                      padding: '10px 6px',
                      borderRadius: '12px',
                      border: `1px solid ${isSelected ? color : '#1e293b'}`,
                      background: isSelected ? color + '15' : '#020617',
                      color: isSelected ? color : '#64748b',
                      fontWeight: '700',
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                    }}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              style={{
                fontSize: '0.75rem',
                fontWeight: '800',
                color: '#94a3b8',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              style={{
                width: '100%',
                background: '#020617',
                border: '1px solid #1e293b',
                padding: '14px',
                borderRadius: '14px',
                color: '#fff',
                outline: 'none',
                fontSize: '1rem',
                fontWeight: '700',
              }}
              required
            />
          </div>

          <div>
            <label
              style={{
                fontSize: '0.75rem',
                fontWeight: '800',
                color: '#94a3b8',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                width: '100%',
                background: '#020617',
                border: '1px solid #1e293b',
                padding: '14px',
                borderRadius: '14px',
                color: '#fff',
                outline: 'none',
              }}
              required
            />
          </div>

          <div>
            <label
              style={{
                fontSize: '0.75rem',
                fontWeight: '800',
                color: '#94a3b8',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Link to Account
            </label>
            <select
              value={accountId || ''}
              onChange={(e) => setAccountId(e.target.value ? Number(e.target.value) : undefined)}
              style={{
                width: '100%',
                background: '#020617',
                border: '1px solid #1e293b',
                padding: '14px',
                borderRadius: '14px',
                color: '#fff',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="">No Account (Manual)</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} (₹{acc.balance.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              style={{
                fontSize: '0.75rem',
                fontWeight: '800',
                color: '#94a3b8',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. USD/INR trade, EURUSD scalp"
              style={{
                width: '100%',
                background: '#020617',
                border: '1px solid #1e293b',
                padding: '14px',
                borderRadius: '14px',
                color: '#fff',
                outline: 'none',
                resize: 'vertical',
                fontSize: '0.9rem',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#fff',
              padding: '16px',
              borderRadius: '16px',
              border: 'none',
              fontWeight: '800',
              fontSize: '1rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.6 : 1,
              minHeight: '50px',
              marginTop: '4px',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.25)',
            }}
          >
            {isSubmitting ? 'Saving...' : transaction ? 'Update Transaction' : 'Add Transaction'}
          </button>
        </form>
      </div>
    </div>
  );
}
