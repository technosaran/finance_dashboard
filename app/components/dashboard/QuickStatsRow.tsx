'use client';

import { ArrowDownRight, ArrowUpRight, BarChart3, TrendingUp, Wallet } from 'lucide-react';

interface QuickStatsRowProps {
  liquidityINR: number;
  totalInvestment: number;
  totalUnrealizedPnl: number;
  stockDayChange: number;
  investmentPnlPercent?: number;
}

interface StatCard {
  label: string;
  value: string;
  subValue: string;
  icon: React.ReactNode;
  color: string;
  trend: 'up' | 'down' | 'neutral';
}

const CRORE = 10_000_000;
const LAKH = 100_000;
const THOUSAND = 1_000;

function formatAmount(value: number): string {
  const absolute = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absolute >= CRORE) return `${sign}Rs ${(absolute / CRORE).toFixed(2)}Cr`;
  if (absolute >= LAKH) return `${sign}Rs ${(absolute / LAKH).toFixed(2)}L`;
  if (absolute >= THOUSAND) return `${sign}Rs ${(absolute / THOUSAND).toFixed(1)}K`;

  return `${sign}Rs ${absolute.toLocaleString('en-IN')}`;
}

export function QuickStatsRow({
  liquidityINR,
  totalInvestment,
  totalUnrealizedPnl,
  stockDayChange,
  investmentPnlPercent = 0,
}: QuickStatsRowProps) {
  const stats: StatCard[] = [
    {
      label: 'Liquid Cash',
      value: formatAmount(liquidityINR),
      subValue: 'Available balance',
      icon: <Wallet size={18} />,
      color: '#89dbff',
      trend: 'neutral',
    },
    {
      label: 'Investments',
      value: formatAmount(totalInvestment),
      subValue: 'Capital deployed',
      icon: <BarChart3 size={18} />,
      color: '#6ee7b7',
      trend: 'neutral',
    },
    {
      label: 'Unrealized P&L',
      value: `${totalUnrealizedPnl >= 0 ? '+' : ''}${formatAmount(totalUnrealizedPnl)}`,
      subValue: `${investmentPnlPercent >= 0 ? '+' : ''}${investmentPnlPercent.toFixed(2)}% overall`,
      icon: totalUnrealizedPnl >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />,
      color: totalUnrealizedPnl >= 0 ? '#8df0c6' : '#fda4af',
      trend: totalUnrealizedPnl >= 0 ? 'up' : 'down',
    },
    {
      label: 'Day Change',
      value: `${stockDayChange >= 0 ? '+' : ''}${formatAmount(stockDayChange)}`,
      subValue: 'Current market move',
      icon: <TrendingUp size={18} />,
      color: stockDayChange >= 0 ? '#8de7ca' : '#fda4af',
      trend: stockDayChange >= 0 ? 'up' : 'down',
    },
  ];

  return (
    <section className="ios-stat-grid">
      {stats.map((stat) => (
        <div key={stat.label} className="ios-stat-card fade-in">
          <div className="ios-stat-card__top">
            <div
              className="ios-stat-card__icon"
              style={{
                color: stat.color,
                background: `${stat.color}22`,
                borderColor: `${stat.color}33`,
              }}
            >
              {stat.icon}
            </div>
            <span className="ios-stat-card__label">{stat.label}</span>
          </div>

          <div>
            <div
              className="ios-stat-card__value"
              style={{ color: stat.trend === 'neutral' ? '#ffffff' : stat.color }}
            >
              {stat.value}
            </div>
            <div
              className="ios-stat-card__subvalue"
              style={{ color: stat.trend === 'neutral' ? 'var(--text-secondary)' : stat.color }}
            >
              {stat.trend === 'up' && <ArrowUpRight size={14} />}
              {stat.trend === 'down' && <ArrowDownRight size={14} />}
              {stat.subValue}
            </div>
          </div>

          <div className="ios-stat-card__glow" style={{ background: stat.color }} />
        </div>
      ))}
    </section>
  );
}
