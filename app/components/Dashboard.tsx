'use client';

import { useMemo, useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useFinance } from './FinanceContext';
import { useAuth } from './AuthContext';
import { MutualFundTransaction } from '@/lib/types';
import { SkeletonCard } from './SkeletonLoader';
import { EmptyPortfolioVisual } from './Visuals';

// Dashboard sub-components (extracted for maintainability)
import { QuickStatsRow } from './dashboard/QuickStatsRow';
import { NetWorthCard } from './dashboard/NetWorthCard';
import { TopHoldings } from './dashboard/TopHoldings';
import { RecentActivity } from './dashboard/RecentActivity';
import { GoalsProgress } from './dashboard/GoalsProgress';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/**
 * Get dynamic, time-based greeting with inspiring messages.
 * Memoised at module level — pure function with no external dependencies.
 */
function getGreeting(): { text: string; subtext: string; emoji: string; color: string } {
  const hour = new Date().getHours();
  const greetings = {
    morning: {
      text: 'Good Morning',
      subtext: 'Time to conquer your financial goals!',
      emoji: '✨',
      color: '#fbbf24',
    },
    afternoon: {
      text: 'Good Afternoon',
      subtext: "Let's check in on your empire.",
      emoji: '☀️',
      color: '#f59e0b',
    },
    evening: {
      text: 'Good Evening',
      subtext: 'Review the day\u2019s market moves.',
      emoji: '🌇',
      color: '#818cf8',
    },
    night: {
      text: 'Good Night',
      subtext: 'Rest easy, your wealth is working.',
      emoji: '🌙',
      color: '#6366f1',
    },
  };

  if (hour >= 5 && hour < 12) return { ...greetings.morning };
  if (hour >= 12 && hour < 17) return { ...greetings.afternoon };
  if (hour >= 17 && hour < 21) return { ...greetings.evening };
  return { ...greetings.night };
}

/**
 * Check if the Indian stock market (NSE) is currently open.
 * Mon-Fri, 9:15 AM - 3:30 PM IST.
 */
function getMarketStatus(): { isOpen: boolean; label: string; nextEvent: string } {
  const now = new Date();
  // Convert to IST
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset + now.getTimezoneOffset() * 60 * 1000);
  const day = ist.getDay(); // 0=Sun, 6=Sat
  const hours = ist.getHours();
  const minutes = ist.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  const marketOpen = 9 * 60 + 15; // 9:15 AM
  const marketClose = 15 * 60 + 30; // 3:30 PM

  if (day === 0 || day === 6) {
    return { isOpen: false, label: 'Market Closed', nextEvent: 'Opens Monday 9:15 AM' };
  }

  if (totalMinutes >= marketOpen && totalMinutes < marketClose) {
    const minsLeft = marketClose - totalMinutes;
    const h = Math.floor(minsLeft / 60);
    const m = minsLeft % 60;
    return {
      isOpen: true,
      label: 'Market Open',
      nextEvent: `Closes in ${h}h ${m}m`,
    };
  }

  if (totalMinutes < marketOpen) {
    const minsUntil = marketOpen - totalMinutes;
    const h = Math.floor(minsUntil / 60);
    const m = minsUntil % 60;
    return { isOpen: false, label: 'Pre-Market', nextEvent: `Opens in ${h}h ${m}m` };
  }

  return { isOpen: false, label: 'Market Closed', nextEvent: 'Opens tomorrow 9:15 AM' };
}

