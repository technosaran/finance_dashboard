'use client';

import Link from 'next/link';
import { AlertCircle, CheckCircle2, Clock, Target } from 'lucide-react';

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
    <div className="glass-panel ios-section-card fade-in">
      <div className="ios-section-header">
        <div className="ios-section-title">
          <div
            className="ios-section-icon"
            style={{
              color: '#fbbf24',
              background: 'rgba(251, 191, 36, 0.14)',
              borderColor: 'rgba(251, 191, 36, 0.24)',
            }}
          >
            <Target size={18} />
          </div>
          <div>
            <div className="ios-section-label">Goals Tracker</div>
            <div className="ios-section-subtitle">Progress and deadlines in one glass panel</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="ios-badge">{goals.length} active</span>
          <Link href="/goals" className="ios-ghost-link">
            View all
          </Link>
        </div>
      </div>

      <div className="ios-list">
        {goals.map((goal) => {
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

          const accentColor = isAchieved ? '#8de7ca' : isOverdue ? '#fda4af' : '#fcd34d';
          const statusLabel = isAchieved
            ? 'Achieved'
            : isOverdue
              ? 'Overdue'
              : daysRemaining !== null
                ? `${daysRemaining}d left`
                : 'In progress';

          return (
            <div key={goal.name} className="ios-list-row" style={{ alignItems: 'stretch' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    marginBottom: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <div
                      className="ios-list-row__icon"
                      style={{
                        width: '34px',
                        height: '34px',
                        background: `${accentColor}22`,
                        borderColor: `${accentColor}33`,
                        color: accentColor,
                      }}
                    >
                      {isAchieved ? (
                        <CheckCircle2 size={16} />
                      ) : isOverdue ? (
                        <AlertCircle size={16} />
                      ) : isNearDeadline ? (
                        <Clock size={16} />
                      ) : (
                        <Target size={16} />
                      )}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div className="ios-list-row__title">{goal.name}</div>
                      <div className="ios-list-row__meta">
                        Rs {goal.current.toLocaleString('en-IN')} of Rs{' '}
                        {goal.target.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div className="ios-list-row__value" style={{ color: accentColor }}>
                      {goal.percentage.toFixed(0)}%
                    </div>
                    <div style={{ marginTop: '4px' }} className="ios-badge">
                      {statusLabel}
                    </div>
                  </div>
                </div>

                <div className="ios-progress-track">
                  <div
                    className="ios-progress-bar"
                    style={{
                      width: `${Math.min(goal.percentage, 100)}%`,
                      color: accentColor,
                      background: `linear-gradient(90deg, ${accentColor}, rgba(255,255,255,0.92))`,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
