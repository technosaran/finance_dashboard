'use client';

import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useLedger, usePortfolio, useSettings } from './FinanceContext';
import { useAuth } from '@/app/components/AuthContext';
import { MutualFundTransaction } from '@/lib/types';
import { calculateMfCharges } from '@/lib/utils/charges';
import { calculateLifetimePerformance } from '@/lib/utils/portfolio';
import { SkeletonCard } from './SkeletonLoader';
import { EmptyPortfolioVisual } from './Visuals';
import { QuickStatsRow } from './dashboard/QuickStatsRow';
import { NetWorthCard } from './dashboard/NetWorthCard';
import { TopHoldings } from './dashboard/TopHoldings';
import { RecentActivity } from './dashboard/RecentActivity';
import { GoalsProgress } from './dashboard/GoalsProgress';

function getGreeting(): { text: string; subtext: string; emoji: string; emojiLabel: string } {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return {
      text: 'Good morning',
      subtext: 'Here is where your money stands today.',
      emoji: '☀️',
      emojiLabel: 'sun — good morning',
    };
  }

  if (hour >= 12 && hour < 17) {
    return {
      text: 'Good afternoon',
      subtext: 'Check balances, holdings, and recent activity at a glance.',
      emoji: '🌤️',
      emojiLabel: 'sun behind cloud — good afternoon',
    };
  }

  if (hour >= 17 && hour < 21) {
    return {
      text: 'Good evening',
      subtext: "Review today's movement before you wrap up.",
      emoji: '🌆',
      emojiLabel: 'cityscape at dusk — good evening',
    };
  }

  return {
    text: 'Good night',
    subtext: 'A quick summary before the day ends.',
    emoji: '🌙',
    emojiLabel: 'crescent moon — good night',
  };
}

