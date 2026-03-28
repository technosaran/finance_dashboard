'use client';

import {
  Award,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface AllocationEntry {
  name: string;
  value: number;
  color: string;
}

interface NetWorthCardProps {
  totalNetWorth: number;
  trackedProfit: number;
  liquidityINR: number;
  investmentsTotal: number;
  allocationData: AllocationEntry[];
  moneyWeightedReturn: number | null;
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

function pctOf(value: number, total: number): string {
  return total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
}

export function NetWorthCard({
  totalNetWorth,
  trackedProfit,
  liquidityINR,
  investmentsTotal,
  allocationData,
  moneyWeightedReturn,
}: NetWorthCardProps) {
  const isPositive = trackedProfit >= 0;
  const pnlColor = isPositive ? '#8de7ca' : '#fda4af';
  const pnlBg = isPositive ? 'rgba(110, 231, 183, 0.12)' : 'rgba(253, 164, 175, 0.12)';
  const pnlBorder = isPositive ? 'rgba(110, 231, 183, 0.2)' : 'rgba(253, 164, 175, 0.2)';

  return (
    <section className="premium-card ios-section-card fade-in">
      <div className="ios-networth-shell">
        <div style={{ minWidth: 0 }}>
          <div className="ios-section-header" style={{ marginBottom: '20px' }}>
            <div className="ios-section-title">
              <div
                className="ios-section-icon"
                style={{
                  color: '#89dbff',
                  background: 'rgba(137, 219, 255, 0.14)',
                  borderColor: 'rgba(137, 219, 255, 0.24)',
                }}
              >
                <Zap size={18} />
              </div>
              <div>
                <div className="ios-section-label">Total Net Worth</div>
                <div className="ios-section-subtitle">
                  Cash, market value, and long-term progress
                </div>
              </div>
            </div>

            {investmentsTotal > 0 && moneyWeightedReturn !== null && (
              <div className="ios-badge">
                <Award size={13} color="#d8cdff" />
                {moneyWeightedReturn >= 0 ? '+' : ''}
                {(moneyWeightedReturn * 100).toFixed(1)}% money-weighted
              </div>
            )}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div
              className="stat-value"
              style={{
                fontSize: 'clamp(2.6rem, 6vw, 4.5rem)',
                lineHeight: 0.98,
                marginBottom: '14px',
                letterSpacing: '-0.06em',
              }}
            >
              {formatAmount(totalNetWorth)}
            </div>

            <div
              className="ios-badge"
              style={{
                width: 'fit-content',
                padding: '9px 14px',
                background: pnlBg,
                borderColor: pnlBorder,
                color: pnlColor,
              }}
            >
              {isPositive ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
              {isPositive ? '+' : ''}
              {formatAmount(trackedProfit)} tracked profit
            </div>
          </div>

          <div className="ios-summary-grid">
            <div className="ios-metric-card">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '10px',
                  color: '#89dbff',
                }}
              >
                <Wallet size={14} />
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  Liquid Cash
                </span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#ffffff' }}>
                {formatAmount(liquidityINR)}
              </div>
              <div
                style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '6px' }}
              >
                {totalNetWorth > 0
                  ? `${((liquidityINR / totalNetWorth) * 100).toFixed(1)}% of current net worth`
                  : 'Available balance'}
              </div>
            </div>

            <div className="ios-metric-card">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '10px',
                  color: '#8de7ca',
                }}
              >
                <BarChart3 size={14} />
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  Investments
                </span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#ffffff' }}>
                {formatAmount(investmentsTotal)}
              </div>
              <div
                style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '6px' }}
              >
                {totalNetWorth > 0
                  ? `${((investmentsTotal / totalNetWorth) * 100).toFixed(1)}% of current net worth`
                  : 'Capital deployed'}
              </div>
            </div>
          </div>
        </div>

        <div style={{ minWidth: 0 }}>
          <div className="ios-section-header" style={{ marginBottom: '18px' }}>
            <div className="ios-section-title">
              <div
                className="ios-section-icon"
                style={{
                  color: '#d8cdff',
                  background: 'rgba(216, 205, 255, 0.14)',
                  borderColor: 'rgba(216, 205, 255, 0.24)',
                }}
              >
                <PieChartIcon size={18} />
              </div>
              <div>
                <div className="ios-section-label">Asset Allocation</div>
                <div className="ios-section-subtitle">Live mix across your tracked instruments</div>
              </div>
            </div>
          </div>

          {allocationData.length > 0 ? (
            <>
              <div
                style={{
                  width: '100%',
                  height: '230px',
                  position: 'relative',
                  marginBottom: '18px',
                  borderRadius: '26px',
                  background: 'rgba(255, 255, 255, 0.07)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={88}
                      paddingAngle={6}
                      dataKey="value"
                      stroke="none"
                    >
                      {allocationData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={entry.color}
                          style={{ filter: `drop-shadow(0 0 8px ${entry.color}66)` }}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(14, 24, 40, 0.86)',
                        border: '1px solid rgba(255,255,255,0.14)',
                        borderRadius: '18px',
                        backdropFilter: 'blur(18px)',
                        color: '#ffffff',
                        padding: '10px 12px',
                      }}
                      itemStyle={{ color: '#ffffff', fontWeight: '700', fontSize: '0.82rem' }}
                      labelStyle={{ display: 'none' }}
                      formatter={(value, _name, props) => [
                        `${formatAmount(Number(value))} | ${pctOf(Number(value), totalNetWorth)}%`,
                        props.payload?.name ?? '',
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: '800',
                      color: 'var(--text-tertiary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: '6px',
                    }}
                  >
                    Total
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: '900', color: '#ffffff' }}>
                    {formatAmount(totalNetWorth)}
                  </div>
                </div>
              </div>

              <div className="ios-list">
                {allocationData.map((item) => {
                  const percentage = totalNetWorth > 0 ? (item.value / totalNetWorth) * 100 : 0;

                  return (
                    <div key={item.name} className="ios-list-row">
                      <div className="ios-list-row__main">
                        <div
                          className="ios-list-row__icon"
                          style={{
                            background: `${item.color}20`,
                            borderColor: `${item.color}30`,
                          }}
                        >
                          <div
                            style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '999px',
                              background: item.color,
                              boxShadow: `0 0 12px ${item.color}`,
                            }}
                          />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className="ios-list-row__title">{item.name}</div>
                          <div className="ios-progress-track" style={{ marginTop: '10px' }}>
                            <div
                              className="ios-progress-bar"
                              style={{
                                width: `${percentage}%`,
                                color: item.color,
                                background: item.color,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="ios-list-row__value">{formatAmount(item.value)}</div>
                        <div
                          style={{
                            marginTop: '4px',
                            color: item.color,
                            fontSize: '0.78rem',
                            fontWeight: '800',
                            textAlign: 'right',
                          }}
                        >
                          {percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div
              className="ios-metric-card"
              style={{ minHeight: '230px', display: 'grid', placeItems: 'center' }}
            >
              <div style={{ textAlign: 'center' }}>
                <PieChartIcon size={34} color="rgba(220, 232, 246, 0.4)" />
                <div
                  style={{ marginTop: '12px', color: 'var(--text-secondary)', fontWeight: '700' }}
                >
                  No allocation data yet
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
