'use client';

import { useState, useMemo, type ReactNode } from 'react';
import { useNotifications } from '../components/NotificationContext';
import { useLedger, useSettings } from '../components/FinanceContext';
import { AppSettings, Account } from '@/lib/types';
import {
  User,
  Building2,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Wallet,
  Banknote,
  Zap,
  BookOpen,
  ShoppingBag,
  Target,
  Users,
  Landmark,
  Globe,
  Palette,
  LayoutDashboard,
  Bell,
  Shield,
  Database,
  RefreshCw,
  ChevronRight,
  Check,
  AlertCircle,
  ArrowRight,
  Info,
  Moon,
  Sun,
  Monitor,
  Eye,
  EyeOff,
  Save,
  Undo2,
} from 'lucide-react';

type SettingsTab = 'profile' | 'accounts' | 'modules' | 'security';

const DEFAULT_SETTINGS: AppSettings = {
  brokerageType: 'flat',
  brokerageValue: 0,
  sttRate: 0.1,
  transactionChargeRate: 0.00307,
  sebiChargeRate: 0.0001,
  stampDutyRate: 0.015,
  gstRate: 18,
  dpCharges: 15.34,
  autoCalculateCharges: true,
  stocksVisible: true,
  mutualFundsVisible: true,
  fnoVisible: true,
  ledgerVisible: true,
  incomeVisible: true,
  expensesVisible: true,
  goalsVisible: true,
  familyVisible: true,
  bondsVisible: true,
  forexVisible: true,
};

interface SidebarItem {
  key: keyof AppSettings;
  label: string;
  description: string;
  icon: ReactNode;
  color: string;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    key: 'stocksVisible',
    label: 'Stocks',
    description: 'Equity portfolio & trading',
    icon: <TrendingUp size={18} />,
    color: '#10b981',
  },
  {
    key: 'mutualFundsVisible',
    label: 'Mutual Funds',
    description: 'SIP & lumpsum investments',
    icon: <Wallet size={18} />,
    color: '#f59e0b',
  },
  {
    key: 'fnoVisible',
    label: 'F&O',
    description: 'Futures & Options',
    icon: <Zap size={18} />,
    color: '#a78bfa',
  },
  {
    key: 'bondsVisible',
    label: 'Bonds',
    description: 'Fixed income securities',
    icon: <Landmark size={18} />,
    color: '#2dd4bf',
  },
  {
    key: 'forexVisible',
    label: 'Forex',
    description: 'Currency tracking',
    icon: <Globe size={18} />,
    color: '#f43f5e',
  },
  {
    key: 'ledgerVisible',
    label: 'Ledger',
    description: 'Cash movements & transactions',
    icon: <BookOpen size={18} />,
    color: '#60a5fa',
  },
  {
    key: 'incomeVisible',
    label: 'Income',
    description: 'Salary & earnings',
    icon: <Banknote size={18} />,
    color: '#34d399',
  },
  {
    key: 'expensesVisible',
    label: 'Expenses',
    description: 'Spending tracker',
    icon: <ShoppingBag size={18} />,
    color: '#fb923c',
  },
  {
    key: 'goalsVisible',
    label: 'Goals',
    description: 'Financial milestones',
    icon: <Target size={18} />,
    color: '#f472b6',
  },
  {
    key: 'familyVisible',
    label: 'Family',
    description: 'Transfers & gifts',
    icon: <Users size={18} />,
    color: '#c084fc',
  },
];

