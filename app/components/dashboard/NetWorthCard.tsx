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
import { MoneyValue } from '@/app/components/ui/MoneyValue';
import { InfoHint } from '@/app/components/ui/InfoHint';

interface AllocationEntry {
  name: string;
  value: number;
  color: string;
}

interface NetWorthCardProps {
  totalNetWorth: number;
  realizedPnl: number;
  liquidityINR: number;
  investmentsTotal: number;
  allocationData: AllocationEntry[];
  compactNumbers?: boolean;
}

function pctOf(value: number, total: number): string {
  return total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
}

export function NetWorthCard({
  totalNetWorth,
  realizedPnl,
  liquidityINR,
  investmentsTotal,
  allocationData,
  compactNumbers = false,
}: NetWorthCardProps) {
  const realizedPct = investmentsTotal > 0 ? (realizedPnl / investmentsTotal) * 100 : 0;
  const isPositive = realizedPnl >= 0;
  const pnlColor = isPositive ? '#20b072' : '#ef5d5d';
  const pnlBg = isPositive ? 'rgba(32, 176, 114, 0.12)' : 'rgba(239, 93, 93, 0.12)';
  const pnlBorder = isPositive ? 'rgba(32, 176, 114, 0.22)' : 'rgba(239, 93, 93, 0.22)';

  return (
    <section className="wealth-card fade-in" style={{ marginBottom: '24px' }}>
      <div className="premium-card" style={{ padding: '28px 32px' }}>
        <div className="wealth-card-inner">
          <div className="wealth-section">
            <div className="badge-wrapper" style={{ marginBottom: '20px' }}>
              <div
                className="icon-badge"
                style={{
                  background: 'rgba(30, 166, 114, 0.14)',
                  color: '#43c08a',
                  border: '1px solid rgba(67, 192, 138, 0.22)',
                  boxShadow: 'none',
                }}
              >
                <Zap size={18} />
              </div>
              <span
                className="stat-label"
                style={{ fontSize: '0.75rem', color: '#6f8480', letterSpacing: '0.12em' }}
              >
                <InfoHint
                  label="Total net worth"
                  description="Cash plus current market value of tracked investments."
                />
              </span>
              {investmentsTotal > 0 ? (
                <div
                  style={{
                    marginLeft: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    background: pnlBg,
                    border: `1px solid ${pnlBorder}`,
                    color: pnlColor,
                    fontSize: '0.7rem',
                    fontWeight: '800',
                  }}
                  title="Realized P&L is profit or loss already locked in from completed trades and closed positions."
                >
                  {realizedPct >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {realizedPct >= 0 ? '+' : ''}
                  {realizedPct.toFixed(1)}% realized
                </div>
              ) : null}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div
                className="stat-value table-nums"
                style={{
                  fontSize: 'clamp(2.2rem, 6vw, 3.75rem)',
                  lineHeight: 1.05,
                  marginBottom: '14px',
                  letterSpacing: '-0.03em',
                }}
              >
                <MoneyValue amount={totalNetWorth} compact={compactNumbers} />
              </div>

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
                title="Realized P&L is profit or loss already locked in from completed trades and closed positions."
              >
                {isPositive ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                <InfoHint
                  label="Realized P&L"
                  description="Profit or loss already locked in from completed trades and closed positions."
                />
                <MoneyValue amount={realizedPnl} compact={compactNumbers} showSign={isPositive} />
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                gap: '12px',
                borderTop: '1px solid rgba(160, 188, 180, 0.12)',
                paddingTop: '20px',
              }}
            >
              <div
                style={{
                  background: 'rgba(107, 185, 157, 0.08)',
                  border: '1px solid rgba(107, 185, 157, 0.16)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}
                >
                  <Wallet size={13} color="#6bb99d" />
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: '800',
                      color: '#6bb99d',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    Cash
                  </span>
                </div>
                <div
                  className="table-nums"
                  style={{ fontSize: '1.1rem', fontWeight: '900', color: '#fff' }}
                >
                  <MoneyValue amount={liquidityINR} compact={compactNumbers} />
                </div>
                <div style={{ fontSize: '0.68rem', color: '#6f8480', marginTop: '3px' }}>
                  {totalNetWorth > 0
                    ? `${((liquidityINR / totalNetWorth) * 100).toFixed(1)}% of net worth`
                    : 'Available balance'}
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(32, 176, 114, 0.08)',
                  border: '1px solid rgba(32, 176, 114, 0.16)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}
                >
                  <BarChart3 size={13} color="#20b072" />
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: '800',
                      color: '#20b072',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    Investments
                  </span>
                </div>
                <div
                  className="table-nums"
                  style={{ fontSize: '1.1rem', fontWeight: '900', color: '#fff' }}
                >
                  <MoneyValue amount={investmentsTotal} compact={compactNumbers} />
                </div>
                <div style={{ fontSize: '0.68rem', color: '#6f8480', marginTop: '3px' }}>
                  {totalNetWorth > 0
                    ? `${((investmentsTotal / totalNetWorth) * 100).toFixed(1)}% of net worth`
                    : 'Total deployed'}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              flex: '1 1 280px',
              minWidth: '0',
              maxWidth: '400px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              <PieChartIcon size={14} color="#6f8480" />
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  color: '#6f8480',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                }}
              >
                Asset allocation
              </span>
            </div>

            {allocationData.length > 0 ? (
              <>
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
                            key={index}
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
                          `${new Intl.NumberFormat('en-IN', {
                            style: 'currency',
                            currency: 'INR',
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(Number(value))} | ${pctOf(Number(value), totalNetWorth)}%`,
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
                        fontSize: '0.6rem',
                        fontWeight: '800',
                        color: '#6f8480',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        marginBottom: '4px',
                      }}
                    >
                      Total
                    </div>
                    <div
                      className="table-nums"
                      style={{ fontSize: '0.95rem', fontWeight: '900', color: '#fff' }}
                    >
                      <MoneyValue amount={totalNetWorth} compact={compactNumbers} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {allocationData.map((item, index) => {
                    const pct = totalNetWorth > 0 ? (item.value / totalNetWorth) * 100 : 0;

                    return (
                      <div key={index}>
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
                              style={{ fontSize: '0.78rem', fontWeight: '700', color: '#9aaea9' }}
                            >
                              {item.name}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span
                              className="table-nums"
                              style={{ fontSize: '0.78rem', fontWeight: '700', color: '#6f8480' }}
                            >
                              <MoneyValue amount={item.value} compact={compactNumbers} />
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
                  color: '#566a66',
                  textAlign: 'center',
                }}
              >
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
