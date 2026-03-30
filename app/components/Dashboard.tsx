'use client';

import { useMemo } from 'react';
import { useLedger, usePortfolio, useSettings } from './FinanceContext';
import { useAuth } from '@/app/components/AuthContext';
import { QuickStatsRow } from './dashboard/QuickStatsRow';
import { NetWorthCard } from './dashboard/NetWorthCard';
import { TopHoldings } from './dashboard/TopHoldings';
import { RecentActivity } from './dashboard/RecentActivity';
import { GoalsProgress } from './dashboard/GoalsProgress';
import { EmptyPortfolioVisual } from './Visuals';
import { PageSkeleton, PageState } from '@/app/components/ui/PageState';
import { InfoHint } from '@/app/components/ui/InfoHint';
import { MoneyValue } from '@/app/components/ui/MoneyValue';
import { formatDateTime } from '@/lib/utils/format';
import { calculateDashboardMetrics } from '@/lib/utils/dashboard';

function getGreeting(): { text: string; subtext: string; emoji: string; emojiLabel: string } {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return {
      text: 'Good morning',
      subtext: 'Here is where your money stands today.',
      emoji: 'Sun',
      emojiLabel: 'good morning',
    };
  }

  if (hour >= 12 && hour < 17) {
    return {
      text: 'Good afternoon',
      subtext: 'Check balances, holdings, and recent activity at a glance.',
      emoji: 'Day',
      emojiLabel: 'good afternoon',
    };
  }

  if (hour >= 17 && hour < 21) {
    return {
      text: 'Good evening',
      subtext: "Review today's movement before you wrap up.",
      emoji: 'Dusk',
      emojiLabel: 'good evening',
    };
  }

  return {
    text: 'Good night',
    subtext: 'A quick summary before the day ends.',
    emoji: 'Night',
    emojiLabel: 'good night',
  };
}

