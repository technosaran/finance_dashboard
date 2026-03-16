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

        <div className="wealth-card-inner">
          {/* Left: Net Worth Summary */}
          <div className="wealth-section">
            <div className="badge-wrapper" style={{ marginBottom: '24px' }}>
              <div
                className="icon-badge"
                style={{
                  background: '#ffffff',
                  color: '#000000',
                  boxShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
                }}
              >
                <Zap size={20} />
              </div>
              <span
                className="stat-label"
                style={{ fontSize: '0.85rem', color: '#94a3b8', letterSpacing: '0.1em' }}
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
                    borderRadius: '8px',
                    background: 'rgba(167, 139, 250, 0.1)',
                    border: '1px solid rgba(167, 139, 250, 0.2)',
                  }}
                >
                  <Award size={12} color="#a78bfa" />
                  <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#a78bfa' }}>
                    {lifetimePct >= 0 ? '+' : ''}
                    {lifetimePct.toFixed(1)}% lifetime
                  </span>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '32px' }}>
              <div
                className="stat-value"
                style={{
                  fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
                  lineHeight: 1,
                  marginBottom: '16px',
                }}
              >
                ₹{totalNetWorth.toLocaleString()}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    border: '1.5px solid #ffffff',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {globalLifetimeWealth >= 0 ? (
                    <TrendingUp size={16} />
                  ) : (
                    <TrendingDown size={16} />
                  )}{' '}
                  {globalLifetimeWealth >= 0 ? '+' : '-'}₹
                  {Math.abs(globalLifetimeWealth).toLocaleString()} lifetime
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                gap: '24px',
                borderTop: '2px solid #ffffff',
                paddingTop: '24px',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    color: '#475569',
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                  }}
                >
                  Liquid Cash
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#fff' }}>
                  ₹{liquidityINR.toLocaleString()}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    color: '#475569',
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                  }}
                >
                  Investments
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#fff' }}>
                  ₹{investmentsTotal.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Asset Allocation Donut Chart */}
          <div
            style={{
              flex: '1 1 280px',
              minWidth: '0',
              maxWidth: '400px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
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
                      background: 'rgba(2, 6, 23, 0.95)',
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