/** Extract first name from Supabase user email */
function getUserDisplayName(email?: string): string {
  if (!email) return 'there';
  const localPart = email.split('@')[0];
  // Capitalize first letter, handle dots/underscores
  const name = localPart.split(/[._-]/)[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const {
    accounts,
    stocks,
    mutualFunds,
    goals,
    stockTransactions,
    mutualFundTransactions,
    fnoTrades,
    transactions,
    loading,
    error,
    settings,
  } = useFinance();
  const { user } = useAuth();

  const greeting = useMemo(() => getGreeting(), []);
  const displayName = useMemo(() => getUserDisplayName(user?.email ?? undefined), [user?.email]);

  // Market status (updates every 60s)
  const [marketStatus, setMarketStatus] = useState(getMarketStatus);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateStatus = () => {
      setMarketStatus(getMarketStatus());
      // IST formatted time
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Kolkata',
        })
      );
    };
    updateStatus();
    const interval = setInterval(updateStatus, 60_000);
    return () => clearInterval(interval);
  }, []);

  // ── Computed financial metrics ──────────────────────────────────────────────
  const financialMetrics = useMemo(() => {
    const liquidityINR = accounts
      .filter((a) => a.currency === 'INR')
      .reduce((sum, acc) => sum + acc.balance, 0);

    const stocksValue = stocks
      .filter((s) => s.quantity > 0)
      .reduce((sum, s) => sum + s.currentValue, 0);

    const mfValue = mutualFunds.reduce((sum, m) => sum + m.currentValue, 0);

    const totalNetWorth = liquidityINR + stocksValue + mfValue;

    const stockInvestment = stocks
      .filter((s) => s.quantity > 0)
      .reduce((sum, s) => sum + s.investmentAmount, 0);
    const mfInvestment = mutualFunds.reduce((sum, m) => sum + m.investmentAmount, 0);
    const totalInvestment = stockInvestment + mfInvestment;

    // Lifetime wealth (realised + unrealised across all instruments)
    const stockBuys = stockTransactions
      .filter((t) => t.transactionType === 'BUY')
      .reduce((sum, t) => sum + t.totalAmount, 0);
    const stockSells = stockTransactions
      .filter((t) => t.transactionType === 'SELL')
      .reduce((sum, t) => sum + t.totalAmount, 0);
    const stockCharges = stockTransactions.reduce(
      (sum, t) => sum + (t.brokerage || 0) + (t.taxes || 0),
      0
    );
    const stockLifetime = stockSells + stocksValue - (stockBuys + stockCharges);

    const mfBuys = mutualFundTransactions
      .filter(
        (t: MutualFundTransaction) => t.transactionType === 'BUY' || t.transactionType === 'SIP'
      )
      .reduce((sum, t) => sum + t.totalAmount, 0);
    const mfSells = mutualFundTransactions
      .filter((t: MutualFundTransaction) => t.transactionType === 'SELL')
      .reduce((sum, t) => sum + t.totalAmount, 0);
    const mfCharges = mutualFundTransactions
      .filter(
        (t: MutualFundTransaction) => t.transactionType === 'BUY' || t.transactionType === 'SIP'
      )
      .reduce((sum, t) => sum + t.totalAmount * 0.00005, 0);
    const mfLifetime = mfSells + mfValue - (mfBuys + mfCharges);

    const fnoLifetime = fnoTrades
      .filter((t) => t.status === 'CLOSED')
      .reduce((sum, t) => sum + t.pnl, 0);

    const globalLifetimeWealth = stockLifetime + mfLifetime + fnoLifetime;

    const stockPnl = stocks.filter((s) => s.quantity > 0).reduce((sum, s) => sum + s.pnl, 0);
    const mfPnl = mfValue - mfInvestment;
    const totalUnrealizedPnl = stockPnl + mfPnl;

    const stockDayChange = stocks
      .filter((s) => s.quantity > 0)
      .reduce((sum, stock) => {
        const dayChange =
          (stock.currentPrice - (stock.previousPrice ?? stock.currentPrice)) * stock.quantity;
        return sum + dayChange;
      }, 0);
    const mfDayChange = mutualFunds.reduce((sum, mf) => {
      const dayChange = (mf.currentNav - (mf.previousNav ?? mf.currentNav)) * mf.units;
      return sum + dayChange;
    }, 0);
    const totalDayChange = stockDayChange + mfDayChange;

    return {
      liquidityINR,
      stocksValue,
      mfValue,
      totalNetWorth,
      totalInvestment,
      globalLifetimeWealth,
      totalUnrealizedPnl,
      stockDayChange: totalDayChange,
    };
  }, [accounts, stocks, mutualFunds, stockTransactions, mutualFundTransactions, fnoTrades]);

  // ── Derived lists for sub-components ───────────────────────────────────────
  const allocationData = useMemo(
    () =>
      [
        { name: 'Cash', value: financialMetrics.liquidityINR, color: '#818cf8' },
        { name: 'Stocks', value: financialMetrics.stocksValue, color: '#10b981' },
        { name: 'Mutual Funds', value: financialMetrics.mfValue, color: '#f59e0b' },
      ].filter((a) => a.value > 0),
    [financialMetrics]
  );

  const recentTransactions = useMemo(
    () =>
      transactions
        .slice()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5),
    [transactions]
  );

  const goalsProgress = useMemo(
    () =>
      goals
        .map((g) => ({
          name: g.name,
          target: g.targetAmount,
          current: g.currentAmount,
          percentage:
            g.targetAmount > 0 ? Math.min((g.currentAmount / g.targetAmount) * 100, 100) : 0,
          deadline: g.deadline,
        }))
        .slice(0, 3),
    [goals]
  );

  const topHoldings = useMemo(
    () =>
      [...stocks]
        .filter((s) => s.quantity > 0)
        .sort((a, b) => b.currentValue - a.currentValue)
        .slice(0, 5),
    [stocks]
  );

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="page-container">
        <div className="bg-mesh" />
        <div style={{ marginBottom: '32px' }}>
          <div
            className="skeleton"
            style={{ height: '48px', width: 'min(100%, 350px)', marginBottom: '12px' }}
          />
          <div className="skeleton" style={{ height: '24px', width: 'min(100%, 450px)' }} />
        </div>
        <div style={{ marginBottom: '32px' }}>
          <SkeletonCard />
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="page-container">
        <div className="bg-mesh" />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 24px',
            textAlign: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertTriangle size={32} color="#ef4444" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff', margin: 0 }}>
            Unable to Load Dashboard
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', maxWidth: '400px', lineHeight: '1.6' }}>
            {error}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px',
              background: '#6366f1',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: '700',
              cursor: 'pointer',
              marginTop: '8px',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const hasAnyData =
    topHoldings.length > 0 || recentTransactions.length > 0 || goalsProgress.length > 0;

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      <div className="bg-mesh" />

      {/* ── Header ── */}
      <header className="dashboard-header" style={{ marginBottom: '32px' }}>
        <div
          className="fade-in"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: '20px',
            width: '100%',
          }}
        >
          <div>
            <h1 className="dashboard-title" style={{ margin: 0, lineHeight: 1.1 }}>
              <span
                style={{
                  fontSize: '1.2em',
                  animation: 'bounce 2s infinite',
                  display: 'inline-block',
                  marginRight: '12px',
                }}
              >
                {greeting.emoji}
              </span>
              <span style={{ color: '#fff' }}>{greeting.text}, </span>
              <span
                className="title-accent text-glow"
                style={{
                  background: 'linear-gradient(135deg, #fff 0%, #cbd5e1 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: '1.1em',
                }}
              >
                {displayName}
              </span>
            </h1>
            <p
              style={{
                color: '#475569',
                fontSize: '1rem',
                fontWeight: '500',
                marginTop: '8px',
                maxWidth: '400px',
                lineHeight: 1.4,
              }}
            >
              {greeting.subtext}
            </p>
          </div>

          {/* Market Status Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: marketStatus.isOpen
                  ? 'rgba(16, 185, 129, 0.08)'
                  : 'rgba(100, 116, 139, 0.08)',
                padding: '8px 16px',
                borderRadius: '100px',
                border: `1px solid ${marketStatus.isOpen ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.15)'}`,
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: marketStatus.isOpen ? '#10b981' : '#64748b',
                  boxShadow: marketStatus.isOpen ? '0 0 8px #10b981' : 'none',
                  animation: marketStatus.isOpen ? 'pulseGlow 2s infinite' : 'none',
                }}
              />
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: marketStatus.isOpen ? '#10b981' : '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {marketStatus.label}
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  color: '#475569',
                }}
              >
                {marketStatus.nextEvent}
              </span>
            </div>
            {currentTime && (
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  color: '#64748b',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {currentTime} IST
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ── Quick Stats Row ── */}
      <QuickStatsRow
        liquidityINR={financialMetrics.liquidityINR}
        totalInvestment={financialMetrics.totalInvestment}
        totalUnrealizedPnl={financialMetrics.totalUnrealizedPnl}
        stockDayChange={financialMetrics.stockDayChange}
        investmentPnlPercent={
          financialMetrics.totalInvestment > 0
            ? (financialMetrics.totalUnrealizedPnl / financialMetrics.totalInvestment) * 100
            : 0
        }
      />

      {/* ── Net Worth & Allocation Card ── */}
      <NetWorthCard
        totalNetWorth={financialMetrics.totalNetWorth}
        globalLifetimeWealth={financialMetrics.globalLifetimeWealth}
        liquidityINR={financialMetrics.liquidityINR}
        investmentsTotal={financialMetrics.stocksValue + financialMetrics.mfValue}
        allocationData={allocationData}
      />

      {/* ── Bottom Row: Holdings / Activity / Goals ── */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: '20px',
        }}
      >
        <TopHoldings holdings={topHoldings} />
        <RecentActivity transactions={recentTransactions} />
        <GoalsProgress goals={goalsProgress} />

        {/* ── Empty state ── */}
        {!hasAnyData && (
          <div
            className="fade-in"
            style={{
              background: 'linear-gradient(145deg, #0f172a 0%, #0a0f1e 100%)',
              borderRadius: '32px',
              border: '1px dashed rgba(255,255,255,0.08)',
              padding: '64px 32px',
              textAlign: 'center',
              gridColumn: '1 / -1',
            }}
          >
            <EmptyPortfolioVisual />
            <div
              style={{
                fontSize: '1.25rem',
                fontWeight: '800',
                color: '#fff',
                marginTop: '32px',
                marginBottom: '12px',
              }}
            >
              Welcome to your Financial Hub
            </div>
            <div
              style={{
                fontSize: '0.95rem',
                color: '#64748b',
                maxWidth: '400px',
                margin: '0 auto',
              }}
            >
              Your financial empire is waiting to be built. Start by adding accounts, stocks, or
              goals to see your insights come to life.
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
