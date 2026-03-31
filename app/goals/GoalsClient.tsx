'use client';

import { useState } from 'react';
import { useNotifications } from '../components/NotificationContext';
import { useLedger } from '../components/FinanceContext';
import { Goal } from '@/lib/types';
import { exportGoalsToCSV } from '../../lib/utils/export';
import {
  Plus,
  X,
  Trophy,
  Trash2,
  Edit3,
  CheckCircle2,
  Clock,
  Download,
  Target,
  PiggyBank,
  TrendingUp,
  Shield,
  Plane,
  ShoppingBag,
  Wallet,
} from 'lucide-react';
import { EmptyGoalsVisual } from '../components/Visuals';

interface CategoryConfig {
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  Savings: { color: '#10b981', bgColor: 'rgba(16,185,129,0.1)', icon: <PiggyBank size={14} /> },
  Investment: {
    color: '#6366f1',
    bgColor: 'rgba(99,102,241,0.1)',
    icon: <TrendingUp size={14} />,
  },
  Emergency: { color: '#f59e0b', bgColor: 'rgba(245,158,11,0.1)', icon: <Shield size={14} /> },
  Travel: { color: '#0ea5e9', bgColor: 'rgba(14,165,233,0.1)', icon: <Plane size={14} /> },
  Purchase: { color: '#f43f5e', bgColor: 'rgba(244,63,94,0.1)', icon: <ShoppingBag size={14} /> },
};

const getCategoryConfig = (category: string): CategoryConfig =>
  CATEGORY_CONFIG[category] ?? {
    color: '#64748b',
    bgColor: 'rgba(100,116,139,0.1)',
    icon: <Wallet size={14} />,
  };

