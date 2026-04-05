'use client';

import { useMemo, useState } from 'react';
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
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState('Savings');
  const [description, setDescription] = useState('');

  const resetForm = () => {
    setEditId(null);
    setSelectedAccountId('');
    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setDeadline('');
    setCategory('Savings');
    setDescription('');
  };

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
      accountId: selectedAccountId ? Number(selectedAccountId) : undefined,
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

  const handleEdit = (goal: Goal) => {
    setEditId(goal.id);
    setSelectedAccountId('');
    setName(goal.name);
    setTargetAmount(String(goal.targetAmount));
    setCurrentAmount(String(goal.currentAmount));
    setDeadline(goal.deadline || '');
    setCategory(goal.category);
    setDescription(goal.description || '');
    setIsModalOpen(true);
  };

  const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalCurrent = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const completedGoals = goals.filter((goal) => goal.currentAmount >= goal.targetAmount).length;
  const activeGoals = Math.max(goals.length - completedGoals, 0);
  const remainingAmount = Math.max(totalTarget - totalCurrent, 0);
  const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;
  const averageFunding = goals.length > 0 ? totalCurrent / goals.length : 0;
  const completionRate = goals.length > 0 ? (completedGoals / goals.length) * 100 : 0;

  const nextGoal = useMemo(
    () =>
      [...goals]
        .filter((goal) => goal.currentAmount < goal.targetAmount)
        .sort((a, b) => b.currentAmount / b.targetAmount - a.currentAmount / a.targetAmount)[0] ??
      null,
    [goals]
  );

  const topCategories = useMemo(() => {
    const totals = goals.reduce<Record<string, number>>((acc, goal) => {
      acc[goal.category] = (acc[goal.category] || 0) + goal.targetAmount;
      return acc;
    }, {});
    return Object.entries(totals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
  }, [goals]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="goals-loading">
          <div className="goals-spinner" />
          <div>Preparing your milestones...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container page-surface page-shell fade-in">
      <div className="page-shell__inner">
        <div className="page-header page-shell__header goals-header">
          <div>
            <h1 className="goals-title">
              Goals<span>.</span>
            </h1>
            <p className="stat-label">Track milestones with a cleaner planning workspace</p>
          </div>
          <div className="page-toolbar goals-header__actions">
            <button
              onClick={() => {
                exportGoalsToCSV(goals);
                showNotification('success', 'Goals exported successfully');
              }}
              className="glass-button hide-xs"
            >
              <Download size={18} />
            </button>
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="header-add-btn goals-add-btn"
            >
              <Plus size={20} /> Create Goal
            </button>
          </div>
        </div>

        <div className="page-shell__summary-grid goals-summary">
          {[
            {
              label: 'Saved So Far',
              value: `Rs. ${totalCurrent.toLocaleString()}`,
              note: `${overallProgress.toFixed(1)}% of total target`,
              color: '#1ea672',
              icon: Trophy,
            },
            {
              label: 'Still Needed',
              value: `Rs. ${remainingAmount.toLocaleString()}`,
              note: `${activeGoals} active goals`,
              color: '#f59e0b',
              icon: Clock,
            },
            {
              label: 'Completed',
              value: String(completedGoals),
              note: `${goals.length} total milestones`,
              color: '#22c55e',
              icon: CheckCircle2,
            },
          ].map((card) => (
            <div key={card.label} className="stat-card" style={{ minHeight: 'auto' }}>
              <div className="stat-card__glow" />
              <div className="goals-stat" style={{ color: card.color }}>
                <div
                  className="goals-stat__icon"
                  style={{ background: `${card.color}1a`, borderColor: `${card.color}33` }}
                >
                  <card.icon size={18} />
                </div>
                <div>
                  <div className="stat-label">{card.label}</div>
                  <div className="goals-stat__value">{card.value}</div>
                  <div className="stat-label">{card.note}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="premium-card page-shell__hero goals-hero">
          <div className="goals-hero__top">
            <div>
              <div className="goals-kicker">
                <Trophy size={16} /> Goal Progress
              </div>
              <div className="goals-hero__progress">{overallProgress.toFixed(1)}%</div>
            </div>
            <div className="goals-hero__stats">
              <div>
                <span className="stat-label">Retained</span>
                <strong>Rs. {totalCurrent.toLocaleString()}</strong>
              </div>
              <div>
                <span className="stat-label">Target</span>
                <strong>Rs. {totalTarget.toLocaleString()}</strong>
              </div>
              <div>
                <span className="stat-label">Closed</span>
                <strong>{completedGoals}</strong>
              </div>
            </div>
          </div>
          <div className="goals-progressbar">
            <div style={{ width: `${Math.min(overallProgress, 100)}%` }} />
          </div>
        </div>

        <div className="dashboard-grid page-split-layout page-split-layout--aside-340 goals-layout">
          <div>
            <div className="page-toolbar page-toolbar--spread goals-toolbar">
              <h3>Active Milestones</h3>
              <span className="stat-label">{goals.length} TARGETS FOUND</span>
            </div>

            <div className="goals-grid">
              {goals.length > 0 ? (
                goals.map((goal) => {
                  const progress =
                    goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
                  const isCompleted = progress >= 100;
                  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
                  return (
                    <div key={goal.id} className="premium-card goal-card-hover goals-card">
                      <div className="goals-card__head">
                        <div className="goals-card__identity">
                          <div
                            className="goals-card__badge"
                            style={{
                              background: isCompleted ? '#22c55e22' : '#1ea67222',
                              color: isCompleted ? '#22c55e' : '#1ea672',
                            }}
                          >
                            {isCompleted ? <CheckCircle2 size={22} /> : <Flame size={22} />}
                          </div>
                          <div>
                            <h3>{goal.name}</h3>
                            <span className="stat-label">{goal.category}</span>
                          </div>
                        </div>
                        <div className="goals-card__actions">
                          <button className="action-btn--hover" onClick={() => handleEdit(goal)}>
                            <Edit3 size={16} />
                          </button>
                          <button
                            className="action-btn-danger--hover"
                            onClick={async () => {
                              const confirmed = await customConfirm({
                                title: 'Remove Landmark',
                                message: `Permanently delete "${goal.name}"?`,
                                type: 'error',
                                confirmLabel: 'Delete',
                              });
                              if (confirmed) await deleteGoal(goal.id);
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="goals-card__progress">
                        <span>{progress.toFixed(0)}%</span>
                        <span className="stat-label">
                          {isCompleted
                            ? 'Goal Fully Met'
                            : `Rs. ${remaining.toLocaleString()} to go`}
                        </span>
                      </div>
                      <div className="goals-progressbar goals-progressbar--small">
                        <div
                          style={{
                            width: `${Math.min(progress, 100)}%`,
                            background: isCompleted ? '#22c55e' : '#1ea672',
                          }}
                        />
                      </div>
                      <div className="goals-card__meta">
                        <div>
                          <span className="stat-label">Target</span>
                          <strong>Rs. {goal.targetAmount.toLocaleString()}</strong>
                        </div>
                        <div>
                          <span className="stat-label">Saved</span>
                          <strong>Rs. {goal.currentAmount.toLocaleString()}</strong>
                        </div>
                        <div>
                          <span className="stat-label">Timeline</span>
                          <strong>
                            {goal.deadline
                              ? new Date(goal.deadline).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : 'Ongoing'}
                          </strong>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="goals-empty">
                  <EmptyGoalsVisual />
                  <p className="stat-label">Awaiting your first milestone definition.</p>
                </div>
              )}
            </div>
          </div>

          <div className="goals-rail">
            {nextGoal && (
              <div className="premium-card goals-spotlight">
                <div className="goals-kicker">
                  <Flame size={16} /> High Momentum
                </div>
                <h4>{nextGoal.name}</h4>
                <p>
                  Rs. {Math.max(nextGoal.targetAmount - nextGoal.currentAmount, 0).toLocaleString()}{' '}
                  more needed for victory
                </p>
                <div className="goals-progressbar goals-progressbar--light">
                  <div
                    style={{
                      width: `${Math.min((nextGoal.currentAmount / nextGoal.targetAmount) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
            <div className="premium-card goals-rail-card">
              <div className="stat-label">Category Focus</div>
              {topCategories.length > 0 ? (
                topCategories.map(([goalCategory, amount]) => (
                  <div key={goalCategory} className="goals-rail__row">
                    <div>
                      <strong>{goalCategory}</strong>
                      <span className="stat-label">
                        Rs. {amount.toLocaleString()} target allocation
                      </span>
                    </div>
                    <strong>
                      {totalTarget > 0 ? `${Math.round((amount / totalTarget) * 100)}%` : '0%'}
                    </strong>
                  </div>
                ))
              ) : (
                <div className="stat-label">Add a goal to unlock category insights.</div>
              )}
            </div>
            <div className="premium-card goals-rail-card">
              <div className="stat-label">Planning Rhythm</div>
              <div className="goals-rail__row">
                <div>
                  <strong>Average funded</strong>
                  <span className="stat-label">Per milestone</span>
                </div>
                <strong>Rs. {Math.round(averageFunding).toLocaleString()}</strong>
              </div>
              <div className="goals-rail__row">
                <div>
                  <strong>Completion rate</strong>
                  <span className="stat-label">Goals already closed</span>
                </div>
                <strong>{completionRate.toFixed(0)}%</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay fade-in">
          <div className="modal-card slide-up goals-modal">
            <div className="goals-modal__head">
              <div>
                <h2>{editId ? 'Edit Goal' : 'New Goal'}</h2>
                <p className="stat-label">Define your next milestone</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="modal-close">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="goals-form">
              <div>
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
              <div className="form-grid-2 goals-form__grid">
                <div>
                  <label className="form-label">Target (Rs.)</label>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="0.00"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Current (Rs.)</label>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="0.00"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-grid-2 goals-form__grid">
                <div>
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
                <div>
                  <label className="form-label">Target Date</label>
                  <input
                    className="form-input"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Why this goal matters and how you plan to reach it"
                />
              </div>
              {accounts.length > 0 && (
                <div>
                  <label className="form-label">Funding Account</label>
                  <select
                    className="form-input"
                    value={selectedAccountId}
                    onChange={(e) =>
                      setSelectedAccountId(e.target.value ? Number(e.target.value) : '')
                    }
                  >
                    <option value="">No account link</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} - Rs. {account.balance.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <button type="submit" className="btn-primary goals-submit">
                {editId ? 'Save Changes' : 'Launch Goal'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .goals-loading{display:flex;align-items:center;justify-content:center;min-height:60vh;gap:16px;color:#94a3b8}.goals-spinner{width:40px;height:40px;border:3px solid rgba(30,166,114,.1);border-top-color:#1ea672;border-radius:50%;animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.goals-title{font-size:clamp(2.4rem,6vw,3.5rem);font-weight:950;letter-spacing:-2px;font-family:var(--font-outfit)}.goals-title span{color:#1ea672}.goals-header,.goals-hero__top,.goals-card__head,.goals-card__progress,.goals-rail__row,.goals-modal__head{display:flex;justify-content:space-between;gap:16px}.goals-header{align-items:flex-end;flex-wrap:wrap}.goals-header__actions{justify-content:flex-end}.goals-add-btn{padding:14px 28px;border-radius:16px;background:linear-gradient(135deg,#1ea672 0%,#146d63 100%);box-shadow:0 12px 30px rgba(30,166,114,.25)}.goals-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))}.goals-stat{display:flex;gap:12px;align-items:flex-start;position:relative;z-index:1}.goals-stat__icon{width:40px;height:40px;border:1px solid;border-radius:12px;display:flex;align-items:center;justify-content:center}.goals-stat__value{font-size:clamp(1.6rem,4vw,2.2rem);font-weight:950;color:#fff}.goals-hero{padding:clamp(24px,5vw,48px);overflow:hidden;background:radial-gradient(circle at top right,rgba(30,166,114,.16),transparent 58%),rgba(255,255,255,.02)}.goals-kicker{display:flex;gap:8px;align-items:center;margin-bottom:14px;text-transform:uppercase;letter-spacing:1px;font-weight:900;font-size:.76rem;color:#a78bfa}.goals-hero__progress{font-size:clamp(3.2rem,11vw,5.8rem);font-weight:950;letter-spacing:-5px;line-height:.9;font-family:var(--font-outfit)}.goals-hero__stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:16px;min-width:min(100%,420px)}.goals-hero__stats strong,.goals-card__meta strong,.goals-rail__row strong{display:block;font-size:1rem;color:#fff}.goals-progressbar{height:12px;background:var(--surface-hover);border-radius:999px;overflow:hidden;border:1px solid var(--surface-border);margin-top:24px}.goals-progressbar div{height:100%;background:linear-gradient(90deg,#1ea672 0%,#34d399 100%);border-radius:999px}.goals-progressbar--small{height:6px;margin-top:0}.goals-progressbar--light{height:8px;background:rgba(255,255,255,.18);border:none}.goals-progressbar--light div{background:#fff}.goals-layout{gap:clamp(24px,4vw,40px);align-items:start}.goals-toolbar{margin-bottom:32px}.goals-toolbar h3{font-size:1.2rem;font-weight:950}.goals-grid,.goals-rail,.goals-form{display:grid;gap:20px}.goals-grid{grid-template-columns:repeat(auto-fill,minmax(min(100%,340px),1fr));gap:24px}.goals-card{padding:28px;display:grid;gap:22px;background:rgba(255,255,255,.01)}.goals-card__identity{display:flex;gap:14px;min-width:0;flex:1;align-items:center}.goals-card__identity h3{margin:0 0 6px;overflow-wrap:anywhere}.goals-card__badge{width:50px;height:50px;border-radius:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0}.goals-card__actions{display:flex;gap:8px}.goals-card__actions button{padding:10px;border:none;border-radius:12px;background:transparent;color:var(--text-secondary);cursor:pointer}.goals-card__meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:16px;padding-top:18px;border-top:1px solid var(--surface-border)}.goal-card-hover{transition:all .3s cubic-bezier(.16,1,.3,1)}.goal-card-hover:hover{transform:translateY(-4px) scale(1.02);background:rgba(15,25,30,.9)!important;border-color:var(--accent)!important;box-shadow:0 20px 40px rgba(0,0,0,.4),0 0 20px var(--accent-glow)!important}.goals-empty{grid-column:1/-1;padding:96px 32px;text-align:center;border:1px dashed var(--surface-border);border-radius:40px;background:rgba(255,255,255,.01)}.goals-empty p{margin-top:24px}.goals-spotlight{padding:28px;background:linear-gradient(135deg,#1ea672 0%,#146d63 100%);color:#fff;border:none;box-shadow:0 20px 40px rgba(30,166,114,.2)}.goals-spotlight h4{font-size:1.4rem;font-weight:950;margin:0 0 8px}.goals-spotlight p{margin:0 0 18px;opacity:.9}.goals-rail-card{padding:24px}.goals-rail__row{align-items:center;padding:14px 0;border-top:1px solid rgba(255,255,255,.06)}.goals-rail__row:first-of-type{border-top:none}.goals-rail__row div{display:grid;gap:4px}.goals-modal{max-width:520px;width:100%}.goals-modal__head h2{font-size:1.5rem;font-weight:800}.goals-form textarea{resize:vertical;min-height:110px}.goals-form__grid{display:grid;gap:16px}.goals-submit{margin-top:8px;padding:14px;font-size:1rem}.page-shell__inner{margin:0 auto}@media (max-width:1023px){.goals-hero__top{flex-direction:column}}@media (max-width:767px){.goals-header__actions{width:100%}.goals-header__actions>*{flex:1 1 180px}.goals-card__head,.goals-card__progress,.goals-rail__row,.goals-modal__head{flex-direction:column}.goals-card__actions{align-self:flex-end}}
      `}</style>
    </div>
  );
}
