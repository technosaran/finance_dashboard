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
        padding: 'clamp(16px, 4vw, 24px)',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header Section */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 'clamp(1.5rem, 3.5vw, 2rem)',
                fontWeight: '900',
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              Goals
            </h1>
            <p
              style={{
                color: '#94a3b8',
                fontSize: 'clamp(0.8rem, 1.8vw, 0.9rem)',
                marginTop: '6px',
              }}
            >
              Track savings targets and progress over time
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                exportGoalsToCSV(goals);
                showNotification('success', 'Goals exported successfully!');
              }}
              aria-label="Export goals to CSV"
              style={{
                padding: 'clamp(10px, 2vw, 12px) clamp(16px, 3vw, 20px)',
                minHeight: '44px',
                borderRadius: '14px',
                background: '#050505',
                color: '#fff',
                border: '1px solid #111111',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: '0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#111111';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#050505';
              }}
            >
              <Download size={16} color="#10b981" /> Export CSV
            </button>
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              aria-label="Create new goal"
              style={{
                padding: 'clamp(10px, 2vw, 12px) clamp(16px, 3vw, 20px)',
                minHeight: '44px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #1a8e68 0%, #146d63 100%)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '800',
                fontSize: '0.85rem',
                boxShadow: '0 8px 16px rgba(99, 102, 241, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <Plus size={16} strokeWidth={3} /> Add Goal
            </button>
          </div>
        </div>

        {/* Achievement Statistics */}
        <div
          style={{
            background: 'linear-gradient(135deg, #050505 0%, #111111 100%)',
            padding: '28px',
            borderRadius: '24px',
            border: '1px solid #111111',
            marginBottom: '24px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
              gap: '40px',
              alignItems: 'center',
            }}
          >
            <div>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}
              >
                <div
                  style={{
                    background: 'rgba(52, 211, 153, 0.1)',
                    padding: '8px',
                    borderRadius: '10px',
                    color: '#34d399',
                  }}
                >
                  <Trophy size={20} />
                </div>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: '800',
                    color: '#43c08a',
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                  }}
                >
                  Overall progress
                </span>
              </div>
              <h2
                style={{
                  fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
                  fontWeight: '950',
                  color: '#fff',
                  margin: '0 0 16px 0',
                  letterSpacing: '-2px',
                }}
              >
                {overallProgress.toFixed(1)}%{' '}
                <span
                  style={{
                    color: '#64748b',
                    fontSize: 'clamp(0.9rem, 2.5vw, 1.25rem)',
                    fontWeight: '700',
                    letterSpacing: '0',
                  }}
                >
                  funded
                </span>
              </h2>
              <div
                style={{
                  width: '100%',
                  height: '12px',
                  background: 'rgba(255,255,255,0.03)',
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
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
                gap: '20px',
              }}
            >
              <div
                style={{
                  textAlign: 'left',
                  padding: '20px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.03)',
                }}
              >
                <div
                  style={{
                    color: '#94a3b8',
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    marginBottom: '6px',
                    letterSpacing: '0.8px',
                  }}
                >
                  Saved
                </div>
                <div
                  style={{
                    fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)',
                    fontWeight: '900',
                    color: '#34d399',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  ₹{totalCurrent.toLocaleString()}
                </div>
              </div>
              <div
                style={{
                  textAlign: 'left',
                  padding: '20px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.03)',
                }}
              >
                <div
                  style={{
                    color: '#94a3b8',
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    marginBottom: '6px',
                    letterSpacing: '0.8px',
                  }}
                >
                  Target
                </div>
                <div
                  style={{
                    fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)',
                    fontWeight: '900',
                    color: '#fff',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  ₹{totalTarget.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Goals Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
            gap: '20px',
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
                    background: 'linear-gradient(145deg, #050505 0%, #111111 100%)',
                    borderRadius: '24px',
                    border: '1px solid #111111',
                    padding: '24px',
                    transition: 'all 0.3s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.borderColor = '#1a1a1a';
                    e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(0, 0, 0, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = '#111111';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '10px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          background: isCompleted
                            ? 'rgba(52, 211, 153, 0.1)'
                            : 'rgba(99, 102, 241, 0.1)',
                          padding: '10px',
                          borderRadius: '14px',
                          color: isCompleted ? '#34d399' : '#818cf8',
                          display: 'flex',
                          flexShrink: 0,
                        }}
                        aria-hidden="true"
                      >
                        {isCompleted ? <CheckCircle2 size={20} /> : <Flame size={20} />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h3
                          style={{
                            fontSize: 'clamp(0.95rem, 1.8vw, 1.1rem)',
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
                            fontSize: '0.7rem',
                            color: '#43c08a',
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            letterSpacing: '0.8px',
                          }}
                        >
                          {goal.category}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button
                        onClick={() => handleEdit(goal)}
                        aria-label={`Edit goal ${goal.name}`}
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          padding: '8px',
                          borderRadius: '10px',
                        }}
                      >
                        <Edit3 size={15} />
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
                          background: 'rgba(244, 63, 94, 0.1)',
                          border: 'none',
                          color: '#f43f5e',
                          cursor: 'pointer',
                          padding: '10px',
                          borderRadius: '12px',
                        }}
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
                        fontSize: '0.9rem',
                        gap: '12px',
                      }}
                    >
                      <span
                        style={{ color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase' }}
                      >
                        Progress
                      </span>
                      <span style={{ color: isCompleted ? '#34d399' : '#fff', fontWeight: '900' }}>
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '10px',
                        background: '#000000',
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

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 120px), 1fr))',
                      gap: '20px',
                      padding: '24px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '20px',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color: '#94a3b8',
                          fontSize: '0.7rem',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          marginBottom: '4px',
                        }}
                      >
                        Target
                      </div>
                      <div
                        style={{
                          color: '#fff',
                          fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                          fontWeight: '900',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        ₹{goal.targetAmount.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          color: '#94a3b8',
                          fontSize: '0.7rem',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          marginBottom: '4px',
                        }}
                      >
                        Saved
                      </div>
                      <div
                        style={{
                          color: '#34d399',
                          fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                          fontWeight: '900',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        ₹{goal.currentAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      color: '#64748b',
                      fontSize: '0.8rem',
                      paddingTop: '20px',
                      borderTop: '1px solid rgba(255,255,255,0.03)',
                    }}
                  >
                    <Clock size={16} aria-hidden="true" />
                    <span style={{ fontWeight: '700' }}>
                      Deadline:{' '}
                      {goal.deadline
                        ? new Date(goal.deadline).toLocaleDateString(undefined, {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'No target date'}
                    </span>
                  </div>

                  {isCompleted && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '25px',
                        right: '-45px',
                        background: '#34d399',
                        color: '#000000',
                        padding: '8px 50px',
                        transform: 'rotate(45deg)',
                        fontSize: '0.75rem',
                        fontWeight: '950',
                        letterSpacing: '2px',
                        boxShadow: '0 5px 15px rgba(52, 211, 153, 0.3)',
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
                padding: '120px 20px',
                textAlign: 'center',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '40px',
                border: '2px dashed #111111',
                color: '#64748b',
              }}
            >
              <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'center' }}>
                <EmptyGoalsVisual />
              </div>
              <h3
                style={{
                  color: '#f8fafc',
                  fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
                  fontWeight: '800',
                  marginBottom: '12px',
                }}
              >
                No goals yet
              </h3>
              <p style={{ margin: 0, fontSize: 'clamp(0.875rem, 2vw, 1rem)', color: '#94a3b8' }}>
                Create your first goal to start tracking progress.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal - FINCORE Standard */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(15px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#050505',
              padding: 'clamp(24px, 5vw, 40px)',
              borderRadius: '32px',
              border: '1px solid #1a1a1a',
              width: '100%',
              maxWidth: '550px',
              maxHeight: '95vh',
              overflowY: 'auto',
              boxShadow: '0 50px 100px rgba(0,0,0,0.7)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '40px',
                gap: '12px',
              }}
            >
              <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: '900', margin: 0 }}>
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
                  width: '44px',
                  height: '44px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <X size={24} />
              </button>
            </div>
            <form
              onSubmit={handleSubmit}
              aria-label="Goal form"
              style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
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
                    border: '1px solid #111111',
                    padding: '18px',
                    borderRadius: '18px',
                    color: '#fff',
                    fontSize: '1.1rem',
                    outline: 'none',
                  }}
                  autoFocus
                />
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
                  gap: '24px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                    }}
                  >
                    Target amount (INR)
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
                      border: '1px solid #111111',
                      padding: '18px',
                      borderRadius: '18px',
                      color: '#fff',
                      fontSize: '1.1rem',
                      outline: 'none',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                    }}
                  >
                    Current amount (INR)
                  </label>
                  <input
                    type="number"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    placeholder="0.00"
                    aria-label="Current amount"
                    style={{
                      background: '#000000',
                      border: '1px solid #111111',
                      padding: '18px',
                      borderRadius: '18px',
                      color: '#fff',
                      fontSize: '1.1rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
                  gap: '24px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
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
                      border: '1px solid #111111',
                      padding: '18px',
                      borderRadius: '18px',
                      color: '#fff',
                      fontSize: '1.1rem',
                      outline: 'none',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
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
                      border: '1px solid #111111',
                      padding: '18px',
                      borderRadius: '18px',
                      color: '#fff',
                      fontSize: '1.1rem',
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
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
                      border: '1px solid #111111',
                      padding: '18px',
                      borderRadius: '18px',
                      color: '#fff',
                      fontSize: '1.1rem',
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
                  <p style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '6px' }}>
                    If the current amount increases, the difference will be deducted from this
                    account.
                  </p>
                </div>
              )}
              <button
                type="submit"
                aria-label={editId ? 'Update goal' : 'Create goal'}
                style={{
                  marginTop: '12px',
                  background: 'linear-gradient(135deg, #1a8e68 0%, #146d63 100%)',
                  color: '#fff',
                  padding: 'clamp(16px, 3vw, 20px)',
                  minHeight: '44px',
                  borderRadius: '20px',
                  border: 'none',
                  fontWeight: '900',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  boxShadow: '0 15px 30px rgba(13, 78, 68, 0.32)',
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