export default function SettingsPage() {
  const { accounts, loading } = useLedger();
  const { settings, updateSettings } = useSettings();
  const { showNotification, confirm: customConfirm } = useNotifications();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isSaving, setIsSaving] = useState(false);

  const enabledModulesCount = useMemo(() => {
    return SIDEBAR_ITEMS.filter((item) => settings[item.key] !== false).length;
  }, [settings]);

  const resetToDefaults = async () => {
    const isConfirmed = await customConfirm({
      title: 'Reset Settings',
      message: 'All settings will be restored to default values. This action cannot be undone.',
      type: 'warning',
      confirmLabel: 'Reset All',
      cancelLabel: 'Cancel',
    });
    if (!isConfirmed) return;
    setIsSaving(true);
    await updateSettings(DEFAULT_SETTINGS);
    showNotification('info', 'Settings have been reset to defaults');
    setIsSaving(false);
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
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <RefreshCw
              size={32}
              className="spin-animation"
              style={{ color: '#1ea672', marginBottom: '16px' }}
            />
            <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Loading settings...</div>
          </div>
        </div>
      </div>
    );
  }

  const tabs: Array<{ id: SettingsTab; label: string; icon: ReactNode; description: string }> = [
    {
      id: 'profile',
      label: 'Profile',
      icon: <User size={20} />,
      description: 'Personal information',
    },
    {
      id: 'accounts',
      label: 'Accounts',
      icon: <Building2 size={20} />,
      description: 'Default account preferences',
    },
    {
      id: 'modules',
      label: 'Modules',
      icon: <LayoutDashboard size={20} />,
      description: 'Feature visibility',
    },
    {
      id: 'security',
      label: 'Security',
      icon: <Shield size={20} />,
      description: 'Data & privacy',
    },
  ];

  return (
    <div
      className="page-container page-surface"
      style={{ paddingTop: 'clamp(12px, 3vw, 24px)', paddingBottom: '80px' }}
    >
      {/* Header */}
      <header className="fade-in" style={{ marginBottom: '40px' }}>
        <h1
          style={{
            fontSize: 'clamp(2rem, 5vw, 2.75rem)',
            fontWeight: '900',
            margin: 0,
            letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, #f4f8f7 0%, #43c08a 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Settings
        </h1>
        <p style={{ color: '#9aaea9', marginTop: '8px', fontSize: '1.05rem' }}>
          Manage your workspace preferences and configurations
        </p>
      </header>

      <div style={{ display: 'flex', gap: '32px', flexDirection: 'column' }}>
        {/* Tab Navigation - Horizontal Scrollable */}
        <div className="fade-in" style={{ animationDelay: '0.05s' }}>
          <div
            className="page-tab-bar"
            style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '8px',
              scrollbarWidth: 'none',
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '14px 20px',
                  borderRadius: '14px',
                  background:
                    activeTab === tab.id
                      ? 'linear-gradient(135deg, rgba(30, 166, 114, 0.15) 0%, rgba(20, 109, 99, 0.15) 100%)'
                      : 'rgba(255, 255, 255, 0.03)',
                  color: activeTab === tab.id ? '#43c08a' : '#9aaea9',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  whiteSpace: 'nowrap',
                  border:
                    activeTab === tab.id
                      ? '1px solid rgba(30, 166, 114, 0.3)'
                      : '1px solid transparent',
                  boxShadow: activeTab === tab.id ? '0 4px 20px rgba(30, 166, 114, 0.15)' : 'none',
                }}
              >
                {tab.icon}
                <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="fade-in" style={{ animationDelay: '0.1s' }}>
          {activeTab === 'profile' && (
            <ProfileSection settings={settings} updateSettings={updateSettings} />
          )}
          {activeTab === 'accounts' && (
            <AccountsSection
              settings={settings}
              updateSettings={updateSettings}
              accounts={accounts}
            />
          )}
          {activeTab === 'modules' && (
            <ModulesSection
              settings={settings}
              updateSettings={updateSettings}
              sidebarItems={SIDEBAR_ITEMS}
              enabledCount={enabledModulesCount}
            />
          )}
          {activeTab === 'security' && (
            <SecuritySection onReset={resetToDefaults} isSaving={isSaving} />
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileSection({
  settings,
  updateSettings,
}: {
  settings: AppSettings;
  updateSettings: (s: Partial<AppSettings>) => void;
}) {
  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* Profile Card */}
      <div
        style={{
          background: 'rgba(11, 21, 25, 0.78)',
          borderRadius: '24px',
          border: '1px solid rgba(160, 188, 180, 0.14)',
          padding: '32px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #1ea672 0%, #146d63 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(30, 166, 114, 0.25)',
            }}
          >
            <User size={28} color="#fff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#f4f8f7', margin: 0 }}>
              Personal Profile
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6f8480', margin: '4px 0 0' }}>
              How you appear across FINCORE
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '24px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: '700',
                color: '#9aaea9',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '10px',
              }}
            >
              Display Name
            </label>
            <input
              type="text"
              value={settings.displayName || ''}
              onChange={(e) => updateSettings({ displayName: e.target.value })}
              placeholder="Enter your display name"
              style={{
                width: '100%',
                maxWidth: '400px',
                padding: '14px 18px',
                borderRadius: '14px',
                border: '1px solid rgba(160, 188, 180, 0.16)',
                background: 'rgba(9, 18, 22, 0.95)',
                color: '#f4f8f7',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(30, 166, 114, 0.5)';
                e.target.style.boxShadow = '0 0 0 3px rgba(30, 166, 114, 0.12)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(160, 188, 180, 0.16)';
                e.target.style.boxShadow = 'none';
              }}
            />
            <p style={{ fontSize: '0.8125rem', color: '#6f8480', marginTop: '8px' }}>
              This name is displayed on your dashboard and in communications
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        <div
          style={{
            background: 'rgba(11, 21, 25, 0.6)',
            borderRadius: '16px',
            border: '1px solid rgba(160, 188, 180, 0.1)',
            padding: '20px',
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              color: '#6f8480',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '8px',
            }}
          >
            Profile Status
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Check size={18} color="#20b072" />
            <span style={{ fontWeight: '700', color: '#f4f8f7' }}>Active</span>
          </div>
        </div>
        <div
          style={{
            background: 'rgba(11, 21, 25, 0.6)',
            borderRadius: '16px',
            border: '1px solid rgba(160, 188, 180, 0.1)',
            padding: '20px',
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              color: '#6f8480',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '8px',
            }}
          >
            Last Updated
          </div>
          <div style={{ fontWeight: '700', color: '#f4f8f7' }}>Just now</div>
        </div>
      </div>
    </div>
  );
}

