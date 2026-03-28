'use client';

import { useMemo } from 'react';
import { AlertTriangle, Layers3, Shield, Target, Wallet } from 'lucide-react';
import { useLedger, usePortfolio, useSettings } from './FinanceContext';
import { useAuth } from '@/app/components/AuthContext';
import { MutualFundTransaction } from '@/lib/types';
import { SkeletonCard } from './SkeletonLoader';
import { EmptyPortfolioVisual } from './Visuals';
import { QuickStatsRow } from './dashboard/QuickStatsRow';
import { NetWorthCard } from './dashboard/NetWorthCard';
import { TopHoldings } from './dashboard/TopHoldings';
import { RecentActivity } from './dashboard/RecentActivity';
import { GoalsProgress } from './dashboard/GoalsProgress';

function getGreeting(): { text: string; subtext: string; label: string } {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return {
      text: 'Good morning',
      subtext: 'Your portfolio is ready with a cleaner, calmer glass overview.',
      label: 'Morning pulse',
    };
  }

  if (hour >= 12 && hour < 17) {
    return {
      text: 'Good afternoon',
      subtext: "Check today's movement and keep your capital aligned.",
      label: 'Midday snapshot',
    };
  }

  if (hour >= 17 && hour < 21) {
    return {
      text: 'Good evening',
      subtext: 'A smooth end-of-day view for balances, holdings, and progress.',
      label: 'Closing overview',
    };
  }

  return {
    text: 'Good night',
    subtext: 'Your dashboard is set for a quiet review before tomorrow opens.',
    label: 'Night session',
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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function Dashboard() {
  const { accounts, goals, transactions, loading, error } = useLedger();
  const { stocks, mutualFunds, stockTransactions, mutualFundTransactions, fnoTrades, bonds } =
    usePortfolio();
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

    const mfValue = mutualFunds.reduce((sum, fund) => sum + fund.currentValue, 0);
    const bondsValue = bonds.reduce((sum, bond) => sum + bond.currentValue, 0);

    const totalNetWorth = liquidityINR + stocksValue + mfValue + bondsValue;

    const stockInvestment = stocks
      .filter((stock) => stock.quantity > 0)
      .reduce((sum, stock) => sum + stock.investmentAmount, 0);
    const mfInvestment = mutualFunds.reduce((sum, fund) => sum + fund.investmentAmount, 0);
    const bondsInvestment = bonds.reduce((sum, bond) => sum + bond.investmentAmount, 0);
    const totalInvestment = stockInvestment + mfInvestment + bondsInvestment;

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
    const stockLifetime = stockSells + stocksValue - (stockBuys + stockCharges);

    const MF_STAMP_DUTY_RATE = 0.00005;

    const mfBuys = mutualFundTransactions
      .filter(
        (transaction: MutualFundTransaction) =>
          transaction.transactionType === 'BUY' || transaction.transactionType === 'SIP'
      )
      .reduce((sum, transaction) => sum + transaction.totalAmount, 0);
    const mfSells = mutualFundTransactions
      .filter((transaction: MutualFundTransaction) => transaction.transactionType === 'SELL')
      .reduce((sum, transaction) => sum + transaction.totalAmount, 0);
    const mfCharges = mutualFundTransactions
      .filter(
        (transaction: MutualFundTransaction) =>
          transaction.transactionType === 'BUY' || transaction.transactionType === 'SIP'
      )
      .reduce((sum, transaction) => sum + transaction.totalAmount * MF_STAMP_DUTY_RATE, 0);
    const mfLifetime = mfSells + mfValue - (mfBuys + mfCharges);

    const fnoLifetime = fnoTrades
      .filter((trade) => trade.status === 'CLOSED')
      .reduce((sum, trade) => sum + trade.pnl, 0);

    const bondLifetime = bonds.reduce((sum, bond) => sum + bond.pnl, 0);
    const globalLifetimeWealth = stockLifetime + mfLifetime + fnoLifetime + bondLifetime;

    const stockPnl = stocks
      .filter((stock) => stock.quantity > 0)
      .reduce((sum, stock) => sum + stock.pnl, 0);
    const mfPnl = mfValue - mfInvestment;
    const bondPnl = bondsValue - bondsInvestment;
    const totalUnrealizedPnl = stockPnl + mfPnl + bondPnl;

    const stockDayChange = stocks
      .filter((stock) => stock.quantity > 0)
      .reduce((sum, stock) => {
        const dayChange =
          (stock.currentPrice - (stock.previousPrice ?? stock.currentPrice)) * stock.quantity;
        return sum + dayChange;
      }, 0);

    const mfDayChange = mutualFunds.reduce((sum, fund) => {
      const dayChange = (fund.currentNav - (fund.previousNav ?? fund.currentNav)) * fund.units;
      return sum + dayChange;
    }, 0);

    return {
      liquidityINR,
      stocksValue,
      mfValue,
      bondsValue,
      totalNetWorth,
      totalInvestment,
      globalLifetimeWealth,
      totalUnrealizedPnl,
      stockDayChange: stockDayChange + mfDayChange,
    };
  }, [accounts, stocks, mutualFunds, bonds, stockTransactions, mutualFundTransactions, fnoTrades]);

  const allocationData = useMemo(
    () =>
      [
        { name: 'Cash', value: financialMetrics.liquidityINR, color: '#89dbff' },
        { name: 'Stocks', value: financialMetrics.stocksValue, color: '#6ee7b7' },
        { name: 'Mutual Funds', value: financialMetrics.mfValue, color: '#fbbf24' },
        { name: 'Bonds', value: financialMetrics.bondsValue, color: '#f9a8d4' },
      ].filter((item) => item.value > 0),
    [financialMetrics]
  );

  const recentTransactions = useMemo(
    () =>
      transactions
        .slice()
        .sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime())
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
        .sort((first, second) => second.currentValue - first.currentValue)
        .slice(0, 5),
    [stocks]
  );

  const totalTrackedHoldings =
    stocks.filter((stock) => stock.quantity > 0).length + mutualFunds.length + bonds.length;

  if (loading) {
    return (
      <div className="page-container ios-dashboard">
        <section className="premium-card ios-hero">
          <div className="ios-hero-copy">
            <div className="ios-eyebrow">Loading dashboard</div>
            <div
              className="skeleton"
              style={{ height: '58px', width: 'min(100%, 380px)', borderRadius: '24px' }}
            />
            <div
              className="skeleton"
              style={{ height: '24px', width: 'min(100%, 520px)', borderRadius: '16px' }}
            />
          </div>
          <div className="ios-hero-aside">
            <SkeletonCard />
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container ios-dashboard">
        <section className="premium-card ios-empty-state">
          <div
            style={{
              width: '72px',
              height: '72px',
              margin: '0 auto 18px',
              borderRadius: '24px',
              display: 'grid',
              placeItems: 'center',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(248, 113, 113, 0.22)',
            }}
          >
            <AlertTriangle size={34} color="#f87171" />
          </div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '10px', color: '#ffffff' }}>
            Unable to load your dashboard
          </h2>
          <p style={{ maxWidth: '480px', margin: '0 auto', color: 'var(--text-secondary)' }}>
            {error}
          </p>
          <button
            type="button"
            className="liquid-glass-btn"
            onClick={() => window.location.reload()}
            style={{ marginTop: '20px' }}
          >
            Reload
          </button>
        </section>
      </div>
    );
  }

  const hasAnyData =
    topHoldings.length > 0 || recentTransactions.length > 0 || goalsProgress.length > 0;

  return (
    <div className="page-container ios-dashboard">
      <section className="premium-card ios-hero fade-in">
        <div className="ios-hero-copy">
          <div className="ios-eyebrow">
            <Shield size={14} />
            {greeting.label}
          </div>

          <div>
            <h1 className="ios-hero-title">
              {greeting.text}, <span className="gradient-text">{displayName}</span>
            </h1>
            <p className="ios-hero-subtitle" style={{ marginTop: '14px' }}>
              {greeting.subtext}
            </p>
          </div>

          <div className="ios-hero-meta">
            <div className="ios-pill">
              <Wallet size={15} />
              Net worth <strong>{formatCurrency(financialMetrics.totalNetWorth)}</strong>
            </div>
            <div className="ios-pill">
              <Layers3 size={15} />
              Holdings <strong>{totalTrackedHoldings}</strong>
            </div>
            <div className="ios-pill">
              <Target size={15} />
              Active goals <strong>{goals.length}</strong>
            </div>
          </div>
        </div>

        <div className="ios-hero-aside">
          <div className="ios-hero-kpi">
            <div className="ios-hero-kpi__label">Today&apos;s move</div>
            <div
              className="ios-hero-kpi__value"
              style={{ color: financialMetrics.stockDayChange >= 0 ? '#8df0c6' : '#fda4af' }}
            >
              {financialMetrics.stockDayChange >= 0 ? '+' : ''}
              {formatCurrency(financialMetrics.stockDayChange)}
            </div>
            <div className="ios-hero-kpi__subvalue">Combined listed equity and fund movement</div>
          </div>

          <div className="ios-hero-kpi">
            <div className="ios-hero-kpi__label">Liquidity balance</div>
            <div className="ios-hero-kpi__value">
              {formatCurrency(financialMetrics.liquidityINR)}
            </div>
            <div className="ios-hero-kpi__subvalue">
              {accounts.length} accounts currently tracked
            </div>
          </div>
        </div>
      </section>

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
        investmentsTotal={financialMetrics.stocksValue + financialMetrics.mfValue}
        allocationData={allocationData}
      />

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
          gap: '20px',
        }}
      >
        <TopHoldings holdings={topHoldings} />
        <RecentActivity transactions={recentTransactions} />
        <GoalsProgress goals={goalsProgress} />

        {!hasAnyData && (
          <div className="fade-in ios-empty-state" style={{ gridColumn: '1 / -1' }}>
            <EmptyPortfolioVisual />
            <div
              style={{
                fontSize: '1.3rem',
                fontWeight: '800',
                color: '#ffffff',
                marginTop: '28px',
                marginBottom: '10px',
              }}
            >
              Your glass dashboard is ready for data
            </div>
            <div
              style={{
                fontSize: '0.96rem',
                color: 'var(--text-secondary)',
                maxWidth: '480px',
                margin: '0 auto',
              }}
            >
              Add accounts, investments, or goals and this surface will start filling with live
              balances, activity, and progress.
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
