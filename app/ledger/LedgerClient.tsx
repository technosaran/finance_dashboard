'use client';

import { CSSProperties, FormEvent, useMemo, useState } from 'react';
import { Transaction } from '@/lib/types';
import {
  ArrowDownRight,
  ArrowUpRight,
  Download,
  Edit3,
  Plus,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import { useLedger } from '../components/FinanceContext';
import { useNotifications } from '../components/NotificationContext';
import { EmptyTransactionsVisual } from '../components/Visuals';
import { exportTransactionsToCSV } from '../../lib/utils/export';

const currencySymbol = '\u20B9';
const tableHeaders: Array<{ label: string; align?: CSSProperties['textAlign'] }> = [
  { label: 'Entry' },
  { label: 'Category' },
  { label: 'Type' },
  { label: 'Account' },
  { label: 'Date' },
  { label: 'Amount', align: 'right' },
  { label: 'Actions', align: 'right' },
];

const getHeaderCellStyle = (align: CSSProperties['textAlign'] = 'left'): CSSProperties => ({
  padding: '16px 18px',
  textAlign: align,
  color: '#7e928e',
  fontSize: '0.72rem',
  fontWeight: 900,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  position: 'sticky',
  top: 0,
  background: 'rgba(6, 12, 16, 0.96)',
  zIndex: 1,
});

const getBodyCellStyle = (align: CSSProperties['textAlign'] = 'left'): CSSProperties => ({
  padding: '18px',
  borderTop: '1px solid rgba(255, 255, 255, 0.04)',
  verticalAlign: 'middle',
  textAlign: align,
});

const getPillStyle = (background: string, color: string): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '4px 10px',
  borderRadius: '999px',
  background,
  color,
  fontSize: '0.72rem',
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
});