function AccountsSection({
  settings,
  updateSettings,
  accounts,
}: {
  settings: AppSettings;
  updateSettings: (s: Partial<AppSettings>) => void;
  accounts: Account[];
}) {
  const accountOptions = accounts.map((acc) => ({
    value: acc.id,
    label: `${acc.name} • ₹${acc.balance.toLocaleString()}`,
  }));

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <div
        style={{
          background: 'rgba(11, 21, 25, 0.78)',
          borderRadius: '24px',
          border: '1px solid rgba(160, 188, 180, 0.14)',
          padding: '32px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #43c08a 0%, #1ea672 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(30, 166, 114, 0.25)',
            }}
          >
            <CreditCard size={28} color="#fff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#f4f8f7', margin: 0 }}>
              Default Accounts
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6f8480', margin: '4px 0 0' }}>
              Pre-selected accounts for faster transaction entry
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '24px' }}>
          <AccountSelector
            label="Stock Trading Account"
            icon={<TrendingUp size={18} />}
            iconColor="#10b981"
            value={settings.defaultStockAccountId}
            onChange={(val) => updateSettings({ defaultStockAccountId: val })}
            options={accountOptions}
          />
          <AccountSelector
            label="Mutual Fund Account"
            icon={<PiggyBank size={18} />}
            iconColor="#f59e0b"
            value={settings.defaultMfAccountId}
            onChange={(val) => updateSettings({ defaultMfAccountId: val })}
            options={accountOptions}
          />
          <AccountSelector
            label="Salary/Income Account"
            icon={<Banknote size={18} />}
            iconColor="#34d399"
            value={settings.defaultSalaryAccountId}
            onChange={(val) => updateSettings({ defaultSalaryAccountId: val })}
            options={accountOptions}
          />
        </div>
      </div>

      {/* Info Banner */}
      <div
        style={{
          background: 'rgba(30, 166, 114, 0.08)',
          borderRadius: '16px',
          border: '1px solid rgba(30, 166, 114, 0.2)',
          padding: '20px 24px',
          display: 'flex',
          gap: '16px',
          alignItems: 'flex-start',
        }}
      >
        <Info size={20} color="#43c08a" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.875rem', color: '#9aaea9', lineHeight: 1.6 }}>
          Default accounts are automatically selected when adding new transactions, saving you time
          and ensuring consistency in your records.
        </div>
      </div>
    </div>
  );
}

