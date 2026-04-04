'use client';

import { useMemo, useState } from 'react';
import { useNotifications } from '../components/NotificationContext';
import { useLedger, useSettings } from '../components/FinanceContext';
import { Transaction } from '@/lib/types';
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
  Briefcase,
  CalendarDays,
  Edit3,
  Plus,
  Trash2,
  Award,
  ArrowUpRight,
  CheckCircle2,
  ShieldCheck,
  Download,
  X,
} from 'lucide-react';
import { exportTransactionsToCSV } from '@/lib/utils/export';

const formatInr = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(value)
  );

export default function SalaryClient() {
  const { accounts, transactions, addTransaction, updateTransaction, deleteTransaction, loading } =
    useLedger();
  const { settings } = useSettings();
  const { showNotification, confirm: customConfirm } = useNotifications();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<number | ''>(
    settings.defaultSalaryAccountId || ''
  );

  const [amount, setAmount] = useState('');
  const [employer, setEmployer] = useState('');
  const [category, setCategory] = useState<'Salary' | 'Bonus'>('Salary');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Filter ONLY explicit Salary items (exclude Investment, Rents, Dividends, Business profits etc.)
  const salaryItems = useMemo(
    () =>
      transactions
        .filter(
          (item) => item.type === 'Income' && ['Salary', 'Bonus'].includes(String(item.category))
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions]
  );

  const stats = useMemo(() => {
    const total = salaryItems.reduce((sum, item) => sum + item.amount, 0);
    const thisYearStart = new Date(new Date().getFullYear(), 0, 1);
    const ytdItems = salaryItems.filter((item) => new Date(item.date) >= thisYearStart);
    const ytdTotal = ytdItems.reduce((sum, item) => sum + item.amount, 0);
    const monthlyAverage =
      ytdItems.length > 0
        ? ytdTotal / new Set(ytdItems.map((i) => i.date.substring(0, 7))).size
        : 0;

    return {
      total,
      ytdTotal,
      monthlyAverage,
      count: salaryItems.length,
      highest: salaryItems.length ? Math.max(...salaryItems.map((s) => s.amount)) : 0,
    };
  }, [salaryItems]);

  const monthlyData = useMemo(() => {
    const grouped = salaryItems.reduce(
      (acc, item) => {
        const current = new Date(item.date);
        const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        if (!acc[key]) {
          acc[key] = {
            key,
            label: current.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
            total: 0,
          };
        }
        acc[key].total += item.amount;
        return acc;
      },
      {} as Record<string, { key: string; label: string; total: number }>
    );
    return Object.values(grouped)
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-12); // Last 12 months for Salary chart
  }, [salaryItems]);

  const resetForm = () => {
    setAmount('');
    setEmployer('');
    setCategory('Salary');
    setDate(new Date().toISOString().split('T')[0]);
    setSelectedAccountId(settings.defaultSalaryAccountId || '');
    setEditId(null);
  };

  const handleEdit = (item: Transaction) => {
    setEditId(item.id);
    setAmount(item.amount.toString());
    setEmployer(item.description);
    setCategory(item.category as 'Salary' | 'Bonus');
    setDate(item.date);
    setSelectedAccountId(item.accountId || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!amount || !employer) return;

    const payload = {
      date,
      description: employer.trim(),
      category,
      type: 'Income' as const,
      amount: Number(amount),
      accountId: selectedAccountId ? Number(selectedAccountId) : undefined,
    };

    if (editId) {
      await updateTransaction(editId, payload);
      showNotification('success', 'Salary entry updated');
    } else {
      await addTransaction(payload);
      showNotification('success', 'Salary recorded');
    }

    setIsModalOpen(false);
    resetForm();
  };

  if (loading) return null;

  return (
    <div className="page-container page-surface fade-in">
      <div style={{ margin: '0 auto' }}>
        {/* Header - Ultra Minimalist Iris/Emerald Mix */}
        <div
          className="page-header"
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
              Salary<span style={{ color: '#10b981' }}>.</span>
            </h1>
            <p className="stat-label" style={{ fontSize: '0.85rem' }}>
              Your dedicated professional compensation tracker
            </p>
          </div>
          <div
            className="page-toolbar"
            style={{ display: 'flex', gap: '16px', alignItems: 'center' }}
          >
            <button
              onClick={() => {
                exportTransactionsToCSV(salaryItems);
                showNotification('success', 'Salary data exported successfully');
              }}
              className="glass-button hide-xs"
              style={{ padding: '14px 20px', borderRadius: '16px' }}
            >
              <Download size={18} />
            </button>
            <button
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

        {/* Hero Section - High-Impact Stat Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '32px',
            marginBottom: '64px',
          }}
        >
          {[
            {
              label: 'YTD Salary (Current Year)',
              value: formatInr(stats.ytdTotal),
              icon: <ArrowUpRight size={18} />,
              color: '#10b981',
              subtitle: 'Accumulated this calendar year',
            },
            {
              label: 'Monthly Average',
              value: formatInr(stats.monthlyAverage),
              icon: <CalendarDays size={18} />,
              color: '#34d399',
              subtitle: 'Average recurring payout block',
            },
            {
              label: 'Highest Payout',
              value: formatInr(stats.highest),
              icon: <Award size={18} />,
              color: '#0ea5e9',
              subtitle: 'Largest single credit to date',
            },
          ].map((card) => (
            <div
              key={card.label}
              className="premium-card"
              style={{ padding: '36px', position: 'relative' }}
            >
              <div
                style={{
                  background: `radial-gradient(circle at top right, ${card.color}22, transparent 70%)`,
                  position: 'absolute',
                  inset: 0,
                  opacity: 0.8,
                }}
              />
              <div style={{ position: 'relative' }}>
                <span
                  className="stat-label"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: card.color,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}
                >
                  {card.icon} {card.label}
                </span>
                <div
                  style={{
                    fontSize: '2.8rem',
                    fontWeight: 950,
                    letterSpacing: '-2px',
                    marginTop: '16px',
                  }}
                >
                  {card.value}
                </div>
                <p
                  className="stat-label"
                  style={{ marginTop: '16px', fontSize: '0.75rem', fontWeight: 600 }}
                >
                  {card.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Content Layout */}
        <div
          className="dashboard-grid page-split-layout page-split-layout--aside-340"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 340px',
            gap: '40px',
            alignItems: 'start',
          }}
        >
          {/* Main List & History */}
          <div>
            <div className="premium-card" style={{ padding: '32px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '40px',
                }}
              >
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900 }}>Compensation Trajectory</h3>
              </div>
              <div style={{ height: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
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
                      dy={10}
                    />
                    <YAxis
                      hide={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--text-tertiary)', fontSize: 11, fontWeight: 600 }}
                      domain={[0, 'auto']}
                      tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                    />
                    <RechartsTooltip
                      cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                      contentStyle={{
                        background: '#0a0a0a',
                        border: '1px solid var(--surface-border)',
                        borderRadius: '16px',
                        padding: '16px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                      }}
                      formatter={(value) => [`₹${(Number(value) || 0).toLocaleString()}`, 'Payout']}
                    />
                    <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={40}>
                      {monthlyData.map((entry, index) => (
                        <Cell
                          key={'cell-' + index}
                          fill={index === monthlyData.length - 1 ? '#10b981' : '#1ea672'}
                          fillOpacity={index === monthlyData.length - 1 ? 1 : 0.6}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ marginTop: '40px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px',
                }}
              >
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900 }}>Recent Paychecks</h3>
                <span className="stat-label" style={{ fontSize: '0.75rem' }}>
                  {salaryItems.length} Logged Entries
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {salaryItems.length > 0 ? (
                  salaryItems.map((item) => (
                    <div
                      key={item.id}
                      className="ledger-row-hover"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '24px',
                        borderRadius: '20px',
                        background: 'rgba(255,255,255,0.01)',
                        border: '1px solid var(--surface-border)',
                      }}
                    >
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '14px',
                          background:
                            item.category === 'Bonus'
                              ? 'rgba(6, 182, 212, 0.1)'
                              : 'rgba(16, 185, 129, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: item.category === 'Bonus' ? '#06b6d4' : '#10b981',
                          marginRight: '20px',
                        }}
                      >
                        {item.category === 'Bonus' ? <Award size={22} /> : <Briefcase size={22} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontWeight: 900,
                            fontSize: '1.1rem',
                            color: '#fff',
                            marginBottom: '4px',
                          }}
                        >
                          {item.description}
                        </div>
                        <div
                          className="stat-label"
                          style={{ fontSize: '0.75rem', fontWeight: 600 }}
                        >
                          {formatDate(item.date)} • Deposited to{' '}
                          <span style={{ color: '#94a3b8' }}>
                            {item.accountId
                              ? accounts.find((a) => a.id === item.accountId)?.name || 'Direct Link'
                              : 'External'}
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          textAlign: 'right',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '24px',
                        }}
                      >
                        <div style={{ fontWeight: 950, color: '#10b981', fontSize: '1.3rem' }}>
                          +{formatInr(item.amount)}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
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
                            onClick={async () => {
                              const ok = await customConfirm({
                                title: 'Delete Paycheck Log',
                                message: 'Permanently remove this salary/bonus entry?',
                                type: 'error',
                                confirmLabel: 'Delete',
                              });
                              if (ok) await deleteTransaction(item.id);
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
                  ))
                ) : (
                  <div
                    style={{
                      padding: '60px 20px',
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
                    <p className="stat-label">
                      Your professional tracking space is currently empty.
                    </p>
                    <p className="stat-label" style={{ marginTop: '8px' }}>
                      Log your first paycheck to ignite the charts.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}
            className="hide-md"
          >
            <div
              className="premium-card"
              style={{
                padding: '32px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), transparent)',
              }}
            >
              <h3
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 950,
                  marginBottom: '32px',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  color: '#10b981',
                }}
              >
                Compensation Integrity
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                This isolated module strictly tracks direct compensation payouts from your employers
                or core businesses.
                <br />
                <br />
                Dividends, real estate returns, and capital gains are filtered out to provide an
                undiluted view of your <b>direct earning power</b>.
              </p>
              <div
                style={{
                  marginTop: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: '#34d399',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}
              >
                <CheckCircle2 size={18} /> Verified Salary Sandbox
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Salary Modal */}
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
                  {editId ? 'Edit Entry' : 'Log Payroll'}
                </h2>
                <p className="stat-label">Record your direct professional compensation</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="modal-close">
                <X size={24} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="form-label">Employer or Business Source</label>
                <input
                  className="form-input"
                  placeholder="e.g. Acme Corp, Upwork..."
                  value={employer}
                  onChange={(e) => setEmployer(e.target.value)}
                  required
                />
              </div>

              <div
                className="form-grid-2"
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="form-label">Payout Amount (₹)</label>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="form-label">Payment Date</label>
                  <input
                    className="form-input"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div
                className="form-grid-2"
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="form-label">Compensation Type</label>
                  <select
                    className="form-input"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as 'Salary' | 'Bonus')}
                    required
                  >
                    <option value="Salary">Base Salary</option>
                    <option value="Bonus">Annual / KPI Bonus</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="form-label">Credit to Account (Optional)</label>
                  <select
                    className="form-input"
                    value={selectedAccountId}
                    onChange={(e) =>
                      setSelectedAccountId(e.target.value ? Number(e.target.value) : '')
                    }
                  >
                    <option value="">No Account Link</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{
                  marginTop: '16px',
                  padding: '16px',
                  fontSize: '1rem',
                  background: '#10b981',
                  color: '#fff',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
                }}
              >
                {editId ? 'Update Payout Details' : 'Verify & Log Paycheck'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .ledger-row-hover:hover {
          background: rgba(30, 41, 59, 0.4) !important;
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
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
