'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
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
  Search,
} from 'lucide-react';

interface BankBranding {
  name: string;
  color: string;
  keywords: string[];
  logo: string;
}

const BANK_BRANDING: Record<string, BankBranding> = {
  hdfc: {
    name: 'HDFC Bank',
    color: '#d32f2f',
    keywords: ['hdfc'],
    logo: 'https://logo.clearbit.com/hdfcbank.com',
  },
  icici: {
    name: 'ICICI Bank',
    color: '#e65100',
    keywords: ['icici'],
    logo: 'https://logo.clearbit.com/icicibank.com',
  },
  sbi: {
    name: 'State Bank of India',
    color: '#00695c',
    keywords: ['sbi', 'state bank'],
    logo: 'https://logo.clearbit.com/sbi.co.in',
  },
  axis: {
    name: 'Axis Bank',
    color: '#1a237e',
    keywords: ['axis'],
    logo: 'https://logo.clearbit.com/axisbank.com',
  },
  kotak: {
    name: 'Kotak Mahindra Bank',
    color: '#c62828',
    keywords: ['kotak'],
    logo: 'https://logo.clearbit.com/kotak.com',
  },
  idfc: {
    name: 'IDFC First Bank',
    color: '#1565c0',
    keywords: ['idfc'],
    logo: 'https://logo.clearbit.com/idfcfirstbank.com',
  },
  yes: {
    name: 'Yes Bank',
    color: '#d50000',
    keywords: ['yes bank', 'yes'],
    logo: 'https://logo.clearbit.com/yesbank.in',
  },
  indusind: {
    name: 'IndusInd Bank',
    color: '#ff6f00',
    keywords: ['indusind'],
    logo: 'https://logo.clearbit.com/indusind.com',
  },
  pnb: {
    name: 'Punjab National Bank',
    color: '#1565c0',
    keywords: ['pnb', 'punjab national'],
    logo: 'https://logo.clearbit.com/pnbindia.in',
  },
  canara: {
    name: 'Canara Bank',
    color: '#004d40',
    keywords: ['canara'],
    logo: 'https://logo.clearbit.com/canarabank.com',
  },
  bob: {
    name: 'Bank of Baroda',
    color: '#1e3a8a',
    keywords: ['bank of baroda', 'bob'],
    logo: 'https://logo.clearbit.com/bankofbaroda.in',
  },
  union: {
    name: 'Union Bank of India',
    color: '#0d47a1',
    keywords: ['union bank', 'union'],
    logo: 'https://logo.clearbit.com/unionbankofindia.co.in',
  },
  uco: {
    name: 'UCO Bank',
    color: '#b71c1c',
    keywords: ['uco'],
    logo: 'https://logo.clearbit.com/ucobank.com',
  },
  boi: {
    name: 'Bank of India',
    color: '#1e3a8a',
    keywords: ['bank of india', 'boi'],
    logo: 'https://logo.clearbit.com/bankofindia.co.in',
  },
  federal: {
    name: 'Federal Bank',
    color: '#d84315',
    keywords: ['federal'],
    logo: 'https://logo.clearbit.com/federalbank.co.in',
  },
  southindian: {
    name: 'South Indian Bank',
    color: '#f57f17',
    keywords: ['south indian', 'sib'],
    logo: 'https://logo.clearbit.com/southindianbank.com',
  },
  karnataka: {
    name: 'Karnataka Bank',
    color: '#1565c0',
    keywords: ['karnataka bank', 'karnataka'],
    logo: 'https://logo.clearbit.com/karnatakabank.com',
  },
  dbs: {
    name: 'DBS Bank',
    color: '#0d47a1',
    keywords: ['dbs'],
    logo: 'https://logo.clearbit.com/dbs.com',
  },
  citibank: {
    name: 'Citibank',
    color: '#003b70',
    keywords: ['citi'],
    logo: 'https://logo.clearbit.com/citibank.com',
  },
  hsbc: {
    name: 'HSBC India',
    color: '#db0011',
    keywords: ['hsbc'],
    logo: 'https://logo.clearbit.com/hsbc.com',
  },
  scb: {
    name: 'Standard Chartered',
    color: '#003d71',
    keywords: ['standard chartered', 'scb'],
    logo: 'https://logo.clearbit.com/sc.com',
  },
  paytm: {
    name: 'Paytm Payments Bank',
    color: '#00baf2',
    keywords: ['paytm'],
    logo: 'https://logo.clearbit.com/paytm.com',
  },
  jupiter: {
    name: 'Jupiter Money',
    color: '#6c5ce7',
    keywords: ['jupiter'],
    logo: 'https://logo.clearbit.com/jupiter.money',
  },
  fi: {
    name: 'Fi Money',
    color: '#10b981',
    keywords: [' fi ', 'fi money'],
    logo: 'https://logo.clearbit.com/fi.money',
  },
  airtel: {
    name: 'Airtel Payments Bank',
    color: '#e40000',
    keywords: ['airtel'],
    logo: 'https://logo.clearbit.com/airtel.in',
  },
  cash: {
    name: 'Physical Cash',
    color: '#10b981',
    keywords: ['cash', 'physical cash'],
    logo: '',
  },
};

