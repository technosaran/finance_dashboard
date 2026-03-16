'use client';

import { useState } from 'react';
import { useNotifications } from '../components/NotificationContext';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useFinance } from '../components/FinanceContext';
import { Account, AccountType } from '@/lib/types';
import { exportAccountsToCSV } from '../../lib/utils/export';
import {
  Wallet,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Coins,
  Building2,
  ArrowRightLeft,
  Plus,
  X,
  Trash2,
  Download,
} from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6'];

export default function AccountsClient() {
  const { accounts, addAccount, updateAccount, deleteAccount, addFunds, loading } = useFinance();
  const { showNotification, confirm: customConfirm } = useNotifications();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // Form State
  const [accountName, setAccountName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('Savings');
  const [balance, setBalance] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'INR'>('INR');

  // Add Funds State
  const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [addFundsAmount, setAddFundsAmount] = useState('');
  const [addFundsDescription, setAddFundsDescription] = useState('');
  const [addFundsCategory, setAddFundsCategory] = useState('Income');

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [sourceAccountId, setSourceAccountId] = useState<number | ''>('');
  const [targetAccountId, setTargetAccountId] = useState<number | ''>('');
  const [transferAmount, setTransferAmount] = useState('');

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName || !balance || !bankName) return;

    try {
      if (editId !== null) {
        const existingAccount = accounts.find((acc) => acc.id === editId);
        if (existingAccount) {
          await updateAccount(editId, {
            name: accountName,
            bankName,
            type: accountType,
            balance: parseFloat(balance),
            currency,
          });
          showNotification('success', 'Account updated successfully');
        }
      } else {
        await addAccount({
          name: accountName,
          bankName,
          type: accountType,
          balance: parseFloat(balance),
          currency,
        });
        showNotification('success', 'New account created successfully');
      }
      resetAccountForm();
      setIsModalOpen(false);
    } catch {
      showNotification('error', 'Failed to save account. Please try again.');
    }
  };

  const resetAccountForm = () => {
    setEditId(null);
    setAccountName('');
    setBankName('');
    setAccountType('Checking');
    setBalance('');
    setCurrency('INR');
  };

  const handleEditClick = (account: Account) => {
    setEditId(account.id);
    setAccountName(account.name);
    setBankName(account.bankName);
    setAccountType(account.type);
    setBalance(account.balance.toString());
    setCurrency(account.currency);
    setIsModalOpen(true);
  };

  const handleAddFundsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAccountId === null || !addFundsAmount) return;
    try {
      await addFunds(
        selectedAccountId,
        parseFloat(addFundsAmount),
        addFundsDescription,
        addFundsCategory
      );
      setIsAddFundsModalOpen(false);
      setAddFundsAmount('');
      setAddFundsDescription('');
    } catch {
      showNotification('error', 'Failed to add funds. Please try again.');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceAccountId || !targetAccountId || !transferAmount) return;
    try {
      const amount = parseFloat(transferAmount);
      const sourceAccount = accounts.find((acc) => acc.id === Number(sourceAccountId));
      const targetAccount = accounts.find((acc) => acc.id === Number(targetAccountId));
      if (sourceAccount && targetAccount) {
        await updateAccount(sourceAccount.id, { balance: sourceAccount.balance - amount });
        await updateAccount(targetAccount.id, { balance: targetAccount.balance + amount });
      }
      setIsTransferModalOpen(false);
    } catch {
      showNotification('error', 'Transfer failed. Please try again.');
    }
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'Checking':
        return <Wallet size={20} />;
      case 'Savings':
        return <PiggyBank size={20} />;
      case 'Credit Card':
        return <CreditCard size={20} />;
      case 'Investment':
        return <TrendingUp size={20} />;
      case 'Cash':
        return <Coins size={20} />;
      default:
        return <Building2 size={20} />;
    }
  };

  const totalBalanceINR = accounts
    .filter((a) => a.currency === 'INR')
    .reduce((sum, acc) => sum + acc.balance, 0);

  if (loading) {
    return (
      <div
        className="page-container"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', color: '#94a3b8' }}>
            Loading your accounts...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div
        className="flex-col-mobile"
        style={{
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          gap: '20px',
        }}
      >
        <div style={{ flex: 1 }}>
          <h1
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: '900',
              margin: 0,
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Accounts
          </h1>
          <p
            style={{ color: '#94a3b8', fontSize: 'clamp(0.85rem, 2vw, 0.95rem)', marginTop: '8px' }}
          >
            Securely manage your assets and financial entities
          </p>
        </div>

        <div
          className="hide-scrollbar"
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            overflowX: 'auto',
            width: 'auto',
            paddingBottom: '4px',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <button
            onClick={() => {
              exportAccountsToCSV(accounts);
              showNotification('success', 'Accounts exported successfully!');
            }}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              background: '#050505',
              color: '#fff',
              border: '1px solid #2a2a2a',
              fontWeight: '700',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: '0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#2a2a2a')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#050505')}
            aria-label="Export accounts to CSV"
          >
            <Download size={16} color="#10b981" aria-hidden="true" />{' '}
            <span className="hide-sm">Export</span> CSV
          </button>
          <button
            onClick={() => setIsTransferModalOpen(true)}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              background: '#050505',
              color: '#fff',
              border: '1px solid #2a2a2a',
              fontWeight: '700',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: '0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#2a2a2a')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#050505')}
            aria-label="Transfer funds between accounts"
          >
            <ArrowRightLeft size={16} color="#818cf8" aria-hidden="true" /> Transfer
          </button>
          <button
            onClick={() => {
              resetAccountForm();
              setIsModalOpen(true);
            }}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
              color: 'white',
              border: 'none',
              fontWeight: '800',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 8px 16px rgba(99, 102, 241, 0.2)',
              transition: '0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            aria-label="Add new account"
          >
            <Plus size={16} strokeWidth={3} aria-hidden="true" /> New Entity
          </button>
        </div>
      </div>

      {/* Main Content Layout - Single Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Summary Bar */}
        <div
          className="premium-card"
          style={{
            background: 'linear-gradient(135deg, #2a2a2a 0%, #050505 100%)',
            padding: 'clamp(20px, 5vw, 32px)',
            borderRadius: '24px',
            border: '1px solid #2a2a2a',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Enhanced animated gradient background */}
          <div
            className="hide-mobile"
            style={{
              position: 'absolute',
              top: '-50%',
              right: '-10%',
              width: '400px',
              height: '400px',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
              filter: 'blur(60px)',
              animation: 'float 6s ease-in-out infinite',
            }}
          />

          <div
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '24px',
            }}
          >
            <div style={{ flex: '1', minWidth: '240px' }}>
              <div
                style={{
                  color: '#94a3b8',
                  fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '1.2px',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#34d399',
                    boxShadow: '0 0 10px rgba(52, 211, 153, 0.5)',
                  }}
                  aria-hidden="true"
                />
                Total Liquidity
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '8px',
                  marginBottom: '16px',
                }}
              >
                <div
                  style={{
                    fontSize: 'clamp(2.5rem, 7vw, 3.5rem)',
                    fontWeight: '950',
                    color: '#fff',
                    letterSpacing: '-2px',
                    textShadow: '0 4px 16px rgba(255, 255, 255, 0.1)',
                    lineHeight: 1,
                  }}
                >
                  ₹{totalBalanceINR.toLocaleString()}
                </div>
                <div
                  style={{
                    background: 'rgba(52, 211, 153, 0.12)',
                    color: '#34d399',
                    padding: '4px 12px',
                    borderRadius: '100px',
                    border: '1px solid rgba(52, 211, 153, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                  }}
                >
                  <TrendingUp size={14} aria-hidden="true" /> +5.2%
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '12px',
                  marginTop: '24px',
                }}
              >
                {accounts.slice(0, 3).map((acc) => (
                  <div
                    key={acc.id}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      padding: '12px',
                      borderRadius: '16px',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <div
                      style={{
                        color: '#94a3b8',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        marginBottom: '4px',
                      }}
                    >
                      {acc.name}
                    </div>
                    <div style={{ color: '#fff', fontSize: '1rem', fontWeight: '800' }}>
                      ₹{acc.balance.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                width: 'clamp(200px, 30vw, 280px)',
                height: 'clamp(200px, 30vw, 280px)',
                position: 'relative',
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={accounts}
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="90%"
                    paddingAngle={3}
                    dataKey="balance"
                    animationBegin={0}
                    animationDuration={1500}
                  >
                    {accounts.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="none"
                        style={{
                          filter: `drop-shadow(0 0 12px ${COLORS[index % COLORS.length]}40)`,
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#000000',
                      border: '1px solid #1a1a1a',
                      borderRadius: '12px',
                      padding: '12px',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                      fontSize: '0.8rem',
                    }}
                    formatter={(value: number | string | undefined) => [
                      `₹${Number(value || 0).toLocaleString()}`,
                      'Balance',
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  pointerEvents: 'none',
                }}
              >
                <div
                  style={{
                    color: '#94a3b8',
                    fontSize: '0.6rem',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                  }}
                >
                  Total
                </div>
                <div style={{ color: '#fff', fontSize: '1rem', fontWeight: '900' }}>
                  {accounts.length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Entity Count */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              color: '#94a3b8',
              fontSize: 'clamp(0.8rem, 1.5vw, 0.9rem)',
              fontWeight: '600',
            }}
          >
            {accounts.length} Active Entities
          </div>
        </div>

        {/* Accounts Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
          }}
        >
          {accounts.map((account, idx) => (
            <div
              key={account.id}
              style={{
                background: 'linear-gradient(145deg, #050505 0%, #2a2a2a 100%)',
                borderRadius: '16px',
                border: '1px solid #2a2a2a',
                padding: '24px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '180px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = COLORS[idx % COLORS.length] + '60';
                e.currentTarget.style.boxShadow = `0 10px 20px -8px ${COLORS[idx % COLORS.length]}30`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = '#2a2a2a';
                e.currentTarget.style.boxShadow = 'none';
              }}
              onClick={() => handleEditClick(account)}
            >
              {/* Enhanced card decoration with gradient overlay */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '120px',
                  height: '120px',
                  background: `radial-gradient(circle, ${COLORS[idx % COLORS.length]}10 0%, transparent 70%)`,
                  filter: 'blur(30px)',
                }}
              />

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div
                    style={{
                      background: `${COLORS[idx % COLORS.length]}15`,
                      padding: '8px',
                      borderRadius: '10px',
                      color: COLORS[idx % COLORS.length],
                      border: `1px solid ${COLORS[idx % COLORS.length]}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {getAccountIcon(account.type)}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: '700',
                        color: '#fff',
                        marginBottom: '2px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '180px',
                      }}
                    >
                      {account.name}
                    </div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: '#64748b',
                        fontWeight: '600',
                      }}
                    >
                      {account.bankName}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {account.name.toLowerCase() !== 'physical cash' && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        const isConfirmed = await customConfirm({
                          title: 'Delete Account',
                          message: `Are you sure you want to delete ${account.name}?`,
                          confirmLabel: 'Delete',
                          type: 'error',
                        });

                        if (isConfirmed) {
                          await deleteAccount(account.id);
                          showNotification('success', 'Account deleted');
                        }
                      }}
                      style={{
                        background: 'rgba(244, 63, 94, 0.1)',
                        border: 'none',
                        color: '#f43f5e',
                        padding: '6px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  paddingTop: '12px',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <div>
                  <div
                    style={{
                      color: '#64748b',
                      fontSize: '0.65rem',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      marginBottom: '2px',
                    }}
                  >
                    Available Balance
                  </div>
                  <div
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: '800',
                      color: '#fff',
                      letterSpacing: '-0.5px',
                    }}
                  >
                    {account.currency === 'INR' ? '₹' : '$'}
                    {account.balance.toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAccountId(account.id);
                    setIsAddFundsModalOpen(true);
                  }}
                  style={{
                    background: `linear-gradient(135deg, ${COLORS[idx % COLORS.length]} 0%, ${COLORS[idx % COLORS.length]}dd 100%)`,
                    color: '#fff',
                    border: 'none',
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: `0 4px 8px ${COLORS[idx % COLORS.length]}30`,
                  }}
                >
                  <Plus size={16} strokeWidth={3} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals - Standard Premium Design */}
      {isModalOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div
            className="modal-card"
            style={{
              maxWidth: '500px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px',
                gap: '16px',
              }}
            >
              <h2
                id="modal-title"
                style={{ fontSize: 'clamp(1.4rem, 3.5vw, 1.8rem)', fontWeight: '900', margin: 0 }}
              >
                {editId ? 'Modify Entity' : 'New Entity'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: 'none',
                  color: '#94a3b8',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
                aria-label="Close modal"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <form
              onSubmit={handleAddAccount}
              style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 3vw, 24px)' }}
              aria-label={editId ? 'Edit account form' : 'Add account form'}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label
                  htmlFor="entity-name"
                  style={{
                    fontSize: 'clamp(0.7rem, 1.5vw, 0.75rem)',
                    fontWeight: '800',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                  }}
                >
                  Entity Name
                </label>
                <input
                  id="entity-name"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  disabled={accountName.toLowerCase() === 'physical cash'}
                  placeholder="e.g. Primary Savings"
                  style={{
                    background: '#000000',
                    border: '1px solid #2a2a2a',
                    padding: '16px',
                    borderRadius: '16px',
                    color: accountName.toLowerCase() === 'physical cash' ? '#64748b' : '#fff',
                    fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                    outline: 'none',
                  }}
                  autoFocus
                  required
                  aria-required="true"
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label
                  htmlFor="bank-name"
                  style={{
                    fontSize: 'clamp(0.7rem, 1.5vw, 0.75rem)',
                    fontWeight: '800',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                  }}
                >
                  Financial Institution
                </label>
                <input
                  id="bank-name"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  disabled={accountName.toLowerCase() === 'physical cash'}
                  placeholder="e.g. HDFC Bank"
                  style={{
                    background: '#000000',
                    border: '1px solid #2a2a2a',
                    padding: '16px',
                    borderRadius: '16px',
                    color: accountName.toLowerCase() === 'physical cash' ? '#64748b' : '#fff',
                    fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                    outline: 'none',
                  }}
                  required
                  aria-required="true"
                />
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
                  gap: '20px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label
                    htmlFor="currency-select"
                    style={{
                      fontSize: 'clamp(0.7rem, 1.5vw, 0.75rem)',
                      fontWeight: '800',
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                    }}
                  >
                    Currency
                  </label>
                  <select
                    id="currency-select"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as 'INR' | 'USD')}
                    style={{
                      background: '#000000',
                      border: '1px solid #2a2a2a',
                      padding: '16px',
                      borderRadius: '16px',
                      color: '#fff',
                      fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                    aria-label="Select currency"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label
                    htmlFor="type-select"
                    style={{
                      fontSize: 'clamp(0.7rem, 1.5vw, 0.75rem)',
                      fontWeight: '800',
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                    }}
                  >
                    Type
                  </label>
                  <select
                    id="type-select"
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as AccountType)}
                    disabled={accountName.toLowerCase() === 'physical cash'}
                    style={{
                      background: '#000000',
                      border: '1px solid #2a2a2a',
                      padding: '16px',
                      borderRadius: '16px',
                      color: accountName.toLowerCase() === 'physical cash' ? '#64748b' : '#fff',
                      fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                      outline: 'none',
                      cursor: accountName.toLowerCase() === 'physical cash' ? 'default' : 'pointer',
                    }}
                    aria-label="Select account type"
                  >
                    <option value="Checking">Checking</option>
                    <option value="Savings">Savings</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Investment">Investment</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label
                  htmlFor="balance-input"
                  style={{
                    fontSize: 'clamp(0.7rem, 1.5vw, 0.75rem)',
                    fontWeight: '800',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                  }}
                >
                  Initial Liquidity
                </label>
                <input
                  id="balance-input"
                  type="number"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  placeholder="0.00"
                  style={{
                    background: '#000000',
                    border: '1px solid #2a2a2a',
                    padding: '16px',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                    outline: 'none',
                  }}
                  required
                  aria-required="true"
                />
              </div>
              <button
                type="submit"
                style={{
                  marginTop: '12px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
                  color: '#fff',
                  padding: '18px',
                  borderRadius: '18px',
                  border: 'none',
                  fontWeight: '900',
                  cursor: 'pointer',
                  fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                  boxShadow: '0 10px 20px rgba(99, 102, 241, 0.3)',
                  minHeight: '44px',
                }}
                aria-label={editId ? 'Update account' : 'Create account'}
              >
                {editId ? 'Update Entity' : 'Establish Entity'}
              </button>
            </form>
          </div>
        </div>
      )}

      {isTransferModalOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsTransferModalOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="transfer-modal-title"
        >
          <div
            className="modal-card"
            style={{
              maxWidth: '500px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px',
                gap: '16px',
              }}
            >
              <h2
                id="transfer-modal-title"
                style={{ fontSize: 'clamp(1.4rem, 3.5vw, 1.8rem)', fontWeight: '900', margin: 0 }}
              >
                Transfer Liquidity
              </h2>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: 'none',
                  color: '#94a3b8',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
                aria-label="Close modal"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <form
              onSubmit={handleTransfer}
              style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 3vw, 24px)' }}
              aria-label="Transfer funds form"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label
                  htmlFor="source-account"
                  style={{
                    fontSize: 'clamp(0.7rem, 1.5vw, 0.75rem)',
                    fontWeight: '800',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                  }}
                >
                  Source Account
                </label>
                <select
                  id="source-account"
                  value={sourceAccountId}
                  onChange={(e) => setSourceAccountId(Number(e.target.value))}
                  style={{
                    background: '#000000',
                    border: '1px solid #2a2a2a',
                    padding: '16px',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                  required
                  aria-required="true"
                >
                  <option value="" disabled>
                    Select Source
                  </option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (₹{acc.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label
                  htmlFor="target-account"
                  style={{
                    fontSize: 'clamp(0.7rem, 1.5vw, 0.75rem)',
                    fontWeight: '800',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                  }}
                >
                  Destination
                </label>
                <select
                  id="target-account"
                  value={targetAccountId}
                  onChange={(e) => setTargetAccountId(Number(e.target.value))}
                  style={{
                    background: '#000000',
                    border: '1px solid #2a2a2a',
                    padding: '16px',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                  required
                  aria-required="true"
                >
                  <option value="" disabled>
                    Select Destination
                  </option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (₹{acc.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label
                  htmlFor="transfer-amount"
                  style={{
                    fontSize: 'clamp(0.7rem, 1.5vw, 0.75rem)',
                    fontWeight: '800',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                  }}
                >
                  Transfer Amount
                </label>
                <input
                  id="transfer-amount"
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="0.00"
                  style={{
                    background: '#000000',
                    border: '1px solid #2a2a2a',
                    padding: '16px',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                    outline: 'none',
                  }}
                  required
                  aria-required="true"
                />
              </div>
              <button
                type="submit"
                style={{
                  marginTop: '12px',
                  background: '#fff',
                  color: '#000000',
                  padding: '18px',
                  borderRadius: '18px',
                  border: 'none',
                  fontWeight: '900',
                  cursor: 'pointer',
                  fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                  minHeight: '44px',
                }}
                aria-label="Execute transfer"
              >
                Execute Transfer
              </button>
            </form>
          </div>
        </div>
      )}

      {isAddFundsModalOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddFundsModalOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-funds-modal-title"
        >
          <div
            className="modal-card"
            style={{
              maxWidth: '500px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px',
                gap: '16px',
              }}
            >
              <h2
                id="add-funds-modal-title"
                style={{ fontSize: 'clamp(1.4rem, 3.5vw, 1.8rem)', fontWeight: '900', margin: 0 }}
              >
                Add Liquidity
              </h2>
              <button
                onClick={() => setIsAddFundsModalOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: 'none',
                  color: '#94a3b8',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
                aria-label="Close modal"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <form
              onSubmit={handleAddFundsSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 3vw, 24px)' }}
              aria-label="Add funds form"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label
                  htmlFor="add-funds-amount"
                  style={{
                    fontSize: 'clamp(0.7rem, 1.5vw, 0.75rem)',
                    fontWeight: '800',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                  }}
                >
                  Amount
                </label>
                <input
                  id="add-funds-amount"
                  type="number"
                  value={addFundsAmount}
                  onChange={(e) => setAddFundsAmount(e.target.value)}
                  placeholder="0.00"
                  style={{
                    background: '#000000',
                    border: '1px solid #2a2a2a',
                    padding: '16px',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                    outline: 'none',
                  }}
                  autoFocus
                  required
                  aria-required="true"
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label
                  htmlFor="add-funds-description"
                  style={{
                    fontSize: 'clamp(0.7rem, 1.5vw, 0.75rem)',
                    fontWeight: '800',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                  }}
                >
                  Description
                </label>
                <input
                  id="add-funds-description"
                  value={addFundsDescription}
                  onChange={(e) => setAddFundsDescription(e.target.value)}
                  placeholder="e.g. Dividend Payment"
                  style={{
                    background: '#000000',
                    border: '1px solid #2a2a2a',
                    padding: '16px',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                    outline: 'none',
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label
                  htmlFor="add-funds-category"
                  style={{
                    fontSize: 'clamp(0.7rem, 1.5vw, 0.75rem)',
                    fontWeight: '800',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                  }}
                >
                  Category
                </label>
                <select
                  id="add-funds-category"
                  value={addFundsCategory}
                  onChange={(e) => setAddFundsCategory(e.target.value)}
                  style={{
                    background: '#000000',
                    border: '1px solid #2a2a2a',
                    padding: '16px',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                  aria-label="Select category"
                >
                  <option value="Income">Income</option>
                  <option value="Salary">Salary</option>
                  <option value="Dividend">Dividend</option>
                  <option value="Refund">Refund</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <button
                type="submit"
                style={{
                  marginTop: '12px',
                  background: '#34d399',
                  color: '#000000',
                  padding: '18px',
                  borderRadius: '18px',
                  border: 'none',
                  fontWeight: '900',
                  cursor: 'pointer',
                  fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                  minHeight: '44px',
                }}
                aria-label="Confirm add funds"
              >
                Confirm Liquidity
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
