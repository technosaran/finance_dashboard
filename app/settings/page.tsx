'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import { useNotifications } from '../components/NotificationContext';
import { useLedger, useSettings } from '../components/FinanceContext';
import { AppSettings, Account } from '@/lib/types';
import {
  Undo,
  Layers,
  Info,
  LayoutPanelLeft,
  Eye,
  Settings,
  Shield,
  ChevronRight,
  Monitor,
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
} from 'lucide-react';

type SettingsTab = 'general' | 'modules' | 'sidebar' | 'system';

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

const SIDEBAR_ITEMS: Array<{
  key: keyof AppSettings;
  label: string;
  description: string;
  icon: ReactNode;
  color: string;
}> = [
  {
    key: 'stocksVisible',
    label: 'Stocks',
    description: 'Equity portfolio',
    icon: <TrendingUp size={18} />,
    color: '#10b981',
  },
  {
    key: 'mutualFundsVisible',
    label: 'Mutual Funds',
    description: 'SIP and lumpsum holdings',
    icon: <Wallet size={18} />,
    color: '#f59e0b',
  },
  {
    key: 'fnoVisible',
    label: 'F&O',
    description: 'Futures and options',
    icon: <Zap size={18} />,
    color: '#a78bfa',
  },
  {
    key: 'ledgerVisible',
    label: 'Ledger',
    description: 'All cash movements',
    icon: <BookOpen size={18} />,
    color: '#60a5fa',
  },
  {
    key: 'incomeVisible',
    label: 'Income',
    description: 'Salary and earnings',
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
    description: 'Financial targets',
    icon: <Target size={18} />,
    color: '#f472b6',
  },
  {
    key: 'familyVisible',
    label: 'Family',
    description: 'Transfers and gifts',
    icon: <Users size={18} />,
    color: '#c084fc',
  },
  {
    key: 'bondsVisible',
    label: 'Bonds',
    description: 'Fixed-income securities',
    icon: <Landmark size={18} />,
    color: '#2dd4bf',
  },
  {
    key: 'forexVisible',
    label: 'Forex',
    description: 'Currency tracker',
    icon: <Globe size={18} />,
    color: '#f43f5e',
  },
];

