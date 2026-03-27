'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  Activity,
  Book,
  Banknote,
  Users,
  Target,
  Zap,
  Settings,
  LogOut,
  Command,
  ShoppingBag,
} from 'lucide-react';

import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { useSettings } from './FinanceContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  enabled?: boolean;
  badge?: string;
  color?: string;
  settingsKey?: string;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const { confirm: customConfirm } = useNotifications();
  const { settings } = useSettings();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const isVisible = (key?: string) => {
    if (!key) return true;
    const value = settings[key as keyof typeof settings];
    return value !== false;
  };

  const navSections: NavSection[] = [
    {
      title: 'OVERVIEW',
      items: [
        { label: 'Dashboard', href: '/', icon: <LayoutDashboard size={18} />, color: '#818cf8' },
        { label: 'Accounts', href: '/accounts', icon: <Wallet size={18} />, color: '#34d399' },
      ],
    },
    {
      title: 'INVESTMENTS',
      items: [
        {
          label: 'Stocks',
          href: '/stocks',
          icon: <TrendingUp size={18} />,
          color: '#10b981',
          settingsKey: 'stocksVisible',
        },
        {
          label: 'Mutual Funds',
          href: '/mutual-funds',
          icon: <Activity size={18} />,
          color: '#f59e0b',
          settingsKey: 'mutualFundsVisible',
        },
        {
          label: 'FnO',
          href: '/fno',
          icon: <Zap size={18} />,
          color: '#a78bfa',
          settingsKey: 'fnoVisible',
        },
        {
          label: 'Bonds',
          href: '/bonds',
          icon: <TrendingUp size={18} />,
          color: '#2dd4bf',
          settingsKey: 'bondsVisible',
        },
        {
          label: 'Forex',
          href: '/forex',
          icon: <Activity size={18} />,
          color: '#f43f5e',
          settingsKey: 'forexVisible',
        },
      ].filter((item) => isVisible(item.settingsKey)),
    },
    {
      title: 'TRACKING',
      items: [
        {
          label: 'Ledger',
          href: '/ledger',
          icon: <Book size={18} />,
          color: '#60a5fa',
          settingsKey: 'ledgerVisible',
        },
        {
          label: 'Income',
          href: '/salary',
          icon: <Banknote size={18} />,
          color: '#34d399',
          settingsKey: 'incomeVisible',
        },
        {
          label: 'Expenses',
          href: '/expenses',
          icon: <ShoppingBag size={18} />,
          color: '#fb923c',
          settingsKey: 'expensesVisible',
        },
      ].filter((item) => isVisible(item.settingsKey)),
    },
    {
      title: 'PLANNING',
      items: [
        {
          label: 'Goals',
          href: '/goals',
          icon: <Target size={18} />,
          color: '#f472b6',
          settingsKey: 'goalsVisible',
        },
        {
          label: 'Family',
          href: '/family',
          icon: <Users size={18} />,
          color: '#c084fc',
          settingsKey: 'familyVisible',
        },
      ].filter((item) => isVisible(item.settingsKey)),
    },
  ].filter((section) => section.items.length > 0);

  return (
    <>
      <style jsx>{`
        aside {
          width: var(--sidebar-width);
          min-width: var(--sidebar-width);
          background: #000000;
          border-right: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          flex-direction: column;
          position: fixed;
          left: ${isOpen ? '0' : `calc(-1 * var(--sidebar-width))`};
          top: 0;
          bottom: 0;
          height: 100dvh;
          z-index: 100;
          transition: left 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
        }
        @media (min-width: 768px) {
          aside {
            position: sticky;
            top: 0;
            left: 0 !important;
            height: 100vh;
            flex-shrink: 0;
            align-self: stretch;
          }
        }
      `}</style>
      <aside id="sidebar-navigation">
        {/* Logo / Brand */}
        <div
          style={{
            padding: '24px 20px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            overflow: 'hidden',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          <div
            className="icon-badge"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
            }}
          >
            <Command size={22} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <span
              style={{
                fontSize: '1.25rem',
                fontWeight: '950',
                color: '#ffffff',
                letterSpacing: '-1px',
                whiteSpace: 'nowrap',
                lineHeight: 1,
              }}
            >
              FINCORE
            </span>
            <span
              style={{
                fontSize: '0.65rem',
                color: 'var(--text-tertiary)',
                fontWeight: '800',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                marginTop: '4px',
              }}
            >
              Intelligence
            </span>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav
          style={{
            flex: 1,
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
          role="navigation"
          aria-label="Main navigation"
        >
          {navSections.map((section, sectionIdx) => (
            <div
              key={section.title}
              style={{ marginBottom: sectionIdx < navSections.length - 1 ? '16px' : '0' }}
            >
              <div
                style={{
                  padding: '8px 12px 6px',
                  fontSize: '0.65rem',
                  fontWeight: '800',
                  color: 'var(--text-tertiary)',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase' as const,
                  userSelect: 'none' as const,
                }}
              >
                {section.title}
              </div>
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const isHovered = hoveredItem === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      margin: '2px 0',
                      borderRadius: '10px',
                      textDecoration: 'none',
                      position: 'relative',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      background: isActive
                        ? 'rgba(255, 255, 255, 0.08)'
                        : isHovered
                          ? 'rgba(255, 255, 255, 0.04)'
                          : 'transparent',
                      color:
                        isActive || isHovered ? 'var(--text-primary)' : 'var(--text-secondary)',
                      border: isActive
                        ? '1px solid rgba(255, 255, 255, 0.1)'
                        : '1px solid transparent',
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={onClose}
                    onMouseEnter={() => setHoveredItem(item.href)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <div
                      style={{
                        color: isActive ? 'var(--accent)' : 'inherit',
                        transition: 'transform 0.2s ease',
                        transform: isActive || isHovered ? 'scale(1.1)' : 'scale(1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '20px',
                      }}
                    >
                      {item.icon}
                    </div>
                    <span
                      style={{
                        fontWeight: isActive ? '700' : '500',
                        fontSize: '0.9rem',
                        flex: 1,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.label}
                    </span>
                    {item.badge && (
                      <span
                        className="pill-badge pill-badge--accent"
                        style={{ fontSize: '0.6rem' }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User / Settings / Logout */}
        <div
          style={{
            marginTop: 'auto',
            padding: '16px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          {user && (
            <div
              style={{
                padding: '12px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'rgba(255, 255, 255, 0.02)',
                marginBottom: '8px',
              }}
            >
              <div
                className="user-avatar"
                style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}
              >
                {user.email?.[0].toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-tertiary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user.email}
                </span>
              </div>
            </div>
          )}

          <Link href="/settings" style={{ textDecoration: 'none' }} onClick={onClose}>
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: hoveredItem === 'settings' ? 'var(--text-primary)' : 'var(--text-secondary)',
                transition: 'all 0.2s',
                cursor: 'pointer',
                background:
                  hoveredItem === 'settings' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
              }}
              onMouseEnter={() => setHoveredItem('settings')}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <Settings size={18} />
              <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>Settings</span>
            </div>
          </Link>

          <button
            type="button"
            onClick={async () => {
              const isConfirmed = await customConfirm({
                title: 'Leaving FINCORE?',
                message: 'Are you sure you want to log out?',
                type: 'warning',
                confirmLabel: 'Logout',
                cancelLabel: 'Stay',
              });
              if (isConfirmed) signOut();
            }}
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#ef4444',
              transition: 'all 0.2s',
              cursor: 'pointer',
              border: 'none',
              width: '100%',
              background: hoveredItem === 'logout' ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
              textAlign: 'left',
            }}
            onMouseEnter={() => setHoveredItem('logout')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <LogOut size={18} />
            <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
