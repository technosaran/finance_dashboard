'use client';

import { Target } from 'lucide-react';

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
      className="fade-in"
      style={{
        background: 'linear-gradient(145deg, #0f172a 0%, #0a0f1e 100%)',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.04)',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative radial glow */}
      <div
        style={{
          position: 'absolute',
          bottom: '-30px',
          right: '-30px',
          width: '120px',
          height: '120px',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.08), transparent)',
          filter: 'blur(30px)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: 'rgba(245, 158, 11, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f59e0b',
          }}
        >
          <Target size={16} />
        </div>
        <h3 style={{ fontSize: '0.95rem', fontWeight: '800', margin: 0, color: '#e2e8f0' }}>
          Goals Tracker
        </h3>
      </div>

      {/* Goals List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {goals.map((goal, idx) => {
          let daysRemaining: number | null = null;
          if (goal.deadline) {
            const deadline = new Date(goal.deadline);
            const today = new Date();
            daysRemaining = Math.ceil(
              (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );
          }
          return (
            <div key={idx}>
              {/* Name & percentage */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}
              >
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#e2e8f0' }}>
                  {goal.name}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    color: goal.percentage >= 100 ? '#10b981' : '#f59e0b',
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
                    width: `${goal.percentage}%`,
                    height: '100%',
                    background:
                      goal.percentage >= 100
                        ? 'linear-gradient(to right, #10b981, #34d399)'
                        : 'linear-gradient(to right, #f59e0b, #fbbf24)',
                    borderRadius: '100px',
                    transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: `0 0 8px ${goal.percentage >= 100 ? '#10b98140' : '#f59e0b40'}`,
                  }}
                />
              </div>

              {/* Amount labels + deadline */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '4px',
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
                      color:
                        goal.percentage >= 100
                          ? '#10b981'
                          : daysRemaining <= 0
                            ? '#ef4444'
                            : daysRemaining <= 30
                              ? '#f59e0b'
                              : '#64748b',
                    }}
                  >
                    {goal.percentage >= 100
                      ? '✓ Achieved'
                      : daysRemaining <= 0
                        ? 'Overdue'
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