export default function SettingsPage() {
  const { accounts, loading } = useLedger();
  const { settings, updateSettings } = useSettings();
  const { showNotification, confirm: customConfirm } = useNotifications();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  const resetToDefaults = async () => {
    const isConfirmed = await customConfirm({
      title: 'Reset settings',
      message: 'Reset all settings to their default values? This cannot be undone.',
      type: 'warning',
      confirmLabel: 'Reset',
    });

    if (!isConfirmed) return;

    await updateSettings(DEFAULT_SETTINGS);
    showNotification('info', 'Settings reset to defaults');
  };

  if (loading) return null;

  const tabs: Array<{ id: SettingsTab; label: string; icon: ReactNode }> = [
    { id: 'general', label: 'General', icon: <Settings size={18} /> },
    { id: 'modules', label: 'Modules', icon: <Eye size={18} /> },
    { id: 'sidebar', label: 'Sidebar', icon: <LayoutPanelLeft size={18} /> },
    { id: 'system', label: 'System', icon: <Monitor size={18} /> },
  ];

  return (
    <div className="page-container">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
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
            Settings
          </h1>
          <p
            style={{
              color: '#94a3b8',
              fontSize: 'clamp(0.875rem, 2vw, 1rem)',
              marginTop: '8px',
            }}
          >
            Manage your preferences and application defaults
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '16px',
          marginBottom: '24px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '12px',
                border: 'none',
                background: isActive
                  ? 'linear-gradient(135deg, #1a8e68 0%, #146d63 100%)'
                  : 'rgba(10, 10, 10, 0.5)',
                color: isActive ? '#fff' : '#94a3b8',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                boxShadow: isActive ? '0 4px 12px rgba(13, 78, 68, 0.28)' : 'none',
                flexShrink: 0,
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="fade-in">
        {activeTab === 'general' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <SectionCard
              title="Your Profile"
              description="Choose how your name appears in the app"
              icon={<Shield size={22} />}
              iconColor="#6366f1"
              iconBackground="rgba(99, 102, 241, 0.1)"
              style={{ marginBottom: '24px' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Display Name
                </label>
                <input
                  type="text"
                  value={settings.displayName || ''}
                  onChange={(e) => updateSettings({ displayName: e.target.value })}
                  placeholder="Enter your name"
                  style={textInputStyle}
                />
                <p style={{ fontSize: '0.75rem', color: '#475569', marginTop: '4px' }}>
                  This name is shown on the dashboard.
                </p>
              </div>
            </SectionCard>

            <SectionCard
              title="Default Accounts"
              description="Choose default accounts for new entries"
              icon={<Layers size={22} />}
              iconColor="#10b981"
              iconBackground="rgba(16, 185, 129, 0.1)"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <AccountSelect
                  label="Stock Trading Account"
                  value={settings.defaultStockAccountId}
                  onChange={(val) => updateSettings({ defaultStockAccountId: val })}
                  accounts={accounts}
                  icon={<TrendingUp size={16} />}
                />
                <AccountSelect
                  label="Mutual Fund Account"
                  value={settings.defaultMfAccountId}
                  onChange={(val) => updateSettings({ defaultMfAccountId: val })}
                  accounts={accounts}
                  icon={<Wallet size={16} />}
                />
                <AccountSelect
                  label="Salary Credit Account"
                  value={settings.defaultSalaryAccountId}
                  onChange={(val) => updateSettings({ defaultSalaryAccountId: val })}
                  accounts={accounts}
                  icon={<Banknote size={16} />}
                />
              </div>
            </SectionCard>

            <SectionCard
              title="Broker Integration"
              description="Charges are calculated inside trade forms"
              icon={<Info size={22} />}
              iconColor="#3b82f6"
              iconBackground="rgba(59, 130, 246, 0.1)"
              style={{ marginTop: '24px' }}
            >
              <div
                style={{
                  padding: '18px',
                  borderRadius: '16px',
                  background: 'rgba(59, 130, 246, 0.05)',
                  border: '1px solid rgba(59, 130, 246, 0.12)',
                  color: '#cbd5e1',
                  lineHeight: 1.6,
                }}
              >
                Delivery, Coin, and F&amp;O charge estimates are applied automatically. You can
                review the breakdown while entering trades instead of maintaining separate settings.
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === 'modules' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <SectionCard
              title="Module Overview"
              description="Use Sidebar settings to show or hide sections"
              icon={<Eye size={22} />}
              iconColor="#a855f7"
              iconBackground="rgba(168, 85, 247, 0.1)"
            >
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                <p style={{ fontSize: '0.95rem', fontWeight: '600' }}>
                  All modules are enabled for your account.
                </p>
                <p style={{ fontSize: '0.8rem', marginTop: '8px' }}>
                  Use the Sidebar tab to control what appears in navigation.
                </p>
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === 'sidebar' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <SectionCard
              title="Sidebar Visibility"
              description="Choose which sections appear in navigation"
              icon={<LayoutPanelLeft size={22} />}
              iconColor="#f59e0b"
              iconBackground="rgba(245, 158, 11, 0.1)"
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '16px',
                }}
              >
                {SIDEBAR_ITEMS.map((item) => (
                  <ToggleCard
                    key={item.key}
                    label={item.label}
                    description={item.description}
                    icon={item.icon}
                    color={item.color}
                    isActive={settings[item.key] !== false}
                    onToggle={() => updateSettings({ [item.key]: !settings[item.key] })}
                    compact
                  />
                ))}
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === 'system' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <SectionCard
              title="Danger Zone"
              description="Actions that affect all app settings"
              icon={<Shield size={22} />}
              iconColor="#ef4444"
              iconBackground="rgba(239, 68, 68, 0.1)"
            >
              <div
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  background: 'rgba(239, 68, 68, 0.05)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                }}
              >
                <div>
                  <div style={{ color: '#ef4444', fontWeight: '700', marginBottom: '4px' }}>
                    Reset settings
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                    Restore the app configuration to its default state
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resetToDefaults}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Undo size={16} /> Reset
                </button>
              </div>

              <div
                style={{
                  marginTop: '24px',
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(59, 130, 246, 0.05)',
                  border: '1px solid rgba(59, 130, 246, 0.1)',
                  display: 'flex',
                  gap: '12px',
                }}
              >
                <Info size={20} color="#3b82f6" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>
                  Preferences are saved to your profile and applied across your signed-in session.
                </div>
              </div>
            </SectionCard>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  icon,
  iconColor,
  iconBackground,
  children,
  style,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  iconColor: string;
  iconBackground: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div className="premium-card" style={style}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          paddingBottom: '16px',
        }}
      >
        <div
          style={{
            padding: '10px',
            borderRadius: '10px',
            background: iconBackground,
            color: iconColor,
          }}
        >
          {icon}
        </div>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff' }}>{title}</h3>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function AccountSelect({
  label,
  value,
  onChange,
  accounts,
  icon,
}: {
  label: string;
  value: number | undefined;
  onChange: (val: number | undefined) => void;
  accounts: Account[];
  icon: ReactNode;
}) {
  return (
    <div>
      <label
        style={{
          fontSize: '0.8rem',
          fontWeight: '700',
          color: '#94a3b8',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span>{icon}</span> {label}
      </label>
      <div style={{ position: 'relative' }}>
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
          style={{
            width: '100%',
            background: '#000000',
            border: '1px solid #1a1a1a',
            padding: '12px 16px',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '0.9rem',
            appearance: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <option value="">Select manually each time</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name} ({acc.currency === 'INR' ? 'INR ' : 'USD '}
              {acc.balance.toLocaleString()})
            </option>
          ))}
        </select>
        <ChevronRight
          size={16}
          color="#64748b"
          style={{
            position: 'absolute',
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%) rotate(90deg)',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}

function ToggleCard({
  label,
  description,
  isActive,
  onToggle,
  color,
  icon,
  compact = false,
}: {
  label: string;
  description: string;
  isActive: boolean;
  onToggle: () => void;
  color: string;
  icon: ReactNode;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: compact ? '16px' : '20px',
        background: isActive ? `${color}08` : 'rgba(255,255,255,0.02)',
        borderRadius: '16px',
        border: `1px solid ${isActive ? `${color}20` : 'rgba(255,255,255,0.05)'}`,
        cursor: 'pointer',
        transition: 'all 0.2s',
        width: '100%',
        textAlign: 'left',
      }}
      className="toggle-card"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
        <div
          style={{
            fontSize: compact ? '1.2rem' : '1.5rem',
            width: compact ? '32px' : '40px',
            height: compact ? '32px' : '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isActive ? `${color}15` : 'rgba(255,255,255,0.05)',
            borderRadius: '10px',
            color,
          }}
        >
          {icon}
        </div>
        <div>
          <div
            style={{
              fontWeight: '700',
              fontSize: '0.95rem',
              color: isActive ? '#fff' : '#94a3b8',
              marginBottom: '2px',
            }}
          >
            {label}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{description}</div>
        </div>
      </div>

      <div
        role="switch"
        aria-checked={isActive}
        style={{
          width: '44px',
          height: '24px',
          background: isActive ? color : '#1a1a1a',
          borderRadius: '100px',
          position: 'relative',
          transition: 'background 0.3s',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: '18px',
            height: '18px',
            background: '#fff',
            borderRadius: '50%',
            position: 'absolute',
            top: '3px',
            left: isActive ? '23px' : '3px',
            transition: 'left 0.3s',
            boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          }}
        />
      </div>
    </button>
  );
}

const textInputStyle: CSSProperties = {
  background: '#000000',
  border: '2px solid #111111',
  padding: '14px 16px',
  borderRadius: '14px',
  color: '#fff',
  fontSize: '1rem',
  outline: 'none',
  transition: 'border-color 0.2s',
  width: '100%',
};
