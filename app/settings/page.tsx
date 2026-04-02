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
    <div className="page-container" style={{ paddingTop: '20px' }}>
      <header className="page-header section-fade-in" style={{ animationDelay: '0s' }}>
        <div>
          <h1 className="page-title font-outfit text-gradient tracking-tighter">Settings</h1>
          <p className="page-subtitle">Configure your workspace preferences and defaults</p>
        </div>
      </header>

      <div className="settings-container">
        {/* Navigation Sidebar */}
        <nav className="settings-nav section-fade-in" style={{ animationDelay: '0.1s' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`settings-nav-item ${activeTab === tab.id ? 'settings-nav-item--active' : ''}`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
            </button>
          ))}
        </nav>

        {/* Content Area */}
        <section className="settings-content section-fade-in" style={{ animationDelay: '0.2s' }}>
          {activeTab === 'general' && (
            <div className="settings-group">
              <h2 className="settings-section-title">General Preferences</h2>

              <SectionCard
                title="Your Profile"
                description="Customize how you are identified within FINCORE"
                icon={<Users size={20} />}
                iconColor="#1ea672"
                iconBackground="rgba(30, 166, 114, 0.1)"
              >
                <div className="settings-item">
                  <label className="settings-label">Display Name</label>
                  <input
                    type="text"
                    value={settings.displayName || ''}
                    onChange={(e) => updateSettings({ displayName: e.target.value })}
                    placeholder="Enter your name"
                    className="login-input"
                  />
                  <p className="settings-description">
                    This name will be visible on your main dashboard.
                  </p>
                </div>
              </SectionCard>

              <SectionCard
                title="Default Accounts"
                description="Set default accounts to speed up transaction entry"
                icon={<Layers size={20} />}
                iconColor="#34d399"
                iconBackground="rgba(52, 211, 153, 0.1)"
              >
                <div style={{ display: 'grid', gap: '24px' }}>
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
                    label="Income Credit Account"
                    value={settings.defaultSalaryAccountId}
                    onChange={(val) => updateSettings({ defaultSalaryAccountId: val })}
                    accounts={accounts}
                    icon={<Banknote size={16} />}
                  />
                </div>
              </SectionCard>

              <SectionCard
                title="Advanced Charges"
                description="Brokerage and regulatory charges information"
                icon={<Info size={20} />}
                iconColor="#1ea672"
                iconBackground="rgba(30, 166, 114, 0.1)"
              >
                <div
                  className="glass-panel"
                  style={{
                    padding: '20px',
                    fontSize: '0.9rem',
                    color: '#94a3b8',
                    lineHeight: '1.6',
                  }}
                >
                  Regulatory fees (STT, SEBI, GST) and exchange charges are automatically calculated
                  based on the latest Indian market standards. You can review precise breakdowns
                  when entering any transaction.
                </div>
              </SectionCard>
            </div>
          )}

          {activeTab === 'modules' && (
            <div className="settings-group">
              <h2 className="settings-section-title">Core Modules</h2>
              <SectionCard
                title="Module Configuration"
                description="Enable or disable entire platform capabilities"
                icon={<Eye size={20} />}
                iconColor="#a855f7"
                iconBackground="rgba(168, 85, 247, 0.1)"
              >
                <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '20px',
                      background: 'rgba(255,255,255,0.03)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 24px',
                      color: '#52525b',
                    }}
                  >
                    <Layers size={32} />
                  </div>
                  <p style={{ fontWeight: '600', color: '#fff', marginBottom: '8px' }}>
                    Global Modules Enabled
                  </p>
                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: '#71717a',
                      maxWidth: '320px',
                      margin: '0 auto',
                    }}
                  >
                    All core modules are currently active. Use the <strong>Sidebar</strong> tab to
                    manage their visibility in the navigation.
                  </p>
                </div>
              </SectionCard>
            </div>
          )}

          {activeTab === 'sidebar' && (
            <div className="settings-group">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  marginBottom: '8px',
                }}
              >
                <h2 className="settings-section-title" style={{ marginBottom: 0 }}>
                  Sidebar Visibility
                </h2>
                <div className="settings-badge">Visibility Management</div>
              </div>

              <SectionCard
                title="Navigation Items"
                description="Control which sections appear in your main sidebar"
                icon={<LayoutPanelLeft size={20} />}
                iconColor="#f59e0b"
                iconBackground="rgba(245, 158, 11, 0.1)"
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
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
                    />
                  ))}
                </div>
              </SectionCard>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="settings-group">
              <h2 className="settings-section-title">System & Security</h2>
              <SectionCard
                title="Data Integrity"
                description="Manage your application state and configuration"
                icon={<Shield size={20} />}
                iconColor="#ef4444"
                iconBackground="rgba(239, 68, 68, 0.1)"
              >
                <div
                  style={{
                    borderRadius: '16px',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    background: 'rgba(239, 68, 68, 0.03)',
                    padding: '24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '24px',
                  }}
                >
                  <div>
                    <h4 style={{ color: '#ef4444', fontWeight: '700', margin: 0 }}>
                      Reset to Defaults
                    </h4>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '6px 0 0' }}>
                      Revert all workspace preferences to factory settings. This action is
                      permanent.
                    </p>
                  </div>
                  <button
                    onClick={resetToDefaults}
                    className="btn-primary"
                    style={{
                      marginTop: 0,
                      padding: '10px 20px',
                      fontSize: '0.9rem',
                      background: '#ef4444',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Undo size={16} /> Reset Now
                  </button>
                </div>
              </SectionCard>

              <div
                style={{
                  marginTop: '12px',
                  padding: '16px 20px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '16px',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                }}
              >
                <Shield size={18} color="#71717a" style={{ marginTop: '2px' }} />
                <div style={{ fontSize: '0.8125rem', color: '#52525b', lineHeight: 1.5 }}>
                  Your configuration is securely encrypted and stored in your private vault. These
                  settings are synchronized across all your registered devices in real-time.
                </div>
              </div>
            </div>
          )}
        </section>
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
}: {
  title: string;
  description: string;
  icon: ReactNode;
  iconColor: string;
  iconBackground: string;
  children: ReactNode;
}) {
  return (
    <div className="settings-card">
      <header style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: iconBackground,
            color: iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </div>
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#fff', margin: 0 }}>
            {title}
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#71717a', margin: '4px 0 0' }}>{description}</p>
        </div>
      </header>
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
    <div className="settings-item">
      <label
        className="settings-label"
        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        {icon} {label}
      </label>
      <div style={{ position: 'relative' }}>
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
          className="login-input"
          style={{ appearance: 'none', cursor: 'pointer', paddingRight: '44px' }}
        >
          <option value="">Select account...</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name} ({acc.currency === 'INR' ? '₹' : '$'}
              {acc.balance.toLocaleString()})
            </option>
          ))}
        </select>
        <ChevronRight
          size={16}
          color="#52525b"
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
}: {
  label: string;
  description: string;
  isActive: boolean;
  onToggle: () => void;
  color: string;
  icon: ReactNode;
}) {
  return (
    <button
      onClick={onToggle}
      className={`settings-toggle-row ${isActive ? 'settings-toggle-row--active' : ''}`}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: isActive ? `${color}20` : 'rgba(255,255,255,0.03)',
            color: isActive ? color : '#52525b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
        >
          {icon}
        </div>
        <div style={{ textAlign: 'left' }}>
          <div
            style={{
              fontWeight: '700',
              fontSize: '0.9375rem',
              color: isActive ? '#fff' : '#71717a',
            }}
          >
            {label}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#52525b' }}>{description}</div>
        </div>
      </div>

      <div
        style={{
          width: '40px',
          height: '20px',
          borderRadius: '20px',
          background: isActive ? color : '#1c1c1c',
          position: 'relative',
          transition: 'background 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div
          style={{
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: '#fff',
            position: 'absolute',
            top: '3px',
            left: isActive ? '23px' : '3px',
            transition: 'left 0.3s cubic-bezier(0.19, 1, 0.22, 1)',
          }}
        />
      </div>
    </button>
  );
}
