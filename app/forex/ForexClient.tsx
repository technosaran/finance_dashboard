'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/config/supabase';
import { useAuth } from '@/app/components/AuthContext';
import { useNotifications } from '@/app/components/NotificationContext';
import { Plus, Trash2, Edit3 } from 'lucide-react';
import { EmptyPortfolioVisual } from '@/app/components/Visuals';

// Simplified type based on database schema for local use
export interface ForexTrade {
  id: number;
  transaction_type: string;
  notes: string | null;
  amount: number;
  account_id: number | null;
  transaction_date: string | null;
}

export default function ForexClient() {
  const { user } = useAuth();
  const { showNotification, confirm: customConfirm } = useNotifications();
  const [trades, setTrades] = useState<ForexTrade[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState('BUY');
  const [notes, setNotes] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchTrades = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('forex_transactions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTrades(data as ForexTrade[]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch forex trades';
      showNotification('error', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, showNotification]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const stats = useMemo(() => {
    const totalTraded = trades.reduce((sum, t) => sum + (t.amount || 0), 0);
    const buyCount = trades.filter((t) => t.transaction_type === 'BUY').length;
    const sellCount = trades.filter((t) => t.transaction_type === 'SELL').length;

    return { totalTraded, buyCount, sellCount, totalTrades: trades.length };
  }, [trades]);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount) return;

    const tradeData = {
      user_id: user.id,
      amount: parseFloat(amount),
      transaction_type: transactionType,
      notes: notes || null,
      transaction_date: transactionDate || null,
    };

    try {
      if (editId) {
        const { error } = await supabase
          .from('forex_transactions')
          .update(tradeData)
          .eq('id', editId);
        if (error) throw error;
        showNotification('success', 'Trade updated successfully');
      } else {
        const { error } = await supabase.from('forex_transactions').insert([tradeData]);
        if (error) throw error;
        showNotification('success', 'Trade logged successfully');
      }
      resetForm();
      fetchTrades();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error saving trade';
      showNotification('error', errorMessage);
    }
  };

  const handleEdit = (t: ForexTrade) => {
    setEditId(t.id);
    setAmount(t.amount?.toString() || '');
    setTransactionType(t.transaction_type || 'BUY');
    setNotes(t.notes || '');
    setTransactionDate(t.transaction_date || '');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (await customConfirm({ title: 'Delete Trade', message: 'Are you sure?', type: 'warning' })) {
      try {
        const { error } = await supabase.from('forex_transactions').delete().eq('id', id);
        if (error) throw error;
        showNotification('success', 'Trade removed');
        fetchTrades();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error';
        showNotification('error', errorMessage);
      }
    }
  };

  const resetForm = () => {
    setEditId(null);
    setAmount('');
    setTransactionType('BUY');
    setNotes('');
    setTransactionDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(false);
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
        <div style={{ color: '#f43f5e', fontWeight: 'bold' }}>Loading forex market data...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div
        className="flex-col-mobile"
        style={{
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px',
          gap: '20px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: '900',
              margin: 0,
              background: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Forex Terminal
          </h1>
          <p style={{ color: '#64748b', marginTop: '8px' }}>
            Log and manage your global currency exchange transactions.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '16px',
            fontWeight: '900',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 8px 16px rgba(225, 29, 72, 0.2)',
            transition: 'all 0.3s',
          }}
        >
          <Plus size={20} /> Record Trade
        </button>
      </div>

      {/* Stats */}
      <div className="grid-responsive-4" style={{ gap: '16px', marginBottom: '32px' }}>
        <div
          className="premium-card"
          style={{
            background: '#050505',
            padding: '20px',
            borderRadius: '24px',
            border: '1px solid #2a2a2a',
          }}
        >
          <div
            style={{
              color: '#64748b',
              fontSize: '0.65rem',
              fontWeight: '900',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '10px',
            }}
          >
            Total Volume
          </div>
          <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: '950', color: '#fff' }}>
            ₹{stats.totalTraded.toLocaleString()}
          </div>
        </div>
        <div
          className="premium-card"
          style={{
            background: '#050505',
            padding: '20px',
            borderRadius: '24px',
            border: '1px solid #2a2a2a',
          }}
        >
          <div
            style={{
              color: '#64748b',
              fontSize: '0.65rem',
              fontWeight: '900',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '10px',
            }}
          >
            Buy Trades
          </div>
          <div
            style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: '950', color: '#10b981' }}
          >
            {stats.buyCount}
          </div>
        </div>
        <div
          className="premium-card"
          style={{
            background: '#050505',
            padding: '20px',
            borderRadius: '24px',
            border: '1px solid #2a2a2a',
          }}
        >
          <div
            style={{
              color: '#64748b',
              fontSize: '0.65rem',
              fontWeight: '900',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '10px',
            }}
          >
            Sell Trades
          </div>
          <div
            style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: '950', color: '#f43f5e' }}
          >
            {stats.sellCount}
          </div>
        </div>
        <div
          className="premium-card"
          style={{
            background: '#050505',
            padding: '20px',
            borderRadius: '24px',
            border: '1px solid #2a2a2a',
          }}
        >
          <div
            style={{
              color: '#64748b',
              fontSize: '0.65rem',
              fontWeight: '900',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '10px',
            }}
          >
            Total Trades
          </div>
          <div
            style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: '950', color: '#f43f5e' }}
          >
            {stats.totalTrades}
          </div>
        </div>
      </div>

      {/* Trade List */}
      <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
        {trades.length > 0 ? (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '0.9rem',
            }}
          >
            <thead>
              <tr
                style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid #2a2a2a' }}
              >
                <th
                  style={{
                    padding: '16px',
                    color: '#64748b',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                  }}
                >
                  Type
                </th>
                <th
                  style={{
                    padding: '16px',
                    color: '#64748b',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    textAlign: 'right',
                  }}
                >
                  Amount
                </th>
                <th
                  style={{
                    padding: '16px',
                    color: '#64748b',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                  }}
                >
                  Date
                </th>
                <th
                  style={{
                    padding: '16px',
                    color: '#64748b',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                  }}
                >
                  Notes
                </th>
                <th
                  style={{
                    padding: '16px',
                    color: '#64748b',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    textAlign: 'center',
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => (
                <tr key={trade.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '16px' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '900',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background:
                          trade.transaction_type === 'BUY'
                            ? 'rgba(16, 185, 129, 0.1)'
                            : 'rgba(244, 63, 94, 0.1)',
                        color: trade.transaction_type === 'BUY' ? '#10b981' : '#f43f5e',
                      }}
                    >
                      {trade.transaction_type}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '16px',
                      textAlign: 'right',
                      fontWeight: '800',
                      color: '#fff',
                    }}
                  >
                    ₹{trade.amount?.toLocaleString()}
                  </td>
                  <td style={{ padding: '16px', color: '#cbd5e1' }}>
                    {trade.transaction_date
                      ? new Date(trade.transaction_date).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td style={{ padding: '16px', color: '#64748b' }}>{trade.notes || '-'}</td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleEdit(trade)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        marginRight: '12px',
                      }}
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(trade.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#f43f5e',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
            <EmptyPortfolioVisual />
            <div style={{ fontWeight: '700', marginTop: '20px' }}>No forex transactions found.</div>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            className="premium-card fade-in"
            style={{
              width: '100%',
              maxWidth: '500px',
              background: '#050505',
              padding: '32px',
              borderRadius: '24px',
            }}
          >
            <h2 style={{ color: '#fff', marginBottom: '24px', fontWeight: '900' }}>
              {editId ? 'Edit Trade' : 'Record Forex Trade'}
            </h2>
            <form
              onSubmit={handleAction}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      color: '#64748b',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      marginBottom: '8px',
                    }}
                  >
                    Action *
                  </label>
                  <select
                    required
                    value={transactionType}
                    onChange={(e) => setTransactionType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid #2a2a2a',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  >
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      color: '#64748b',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      marginBottom: '8px',
                    }}
                  >
                    Amount *
                  </label>
                  <input
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    type="number"
                    step="any"
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid #2a2a2a',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      color: '#64748b',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      marginBottom: '8px',
                    }}
                  >
                    Date
                  </label>
                  <input
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    type="date"
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid #2a2a2a',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      color: '#64748b',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      marginBottom: '8px',
                    }}
                  >
                    Notes
                  </label>
                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    type="text"
                    placeholder="Currency pair, fees..."
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid #2a2a2a',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: 'transparent',
                    border: '1px solid #2a2a2a',
                    color: '#94a3b8',
                    borderRadius: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: '#e11d48',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                  }}
                >
                  {editId ? 'Save Changes' : 'Record Trade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
