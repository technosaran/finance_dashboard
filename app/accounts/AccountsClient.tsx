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
    color: '#004c8f',
    keywords: ['hdfc'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/28/HDFC_Bank_Logo.svg',
  },
  icici: {
    name: 'ICICI Bank',
    color: '#f37021',
    keywords: ['icici'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/1/12/ICICI_Bank_Logo.svg',
  },
  sbi: {
    name: 'State Bank of India',
    color: '#00695c',
    keywords: ['sbi', 'state bank'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/State_Bank_of_India_logo.svg',
  },
  axis: {
    name: 'Axis Bank',
    color: '#ae275f',
    keywords: ['axis'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Axis_Bank_logo.svg',
  },
  kotak: {
    name: 'Kotak Mahindra Bank',
    color: '#ed1c24',
    keywords: ['kotak'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Kotak_Mahindra_Bank_logo.svg',
  },
  idfc: {
    name: 'IDFC First Bank',
    color: '#9f2943',
    keywords: ['idfc'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/1/12/IDFC_First_Bank_logo.svg',
  },
  yes: {
    name: 'Yes Bank',
    color: '#0054a6',
    keywords: ['yes bank', 'yes'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/c/ce/YES_Bank_logo.svg',
  },
  indusind: {
    name: 'IndusInd Bank',
    color: '#812b10',
    keywords: ['indusind'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/6/67/IndusInd_Bank_logo.svg',
  },
  pnb: {
    name: 'Punjab National Bank',
    color: '#a32020',
    keywords: ['pnb', 'punjab national'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Punjab_National_Bank_new_logo.svg',
  },
  canara: {
    name: 'Canara Bank',
    color: '#0066a1',
    keywords: ['canara'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Canara_Bank_Logo.svg',
  },
  bob: {
    name: 'Bank of Baroda',
    color: '#f05a28',
    keywords: ['bank of baroda', 'bob'],
    logo: 'https://upload.wikimedia.org/wikipedia/en/2/23/Bank_of_Baroda_logo.svg',
  },
  union: {
    name: 'Union Bank of India',
    color: '#1a4198',
    keywords: ['union bank', 'union'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/6/62/Union_Bank_of_India_Logo.svg',
  },
  uco: {
    name: 'UCO Bank',
    color: '#006eb7',
    keywords: ['uco'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/7/77/UCO_Bank_logo.png',
  },
  boi: {
    name: 'Bank of India',
    color: '#f58220',
    keywords: ['bank of india', 'boi'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/1/10/Bank_of_India_logo.svg',
  },
  iob: {
    name: 'Indian Overseas Bank',
    color: '#005a9e',
    keywords: ['iob', 'indian overseas'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/6/66/Indian_Overseas_Bank_Logo.svg',
  },
  central: {
    name: 'Central Bank of India',
    color: '#005b8f',
    keywords: ['central bank', 'cbi'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Central_Bank_of_India.svg',
  },
  indianbank: {
    name: 'Indian Bank',
    color: '#004990',
    keywords: ['indian bank', 'ib'],
    logo: 'https://upload.wikimedia.org/wikipedia/en/2/29/Indian_Bank_logo.svg',
  },
  bom: {
    name: 'Bank of Maharashtra',
    color: '#005f9e',
    keywords: ['bank of maharashtra', 'bom', 'maha'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Bank_of_Maharashtra_logo.svg',
  },
  psb: {
    name: 'Punjab & Sind Bank',
    color: '#0e7a3f',
    keywords: ['punjab and sind', 'psb', 'punjab & sind'],
    logo: 'https://upload.wikimedia.org/wikipedia/en/f/fa/Punjab_and_Sind_Bank_logo.svg',
  },
  rbl: {
    name: 'RBL Bank',
    color: '#004481',
    keywords: ['rbl'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/0/02/RBL_Bank.svg',
  },
  bandhan: {
    name: 'Bandhan Bank',
    color: '#00529b',
    keywords: ['bandhan'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/21/Bandhan_Bank_logo.svg',
  },
  cub: {
    name: 'City Union Bank',
    color: '#004182',
    keywords: ['city union', 'cub'],
    logo: 'https://upload.wikimedia.org/wikipedia/en/b/b5/City_Union_Bank_logo.png',
  },
  kvb: {
    name: 'Karur Vysya Bank',
    color: '#1d488e',
    keywords: ['karur vysya', 'kvb'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Karur_Vysya_Bank_Logo.png',
  },
  federal: {
    name: 'Federal Bank',
    color: '#003366',
    keywords: ['federal'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Federal_Bank_Logo.svg',
  },
  southindian: {
    name: 'South Indian Bank',
    color: '#f57f17',
    keywords: ['south indian', 'sib'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/South_Indian_Bank_logo.svg',
  },
  karnataka: {
    name: 'Karnataka Bank',
    color: '#0b523e',
    keywords: ['karnataka bank', 'karnataka'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/7/71/Karnataka_Bank_Logo.svg',
  },
  dbs: {
    name: 'DBS Bank',
    color: '#ff3300',
    keywords: ['dbs'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/23/DBS_Bank_logo.svg',
  },
  citibank: {
    name: 'Citibank',
    color: '#003b70',
    keywords: ['citi'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Citibank.svg',
  },
  hsbc: {
    name: 'HSBC India',
    color: '#db0011',
    keywords: ['hsbc'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/HSBC_logo_%282018%29.svg',
  },
  scb: {
    name: 'Standard Chartered',
    color: '#00a546',
    keywords: ['standard chartered', 'scb'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/25/Standard_Chartered_%282021%29.svg',
  },
  paytm: {
    name: 'Paytm Payments Bank',
    color: '#002970',
    keywords: ['paytm'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg',
  },
  jupiter: {
    name: 'Jupiter Money',
    color: '#f05a28',
    keywords: ['jupiter'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/3/31/Jupiter.money_Logo.svg',
  },
  fi: {
    name: 'Fi Money',
    color: '#10b981',
    keywords: [' fi ', 'fi money'],
    logo: 'https://logo.clearbit.com/fi.money',
  },
  airtel: {
    name: 'Airtel Payments Bank',
    color: '#ff0000',
    keywords: ['airtel'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fe/Airtel_Payments_Bank_logo.svg',
  },
  sbm: {
    name: 'SBM Bank',
    color: '#0054a6',
    keywords: ['sbm'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5a/SBM_Bank_Logo.svg',
  },
  barclays: {
    name: 'Barclays India',
    color: '#00aeef',
    keywords: ['barclays'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Barclays_logo.svg',
  },
  cash: {
    name: 'Physical Cash',
    color: '#10b981',
    keywords: ['cash', 'physical cash'],
    logo: '',
  },
};

const BankLogo = ({
  branding,
  size = 48,
  padding = 6,
  borderRadius = 14,
  isCash = false,
}: {
  branding: BankBranding;
  size?: number;
  padding?: number;
  borderRadius?: number;
  isCash?: boolean;
}) => {
  const [error, setError] = useState(false);
  const [dynamicLogo, setDynamicLogo] = useState<string | null>(null);
  const color = branding.color || DEFAULT_BRAND_COLOR;

  useEffect(() => {
    let isMounted = true;
    if (!branding.logo || error) {
      if (branding.name && !isCash && branding.name.toLowerCase() !== 'physical cash') {
        const fetchDynamicLogo = async () => {
          try {
            // First try Clearbit autocomplete to get the domain
            const res = await fetch(
              `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(branding.name)}`
            );
            const data = await res.json();
            if (!isMounted) return;
            if (data && data.length > 0 && data[0].domain) {
              setDynamicLogo(`https://www.google.com/s2/favicons?domain=${data[0].domain}&sz=128`);
              setError(false);
              return;
            }

            // Fallback to Wikipedia API if Clearbit fails to find a domain
            const wikiRes = await fetch(
              `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(branding.name + ' bank')}&gsrlimit=1&prop=pageimages&piprop=original&format=json&origin=*`
            );
            const wikiData = await wikiRes.json();
            if (!isMounted) return;
            const pages = wikiData?.query?.pages;
            if (pages) {
              const pageId = Object.keys(pages)[0];
              const source = pages[pageId]?.original?.source;
              if (source) {
                setDynamicLogo(source);
                setError(false);
              }
            }
          } catch (e) {
            console.error('Failed to fetch dynamic logo', e);
          }
        };
        fetchDynamicLogo();
      }
    }
    return () => {
      isMounted = false;
    };
  }, [branding.logo, error, branding.name, isCash]);

  if (isCash) {
    return (
      <div
        style={{
          width: size,
          height: size,
          flexShrink: 0,
          borderRadius: borderRadius,
          background: 'rgba(16,185,129,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(16,185,129,0.25)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}
      >
        <Coins size={size * 0.54} color="#10b981" />
      </div>
    );
  }

  const finalLogo = dynamicLogo || branding.logo;

  if (error || !finalLogo) {
    return (
      <div
        style={{
          width: size,
          height: size,
          flexShrink: 0,
          borderRadius: borderRadius,
          background: `${color}22`,
          border: `1px solid ${color}44`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color,
          fontSize: `${size * 0.4}px`,
          fontWeight: '900',
          boxShadow: padding > 0 ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
        }}
      >
        {branding.name ? branding.name.charAt(0).toUpperCase() : 'B'}
      </div>
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: borderRadius,
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: padding,
        boxShadow: padding > 0 ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
        overflow: 'hidden',
      }}
    >
      <img
        src={finalLogo}
        alt={branding.name}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        onError={() => setError(true)}
      />
    </div>
  );
};

const DEFAULT_BRAND_COLOR = '#10b981';

const CHART_COLORS = [
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#f59e0b',
  '#ec4899',
  '#06b6d4',
  '#f43f5e',
  '#14b8a6',
  '#8b5cf6',
  '#eab308',
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

  const getBankBranding = (name: string): BankBranding => {
    const lowerName = name.toLowerCase();
    const found = Object.values(BANK_BRANDING).find((b) =>
      b.keywords.some((kw) => lowerName.includes(kw))
    );
    return (
      found || {
        name,
        color: DEFAULT_BRAND_COLOR,
        keywords: [],
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
    setBankSearchQuery('');
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
    setBankSearchQuery(account.bankName);
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
      if (amount <= 0) {
        showNotification('error', 'Transfer amount must be greater than 0.');
        return;
      }
      if (sourceAccountId === targetAccountId) {
        showNotification('error', 'Cannot transfer to the same account.');
        return;
      }
      const source = accounts.find((a) => a.id === Number(sourceAccountId));
      const target = accounts.find((a) => a.id === Number(targetAccountId));
      if (!source || !target || source.balance < amount) {
        showNotification('error', 'Invalid transfer request or insufficient funds.');
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
                border: '3px solid rgba(16, 185, 129, 0.1)',
                borderTopColor: '#10b981',
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
    <div className="page-container page-shell">
      <div className="dashboard-header page-shell__header">
        <div>
          <h1 className="dashboard-title">Accounts</h1>
        </div>
        <div className="page-toolbar" style={{ display: 'flex', gap: '12px' }}>
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
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              border: 'none',
              fontWeight: '900',
              cursor: 'pointer',
              boxShadow: '0 12px 30px rgba(16, 185, 129, 0.25)',
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
        className="premium-card page-shell__hero"
        style={{ position: 'relative', overflow: 'hidden' }}
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
                color: '#10b981',
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
                  background: '#10b981',
                  boxShadow: '0 0 12px #10b981',
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
                    <BankLogo branding={branding} size={24} padding={0} borderRadius={6} />
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
              <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#10b981' }}>TOTAL</div>
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
        <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700 }}>
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
          const isPhysicalCash = account.name.toLowerCase() === 'physical cash';
          return (
            <div
              key={account.id}
              className="premium-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                position: 'relative',
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.01)',
                cursor: 'pointer',
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
                  <BankLogo
                    branding={branding}
                    size={48}
                    padding={isCash ? 0 : 6}
                    borderRadius={14}
                    isCash={isCash}
                  />

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
                {!isPhysicalCash && (
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
                    background: branding.color ? `${branding.color}18` : 'rgba(16,185,129,0.1)',
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
                  <span style={{ fontSize: '1rem', color: '#10b981', marginRight: '2px' }}>
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
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    fontWeight: '700',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
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
                          <BankLogo branding={bank} size={24} padding={1} borderRadius={6} />
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
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
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
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  padding: '16px',
                  borderRadius: '16px',
                  border: 'none',
                  fontWeight: '950',
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(16, 185, 129, 0.2)',
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
                onChange={(e) => setSourceAccountId(e.target.value ? Number(e.target.value) : '')}
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
                onChange={(e) => setTargetAccountId(e.target.value ? Number(e.target.value) : '')}
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
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  padding: '20px',
                  borderRadius: '18px',
                  border: 'none',
                  fontWeight: '950',
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(16, 185, 129, 0.2)',
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
