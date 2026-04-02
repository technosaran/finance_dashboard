'use client';

import { useMemo, useState } from 'react';
import { useNotifications } from '../components/NotificationContext';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
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

const BANK_BRANDING: Record<
  string,
  { name: string; color: string; keywords: string[]; logo: string }
> = {
  hdfc: {
    name: 'HDFC Bank',
    color: '#1e438a',
    keywords: ['hdfc'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/7/72/HDFC_Bank_Logo.svg',
  },
  icici: {
    name: 'ICICI Bank',
    color: '#f97316',
    keywords: ['icici'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/1/12/ICICI_Bank_Logo.svg',
  },
  sbi: {
    name: 'State Bank of India',
    color: '#0066bb',
    keywords: ['sbi', 'state bank'],
    logo: 'https://upload.wikimedia.org/wikipedia/en/5/58/State_Bank_of_India_logo.svg',
  },
  axis: {
    name: 'Axis Bank',
    color: '#9d174d',
    keywords: ['axis'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Axis_Bank_logo.svg',
  },
  kotak: {
    name: 'Kotak Bank',
    color: '#dc2626',
    keywords: ['kotak'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Kotak_Mahindra_Bank_logo.svg',
  },
  idfc: {
    name: 'IDFC First Bank',
    color: '#991b1b',
    keywords: ['idfc'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/IDFC_First_Bank_logo.svg',
  },
  paytm: {
    name: 'Paytm Payments Bank',
    color: '#00baf2',
    keywords: ['paytm'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg',
  },
  jupiter: {
    name: 'Jupiter Money',
    color: '#fbbf24',
    keywords: ['jupiter'],
    logo: 'https://jupiter.money/images/Jupiter-Logo.svg',
  },
  fi: {
    name: 'Fi Money',
    color: '#10b981',
    keywords: ['fi '],
    logo: 'https://fi.money/images/fi-logo.svg',
  },
  cash: {
    name: 'Physical Cash',
    color: '#10b981',
    keywords: ['cash'],
    logo: 'https://www.svgrepo.com/show/532397/money-bill-transfer.svg',
  },
};

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

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [sourceAccountId, setSourceAccountId] = useState<number | ''>('');
  const [targetAccountId, setTargetAccountId] = useState<number | ''>('');
  const [transferAmount, setTransferAmount] = useState('');

  const resetTransferForm = () => {
    setSourceAccountId('');
    setTargetAccountId('');
    setTransferAmount('');
  };

  const getBankBranding = (name: string) => {
    const lowerName = name.toLowerCase();
    const found = Object.values(BANK_BRANDING).find((b) =>
      b.keywords.some((kw) => lowerName.includes(kw))
    );
    return (
      found || {
        name,
        color: '#1ea672',
        logo: 'https://www.svgrepo.com/show/511585/building-6.svg',
      }
    );
  };

  const handleBankNameChange = (val: string) => {
    setBankName(val);
    const lowerVal = val.toLowerCase();
    for (const branding of Object.values(BANK_BRANDING)) {
      if (branding.keywords.some((kw) => lowerVal.includes(kw)) && val.length > 2) {
        if (branding.name !== val) {
          setBankName(branding.name);
        }
        break;
      }
    }
  };

  const resetAccountForm = () => {
    setEditId(null);
    setAccountName('');
    setBankName('');
    setAccountType('Savings');
    setBalance('');
    setCurrency('INR');
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName || !balance || !bankName) return;

    try {
      if (editId !== null) {
        await updateAccount(editId, {
          name: accountName,
          bankName,
          type: accountType,
          balance: parseFloat(balance),
          currency,
        });
        showNotification('success', 'Account updated successfully');
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
      showNotification('error', 'Failed to save account.');
    }
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
      showNotification('error', 'Failed to add funds.');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceAccountId || !targetAccountId || !transferAmount) return;
    try {
      const amount = parseFloat(transferAmount);
      const source = accounts.find((a) => a.id === Number(sourceAccountId));
      const target = accounts.find((a) => a.id === Number(targetAccountId));
      if (!source || !target || source.balance < amount) {
        showNotification('error', 'Invalid transfer request.');
        return;
      }
      await Promise.all([
        updateAccount(source.id, { balance: source.balance - amount }),
        updateAccount(target.id, { balance: target.balance + amount }),
      ]);
      showNotification('success', 'Transfer successful');
      setIsTransferModalOpen(false);
      resetTransferForm();
    } catch {
      showNotification('error', 'Transfer failed.');
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

  const liquidityChartAccounts = useMemo(
    () =>
      accounts
        .filter((a) => a.currency === 'INR' && a.balance > 0)
        .sort((a, b) => b.balance - a.balance),
    [accounts]
  );

  const totalBalanceINR = liquidityChartAccounts.reduce((sum, acc) => sum + acc.balance, 0);

  const groupedAccounts = useMemo(() => {
    const order = ['Savings', 'Checking', 'Investment', 'Credit Card', 'Cash'];
    const groups: Record<string, Account[]> = {};
    accounts.forEach((acc) => {
      if (!groups[acc.type]) groups[acc.type] = [];
      groups[acc.type].push(acc);
    });
    const sorted: Record<string, Account[]> = {};
    order.forEach((type) => {
      if (groups[type]) sorted[type] = groups[type];
    });
    Object.keys(groups).forEach((type) => {
      if (!order.includes(type)) sorted[type] = groups[type];
    });
    return sorted;
  }, [accounts]);

  if (loading)
    return (
      <div
        className="page-container"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}
      >
        Loading...
      </div>
    );

  return (
    <div className="page-container">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '40px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '3rem',
              fontWeight: '950',
              margin: 0,
              letterSpacing: '-2px',
              color: '#fff',
            }}
          >
            Accounts
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem', marginTop: '4px' }}>
            Strategic management of your financial liquidity
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => {
              exportAccountsToCSV(accounts);
              showNotification('success', 'Exported!');
            }}
            className="secondary-btn"
            style={{
              padding: '12px 20px',
              borderRadius: '14px',
              background: '#050505',
              color: '#fff',
              border: '1px solid #111',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            Export CSV
          </button>
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="secondary-btn"
            style={{
              padding: '12px 20px',
              borderRadius: '14px',
              background: '#050505',
              color: '#fff',
              border: '1px solid #111',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            Transfer
          </button>
          <button
            onClick={() => {
              resetAccountForm();
              setIsModalOpen(true);
            }}
            style={{
              padding: '12px 24px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #1ea672 0%, #16875a 100%)',
              color: '#fff',
              border: 'none',
              fontWeight: '900',
              cursor: 'pointer',
              boxShadow: '0 10px 20px rgba(30, 166, 114, 0.2)',
            }}
          >
            New Account
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div
        className="premium-card"
        style={{ padding: '48px', marginBottom: '48px', position: 'relative', overflow: 'hidden' }}
      >
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: '40px',
          }}
        >
          <div style={{ flex: 1, minWidth: '320px' }}>
            <div
              style={{
                color: '#64748b',
                fontSize: '1rem',
                fontWeight: '900',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#1ea672',
                  boxShadow: '0 0 15px #1ea672',
                }}
              />
              Total Liquidity
            </div>
            <div
              style={{
                fontSize: 'clamp(3.5rem, 8vw, 5.5rem)',
                fontWeight: '950',
                color: '#fff',
                letterSpacing: '-4px',
                lineHeight: 0.9,
                marginBottom: '40px',
              }}
            >
              ₹{totalBalanceINR.toLocaleString()}
            </div>

            <div
              style={{
                height: '12px',
                width: '100%',
                display: 'flex',
                borderRadius: '20px',
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.05)',
                marginBottom: '32px',
              }}
            >
              {liquidityChartAccounts.map((acc) => (
                <div
                  key={acc.id}
                  style={{
                    width: `${(acc.balance / totalBalanceINR) * 100}%`,
                    height: '100%',
                    background: getBankBranding(acc.bankName).color,
                    transition: '0.4s',
                  }}
                />
              ))}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '16px',
              }}
            >
              {liquidityChartAccounts.slice(0, 6).map((acc) => {
                const branding = getBankBranding(acc.bankName);
                return (
                  <div
                    key={acc.id}
                    style={{
                      padding: '16px',
                      borderRadius: '16px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div
                      style={{
                        width: '4px',
                        height: '30px',
                        borderRadius: '4px',
                        background: branding.color,
                      }}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: '#64748b',
                          fontWeight: '900',
                          textTransform: 'uppercase',
                        }}
                      >
                        {acc.name}
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '950', color: '#fff' }}>
                        ₹{acc.balance.toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className="hide-mobile"
            style={{ width: '240px', height: '240px', position: 'relative' }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={liquidityChartAccounts}
                  cx="50%"
                  cy="50%"
                  innerRadius="70%"
                  outerRadius="95%"
                  dataKey="balance"
                  paddingAngle={2}
                >
                  {liquidityChartAccounts.map((acc, i) => (
                    <Cell key={i} fill={getBankBranding(acc.bankName).color} stroke="transparent" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <div style={{ fontSize: '0.7rem', fontWeight: '900', color: '#64748b' }}>ASSETS</div>
              <div style={{ fontSize: '1.75rem', fontWeight: '950', color: '#fff' }}>
                {liquidityChartAccounts.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid - Horizontal layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
          gap: '32px',
          alignItems: 'start',
        }}
      >
        {Object.entries(groupedAccounts).map(([type, typeAccounts]) => (
          <div
            key={type}
            className="liquid-glass-group"
            style={{
              background: 'rgba(255,255,255,0.015)',
              borderRadius: '32px',
              padding: '24px',
              border: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ color: '#1ea672' }}>{getAccountIcon(type)}</div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '950', color: '#fff', margin: 0 }}>
                  {type === 'Cash' ? 'Cash' : type}
                </h2>
              </div>
              <div
                style={{
                  background: 'rgba(30, 166, 114, 0.1)',
                  color: '#1ea672',
                  fontSize: '0.8rem',
                  fontWeight: '900',
                  padding: '4px 12px',
                  borderRadius: '12px',
                }}
              >
                {typeAccounts.length}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {typeAccounts.map((account) => {
                const branding = getBankBranding(account.bankName);
                return (
                  <div
                    key={account.id}
                    className="premium-card"
                    style={{
                      padding: '20px',
                      borderLeft: `4px solid ${branding.color}`,
                      background: 'rgba(0,0,0,0.2)',
                      cursor: 'pointer',
                      transition: '0.3s',
                    }}
                    onClick={() => handleEditClick(account)}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div
                          style={{
                            background: '#fff',
                            padding: '6px',
                            borderRadius: '12px',
                            width: '48px',
                            height: '48px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                          }}
                        >
                          <img
                            src={branding.logo}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            onError={(e) =>
                              ((e.target as HTMLImageElement).src =
                                'https://www.svgrepo.com/show/511585/building-6.svg')
                            }
                          />
                        </div>
                        <div>
                          <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#fff' }}>
                            {account.name}
                          </div>
                          <div
                            style={{
                              fontSize: '0.7rem',
                              color: '#64748b',
                              fontWeight: '800',
                              textTransform: 'uppercase',
                            }}
                          >
                            {branding.name}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            fontSize: '1.6rem',
                            fontWeight: '950',
                            color: '#fff',
                            letterSpacing: '-1px',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.9rem',
                              color: branding.color,
                              marginRight: '4px',
                            }}
                          >
                            ₹
                          </span>
                          {account.balance.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '8px',
                        marginTop: '16px',
                        paddingTop: '16px',
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                      }}
                    >
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const ok = await customConfirm({
                            title: 'Delete Account?',
                            message: `Remove ${account.name}?`,
                            confirmLabel: 'Delete',
                            type: 'error',
                          });
                          if (ok) {
                            await deleteAccount(account.id);
                            showNotification('success', 'Removed');
                          }
                        }}
                        style={{
                          background: 'rgba(244, 63, 94, 0.1)',
                          border: 'none',
                          color: '#fb7185',
                          padding: '8px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAccountId(account.id);
                          setIsAddFundsModalOpen(true);
                        }}
                        style={{
                          background: branding.color,
                          color: '#fff',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '12px',
                          fontWeight: '950',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                        }}
                      >
                        ADD FUNDS
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {isModalOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}
        >
          <div className="modal-card" style={{ maxWidth: '500px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px',
              }}
            >
              <h2 style={{ fontSize: '2rem', fontWeight: '950', color: '#fff' }}>
                {editId ? 'Edit Account' : 'New Account'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>
            <form
              onSubmit={handleAddAccount}
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '900',
                    color: '#64748b',
                    textTransform: 'uppercase',
                  }}
                >
                  Account Name
                </label>
                <input
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. Primary Savings"
                  style={{
                    background: '#000',
                    border: '1px solid #1a1a1a',
                    padding: '16px',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: '1rem',
                  }}
                  required
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '900',
                    color: '#64748b',
                    textTransform: 'uppercase',
                  }}
                >
                  Financial Institution
                </label>
                <input
                  value={bankName}
                  onChange={(e) => handleBankNameChange(e.target.value)}
                  placeholder="e.g. HDFC Bank"
                  style={{
                    background: '#000',
                    border: '1px solid #1a1a1a',
                    padding: '16px',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: '1rem',
                  }}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '900',
                      color: '#64748b',
                      textTransform: 'uppercase',
                    }}
                  >
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as 'INR' | 'USD')}
                    style={{
                      background: '#000',
                      border: '1px solid #1a1a1a',
                      padding: '16px',
                      borderRadius: '16px',
                      color: '#fff',
                      fontSize: '1rem',
                    }}
                  >
                    <option value="INR">₹ INR</option>
                    <option value="USD">$ USD</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '900',
                      color: '#64748b',
                      textTransform: 'uppercase',
                    }}
                  >
                    Type
                  </label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as AccountType)}
                    style={{
                      background: '#000',
                      border: '1px solid #1a1a1a',
                      padding: '16px',
                      borderRadius: '16px',
                      color: '#fff',
                      fontSize: '1rem',
                    }}
                  >
                    <option value="Savings">Savings</option>
                    <option value="Checking">Checking</option>
                    <option value="Investment">Investment</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '900',
                    color: '#64748b',
                    textTransform: 'uppercase',
                  }}
                >
                  Initial Balance
                </label>
                <input
                  type="number"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  placeholder="0.00"
                  style={{
                    background: '#000',
                    border: '1px solid #1a1a1a',
                    padding: '16px',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: '1rem',
                  }}
                  required
                />
              </div>
              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #1ea672 0%, #16875a 100%)',
                  color: '#fff',
                  padding: '20px',
                  borderRadius: '18px',
                  border: 'none',
                  fontWeight: '950',
                  cursor: 'pointer',
                  marginTop: '12px',
                }}
              >
                {editId ? 'Update Account' : 'Establish Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {isAddFundsModalOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setIsAddFundsModalOpen(false)}
        >
          <div className="modal-card" style={{ maxWidth: '450px' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '950', marginBottom: '24px' }}>
              Add Funds
            </h2>
            <form
              onSubmit={handleAddFundsSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              <input
                type="number"
                value={addFundsAmount}
                onChange={(e) => setAddFundsAmount(e.target.value)}
                placeholder="Amount"
                style={{
                  background: '#000',
                  border: '1px solid #1a1a1a',
                  padding: '16px',
                  borderRadius: '16px',
                  color: '#fff',
                }}
                required
              />
              <input
                value={addFundsDescription}
                onChange={(e) => setAddFundsDescription(e.target.value)}
                placeholder="Description (optional)"
                style={{
                  background: '#000',
                  border: '1px solid #1a1a1a',
                  padding: '16px',
                  borderRadius: '16px',
                  color: '#fff',
                }}
              />
              <button
                type="submit"
                style={{
                  background: '#1ea672',
                  color: '#fff',
                  padding: '16px',
                  borderRadius: '16px',
                  border: 'none',
                  fontWeight: '950',
                  cursor: 'pointer',
                }}
              >
                Confirm Deposit
              </button>
            </form>
          </div>
        </div>
      )}

      {isTransferModalOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setIsTransferModalOpen(false)}
        >
          <div className="modal-card" style={{ maxWidth: '500px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '950', marginBottom: '32px' }}>
              Inter-Account Transfer
            </h2>
            <form
              onSubmit={handleTransfer}
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              <select
                value={sourceAccountId}
                onChange={(e) => setSourceAccountId(Number(e.target.value))}
                style={{
                  background: '#000',
                  border: '1px solid #1a1a1a',
                  padding: '16px',
                  borderRadius: '16px',
                  color: '#fff',
                }}
              >
                <option value="">Source Account</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} (₹{a.balance.toLocaleString()})
                  </option>
                ))}
              </select>
              <select
                value={targetAccountId}
                onChange={(e) => setTargetAccountId(Number(e.target.value))}
                style={{
                  background: '#000',
                  border: '1px solid #1a1a1a',
                  padding: '16px',
                  borderRadius: '16px',
                  color: '#fff',
                }}
              >
                <option value="">Destination Account</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="Transfer Amount"
                style={{
                  background: '#000',
                  border: '1px solid #1a1a1a',
                  padding: '16px',
                  borderRadius: '16px',
                  color: '#fff',
                }}
                required
              />
              <button
                type="submit"
                style={{
                  background: '#43c08a',
                  color: '#fff',
                  padding: '20px',
                  borderRadius: '18px',
                  border: 'none',
                  fontWeight: '950',
                  cursor: 'pointer',
                }}
              >
                Initialize Transfer
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