function getUserDisplayName(
  user: { email?: string; user_metadata?: Record<string, unknown> } | null | undefined
): string {
  if (!user) return 'there';

  const metadataName =
    user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.display_name;

  if (metadataName) {
    return String(metadataName).split(' ')[0];
  }

  if (user.email) {
    const localPart = user.email.split('@')[0];
    const name = localPart.split(/[._-]/)[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  return 'User';
}

export default function Dashboard() {
  const { accounts, goals, transactions, loading, error, lastUpdatedAt } = useLedger();
  const { stocks, mutualFunds, stockTransactions, mutualFundTransactions, fnoTrades, bonds } =
    usePortfolio();
  const { settings } = useSettings();
  const { user } = useAuth();

  const greeting = useMemo(() => getGreeting(), []);
  const displayName = useMemo(
    () => settings?.displayName || getUserDisplayName(user),
    [settings?.displayName, user]
  );

  const metrics = useMemo(
    () =>
      calculateDashboardMetrics({
        accounts,
        transactions,
        stocks,
        stockTransactions,
        mutualFunds,
        mutualFundTransactions,
        fnoTrades,
        bonds,
      }),
    [
      accounts,
      bonds,
      fnoTrades,
      mutualFunds,
      mutualFundTransactions,
      stockTransactions,
      stocks,
      transactions,
    ]
  );

  const allocationData = useMemo(
    () =>
      [
        { name: 'Cash', value: metrics.liquidityINR, color: '#6bb99d' },
        { name: 'Stocks', value: metrics.stocksValue, color: '#20b072' },
        { name: 'Mutual Funds', value: metrics.mutualFundsValue, color: '#f2a93b' },
        { name: 'Bonds', value: metrics.bondsValue, color: '#2f7b74' },
      ].filter((entry) => entry.value > 0),
    [metrics]
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
        .map((goal) => ({
          name: goal.name,
          target: goal.targetAmount,
          current: goal.currentAmount,
          percentage:
            goal.targetAmount > 0
              ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
              : 0,
          deadline: goal.deadline,
        }))
        .slice(0, 3),
    [goals]
  );

  const topHoldings = useMemo(
    () =>
      [...stocks]
        .filter((stock) => stock.quantity > 0)
        .sort((a, b) => b.currentValue - a.currentValue)
        .slice(0, 5),
    [stocks]
  );

  if (loading) {
    return (
      <div className="page-container">
        <div className="bg-mesh" />
        <PageSkeleton cardCount={4} rowCount={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="bg-mesh" />
        <PageState
          variant="error"
          title="Unable to load your dashboard"
          description={error}
          actionLabel="Retry"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  const hasAnyData =
    topHoldings.length > 0 || recentTransactions.length > 0 || goalsProgress.length > 0;

  return (
    <div className="page-container">
      <div className="bg-mesh" />

      <header className="dashboard-header" style={{ marginBottom: '40px' }}>
        <div
          className="fade-in"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '24px',
            width: '100%',
          }}
        >
          <div style={{ flex: 1 }}>
            <h1
              style={{
                color: 'var(--foreground)',
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                fontWeight: '800',
                letterSpacing: '-0.02em',
                margin: 0,
                display: 'flex',
                alignItems: 'baseline',
                gap: '10px',
                flexWrap: 'wrap',
              }}
            >
              <span aria-label={greeting.emojiLabel}>{greeting.emoji}</span>
              {greeting.text}, <span className="gradient-text">{displayName}.</span>
            </h1>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '1.05rem',
                fontWeight: '500',
                marginTop: '10px',
                maxWidth: '620px',
                lineHeight: 1.6,
              }}
            >
              {greeting.subtext}
            </p>
          </div>

          <div
            className="premium-card"
            style={{
              padding: '14px 16px',
              minWidth: '260px',
              display: 'grid',
              gap: '8px',
            }}
          >
            <div
              style={{
                fontSize: '0.72rem',
                color: 'var(--muted)',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              As of
            </div>
            <div style={{ fontWeight: '800', color: '#fff' }}>
              {lastUpdatedAt ? formatDateTime(lastUpdatedAt) : 'Not synced yet'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
              Numbers and prices reflect the latest successful refresh in this session.
            </div>
          </div>
        </div>
      </header>

      <QuickStatsRow
        liquidityINR={metrics.liquidityINR}
        totalInvestment={metrics.totalInvestment}
        totalUnrealizedPnl={metrics.totalUnrealizedPnl}
        todayMovement={metrics.todayMovement}
        compactNumbers={settings.compactNumbers}
        investmentPnlPercent={
          metrics.totalInvestment > 0
            ? (metrics.totalUnrealizedPnl / metrics.totalInvestment) * 100
            : 0
        }
      />

      <div
        className="premium-card"
        style={{
          marginBottom: '24px',
          padding: '16px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            fontSize: '0.85rem',
            color: 'var(--muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <InfoHint
            label="Net movement"
            description="Inflow minus spending across the ledger, excluding internal transfers so movement is not double-counted."
          />
          <span>Across tracked ledger activity</span>
        </div>
        <div
          className="table-nums"
          style={{
            fontSize: '1rem',
            fontWeight: '900',
            color: metrics.netMovement >= 0 ? '#20b072' : '#ff4d6d',
          }}
        >
          <MoneyValue
            amount={metrics.netMovement}
            compact={settings.compactNumbers}
            showSign={metrics.netMovement >= 0}
          />
        </div>
      </div>

      <NetWorthCard
        totalNetWorth={metrics.totalNetWorth}
        realizedPnl={metrics.realizedPnl}
        liquidityINR={metrics.liquidityINR}
        investmentsTotal={metrics.stocksValue + metrics.mutualFundsValue + metrics.bondsValue}
        allocationData={allocationData}
        compactNumbers={settings.compactNumbers}
      />

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: '20px',
        }}
      >
        <TopHoldings holdings={topHoldings} />
        <RecentActivity
          transactions={recentTransactions}
          compactNumbers={settings.compactNumbers}
        />
        <GoalsProgress goals={goalsProgress} />

        {!hasAnyData ? (
          <div
            className="fade-in"
            style={{
              background: 'rgba(11, 21, 25, 0.82)',
              borderRadius: '16px',
              border: '1px dashed rgba(160, 188, 180, 0.18)',
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
              Your dashboard is ready
            </div>
            <div
              style={{
                fontSize: '0.95rem',
                color: '#64748b',
                maxWidth: '420px',
                margin: '0 auto',
              }}
            >
              Add an account, investment, or goal to start seeing balances, performance, and recent
              activity here.
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
