'use client';

import { useState } from 'react';
import { useNotifications } from '../components/NotificationContext';
import { useFinance } from '../components/FinanceContext';
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
} from 'lucide-react';

export default function SettingsPage() {
  const { settings, updateSettings, accounts, loading } = useFinance();
  const { showNotification, confirm: customConfirm } = useNotifications();
  const [activeTab, setActiveTab] = useState<
    'general' | 'modules' | 'sidebar' | 'charges' | 'system'
  >('general');

  const resetToDefaults = async () => {
    const isConfirmed = await customConfirm({
      title: 'Reset Configuration',
      message:
        'Are you sure you want to reset all settings to their default values? This action cannot be undone.',
      type: 'warning',
      confirmLabel: 'Reset',
    });

    if (isConfirmed) {
      const defaults: AppSettings = {
        brokerageType: 'percentage',
        brokerageValue: 0,
        sttRate: 0.1,
        transactionChargeRate: 0.00345,
        sebiChargeRate: 0.0001,
        stampDutyRate: 0.015,
        gstRate: 18,
        dpCharges: 15.93,
        autoCalculateCharges: true,
        stocksVisible: true,
        mutualFundsVisible: true,
        fnoVisible: true,
        ledgerVisible: true,
        incomeVisible: true,
        expensesVisible: true,
        goalsVisible: true,
        familyVisible: true,
      };
      await updateSettings(defaults);
      showNotification('info', 'Settings reset to factory defaults');
    }
  };

  if (loading) return null;

  const tabs = [
    { id: 'general', label: 'General', icon: <Settings size={18} /> },
    { id: 'modules', label: 'Modules', icon: <Eye size={18} /> },
    { id: 'sidebar', label: 'Sidebar', icon: <LayoutPanelLeft size={18} /> },
    { id: 'charges', label: 'Charges', icon: <Info size={18} /> },
    { id: 'system', label: 'System', icon: <Monitor size={18} /> },
  ];

  return (
    <div className="page-container">
      {/* Header */}
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
          <p style={{ color: '#94a3b8', fontSize: 'clamp(0.875rem, 2vw, 1rem)', marginTop: '8px' }}>
            Manage your preferences and application defaults
          </p>
        </div>
      </div>

      {/* Mobile Tab Navigation (Scrollable) */}
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
              onClick={() =>
                setActiveTab(tab.id as 'general' | 'modules' | 'sidebar' | 'charges' | 'system')
              }
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '12px',
                border: 'none',
                background: isActive
                  ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                  : 'rgba(30, 41, 59, 0.5)',
                color: isActive ? '#fff' : '#94a3b8',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                boxShadow: isActive ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none',
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
        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="grid-responsive-1" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="premium-card">
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
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#10b981',
                  }}
                >
                  <Layers size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff' }}>
                    Default Accounts
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    Auto-select accounts for specific actions
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <AccountSelect
                  label="Stock Trading Account"
                  value={settings.defaultStockAccountId}
                  onChange={(val) => updateSettings({ defaultStockAccountId: val })}
                  accounts={accounts}
                  icon="📈"
                />
                <AccountSelect
                  label="Mutual Fund Account"
                  value={settings.defaultMfAccountId}
                  onChange={(val) => updateSettings({ defaultMfAccountId: val })}
                  accounts={accounts}
                  icon="💼"
                />
                <AccountSelect
                  label="Salary Credit Account"
                  value={settings.defaultSalaryAccountId}
                  onChange={(val) => updateSettings({ defaultSalaryAccountId: val })}
                  accounts={accounts}
                  icon="💰"
                />
              </div>
            </div>
          </div>
        )}

        {/* Modules Settings */}
        {activeTab === 'modules' && (
          <div className="grid-responsive-1" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="premium-card">
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
                    background: 'rgba(168, 85, 247, 0.1)',
                    color: '#a855f7',
                  }}
                >
                  <Eye size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff' }}>
                    Active Modules
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    Toggle features based on your needs
                  </p>
                </div>
              </div>

              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                <p style={{ fontSize: '0.95rem', fontWeight: '600' }}>
                  All modules are currently active.
                </p>
                <p style={{ fontSize: '0.8rem', marginTop: '8px' }}>
                  Use the Sidebar tab to toggle navigation visibility.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar Settings */}
        {activeTab === 'sidebar' && (
          <div className="grid-responsive-1" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="premium-card">
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
                    background: 'rgba(245, 158, 11, 0.1)',
                    color: '#f59e0b',
                  }}
                >
                  <LayoutPanelLeft size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff' }}>
                    Sidebar Visibility
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    Customize your navigation menu
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '16px',
                }}
              >
                {[
                  { k: 'stocksVisible', l: 'Stocks', d: 'Equity portfolio', i: '📈', c: '#10b981' },
                  {
                    k: 'mutualFundsVisible',
                    l: 'Mutual Funds',
                    d: 'SIP & Lumpsum',
                    i: '💼',
                    c: '#f59e0b',
                  },
                  { k: 'fnoVisible', l: 'F&O', d: 'Futures & Options', i: '⚡', c: '#a78bfa' },
                  { k: 'ledgerVisible', l: 'Ledger', d: 'All Transactions', i: '📖', c: '#60a5fa' },
                  {
                    k: 'incomeVisible',
                    l: 'Income',
                    d: 'Salary & Earnings',
                    i: '💰',
                    c: '#34d399',
                  },
                  {
                    k: 'expensesVisible',
                    l: 'Expenses',
                    d: 'Spending Tracker',
                    i: '🛍️',
                    c: '#fb923c',
                  },
                  { k: 'goalsVisible', l: 'Goals', d: 'Financial Targets', i: '🎯', c: '#f472b6' },
                  {
                    k: 'familyVisible',
                    l: 'Family',
                    d: 'Transfers & Gifts',
                    i: '👨‍👩‍👧',
                    c: '#c084fc',
                  },
                ].map((item) => (
                  <ToggleItem
                    key={item.k}
                    label={item.l}
                    description={item.d}
                    isActive={settings[item.k as keyof AppSettings] !== false}
                    onToggle={() =>
                      updateSettings({ [item.k]: !settings[item.k as keyof AppSettings] })
                    }
                    color={item.c}
                    icon={item.i}
                    compact
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Charges Settings */}
        {activeTab === 'charges' && (
          <div className="grid-responsive-1" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="premium-card">
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
                    background: 'rgba(59, 130, 246, 0.1)',
                    color: '#3b82f6',
                  }}
                >
                  <Info size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff' }}>
                    Trading Charges
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    Configure brokerage and regulatory charges
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Auto Calculate Toggle */}
                <ToggleItem
                  label="Auto Calculate Charges"
                  description="Automatically compute charges on every trade"
                  isActive={settings.autoCalculateCharges}
                  onToggle={() =>
                    updateSettings({ autoCalculateCharges: !settings.autoCalculateCharges })
                  }
                  color="#3b82f6"
                  icon="⚡"
                />

                {/* Brokerage Type */}
                <div>
                  <label
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      color: '#94a3b8',
                      marginBottom: '8px',
                      display: 'block',
                    }}
                  >
                    💹 Brokerage Type
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(['flat', 'percentage'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => updateSettings({ brokerageType: type })}
                        style={{
                          flex: 1,
                          padding: '12px',
                          borderRadius: '12px',
                          border: `1px solid ${settings.brokerageType === type ? '#3b82f6' : '#334155'}`,
                          background:
                            settings.brokerageType === type ? 'rgba(59, 130, 246, 0.1)' : '#020617',
                          color: settings.brokerageType === type ? '#3b82f6' : '#94a3b8',
                          fontWeight: '700',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          textTransform: 'capitalize',
                        }}
                      >
                        {type === 'flat' ? '₹ Flat' : '% Percentage'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Charge Value Inputs */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                  }}
                >
                  <ChargeInput
                    label="Brokerage"
                    value={settings.brokerageValue}
                    onChange={(v) => updateSettings({ brokerageValue: v })}
                    suffix={settings.brokerageType === 'percentage' ? '%' : '₹'}
                  />
                  <ChargeInput
                    label="STT Rate"
                    value={settings.sttRate}
                    onChange={(v) => updateSettings({ sttRate: v })}
                    suffix="%"
                  />
                  <ChargeInput
                    label="Transaction Charges"
                    value={settings.transactionChargeRate}
                    onChange={(v) => updateSettings({ transactionChargeRate: v })}
                    suffix="%"
                  />
                  <ChargeInput
                    label="SEBI Charges"
                    value={settings.sebiChargeRate}
                    onChange={(v) => updateSettings({ sebiChargeRate: v })}
                    suffix="%"
                  />
                  <ChargeInput
                    label="Stamp Duty"
                    value={settings.stampDutyRate}
                    onChange={(v) => updateSettings({ stampDutyRate: v })}
                    suffix="%"
                  />
                  <ChargeInput
                    label="GST"
                    value={settings.gstRate}
                    onChange={(v) => updateSettings({ gstRate: v })}
                    suffix="%"
                  />
                  <ChargeInput
                    label="DP Charges"
                    value={settings.dpCharges}
                    onChange={(v) => updateSettings({ dpCharges: v })}
                    suffix="₹"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* System Settings */}
        {activeTab === 'system' && (
          <div className="grid-responsive-1" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="premium-card">
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
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                  }}
                >
                  <Shield size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff' }}>
                    Danger Zone
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    Irreversible actions for your account
                  </p>
                </div>
              </div>

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
                    Reset Configuration
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                    Restore all settings to factory defaults
                  </div>
                </div>
                <button
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
                  Preferences are synced to your browser&apos;s local storage. Cloud sync is
                  automatically enabled when you sign in.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Sub-components for cleaner code
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
  icon: string;
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
            background: '#020617',
            border: '1px solid #334155',
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
              {acc.name} ({acc.currency === 'INR' ? '₹' : '$'}
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

function ToggleItem({
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
  icon: string;
  compact?: boolean;
}) {
  return (
    <div
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
          background: isActive ? color : '#334155',
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
    </div>
  );
}

function ChargeInput({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix: string;
}) {
  return (
    <div>
      <label
        style={{
          fontSize: '0.75rem',
          fontWeight: '700',
          color: '#94a3b8',
          marginBottom: '6px',
          display: 'block',
        }}
      >
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          step="0.001"
          style={{
            width: '100%',
            background: '#020617',
            border: '1px solid #334155',
            padding: '10px 14px',
            paddingRight: '40px',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '0.9rem',
            outline: 'none',
            transition: 'all 0.2s',
          }}
        />
        <span
          style={{
            position: 'absolute',
            right: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '0.75rem',
            fontWeight: '700',
            color: '#475569',
            pointerEvents: 'none',
          }}
        >
          {suffix}
        </span>
      </div>
    </div>
  );
}
