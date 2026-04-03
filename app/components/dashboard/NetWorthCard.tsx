'use client';

import {
  TrendingUp,
  TrendingDown,
  Zap,
  Wallet,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface AllocationEntry {
  name: string;
  value: number;
  color: string;
}

interface NetWorthCardProps {
  totalNetWorth: number;
  globalLifetimeWealth: number;
  liquidityINR: number;
  totalInvestment: number;
  investmentsTotal: number;
  allocationData: AllocationEntry[];
}

const CRORE = 10_000_000;
const LAKH = 100_000;
const THOUSAND = 1_000;

function formatAmount(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (abs >= CRORE) return `${sign}₹${(abs / CRORE).toFixed(2)}Cr`;
  if (abs >= LAKH) return `${sign}₹${(abs / LAKH).toFixed(2)}L`;
  if (abs >= THOUSAND) return `${sign}₹${(abs / THOUSAND).toFixed(1)}K`;

  return `${sign}₹${abs.toLocaleString()}`;
}

function pctOf(value: number, total: number): string {
  return total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
}

export function NetWorthCard({
  totalNetWorth,
  globalLifetimeWealth,
  liquidityINR,
  totalInvestment,
  investmentsTotal,
  allocationData,
}: NetWorthCardProps) {
  const lifetimePct = totalInvestment > 0 ? (globalLifetimeWealth / totalInvestment) * 100 : 0;
  const isPositive = globalLifetimeWealth >= 0;
  const pnlColor = isPositive ? '#20b072' : '#ef5d5d';
  const pnlBg = isPositive ? 'rgba(32, 176, 114, 0.12)' : 'rgba(239, 93, 93, 0.12)';
  const pnlBorder = isPositive ? 'rgba(32, 176, 114, 0.22)' : 'rgba(239, 93, 93, 0.22)';

  return (
    <section className="wealth-card fade-in" style={{ marginBottom: '24px' }}>
      <div className="premium-card" style={{ padding: '28px 32px' }}>
        <div className="wealth-card-inner" style={{ gap: '32px' }}>
          <div className="wealth-section" style={{ flex: '1 1 320px', minWidth: 0 }}>
            <div className="badge-wrapper" style={{ marginBottom: '20px' }}>
              <span className="stat-label nw-section-label">TOTAL NET WORTH</span>
              {investmentsTotal > 0 && (
                <div className="nw-lifetime-badge">
                  {lifetimePct >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {lifetimePct >= 0 ? '+' : ''}
                  {lifetimePct.toFixed(1)}% lifetime
                </div>
              )}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div className="stat-value nw-worth-value">{formatAmount(totalNetWorth)}</div>

              <div
                className="nw-pnl-badge"
                style={{ background: pnlBg, border: `1px solid ${pnlBorder}`, color: pnlColor }}
              >
                {isPositive ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                {isPositive ? '+' : ''}
                {formatAmount(globalLifetimeWealth)} lifetime
              </div>
            </div>

            <div className="nw-metrics-grid">
              <div className="nw-cash-card">
                <div className="nw-icon-row">
                  <Wallet size={13} color="#10b981" />
                  <span className="nw-cash-label">Cash</span>
                </div>
                <div className="nw-metric-value">{formatAmount(liquidityINR)}</div>
                <div className="nw-metric-sub">
                  {totalNetWorth > 0
                    ? `${((liquidityINR / totalNetWorth) * 100).toFixed(1)}% of net worth`
                    : 'Available balance'}
                </div>
              </div>

              <div className="nw-invest-card">
                <div className="nw-icon-row">
                  <BarChart3 size={13} color="#3b82f6" />
                  <span className="nw-invest-label">Investments</span>
                </div>
                <div className="nw-metric-value">{formatAmount(investmentsTotal)}</div>
                <div className="nw-metric-sub">
                  {totalNetWorth > 0
                    ? `${((investmentsTotal / totalNetWorth) * 100).toFixed(1)}% of net worth`
                    : 'Total deployed'}
                </div>
              </div>
            </div>
          </div>

          <div className="nw-chart-section">
            <div className="nw-chart-header">
              <PieChartIcon size={14} color="#6f8480" />
              <span className="nw-chart-label">Asset allocation</span>
            </div>

            {allocationData.length > 0 ? (
              <>
                <div className="nw-chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={allocationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={80}
                        paddingAngle={6}
                        dataKey="value"
                        stroke="none"
                      >
                        {allocationData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            style={{ filter: `drop-shadow(0 0 6px ${entry.color}44)` }}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(7, 16, 24, 0.95)',
                          border: '1px solid rgba(160, 188, 180, 0.14)',
                          borderRadius: '12px',
                          backdropFilter: 'blur(10px)',
                          padding: '10px 14px',
                        }}
                        itemStyle={{ color: '#fff', fontWeight: '700', fontSize: '0.82rem' }}
                        labelStyle={{ display: 'none' }}
                        formatter={(value, _name, props) => [
                          `${formatAmount(Number(value))} | ${pctOf(Number(value), totalNetWorth)}%`,
                          props.payload?.name ?? '',
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="nw-chart-center">
                    <div className="nw-center-title">Total</div>
                    <div className="nw-center-value">{formatAmount(totalNetWorth)}</div>
                  </div>
                </div>

                <div className="nw-alloc-list">
                  {allocationData.map((item, idx) => {
                    const pct = totalNetWorth > 0 ? (item.value / totalNetWorth) * 100 : 0;

                    return (
                      <div key={idx}>
                        <div className="nw-alloc-row-header">
                          <div className="nw-alloc-name-cell">
                            <div
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: item.color,
                                flexShrink: 0,
                                boxShadow: `0 0 6px ${item.color}88`,
                              }}
                            />
                            <span className="nw-alloc-name">{item.name}</span>
                          </div>
                          <div className="nw-alloc-values-cell">
                            <span className="nw-alloc-amount">{formatAmount(item.value)}</span>
                            <span className="nw-alloc-pct" style={{ color: item.color }}>
                              {pct.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="nw-alloc-bar-track">
                          <div
                            style={{
                              height: '100%',
                              width: `${pct}%`,
                              borderRadius: '99px',
                              background: item.color,
                              boxShadow: `0 0 6px ${item.color}66`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="nw-empty-state">
                <PieChartIcon size={36} color="#35514e" />
                <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>
                  No allocation data yet
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
