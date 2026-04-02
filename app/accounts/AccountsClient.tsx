'use client';

import { useMemo, useState } from 'react';
import { useNotifications } from '../components/NotificationContext';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useLedger } from '../components/FinanceContext';
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

const ACCOUNT_ACCENT_COLORS = ['#1ea672', '#43c08a', '#f2a93b', '#3ea8a1', '#2f7f78', '#8fd5b6'];

export default function AccountsClient() {
  const { accounts, addAccount, updateAccount, deleteAccount, addFunds, loading } = useLedger();
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
  const [searchQuery, setSearchQuery] = useState('');

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [sourceAccountId, setSourceAccountId] = useState<number | ''>('');
  const [targetAccountId, setTargetAccountId] = useState<number | ''>('');
  const [transferAmount, setTransferAmount] = useState('');

  const resetTransferForm = () => {
    setSourceAccountId('');
    setTargetAccountId('');
    setTransferAmount('');
  };

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

    if (!sourceAccountId || !targetAccountId || !transferAmount) {
      showNotification('error', 'Choose the source, destination, and amount first.');
      return;
    }

    if (sourceAccountId === targetAccountId) {
      showNotification('error', 'Source and destination accounts must be different.');
      return;
    }

    try {
      const amount = parseFloat(transferAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        showNotification('error', 'Transfer amount must be greater than zero.');
        return;
      }

      const sourceAccount = accounts.find((acc) => acc.id === Number(sourceAccountId));
      const targetAccount = accounts.find((acc) => acc.id === Number(targetAccountId));

      if (!sourceAccount || !targetAccount) {
        showNotification('error', 'We could not find one of the selected accounts.');
        return;
      }

      if (sourceAccount.currency !== targetAccount.currency) {
        showNotification(
          'error',
          'Cross-currency transfers are not supported yet. Pick two accounts with the same currency.'
        );
        return;
      }

      if (sourceAccount.balance < amount) {
        showNotification(
          'error',
          `Insufficient balance in ${sourceAccount.name}. Available: ₹${sourceAccount.balance.toLocaleString(
            'en-IN',
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          )}`
        );
        return;
      }

      await Promise.all([
        updateAccount(sourceAccount.id, { balance: sourceAccount.balance - amount }),
        updateAccount(targetAccount.id, { balance: targetAccount.balance + amount }),
      ]);

      showNotification(
        'success',
        `Transferred ₹${amount.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} from ${sourceAccount.name} to ${targetAccount.name}.`
      );
      resetTransferForm();
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

  const liquidityChartAccounts = useMemo(
    () =>
      accounts
        .filter((account) => account.currency === 'INR' && account.balance > 0)
        .sort((left, right) => right.balance - left.balance),
    [accounts]
  );

  const selectedSourceAccount = useMemo(
    () => accounts.find((account) => account.id === Number(sourceAccountId)) || null,
    [accounts, sourceAccountId]
  );

  const selectedTargetAccount = useMemo(
    () => accounts.find((account) => account.id === Number(targetAccountId)) || null,
    [accounts, targetAccountId]
  );

  const eligibleSourceAccounts = useMemo(
    () =>
      accounts.filter(
        (account) =>
          account.id !== Number(targetAccountId) &&
          (!selectedTargetAccount || account.currency === selectedTargetAccount.currency)
      ),
    [accounts, selectedTargetAccount, targetAccountId]
  );

  const eligibleTargetAccounts = useMemo(
    () =>
      accounts.filter(
        (account) =>
          account.id !== Number(sourceAccountId) &&
          (!selectedSourceAccount || account.currency === selectedSourceAccount.currency)
      ),
    [accounts, selectedSourceAccount, sourceAccountId]
  );

  const getBankBranding = (bankName: string) => {
    const name = bankName.toLowerCase();
    if (name.includes('hdfc')) return { name: 'HDFC Bank', color: '#1e40af' };
    if (name.includes('sbi') || name.includes('state bank'))
      return { name: 'State Bank of India', color: '#2563eb' };
    if (name.includes('icici')) return { name: 'ICICI Bank', color: '#f97316' };
    if (name.includes('axis')) return { name: 'Axis Bank', color: '#9d174d' };
    if (name.includes('kotak')) return { name: 'Kotak Bank', color: '#dc2626' };
    if (name.includes('idfc')) return { name: 'IDFC First', color: '#991b1b' };
    if (name.includes('federal')) return { name: 'Federal Bank', color: '#1d4ed8' };
    if (name.includes('indusind')) return { name: 'IndusInd Bank', color: '#7c2d12' };
    if (name.includes('canara')) return { name: 'Canara Bank', color: '#0ea5e9' };
    if (name.includes('union')) return { name: 'Union Bank', color: '#be123c' };
    if (name.includes('baroda')) return { name: 'Bank of Baroda', color: '#ea580c' };
    if (name.includes('paytm')) return { name: 'Paytm Payments', color: '#00baf2' };
    if (name.includes('jupiter')) return { name: 'Jupiter Money', color: '#fbbf24' };
    if (name.includes('fi ')) return { name: 'Fi Money', color: '#10b981' };
    if (name.includes('cash')) return { name: 'Physical Cash', color: '#10b981' };
    return { name: bankName, color: null };
  };

  const filteredAccounts = useMemo(() => {
    if (!searchQuery.trim()) return accounts;
    const q = searchQuery.toLowerCase();
    return accounts.filter(
      (acc) =>
        acc.name.toLowerCase().includes(q) ||
        acc.bankName.toLowerCase().includes(q) ||
        acc.type.toLowerCase().includes(q)
    );
  }, [accounts, searchQuery]);

  const groupedAccounts = useMemo(() => {
    const groups: Record<string, Account[]> = {};
    filteredAccounts.forEach((acc) => {
      if (!groups[acc.type]) groups[acc.type] = [];
      groups[acc.type].push(acc);
    });

    // Sort groups: Savings first, then Checking, then Investment, then others
    const order = ['Savings', 'Checking', 'Investment', 'Credit Card', 'Cash'];
    const sortedGroups: Record<string, Account[]> = {};

    order.forEach((type) => {
      if (groups[type]) sortedGroups[type] = groups[type];
    });

    Object.keys(groups).forEach((type) => {
      if (!order.includes(type)) sortedGroups[type] = groups[type];
    });

    return sortedGroups;
  }, [filteredAccounts]);

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
        className="mobile-page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          gap: '16px',
          width: '100%',
        }}
      >
        <div style={{ flex: 1 }}>
          <h1
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: '900',
              margin: 0,
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #fff 0%, #43c08a 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Accounts
          </h1>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
              marginTop: '8px',
            }}
          >
            Securely manage your assets and financial entities
          </p>
        </div>

        <div
          className="mobile-page-header__actions"
          style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            justifyContent: 'flex-end',
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
              border: '1px solid #111111',
              fontWeight: '700',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: '0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#111111')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#050505')}
            aria-label="Export accounts to CSV"
          >
            <Download size={16} color="#10b981" aria-hidden="true" />{' '}
            <span className="hide-sm">Export</span> CSV
          </button>
          <button
            onClick={() => {
              resetTransferForm();
              setIsTransferModalOpen(true);
            }}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              background: '#050505',
              color: '#fff',
              border: '1px solid #111111',
              fontWeight: '700',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: '0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#111111')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#050505')}
            aria-label="Transfer funds between accounts"
          >
            <ArrowRightLeft size={16} color="#43c08a" aria-hidden="true" /> Transfer
          </button>
          <button
            onClick={() => {
              resetAccountForm();
              setIsModalOpen(true);
            }}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #1ea672 0%, #16875a 100%)',
              color: 'white',
              border: 'none',
              fontWeight: '800',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 8px 16px rgba(30, 166, 114, 0.25)',
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
            padding: 'clamp(20px, 5vw, 32px)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Animated gradient background */}
          <div
            className="hide-mobile"
            style={{
              position: 'absolute',
              top: '-50%',
              right: '-10%',
              width: '400px',
              height: '400px',
              background: 'radial-gradient(circle, rgba(30, 166, 114, 0.15) 0%, transparent 70%)',
              filter: 'blur(60px)',
              animation: 'floating 6s ease-in-out infinite',
            }}
          />

          <div
            className="flex-col-mobile"
            style={{
              position: 'relative',
              zIndex: 1,
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '24px',
            }}
          >
            <div style={{ flex: '1', minWidth: '240px' }}>
              <div
                style={{
                  color: 'var(--text-secondary)',
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
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '12px',
                  marginTop: '24px',
                }}
              >
                {liquidityChartAccounts.slice(0, 3).map((acc) => (
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
                width: 'clamp(190px, 24vw, 240px)',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: 'clamp(190px, 24vw, 240px)',
                  position: 'relative',
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={
                        liquidityChartAccounts.length > 0
                          ? liquidityChartAccounts
                          : [{ id: 0, name: 'No liquidity', balance: 1 }]
                      }
                      cx="50%"
                      cy="50%"
                      innerRadius="58%"
                      outerRadius="82%"
                      paddingAngle={liquidityChartAccounts.length > 0 ? 4 : 0}
                      minAngle={liquidityChartAccounts.length > 0 ? 6 : 0}
                      dataKey="balance"
                      animationBegin={0}
                      animationDuration={1200}
                      stroke="rgba(7, 16, 24, 0.9)"
                      strokeWidth={2}
                    >
                      {(liquidityChartAccounts.length > 0
                        ? liquidityChartAccounts
                        : [{ id: 0 } as const]
                      ).map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            liquidityChartAccounts.length > 0
                              ? ACCOUNT_ACCENT_COLORS[index % ACCOUNT_ACCENT_COLORS.length]
                              : 'rgba(160, 188, 180, 0.24)'
                          }
                          style={{
                            filter:
                              liquidityChartAccounts.length > 0
                                ? `drop-shadow(0 0 10px ${
                                    ACCOUNT_ACCENT_COLORS[index % ACCOUNT_ACCENT_COLORS.length]
                                  }35)`
                                : 'none',
                          }}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(8, 16, 20, 0.96)',
                        border: '1px solid rgba(160, 188, 180, 0.22)',
                        borderRadius: '14px',
                        padding: '12px',
                        boxShadow: '0 16px 32px rgba(0, 0, 0, 0.45)',
                        fontSize: '0.8rem',
                      }}
                      itemStyle={{ color: '#f4f8f7' }}
                      labelStyle={{ color: '#9aaea9', fontWeight: 700 }}
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
                      color: '#9aaea9',
                      fontSize: '0.62rem',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {liquidityChartAccounts.length > 0 ? 'Cash Split' : 'No Cash'}
                  </div>
                  <div style={{ color: '#f4f8f7', fontSize: '1.1rem', fontWeight: '900' }}>
                    {liquidityChartAccounts.length}
                  </div>
                </div>
              </div>
              <div
                style={{
                  marginTop: '14px',
                  display: 'grid',
                  gap: '8px',
                }}
              >
                {liquidityChartAccounts.length > 0 ? (
                  liquidityChartAccounts.slice(0, 4).map((account, index) => {
                    const share =
                      totalBalanceINR > 0 ? (account.balance / totalBalanceINR) * 100 : 0;

                    return (
                      <div
                        key={account.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          padding: '10px 12px',
                          borderRadius: '14px',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(160, 188, 180, 0.12)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              background:
                                ACCOUNT_ACCENT_COLORS[index % ACCOUNT_ACCENT_COLORS.length],
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                color: '#f4f8f7',
                                fontSize: '0.82rem',
                                fontWeight: '800',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {account.name}
                            </div>
                            <div style={{ color: '#9aaea9', fontSize: '0.72rem' }}>
                              {share.toFixed(1)}% of liquid balance
                            </div>
                          </div>
                        </div>
                        <div
                          style={{
                            color: '#d9f3e9',
                            fontSize: '0.82rem',
                            fontWeight: '800',
                            flexShrink: 0,
                          }}
                        >
                          ₹{account.balance.toLocaleString('en-IN')}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div
                    style={{
                      padding: '18px 16px',
                      borderRadius: '16px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(160, 188, 180, 0.12)',
                      color: '#9aaea9',
                      fontSize: '0.78rem',
                      textAlign: 'center',
                    }}
                  >
                    Add funds to an INR account to see your liquidity split here.
                  </div>
                )}
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

        {/* Search and Filters Row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '8px',
          }}
        >
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <input
              type="text"
              placeholder="Search entities or institutions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '12px 16px 12px 40px',
                borderRadius: '14px',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#1ea672')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
            <div
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b',
              }}
            >
              <Building2 size={18} />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div
            style={{
              color: '#94a3b8',
              fontSize: '0.85rem',
              fontWeight: '600',
            }}
          >
            {filteredAccounts.length} {filteredAccounts.length === 1 ? 'Entity' : 'Entities'}
            {searchQuery ? ' found' : ''}
          </div>
        </div>

        {/* Grouped Accounts Grid */}
        {Object.entries(groupedAccounts).length > 0 ? (
          (Object.entries(groupedAccounts) as [string, Account[]][]).map(([type, typeAccounts]) => (
            <div key={type} style={{ marginBottom: '32px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px',
                  padding: '0 4px',
                }}
              >
                <div style={{ color: '#1ea672', display: 'flex' }}>{getAccountIcon(type)}</div>
                <h2
                  style={{
                    fontSize: '1rem',
                    fontWeight: '800',
                    color: '#fff',
                    margin: 0,
                    textTransform: 'capitalize',
                  }}
                >
                  {type === 'Cash' ? 'Physical Liquidity' : `${type} Entities`}
                </h2>
                <div
                  style={{
                    flex: 1,
                    height: '1px',
                    background: 'linear-gradient(to right, rgba(30, 166, 114, 0.2), transparent)',
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700' }}>
                  {typeAccounts.length} {typeAccounts.length === 1 ? 'Item' : 'Items'}
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
                  gap: '20px',
                }}
              >
                {typeAccounts.map((account) => {
                  const branding = getBankBranding(account.bankName);
                  const baseColor = branding.color || '#1ea672';

                  return (
                    <div
                      key={account.id}
                      className="premium-card"
                      style={{
                        padding: '24px',
                        position: 'relative',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '190px',
                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-6px)';
                        e.currentTarget.style.borderColor = `${baseColor}40`;
                        e.currentTarget.style.boxShadow = `0 12px 24px -10px ${baseColor}25`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = '';
                        e.currentTarget.style.boxShadow = '';
                      }}
                      onClick={() => handleEditClick(account)}
                    >
                      {/* Decorative background logo */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '-10px',
                          right: '-10px',
                          opacity: 0.05,
                          transform: 'rotate(-15deg)',
                          transition: 'opacity 0.3s',
                        }}
                      >
                        {getAccountIcon(account.type)}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '20px',
                          position: 'relative',
                          zIndex: 1,
                        }}
                      >
                        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                          <div
                            style={{
                              background: `${baseColor}15`,
                              padding: '10px',
                              borderRadius: '12px',
                              color: baseColor,
                              border: `1px solid ${baseColor}25`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: `0 0 15px ${baseColor}10`,
                            }}
                          >
                            {getAccountIcon(account.type)}
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: '1.05rem',
                                fontWeight: '800',
                                color: '#fff',
                                marginBottom: '2px',
                                letterSpacing: '-0.3px',
                              }}
                            >
                              {account.name}
                            </div>
                            <div
                              style={{
                                fontSize: '0.75rem',
                                color: '#94a3b8',
                                fontWeight: '700',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              {branding.name}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const isConfirmed = await customConfirm({
                                title: 'Decommission Entity?',
                                message: `Are you sure you want to remove ${account.name}? All linked liquidity data will be preserved in ledger but the entity will be inactive.`,
                                confirmLabel: 'Decommission',
                                type: 'error',
                              });

                              if (isConfirmed) {
                                await deleteAccount(account.id);
                                showNotification('success', 'Entity decommissioned');
                              }
                            }}
                            style={{
                              background: 'rgba(244, 63, 94, 0.08)',
                              border: '1px solid rgba(244, 63, 94, 0.15)',
                              color: '#fb7185',
                              padding: '8px',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              display: 'flex',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = 'rgba(244, 63, 94, 0.15)')
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = 'rgba(244, 63, 94, 0.08)')
                            }
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-end',
                          paddingTop: '16px',
                          borderTop: '1px solid rgba(255,255,255,0.06)',
                          position: 'relative',
                          zIndex: 1,
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              color: '#64748b',
                              fontSize: '0.65rem',
                              fontWeight: '800',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              marginBottom: '6px',
                            }}
                          >
                            Current Liquidity
                          </div>
                          <div
                            style={{
                              fontSize: '1.65rem',
                              fontWeight: '950',
                              color: '#fff',
                              letterSpacing: '-1px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '1rem',
                                color: baseColor,
                                fontWeight: '800',
                                opacity: 0.8,
                              }}
                            >
                              {account.currency === 'INR' ? '₹' : '$'}
                            </span>
                            {account.balance.toLocaleString('en-IN', {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })}
                            <span
                              style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '800' }}
                            >
                              .{(account.balance % 1).toFixed(2).split('.')[1]}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAccountId(account.id);
                              setIsAddFundsModalOpen(true);
                            }}
                            style={{
                              background: `linear-gradient(135deg, ${baseColor} 0%, ${baseColor}dd 100%)`,
                              color: '#fff',
                              border: 'none',
                              padding: '10px 14px',
                              borderRadius: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: '800',
                              boxShadow: `0 8px 16px ${baseColor}20`,
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                          >
                            <Plus size={14} strokeWidth={3} />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div
            style={{
              padding: '80px 40px',
              borderRadius: '24px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px dashed rgba(255,255,255,0.1)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: 'rgba(30, 166, 114, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1ea672',
              }}
            >
              <Building2 size={32} />
            </div>
            <div>
              <h3
                style={{
                  color: '#fff',
                  fontSize: '1.25rem',
                  fontWeight: '800',
                  margin: '0 0 8px 0',
                }}
              >
                {searchQuery ? 'No matching entities found' : 'No financial entities yet'}
              </h3>
              <p
                style={{
                  color: '#64748b',
                  fontSize: '0.95rem',
                  maxWidth: '380px',
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                {searchQuery
                  ? `We couldn't find any accounts matching "${searchQuery}". Try a different search term.`
                  : 'Start by establishing your first bank account, wallet, or investment entity to track your liquidity.'}
              </p>
            </div>
            {!searchQuery && (
              <button
                onClick={() => {
                  resetAccountForm();
                  setIsModalOpen(true);
                }}
                style={{
                  padding: '12px 24px',
                  borderRadius: '14px',
                  background: '#fff',
                  color: '#000',
                  border: 'none',
                  fontWeight: '800',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  marginTop: '10px',
                }}
              >
                Create First Entity
              </button>
            )}
          </div>
        )}
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
                    border: '1px solid #111111',
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
                    border: '1px solid #111111',
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
                      border: '1px solid #111111',
                      padding: '16px',
                      borderRadius: '16px',
                      color: '#fff',
                      fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                    aria-label="Select currency"
                  >
                    <option value="INR">₹ (INR)</option>
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
                      border: '1px solid #111111',
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
                    border: '1px solid #111111',
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
                  background: 'linear-gradient(135deg, #1ea672 0%, #16875a 100%)',
                  color: '#fff',
                  padding: '18px',
                  borderRadius: '18px',
                  border: 'none',
                  fontWeight: '900',
                  cursor: 'pointer',
                  fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                  boxShadow: '0 10px 20px rgba(30, 166, 114, 0.25)',
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
                  onChange={(e) =>
                    setSourceAccountId(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  style={{
                    background: '#000000',
                    border: '1px solid #111111',
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
                  {eligibleSourceAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (₹{acc.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
              {(selectedSourceAccount || selectedTargetAccount) && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '14px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(160, 188, 180, 0.12)',
                    display: 'grid',
                    gap: '6px',
                  }}
                >
                  {selectedSourceAccount && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '12px',
                        fontSize: '0.82rem',
                      }}
                    >
                      <span style={{ color: '#9aaea9' }}>Source balance</span>
                      <span style={{ color: '#f4f8f7', fontWeight: '800' }}>
                        ₹{selectedSourceAccount.balance.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  {selectedTargetAccount && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '12px',
                        fontSize: '0.82rem',
                      }}
                    >
                      <span style={{ color: '#9aaea9' }}>Destination currency</span>
                      <span style={{ color: '#d9f3e9', fontWeight: '800' }}>
                        {selectedTargetAccount.currency}
                      </span>
                    </div>
                  )}
                </div>
              )}
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
                  onChange={(e) =>
                    setTargetAccountId(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  style={{
                    background: '#000000',
                    border: '1px solid #111111',
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
                  {eligibleTargetAccounts.map((acc) => (
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
                    border: '1px solid #111111',
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
                  background: 'linear-gradient(135deg, #1ea672 0%, #16875a 100%)',
                  color: '#ffffff',
                  padding: '18px',
                  borderRadius: '18px',
                  border: 'none',
                  fontWeight: '900',
                  cursor: 'pointer',
                  fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                  boxShadow: '0 10px 20px rgba(30, 166, 114, 0.25)',
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
                    border: '1px solid #111111',
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
                    border: '1px solid #111111',
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
                    border: '1px solid #111111',
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
                  background: 'linear-gradient(135deg, #1ea672 0%, #16875a 100%)',
                  color: '#fff',
                  padding: '18px',
                  borderRadius: '18px',
                  border: 'none',
                  fontWeight: '900',
                  cursor: 'pointer',
                  fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                  boxShadow: '0 10px 20px rgba(30, 166, 114, 0.25)',
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
