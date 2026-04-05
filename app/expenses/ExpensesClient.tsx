'use client';

import { useMemo, useState } from 'react';
import type { Transaction } from '@/lib/types';
import {
  Calendar,
  Car,
  Coffee,
  Download,
  Edit3,
  GraduationCap,
  Heart,
  Home,
  PiggyBank,
  Plus,
  Search,
  ShoppingBag,
  Tags,
  Trash2,
  TrendingDown,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import { useLedger, useSettings } from '../components/FinanceContext';
import { useNotifications } from '../components/NotificationContext';
import { EmptyTransactionsVisual } from '../components/Visuals';
import { formatDateForInput } from '@/lib/utils/date';
import { exportTransactionsToCSV } from '@/lib/utils/export';
import { formatCompactNumber, formatCurrency } from '@/lib/utils/number';
import {
  buildMonthlyTotals,
  COMMON_EXPENSE_CATEGORIES,
  filterTransactionsByTimeRange,
  matchesTransactionQuery,
  summarizeCategories,
  type TransactionTimeRange,
} from '@/lib/utils/transaction-insights';
import {
  getSafeAccountSelectValue,
  getTransactionSaveErrorMessage,
  isKnownAccountId,
} from '@/lib/utils/transaction-form';

const RANGE_OPTIONS: TransactionTimeRange[] = ['This Month', 'This Year', 'All Time'];
const EXPENSE_SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'trend', label: 'Trend' },
  { id: 'history', label: 'History' },
] as const;

type ExpenseSection = (typeof EXPENSE_SECTIONS)[number]['id'];

const sortTransactionsNewestFirst = (items: Transaction[]) =>
  [...items].sort((left, right) => {
    const dateCompare = right.date.localeCompare(left.date);
    return dateCompare !== 0 ? dateCompare : right.id - left.id;
  });

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Food':
      return <Coffee size={20} />;
    case 'Transport':
    case 'Travel':
      return <Car size={20} />;
    case 'Shopping':
      return <ShoppingBag size={20} />;
    case 'Healthcare':
      return <Heart size={20} />;
    case 'Education':
      return <GraduationCap size={20} />;
    case 'Utilities':
      return <Zap size={20} />;
    case 'Rent':
    case 'Entertainment':
      return <Home size={20} />;
    default:
      return <Wallet size={20} />;
  }
};

