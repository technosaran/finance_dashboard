'use client';

import { useState } from 'react';
import { useNotifications } from '../components/NotificationContext';
import { useLedger } from '../components/FinanceContext';
import { Goal } from '@/lib/types';
import { exportGoalsToCSV } from '../../lib/utils/export';
import { Plus, X, Trophy, Trash2, Edit3, CheckCircle2, Clock, Flame, Download } from 'lucide-react';
import { EmptyGoalsVisual } from '../components/Visuals';

export default function GoalsClient() {
  const { accounts, goals, addGoal, updateGoal, deleteGoal, loading } = useLedger();
  const { showNotification, confirm: customConfirm } = useNotifications();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<number | ''>('');

  // Form State
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState('Savings');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount) return;

    const goalData = {
      name,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount) || 0,
      deadline,
      category,
      description,
    };

    if (editId) {
      await updateGoal(editId, goalData);
      showNotification('success', 'Goal updated');
    } else {
      await addGoal(goalData);
      showNotification('success', 'Goal created');
    }

    resetForm();
    setIsModalOpen(false);
  };

  const resetForm = () => {
    setEditId(null);
    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setDeadline('');
    setCategory('Savings');
    setDescription('');
    setSelectedAccountId('');
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

  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalCurrent = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

  if (loading) {
    return (
      <div
        className="main-content fade-in"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            className="spin-animation"
            style={{
              width: '48px',
              height: '48px',
              border: '4px solid var(--accent-light)',
              borderTopColor: 'var(--accent)',
              borderRadius: '50%',
              margin: '0 auto 20px',
            }}
          />
          <div className="stat-label">Preparing your milestones...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content fade-in" style={{ padding: '40px' }}>
      <div style={{ margin: '0 auto' }}>
        {/* Header - Ultra Minimalist Iris */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: '56px',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '3.5rem',
                fontWeight: 950,
                letterSpacing: '-2px',
                fontFamily: 'var(--font-outfit)',
              }}
            >
              Goals<span style={{ color: '#8b5cf6' }}>.</span>
            </h1>
            <p className="stat-label" style={{ fontSize: '0.85rem' }}>
              Track your financial milestones and peak performance
            </p>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button
              onClick={() => {
                exportGoalsToCSV(goals);
                showNotification('success', 'Goals exported successfully');
              }}
              className="glass-button hide-xs"
              style={{ padding: '12px 20px', borderRadius: '14px' }}
            >
              <Download size={18} />
            </button>
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="header-add-btn"
              style={{
                padding: '14px 28px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                boxShadow: '0 12px 30px rgba(139, 92, 246, 0.25)',
              }}
            >
              <Plus size={20} /> Create Goal
            </button>
          </div>
        </div>

        {/* Hero Section - Oversized Progress */}
        <div
          className="premium-card"
          style={{
            padding: '48px',
            marginBottom: '64px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              background:
                'radial-gradient(circle at top right, rgba(139, 92, 246, 0.15), transparent 70%)',
              position: 'absolute',
              inset: 0,
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div style={{ flex: 1 }}>
              <span
                className="stat-label"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#a78bfa',
                  marginBottom: '16px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  fontWeight: 900,
                }}
              >
                <Trophy size={16} /> Portfolio Progression
              </span>
              <div
                style={{
                  fontSize: '6rem',
                  fontWeight: 950,
                  letterSpacing: '-5px',
                  fontFamily: 'var(--font-outfit)',
                  lineHeight: 0.9,
                }}
              >
                {overallProgress.toFixed(1)}%
              </div>
            </div>

            <div style={{ display: 'flex', gap: '48px', textAlign: 'right' }} className="hide-sm">
              <div>
                <div className="stat-label" style={{ fontSize: '0.7rem', marginBottom: '8px' }}>
                  Total Retained
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 950, color: 'var(--success)' }}>
                  ₹{totalCurrent.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="stat-label" style={{ fontSize: '0.7rem', marginBottom: '8px' }}>
                  Aspiration Total
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 950, color: '#fff' }}>
                  ₹{totalTarget.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: '48px',
              height: '12px',
              background: 'var(--surface-hover)',
              borderRadius: '100px',
              overflow: 'hidden',
              border: '1px solid var(--surface-border)',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: `${overallProgress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #8b5cf6 0%, #34d399 100%)',
                borderRadius: '100px',
                transition: 'width 2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 0 30px rgba(139, 92, 246, 0.4)',
              }}
            />
          </div>
        </div>

        {/* Dashboard Grid */}
        <div
          className="dashboard-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 340px',
            gap: '40px',
            alignItems: 'start',
          }}
        >
          {/* Main Content: Goals Grid */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px',
              }}
            >
              <h3 style={{ fontSize: '1.2rem', fontWeight: 950 }}>Active Milestones</h3>
              <span className="stat-label" style={{ fontSize: '0.65rem' }}>
                {goals.length} TARGETS FOUND
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                gap: '24px',
              }}
            >
              {goals.length > 0 ? (
                goals.map((goal) => {
                  const progress = (goal.currentAmount / goal.targetAmount) * 100;
                  const isCompleted = progress >= 100;

                  return (
                    <div
                      key={goal.id}
                      className="premium-card goal-card-hover"
                      style={{
                        padding: '32px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '28px',
                        position: 'relative',
                        overflow: 'hidden',
                        background: 'rgba(255,255,255,0.01)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div
                            style={{
                              width: '52px',
                              height: '52px',
                              borderRadius: '18px',
                              background: isCompleted ? '#22c55e22' : '#8b5cf622',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: isCompleted ? '#22c55e' : '#8b5cf6',
                            }}
                          >
                            {isCompleted ? <CheckCircle2 size={24} /> : <Flame size={24} />}
                          </div>
                          <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{goal.name}</h3>
                            <span
                              className="stat-label"
                              style={{
                                fontSize: '0.7rem',
                                color: isCompleted ? '#22c55e' : '#a78bfa',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                              }}
                            >
                              {goal.category}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleEdit(goal)}
                            style={{
                              padding: '10px',
                              borderRadius: '12px',
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                            }}
                            className="action-btn--hover"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={async () => {
                              const confirmed = await customConfirm({
                                title: 'Remove Landmark',
                                message: `Permanently delete "${goal.name}"?`,
                                type: 'error',
                                confirmLabel: 'Delete',
                              });
                              if (confirmed) await deleteGoal(goal.id);
                            }}
                            style={{
                              padding: '10px',
                              borderRadius: '12px',
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                            }}
                            className="action-btn-danger--hover"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '12px',
                          }}
                        >
                          <span style={{ fontSize: '1.3rem', fontWeight: 950 }}>
                            {progress.toFixed(0)}%
                          </span>
                          <span className="stat-label" style={{ fontSize: '0.75rem' }}>
                            {isCompleted ? 'Goal Fully Met' : 'In Progress'}
                          </span>
                        </div>
                        <div
                          style={{
                            height: '6px',
                            background: 'var(--surface-hover)',
                            borderRadius: '100px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(progress, 100)}%`,
                              height: '100%',
                              background: isCompleted ? '#22c55e' : '#8b5cf6',
                              borderRadius: '100px',
                              transition: 'width 1.5s ease',
                              opacity: 0.8,
                            }}
                          />
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          paddingTop: '20px',
                          borderTop: '1px solid var(--surface-border)',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '32px' }}>
                          <div>
                            <div className="stat-label" style={{ fontSize: '0.65rem' }}>
                              Target
                            </div>
                            <div style={{ fontWeight: 900, fontSize: '1rem' }}>
                              ₹{goal.targetAmount.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="stat-label" style={{ fontSize: '0.65rem' }}>
                              Saved
                            </div>
                            <div
                              style={{
                                fontWeight: 900,
                                fontSize: '1rem',
                                color: isCompleted ? '#22c55e' : '#fff',
                              }}
                            >
                              ₹{goal.currentAmount.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="stat-label" style={{ fontSize: '0.65rem' }}>
                            Timeline
                          </div>
                          <div
                            style={{
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              color: 'var(--text-secondary)',
                            }}
                          >
                            {goal.deadline
                              ? new Date(goal.deadline).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : 'Ongoing'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div
                  style={{
                    gridColumn: '1 / -1',
                    padding: '120px 40px',
                    textAlign: 'center',
                    border: '1px dashed var(--surface-border)',
                    borderRadius: '40px',
                    background: 'rgba(255,255,255,0.01)',
                  }}
                >
                  <EmptyGoalsVisual />
                  <p className="stat-label" style={{ marginTop: '24px' }}>
                    Awaiting your first milestone definition.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Analytics - Iris Style */}
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}
            className="hide-md"
          >
            {/* Spotlight Card */}
            {goals.filter((g) => g.currentAmount < g.targetAmount).length > 0 && (
              <div
                className="premium-card"
                style={{
                  padding: '32px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                  color: '#fff',
                  border: 'none',
                  boxShadow: '0 20px 40px rgba(99, 102, 241, 0.2)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '24px',
                  }}
                >
                  <Flame size={18} />
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 900,
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                    }}
                  >
                    High Momentum
                  </span>
                </div>
                {(() => {
                  const nextGoal = [...goals]
                    .filter((g) => g.currentAmount < g.targetAmount)
                    .sort(
                      (a, b) => b.currentAmount / b.targetAmount - a.currentAmount / a.targetAmount
                    )[0];
                  const p = (nextGoal.currentAmount / nextGoal.targetAmount) * 100;
                  return (
                    <>
                      <h4
                        style={{
                          fontSize: '1.4rem',
                          fontWeight: 950,
                          marginBottom: '8px',
                          letterSpacing: '-0.5px',
                        }}
                      >
                        {nextGoal.name}
                      </h4>
                      <p style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '24px' }}>
                        ₹{(nextGoal.targetAmount - nextGoal.currentAmount).toLocaleString()} more
                        needed for victory
                      </p>
                      <div
                        style={{
                          height: '8px',
                          background: 'rgba(255,255,255,0.2)',
                          borderRadius: '100px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${p}%`,
                            height: '100%',
                            background: '#fff',
                            borderRadius: '100px',
                          }}
                        />
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Sidebar Lists - Linear Style */}
            <div className="premium-card" style={{ padding: '32px' }}>
              <h3
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 950,
                  marginBottom: '32px',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  color: 'var(--text-secondary)',
                }}
              >
                LANDMARK ACTIVITY
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {goals.length > 0 ? (
                  [...goals]
                    .sort(
                      (a, b) =>
                        new Date(b.updatedAt || b.createdAt || 0).getTime() -
                        new Date(a.updatedAt || a.createdAt || 0).getTime()
                    )
                    .slice(0, 4)
                    .map((goal) => (
                      <div
                        key={`side-${goal.id}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
                      >
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '10px',
                            background: 'var(--surface-hover)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#8b5cf6',
                          }}
                        >
                          <Clock size={14} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '0.8rem',
                              fontWeight: 800,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {goal.name}
                          </div>
                          <div className="stat-label" style={{ fontSize: '0.65rem' }}>
                            Updated{' '}
                            {new Date(goal.updatedAt || goal.createdAt || '').toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="stat-label" style={{ textAlign: 'center' }}>
                    No recent data
                  </p>
                )}
              </div>
            </div>

            <div className="premium-card" style={{ padding: '32px' }}>
              <h3
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 950,
                  marginBottom: '32px',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  color: 'var(--text-secondary)',
                }}
              >
                HALL OF FAME
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {goals.filter((g) => g.currentAmount >= g.targetAmount).length > 0 ? (
                  goals
                    .filter((g) => g.currentAmount >= g.targetAmount)
                    .map((goal) => (
                      <div
                        key={`hof-${goal.id}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '16px',
                          background: 'rgba(34, 197, 94, 0.05)',
                          borderRadius: '16px',
                          border: '1px solid rgba(34, 197, 94, 0.1)',
                        }}
                      >
                        <Trophy size={16} style={{ color: '#22c55e' }} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>{goal.name}</span>
                      </div>
                    ))
                ) : (
                  <p className="stat-label" style={{ textAlign: 'center' }}>
                    Awaiting trophies...
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Modal */}
      {isModalOpen && (
        <div className="modal-overlay fade-in">
          <div className="modal-card slide-up" style={{ maxWidth: '480px', width: '100%' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
              }}
            >
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                  {editId ? 'Edit Goal' : 'New Goal'}
                </h2>
                <p className="stat-label">Define your next milestone</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="modal-close">
                <X size={24} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="form-label">Goal Name</label>
                <input
                  className="form-input"
                  placeholder="e.g. New Macbook Pro"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="form-label">Target (₹)</label>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="0.00"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="form-label">Current (₹)</label>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="0.00"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="form-label">Category</label>
                  <select
                    className="form-input"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Savings">Savings</option>
                    <option value="Investment">Investment</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Travel">Travel</option>
                    <option value="Purchase">Purchase</option>
                  </select>
                </div>
              </div>

              {editId && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="form-label">Funding Account</label>
                  <select
                    className="form-input"
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(Number(e.target.value))}
                  >
                    <option value="">No account link</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} - ₹{acc.balance.toLocaleString()}
                      </option>
                    ))}
                  </select>
                  <p className="stat-label" style={{ fontSize: '0.65rem', marginTop: '4px' }}>
                    If the current amount increases, the difference will be deducted from this
                    account.
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="btn-primary"
                style={{ marginTop: '12px', padding: '14px', fontSize: '1rem' }}
              >
                {editId ? 'Save Changes' : 'Launch Goal'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .goal-card-hover {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .goal-card-hover:hover {
          transform: translateY(-4px) scale(1.02);
          background: rgba(15, 25, 30, 0.9) !important;
          border-color: var(--accent) !important;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4), 0 0 20px var(--accent-glow) !important;
        }
        .activity-item-hover:hover {
          background: var(--surface-hover);
        }
      `}</style>
    </div>
  );
}
