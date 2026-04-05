'use client';

import { useMemo, useState } from 'react';
import { useNotifications } from '../components/NotificationContext';
import { useLedger, useSettings } from '../components/FinanceContext';
import type { Transaction } from '@/lib/types';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Award,
  Briefcase,
  CalendarDays,
  Download,
  Edit3,
  Plus,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { exportTransactionsToCSV } from '@/lib/utils/export';
import { formatDateForInput } from '@/lib/utils/date';
import { buildMonthlyTotals } from '@/lib/utils/transaction-insights';
import {
  getSafeAccountSelectValue,
  getTransactionSaveErrorMessage,
  isKnownAccountId,
} from '@/lib/utils/transaction-form';

const SALARY_SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'trajectory', label: 'Trajectory' },
  { id: 'history', label: 'History' },
] as const;

type SalarySection = (typeof SALARY_SECTIONS)[number]['id'];

const formatInr = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(`${value}T00:00:00`)
  );

const sortTransactionsNewestFirst = (items: Transaction[]) =>
  [...items].sort((left, right) => {
    const dateCompare = right.date.localeCompare(left.date);
    return dateCompare !== 0 ? dateCompare : right.id - left.id;
  });

export default function SalaryClient() {
  const { accounts, transactions, addTransaction, updateTransaction, deleteTransaction, loading } =
    useLedger();
  const { settings } = useSettings();
  const { showNotification, confirm: customConfirm } = useNotifications();

  const safeDefaultAccountId = useMemo(
    () => getSafeAccountSelectValue(settings.defaultSalaryAccountId, accounts),
    [accounts, settings.defaultSalaryAccountId]
  );

  const [activeSection, setActiveSection] = useState<SalarySection>('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<number | ''>(safeDefaultAccountId);

  const [amount, setAmount] = useState('');
  const [employer, setEmployer] = useState('');
  const [category, setCategory] = useState<'Salary' | 'Bonus'>('Salary');
  const [date, setDate] = useState(formatDateForInput(new Date()));

  const effectiveSelectedAccountId =
    selectedAccountId === ''
      ? safeDefaultAccountId
      : isKnownAccountId(selectedAccountId, accounts)
        ? selectedAccountId
        : safeDefaultAccountId;

  const accountNameById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account.name])),
    [accounts]
  );

  const salaryItems = useMemo(
    () =>
      sortTransactionsNewestFirst(
        transactions.filter(
          (item) => item.type === 'Income' && ['Salary', 'Bonus'].includes(String(item.category))
        )
      ),
    [transactions]
  );

  const stats = useMemo(() => {
    const total = salaryItems.reduce((sum, item) => sum + item.amount, 0);
    const currentYear = new Date().getFullYear();
    const ytdItems = salaryItems.filter(
      (item) => new Date(`${item.date}T00:00:00`).getFullYear() === currentYear
    );
    const ytdTotal = ytdItems.reduce((sum, item) => sum + item.amount, 0);
    const activeMonths = new Set(ytdItems.map((item) => item.date.slice(0, 7))).size;

    return {
      total,
      ytdTotal,
      monthlyAverage: activeMonths > 0 ? ytdTotal / activeMonths : 0,
      count: salaryItems.length,
      highest: salaryItems.length > 0 ? Math.max(...salaryItems.map((item) => item.amount)) : 0,
    };
  }, [salaryItems]);

  const monthlyData = useMemo(() => buildMonthlyTotals(salaryItems, 12), [salaryItems]);
  const maxMonthlyTotal = Math.max(...monthlyData.map((item) => item.total), 1);

  const salaryOnlyTotal = salaryItems
    .filter((item) => String(item.category) === 'Salary')
    .reduce((sum, item) => sum + item.amount, 0);
  const bonusTotal = salaryItems
    .filter((item) => String(item.category) === 'Bonus')
    .reduce((sum, item) => sum + item.amount, 0);
  const bonusShare = stats.total > 0 ? (bonusTotal / stats.total) * 100 : 0;
  const latestPayout = salaryItems[0] ?? null;
  const recentPaychecks = salaryItems.slice(0, 4);
  const trajectoryHighlights = monthlyData
    .filter((item) => item.total > 0)
    .slice(-4)
    .reverse();

  const resetForm = () => {
    setAmount('');
    setEmployer('');
    setCategory('Salary');
    setDate(formatDateForInput(new Date()));
    setSelectedAccountId(safeDefaultAccountId);
    setEditId(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleEdit = (item: Transaction) => {
    setEditId(item.id);
    setAmount(item.amount.toString());
    setEmployer(item.description);
    setCategory(item.category as 'Salary' | 'Bonus');
    setDate(item.date);
    setSelectedAccountId(getSafeAccountSelectValue(item.accountId, accounts));
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const parsedAmount = Number(amount);

    if (!employer.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      showNotification('error', 'Enter a valid source and payout amount');
      return;
    }

    const payload = {
      date,
      description: employer.trim(),
      category,
      type: 'Income' as const,
      amount: parsedAmount,
      accountId: effectiveSelectedAccountId ? Number(effectiveSelectedAccountId) : undefined,
    };

    try {
      if (editId !== null) {
        await updateTransaction(editId, payload);
        showNotification('success', 'Salary entry updated');
      } else {
        await addTransaction(payload);
        showNotification('success', 'Salary recorded');
      }

      closeModal();
    } catch (error) {
      showNotification('error', getTransactionSaveErrorMessage(error, 'Failed to save paycheck'));
    }
  };

  const renderPaycheckRow = (item: Transaction, compact = false) => {
    const accountName = item.accountId
      ? (accountNameById.get(item.accountId) ?? 'No linked account')
      : 'No linked account';

    return (
      <div
        key={item.id}
        className="ledger-row-hover"
        style={{
          display: 'flex',
          alignItems: compact ? 'flex-start' : 'center',
          gap: '16px',
          padding: compact ? '18px 20px' : '24px',
          borderRadius: '20px',
          background: 'rgba(255,255,255,0.01)',
          border: '1px solid var(--surface-border)',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            width: compact ? '42px' : '48px',
            height: compact ? '42px' : '48px',
            borderRadius: '14px',
            background:
              item.category === 'Bonus' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: item.category === 'Bonus' ? '#06b6d4' : '#10b981',
            flexShrink: 0,
          }}
        >
          {item.category === 'Bonus' ? <Award size={20} /> : <Briefcase size={20} />}
        </div>

        <div style={{ flex: '1 1 220px', minWidth: 0 }}>
          <div
            style={{
              fontWeight: 900,
              fontSize: compact ? '1rem' : '1.08rem',
              color: '#fff',
              marginBottom: '4px',
            }}
          >
            {item.description}
          </div>
          <div className="stat-label" style={{ fontSize: '0.72rem', fontWeight: 600 }}>
            {formatDate(item.date)} · {item.category} · {accountName}
          </div>
        </div>

        <div
          style={{
            marginLeft: 'auto',
            textAlign: 'right',
            display: 'flex',
            alignItems: 'center',
            gap: compact ? '10px' : '18px',
            flexShrink: 0,
          }}
        >
          <div
            style={{ fontWeight: 950, color: '#10b981', fontSize: compact ? '1rem' : '1.24rem' }}
          >
            +{formatInr(item.amount)}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleEdit(item)}
              className="action-btn--hover"
              style={{
                padding: '10px',
                borderRadius: '12px',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              <Edit3 size={16} />
            </button>
            <button
              type="button"
              onClick={async () => {
                const ok = await customConfirm({
                  title: 'Delete paycheck log',
                  message: 'Permanently remove this salary or bonus entry?',
                  type: 'error',
                  confirmLabel: 'Delete',
                });

                if (!ok) {
                  return;
                }

                await deleteTransaction(item.id);
                showNotification('success', 'Paycheck removed');
              }}
              className="action-btn-danger--hover"
              style={{
                padding: '10px',
                borderRadius: '12px',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="page-container page-surface">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            color: '#94a3b8',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(16, 185, 129, 0.12)',
                borderTopColor: '#10b981',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px',
              }}
            />
            <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>Loading salary workspace...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container page-surface page-shell fade-in">
      <div className="page-shell__inner" style={{ margin: '0 auto' }}>
        <div
          className="page-header page-shell__header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: '20px',
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
              Salary<span style={{ color: '#10b981' }}>.</span>
            </h1>
            <p className="stat-label" style={{ fontSize: '0.85rem' }}>
              A cleaner salary tracking space with separate payout, trajectory, and history views
            </p>
          </div>

          <div
            className="page-toolbar"
            style={{ display: 'flex', gap: '16px', alignItems: 'center' }}
          >
            <button
              type="button"
              onClick={() => {
                exportTransactionsToCSV(
                  salaryItems.map((item) => ({
                    date: item.date,
                    source: item.description,
                    type: item.category,
                    account: item.accountId
                      ? (accountNameById.get(item.accountId) ?? 'No Account')
                      : 'No Account',
                    amount: item.amount,
                  })),
                  {
                    headers: ['date', 'source', 'type', 'account', 'amount'],
                    filenamePrefix: 'salary',
                  }
                );
                showNotification('success', 'Salary data exported');
              }}
              className="glass-button hide-xs"
              style={{ padding: '14px 20px', borderRadius: '16px' }}
            >
              <Download size={18} />
            </button>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="header-add-btn header-add-btn--green"
              style={{
                padding: '14px 28px',
                borderRadius: '16px',
                boxShadow: '0 12px 30px rgba(16, 185, 129, 0.25)',
                fontWeight: 800,
                letterSpacing: '0.5px',
              }}
            >
              <Plus size={20} /> Log Paycheck
            </button>
          </div>
        </div>

        <div
          className="page-shell__hero"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '24px',
            marginBottom: '28px',
          }}
        >
          {[
            {
              label: 'YTD Salary',
              value: formatInr(stats.ytdTotal),
              subtitle: 'Captured in the current calendar year',
              icon: <TrendingUp size={18} />,
              color: '#10b981',
            },
            {
              label: 'Monthly Average',
              value: formatInr(stats.monthlyAverage),
              subtitle: 'Average payout across active months',
              icon: <CalendarDays size={18} />,
              color: '#34d399',
            },
            {
              label: 'Highest Payout',
              value: formatInr(stats.highest),
              subtitle: latestPayout ? `Latest: ${latestPayout.category}` : 'No payouts logged yet',
              icon: <Award size={18} />,
              color: '#06b6d4',
            },
            {
              label: 'Lifetime Salary',
              value: formatInr(stats.total),
              subtitle: `${stats.count} total payout entr${stats.count === 1 ? 'y' : 'ies'}`,
              icon: <Wallet size={18} />,
              color: '#f59e0b',
            },
          ].map((card) => (
            <div
              key={card.label}
              className="premium-card"
              style={{ padding: '28px', position: 'relative' }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `radial-gradient(circle at top right, ${card.color}22, transparent 70%)`,
                  opacity: 0.85,
                }}
              />
              <div style={{ position: 'relative' }}>
                <div
                  className="stat-label"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: card.color,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {card.icon}
                  {card.label}
                </div>
                <div
                  style={{
                    fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                    fontWeight: 950,
                    letterSpacing: '-0.06em',
                    marginTop: '12px',
                    color: '#fff',
                  }}
                >
                  {card.value}
                </div>
                <p className="stat-label" style={{ marginTop: '10px', fontSize: '0.72rem' }}>
                  {card.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div
          className="mobile-tab-scroll page-tab-bar page-shell__tabs"
          style={{
            display: 'flex',
            width: 'fit-content',
            maxWidth: '100%',
            overflowX: 'auto',
            gap: '8px',
            padding: '6px',
            borderRadius: '20px',
            border: '1px solid var(--surface-border)',
            background: 'rgba(255,255,255,0.02)',
            marginBottom: '28px',
          }}
        >
          {SALARY_SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              style={{
                padding: '10px 18px',
                borderRadius: '16px',
                border: 'none',
                background: activeSection === section.id ? '#10b981' : 'transparent',
                color: activeSection === section.id ? '#fff' : 'var(--text-secondary)',
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {section.label}
            </button>
          ))}
        </div>

        {activeSection === 'overview' && (
          <div style={{ display: 'grid', gap: '24px' }}>
            <div
              className="dashboard-grid page-split-layout page-split-layout--aside-340"
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.2fr) minmax(300px, 0.8fr)',
                gap: '24px',
                alignItems: 'start',
              }}
            >
              <div
                className="premium-card"
                style={{ padding: '28px', display: 'grid', gap: '22px' }}
              >
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 900 }}>Compensation Split</h3>
                  <p className="stat-label" style={{ marginTop: '6px', fontSize: '0.68rem' }}>
                    Base salary and bonus are broken into separate sections for faster review
                  </p>
                </div>

                {[
                  {
                    label: 'Base Salary',
                    total: salaryOnlyTotal,
                    share: stats.total > 0 ? (salaryOnlyTotal / stats.total) * 100 : 0,
                    color: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
                  },
                  {
                    label: 'Bonus',
                    total: bonusTotal,
                    share: bonusShare,
                    color: 'linear-gradient(90deg, #06b6d4 0%, #38bdf8 100%)',
                  },
                ].map((item) => (
                  <div key={item.label} style={{ display: 'grid', gap: '8px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '12px',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ fontWeight: 800 }}>{item.label}</div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 900 }}>{formatInr(item.total)}</div>
                        <div className="stat-label" style={{ fontSize: '0.64rem' }}>
                          {item.share.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        height: '10px',
                        borderRadius: '999px',
                        background: 'rgba(255,255,255,0.06)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(item.share, 100)}%`,
                          height: '100%',
                          borderRadius: '999px',
                          background: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}

                <div
                  style={{
                    padding: '18px',
                    borderRadius: '18px',
                    border: '1px solid var(--surface-border)',
                    background: 'rgba(255,255,255,0.03)',
                  }}
                >
                  <div className="stat-label" style={{ color: '#86efac' }}>
                    Current pulse
                  </div>
                  <div style={{ marginTop: '8px', fontWeight: 800 }}>
                    {latestPayout
                      ? `${latestPayout.description} is your latest payout`
                      : 'Log your first paycheck to start the salary timeline'}
                  </div>
                  {latestPayout && (
                    <div className="stat-label" style={{ marginTop: '6px', fontSize: '0.68rem' }}>
                      {formatInr(latestPayout.amount)} on {formatDate(latestPayout.date)}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gap: '24px' }}>
                <div
                  className="premium-card"
                  style={{ padding: '24px', display: 'grid', gap: '16px' }}
                >
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 900 }}>Routing Snapshot</h3>
                    <p className="stat-label" style={{ marginTop: '6px', fontSize: '0.68rem' }}>
                      Where your latest salary entries land
                    </p>
                  </div>

                  {recentPaychecks.length > 0 ? (
                    recentPaychecks.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: '12px',
                          alignItems: 'center',
                          padding: '12px 14px',
                          borderRadius: '16px',
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid var(--surface-border)',
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 800,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {item.description}
                          </div>
                          <div
                            className="stat-label"
                            style={{ marginTop: '4px', fontSize: '0.64rem' }}
                          >
                            {item.accountId
                              ? (accountNameById.get(item.accountId) ?? 'No linked account')
                              : 'No linked account'}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 900, color: '#10b981' }}>
                            {formatInr(item.amount)}
                          </div>
                          <div
                            className="stat-label"
                            style={{ marginTop: '4px', fontSize: '0.64rem' }}
                          >
                            {item.category}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="stat-label">No salary entries yet.</div>
                  )}
                </div>

                <div
                  className="premium-card"
                  style={{ padding: '24px', display: 'grid', gap: '16px' }}
                >
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 900 }}>Recent Momentum</h3>
                    <p className="stat-label" style={{ marginTop: '6px', fontSize: '0.68rem' }}>
                      Latest active months from your trajectory
                    </p>
                  </div>

                  {trajectoryHighlights.length > 0 ? (
                    trajectoryHighlights.map((item) => (
                      <div
                        key={item.key}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: '12px',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800 }}>{item.label}</div>
                          <div
                            className="stat-label"
                            style={{ marginTop: '2px', fontSize: '0.64rem' }}
                          >
                            Salary trajectory checkpoint
                          </div>
                        </div>
                        <div style={{ fontWeight: 900 }}>{formatInr(item.total)}</div>
                      </div>
                    ))
                  ) : (
                    <div className="stat-label">Your monthly trajectory will appear here.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="premium-card" style={{ padding: '28px', display: 'grid', gap: '18px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 900 }}>Recent Paychecks</h3>
                  <p className="stat-label" style={{ marginTop: '6px', fontSize: '0.68rem' }}>
                    Quick access to the latest salary and bonus activity
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSection('history')}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '999px',
                    border: '1px solid var(--surface-border)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  Open full history
                </button>
              </div>

              <div style={{ display: 'grid', gap: '14px' }}>
                {recentPaychecks.length > 0 ? (
                  recentPaychecks.map((item) => renderPaycheckRow(item, true))
                ) : (
                  <div
                    style={{
                      padding: '56px 20px',
                      textAlign: 'center',
                      borderRadius: '24px',
                      border: '1px dashed var(--surface-border)',
                    }}
                  >
                    <ShieldCheck
                      size={44}
                      color="var(--surface-hover)"
                      style={{ margin: '0 auto 16px' }}
                    />
                    <p className="stat-label">
                      Log your first paycheck to activate salary tracking.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'trajectory' && (
          <div
            className="dashboard-grid page-split-layout page-split-layout--aside-340"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) 340px',
              gap: '24px',
              alignItems: 'start',
            }}
          >
            <div className="premium-card" style={{ padding: '28px', display: 'grid', gap: '22px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900 }}>Compensation Trajectory</h3>
                <p className="stat-label" style={{ marginTop: '6px', fontSize: '0.7rem' }}>
                  Twelve-month salary movement kept in a dedicated section instead of a long stacked
                  page
                </p>
              </div>

              <div style={{ height: '340px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 8, right: 10, left: -12, bottom: 0 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--text-tertiary)', fontSize: 11, fontWeight: 700 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--text-tertiary)', fontSize: 11, fontWeight: 600 }}
                      tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
                    />
                    <RechartsTooltip
                      cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      contentStyle={{
                        background: '#0a0a0a',
                        border: '1px solid var(--surface-border)',
                        borderRadius: '16px',
                        padding: '14px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                      }}
                      formatter={(value) => [formatInr(Number(value) || 0), 'Payout']}
                    />
                    <Bar dataKey="total" radius={[8, 8, 0, 0]} maxBarSize={36}>
                      {monthlyData.map((entry, index) => (
                        <Cell
                          key={`${entry.key}-${index}`}
                          fill={index === monthlyData.length - 1 ? '#10b981' : '#1ea672'}
                          fillOpacity={index === monthlyData.length - 1 ? 1 : 0.58}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '24px' }}>
              <div
                className="premium-card"
                style={{ padding: '24px', display: 'grid', gap: '16px' }}
              >
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 900 }}>Monthly Rollup</h3>
                  <p className="stat-label" style={{ marginTop: '6px', fontSize: '0.68rem' }}>
                    Active months in the current salary trajectory
                  </p>
                </div>

                {trajectoryHighlights.length > 0 ? (
                  trajectoryHighlights.map((item) => (
                    <div key={item.key} style={{ display: 'grid', gap: '8px' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: '12px',
                          alignItems: 'center',
                        }}
                      >
                        <div style={{ fontWeight: 800 }}>{item.label}</div>
                        <div style={{ fontWeight: 900 }}>{formatInr(item.total)}</div>
                      </div>
                      <div
                        style={{
                          height: '8px',
                          borderRadius: '999px',
                          background: 'rgba(255,255,255,0.05)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${(item.total / maxMonthlyTotal) * 100}%`,
                            height: '100%',
                            borderRadius: '999px',
                            background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
                          }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="stat-label">No monthly rollup yet.</div>
                )}
              </div>

              <div
                className="premium-card"
                style={{ padding: '24px', display: 'grid', gap: '14px' }}
              >
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 900 }}>Trajectory Note</h3>
                  <p className="stat-label" style={{ marginTop: '6px', fontSize: '0.68rem' }}>
                    Short summary for the latest salary path
                  </p>
                </div>

                <div
                  style={{
                    padding: '18px',
                    borderRadius: '18px',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.16)',
                  }}
                >
                  <div className="stat-label" style={{ color: '#86efac' }}>
                    Latest month
                  </div>
                  <div style={{ marginTop: '8px', fontWeight: 900 }}>
                    {trajectoryHighlights[0]
                      ? `${trajectoryHighlights[0].label} closed at ${formatInr(trajectoryHighlights[0].total)}`
                      : 'No salary months to summarize yet'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'history' && (
          <div className="premium-card" style={{ padding: '28px', display: 'grid', gap: '18px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900 }}>Salary History</h3>
                <p className="stat-label" style={{ marginTop: '6px', fontSize: '0.68rem' }}>
                  Full list of salary and bonus entries in one dedicated section
                </p>
              </div>
              <span className="stat-label" style={{ fontSize: '0.74rem' }}>
                {salaryItems.length} logged entr{salaryItems.length === 1 ? 'y' : 'ies'}
              </span>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              {salaryItems.length > 0 ? (
                salaryItems.map((item) => renderPaycheckRow(item))
              ) : (
                <div
                  style={{
                    padding: '70px 20px',
                    textAlign: 'center',
                    border: '1px dashed var(--surface-border)',
                    borderRadius: '24px',
                  }}
                >
                  <ShieldCheck
                    size={48}
                    color="var(--surface-hover)"
                    style={{ margin: '0 auto 20px' }}
                  />
                  <p className="stat-label">Your salary history is empty right now.</p>
                  <p className="stat-label" style={{ marginTop: '8px' }}>
                    Add a paycheck to start building the timeline.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay fade-in">
          <div className="modal-card slide-up" style={{ maxWidth: '500px', width: '100%' }}>
            <div
              className="page-toolbar page-toolbar--spread"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px',
              }}
            >
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>
                  {editId !== null ? 'Edit Paycheck' : 'Log Paycheck'}
                </h2>
                <p className="stat-label">Record direct salary or bonus income</p>
              </div>
              <button type="button" onClick={closeModal} className="modal-close">
                <X size={24} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="form-label">Employer or source</label>
                <input
                  className="form-input"
                  placeholder="e.g. Acme Corp, Consulting Client..."
                  value={employer}
                  onChange={(event) => setEmployer(event.target.value)}
                  required
                />
              </div>

              <div
                className="form-grid-2"
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="form-label">Payout amount</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="form-label">Payment date</label>
                  <input
                    className="form-input"
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    required
                  />
                </div>
              </div>

              <div
                className="form-grid-2"
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="form-label">Compensation type</label>
                  <select
                    className="form-input"
                    value={category}
                    onChange={(event) => setCategory(event.target.value as 'Salary' | 'Bonus')}
                    required
                  >
                    <option value="Salary">Base salary</option>
                    <option value="Bonus">Bonus</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="form-label">Credit to account</label>
                  <select
                    className="form-input"
                    value={effectiveSelectedAccountId}
                    onChange={(event) =>
                      setSelectedAccountId(event.target.value ? Number(event.target.value) : '')
                    }
                  >
                    <option value="">No account link</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{
                  marginTop: '8px',
                  padding: '16px',
                  fontSize: '1rem',
                  background: '#10b981',
                  color: '#fff',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
                }}
              >
                {editId !== null ? 'Update Paycheck' : 'Save Paycheck'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .ledger-row-hover:hover {
          background: rgba(30, 41, 59, 0.4) !important;
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.35);
        }

        .action-btn--hover:hover {
          background: rgba(255, 255, 255, 0.1) !important;
          color: #fff !important;
        }

        .action-btn-danger--hover:hover {
          background: rgba(239, 68, 68, 0.1) !important;
          color: #ef4444 !important;
        }
      `}</style>
    </div>
  );
}