export default function ExpensesClient() {
  const { accounts, transactions, addTransaction, updateTransaction, deleteTransaction, loading } =
    useLedger();
  const { settings } = useSettings();
  const { showNotification, confirm: customConfirm } = useNotifications();

  const safeDefaultAccountId = useMemo(
    () => getSafeAccountSelectValue(settings.defaultSalaryAccountId, accounts),
    [accounts, settings.defaultSalaryAccountId]
  );

  const [activeSection, setActiveSection] = useState<ExpenseSection>('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [activeRange, setActiveRange] = useState<TransactionTimeRange>('This Month');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedAccountId, setSelectedAccountId] = useState<number | ''>(safeDefaultAccountId);

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(COMMON_EXPENSE_CATEGORIES[0]);
  const [date, setDate] = useState(formatDateForInput(new Date()));

  const accountNameById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account.name])),
    [accounts]
  );

  const baseExpenseItems = useMemo(
    () =>
      sortTransactionsNewestFirst(
        transactions.filter(
          (transaction) =>
            transaction.type === 'Expense' &&
            !['Investment', 'Stocks', 'Mutual Funds', 'Bonds'].includes(
              String(transaction.category)
            )
        )
      ),
    [transactions]
  );

  const rangedExpenseItems = useMemo(
    () => filterTransactionsByTimeRange(baseExpenseItems, activeRange),
    [activeRange, baseExpenseItems]
  );

  const availableCategories = useMemo(
    () =>
      [...new Set(rangedExpenseItems.map((item) => String(item.category || 'Other')))].sort(
        (left, right) => left.localeCompare(right)
      ),
    [rangedExpenseItems]
  );

  const effectiveSelectedCategory =
    selectedCategory !== 'All' && !availableCategories.includes(selectedCategory)
      ? 'All'
      : selectedCategory;

  const effectiveSelectedAccountId =
    selectedAccountId === ''
      ? safeDefaultAccountId
      : isKnownAccountId(selectedAccountId, accounts)
        ? selectedAccountId
        : safeDefaultAccountId;

  const categoryScopedItems = useMemo(
    () =>
      rangedExpenseItems.filter(
        (item) =>
          effectiveSelectedCategory === 'All' || String(item.category) === effectiveSelectedCategory
      ),
    [effectiveSelectedCategory, rangedExpenseItems]
  );

  const visibleExpenseItems = useMemo(
    () =>
      categoryScopedItems.filter((item) =>
        matchesTransactionQuery(
          item,
          searchQuery,
          item.accountId ? (accountNameById.get(item.accountId) ?? '') : ''
        )
      ),
    [accountNameById, categoryScopedItems, searchQuery]
  );

  const totalExpenses = visibleExpenseItems.reduce((sum, item) => sum + item.amount, 0);
  const averageTicket =
    visibleExpenseItems.length > 0 ? totalExpenses / visibleExpenseItems.length : 0;

  const monthsInScope =
    activeRange === 'This Month'
      ? 1
      : Math.max(1, new Set(visibleExpenseItems.map((item) => item.date.substring(0, 7))).size);

  const avgMonthlySpending = totalExpenses / monthsInScope;
  const largestExpense = visibleExpenseItems.reduce<Transaction | null>(
    (largest, current) => (largest === null || current.amount > largest.amount ? current : largest),
    null
  );

  const insightExpenseItems = searchQuery.trim() ? visibleExpenseItems : categoryScopedItems;
  const categoryBreakdown = useMemo(
    () => summarizeCategories(insightExpenseItems).slice(0, 6),
    [insightExpenseItems]
  );
  const topCategory = categoryBreakdown[0];

  const monthlyData = useMemo(
    () => buildMonthlyTotals(insightExpenseItems, 6),
    [insightExpenseItems]
  );
  const maxMonthSpend = Math.max(...monthlyData.map((item) => item.total), 1);
  const historyVisibleLimit = activeSection === 'history' ? visibleExpenseItems.length : 18;
  const latestExpense = visibleExpenseItems[0] ?? null;
  const activeExpenseFilterCount =
    (activeRange !== 'This Month' ? 1 : 0) +
    (effectiveSelectedCategory !== 'All' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const handleExport = () => {
    if (visibleExpenseItems.length === 0) {
      showNotification('error', 'No expense rows match the current filters');
      return;
    }

    exportTransactionsToCSV(
      visibleExpenseItems.map((item) => ({
        date: item.date,
        description: item.description,
        category: item.category,
        account: item.accountId
          ? (accountNameById.get(item.accountId) ?? 'No Account')
          : 'No Account',
        type: item.type,
        amount: item.amount,
      })),
      {
        headers: ['date', 'description', 'category', 'account', 'type', 'amount'],
        filenamePrefix: 'expenses',
      }
    );

    showNotification('success', 'Filtered expenses exported');
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setCategory(COMMON_EXPENSE_CATEGORIES[0]);
    setDate(formatDateForInput(new Date()));
    setSelectedAccountId(safeDefaultAccountId);
    setEditId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (item: Transaction) => {
    setEditId(item.id);
    setAmount(item.amount.toString());
    setDescription(item.description);
    setCategory(String(item.category || 'Other'));
    setDate(item.date);
    setSelectedAccountId(getSafeAccountSelectValue(item.accountId, accounts));
    setIsModalOpen(true);
  };

  const handleLogExpense = async (event: React.FormEvent) => {
    event.preventDefault();

    const parsedAmount = Number(amount);

    if (
      !description.trim() ||
      !category.trim() ||
      Number.isNaN(parsedAmount) ||
      parsedAmount <= 0
    ) {
      showNotification('error', 'Enter a valid description, category, and amount');
      return;
    }

    const payload = {
      date,
      description: description.trim(),
      category: category.trim(),
      type: 'Expense' as const,
      amount: parsedAmount,
      accountId: effectiveSelectedAccountId ? Number(effectiveSelectedAccountId) : undefined,
    };

    try {
      if (editId !== null) {
        await updateTransaction(editId, payload);
        showNotification('success', 'Expense record updated');
      } else {
        await addTransaction(payload);
        showNotification('success', 'Expense saved');
      }

      resetForm();
      setIsModalOpen(false);
    } catch (error) {
      showNotification('error', getTransactionSaveErrorMessage(error, 'Failed to save expense'));
    }
  };

  if (loading) {
    return (
      <div className="page-container">
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
                border: '3px solid rgba(30, 166, 114, 0.1)',
                borderTopColor: '#1ea672',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px',
              }}
            />
            <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>Loading your expenses...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container page-surface page-shell">
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
              fontSize: '3rem',
              fontWeight: 950,
              letterSpacing: '-2px',
              fontFamily: 'var(--font-outfit)',
            }}
          >
            Expenses<span style={{ color: 'var(--error)' }}>.</span>
          </h1>
          <p className="stat-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Filterable spend tracking with sharper category and monthly insight
          </p>
        </div>

        <div className="page-toolbar" style={{ justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={handleExport}
            className="secondary-btn hide-xs"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 18px',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--surface-border)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            <Download size={18} /> Export
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="header-add-btn header-add-btn--red"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 24px',
              borderRadius: '16px',
              boxShadow: '0 12px 30px rgba(239, 68, 68, 0.2)',
            }}
          >
            <Plus size={20} /> New Expense
          </button>
        </div>
      </div>

      <div className="premium-card" style={{ padding: '24px', display: 'grid', gap: '18px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div className="page-tab-bar" style={{ display: 'flex', gap: '8px' }}>
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setActiveRange(option)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '999px',
                  border:
                    activeRange === option
                      ? '1px solid rgba(239, 93, 93, 0.35)'
                      : '1px solid transparent',
                  background:
                    activeRange === option ? 'rgba(239, 93, 93, 0.12)' : 'var(--surface-hover)',
                  color: activeRange === option ? '#ffd9d9' : 'var(--text-secondary)',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {option}
              </button>
            ))}
          </div>

          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              minWidth: 'min(100%, 280px)',
              flex: '1 1 280px',
              maxWidth: '420px',
            }}
          >
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '14px',
                color: 'var(--text-secondary)',
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search description, category, or account"
              className="form-input"
              style={{
                width: '100%',
                paddingLeft: '42px',
                borderRadius: '999px',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            style={{
              padding: '9px 14px',
              borderRadius: '999px',
              border: '1px solid transparent',
              background:
                effectiveSelectedCategory === 'All' ? 'var(--error-light)' : 'var(--surface-hover)',
              color: effectiveSelectedCategory === 'All' ? 'var(--error)' : 'var(--text-secondary)',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            All Categories
          </button>
          {availableCategories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setSelectedCategory(item)}
              style={{
                padding: '9px 14px',
                borderRadius: '999px',
                border: '1px solid transparent',
                background:
                  effectiveSelectedCategory === item
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'var(--surface-hover)',
                color:
                  effectiveSelectedCategory === item
                    ? 'var(--text-primary)'
                    : 'var(--text-secondary)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div
        className="page-shell__hero"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '24px',
        }}
      >
        {[
          {
            label: 'Total Outflow',
            value: formatCurrency(totalExpenses),
            subtitle: `${visibleExpenseItems.length} matching expense entr${visibleExpenseItems.length === 1 ? 'y' : 'ies'}`,
            icon: <TrendingDown size={20} />,
            accent: 'var(--error)',
            glow: 'var(--error-light)',
          },
          {
            label: 'Monthly Velocity',
            value: formatCurrency(avgMonthlySpending),
            subtitle: `Average across ${monthsInScope} active month${monthsInScope === 1 ? '' : 's'}`,
            icon: <Calendar size={20} />,
            accent: 'var(--warning)',
            glow: 'var(--warning-light)',
          },
          {
            label: 'Average Ticket',
            value: formatCurrency(averageTicket),
            subtitle: largestExpense
              ? `Largest spend: ${formatCurrency(largestExpense.amount)}`
              : 'No expense in scope yet',
            icon: <Wallet size={20} />,
            accent: 'var(--accent)',
            glow: 'var(--accent-light)',
          },
          {
            label: 'Top Category',
            value: topCategory ? topCategory.name : 'No data',
            subtitle: topCategory
              ? `${formatCurrency(topCategory.total)} across ${topCategory.count} entr${
                  topCategory.count === 1 ? 'y' : 'ies'
                }`
              : 'Add an expense to unlock the category mix',
            icon: <Tags size={20} />,
            accent: '#8b5cf6',
            glow: 'rgba(139, 92, 246, 0.14)',
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
                background: `radial-gradient(circle at top right, ${card.glow}, transparent 70%)`,
                opacity: 0.9,
              }}
            />
            <div style={{ position: 'relative' }}>
              <div
                className="stat-label"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', color: card.accent }}
              >
                {card.icon}
                {card.label}
              </div>
              <div
                style={{
                  fontSize: 'clamp(1.5rem, 4vw, 2.6rem)',
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
          marginTop: '28px',
        }}
      >
        {EXPENSE_SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setActiveSection(section.id)}
            style={{
              padding: '10px 18px',
              borderRadius: '16px',
              border: 'none',
              background: activeSection === section.id ? 'var(--error)' : 'transparent',
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

      {activeSection !== 'trend' && (
        <div
          className="dashboard-grid page-split-layout page-split-layout--aside-360"
          style={{
            display: 'grid',
            gridTemplateColumns:
              activeSection === 'history' ? 'minmax(0, 1fr)' : 'minmax(0, 1fr) 360px',
            gap: '32px',
            alignItems: 'start',
            marginTop: '32px',
          }}
        >
          <div className="premium-card" style={{ padding: '24px', display: 'grid', gap: '18px' }}>
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
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900 }}>
                  {activeSection === 'history' ? 'Expense History' : 'Recent Expenses'}
                </h3>
                <p className="stat-label" style={{ marginTop: '6px', fontSize: '0.7rem' }}>
                  {activeSection === 'history'
                    ? 'Full filtered expense log for the selected view'
                    : 'Sorted by newest activity first'}
                </p>
              </div>

              {(effectiveSelectedCategory !== 'All' || searchQuery.trim()) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('All');
                    setSearchQuery('');
                  }}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '999px',
                    border: '1px solid var(--surface-border)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {visibleExpenseItems.length > 0 ? (
                visibleExpenseItems.slice(0, historyVisibleLimit).map((item) => {
                  const accountName = item.accountId
                    ? (accountNameById.get(item.accountId) ?? 'No Account')
                    : 'No Account';

                  return (
                    <div
                      key={item.id}
                      className="expense-row-hover"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '18px 20px',
                        borderRadius: '20px',
                        background: 'rgba(255, 255, 255, 0.01)',
                        border: '1px solid var(--surface-border)',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '16px',
                          background: 'var(--surface-hover)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-secondary)',
                          flexShrink: 0,
                        }}
                      >
                        {getCategoryIcon(String(item.category))}
                      </div>

                      <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: '1rem',
                            marginBottom: '4px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.description}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            gap: '10px',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            fontSize: '0.74rem',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          <span
                            style={{
                              padding: '4px 8px',
                              borderRadius: '999px',
                              background: 'var(--surface-hover)',
                              color: '#d4e1df',
                              fontWeight: 700,
                            }}
                          >
                            {item.category}
                          </span>
                          <span>
                            {new Date(`${item.date}T00:00:00`).toLocaleDateString('en-IN')}
                          </span>
                          <span>{accountName}</span>
                        </div>
                      </div>

                      <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontWeight: 900, color: '#ff7a7a', fontSize: '1.05rem' }}>
                          -{formatCurrency(item.amount)}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
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
                          type="button"
                          onClick={async () => {
                            const confirmed = await customConfirm({
                              title: 'Delete expense',
                              message: 'This action cannot be undone.',
                              type: 'error',
                              confirmLabel: 'Delete',
                            });

                            if (!confirmed) {
                              return;
                            }

                            await deleteTransaction(item.id);
                            showNotification('success', 'Expense deleted');
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
                  );
                })
              ) : (
                <div
                  style={{
                    padding: '90px 32px',
                    textAlign: 'center',
                    background: 'rgba(255,255,255,0.01)',
                    borderRadius: '28px',
                    border: '1px dashed var(--surface-border)',
                  }}
                >
                  <EmptyTransactionsVisual />
                  <p className="stat-label" style={{ marginTop: '22px' }}>
                    No expenses match the current view yet
                  </p>
                </div>
              )}
            </div>
          </div>

          {activeSection === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div
                className="premium-card"
                style={{ padding: '24px', display: 'grid', gap: '18px' }}
              >
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 900 }}>View Summary</h3>
                  <p className="stat-label" style={{ marginTop: '6px', fontSize: '0.68rem' }}>
                    Fast context for the current spending view without repeating trend widgets
                  </p>
                </div>

                {[
                  {
                    label: 'Range',
                    value: activeRange,
                    meta: `${monthsInScope} active month${monthsInScope === 1 ? '' : 's'}`,
                  },
                  {
                    label: 'Focus',
                    value: topCategory ? topCategory.name : 'No category yet',
                    meta: topCategory
                      ? formatCurrency(topCategory.total)
                      : 'Add expenses to unlock insight',
                  },
                  {
                    label: 'Filters',
                    value: `${activeExpenseFilterCount}`,
                    meta: activeExpenseFilterCount === 0 ? 'Default view' : 'Active refinements',
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '16px',
                      border: '1px solid var(--surface-border)',
                      background: 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <div className="stat-label">{item.label}</div>
                    <div style={{ marginTop: '8px', fontWeight: 900, color: '#fff' }}>
                      {item.value}
                    </div>
                    <div className="stat-label" style={{ marginTop: '4px', fontSize: '0.66rem' }}>
                      {item.meta}
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="premium-card"
                style={{ padding: '24px', display: 'grid', gap: '18px' }}
              >
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 900 }}>Current Signal</h3>
                  <p className="stat-label" style={{ marginTop: '6px', fontSize: '0.68rem' }}>
                    What matters most right now in the selected expense scope
                  </p>
                </div>

                <div
                  style={{
                    padding: '16px',
                    borderRadius: '18px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--surface-border)',
                  }}
                >
                  <div
                    className="stat-label"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <PiggyBank size={16} />
                    Largest spend
                  </div>
                  <div style={{ marginTop: '10px', fontWeight: 800 }}>
                    {largestExpense
                      ? `${largestExpense.description} is the largest expense in view`
                      : 'Start logging spending to surface larger trends'}
                  </div>
                  {largestExpense && (
                    <div className="stat-label" style={{ marginTop: '6px', fontSize: '0.68rem' }}>
                      {formatCurrency(largestExpense.amount)} on{' '}
                      {new Date(`${largestExpense.date}T00:00:00`).toLocaleDateString('en-IN')}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    padding: '16px',
                    borderRadius: '18px',
                    background: 'rgba(239, 93, 93, 0.08)',
                    border: '1px solid rgba(239, 93, 93, 0.16)',
                  }}
                >
                  <div className="stat-label" style={{ color: '#ffc9c9' }}>
                    Latest logged expense
                  </div>
                  <div style={{ marginTop: '8px', fontWeight: 900, color: '#fff' }}>
                    {latestExpense ? latestExpense.description : 'No recent expense yet'}
                  </div>
                  <div className="stat-label" style={{ marginTop: '6px', fontSize: '0.68rem' }}>
                    {latestExpense
                      ? `${formatCurrency(latestExpense.amount)} · ${new Date(
                          `${latestExpense.date}T00:00:00`
                        ).toLocaleDateString('en-IN')}`
                      : 'Use the New Expense button to start the stream'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSection === 'trend' && (
        <div
          className="dashboard-grid page-split-layout"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            alignItems: 'start',
            marginTop: '32px',
          }}
        >
          <div className="premium-card" style={{ padding: '24px', display: 'grid', gap: '18px' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 900 }}>Category Mix</h3>
              <p className="stat-label" style={{ marginTop: '6px', fontSize: '0.68rem' }}>
                Top spend buckets for the selected period
              </p>
            </div>

            {categoryBreakdown.length > 0 ? (
              categoryBreakdown.map((item) => (
                <div key={item.name} style={{ display: 'grid', gap: '8px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '12px',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: '#f4f8f7' }}>{item.name}</div>
                      <div className="stat-label" style={{ fontSize: '0.64rem', marginTop: '2px' }}>
                        {item.count} entr{item.count === 1 ? 'y' : 'ies'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800 }}>{formatCurrency(item.total)}</div>
                      <div className="stat-label" style={{ fontSize: '0.64rem', marginTop: '2px' }}>
                        {item.share.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      borderRadius: '999px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(item.share, 100)}%`,
                        height: '100%',
                        borderRadius: '999px',
                        background: 'linear-gradient(90deg, #ef5d5d 0%, #f59e0b 100%)',
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="stat-label">No category data yet.</div>
            )}
          </div>

          <div className="premium-card" style={{ padding: '24px', display: 'grid', gap: '18px' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 900 }}>Monthly Trend</h3>
              <p className="stat-label" style={{ marginTop: '6px', fontSize: '0.68rem' }}>
                Last 6 calendar months
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                gap: '10px',
                minHeight: '180px',
              }}
            >
              {monthlyData.map((item, index) => {
                const isCurrentMonth = index === monthlyData.length - 1;

                return (
                  <div
                    key={item.key}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <span className="stat-label" style={{ fontSize: '0.62rem' }}>
                      {item.total > 0 ? formatCompactNumber(item.total) : '-'}
                    </span>
                    <div
                      style={{
                        width: '100%',
                        minHeight: item.total > 0 ? '10px' : '4px',
                        height: `${(item.total / maxMonthSpend) * 100}%`,
                        borderRadius: '10px 10px 4px 4px',
                        background: isCurrentMonth
                          ? 'linear-gradient(180deg, #ff857a 0%, #ef5d5d 100%)'
                          : 'var(--surface-hover)',
                        border: isCurrentMonth ? 'none' : '1px solid var(--surface-border)',
                      }}
                    />
                    <span className="stat-label" style={{ fontSize: '0.64rem' }}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                padding: '16px',
                borderRadius: '18px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--surface-border)',
              }}
            >
              <div
                className="stat-label"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <PiggyBank size={16} />
                Current signal
              </div>
              <div style={{ marginTop: '10px', fontWeight: 800 }}>
                {largestExpense
                  ? `${largestExpense.description} is the largest expense in view`
                  : 'Start logging spending to surface larger trends'}
              </div>
              {largestExpense && (
                <div className="stat-label" style={{ marginTop: '6px', fontSize: '0.68rem' }}>
                  {formatCurrency(largestExpense.amount)} on{' '}
                  {new Date(`${largestExpense.date}T00:00:00`).toLocaleDateString('en-IN')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div
          className="modal-overlay"
          style={{ backdropFilter: 'blur(30px) saturate(200%)', background: 'rgba(0,0,0,0.6)' }}
        >
          <div
            className="modal-card"
            style={{ maxWidth: '560px', width: '100%', padding: '40px', borderRadius: '32px' }}
          >
            <div
              className="page-toolbar page-toolbar--spread"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: '28px',
              }}
            >
              <div>
                <h2 style={{ fontSize: '2rem', fontWeight: 950, letterSpacing: '-1.5px' }}>
                  {editId !== null ? 'Update Expense' : 'Log Expense'}
                </h2>
                <p className="stat-label" style={{ fontSize: '0.7rem' }}>
                  Keep your outflow clean and attributable
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="modal-close"
                style={{ position: 'relative', top: 'auto', right: 'auto' }}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleLogExpense}
              style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label className="form-label" style={{ fontSize: '0.7rem' }}>
                  Description
                </label>
                <input
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Groceries, cab fare, subscriptions..."
                  required
                  className="form-input"
                  style={{ fontSize: '1rem', padding: '18px', borderRadius: '18px' }}
                  autoFocus
                />
              </div>

              <div
                className="form-grid-2"
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>
                    Amount
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    required
                    className="form-input"
                    style={{ fontSize: '1rem', padding: '18px', borderRadius: '18px' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className="form-input"
                    style={{ fontSize: '1rem', padding: '18px', borderRadius: '18px' }}
                  />
                </div>
              </div>

              <div
                className="form-grid-2"
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="form-input"
                    style={{ fontSize: '1rem', padding: '18px', borderRadius: '18px' }}
                  >
                    {COMMON_EXPENSE_CATEGORIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>
                    Account
                  </label>
                  <select
                    value={effectiveSelectedAccountId}
                    onChange={(event) =>
                      setSelectedAccountId(event.target.value ? Number(event.target.value) : '')
                    }
                    className="form-input"
                    style={{ fontSize: '1rem', padding: '18px', borderRadius: '18px' }}
                  >
                    <option value="">No Account</option>
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
                className="btn-primary btn-primary--red"
                style={{
                  padding: '20px',
                  borderRadius: '22px',
                  fontSize: '1rem',
                  fontWeight: 900,
                  marginTop: '6px',
                  boxShadow: '0 20px 40px rgba(239, 68, 68, 0.25)',
                }}
              >
                {editId !== null ? 'Save Changes' : 'Save Expense'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .expense-row-hover:hover {
          background: var(--surface-hover);
        }

        .action-btn--hover:hover {
          background: var(--accent-light);
          color: var(--accent-hover) !important;
        }

        .action-btn-danger--hover:hover {
          background: var(--error-light);
          color: var(--error) !important;
        }
      `}</style>
    </div>
  );
}