export default function LedgerClient() {
  const { transactions, accounts, addTransaction, updateTransaction, deleteTransaction, loading } =
    useLedger();
  const { showNotification, confirm: customConfirm } = useNotifications();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'Income' | 'Expense'>('Expense');
  const [accountId, setAccountId] = useState<string>('');

  const accountNameById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account.name])),
    [accounts]
  );

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((left, right) => {
      const dateCompare = right.date.localeCompare(left.date);
      return dateCompare !== 0 ? dateCompare : right.id - left.id;
    });
  }, [transactions]);

  const formatCurrency = (value: number) => `${currencySymbol}${value.toLocaleString()}`;
  const formatDate = (value: string) =>
    new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const resetForm = () => {
    setDescription('');
    setCategory('');
    setAmount('');
    setType('Expense');
    setDate(new Date().toISOString().split('T')[0]);
    setAccountId('');
    setEditId(null);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditId(transaction.id);
    setDescription(transaction.description);
    setCategory(String(transaction.category));
    setAmount(transaction.amount.toString());
    setType(transaction.type);
    setDate(transaction.date);
    setAccountId(transaction.accountId ? transaction.accountId.toString() : '');
    setIsModalOpen(true);
  };

  const handleAddTransaction = async (event: FormEvent) => {
    event.preventDefault();
    if (!description || !amount || !category) return;

    const transactionData = {
      date,
      description,
      category,
      type,
      amount: parseFloat(amount),
      accountId: accountId ? parseInt(accountId, 10) : undefined,
    };

    try {
      if (editId) {
        await updateTransaction(editId, transactionData);
        showNotification('success', 'Transaction updated successfully');
      } else {
        await addTransaction(transactionData);
        showNotification('success', 'Transaction recorded successfully');
      }

      resetForm();
      setIsModalOpen(false);
    } catch (_error) {
      showNotification('error', 'Failed to save transaction');
    }
  };

  if (loading) {
    return (
      <div
        className="main-content"
        style={{
          backgroundColor: '#000000',
          minHeight: '100vh',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            className="loader"
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(99, 102, 241, 0.1)',
              borderTopColor: '#6366f1',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px',
            }}
          ></div>
          <div style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: '500' }}>
            Loading transactions...
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div
      className="page-container"
      style={{
        minHeight: '100vh',
        padding: 'clamp(16px, 4vw, 24px)',
      }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div className="page-header" style={{ alignItems: 'flex-start', gap: '24px' }}>
          <div>
            <h1 className="page-title">Ledger</h1>
            <p className="page-subtitle">
              {sortedTransactions.length.toLocaleString()} entries across your accounts
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                exportTransactionsToCSV(transactions);
                showNotification('success', 'Ledger exported to CSV');
              }}
              style={{
                padding: 'clamp(12px, 2.5vw, 14px) clamp(16px, 3vw, 20px)',
                minHeight: '44px',
                borderRadius: '16px',
                background: 'rgba(0, 0, 0, 0.6)',
                color: '#94a3b8',
                border: '1px solid #111111',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontWeight: '700',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Download size={18} /> Export
            </button>
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="header-add-btn"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)',
              }}
            >
              <Plus size={20} strokeWidth={3} /> Add entry
            </button>
          </div>
        </div>

        <div
          className="premium-card fade-in"
          style={{
            width: '100%',
            padding: 'clamp(16px, 3vw, 24px)',
            background: 'rgba(11, 21, 25, 0.45)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(32px)',
          }}
        >
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.03)',
              overflow: 'hidden',
            }}
          >
            {sortedTransactions.length > 0 ? (
              <div style={{ maxHeight: '780px', overflow: 'auto' }}>
                <table
                  className="table-stack"
                  style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}
                >
                  <thead>
                    <tr
                      style={{ background: 'rgba(6, 12, 16, 0.96)', backdropFilter: 'blur(14px)' }}
                    >
                      {tableHeaders.map((header) => (
                        <th key={header.label} style={getHeaderCellStyle(header.align)}>
                          {header.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTransactions.map((transaction, index) => {
                      const accountName = transaction.accountId
                        ? (accountNameById.get(transaction.accountId) ?? 'Unassigned')
                        : 'Unassigned';
                      const isIncome = transaction.type === 'Income';

                      return (
                        <tr
                          key={transaction.id}
                          onClick={() => handleEdit(transaction)}
                          style={{
                            cursor: 'pointer',
                            background:
                              index % 2 === 0
                                ? 'rgba(255, 255, 255, 0.018)'
                                : 'rgba(255, 255, 255, 0.032)',
                          }}
                        >
                          <td data-label="Entry" style={getBodyCellStyle()}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                              <div
                                style={{
                                  width: '42px',
                                  height: '42px',
                                  borderRadius: '12px',
                                  background: isIncome
                                    ? 'rgba(16, 185, 129, 0.1)'
                                    : 'rgba(244, 63, 94, 0.1)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: isIncome ? '#10b981' : '#f43f5e',
                                  flexShrink: 0,
                                }}
                              >
                                {isIncome ? (
                                  <ArrowUpRight size={18} strokeWidth={2.5} />
                                ) : (
                                  <ArrowDownRight size={18} strokeWidth={2.5} />
                                )}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div
                                  style={{
                                    fontWeight: 800,
                                    fontSize: '0.95rem',
                                    color: '#fff',
                                    marginBottom: '4px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {transaction.description}
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.74rem',
                                    color: '#64748b',
                                    fontWeight: 700,
                                  }}
                                >
                                  Opens the entry editor
                                </div>
                              </div>
                            </div>
                          </td>
                          <td data-label="Category" style={getBodyCellStyle()}>
                            <span style={getPillStyle('rgba(99, 102, 241, 0.1)', '#a5b4fc')}>
                              {transaction.category}
                            </span>
                          </td>
                          <td data-label="Type" style={getBodyCellStyle()}>
                            <span
                              style={getPillStyle(
                                isIncome ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                                isIncome ? '#34d399' : '#fb7185'
                              )}
                            >
                              {transaction.type}
                            </span>
                          </td>
                          <td
                            data-label="Account"
                            style={{ ...getBodyCellStyle(), color: '#d5dfdc', fontWeight: 700 }}
                          >
                            <span
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                            >
                              <Wallet size={14} color="#6b827d" />
                              {accountName}
                            </span>
                          </td>
                          <td
                            data-label="Date"
                            style={{
                              ...getBodyCellStyle(),
                              color: '#9fb0ac',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {formatDate(transaction.date)}
                          </td>
                          <td
                            data-label="Amount"
                            style={{
                              ...getBodyCellStyle('right'),
                              color: isIncome ? '#10b981' : '#f43f5e',
                              fontWeight: 950,
                              fontSize: '1rem',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {isIncome ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                          </td>
                          <td data-label="Actions" style={getBodyCellStyle('right')}>
                            <div
                              style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}
                            >
                              <button
                                className="action-btn action-btn--edit"
                                type="button"
                                style={{ padding: '6px', borderRadius: '8px' }}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleEdit(transaction);
                                }}
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                className="action-btn action-btn--delete"
                                type="button"
                                style={{ padding: '6px', borderRadius: '8px' }}
                                onClick={async (event) => {
                                  event.stopPropagation();
                                  const isConfirmed = await customConfirm({
                                    title: 'Delete entry?',
                                    message: 'This ledger entry will be permanently deleted.',
                                    type: 'error',
                                    confirmLabel: 'Delete',
                                  });
                                  if (isConfirmed) {
                                    await deleteTransaction(transaction.id);
                                    showNotification('success', 'Entry deleted');
                                  }
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '80px 40px', textAlign: 'center' }}>
                <EmptyTransactionsVisual />
                <h3 style={{ color: '#fff', margin: '0 0 12px 0', fontSize: '1.1rem' }}>
                  No ledger entries yet
                </h3>
                <p
                  style={{
                    color: '#64748b',
                    maxWidth: '300px',
                    margin: '0 auto',
                    fontSize: '0.85rem',
                  }}
                >
                  Add your first entry to start building the ledger.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '540px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px',
              }}
            >
              <h2
                style={{
                  fontSize: 'clamp(1.4rem, 3vw, 1.75rem)',
                  fontWeight: 950,
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}
              >
                {editId ? 'Edit entry' : 'New ledger entry'}
              </h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <form
              onSubmit={handleAddTransaction}
              style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label className="form-label">Entry type</label>
                  <div
                    style={{
                      display: 'flex',
                      gap: '4px',
                      background: '#000000',
                      padding: '4px',
                      borderRadius: '12px',
                      border: '1px solid #111111',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setType('Expense')}
                      style={{
                        flex: 1,
                        padding: '12px',
                        minHeight: '44px',
                        borderRadius: '10px',
                        border: 'none',
                        background: type === 'Expense' ? '#f43f5e' : 'transparent',
                        color: type === 'Expense' ? '#fff' : '#475569',
                        fontWeight: 950,
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                      }}
                    >
                      EXPENSE
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('Income')}
                      style={{
                        flex: 1,
                        padding: '12px',
                        minHeight: '44px',
                        borderRadius: '10px',
                        border: 'none',
                        background: type === 'Income' ? '#10b981' : 'transparent',
                        color: type === 'Income' ? '#fff' : '#475569',
                        fontWeight: 950,
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                      }}
                    >
                      INCOME
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label className="form-label">Date</label>
                  <input
                    className="form-input"
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label className="form-label">Description</label>
                <input
                  className="form-input"
                  placeholder="e.g. Monthly Rent Payment"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  required
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
                  gap: '20px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label className="form-label">Category</label>
                  <input
                    className="form-input"
                    placeholder="Food, Rent, etc."
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label className="form-label">Amount ({currencySymbol})</label>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label className="form-label">Source Account</label>
                <select
                  className="form-input"
                  value={accountId}
                  onChange={(event) => setAccountId(event.target.value)}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="">No Account Linked</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({formatCurrency(account.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn-primary btn-primary--indigo">
                {editId ? 'Save changes' : 'Save entry'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
