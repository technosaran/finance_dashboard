'use client';

import { useState, useMemo } from 'react';
import { useLedger, usePortfolio } from '../components/FinanceContext';
import { FnoTrade } from '@/lib/types';
import { calculateFnoCharges } from '@/lib/utils/charges';
import { useNotifications } from '../components/NotificationContext';
import { Plus, TrendingUp, X, Edit3, Trash2, Zap, Clock, Trophy, ArrowRight } from 'lucide-react';
import { EmptyPortfolioVisual } from '../components/Visuals';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
} from 'recharts';

export default function FnOClient() {
  const { accounts, loading } = useLedger();
  const { fnoTrades, addFnoTrade, updateFnoTrade, deleteFnoTrade } = usePortfolio();
  const { showNotification, confirm: customConfirm } = useNotifications();

  const [activeTab, setActiveTab] = useState<'positions' | 'history' | 'lifetime'>('positions');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [instrument, setInstrument] = useState('');
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [product, setProduct] = useState<'NRML' | 'MIS'>('NRML');
  const [quantity, setQuantity] = useState('');
  const [avgPrice, setAvgPrice] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [exitDate, setExitDate] = useState('');
  const [status, setStatus] = useState<'OPEN' | 'CLOSED'>('OPEN');
  const [notes, setNotes] = useState('');
  const [accountId, setAccountId] = useState<string>('');

  // Derived Data
  const openPositions = useMemo(() => fnoTrades.filter((t) => t.status === 'OPEN'), [fnoTrades]);
  const tradeHistory = useMemo(() => fnoTrades.filter((t) => t.status === 'CLOSED'), [fnoTrades]);

  const stats = useMemo(() => {
    const closedTrades = fnoTrades.filter((t) => t.status === 'CLOSED');
    const lifetimePnl = closedTrades.reduce((sum, t) => sum + t.pnl, 0);
    const winTrades = closedTrades.filter((t) => t.pnl > 0).length;
    const lossTrades = closedTrades.filter((t) => t.pnl <= 0).length;
    const winRate = closedTrades.length > 0 ? (winTrades / closedTrades.length) * 100 : 0;

    return { lifetimePnl, winTrades, lossTrades, winRate, totalClosed: closedTrades.length };
  }, [fnoTrades]);

  // Graph Data
  const pnlTrend = useMemo(() => {
    const closed = [...tradeHistory].sort(
      (a, b) => new Date(a.exitDate!).getTime() - new Date(b.exitDate!).getTime()
    );
    return closed.reduce((acc: { date: string; pnl: number }[], t) => {
      const previousPnl = acc.length > 0 ? acc[acc.length - 1].pnl : 0;
      acc.push({ date: t.exitDate!, pnl: previousPnl + t.pnl });
      return acc;
    }, []);
  }, [tradeHistory]);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instrument || !quantity || !avgPrice) return;
    if (status === 'CLOSED' && !exitPrice) {
      showNotification('error', 'Exit price is required for a closed trade.');
      return;
    }

    const qty = parseFloat(quantity);
    const entryP = parseFloat(avgPrice);
    const exitP = exitPrice ? parseFloat(exitPrice) : 0;

    // Simple P&L: (Exit - Entry) * Qty for BUY, (Entry - Exit) * Qty for SELL
    let pnl = 0;
    if (status === 'CLOSED') {
      pnl = tradeType === 'BUY' ? (exitP - entryP) * qty : (entryP - exitP) * qty;
      if (exitP > 0) {
        pnl -= calculateFnoCharges(tradeType, qty, entryP, exitP, instrument).total;
      }
    }

    const tradeData = {
      instrument,
      tradeType,
      product,
      quantity: qty,
      avgPrice: entryP,
      exitPrice: status === 'CLOSED' ? exitP : undefined,
      entryDate,
      exitDate:
        status === 'CLOSED' ? exitDate || new Date().toISOString().split('T')[0] : undefined,
      status,
      pnl,
      notes,
      accountId: accountId ? parseInt(accountId) : undefined,
    };

    try {
      if (editId) {
        await updateFnoTrade(editId, tradeData);
        showNotification('success', 'Trade record updated');
      } else {
        await addFnoTrade(tradeData);
        showNotification('success', 'Trade logged successfully');
      }
      resetForm();
      setIsModalOpen(false);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to record trade. Please check your data.';
      showNotification('error', errorMessage);
    }
  };

  const resetForm = () => {
    setInstrument('');
    setTradeType('BUY');
    setProduct('NRML');
    setQuantity('');
    setAvgPrice('');
    setExitPrice('');
    setEntryDate(new Date().toISOString().split('T')[0]);
    setExitDate('');
    setStatus('OPEN');
    setNotes('');
    setAccountId('');
    setEditId(null);
  };

  const handleEdit = (trade: FnoTrade) => {
    setEditId(trade.id);
    setInstrument(trade.instrument);
    setTradeType(trade.tradeType);
    setProduct(trade.product);
    setQuantity(trade.quantity.toString());
    setAvgPrice(trade.avgPrice.toString());
    setExitPrice(trade.exitPrice?.toString() || '');
    setEntryDate(trade.entryDate);
    setExitDate(trade.exitDate || '');
    setStatus(trade.status);
    setNotes(trade.notes || '');
    setAccountId(trade.accountId?.toString() || '');
    setIsModalOpen(true);
  };

  const handleExit = (trade: FnoTrade) => {
    setEditId(trade.id);
    setInstrument(trade.instrument);
    setTradeType(trade.tradeType);
    setProduct(trade.product);
    setQuantity(trade.quantity.toString());
    setAvgPrice(trade.avgPrice.toString());
    setExitPrice(trade.exitPrice?.toString() || '');
    setEntryDate(trade.entryDate);
    setExitDate(new Date().toISOString().split('T')[0]);
    setStatus('CLOSED');
    setNotes(trade.notes || '');
    setAccountId(trade.accountId?.toString() || '');
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div
        className="page-container page-surface"
        style={{
          background: '#000000',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', color: '#818cf8', fontWeight: '800' }}>
            Fetching market positions...
          </div>
        </div>
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
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            FnO Terminal
          </h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '16px',
            fontWeight: '900',
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 8px 16px rgba(99, 102, 241, 0.2)',
            transition: 'all 0.3s',
            width: 'auto',
          }}
        >
          <Plus size={20} strokeWidth={3} /> Record Trade
        </button>
      </div>

      {/* Quick Stats Banner */}
      <div
        className="grid-responsive-4"
        style={{
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <div
          className="premium-card"
          style={{
            background: '#050505',
            padding: '20px',
            borderRadius: '24px',
            border: '1px solid #111111',
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
            Realized P&L
          </div>
          <div
            style={{
              fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
              fontWeight: '950',
              color: stats.lifetimePnl >= 0 ? '#10b981' : '#f43f5e',
            }}
          >
            ₹{stats.lifetimePnl.toLocaleString()}
          </div>
        </div>
        <div
          className="premium-card"
          style={{
            background: '#050505',
            padding: '20px',
            borderRadius: '24px',
            border: '1px solid #111111',
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
            Win Rate
          </div>
          <div
            style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: '950', color: '#818cf8' }}
          >
            {stats.winRate.toFixed(1)}%
          </div>
        </div>
        <div
          className="premium-card"
          style={{
            background: '#050505',
            padding: '20px',
            borderRadius: '24px',
            border: '1px solid #111111',
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
            Active
          </div>
          <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: '950', color: '#fff' }}>
            {openPositions.length}
          </div>
        </div>
        <div
          className="premium-card"
          style={{
            background: '#050505',
            padding: '20px',
            borderRadius: '24px',
            border: '1px solid #111111',
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
          <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: '950', color: '#fff' }}>
            {fnoTrades.length}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="page-tab-bar"
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '32px',
          borderBottom: '1px solid #111111',
          paddingBottom: '16px',
        }}
      >
        <button
          onClick={() => setActiveTab('positions')}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeTab === 'positions' ? '#fff' : '#475569',
            fontSize: '1rem',
            fontWeight: '900',
            cursor: 'pointer',
            padding: '8px 16px',
            minHeight: '44px',
            borderBottom: activeTab === 'positions' ? '3px solid #6366f1' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: '0.2s',
          }}
        >
          <Zap size={18} /> Positions
        </button>
        <button
          onClick={() => setActiveTab('history')}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeTab === 'history' ? '#fff' : '#475569',
            fontSize: '1rem',
            fontWeight: '900',
            cursor: 'pointer',
            padding: '8px 16px',
            minHeight: '44px',
            borderBottom: activeTab === 'history' ? '3px solid #6366f1' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: '0.2s',
          }}
        >
          <Clock size={18} /> History
        </button>
        <button
          onClick={() => setActiveTab('lifetime')}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeTab === 'lifetime' ? '#fff' : '#475569',
            fontSize: '1rem',
            fontWeight: '900',
            cursor: 'pointer',
            padding: '8px 16px',
            minHeight: '44px',
            borderBottom: activeTab === 'lifetime' ? '3px solid #6366f1' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: '0.2s',
          }}
        >
          <Trophy size={18} /> Lifetime
        </button>
      </div>

      {/* Content Rendering */}
      {activeTab === 'positions' && (
        <div className="fade-in">
          {/* Mobile Card List */}
          <div className="mobile-card-list">
            {openPositions.length > 0 ? (
              openPositions.map((trade) => (
                <div
                  key={trade.id}
                  className="premium-card"
                  style={{
                    padding: '16px',
                    background: 'linear-gradient(145deg, #050505 0%, #111111 100%)',
                    borderLeft: `4px solid ${trade.tradeType === 'BUY' ? '#10b981' : '#f43f5e'}`,
                  }}
                  onClick={() => handleEdit(trade)}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: '950',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(99, 102, 241, 0.1)',
                          color: '#818cf8',
                        }}
                      >
                        {trade.product}
                      </span>
                      <div style={{ fontWeight: '900', color: '#fff' }}>{trade.instrument}</div>
                    </div>
                    <div
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: '900',
                        color: trade.tradeType === 'BUY' ? '#10b981' : '#f43f5e',
                      }}
                    >
                      {trade.tradeType}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: '8px',
                      marginBottom: '16px',
                      padding: '12px',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: '12px',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '0.6rem',
                          color: '#64748b',
                          textTransform: 'uppercase',
                          marginBottom: '2px',
                        }}
                      >
                        Qty
                      </div>
                      <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>{trade.quantity}</div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '0.6rem',
                          color: '#64748b',
                          textTransform: 'uppercase',
                          marginBottom: '2px',
                        }}
                      >
                        Avg
                      </div>
                      <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>
                        ₹{trade.avgPrice.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '0.6rem',
                          color: '#64748b',
                          textTransform: 'uppercase',
                          marginBottom: '2px',
                        }}
                      >
                        LTP
                      </div>
                      <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>
                        ₹{trade.avgPrice.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ fontWeight: '900', color: '#fff', fontSize: '0.9rem' }}>
                      ₹0.00 P&L
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExit(trade);
                        }}
                        style={{
                          color: '#10b981',
                          background: 'none',
                          border: 'none',
                          padding: '12px',
                          minHeight: '44px',
                          minWidth: '44px',
                        }}
                      >
                        <ArrowRight size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(trade);
                        }}
                        style={{
                          color: '#64748b',
                          background: 'none',
                          border: 'none',
                          padding: '12px',
                          minHeight: '44px',
                          minWidth: '44px',
                        }}
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (
                            await customConfirm({
                              title: 'Delete',
                              message: 'Remove position?',
                              type: 'error',
                            })
                          ) {
                            deleteFnoTrade(trade.id);
                          }
                        }}
                        style={{
                          color: '#f43f5e',
                          background: 'none',
                          border: 'none',
                          padding: '12px',
                          minHeight: '44px',
                          minWidth: '44px',
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
                <EmptyPortfolioVisual />
                <div style={{ fontWeight: '700', marginTop: '20px' }}>No active positions</div>
              </div>
            )}
          </div>

          {/* Desktop Table */}
          <div className="premium-card hide-mobile" style={{ padding: '0', overflow: 'hidden' }}>
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
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    borderBottom: '1px solid #111111',
                  }}
                >
                  <th
                    style={{
                      padding: '16px 24px',
                      color: '#64748b',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      fontSize: '0.7rem',
                    }}
                  >
                    Product
                  </th>
                  <th
                    style={{
                      padding: '16px 24px',
                      color: '#64748b',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      fontSize: '0.7rem',
                    }}
                  >
                    Instrument
                  </th>
                  <th
                    style={{
                      padding: '16px 24px',
                      color: '#64748b',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      fontSize: '0.7rem',
                      textAlign: 'right',
                    }}
                  >
                    Qty.
                  </th>
                  <th
                    style={{
                      padding: '16px 24px',
                      color: '#64748b',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      fontSize: '0.7rem',
                      textAlign: 'right',
                    }}
                  >
                    Avg.
                  </th>
                  <th
                    style={{
                      padding: '16px 24px',
                      color: '#64748b',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      fontSize: '0.7rem',
                      textAlign: 'right',
                    }}
                  >
                    LTP
                  </th>
                  <th
                    style={{
                      padding: '16px 24px',
                      color: '#64748b',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      fontSize: '0.7rem',
                      textAlign: 'right',
                    }}
                  >
                    P&L
                  </th>
                  <th
                    style={{
                      padding: '16px 24px',
                      color: '#64748b',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      fontSize: '0.7rem',
                      textAlign: 'center',
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {openPositions.length > 0 ? (
                  openPositions.map((trade) => (
                    <tr
                      key={trade.id}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.02)',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = 'rgba(255,255,255,0.01)')
                      }
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '16px 24px' }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: '950',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            background: 'rgba(99, 102, 241, 0.1)',
                            color: '#818cf8',
                            border: '1px solid rgba(99, 102, 241, 0.2)',
                          }}
                        >
                          {trade.product}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: '900',
                              color: trade.tradeType === 'BUY' ? '#10b981' : '#f43f5e',
                            }}
                          >
                            {trade.tradeType}
                          </span>
                          <div style={{ fontWeight: '800', color: '#fff' }}>{trade.instrument}</div>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: '16px 24px',
                          textAlign: 'right',
                          fontWeight: '700',
                          color: '#94a3b8',
                        }}
                      >
                        {trade.quantity}
                      </td>
                      <td
                        style={{
                          padding: '16px 24px',
                          textAlign: 'right',
                          fontWeight: '700',
                          color: '#94a3b8',
                        }}
                      >
                        ₹{trade.avgPrice.toLocaleString()}
                      </td>
                      <td
                        style={{
                          padding: '16px 24px',
                          textAlign: 'right',
                          fontWeight: '700',
                          color: '#fff',
                        }}
                      >
                        ₹
                        {(trade.status === 'CLOSED'
                          ? trade.exitPrice || trade.avgPrice
                          : trade.avgPrice
                        ).toLocaleString()}
                      </td>
                      <td
                        style={{
                          padding: '16px 24px',
                          textAlign: 'right',
                          fontWeight: '800',
                          color: trade.pnl >= 0 ? '#10b981' : '#f43f5e',
                        }}
                      >
                        ₹{trade.pnl.toLocaleString()}
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleExit(trade)}
                            title="Exit / Close"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#10b981',
                              cursor: 'pointer',
                              padding: '12px',
                              minHeight: '44px',
                              minWidth: '44px',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                          >
                            <ArrowRight size={16} strokeWidth={3} />
                          </button>
                          <button
                            onClick={() => handleEdit(trade)}
                            title="Modify"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#64748b',
                              cursor: 'pointer',
                              padding: '12px',
                              minHeight: '44px',
                              minWidth: '44px',
                              transition: 'color 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={async () => {
                              if (
                                await customConfirm({
                                  title: 'Delete Trade',
                                  message: 'Remove this position?',
                                  type: 'error',
                                })
                              ) {
                                deleteFnoTrade(trade.id);
                              }
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#64748b',
                              cursor: 'pointer',
                              padding: '12px',
                              minHeight: '44px',
                              minWidth: '44px',
                              transition: 'color 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#f43f5e')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      style={{ padding: '80px 24px', textAlign: 'center', color: '#64748b' }}
                    >
                      <EmptyPortfolioVisual />
                      <div
                        style={{
                          fontWeight: '800',
                          fontSize: '1.1rem',
                          color: '#fff',
                          marginTop: '24px',
                        }}
                      >
                        No active positions found in your terminal
                      </div>
                      <p style={{ marginTop: '8px', fontSize: '0.9rem' }}>
                        Execute your first trade to start tracking F&O positions.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot
                style={{ background: 'rgba(255,255,255,0.03)', borderTop: '2px solid #111111' }}
              >
                <tr>
                  <td style={{ padding: '20px 24px', fontWeight: '800', color: '#64748b' }}>
                    TOTAL
                  </td>
                  <td colSpan={4}></td>
                  <td
                    style={{
                      padding: '20px 24px',
                      textAlign: 'right',
                      fontWeight: '900',
                      color: '#fff',
                    }}
                  >
                    ₹0.00
                  </td>
                  <td colSpan={1}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div
          style={{
            background: '#050505',
            borderRadius: '32px',
            border: '1px solid #111111',
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
              <tr>
                <th
                  style={{
                    padding: '20px 24px',
                    fontSize: '0.75rem',
                    fontWeight: '900',
                    color: '#64748b',
                  }}
                >
                  INSTRUMENT
                </th>
                <th
                  style={{
                    padding: '20px 24px',
                    fontSize: '0.75rem',
                    fontWeight: '900',
                    color: '#64748b',
                  }}
                >
                  QTY
                </th>
                <th
                  style={{
                    padding: '20px 24px',
                    fontSize: '0.75rem',
                    fontWeight: '900',
                    color: '#64748b',
                  }}
                >
                  BUY/SELL
                </th>
                <th
                  style={{
                    padding: '20px 24px',
                    fontSize: '0.75rem',
                    fontWeight: '900',
                    color: '#64748b',
                  }}
                >
                  AVG PRICE
                </th>
                <th
                  style={{
                    padding: '20px 24px',
                    fontSize: '0.75rem',
                    fontWeight: '900',
                    color: '#64748b',
                  }}
                >
                  EXIT PRICE
                </th>
                <th
                  style={{
                    padding: '20px 24px',
                    fontSize: '0.75rem',
                    fontWeight: '900',
                    color: '#64748b',
                  }}
                >
                  PNL
                </th>
                <th
                  style={{
                    padding: '20px 24px',
                    fontSize: '0.75rem',
                    fontWeight: '900',
                    color: '#64748b',
                  }}
                >
                  DATE
                </th>
              </tr>
            </thead>
            <tbody>
              {tradeHistory.map((trade) => (
                <tr key={trade.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '20px 24px', fontWeight: '800', color: '#fff' }}>
                    {trade.instrument}
                  </td>
                  <td style={{ padding: '20px 24px', color: '#94a3b8' }}>{trade.quantity}</td>
                  <td style={{ padding: '20px 24px' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: '900',
                        color: trade.tradeType === 'BUY' ? '#10b981' : '#f43f5e',
                      }}
                    >
                      {trade.tradeType}
                    </span>
                  </td>
                  <td style={{ padding: '20px 24px', color: '#94a3b8' }}>
                    ₹{trade.avgPrice.toLocaleString()}
                  </td>
                  <td style={{ padding: '20px 24px', color: '#94a3b8' }}>
                    ₹{trade.exitPrice?.toLocaleString()}
                  </td>
                  <td
                    style={{
                      padding: '20px 24px',
                      fontWeight: '900',
                      color: trade.pnl >= 0 ? '#10b981' : '#f43f5e',
                    }}
                  >
                    ₹{trade.pnl.toLocaleString()}
                  </td>
                  <td style={{ padding: '20px 24px', color: '#475569', fontSize: '0.8rem' }}>
                    {new Date(trade.exitDate!).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'lifetime' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '32px' }}>
          <div
            style={{
              background: '#050505',
              borderRadius: '32px',
              border: '1px solid #111111',
              padding: '32px',
            }}
          >
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: '900',
                color: '#fff',
                marginBottom: '32px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <TrendingUp size={20} color="#6366f1" /> Equity Curve
            </h2>
            <div style={{ height: '350px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={pnlTrend}>
                  <defs>
                    <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.21} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.14)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#a8b9ca', fontSize: 10 }}
                    dy={10}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      background: '#000000',
                      border: '1px solid #1a1a1a',
                      borderRadius: '16px',
                    }}
                    itemStyle={{ color: '#e7edf4' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="pnl"
                    stroke="#6366f1"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorPnl)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div
              style={{
                background: '#050505',
                borderRadius: '32px',
                border: '1px solid #111111',
                padding: '32px',
              }}
            >
              <h3
                style={{
                  fontSize: '0.85rem',
                  fontWeight: '900',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '24px',
                }}
              >
                Win/Loss Ratio
              </h3>
              <div style={{ height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Wins', value: stats.winTrades },
                        { name: 'Losses', value: stats.lossTrades },
                      ]}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={10}
                      dataKey="value"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#f43f5e" />
                    </Pie>
                    <RechartsTooltip itemStyle={{ color: '#e6ecf2' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '32px',
                  marginTop: '16px',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '950', color: '#10b981' }}>
                    {stats.winTrades}
                  </div>
                  <div style={{ fontSize: '0.65rem', fontWeight: '900', color: '#64748b' }}>
                    WINS
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '950', color: '#f43f5e' }}>
                    {stats.lossTrades}
                  </div>
                  <div style={{ fontSize: '0.65rem', fontWeight: '900', color: '#64748b' }}>
                    LOSSES
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div
            className="modal-card entry-sheet entry-sheet--wide"
            style={{
              background: '#050505',
              maxWidth: '760px',
            }}
          >
            <div className="entry-sheet__handle" />
            <button
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              style={{
                position: 'absolute',
                top: '32px',
                right: '32px',
                background: 'rgba(255,255,255,0.05)',
                border: 'none',
                color: '#94a3b8',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={24} />
            </button>

            <h2
              style={{
                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                fontWeight: '950',
                margin: '0 0 32px 0',
                letterSpacing: '-1.5px',
              }}
            >
              {editId ? 'Manage Position' : 'Log New Context'}
            </h2>

            <form onSubmit={handleAction} className="entry-form">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '900',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}
                >
                  Trading Instrument
                </label>
                <input
                  value={instrument}
                  onChange={(e) => setInstrument(e.target.value)}
                  placeholder="e.g. NIFTY 22FEB 21500 CE"
                  required
                  style={{
                    background: '#000000',
                    border: '1px solid #111111',
                    padding: '16px 20px',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '20px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '900',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                    }}
                  >
                    Trade Type
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      padding: '4px',
                      background: '#000000',
                      borderRadius: '12px',
                      border: '1px solid #111111',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setTradeType('BUY')}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '10px',
                        border: 'none',
                        minHeight: '44px',
                        background: tradeType === 'BUY' ? '#10b981' : 'transparent',
                        color: tradeType === 'BUY' ? '#fff' : '#64748b',
                        fontWeight: '900',
                        cursor: 'pointer',
                      }}
                    >
                      BUY
                    </button>
                    <button
                      type="button"
                      onClick={() => setTradeType('SELL')}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '10px',
                        border: 'none',
                        minHeight: '44px',
                        background: tradeType === 'SELL' ? '#f43f5e' : 'transparent',
                        color: tradeType === 'SELL' ? '#fff' : '#64748b',
                        fontWeight: '900',
                        cursor: 'pointer',
                      }}
                    >
                      SELL
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '900',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                    }}
                  >
                    Product
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      padding: '4px',
                      background: '#000000',
                      borderRadius: '12px',
                      border: '1px solid #111111',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setProduct('NRML')}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '10px',
                        border: 'none',
                        minHeight: '44px',
                        background: product === 'NRML' ? '#6366f1' : 'transparent',
                        color: product === 'NRML' ? '#fff' : '#64748b',
                        fontWeight: '900',
                        cursor: 'pointer',
                      }}
                    >
                      NRML
                    </button>
                    <button
                      type="button"
                      onClick={() => setProduct('MIS')}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '10px',
                        border: 'none',
                        minHeight: '44px',
                        background: product === 'MIS' ? '#8b5cf6' : 'transparent',
                        color: product === 'MIS' ? '#fff' : '#64748b',
                        fontWeight: '900',
                        cursor: 'pointer',
                      }}
                    >
                      MIS
                    </button>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '20px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '900',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                    }}
                  >
                    Quantity (Lots)
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    required
                    style={{
                      background: '#000000',
                      border: '1px solid #111111',
                      padding: '16px 20px',
                      borderRadius: '16px',
                      color: '#fff',
                      fontSize: '1rem',
                      outline: 'none',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '900',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                    }}
                  >
                    Avg. Entry Price
                  </label>
                  <input
                    type="number"
                    value={avgPrice}
                    onChange={(e) => setAvgPrice(e.target.value)}
                    placeholder="0.00"
                    required
                    style={{
                      background: '#000000',
                      border: '1px solid #111111',
                      padding: '16px 20px',
                      borderRadius: '16px',
                      color: '#fff',
                      fontSize: '1rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '900',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}
                >
                  Current Status
                </label>
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    padding: '4px',
                    background: '#000000',
                    borderRadius: '12px',
                    border: '1px solid #111111',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setStatus('OPEN')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '10px',
                      border: 'none',
                      minHeight: '44px',
                      background: status === 'OPEN' ? '#fff' : 'transparent',
                      color: status === 'OPEN' ? '#000' : '#64748b',
                      fontWeight: '900',
                      cursor: 'pointer',
                    }}
                  >
                    OPEN POSITION
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('CLOSED')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '10px',
                      border: 'none',
                      minHeight: '44px',
                      background: status === 'CLOSED' ? '#fff' : 'transparent',
                      color: status === 'CLOSED' ? '#000' : '#64748b',
                      fontWeight: '900',
                      cursor: 'pointer',
                    }}
                  >
                    CLOSED TRADE
                  </button>
                </div>
              </div>

              {status === 'CLOSED' && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '20px',
                    animation: 'fadeIn 0.3s ease',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '900',
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                      }}
                    >
                      Exit Price
                    </label>
                    <input
                      type="number"
                      value={exitPrice}
                      onChange={(e) => setExitPrice(e.target.value)}
                      placeholder="0.00"
                      style={{
                        background: '#000000',
                        border: '1px solid #111111',
                        padding: '16px 20px',
                        borderRadius: '16px',
                        color: '#fff',
                        fontSize: '1rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '900',
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                      }}
                    >
                      Exit Date
                    </label>
                    <input
                      type="date"
                      value={exitDate}
                      onChange={(e) => setExitDate(e.target.value)}
                      style={{
                        background: '#000000',
                        border: '1px solid #111111',
                        padding: '16px 20px',
                        borderRadius: '16px',
                        color: '#fff',
                        fontSize: '1rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Charge Preview for closed trades */}
              {status === 'CLOSED' &&
                exitPrice &&
                avgPrice &&
                quantity &&
                (() => {
                  const qty = parseFloat(quantity);
                  const entryP = parseFloat(avgPrice);
                  const exitP = parseFloat(exitPrice);
                  if (!qty || !entryP || !exitP) return null;
                  const grossPnl =
                    tradeType === 'BUY' ? (exitP - entryP) * qty : (entryP - exitP) * qty;
                  const charges = calculateFnoCharges(tradeType, qty, entryP, exitP, instrument);
                  const netPnl = grossPnl - charges.total;
                  return (
                    <div
                      style={{
                        background: 'rgba(99, 102, 241, 0.05)',
                        border: '1px solid rgba(99, 102, 241, 0.15)',
                        borderRadius: '20px',
                        padding: '20px',
                        animation: 'fadeIn 0.3s ease',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: '900',
                          color: '#818cf8',
                          textTransform: 'uppercase',
                          letterSpacing: '1.5px',
                          marginBottom: '16px',
                        }}
                      >
                        Zerodha Charge Estimate
                      </div>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                          gap: '8px',
                          fontSize: '0.8rem',
                        }}
                      >
                        <span style={{ color: '#64748b' }}>Gross P&L</span>
                        <span
                          style={{
                            textAlign: 'right',
                            fontWeight: '800',
                            color: grossPnl >= 0 ? '#10b981' : '#f43f5e',
                          }}
                        >
                          {grossPnl >= 0 ? '+' : ''}₹{grossPnl.toFixed(2)}
                        </span>
                        <span style={{ color: '#64748b' }}>Brokerage</span>
                        <span style={{ textAlign: 'right', color: '#f59e0b' }}>
                          -₹{charges.brokerage}
                        </span>
                        <span style={{ color: '#64748b' }}>STT</span>
                        <span style={{ textAlign: 'right', color: '#f59e0b' }}>
                          -₹{charges.stt}
                        </span>
                        <span style={{ color: '#64748b' }}>Transaction + SEBI</span>
                        <span style={{ textAlign: 'right', color: '#f59e0b' }}>
                          -₹{(charges.transactionCharges + charges.sebiCharges).toFixed(2)}
                        </span>
                        <span style={{ color: '#64748b' }}>Stamp + GST</span>
                        <span style={{ textAlign: 'right', color: '#f59e0b' }}>
                          -₹{(charges.stampDuty + charges.gst).toFixed(2)}
                        </span>
                        <div
                          style={{
                            gridColumn: 'span 2',
                            borderTop: '1px solid rgba(255,255,255,0.1)',
                            margin: '4px 0',
                          }}
                        />
                        <span style={{ fontWeight: '900', color: '#fff' }}>Net P&L</span>
                        <span
                          style={{
                            textAlign: 'right',
                            fontWeight: '950',
                            fontSize: '1rem',
                            color: netPnl >= 0 ? '#10b981' : '#f43f5e',
                          }}
                        >
                          {netPnl >= 0 ? '+' : ''}₹{netPnl.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })()}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '900',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}
                >
                  Operating Bank Account
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#000000',
                    border: '1px solid #111111',
                    padding: '16px 20px',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none',
                  }}
                >
                  <option value="">No Account (Ledger Only)</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} - ₹{acc.balance.toLocaleString()}
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: '0.7rem', color: '#475569', marginTop: '4px' }}>
                  Margin/Investment will be {status === 'CLOSED' ? 'settled with' : 'taken from'}{' '}
                  this account.
                </p>
              </div>

              <button
                type="submit"
                style={{
                  marginTop: '20px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  color: '#fff',
                  padding: '20px',
                  borderRadius: '20px',
                  border: 'none',
                  minHeight: '44px',
                  fontWeight: '950',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  boxShadow: '0 15px 30px rgba(99, 102, 241, 0.4)',
                }}
              >
                {editId ? 'Commit Modifications' : 'Confirm Trade Log'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
    </div>
  );
}
