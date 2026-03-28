'use client';

import { TrendingUp, TrendingDown, Zap, Award, Wallet, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
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
  investmentsTotal: number;
  allocationData: AllocationEntry[];
}

const CRORE = 10_000_000;
const LAKH = 100_000;
const THOUSAND = 1_000;

/** Format a rupee amount into a compact human-readable string using Indian numbering suffixes.
 *  Examples: 10000000 → ₹1.00Cr, 500000 → ₹5.00L, 1500 → ₹1.5K, 900 → ₹900
 */
function formatAmount(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= CRORE) return `${sign}₹${(abs / CRORE).toFixed(2)}Cr`;
  if (abs >= LAKH) return `${sign}₹${(abs / LAKH).toFixed(2)}L`;
  if (abs >= THOUSAND) return `${sign}₹${(abs / THOUSAND).toFixed(1)}K`;
  return `${sign}₹${abs.toLocaleString()}`;
}

/** Return the percentage share of a value relative to a total, formatted to one decimal place. */
function pctOf(value: number, total: number): string {
  return total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
}

export function NetWorthCard({
  totalNetWorth,
  globalLifetimeWealth,
  liquidityINR,
  investmentsTotal,
  allocationData,
}: NetWorthCardProps) {
  const lifetimePct = investmentsTotal > 0 ? (globalLifetimeWealth / investmentsTotal) * 100 : 0;
  const isPositive = globalLifetimeWealth >= 0;
  const pnlColor = isPositive ? '#10b981' : '#ef4444';
  const pnlBg = isPositive ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)';
  const pnlBorder = isPositive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';

  return (
    <section className="wealth-card fade-in" style={{ marginBottom: '24px' }}>
      <div
        className="premium-card"
        style={{ padding: '28px 32px', background: '#000', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="wealth-card-inner">
          {/* Left: Net Worth Summary */}
          <div className="wealth-section">
            {/* Header row */}
            <div className="badge-wrapper" style={{ marginBottom: '20px' }}>
              <div
                className="icon-badge"
                style={{
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: '#818cf8',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  boxShadow: 'none',
                }}
              >
                <Zap size={18} />
              </div>
              <span
                className="stat-label"
                style={{ fontSize: '0.75rem', color: '#64748b', letterSpacing: '0.12em' }}
              >
                TOTAL NET WORTH
              </span>
              {investmentsTotal > 0 && (
                <div
                  style={{
                    marginLeft: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    background: 'rgba(167, 139, 250, 0.1)',
                    border: '1px solid rgba(167, 139, 250, 0.2)',
                  }}
                >
                  <Award size={11} color="#a78bfa" />
                  <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#a78bfa' }}>
                    {lifetimePct >= 0 ? '+' : ''}
                    {lifetimePct.toFixed(1)}% lifetime
                  </span>
                </div>
              )}
            </div>

            {/* Main Value */}
            <div style={{ marginBottom: '24px' }}>
              <div
                className="stat-value"
                style={{
                  fontSize: 'clamp(2.2rem, 6vw, 3.75rem)',
                  lineHeight: 1.05,
                  marginBottom: '14px',
                  letterSpacing: '-0.03em',
                }}
              >
                {formatAmount(totalNetWorth)}
              </div>

              {/* Lifetime P&L badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '6px 14px',
                  borderRadius: '10px',
                  background: pnlBg,
                  border: `1px solid ${pnlBorder}`,
                  color: pnlColor,
                  fontSize: '0.82rem',
                  fontWeight: '800',
                }}
              >
                {isPositive ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                {isPositive ? '+' : ''}
                {formatAmount(globalLifetimeWealth)} lifetime
              </div>
            </div>

            {/* Sub-metrics */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                gap: '12px',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                paddingTop: '20px',
              }}
            >
              {/* Liquid Cash */}
              <div
                style={{
                  background: 'rgba(129, 140, 248, 0.06)',
                  border: '1px solid rgba(129, 140, 248, 0.15)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '8px',
                  }}
                >
                  <Wallet size={13} color="#818cf8" />
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: '800',
                      color: '#818cf8',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    Liquid Cash
                  </span>
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#fff' }}>
                  {formatAmount(liquidityINR)}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: '3px' }}>
                  {totalNetWorth > 0
                    ? `${((liquidityINR / totalNetWorth) * 100).toFixed(1)}% of portfolio`
                    : 'Available balance'}
                </div>
              </div>

              {/* Investments */}
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.06)',
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '8px',
                  }}
                >
                  <BarChart3 size={13} color="#10b981" />
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: '800',
                      color: '#10b981',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    Investments
                  </span>
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#fff' }}>
                  {formatAmount(investmentsTotal)}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: '3px' }}>
                  {totalNetWorth > 0
                    ? `${((investmentsTotal / totalNetWorth) * 100).toFixed(1)}% of portfolio`
                    : 'Total deployed'}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Asset Allocation */}
          <div
            style={{
              flex: '1 1 280px',
              minWidth: '0',
              maxWidth: '400px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Section header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              <PieChartIcon size={14} color="#64748b" />
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                }}
              >
                Asset Allocation
              </span>
            </div>

            {allocationData.length > 0 ? (
              <>
                {/* Donut chart with center label */}
                <div
                  style={{
                    width: '100%',
                    height: '200px',
                    position: 'relative',
                    marginBottom: '20px',
                  }}
                >
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
                          background: 'rgba(0, 0, 0, 0.95)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '12px',
                          backdropFilter: 'blur(10px)',
                          padding: '10px 14px',
                        }}
                        itemStyle={{ color: '#fff', fontWeight: '700', fontSize: '0.82rem' }}
                        labelStyle={{ display: 'none' }}
                        formatter={(val, _name, props) => [
                          `${formatAmount(Number(val))} · ${pctOf(Number(val), totalNetWorth)}%`,
                          props.payload?.name ?? '',
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Center label overlay */}
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
                    <div style={{ fontSize: '0.6rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                      Total
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '900', color: '#fff', letterSpacing: '-0.02em' }}>
                      {formatAmount(totalNetWorth)}
                    </div>
                  </div>
                </div>

                {/* Legend with progress bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {allocationData.map((item, idx) => {
                    const pct = totalNetWorth > 0 ? (item.value / totalNetWorth) * 100 : 0;
                    return (
                      <div key={idx}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '5px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                            <span
                              style={{
                                fontSize: '0.78rem',
                                fontWeight: '700',
                                color: '#94a3b8',
                              }}
                            >
                              {item.name}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span
                              style={{
                                fontSize: '0.78rem',
                                fontWeight: '700',
                                color: '#64748b',
                              }}
                            >
                              {formatAmount(item.value)}
                            </span>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: '900',
                                color: item.color,
                                minWidth: '36px',
                                textAlign: 'right',
                              }}
                            >
                              {pct.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div
                          style={{
                            height: '3px',
                            borderRadius: '99px',
                            background: 'rgba(255,255,255,0.05)',
                            overflow: 'hidden',
                          }}
                        >
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
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  padding: '32px 0',
                  color: '#334155',
                  textAlign: 'center',
                }}
              >
                <PieChartIcon size={36} color="#1e293b" />
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