function ProgressRing({
  progress,
  color,
  size = 72,
}: {
  progress: number;
  color: string;
  size?: number;
}) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(progress, 100) / 100) * circumference;
  const center = size / 2;

  return (
    <svg
      width={size}
      height={size}
      style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}
      aria-hidden="true"
    >
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
    </svg>
  );
}

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
  const completedGoals = goals.filter(
    (g) => (g.currentAmount / g.targetAmount) * 100 >= 100
  ).length;
  const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

  const getDaysRemaining = (deadlineStr: string): number | null => {
    if (!deadlineStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(deadlineStr);
    d.setHours(0, 0, 0, 0);
    return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getDeadlineBadgeStyle = (days: number): { background: string; color: string } => {
    if (days < 0) return { background: 'rgba(244,63,94,0.1)', color: '#f43f5e' };
    if (days < 30) return { background: 'rgba(245,158,11,0.1)', color: '#f59e0b' };
    return { background: 'rgba(99,102,241,0.1)', color: '#818cf8' };
  };

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
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '28px',
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
              Set targets, track savings, achieve dreams
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

        {/* Stats Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          {(
            [
              {
                label: 'Total Goals',
                value: goals.length.toString(),
                icon: <Target size={18} />,
                color: '#6366f1',
              },
              {
                label: 'Completed',
                value: `${completedGoals} / ${goals.length}`,
                icon: <CheckCircle2 size={18} />,
                color: '#10b981',
              },
              {
                label: 'Total Saved',
                value: `₹${totalCurrent.toLocaleString()}`,
                icon: <PiggyBank size={18} />,
                color: '#34d399',
              },
              {
                label: 'Total Target',
                value: `₹${totalTarget.toLocaleString()}`,
                icon: <Trophy size={18} />,
                color: '#f59e0b',
              },
            ] as { label: string; value: string; icon: React.ReactNode; color: string }[]
          ).map((stat, i) => (
            <div
              key={i}
              style={{
                background: '#050505',
                border: '1px solid #111111',
                borderRadius: '20px',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  background: `${stat.color}1a`,
                  padding: '10px',
                  borderRadius: '12px',
                  color: stat.color,
                  flexShrink: 0,
                }}
              >
                {stat.icon}
              </div>
              <div>
                <div
                  style={{
                    color: '#64748b',
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    marginBottom: '4px',
                  }}
                >
                  {stat.label}
                </div>
                <div
                  style={{
                    color: '#fff',
                    fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                    fontWeight: '900',
                  }}
                >
                  {stat.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Overall Progress Strip */}
        {goals.length > 0 && (
          <div
            style={{
              background: '#050505',
              border: '1px solid #111111',
              borderRadius: '16px',
              padding: '16px 24px',
              marginBottom: '28px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                color: '#94a3b8',
                fontSize: '0.75rem',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                whiteSpace: 'nowrap',
              }}
            >
              Overall Progress
            </span>
            <div
              style={{
                flex: 1,
                minWidth: '80px',
                height: '8px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '100px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${overallProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #6366f1, #10b981)',
                  borderRadius: '100px',
                  transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            </div>
            <span
              style={{
                color: '#fff',
                fontSize: '0.85rem',
                fontWeight: '900',
                whiteSpace: 'nowrap',
              }}
            >
              {overallProgress.toFixed(1)}% funded
            </span>
          </div>
        )}

        {/* Goals Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
            gap: '20px',
          }}
        >
          {goals.length > 0 ? (
            goals.map((goal) => {
              const progress = (goal.currentAmount / goal.targetAmount) * 100;
              const isCompleted = progress >= 100;
              const daysRemaining = getDaysRemaining(goal.deadline);
              const catConfig = getCategoryConfig(goal.category);
              const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);

              return (
                <div
                  key={goal.id}
                  style={{
                    background: '#050505',
                    borderRadius: '24px',
                    border: '1px solid #111111',
                    borderLeft: `4px solid ${catConfig.color}`,
                    padding: '24px',
                    transition: 'all 0.3s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = `0 20px 40px -10px ${catConfig.color}22`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Card Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '12px',
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
                      {/* Progress Ring */}
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <ProgressRing
                          progress={progress}
                          color={isCompleted ? '#10b981' : catConfig.color}
                          size={72}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            color: isCompleted ? '#10b981' : catConfig.color,
                            fontSize: '0.65rem',
                            fontWeight: '900',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {progress.toFixed(0)}%
                        </div>
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h3
                          style={{
                            fontSize: 'clamp(0.95rem, 1.8vw, 1.1rem)',
                            fontWeight: '800',
                            margin: '0 0 6px 0',
                            color: '#fff',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {goal.name}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              background: catConfig.bgColor,
                              color: catConfig.color,
                              padding: '3px 10px',
                              borderRadius: '20px',
                              fontSize: '0.65rem',
                              fontWeight: '800',
                              textTransform: 'uppercase',
                              letterSpacing: '0.6px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            {catConfig.icon}
                            {goal.category}
                          </span>
                          {isCompleted && (
                            <CheckCircle2 size={15} color="#10b981" aria-label="Goal achieved" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button
                        onClick={() => handleEdit(goal)}
                        aria-label={`Edit goal ${goal.name}`}
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          padding: '8px',
                          borderRadius: '10px',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#fff';
                          e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#64748b';
                          e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
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
                          background: 'rgba(244,63,94,0.08)',
                          border: 'none',
                          color: '#f43f5e',
                          cursor: 'pointer',
                          padding: '8px',
                          borderRadius: '10px',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(244,63,94,0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(244,63,94,0.08)';
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Amount Row */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '10px',
                    }}
                  >
                    {(
                      [
                        {
                          label: 'Saved',
                          value: `₹${goal.currentAmount.toLocaleString()}`,
                          color: catConfig.color,
                        },
                        {
                          label: 'Target',
                          value: `₹${goal.targetAmount.toLocaleString()}`,
                          color: '#fff',
                        },
                        {
                          label: 'Remaining',
                          value: isCompleted ? '—' : `₹${remaining.toLocaleString()}`,
                          color: isCompleted ? '#10b981' : '#64748b',
                        },
                      ] as { label: string; value: string; color: string }[]
                    ).map((item) => (
                      <div
                        key={item.label}
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          borderRadius: '14px',
                          padding: '12px 8px',
                          textAlign: 'center',
                        }}
                      >
                        <div
                          style={{
                            color: '#64748b',
                            fontSize: '0.6rem',
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            marginBottom: '4px',
                            letterSpacing: '0.5px',
                          }}
                        >
                          {item.label}
                        </div>
                        <div
                          style={{
                            color: item.color,
                            fontSize: 'clamp(0.75rem, 1.5vw, 0.9rem)',
                            fontWeight: '900',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Deadline / Status Footer */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '16px',
                      borderTop: '1px solid rgba(255,255,255,0.04)',
                      gap: '8px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#64748b',
                        fontSize: '0.78rem',
                      }}
                    >
                      <Clock size={13} aria-hidden="true" />
                      <span>
                        {goal.deadline
                          ? new Date(goal.deadline).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'No deadline'}
                      </span>
                    </div>
                    {isCompleted ? (
                      <span
                        style={{
                          background: 'rgba(16,185,129,0.12)',
                          color: '#10b981',
                          padding: '3px 10px',
                          borderRadius: '20px',
                          fontSize: '0.7rem',
                          fontWeight: '800',
                        }}
                      >
                        ✓ Achieved
                      </span>
                    ) : daysRemaining !== null ? (
                      <span
                        style={{
                          ...getDeadlineBadgeStyle(daysRemaining),
                          padding: '3px 10px',
                          borderRadius: '20px',
                          fontSize: '0.7rem',
                          fontWeight: '800',
                        }}
                      >
                        {daysRemaining < 0
                          ? `${Math.abs(daysRemaining)}d overdue`
                          : `${daysRemaining}d left`}
                      </span>
                    ) : null}
                  </div>
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
