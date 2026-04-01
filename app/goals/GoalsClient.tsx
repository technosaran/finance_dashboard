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
    <div className="main-content fade-in">
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div>
          <h1 className="page-title gradient-text">Goals</h1>
          <p className="page-subtitle">Track your financial milestones and peak performance</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => {
              exportGoalsToCSV(goals);
              showNotification('success', 'Goals exported successfully');
            }}
            className="glass-button hide-xs"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Download size={18} /> Export
          </button>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="header-add-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={20} /> Create Goal
          </button>
        </div>
      </div>

      {/* Summary Highlight */}
      <div className="premium-card" style={{ padding: '32px', marginBottom: '32px' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}
              >
                <Trophy size={18} className="text-glow" style={{ color: 'var(--accent)' }} />
                <span className="stat-label">Overall Progress</span>
              </div>
              <div
                style={{
                  fontSize: '3.5rem',
                  fontWeight: 900,
                  letterSpacing: '-2px',
                  lineHeight: 1,
                  fontFamily: 'var(--font-outfit)',
                }}
              >
                {overallProgress.toFixed(1)}%
              </div>
            </div>

            <div style={{ display: 'flex', gap: '48px' }} className="hide-sm">
              <div>
                <div className="stat-label">Total Saved</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>
                  ₹{totalCurrent.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="stat-label">Total Target</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  ₹{totalTarget.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              width: '100%',
              height: '10px',
              background: 'var(--surface-hover)',
              borderRadius: '100px',
              overflow: 'hidden',
              border: '1px solid var(--surface-border)',
            }}
          >
            <div
              style={{
                width: `${overallProgress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--accent) 0%, #34d399 100%)',
                borderRadius: '100px',
                transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 0 20px rgba(30, 166, 114, 0.3)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      <div
        className="dashboard-grid"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}
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
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: isCompleted ? 'rgba(34, 197, 94, 0.1)' : 'var(--accent-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isCompleted ? 'var(--success)' : 'var(--accent)',
                      }}
                    >
                      {isCompleted ? <CheckCircle2 size={22} /> : <Flame size={22} />}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{goal.name}</h3>
                      <span className="stat-label" style={{ fontSize: '0.65rem' }}>
                        {goal.category}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleEdit(goal)}
                      className="glass-button"
                      style={{ padding: '6px', borderRadius: '8px' }}
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={async () => {
                        const confirmed = await customConfirm({
                          title: 'Delete Goal',
                          message: `Remove "${goal.name}"? This action cannot be undone.`,
                          type: 'error',
                          confirmLabel: 'Delete Goal',
                        });
                        if (confirmed) {
                          await deleteGoal(goal.id);
                          showNotification('success', 'Goal deleted');
                        }
                      }}
                      className="glass-button"
                      style={{
                        padding: '6px',
                        borderRadius: '8px',
                        color: 'var(--error)',
                        borderColor: 'var(--error-light)',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                      alignItems: 'center',
                    }}
                  >
                    <span className="stat-label">Progress</span>
                    <span
                      style={{
                        fontSize: '1rem',
                        fontWeight: 800,
                        color: isCompleted ? 'var(--success)' : 'var(--text-primary)',
                      }}
                    >
                      {progress.toFixed(0)}%
                    </span>
                  </div>
                  <div
                    style={{
                      width: '100%',
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
                        background: isCompleted ? 'var(--success)' : 'var(--accent)',
                        borderRadius: '100px',
                        transition: 'width 1s ease',
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--surface-border)',
                  }}
                >
                  <div style={{ display: 'flex', gap: '24px' }}>
                    <div>
                      <div className="stat-label" style={{ fontSize: '0.6rem' }}>
                        Target
                      </div>
                      <div style={{ fontWeight: 700 }}>₹{goal.targetAmount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="stat-label" style={{ fontSize: '0.6rem' }}>
                        Saved
                      </div>
                      <div
                        style={{
                          fontWeight: 700,
                          color: isCompleted ? 'var(--success)' : 'var(--accent)',
                        }}
                      >
                        ₹{goal.currentAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="stat-label" style={{ fontSize: '0.6rem' }}>
                      Deadline
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <Clock size={12} />
                      {goal.deadline
                        ? new Date(goal.deadline).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'No limit'}
                    </div>
                  </div>
                </div>

                {isCompleted && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '-30px',
                      background: 'var(--success)',
                      color: '#000',
                      padding: '4px 40px',
                      transform: 'rotate(45deg)',
                      fontSize: '0.6rem',
                      fontWeight: 900,
                      letterSpacing: '1px',
                    }}
                  >
                    COMPLETE
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div
            style={{
              gridColumn: '1 / -1',
              padding: '100px 24px',
              textAlign: 'center',
              border: '2px dashed var(--surface-border)',
              borderRadius: '24px',
            }}
          >
            <div style={{ marginBottom: '24px' }}>
              <EmptyGoalsVisual />
            </div>
            <h3 style={{ marginBottom: '8px' }}>No targets set yet</h3>
            <p className="stat-label">Create your first goal to start tracking milestones.</p>
          </div>
        )}
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
      `}</style>
    </div>
  );
}
