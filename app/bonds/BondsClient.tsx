'use client';

import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Landmark,
  TrendingUp,
  ShieldCheck,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Wallet,
  Trash2,
  Eye,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { EmptyPortfolioVisual } from '../components/Visuals';
import { useFinance } from '../components/FinanceContext';
import { Bond } from '@/lib/types';
import { calculateBondCharges } from '@/lib/utils/charges';
import { SkeletonCard } from '../components/SkeletonLoader';
import { useNotifications } from '../components/NotificationContext';
import AddBondModal from '../components/AddBondModal';

type SortField = 'value' | 'coupon' | 'maturity' | 'pnl';

// Helper defined outside component to bypass react-hooks/purity rule safely
const getDaysToMaturity = (dateStr: string) => {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
};

export default function BondsClient() {
  const { bonds, loading, deleteBond, settings, refreshLivePrices } = useFinance();
  const { showNotification, confirm } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingCharges, setViewingCharges] = useState<Bond | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortField, setSortField] = useState<SortField>('value');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshLivePrices();
    setIsRefreshing(false);
    showNotification('success', 'Prices refreshed');
  };

  // Filter and sort bonds
  const filteredBonds = useMemo(() => {
    const filtered = bonds.filter(
      (b) =>
        b.quantity > 0 &&
        (b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.isin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.companyName?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return filtered.sort((a, b) => {
      switch (sortField) {
        case 'value':
          return b.currentValue - a.currentValue;
        case 'coupon':
          return b.couponRate - a.couponRate;
        case 'maturity':
          return new Date(a.maturityDate).getTime() - new Date(b.maturityDate).getTime();
        case 'pnl':
          return b.pnlPercentage - a.pnlPercentage;
        default:
          return 0;
      }
    });
  }, [bonds, searchQuery, sortField]);

  // Financial calculations
  const stats = useMemo(() => {
    const activeBonds = bonds.filter((b) => b.quantity > 0);
    const totalInvested = activeBonds.reduce((sum, b) => sum + b.investmentAmount, 0);
    const currentValue = activeBonds.reduce((sum, b) => sum + b.currentValue, 0);
    const totalPnL = currentValue - totalInvested;
    const pnlPercentage = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
    const avgYield =
      activeBonds.length > 0
        ? activeBonds.reduce((sum, b) => sum + b.couponRate, 0) / activeBonds.length
        : 0;

    // Estimated annual interest income
    const annualIncome = activeBonds.reduce((sum, b) => {
      return sum + (b.faceValue * b.quantity * b.couponRate) / 100;
    }, 0);

    // Nearest maturity
    const nextMaturing = activeBonds
      .filter((b) => new Date(b.maturityDate) > new Date())
      .sort((a, b) => new Date(a.maturityDate).getTime() - new Date(b.maturityDate).getTime())[0];

    return {
      totalInvested,
      currentValue,
      totalPnL,
      pnlPercentage,
      avgYield,
      annualIncome,
      nextMaturing,
      totalBonds: activeBonds.length,
    };
  }, [bonds]);

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
        <div className="premium-card" style={{ height: '400px' }}>
          <div className="skeleton" style={{ height: '100%', width: '100%' }} />
        </div>
      </div>
    );
  }

  if (!settings.bondsEnabled) {
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
          <Landmark
            size={48}
            className="mb-md"
            style={{ color: '#64748b', opacity: 0.5, margin: '0 auto 24px auto' }}
          />
          <h2 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '12px' }}>
            Bonds Section Disabled
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            You have disabled the bonds tracking section in your settings. Enable it to track your
            Wint Wealth and other fixed-income investments.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="bg-mesh" />

      <header className="dashboard-header">
        <div className="fade-in">
          <h1
            className="dashboard-title"
            style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
          >
            <Landmark className="text-glow" style={{ color: 'var(--accent)' }} size={32} />
            <span>
              Bonds <span className="title-accent">& Fixed Income</span>
            </span>
          </h1>
        </div>

        <div className="flex gap-sm" style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleRefresh}
            className="glass-button"
            style={{
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: '14px',
            }}
            title="Refresh Prices"
          >
            <RefreshCw size={18} className={isRefreshing ? 'spin-animation' : ''} />
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
            <Plus size={18} /> Add Bond
          </button>
        </div>
      </header>

      {/* Stats Overview — 5 cards */}
      <div
        className="fade-in"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))',
          gap: '14px',
          marginBottom: '24px',
        }}
      >
        {/* Total Investment */}
        <div
          className="premium-card"
          style={{
            padding: '20px',
            background: 'linear-gradient(145deg, rgba(99, 102, 241, 0.06), rgba(15, 23, 42, 0.6))',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: '800',
                color: '#64748b',
                textTransform: 'uppercase',
              }}
            >
              Invested
            </span>
            <Wallet size={15} style={{ color: '#6366f1' }} />
          </div>
          <div className="stat-value" style={{ fontSize: '1.4rem', fontWeight: '900' }}>
            ₹{stats.totalInvested.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#475569', marginTop: '4px' }}>
            {stats.totalBonds} bonds
          </div>
        </div>

        {/* Current Value */}
        <div
          className="premium-card"
          style={{
            padding: '20px',
            background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.06), rgba(15, 23, 42, 0.6))',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: '800',
                color: '#64748b',
                textTransform: 'uppercase',
              }}
            >
              Current Value
            </span>
            <TrendingUp size={15} style={{ color: '#10b981' }} />
          </div>
          <div className="stat-value" style={{ fontSize: '1.4rem', fontWeight: '900' }}>
            ₹{stats.currentValue.toLocaleString()}
          </div>
        </div>

        {/* Net Gain/Loss */}
        <div
          className="premium-card"
          style={{
            padding: '20px',
            background:
              stats.totalPnL >= 0
                ? 'linear-gradient(145deg, rgba(16, 185, 129, 0.06), rgba(15, 23, 42, 0.6))'
                : 'linear-gradient(145deg, rgba(239, 68, 68, 0.06), rgba(15, 23, 42, 0.6))',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: '800',
                color: '#64748b',
                textTransform: 'uppercase',
              }}
            >
              Net Gain/Loss
            </span>
            {stats.totalPnL >= 0 ? (
              <ArrowUpRight size={15} style={{ color: '#10b981' }} />
            ) : (
              <ArrowDownRight size={15} style={{ color: '#ef4444' }} />
            )}
          </div>
          <div
            style={{
              fontSize: '1.4rem',
              fontWeight: '900',
              color: stats.totalPnL >= 0 ? '#10b981' : '#ef4444',
            }}
          >
            {stats.totalPnL >= 0 ? '+' : ''}₹{Math.abs(stats.totalPnL).toLocaleString()}
          </div>
          <div
            style={{
              fontSize: '0.65rem',
              fontWeight: '700',
              color: stats.pnlPercentage >= 0 ? '#34d399' : '#f87171',
              marginTop: '4px',
            }}
          >
            {stats.pnlPercentage >= 0 ? '+' : ''}
            {stats.pnlPercentage.toFixed(2)}%
          </div>
        </div>

        {/* Avg Coupon Rate */}
        <div
          className="premium-card"
          style={{
            padding: '20px',
            background: 'linear-gradient(145deg, rgba(245, 158, 11, 0.06), rgba(15, 23, 42, 0.6))',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: '800',
                color: '#64748b',
                textTransform: 'uppercase',
              }}
            >
              Avg. Coupon
            </span>
            <Percent size={15} style={{ color: '#f59e0b' }} />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#f59e0b' }}>
            {stats.avgYield.toFixed(2)}%
          </div>
          <div style={{ fontSize: '0.65rem', color: '#475569', marginTop: '4px' }}>
            ≈ ₹{stats.annualIncome.toLocaleString()} /yr income
          </div>
        </div>

        {/* Next Maturity */}
        <div
          className="premium-card"
          style={{
            padding: '20px',
            background: 'linear-gradient(145deg, rgba(168, 85, 247, 0.06), rgba(15, 23, 42, 0.6))',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: '800',
                color: '#64748b',
                textTransform: 'uppercase',
              }}
            >
              Next Maturity
            </span>
            <Clock size={15} style={{ color: '#a855f7' }} />
          </div>
          {stats.nextMaturing ? (
            <>
              <div style={{ fontSize: '1rem', fontWeight: '900', color: '#e2e8f0' }}>
                {getDaysToMaturity(stats.nextMaturing.maturityDate)}d
              </div>
              <div
                style={{
                  fontSize: '0.6rem',
                  color: '#a855f7',
                  fontWeight: '700',
                  marginTop: '4px',
                }}
              >
                {stats.nextMaturing.name.length > 20
                  ? stats.nextMaturing.name.substring(0, 20) + '…'
                  : stats.nextMaturing.name}
              </div>
            </>
          ) : (
            <div style={{ fontSize: '0.8rem', color: '#475569' }}>No bonds</div>
          )}
        </div>
      </div>

      {/* Toolbar: Search + Sort */}
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
        <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '400px', minWidth: '0' }}>
          <Search
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#475569',
            }}
            size={16}
          />
          <input
            type="text"
            placeholder="Search by ISIN, bond name, or company…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '11px 12px 11px 44px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '14px',
              color: '#fff',
              outline: 'none',
              fontSize: '0.85rem',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'value' as SortField, label: 'Value' },
            { id: 'coupon' as SortField, label: 'Coupon' },
            { id: 'maturity' as SortField, label: 'Maturity' },
            { id: 'pnl' as SortField, label: 'P&L' },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setSortField(s.id)}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                border: `1px solid ${sortField === s.id ? '#6366f140' : 'rgba(255,255,255,0.06)'}`,
                background:
                  sortField === s.id ? 'rgba(99, 102, 241, 0.1)' : 'rgba(15, 23, 42, 0.4)',
                color: sortField === s.id ? '#818cf8' : '#64748b',
                fontSize: '0.7rem',
                fontWeight: '800',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
                transition: 'all 0.2s',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bonds List */}
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredBonds.length > 0 ? (
          filteredBonds.map((bond, idx) => {
            const days = getDaysToMaturity(bond.maturityDate);
            const isMatured = days <= 0;
            return (
              <div
                key={bond.id}
                className="premium-card hover-card-premium"
                style={{
                  animationDelay: `${idx * 0.05}s`,
                  background:
                    'linear-gradient(145deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                  padding: '22px 24px',
                  border: '1px solid rgba(148, 163, 184, 0.08)',
                }}
              >
                <div
                  style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '20px' }}
                >
                  {/* Bond Name & Info */}
                  <div style={{ flex: '1 1 280px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '6px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          fontSize: '1.1rem',
                          fontWeight: '900',
                          color: '#e2e8f0',
                        }}
                      >
                        {bond.name}
                      </h3>
                      {bond.isin && (
                        <div
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'rgba(99, 102, 241, 0.1)',
                            color: '#818cf8',
                            fontSize: '0.65rem',
                            fontWeight: '800',
                            border: '1px solid rgba(99, 102, 241, 0.2)',
                          }}
                        >
                          {bond.isin}
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        color: '#475569',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        flexWrap: 'wrap',
                      }}
                    >
                      {bond.companyName && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ShieldCheck size={13} /> {bond.companyName}
                        </span>
                      )}
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: isMatured ? '#ef4444' : days <= 365 ? '#f59e0b' : '#475569',
                          fontWeight: isMatured || days <= 365 ? '700' : '600',
                        }}
                      >
                        <Calendar size={13} />
                        {isMatured
                          ? 'Matured'
                          : `${days}d to maturity (${new Date(bond.maturityDate).toLocaleDateString(
                              'en-IN',
                              {
                                month: 'short',
                                year: 'numeric',
                              }
                            )})`}
                      </span>
                    </div>
                    {/* Maturity progress bar */}
                    {!isMatured && (
                      <div
                        style={{
                          marginTop: '10px',
                          height: '3px',
                          background: 'rgba(255,255,255,0.04)',
                          borderRadius: '100px',
                          overflow: 'hidden',
                          maxWidth: '240px',
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.max(0, Math.min(100, 100 - (days / (365 * 5)) * 100))}%`,
                            height: '100%',
                            background:
                              days <= 365
                                ? 'linear-gradient(to right, #f59e0b, #fbbf24)'
                                : 'linear-gradient(to right, #6366f1, #818cf8)',
                            borderRadius: '100px',
                            transition: 'width 0.8s ease',
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Yield & Frequency */}
                  <div style={{ flex: '0 0 100px', textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: '800',
                        color: '#64748b',
                        textTransform: 'uppercase',
                        marginBottom: '4px',
                      }}
                    >
                      Coupon Rate
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '950', color: '#f59e0b' }}>
                      {bond.couponRate.toFixed(2)}%
                    </div>
                    <div
                      style={{
                        fontSize: '0.6rem',
                        color: '#475569',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                      }}
                    >
                      {bond.interestFrequency}
                    </div>
                  </div>

                  {/* Quantity & Face Value */}
                  <div style={{ flex: '0 0 90px', textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: '800',
                        color: '#64748b',
                        textTransform: 'uppercase',
                        marginBottom: '4px',
                      }}
                    >
                      Holdings
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: '900', color: '#e2e8f0' }}>
                      {bond.quantity}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: '#475569', fontWeight: '700' }}>
                      @ ₹{bond.avgPrice.toLocaleString()} avg
                    </div>
                  </div>

                  {/* Investment Value */}
                  <div style={{ flex: '0 0 130px', textAlign: 'right' }}>
                    <div
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: '800',
                        color: '#64748b',
                        textTransform: 'uppercase',
                        marginBottom: '4px',
                      }}
                    >
                      Current Value
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: '950', color: '#fff' }}>
                      ₹{bond.currentValue.toLocaleString()}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '3px',
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        color: bond.pnl >= 0 ? '#10b981' : '#ef4444',
                      }}
                    >
                      {bond.pnl >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {bond.pnl >= 0 ? '+' : ''}₹{bond.pnl.toLocaleString()}{' '}
                      <span style={{ opacity: 0.7 }}>({bond.pnlPercentage.toFixed(1)}%)</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => setViewingCharges(bond)}
                      style={{
                        color: '#94a3b8',
                        padding: '9px',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Estimated Sell Charges"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={async () => {
                        const isConfirmed = await confirm({
                          title: 'Delete Bond?',
                          message: `Are you sure you want to remove ${bond.name} from your portfolio?`,
                          type: 'error',
                        });
                        if (isConfirmed) {
                          await deleteBond(bond.id);
                          showNotification('success', 'Bond removed successfully');
                        }
                      }}
                      style={{
                        color: '#f87171',
                        padding: '9px',
                        borderRadius: '10px',
                        background: 'rgba(239, 68, 68, 0.06)',
                        border: '1px solid rgba(239, 68, 68, 0.15)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div
            className="premium-card"
            style={{
              padding: '80px 32px',
              textAlign: 'center',
              background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.2), rgba(15, 23, 42, 0.4))',
              borderRadius: '32px',
              border: '1px dashed rgba(255,255,255,0.1)',
            }}
          >
            <div style={{ marginBottom: '32px' }}>
              <EmptyPortfolioVisual />
            </div>
            <h3
              style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '12px', color: '#fff' }}
            >
              {searchQuery ? 'No Matching Bonds' : 'No Fixed-Income Assets'}
            </h3>
            <p
              style={{
                color: '#64748b',
                marginBottom: '40px',
                maxWidth: '450px',
                margin: '0 auto 40px auto',
                lineHeight: '1.6',
              }}
            >
              {searchQuery
                ? 'Try adjusting your search filters to find what you are looking for.'
                : 'Start tracking your secure fixed-income portfolio. Add your first premium bond or Wint Wealth investment.'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="glass-button glow-primary"
                style={{
                  padding: '16px 32px',
                  background: 'var(--accent)',
                  borderColor: 'transparent',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  borderRadius: '16px',
                  fontSize: '1rem',
                  fontWeight: '800',
                  boxShadow: '0 10px 30px rgba(99, 102, 241, 0.3)',
                }}
              >
                <Plus size={20} /> Add Private Bond
              </button>
            )}
          </div>
        )}
      </div>

      {/* Charges Modal */}
      {viewingCharges &&
        (() => {
          const charges = calculateBondCharges(
            'SELL',
            viewingCharges.quantity,
            viewingCharges.currentPrice,
            settings
          );
          return (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1200,
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
                  background: 'rgba(0,0,0,0.8)',
                  backdropFilter: 'blur(10px)',
                }}
                onClick={() => setViewingCharges(null)}
              />

              <div
                className="premium-card fade-in"
                style={{
                  position: 'relative',
                  width: '90%',
                  maxWidth: '420px',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '24px',
                  padding: '0',
                  overflow: 'hidden',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                  maxHeight: '95vh',
                  overflowY: 'auto',
                }}
              >
                <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <h2
                      style={{
                        fontSize: 'clamp(1.25rem, 4vw, 1.5rem)',
                        fontWeight: '900',
                        margin: 0,
                      }}
                    >
                      Exit Simulator
                    </h2>
                    <button
                      onClick={() => setViewingCharges(null)}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: 'none',
                        color: '#94a3b8',
                        borderRadius: '12px',
                        padding: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
                    </button>
                  </div>
                </div>

                <div style={{ padding: '24px' }}>
                  <div
                    style={{
                      padding: '16px',
                      borderRadius: '16px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      marginBottom: '24px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: '#64748b',
                        marginBottom: '4px',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                      }}
                    >
                      Instrument
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: '800', color: '#fff' }}>
                      {viewingCharges.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                      {viewingCharges.isin} • {viewingCharges.quantity} units @ ₹
                      {viewingCharges.currentPrice.toLocaleString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { label: 'Brokerage', value: charges.brokerage },
                      { label: 'Stamp Duty', value: charges.stampDuty },
                      { label: 'GST', value: charges.gst },
                    ].map((item) => (
                      <div
                        key={item.label}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{item.label}</span>
                        <span style={{ color: '#fff', fontWeight: '700', fontSize: '0.95rem' }}>
                          ₹{item.value.toFixed(2)}
                        </span>
                      </div>
                    ))}
                    <div style={{ height: '1px', background: '#334155', margin: '8px 0' }} />
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ color: '#fff', fontWeight: '900', fontSize: '1rem' }}>
                        Total Charges
                      </span>
                      <span style={{ color: '#f59e0b', fontSize: '1.25rem', fontWeight: '900' }}>
                        ₹{charges.total.toFixed(2)}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '8px',
                        padding: '12px',
                        borderRadius: '12px',
                        background: 'rgba(16, 185, 129, 0.06)',
                        border: '1px solid rgba(16, 185, 129, 0.1)',
                      }}
                    >
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Net Proceeds</span>
                      <span style={{ color: '#10b981', fontSize: '1.1rem', fontWeight: '900' }}>
                        ₹
                        {(viewingCharges.currentValue - charges.total).toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    padding: '24px',
                    background: 'rgba(0,0,0,0.2)',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <button
                    onClick={() => setViewingCharges(null)}
                    className="glass-button"
                    style={{
                      width: '100%',
                      padding: '16px',
                      borderRadius: '16px',
                      border: '1px solid rgba(255,255,255,0.08)',
                      fontWeight: '800',
                      fontSize: '1rem',
                      background: 'rgba(255,255,255,0.04)',
                      minHeight: '44px',
                      cursor: 'pointer',
                      color: '#e2e8f0',
                    }}
                  >
                    Close Simulator
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      <AddBondModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}
