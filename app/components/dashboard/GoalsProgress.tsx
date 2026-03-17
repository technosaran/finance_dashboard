'use client';

import Link from 'next/link';
import { Target, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface GoalProgress {
  name: string;
  target: number;
  current: number;
  percentage: number;
  deadline?: string;
}

interface GoalsProgressProps {
  goals: GoalProgress[];
}

export function GoalsProgress({ goals }: GoalsProgressProps) {
  if (goals.length === 0) return null;

  return (
    <div
      className="fade-in glass-panel"
      style={{
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* No decorative radial glow for ultra-dark look */}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '4px',
            background: 'rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
          }}
        >
          <Target size={16} />
        </div>
        <h3 style={{ fontSize: '0.95rem', fontWeight: '800', margin: 0, color: '#e2e8f0' }}>
          Goals Tracker
        </h3>
        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: '800',
            color: '#f59e0b',
            background: 'rgba(245, 158, 11, 0.1)',
            padding: '2px 8px',
            borderRadius: '6px',
            border: '1px solid rgba(245, 158, 11, 0.15)',
          }}
        >
          {goals.length} active
        </span>
        <Link
          href="/goals"
          className="view-all-link"
          style={{
            marginLeft: 'auto',
            color: '#ffffff',
            textDecoration: 'none',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'transparent',
            borderRadius: '4px',
            padding: '4px 10px',
            fontSize: '0.72rem',
            fontWeight: '700',
          }}
        >
          View All
        </Link>
      </div>

      {/* Goals List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {goals.map((goal, idx) => {
          let daysRemaining: number | null = null;
          if (goal.deadline) {
            const deadline = new Date(goal.deadline);
            const today = new Date();
            daysRemaining = Math.ceil(
              (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );
          }
          const isAchieved = goal.percentage >= 100;
          const isOverdue = daysRemaining !== null && daysRemaining <= 0 && !isAchieved;
          const isNearDeadline =
            daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 30 && !isAchieved;

          return (
            <div key={idx}>
              {/* Name & status */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {isAchieved ? (
                    <CheckCircle2 size={14} color="#10b981" />
                  ) : isOverdue ? (
                    <AlertCircle size={14} color="#ef4444" />
                  ) : isNearDeadline ? (
                    <Clock size={14} color="#f59e0b" />
                  ) : null}
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      color: isAchieved ? '#10b981' : '#e2e8f0',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {goal.name}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '900',
                    color: isAchieved ? '#10b981' : isOverdue ? '#ef4444' : '#f59e0b',
                    flexShrink: 0,
                  }}
                >
                  {goal.percentage.toFixed(0)}%
                </span>
              </div>

              {/* Progress bar */}
              <div
                style={{
                  width: '100%',
                  height: '6px',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: '100px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.min(goal.percentage, 100)}%`,
                    height: '100%',
                    background: isAchieved
                      ? 'linear-gradient(to right, #10b981, #34d399)'
                      : isOverdue
                        ? 'linear-gradient(to right, #ef4444, #f87171)'
                        : 'linear-gradient(to right, #f59e0b, #fbbf24)',
                    borderRadius: '100px',
                    transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: `0 0 8px ${isAchieved ? '#10b98140' : isOverdue ? '#ef444440' : '#f59e0b40'}`,
                  }}
                />
              </div>

              {/* Amount labels + deadline */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '5px',
                }}
              >
                <span style={{ fontSize: '0.65rem', color: '#475569' }}>
                  ₹{goal.current.toLocaleString()} / ₹{goal.target.toLocaleString()}
                </span>
                {daysRemaining !== null && (
                  <span
                    style={{
                      fontSize: '0.6rem',
                      fontWeight: '700',
                      color: isAchieved
                        ? '#10b981'
                        : isOverdue
                          ? '#ef4444'
                          : isNearDeadline
                            ? '#f59e0b'
                            : '#64748b',
                      background: isAchieved
                        ? 'rgba(16, 185, 129, 0.08)'
                        : isOverdue
                          ? 'rgba(239, 68, 68, 0.08)'
                          : isNearDeadline
                            ? 'rgba(245, 158, 11, 0.08)'
                            : 'transparent',
                      padding: isAchieved || isOverdue || isNearDeadline ? '2px 6px' : undefined,
                      borderRadius: '4px',
                    }}
                  >
                    {isAchieved
                      ? '✓ Achieved'
                      : isOverdue
                        ? 'Overdue'
                        : isNearDeadline
                          ? `${daysRemaining}d left!`
                          : `${daysRemaining}d left`}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