function AccountSelector({
  label,
  icon,
  iconColor,
  value,
  onChange,
  options,
}: {
  label: string;
  icon: ReactNode;
  iconColor: string;
  value: number | undefined;
  onChange: (val: number | undefined) => void;
  options: Array<{ value: number; label: string }>;
}) {
  return (
    <div>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.875rem',
          fontWeight: '700',
          color: '#f4f8f7',
          marginBottom: '10px',
        }}
      >
        <span style={{ color: iconColor }}>{icon}</span>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
          style={{
            width: '100%',
            maxWidth: '500px',
            padding: '14px 48px 14px 18px',
            borderRadius: '14px',
            border: '1px solid rgba(160, 188, 180, 0.16)',
            background: 'rgba(9, 18, 22, 0.95)',
            color: '#f4f8f7',
            fontSize: '0.95rem',
            outline: 'none',
            cursor: 'pointer',
            appearance: 'none',
            transition: 'all 0.2s',
          }}
        >
          <option value="">Select an account...</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronRight
          size={18}
          color="#6f8480"
          style={{
            position: 'absolute',
            right: '18px',
            top: '50%',
            transform: 'translateY(-50%) rotate(90deg)',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}

function ModulesSection({
  settings,
  updateSettings,
  sidebarItems,
  enabledCount,
}: {
  settings: AppSettings;
  updateSettings: (s: Partial<AppSettings>) => void;
  sidebarItems: SidebarItem[];
  enabledCount: number;
}) {
  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <div
        style={{
          background: 'rgba(11, 21, 25, 0.78)',
          borderRadius: '24px',
          border: '1px solid rgba(160, 188, 180, 0.14)',
          padding: '32px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(167, 139, 250, 0.25)',
            }}
          >
            <LayoutDashboard size={28} color="#fff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#f4f8f7', margin: 0 }}>
              Module Visibility
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6f8480', margin: '4px 0 0' }}>
              Control which features appear in your sidebar
            </p>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <div
              style={{
                background: 'rgba(30, 166, 114, 0.15)',
                border: '1px solid rgba(30, 166, 114, 0.3)',
                borderRadius: '20px',
                padding: '8px 16px',
                color: '#43c08a',
                fontWeight: '700',
                fontSize: '0.875rem',
              }}
            >
              {enabledCount} / {sidebarItems.length} active
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '12px',
          }}
        >
          {sidebarItems.map((item) => {
            const isActive = settings[item.key] !== false;
            return (
              <button
                key={item.key}
                onClick={() => updateSettings({ [item.key]: !isActive })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '18px 20px',
                  borderRadius: '16px',
                  border: isActive
                    ? `1px solid ${item.color}40`
                    : '1px solid rgba(255, 255, 255, 0.06)',
                  background: isActive
                    ? `rgba(${item.key === 'stocksVisible' ? '16, 185, 129' : item.key === 'mutualFundsVisible' ? '245, 158, 11' : item.key === 'fnoVisible' ? '167, 139, 250' : '30, 166, 114'}, 0.08)`
                    : 'rgba(255, 255, 255, 0.02)',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: isActive ? `${item.color}20` : 'rgba(255, 255, 255, 0.04)',
                    color: isActive ? item.color : '#52525b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: '700',
                      fontSize: '0.95rem',
                      color: isActive ? '#f4f8f7' : '#71717a',
                      marginBottom: '2px',
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: isActive ? '#9aaea9' : '#52525b',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.description}
                  </div>
                </div>
                <div
                  style={{
                    width: '48px',
                    height: '26px',
                    borderRadius: '13px',
                    background: isActive ? item.color : '#1a1a1a',
                    position: 'relative',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#fff',
                      position: 'absolute',
                      top: '3px',
                      left: isActive ? '25px' : '3px',
                      transition: 'all 0.3s cubic-bezier(0.19, 1, 0.22, 1)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SecuritySection({ onReset, isSaving }: { onReset: () => void; isSaving: boolean }) {
  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <div
        style={{
          background: 'rgba(11, 21, 25, 0.78)',
          borderRadius: '24px',
          border: '1px solid rgba(160, 188, 180, 0.14)',
          padding: '32px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(239, 68, 68, 0.25)',
            }}
          >
            <Shield size={28} color="#fff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#f4f8f7', margin: 0 }}>
              Security & Data
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6f8480', margin: '4px 0 0' }}>
              Manage your data and privacy settings
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '20px' }}>
          {/* Data Storage Info */}
          <div
            style={{
              padding: '24px',
              background: 'rgba(30, 166, 114, 0.06)',
              borderRadius: '16px',
              border: '1px solid rgba(30, 166, 114, 0.15)',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}
            >
              <Database size={20} color="#43c08a" />
              <span style={{ fontWeight: '700', color: '#f4f8f7' }}>Data Storage</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#9aaea9', lineHeight: 1.6 }}>
              Your financial data is securely encrypted and stored in your private vault. All
              information is synchronized across your devices in real-time.
            </p>
          </div>

          {/* Reset Button */}
          <div
            style={{
              padding: '24px',
              background: 'rgba(239, 68, 68, 0.06)',
              borderRadius: '16px',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '20px',
            }}
          >
            <div>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}
              >
                <Undo2 size={18} color="#ef4444" />
                <span style={{ fontWeight: '700', color: '#f4f8f7' }}>Reset to Defaults</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#9aaea9', margin: 0 }}>
                Restore all settings to their original values. This cannot be undone.
              </p>
            </div>
            <button
              onClick={onReset}
              disabled={isSaving}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: '#fff',
                fontWeight: '700',
                fontSize: '0.9rem',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(239, 68, 68, 0.3)',
                transition: 'all 0.2s',
              }}
            >
              {isSaving ? (
                <>
                  <RefreshCw size={16} className="spin-animation" />
                  Resetting...
                </>
              ) : (
                <>
                  <Undo2 size={16} />
                  Reset All
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