function getUserDisplayName(
  user: { email?: string; user_metadata?: Record<string, unknown> } | null | undefined
): string {
  if (!user) return 'there';

  const metadataName =
    user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.display_name;

  if (metadataName) {
    return (metadataName as string).split(' ')[0];
  }

  if (user.email) {
    const localPart = user.email.split('@')[0];
    const name = localPart.split(/[._-]/)[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  return 'User';
}

export default function Dashboard() {
  const { accounts, goals, transactions, loading, error } = useLedger();
  const {
    stocks,
    mutualFunds,
    stockTransactions,
    mutualFundTransactions,
    fnoTrades,
    bonds,
    bondTransactions,
  } = usePortfolio();
  const { settings } = useSettings();
  const { user } = useAuth();

  const greeting = useMemo(() => getGreeting(), []);
  const displayName = useMemo(
    () => settings?.displayName || getUserDisplayName(user),
    [settings?.displayName, user]
  );

  const financialMetrics = useMemo(() => {
    const liquidityINR = accounts
      .filter((account) => account.currency === 'INR')
      .reduce((sum, account) => sum + account.balance, 0);

    const stocksValue = stocks
      .filter((stock) => stock.quantity > 0)
      .reduce((sum, stock) => sum + stock.currentValue, 0);

    const mutualFundsValue = mutualFunds.reduce((sum, fund) => sum + fund.currentValue, 0);
    const bondsValue = bonds.reduce((sum, bond) => sum + bond.currentValue, 0);

    const totalNetWorth = liquidityINR + stocksValue + mutualFundsValue + bondsValue;

    const stockInvestment = stocks
      .filter((stock) => stock.quantity > 0)
      .reduce((sum, stock) => sum + stock.investmentAmount, 0);
    const mutualFundInvestment = mutualFunds.reduce((sum, fund) => sum + fund.investmentAmount, 0);
    const bondInvestment = bonds.reduce((sum, bond) => sum + bond.investmentAmount, 0);
    const totalInvestment = stockInvestment + mutualFundInvestment + bondInvestment;

    const stockBuys = stockTransactions
      .filter((transaction) => transaction.transactionType === 'BUY')
      .reduce((sum, transaction) => sum + transaction.totalAmount, 0);
    const stockSells = stockTransactions
      .filter((transaction) => transaction.transactionType === 'SELL')
      .reduce((sum, transaction) => sum + transaction.totalAmount, 0);
    const stockCharges = stockTransactions.reduce(
      (sum, transaction) => sum + (transaction.brokerage || 0) + (transaction.taxes || 0),
      0
    );
    const stockLifetime = calculateLifetimePerformance(
      stockBuys,
      stockSells,
      stocksValue,
      stockCharges
    ).lifetimeEarned;

    const mutualFundBuys = mutualFundTransactions
      .filter(
        (transaction: MutualFundTransaction) =>
          transaction.transactionType === 'BUY' || transaction.transactionType === 'SIP'
      )
      .reduce((sum, transaction) => sum + transaction.totalAmount, 0);
    const mutualFundSells = mutualFundTransactions
      .filter((transaction: MutualFundTransaction) => transaction.transactionType === 'SELL')
      .reduce((sum, transaction) => sum + transaction.totalAmount, 0);
    const mutualFundCharges = mutualFundTransactions
      .filter(
        (transaction: MutualFundTransaction) =>
          transaction.transactionType === 'BUY' || transaction.transactionType === 'SIP'
      )
      .reduce(
        (sum, transaction) =>
          sum + calculateMfCharges(transaction.transactionType, transaction.totalAmount).stampDuty,
        0
      );
    const mutualFundLifetime = calculateLifetimePerformance(
      mutualFundBuys,
      mutualFundSells,
      mutualFundsValue,
      mutualFundCharges
    ).lifetimeEarned;

    const fnoLifetime = fnoTrades
      .filter((trade) => trade.status === 'CLOSED')
      .reduce((sum, trade) => sum + trade.pnl, 0);

    const bondBuys = bondTransactions
      .filter((transaction) => transaction.transactionType === 'BUY')
      .reduce((sum, transaction) => sum + transaction.totalAmount, 0);
    const bondSells = bondTransactions
      .filter((transaction) => transaction.transactionType === 'SELL')
      .reduce((sum, transaction) => sum + transaction.totalAmount, 0);
    const bondLifetime = calculateLifetimePerformance(
      bondBuys,
      bondSells,
      bondsValue
    ).lifetimeEarned;

    const globalLifetimeWealth = stockLifetime + mutualFundLifetime + fnoLifetime + bondLifetime;

    const stockPnl = stocks
      .filter((stock) => stock.quantity > 0)
      .reduce((sum, stock) => sum + (stock.currentValue - stock.investmentAmount), 0);
    const mutualFundPnl = mutualFundsValue - mutualFundInvestment;
    const bondPnl = bondsValue - bondInvestment;
    const totalUnrealizedPnl = stockPnl + mutualFundPnl + bondPnl;

    const stockDayChange = stocks
      .filter((stock) => stock.quantity > 0)
      .reduce((sum, stock) => {
        const dayChange =
          (stock.currentPrice - (stock.previousPrice ?? stock.currentPrice)) * stock.quantity;
        return sum + dayChange;
      }, 0);
    const mutualFundDayChange = mutualFunds.reduce((sum, fund) => {
      const dayChange = (fund.currentNav - (fund.previousNav ?? fund.currentNav)) * fund.units;
      return sum + dayChange;
    }, 0);

    return {
      liquidityINR,
      stocksValue,
      mutualFundsValue,
      bondsValue,
      totalNetWorth,
      totalInvestment,
      globalLifetimeWealth,
      totalUnrealizedPnl,
      stockDayChange: stockDayChange + mutualFundDayChange,
    };
  }, [
    accounts,
    stocks,
    mutualFunds,
    bonds,
    stockTransactions,
    mutualFundTransactions,
    fnoTrades,
    bondTransactions,
  ]);

  const allocationData = useMemo(
    () =>
      [
        { name: 'Cash', value: financialMetrics.liquidityINR, color: '#6bb99d' },
        { name: 'Stocks', value: financialMetrics.stocksValue, color: '#20b072' },
        { name: 'Mutual Funds', value: financialMetrics.mutualFundsValue, color: '#f2a93b' },
        { name: 'Bonds', value: financialMetrics.bondsValue, color: '#2f7b74' },
      ].filter((entry) => entry.value > 0),
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

  if (error) {
    return (
      <div className="page-container">
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
            <AlertTriangle size={32} color="#ef5d5d" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff', margin: 0 }}>
            Unable to load your dashboard
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', maxWidth: '400px', lineHeight: '1.6' }}>
            {error}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px',
              background: '#1a8e68',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: '700',
              cursor: 'pointer',
              marginTop: '8px',
            }}
          >
            Reload
          </button>
        </div>
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
              <span role="img" aria-label={greeting.emojiLabel}>
                {greeting.emoji}
              </span>{' '}
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
        </div>
      </header>

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

      <NetWorthCard
        totalNetWorth={financialMetrics.totalNetWorth}
        globalLifetimeWealth={financialMetrics.globalLifetimeWealth}
        liquidityINR={financialMetrics.liquidityINR}
        investmentsTotal={
          financialMetrics.stocksValue +
          financialMetrics.mutualFundsValue +
          financialMetrics.bondsValue
        }
        allocationData={allocationData}
      />

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

        {!hasAnyData && (
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
        )}
      </section>
    </div>
  );
}
