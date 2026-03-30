'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Plus, Trash2, Edit3, X, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { supabase } from '@/lib/config/supabase';
import { useAuth } from '@/app/components/AuthContext';
import { useNotifications } from '@/app/components/NotificationContext';
import { useSettings } from '@/app/components/FinanceContext';
import { MoneyValue } from '@/app/components/ui/MoneyValue';
import { PageSkeleton, PageState } from '@/app/components/ui/PageState';
import { formatDate, formatDateTime } from '@/lib/utils/format';

export interface ForexTrade {
  id: number;
  transaction_type: 'BUY' | 'SELL';
  notes: string | null;
  amount: number;
  account_id: number | null;
  transaction_date: string | null;
  created_at?: string | null;
}

export default function ForexClient() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { showNotification, showActionNotification } = useNotifications();

  const [trades, setTrades] = useState<ForexTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'BUY' | 'SELL'>('BUY');
  const [notes, setNotes] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterType, setFilterType] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');

  const compactNumbers = settings.compactNumbers ?? false;

  const fetchTrades = useCallback(async () => {
    if (!user) {
      setTrades([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('forex_transactions')
        .select('*')
        .order('transaction_date', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setTrades((data ?? []) as ForexTrade[]);
    } catch (fetchUnknownError) {
      const message =
        fetchUnknownError instanceof Error
          ? fetchUnknownError.message
          : 'Failed to fetch forex trades.';
      setError(message);
      showNotification('error', message);
    } finally {
      setLoading(false);
    }
  }, [showNotification, user]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const visibleTrades = useMemo(
    () =>
      trades
        .filter((trade) => !pendingDeleteIds.includes(trade.id))
        .filter((trade) => filterType === 'ALL' || trade.transaction_type === filterType),
    [filterType, pendingDeleteIds, trades]
  );

  const stats = useMemo(() => {
    const totalVolume = visibleTrades.reduce((sum, trade) => sum + (trade.amount || 0), 0);
    const buyVolume = visibleTrades
      .filter((trade) => trade.transaction_type === 'BUY')
      .reduce((sum, trade) => sum + trade.amount, 0);
    const sellVolume = visibleTrades
      .filter((trade) => trade.transaction_type === 'SELL')
      .reduce((sum, trade) => sum + trade.amount, 0);

    return {
      totalVolume,
      buyCount: visibleTrades.filter((trade) => trade.transaction_type === 'BUY').length,
      sellCount: visibleTrades.filter((trade) => trade.transaction_type === 'SELL').length,
      buyVolume,
      sellVolume,
    };
  }, [visibleTrades]);

  const lastUpdatedAt = useMemo(() => {
    const values = trades
      .map((trade) => trade.created_at || trade.transaction_date)
      .filter(Boolean) as string[];
    return values[0];
  }, [trades]);

  const resetForm = () => {
    setEditId(null);
    setAmount('');
    setTransactionType('BUY');
    setNotes('');
    setTransactionDate(new Date().toISOString().split('T')[0]);
  };

  const openNewTradeModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (trade: ForexTrade) => {
    setEditId(trade.id);
    setAmount(trade.amount.toString());
    setTransactionType(trade.transaction_type || 'BUY');
    setNotes(trade.notes || '');
    setTransactionDate(trade.transaction_date || new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const deleteTrade = async (id: number) => {
    const { error: deleteError } = await supabase.from('forex_transactions').delete().eq('id', id);
    if (deleteError) {
      throw deleteError;
    }
    setTrades((current) => current.filter((trade) => trade.id !== id));
  };

  const requestDelete = (trade: ForexTrade) => {
    setPendingDeleteIds((current) => [...current, trade.id]);
    showActionNotification({
      type: 'warning',
      message: `Forex ${trade.transaction_type.toLowerCase()} removed from view. Undo within 8 seconds to restore it.`,
      actionLabel: 'Undo',
      duration: 8000,
      onAction: () => {
        setPendingDeleteIds((current) => current.filter((id) => id !== trade.id));
        showNotification('info', 'Forex trade restored');
      },
      onDismiss: async () => {
        await deleteTrade(trade.id);
        setPendingDeleteIds((current) => current.filter((id) => id !== trade.id));
        showNotification('success', 'Forex trade deleted');
      },
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!user || !amount) {
      showNotification('error', 'Amount is required to save the forex trade.');
      return;
    }

    const tradeData = {
      user_id: user.id,
      amount: Number(amount),
      transaction_type: transactionType,
      notes: notes || null,
      transaction_date: transactionDate || null,
    };

    try {
      if (editId) {
        const { error: updateError } = await supabase
          .from('forex_transactions')
          .update(tradeData)
          .eq('id', editId);
        if (updateError) throw updateError;
        showNotification('success', 'Forex trade updated');
      } else {
        const { error: insertError } = await supabase
          .from('forex_transactions')
          .insert([tradeData]);
        if (insertError) throw insertError;
        showNotification('success', 'Forex trade logged');
      }

      resetForm();
      setIsModalOpen(false);
      await fetchTrades();
    } catch (submitUnknownError) {
      const message =
        submitUnknownError instanceof Error
          ? submitUnknownError.message
          : 'Unable to save the forex trade.';
      showNotification('error', message);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <PageSkeleton cardCount={4} rowCount={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <PageState
          variant="error"
          title="Forex trades are unavailable right now"
          description={error}
          actionLabel="Retry"
          onAction={fetchTrades}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div
        className="page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '16px',
          alignItems: 'flex-start',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>
            Forex
          </h1>
          <p className="page-subtitle" style={{ marginTop: '8px' }}>
            Log currency buy and sell activity with clear volume totals and safer actions.
          </p>
          {lastUpdatedAt ? (
            <p style={{ margin: '10px 0 0', color: 'var(--muted)', fontSize: '0.82rem' }}>
              As of {formatDateTime(lastUpdatedAt)}
            </p>
          ) : null}
        </div>
        <button type="button" className="add-transaction-btn" onClick={openNewTradeModal}>
          <Plus size={18} />
          Record Trade
        </button>
      </div>

      <div className="grid-responsive-4" style={{ gap: '16px', marginBottom: '24px' }}>
        <ForexStatCard
          label="Total volume"
          value={<MoneyValue amount={stats.totalVolume} compact={compactNumbers} />}
        />
        <ForexStatCard
          label="Buy volume"
          value={<MoneyValue amount={stats.buyVolume} compact={compactNumbers} />}
          accent="#2bd576"
        />
        <ForexStatCard
          label="Sell volume"
          value={<MoneyValue amount={stats.sellVolume} compact={compactNumbers} />}
          accent="#ff4d6d"
        />
        <ForexStatCard label="Trades" value={visibleTrades.length} accent="#6aa6ff" />
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {[
          { id: 'ALL', label: 'All' },
          { id: 'BUY', label: 'Buy' },
          { id: 'SELL', label: 'Sell' },
        ].map((filter) => (
          <button
            key={filter.id}
            type="button"
            className="tab-btn"
            aria-pressed={filterType === filter.id}
            onClick={() => setFilterType(filter.id as 'ALL' | 'BUY' | 'SELL')}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {visibleTrades.length === 0 ? (
        <PageState
          title="No forex trades yet"
          description="Record your first buy or sell to build a clean forex activity history."
          actionLabel="Record your first trade"
          onAction={openNewTradeModal}
        />
      ) : (
        <div style={{ display: 'grid', gap: '14px' }}>
          {visibleTrades.map((trade) => {
            const isBuy = trade.transaction_type === 'BUY';
            return (
              <article
                key={trade.id}
                className="premium-card"
                style={{
                  padding: '18px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
              >
                <div style={{ flex: '1 1 260px' }}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        width: '36px',
                        height: '36px',
                        borderRadius: '12px',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isBuy ? 'rgba(43,213,118,0.12)' : 'rgba(255,77,109,0.12)',
                        color: isBuy ? '#2bd576' : '#ff4d6d',
                      }}
                    >
                      {isBuy ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                    </span>
                    <div>
                      <strong>{isBuy ? 'Buy' : 'Sell'} FX</strong>
                      <p style={{ margin: '4px 0 0', color: 'var(--muted)' }}>
                        {trade.transaction_date
                          ? formatDate(trade.transaction_date)
                          : 'No trade date'}
                      </p>
                    </div>
                  </div>
                  {trade.notes ? (
                    <p style={{ margin: '10px 0 0', color: 'var(--muted)', lineHeight: 1.6 }}>
                      {trade.notes}
                    </p>
                  ) : null}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    flexWrap: 'wrap',
                    justifyContent: 'flex-end',
                  }}
                >
                  <div style={{ textAlign: 'right', minWidth: '120px' }}>
                    <div style={{ color: isBuy ? '#2bd576' : '#ff4d6d', fontWeight: 800 }}>
                      <MoneyValue amount={trade.amount} compact={compactNumbers} />
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: '4px' }}>
                      {trade.transaction_type}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="action-btn action-btn--edit"
                      data-label="Edit"
                      aria-label={`Edit forex ${trade.transaction_type.toLowerCase()} trade`}
                      title="Edit forex trade"
                      onClick={() => handleEdit(trade)}
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      type="button"
                      className="action-btn action-btn--delete"
                      data-label="Delete"
                      aria-label={`Delete forex ${trade.transaction_type.toLowerCase()} trade`}
                      title="Delete forex trade"
                      onClick={() => requestDelete(trade)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {isModalOpen ? (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h2 style={{ margin: 0 }}>{editId ? 'Edit forex trade' : 'New forex trade'}</h2>
              <button type="button" className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {(['BUY', 'SELL'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setTransactionType(type)}
                    style={{
                      minHeight: '38px',
                      padding: '8px 12px',
                      borderRadius: '999px',
                      border: '1px solid rgba(255,255,255,0.08)',
                      background:
                        transactionType === type
                          ? type === 'BUY'
                            ? 'rgba(43,213,118,0.16)'
                            : 'rgba(255,77,109,0.16)'
                          : 'rgba(255,255,255,0.03)',
                      color: transactionType === type ? '#fff' : 'var(--muted)',
                      cursor: 'pointer',
                      fontWeight: 700,
                    }}
                  >
                    {type === 'BUY' ? 'Buy' : 'Sell'}
                  </button>
                ))}
              </div>
              <input
                className="form-input table-nums"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Amount"
                required
              />
              <input
                className="form-input"
                type="date"
                value={transactionDate}
                onChange={(event) => setTransactionDate(event.target.value)}
              />
              <textarea
                className="form-input"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Notes"
                rows={4}
                style={{ resize: 'vertical' }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="page-state__button"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="add-transaction-btn">
                  {editId ? 'Save changes' : 'Save trade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ForexStatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: ReactNode;
  accent?: string;
}) {
  return (
    <div className="premium-card" style={{ padding: '22px' }}>
      <div
        style={{
          color: 'var(--muted)',
          fontSize: '0.76rem',
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '10px',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: '1.45rem', fontWeight: 900, color: accent ?? 'var(--text)' }}>
        {value}
      </div>
    </div>
  );
}
