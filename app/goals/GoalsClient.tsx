'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Plus, X, Trash2, Edit3, CheckCircle2, Clock, Download, Target } from 'lucide-react';
import { useNotifications } from '../components/NotificationContext';
import { useLedger, useSettings } from '../components/FinanceContext';
import { Goal } from '@/lib/types';
import { exportGoalsToCSV } from '../../lib/utils/export';
import { MoneyValue } from '@/app/components/ui/MoneyValue';
import { PageSkeleton, PageState } from '@/app/components/ui/PageState';
import { formatDate, formatDateTime } from '@/lib/utils/format';

const GOAL_CATEGORIES = [
  'Savings',
  'Retirement',
  'Home',
  'Education',
  'Vacation',
  'Emergency Fund',
  'Investment',
  'Other',
];

function getGoalStatus(goal: Goal) {
  const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;

  if (progress >= 100) {
    return { label: 'Completed', color: '#2bd576', icon: <CheckCircle2 size={14} /> };
  }

  if (goal.deadline && new Date(goal.deadline) < new Date()) {
    return { label: 'Past deadline', color: '#ff4d6d', icon: <Clock size={14} /> };
  }

  return { label: 'In progress', color: '#6aa6ff', icon: <Target size={14} /> };
}

export default function GoalsClient() {
  const { goals, addGoal, updateGoal, deleteGoal, loading, error, lastUpdatedAt } = useLedger();
  const { settings } = useSettings();
  const { showNotification, showActionNotification } = useNotifications();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[]>([]);

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState('Savings');
  const [description, setDescription] = useState('');

  const compactNumbers = settings.compactNumbers ?? false;

  const visibleGoals = useMemo(
    () =>
      goals
        .filter((goal) => !pendingDeleteIds.includes(goal.id))
        .sort((a, b) => {
          if (!a.deadline && !b.deadline) return a.name.localeCompare(b.name);
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }),
    [goals, pendingDeleteIds]
  );

  const stats = useMemo(() => {
    const totalTarget = visibleGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const totalCurrent = visibleGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    const remaining = Math.max(totalTarget - totalCurrent, 0);
    const completed = visibleGoals.filter((goal) => goal.currentAmount >= goal.targetAmount).length;
    const progress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;
    return { totalTarget, totalCurrent, remaining, completed, progress };
  }, [visibleGoals]);

  const resetForm = () => {
    setEditId(null);
    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setDeadline('');
    setCategory('Savings');
    setDescription('');
  };

  const openNewGoalModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (goal: Goal) => {
    setEditId(goal.id);
    setName(goal.name);
    setTargetAmount(goal.targetAmount.toString());
    setCurrentAmount(goal.currentAmount.toString());
    setDeadline(goal.deadline || '');
    setCategory(goal.category);
    setDescription(goal.description || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim() || !targetAmount) {
      showNotification('error', 'Goal name and target amount are required.');
      return;
    }

    const goalData = {
      name: name.trim(),
      targetAmount: Number(targetAmount),
      currentAmount: Number(currentAmount) || 0,
      deadline,
      category,
      description: description.trim(),
    };

    try {
      if (editId) {
        await updateGoal(editId, goalData);
        showNotification('success', 'Goal updated');
      } else {
        await addGoal(goalData);
        showNotification('success', 'Goal created');
      }

      resetForm();
      setIsModalOpen(false);
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : 'Unable to save the goal right now.';
      showNotification('error', message);
    }
  };

  const requestDelete = (goal: Goal) => {
    setPendingDeleteIds((current) => [...current, goal.id]);
    showActionNotification({
      type: 'warning',
      message: `${goal.name} removed from view. Undo within 8 seconds to restore it.`,
      actionLabel: 'Undo',
      duration: 8000,
      onAction: () => {
        setPendingDeleteIds((current) => current.filter((id) => id !== goal.id));
        showNotification('info', 'Goal restored');
      },
      onDismiss: async () => {
        await deleteGoal(goal.id);
        setPendingDeleteIds((current) => current.filter((id) => id !== goal.id));
        showNotification('success', 'Goal deleted');
      },
    });
  };

  if (loading) {
    return (
      <div className="page-container">
        <PageSkeleton cardCount={4} rowCount={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <PageState
          variant="error"
          title="Goals are unavailable right now"
          description={error}
          actionLabel="Retry"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div
        className="page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '16px',
          alignItems: 'flex-start',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>
            Goals
          </h1>
          <p className="page-subtitle" style={{ marginTop: '8px' }}>
            Track savings targets with clearer progress, remaining amount, and deadline status.
          </p>
          {lastUpdatedAt ? (
            <p style={{ margin: '10px 0 0', color: 'var(--muted)', fontSize: '0.82rem' }}>
              As of {formatDateTime(lastUpdatedAt)}
            </p>
          ) : null}
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="page-state__button"
            onClick={() => {
              exportGoalsToCSV(visibleGoals);
              showNotification('success', 'Goals exported');
            }}
          >
            <Download size={16} />
            Export CSV
          </button>
          <button type="button" className="add-transaction-btn" onClick={openNewGoalModal}>
            <Plus size={18} />
            Add Goal
          </button>
        </div>
      </div>

      <div className="grid-responsive-4" style={{ gap: '16px', marginBottom: '24px' }}>
        <GoalStatCard
          label="Target amount"
          value={<MoneyValue amount={stats.totalTarget} compact={compactNumbers} />}
        />
        <GoalStatCard
          label="Saved so far"
          value={<MoneyValue amount={stats.totalCurrent} compact={compactNumbers} />}
          accent="#2bd576"
        />
        <GoalStatCard
          label="Remaining"
          value={<MoneyValue amount={stats.remaining} compact={compactNumbers} />}
          accent="#ffb020"
        />
        <GoalStatCard
          label="Completed goals"
          value={`${stats.completed}/${visibleGoals.length || 0}`}
          accent="#6aa6ff"
        />
      </div>

      <div
        className="premium-card"
        style={{
          padding: '24px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div>
          <div
            style={{
              color: 'var(--muted)',
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Overall progress
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '6px' }}>
            {stats.progress.toFixed(1)}%
          </div>
        </div>
        <div style={{ flex: '1 1 320px' }}>
          <div
            aria-hidden="true"
            style={{
              height: '12px',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.06)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.min(stats.progress, 100)}%`,
                height: '100%',
                borderRadius: '999px',
                background: 'linear-gradient(90deg, #6aa6ff 0%, #2bd576 100%)',
              }}
            />
          </div>
        </div>
      </div>

      {visibleGoals.length === 0 ? (
        <PageState
          title="No goals yet"
          description="Create your first goal to start tracking how much you have saved and how much remains."
          actionLabel="Add your first goal"
          onAction={openNewGoalModal}
        />
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {visibleGoals.map((goal) => {
            const progress =
              goal.targetAmount > 0
                ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
                : 0;
            const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
            const status = getGoalStatus(goal);

            return (
              <article
                key={goal.id}
                className="premium-card"
                style={{ padding: '22px', display: 'grid', gap: '18px' }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '16px',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{goal.name}</h2>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          borderRadius: '999px',
                          padding: '6px 10px',
                          background: `${status.color}1f`,
                          color: status.color,
                          fontSize: '0.78rem',
                          fontWeight: 700,
                        }}
                      >
                        {status.icon}
                        {status.label}
                      </span>
                    </div>
                    <p style={{ color: 'var(--muted)', margin: '8px 0 0' }}>
                      {goal.category}
                      {goal.deadline ? ` • due ${formatDate(goal.deadline)}` : ''}
                    </p>
                    {goal.description ? (
                      <p style={{ color: 'var(--muted)', margin: '10px 0 0', lineHeight: 1.6 }}>
                        {goal.description}
                      </p>
                    ) : null}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="action-btn action-btn--edit"
                      data-label="Edit"
                      aria-label={`Edit ${goal.name}`}
                      title="Edit goal"
                      onClick={() => handleEdit(goal)}
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      type="button"
                      className="action-btn action-btn--delete"
                      data-label="Delete"
                      aria-label={`Delete ${goal.name}`}
                      title="Delete goal"
                      onClick={() => requestDelete(goal)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="grid-responsive-3" style={{ gap: '14px' }}>
                  <GoalMetric
                    label="Saved"
                    value={<MoneyValue amount={goal.currentAmount} compact={compactNumbers} />}
                    accent="#2bd576"
                  />
                  <GoalMetric
                    label="Target"
                    value={<MoneyValue amount={goal.targetAmount} compact={compactNumbers} />}
                  />
                  <GoalMetric
                    label="Remaining"
                    value={<MoneyValue amount={remaining} compact={compactNumbers} />}
                    accent="#ffb020"
                  />
                </div>

                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '12px',
                      marginBottom: '8px',
                      color: 'var(--muted)',
                      fontSize: '0.84rem',
                    }}
                  >
                    <span>Progress</span>
                    <span>{progress.toFixed(1)}%</span>
                  </div>
                  <div
                    aria-hidden="true"
                    style={{
                      height: '10px',
                      borderRadius: '999px',
                      background: 'rgba(255,255,255,0.06)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${progress}%`,
                        height: '100%',
                        borderRadius: '999px',
                        background: 'linear-gradient(90deg, #6aa6ff 0%, #2bd576 100%)',
                      }}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {isModalOpen ? (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '560px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h2 style={{ margin: 0 }}>{editId ? 'Edit goal' : 'New goal'}</h2>
              <button type="button" className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
              <input
                className="form-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Goal name"
                required
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <input
                  className="form-input table-nums"
                  type="number"
                  min="0"
                  step="0.01"
                  value={targetAmount}
                  onChange={(event) => setTargetAmount(event.target.value)}
                  placeholder="Target amount"
                  required
                />
                <input
                  className="form-input table-nums"
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentAmount}
                  onChange={(event) => setCurrentAmount(event.target.value)}
                  placeholder="Saved so far"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <select
                  className="form-input"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  {GOAL_CATEGORIES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <input
                  className="form-input"
                  type="date"
                  value={deadline}
                  onChange={(event) => setDeadline(event.target.value)}
                />
              </div>
              <textarea
                className="form-input"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Description"
                rows={4}
                style={{ resize: 'vertical' }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="page-state__button"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="add-transaction-btn">
                  {editId ? 'Save changes' : 'Create goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function GoalStatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: ReactNode;
  accent?: string;
}) {
  return (
    <div className="premium-card" style={{ padding: '22px' }}>
      <div
        style={{
          color: 'var(--muted)',
          fontSize: '0.76rem',
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '10px',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: '1.45rem', fontWeight: 900, color: accent ?? 'var(--text)' }}>
        {value}
      </div>
    </div>
  );
}

function GoalMetric({
  label,
  value,
  accent,
}: {
  label: string;
  value: ReactNode;
  accent?: string;
}) {
  return (
    <div
      style={{
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.03)',
        padding: '16px',
      }}
    >
      <div style={{ color: 'var(--muted)', fontSize: '0.78rem', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: accent ?? 'var(--text)' }}>
        {value}
      </div>
    </div>
  );
}
