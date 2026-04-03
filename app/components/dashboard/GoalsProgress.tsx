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
    <div className="fade-in glass-panel panel-padded">
      {/* No decorative radial glow for ultra-dark look */}

      {/* Header */}
      <div className="gp-header">
        <div className="panel-icon-box">
          <Target size={16} />
        </div>
        <h3 className="gp-title">Goals Tracker</h3>
        <span className="gp-active-badge">{goals.length} active</span>
        <Link href="/goals" className="gp-view-all">
          View All
        </Link>
      </div>

      {/* Goals List */}
      <div className="gp-goals-list">
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
              <div className="goal-row-header">
                <div className="goal-name-cell">
                  {isAchieved ? (
                    <CheckCircle2 size={14} color="#10b981" />
                  ) : isOverdue ? (
                    <AlertCircle size={14} color="#ef4444" />
                  ) : isNearDeadline ? (
                    <Clock size={14} color="#f59e0b" />
                  ) : null}
                  <span
                    className={`goal-name ${isAchieved ? 'goal-name-achieved' : 'goal-name-default'}`}
                  >
                    {goal.name}
                  </span>
                </div>
                <span
                  className={`goal-pct ${isAchieved ? 'goal-pct-achieved' : isOverdue ? 'goal-pct-overdue' : 'goal-pct-default'}`}
                >
                  {goal.percentage.toFixed(0)}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="goal-bar-track">
                <div
                  className={`goal-bar-fill ${isAchieved ? 'goal-on-track' : isOverdue ? 'goal-behind' : 'goal-at-risk'}`}
                  style={{ width: `${Math.min(goal.percentage, 100)}%` }}
                />
              </div>

              {/* Amount labels + deadline */}
              <div className="goal-amounts-row">
                <span className="goal-amounts-text">
                  ₹{goal.current.toLocaleString()} / ₹{goal.target.toLocaleString()}
                </span>
                {daysRemaining !== null && (
                  <span
                    className={`goal-deadline-badge ${
                      isAchieved
                        ? 'goal-deadline-achieved'
                        : isOverdue
                          ? 'goal-deadline-overdue'
                          : isNearDeadline
                            ? 'goal-deadline-warning'
                            : 'goal-deadline-normal'
                    }`}
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
