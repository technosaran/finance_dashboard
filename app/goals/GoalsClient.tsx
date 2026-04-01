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
        className="main-content"
        style={{
          backgroundColor: '#000000',
          minHeight: '100vh',
          color: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: '#94a3b8' }}>
            Loading your goals...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="main-content"
      style={{
        backgroundColor: '#000000',
        minHeight: '100vh',
        color: '#f8fafc',
        padding: 'clamp(12px, 3vw, 20px)',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 'clamp(1.25rem, 3vw, 1.6rem)',
                fontWeight: '900',
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              Goals
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.78rem', margin: '2px 0 0 0' }}>
              Track savings targets and progress over time
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                exportGoalsToCSV(goals);
                showNotification('success', 'Goals exported successfully!');
              }}
              aria-label="Export goals to CSV"
              style={{
                padding: '8px 14px',
                minHeight: '36px',
                borderRadius: '10px',
                background: '#0a0a0a',
                color: '#94a3b8',
                border: '1px solid #1a1a1a',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: '0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#111111';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#0a0a0a';
                e.currentTarget.style.color = '#94a3b8';
              }}
            >
              <Download size={14} color="#10b981" /> Export CSV
            </button>
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              aria-label="Create new goal"
              style={{
                padding: '8px 16px',
                minHeight: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #1a8e68 0%, #146d63 100%)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '800',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'opacity 0.15s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <Plus size={14} strokeWidth={3} /> Add Goal
            </button>
          </div>
        </div>

        {/* Compact Summary Bar */}
        <div
          style={{
            background: '#080808',
            border: '1px solid #111111',
            borderRadius: '14px',
            padding: '14px 18px',
            marginBottom: '16px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <div
              style={{
                background: 'rgba(52, 211, 153, 0.1)',
                padding: '6px',
                borderRadius: '8px',
                color: '#34d399',
                display: 'flex',
              }}
            >
              <Trophy size={15} />
            </div>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: '800',
                color: '#43c08a',
                letterSpacing: '0.5px',
              }}
            >
              Overall
            </span>
          </div>
          <span
            style={{
              fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
              fontWeight: '900',
              color: '#fff',
              letterSpacing: '-1px',
            }}
          >
            {overallProgress.toFixed(1)}%
          </span>
          <div style={{ flex: 1, minWidth: '80px' }}>
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
                  width: `${overallProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #6366f1 0%, #34d399 100%)',
                  borderRadius: '100px',
                  transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              gap: '20px',
              flexWrap: 'wrap',
              paddingLeft: '8px',
              borderLeft: '1px solid #1a1a1a',
            }}
          >
            <div>
              <div
                style={{
                  color: '#64748b',
                  fontSize: '0.65rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Saved
              </div>
              <div style={{ color: '#34d399', fontSize: '0.95rem', fontWeight: '800' }}>
                ₹{totalCurrent.toLocaleString()}
              </div>
            </div>
            <div>
              <div
                style={{
                  color: '#64748b',
                  fontSize: '0.65rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Target
              </div>
              <div style={{ color: '#fff', fontSize: '0.95rem', fontWeight: '800' }}>
                ₹{totalTarget.toLocaleString()}
              </div>
            </div>
            <div>
              <div
                style={{
                  color: '#64748b',
                  fontSize: '0.65rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Goals
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.95rem', fontWeight: '800' }}>
                {goals.length}
              </div>
            </div>
          </div>
        </div>

        {/* Goals Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
            gap: '12px',
          }}
        >
          {goals.length > 0 ? (
            goals.map((goal) => {
              const progress = (goal.currentAmount / goal.targetAmount) * 100;
              const isCompleted = progress >= 100;

              return (
                <div
                  key={goal.id}
                  style={{
                    background: '#080808',
                    borderRadius: '14px',
                    border: '1px solid #111111',
                    padding: '16px',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#1a1a1a';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.35)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#111111';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Card header: icon + name + actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        background: isCompleted ? 'rgba(52,211,153,0.1)' : 'rgba(99,102,241,0.1)',
                        padding: '7px',
                        borderRadius: '10px',
                        color: isCompleted ? '#34d399' : '#818cf8',
                        display: 'flex',
                        flexShrink: 0,
                      }}
                      aria-hidden="true"
                    >
                      {isCompleted ? <CheckCircle2 size={16} /> : <Flame size={16} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3
                        style={{
                          fontSize: '0.92rem',
                          fontWeight: '800',
                          margin: 0,
                          color: '#fff',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {goal.name}
                      </h3>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          color: '#43c08a',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {goal.category}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      <button
                        onClick={() => handleEdit(goal)}
                        aria-label={`Edit goal ${goal.name}`}
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          padding: '6px',
                          borderRadius: '8px',
                          display: 'flex',
                        }}
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={async () => {
                          const isConfirmed = await customConfirm({
                            title: 'Delete goal',
                            message: `Delete the goal "${goal.name}"?`,
                            type: 'error',
                            confirmLabel: 'Delete',
                          });
                          if (isConfirmed) {
                            await deleteGoal(goal.id);
                            showNotification('success', 'Goal deleted');
                          }
                        }}
                        aria-label={`Delete goal ${goal.name}`}
                        style={{
                          background: 'rgba(244,63,94,0.08)',
                          border: 'none',
                          color: '#f43f5e',
                          cursor: 'pointer',
                          padding: '6px',
                          borderRadius: '8px',
                          display: 'flex',
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '6px',
                      }}
                    >
                      <span
                        style={{
                          color: '#64748b',
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                        }}
                      >
                        Progress
                      </span>
                      <span
                        style={{
                          color: isCompleted ? '#34d399' : '#cbd5e1',
                          fontSize: '0.78rem',
                          fontWeight: '800',
                        }}
                      >
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '6px',
                        background: '#0d0d0d',
                        borderRadius: '100px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(progress, 100)}%`,
                          height: '100%',
                          background: isCompleted ? '#34d399' : '#6366f1',
                          borderRadius: '100px',
                          transition: 'width 1s ease',
                        }}
                      />
                    </div>
                  </div>

                  {/* Inline stats + deadline */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px',
                      paddingTop: '8px',
                      borderTop: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div>
                        <div
                          style={{
                            color: '#64748b',
                            fontSize: '0.62rem',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                          }}
                        >
                          Target
                        </div>
                        <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '800' }}>
                          ₹{goal.targetAmount.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div
                          style={{
                            color: '#64748b',
                            fontSize: '0.62rem',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                          }}
                        >
                          Saved
                        </div>
                        <div style={{ color: '#34d399', fontSize: '0.85rem', fontWeight: '800' }}>
                          ₹{goal.currentAmount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        color: '#475569',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                      }}
                    >
                      <Clock size={12} aria-hidden="true" />
                      <span>
                        {goal.deadline
                          ? new Date(goal.deadline).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'No date'}
                      </span>
                    </div>
                  </div>

                  {isCompleted && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '18px',
                        right: '-38px',
                        background: '#34d399',
                        color: '#000000',
                        padding: '5px 44px',
                        transform: 'rotate(45deg)',
                        fontSize: '0.62rem',
                        fontWeight: '900',
                        letterSpacing: '1.5px',
                        boxShadow: '0 4px 12px rgba(52,211,153,0.25)',
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
                padding: '80px 20px',
                textAlign: 'center',
                background: 'rgba(255,255,255,0.01)',
                borderRadius: '20px',
                border: '1px dashed #1a1a1a',
                color: '#64748b',
              }}
            >
              <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                <EmptyGoalsVisual />
              </div>
              <h3
                style={{
                  color: '#f8fafc',
                  fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
                  fontWeight: '800',
                  marginBottom: '8px',
                }}
              >
                No goals yet
              </h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                Create your first goal to start tracking progress.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#080808',
              padding: 'clamp(20px, 4vw, 32px)',
              borderRadius: '24px',
              border: '1px solid #1a1a1a',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '95vh',
              overflowY: 'auto',
              boxShadow: '0 40px 80px rgba(0,0,0,0.7)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                gap: '12px',
              }}
            >
              <h2
                style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)', fontWeight: '900', margin: 0 }}
              >
                {editId ? 'Edit goal' : 'New goal'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: 'none',
                  color: '#94a3b8',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={handleSubmit}
              aria-label="Goal form"
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                  }}
                >
                  Goal name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Emergency fund"
                  required
                  aria-label="Goal name"
                  style={{
                    background: '#000000',
                    border: '1px solid #1a1a1a',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '0.95rem',
                    outline: 'none',
                  }}
                  autoFocus
                />
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: '800',
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px',
                    }}
                  >
                    Target amount (₹)
                  </label>
                  <input
                    type="number"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    aria-label="Target amount"
                    style={{
                      background: '#000000',
                      border: '1px solid #1a1a1a',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '0.95rem',
                      outline: 'none',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: '800',
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px',
                    }}
                  >
                    Current amount (₹)
                  </label>
                  <input
                    type="number"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    placeholder="0.00"
                    aria-label="Current amount"
                    style={{
                      background: '#000000',
                      border: '1px solid #1a1a1a',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '0.95rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: '800',
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px',
                    }}
                  >
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    aria-label="Deadline"
                    style={{
                      background: '#000000',
                      border: '1px solid #1a1a1a',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '0.95rem',
                      outline: 'none',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: '800',
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px',
                    }}
                  >
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    aria-label="Goal category"
                    style={{
                      background: '#000000',
                      border: '1px solid #1a1a1a',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '0.95rem',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: '800',
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px',
                    }}
                  >
                    Funding account
                  </label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(Number(e.target.value))}
                    aria-label="Select bank account"
                    style={{
                      background: '#000000',
                      border: '1px solid #1a1a1a',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '0.95rem',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">No account link</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} - ₹{acc.balance.toLocaleString()}
                      </option>
                    ))}
                  </select>
                  <p style={{ fontSize: '0.65rem', color: '#64748b', margin: '4px 0 0' }}>
                    If the current amount increases, the difference will be deducted from this
                    account.
                  </p>
                </div>
              )}
              <button
                type="submit"
                aria-label={editId ? 'Update goal' : 'Create goal'}
                style={{
                  marginTop: '4px',
                  background: 'linear-gradient(135deg, #1a8e68 0%, #146d63 100%)',
                  color: '#fff',
                  padding: '14px',
                  minHeight: '44px',
                  borderRadius: '14px',
                  border: 'none',
                  fontWeight: '900',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  boxShadow: '0 8px 20px rgba(13,78,68,0.28)',
                }}
              >
                {editId ? 'Save changes' : 'Create goal'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
