'use client';

import { Wallet, BarChart3, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';

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
  subValue?: string;
  icon: React.ReactNode;
  color: string;
  bgGrad: string;
  trend?: 'up' | 'down' | 'neutral';
}

/** Named thresholds for Indian numbering system */
const CRORE = 10_000_000;
const LAKH = 100_000;
const THOUSAND = 1_000;

/** Format large numbers with K/L/Cr suffixes for readability */
function formatAmount(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= CRORE) return `${sign}₹${(abs / CRORE).toFixed(2)}Cr`;
  if (abs >= LAKH) return `${sign}₹${(abs / LAKH).toFixed(2)}L`;
  if (abs >= THOUSAND) return `${sign}₹${(abs / THOUSAND).toFixed(1)}K`;
  return `${sign}₹${abs.toLocaleString()}`;
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
      color: '#818cf8',
      bgGrad: 'linear-gradient(135deg, rgba(129, 140, 248, 0.08), rgba(129, 140, 248, 0.02))',
      trend: 'neutral',
    },
    {
      label: 'Investments',
      value: formatAmount(totalInvestment),
      subValue: 'Total deployed',
      icon: <BarChart3 size={18} />,
      color: '#10b981',
      bgGrad: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.02))',
      trend: 'neutral',
    },
    {
      label: 'Unrealized P&L',
      value: `${totalUnrealizedPnl >= 0 ? '+' : ''}${formatAmount(totalUnrealizedPnl)}`,
      subValue: `${investmentPnlPercent >= 0 ? '+' : ''}${investmentPnlPercent.toFixed(2)}% overall`,
      icon: totalUnrealizedPnl >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />,
      color: totalUnrealizedPnl >= 0 ? '#34d399' : '#f87171',
      bgGrad:
        totalUnrealizedPnl >= 0
          ? 'linear-gradient(135deg, rgba(52, 211, 153, 0.08), rgba(52, 211, 153, 0.02))'
          : 'linear-gradient(135deg, rgba(248, 113, 113, 0.08), rgba(248, 113, 113, 0.02))',
      trend: totalUnrealizedPnl >= 0 ? 'up' : 'down',
    },
    {
      label: "Day's Change",
      value: `${stockDayChange >= 0 ? '+' : ''}${formatAmount(stockDayChange)}`,
      subValue: "Today's movement",
      icon: <TrendingUp size={18} />,
      color: stockDayChange >= 0 ? '#10b981' : '#ef4444',
      bgGrad:
        stockDayChange >= 0
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.02))'
          : 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.02))',
      trend: stockDayChange >= 0 ? 'up' : 'down',
    },
  ];

  const animationDelays = ['0s', '0.07s', '0.14s', '0.21s'];

  return (
    <section className="stats-grid">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className="fade-in premium-card"
          style={{
            animationDelay: animationDelays[idx] ?? '0s',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '160px',
          }}
        >
          <div>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: `${stat.color}15`,
                  color: stat.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${stat.color}20`,
                }}
              >
                {stat.icon}
              </div>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: '800',
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                {stat.label}
              </span>
            </div>
            <div
              className="stat-value"
              style={{
                fontSize: 'clamp(1.2rem, 4vw, 1.8rem)',
                color: '#ffffff',
                marginBottom: '4px',
              }}
            >
              {stat.value}
            </div>
          </div>

          {stat.subValue && (
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                color:
                  stat.trend === 'up'
                    ? 'var(--success)'
                    : stat.trend === 'down'
                      ? 'var(--error)'
                      : 'var(--text-tertiary)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: 'auto',
              }}
            >
              {stat.trend === 'up' && <span style={{ fontSize: '0.6rem' }}>▲</span>}
              {stat.trend === 'down' && <span style={{ fontSize: '0.6rem' }}>▼</span>}
              {stat.subValue}
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