const DEFAULT_BRAND_COLOR = '#1ea672';

const CHART_COLORS = [
  '#d32f2f',
  '#1976d2',
  '#388e3c',
  '#f57c00',
  '#7b1fa2',
  '#c2185b',
  '#0097a7',
  '#455a64',
  '#e65100',
  '#5d4037',
  '#1a237e',
  '#00695c',
  '#304ffe',
  '#00bfa5',
  '#ff6f00',
  '#827717',
  '#e91e63',
  '#00acc1',
  '#8e24aa',
  '#ff8f00',
];

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
        color: DEFAULT_BRAND_COLOR,
        logo: '',
      }
    );
  };

  const getChartColor = (index: number) => CHART_COLORS[index % CHART_COLORS.length];

  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const bankDropdownRef = useRef<HTMLDivElement>(null);

  const filteredBanks = useMemo(() => {
    if (!bankSearchQuery.trim()) return Object.values(BANK_BRANDING).slice(0, 10);
    const query = bankSearchQuery.toLowerCase();
    return Object.values(BANK_BRANDING)
      .filter(
        (bank) =>
          bank.name.toLowerCase().includes(query) || bank.keywords.some((k) => k.includes(query))
      )
      .slice(0, 10);
  }, [bankSearchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bankDropdownRef.current && !bankDropdownRef.current.contains(event.target as Node)) {
        setShowBankDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectBank = (bank: BankBranding) => {
    setBankName(bank.name);
    setBankSearchQuery(bank.name);
    setShowBankDropdown(false);
  };

  const handleBankNameChange = (val: string) => {
    setBankName(val);
    setBankSearchQuery(val);
    setShowBankDropdown(true);
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

  const displayAccounts = useMemo(() => {
    return [...accounts].sort((a, b) => b.balance - a.balance);
  }, [accounts]);

  if (loading)
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
            <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>Loading accounts...</div>
          </div>
          <style jsx>{`
            @keyframes spin {
              to {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </div>
      </div>
    );

  return (
    <div className="page-container">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: '950',
              margin: 0,
              letterSpacing: '-2px',
              background: 'linear-gradient(135deg, #fff 0%, #1ea672 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: 'var(--font-outfit)',
            }}
          >
            Accounts
          </h1>
          <p style={{ color: '#6f8480', fontSize: '0.85rem', marginTop: '6px', fontWeight: '600' }}>
            Manage your financial accounts
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
            <Download size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
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
            <ArrowRightLeft size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Transfer
          </button>
          <button
            onClick={() => {
              resetAccountForm();
              setIsModalOpen(true);
            }}
            style={{
              padding: '14px 28px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #1ea672 0%, #146d63 100%)',
              color: '#fff',
              border: 'none',
              fontWeight: '900',
              cursor: 'pointer',
              boxShadow: '0 12px 30px rgba(30, 166, 114, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Plus size={20} />
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
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div
              style={{
                color: '#1ea672',
                fontSize: '0.75rem',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                marginBottom: '8px',
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
                  background: '#1ea672',
                  boxShadow: '0 0 12px #1ea672',
                }}
              />
              Total Liquidity
            </div>
            <div
              style={{
                fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                fontWeight: '950',
                color: '#fff',
                letterSpacing: '-3px',
                lineHeight: 1,
                marginBottom: '24px',
              }}
            >
              ₹{totalBalanceINR.toLocaleString()}
            </div>

            <div
              style={{
                height: '10px',
                width: '100%',
                display: 'flex',
                borderRadius: '20px',
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.05)',
                marginBottom: '24px',
              }}
            >
              {liquidityChartAccounts.map((acc, i) => (
                <div
                  key={acc.id}
                  style={{
                    width: `${(acc.balance / totalBalanceINR) * 100}%`,
                    height: '100%',
                    background: getChartColor(i),
                    transition: '0.4s',
                  }}
                />
              ))}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '12px',
              }}
            >
              {liquidityChartAccounts.slice(0, 6).map((acc) => {
                const branding = getBankBranding(acc.bankName);
                return (
                  <div
                    key={acc.id}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '14px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.2s',
                    }}
                  >
                    <img
                      src={branding.logo}
                      alt={branding.name}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        objectFit: 'contain',
                        background: '#fff',
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: '#9aaea9',
                          fontWeight: '700',
                        }}
                      >
                        {acc.name}
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: '800', color: '#fff' }}>
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
            style={{ width: '180px', height: '180px', position: 'relative' }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={liquidityChartAccounts}
                  cx="50%"
                  cy="50%"
                  innerRadius="65%"
                  outerRadius="90%"
                  dataKey="balance"
                  paddingAngle={4}
                >
                  {liquidityChartAccounts.map((acc, i) => (
                    <Cell key={i} fill={getChartColor(i)} stroke="transparent" />
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
              <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#1ea672' }}>TOTAL</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '950', color: '#fff' }}>
                {liquidityChartAccounts.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Grid - Single Flat List */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
        }}
      >
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#f4f8f7' }}>Active Accounts</h3>
        <span style={{ fontSize: '0.7rem', color: '#1ea672', fontWeight: 700 }}>
          {accounts.length} accounts
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        {displayAccounts.map((account) => {
          const branding = getBankBranding(account.bankName);
          const isCash = account.type === 'Cash';
          return (
            <div
              key={account.id}
              className="premium-card"
              style={{
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                position: 'relative',
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.01)',
                cursor: 'pointer',
                borderRadius: '20px',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onClick={() => handleEditClick(account)}
            >
              {/* Card Header: Logo + Account Info + Delete */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {/* Logo / Cash Icon */}
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      flexShrink: 0,
                      borderRadius: '14px',
                      background: isCash ? 'rgba(16,185,129,0.12)' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      padding: isCash ? '0' : '6px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                      border: isCash ? '1px solid rgba(16,185,129,0.25)' : 'none',
                    }}
                  >
                    {isCash ? (
                      <Coins size={26} color="#10b981" />
                    ) : (
                      <img
                        src={branding.logo}
                        alt={branding.name}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            const color = branding.color || DEFAULT_BRAND_COLOR;
                            parent.style.background = `${color}22`;
                            parent.style.border = `1px solid ${color}44`;
                            const span = document.createElement('span');
                            span.style.fontSize = '1.1rem';
                            span.style.fontWeight = '900';
                            span.style.color = color;
                            span.textContent = branding.name.charAt(0);
                            parent.appendChild(span);
                          }
                        }}
                      />
                    )}
                  </div>

                  {/* Account Name + Bank Name */}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h3
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: 800,
                        color: '#f4f8f7',
                        margin: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {account.name}
                    </h3>
                    <div
                      style={{
                        fontSize: '0.72rem',
                        color: '#9aaea9',
                        fontWeight: 600,
                        marginTop: '3px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {branding.name}
                    </div>
                  </div>
                </div>

                {/* Delete button — hidden for Cash accounts */}
                {!isCash && (
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
                      padding: '8px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'transparent',
                      color: '#64748b',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {/* Account Type Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: branding.color || DEFAULT_BRAND_COLOR }}>
                  {getAccountIcon(account.type)}
                </span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    color: branding.color || DEFAULT_BRAND_COLOR,
                    background: branding.color ? `${branding.color}18` : 'rgba(30,166,114,0.1)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {account.type}
                </span>
              </div>

              {/* Balance */}
              <div>
                <span
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 950,
                    letterSpacing: '-1px',
                    fontFamily: 'var(--font-outfit)',
                  }}
                >
                  <span style={{ fontSize: '1rem', color: '#1ea672', marginRight: '2px' }}>
                    {account.currency === 'USD' ? '$' : '₹'}
                  </span>
                  {account.balance.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Add Funds Footer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  paddingTop: '16px',
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAccountId(account.id);
                    setIsAddFundsModalOpen(true);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #1ea672 0%, #146d63 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    fontWeight: '700',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(30, 166, 114, 0.25)',
                  }}
                >
                  + ADD
                </button>
              </div>
            </div>
          );
        })}
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
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                ref={bankDropdownRef}
              >
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
                <div style={{ position: 'relative' }}>
                  <input
                    value={bankName}
                    onChange={(e) => handleBankNameChange(e.target.value)}
                    onFocus={() => setShowBankDropdown(true)}
                    placeholder="Search bank..."
                    style={{
                      background: '#000',
                      border: '1px solid #1a1a1a',
                      padding: '16px',
                      borderRadius: '16px',
                      color: '#fff',
                      fontSize: '1rem',
                      width: '100%',
                    }}
                    required
                  />
                  {showBankDropdown && filteredBanks.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: '#0a0a0a',
                        border: '1px solid #1a1a1a',
                        borderRadius: '12px',
                        marginTop: '4px',
                        maxHeight: '240px',
                        overflowY: 'auto',
                        zIndex: 1000,
                      }}
                    >
                      {filteredBanks.map((bank) => (
                        <button
                          key={bank.name}
                          type="button"
                          onClick={() => selectBank(bank)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            width: '100%',
                            padding: '12px 16px',
                            background: 'transparent',
                            border: 'none',
                            color: '#fff',
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#1a1a1a')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <img
                            src={bank.logo}
                            alt={bank.name}
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 6,
                              objectFit: 'contain',
                              background: '#fff',
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <span style={{ fontSize: '0.9rem' }}>{bank.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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
                  background: 'linear-gradient(135deg, #1ea672 0%, #146d63 100%)',
                  color: '#fff',
                  padding: '16px',
                  borderRadius: '16px',
                  border: 'none',
                  fontWeight: '950',
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(30, 166, 114, 0.2)',
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
                  background: 'linear-gradient(135deg, #1ea672 0%, #146d63 100%)',
                  color: '#fff',
                  padding: '20px',
                  borderRadius: '18px',
                  border: 'none',
                  fontWeight: '950',
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(30, 166, 114, 0.2)',
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
