'use client';

import { TrendingUp, TrendingDown, Zap, Award } from 'lucide-react';
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

export function NetWorthCard({
  totalNetWorth,
  globalLifetimeWealth,
  liquidityINR,
  investmentsTotal,
  allocationData,
}: NetWorthCardProps) {
  const lifetimePct = investmentsTotal > 0 ? (globalLifetimeWealth / investmentsTotal) * 100 : 0;

  return (
    <section className="wealth-card fade-in" style={{ marginBottom: '24px' }}>
      <div className="premium-card" style={{ padding: '0' }}>
        {/* No decorative glow for ultra-dark look */}

        <div
          className="wealth-card-inner"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '32px',
            padding: '32px',
            alignItems: 'center',
          }}
        >
          <div
            className="wealth-section"
            style={{
              flex: '2 1 400px',
              minWidth: '0',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '28px',
                flexWrap: 'wrap',
              }}
            >
              <div
                className="icon-badge"
                style={{
                  width: '40px',
                  height: '40px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Zap size={20} />
              </div>
              <span
                className="stat-label"
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-tertiary)',
                  letterSpacing: '0.12em',
                  fontWeight: '800',
                }}
              >
                TOTAL NET WORTH
              </span>
              {investmentsTotal > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    background: 'rgba(167, 139, 250, 0.12)',
                    border: '1px solid rgba(167, 139, 250, 0.25)',
                    marginLeft: 'auto',
                  }}
                >
                  <Award size={14} color="#a78bfa" />
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: '800',
                      color: '#a78bfa',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {lifetimePct >= 0 ? '+' : ''}
                    {lifetimePct.toFixed(1)}% performance
                  </span>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '40px' }}>
              <div
                className="stat-value"
                style={{
                  fontSize: 'clamp(2.4rem, 8vw, 4.4rem)',
                  lineHeight: 1,
                  marginBottom: '16px',
                  color: '#ffffff',
                  wordBreak: 'break-word',
                }}
              >
                ₹{totalNetWorth.toLocaleString()}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  {globalLifetimeWealth >= 0 ? (
                    <TrendingUp size={16} color="var(--success)" />
                  ) : (
                    <TrendingDown size={16} color="var(--error)" />
                  )}{' '}
                  {globalLifetimeWealth >= 0 ? (
                    <span style={{ color: 'var(--success)' }}>Profit</span>
                  ) : (
                    <span style={{ color: 'var(--error)' }}>Loss</span>
                  )}
                  <div
                    style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.1)' }}
                  />
                  {globalLifetimeWealth >= 0 ? '+' : '-'}₹
                  {Math.abs(globalLifetimeWealth).toLocaleString()}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '24px',
                padding: '24px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    color: '#475569',
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                    letterSpacing: '0.05em',
                  }}
                >
                  Liquid Cash
                </div>
                <div
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: '900',
                    color: '#fff',
                    letterSpacing: '-0.5px',
                  }}
                >
                  ₹{liquidityINR.toLocaleString()}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    color: '#475569',
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                    letterSpacing: '0.05em',
                  }}
                >
                  Investments
                </div>
                <div
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: '900',
                    color: '#fff',
                    letterSpacing: '-0.5px',
                  }}
                >
                  ₹{investmentsTotal.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Asset Allocation Donut Chart */}
          <div
            style={{
              flex: '1 1 300px',
              minWidth: '280px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '220px',
                position: 'relative',
                marginBottom: '16px',
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {allocationData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        style={{ filter: `drop-shadow(0 0 8px ${entry.color}33)` }}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(0, 0, 0, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '16px',
                      backdropFilter: 'blur(10px)',
                    }}
                    itemStyle={{ color: '#fff', fontWeight: '700' }}
                    labelStyle={{ display: 'none' }}
                    formatter={(val) => [`₹${(Number(val) || 0).toLocaleString()}`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div
              style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px' }}
            >
              {allocationData.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'var(--glass)',
                    padding: '6px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--glass-border)',
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: item.color,
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {item.name}
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '900',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {totalNetWorth > 0 ? ((item.value / totalNetWorth) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
