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
import { useFinance } from './FinanceContext';

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
  const { settings } = useFinance();
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
          width: 230px;
          min-width: 230px;
          background: var(--sidebar-bg);
          border-right: 2px solid #ffffff;
          display: flex;
          flex-direction: column;
          position: fixed;
          left: ${isOpen ? '0' : '-230px'};
          top: 0;
          bottom: 0;
          height: 100dvh;
          z-index: 100;
          transition: left 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
        }
        aside::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 1px;
          height: 100%;
          background: transparent;
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
      <aside>
        {/* Logo / Brand */}
        <div
          style={{
            padding: '20px 16px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            overflow: 'hidden',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '120px',
              height: '120px',
              background: 'transparent',
              top: '-20px',
              left: '-20px',
              filter: 'none',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              minWidth: '40px',
              height: '40px',
              background: '#ffffff',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000000',
              fontWeight: '950',
              fontSize: '1.2rem',
              boxShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
              flexShrink: 0,
              position: 'relative',
            }}
          >
            <Command size={20} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <span
              style={{
                fontSize: '1.15rem',
                fontWeight: '900',
                color: 'var(--text-primary)',
                letterSpacing: '-0.5px',
                whiteSpace: 'nowrap',
                lineHeight: 1.2,
              }}
            >
              FIN
              <span
                style={{
                  color: '#ffffff',
                }}
              >
                CORE
              </span>
            </span>
            <span
              style={{
                fontSize: '0.6rem',
                color: 'var(--text-tertiary)',
                fontWeight: '600',
                letterSpacing: '0.5px',
              }}
            >
              Financial Dashboard
            </span>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav
          style={{
            flex: 1,
            padding: '8px 10px',
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
              style={{ marginBottom: sectionIdx < navSections.length - 1 ? '4px' : '0' }}
            >
              <div
                style={{
                  padding: '8px 12px 4px',
                  fontSize: '0.6rem',
                  fontWeight: '800',
                  color: '#1a1a1a',
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
                      padding: '10px 14px',
                      margin: '2px 0',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      position: 'relative',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      background: isActive
                        ? 'rgba(255, 255, 255, 0.1)'
                        : isHovered
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'transparent',
                      color: isActive ? '#ffffff' : isHovered ? 'var(--text-primary)' : '#64748b',
                      border: isActive
                        ? '1px solid rgba(255, 255, 255, 0.3)'
                        : isHovered
                          ? '1px solid rgba(255, 255, 255, 0.1)'
                          : '1px solid transparent',
                      boxShadow: 'none',
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={onClose}
                    onMouseEnter={() => setHoveredItem(item.href)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    {isActive && (
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: '20%',
                          bottom: '20%',
                          width: '3px',
                          background: '#ffffff',
                          borderRadius: '0 4px 4px 0',
                          boxShadow: '0 0 10px rgba(255, 255, 255, 0.4)',
                        }}
                      />
                    )}
                    <div
                      style={{
                        color: isActive ? '#ffffff' : 'inherit',
                        transition: 'all 0.3s ease',
                        transform: isActive || isHovered ? 'scale(1.1)' : 'scale(1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                      }}
                    >
                      {item.icon}
                    </div>
                    <span
                      style={{
                        fontWeight: isActive ? '700' : '600',
                        fontSize: '0.9rem',
                        flex: 1,
                        whiteSpace: 'nowrap',
                        letterSpacing: isActive ? '0.01em' : '0',
                      }}
                    >
                      {item.label}
                    </span>
                    {item.badge && (
                      <span
                        style={{
                          padding: '2px 6px',
                          borderRadius: '6px',
                          fontSize: '0.65rem',
                          fontWeight: '800',
                          background: `${item.color}20`,
                          color: item.color,
                          border: `1px solid ${item.color}30`,
                        }}
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

        {/* Bottom Section */}
        <div
          style={{
            padding: '12px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            borderTop: '2px solid #ffffff',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'none',
            }}
          />

          <Link href="/settings" style={{ textDecoration: 'none' }} onClick={onClose}>
            <div
              style={{
                padding: '12px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: hoveredItem === 'settings' ? 'var(--text-primary)' : '#64748b',
                transition: 'all 0.2s',
                cursor: 'pointer',
                background:
                  hoveredItem === 'settings' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                minHeight: '44px',
              }}
              onMouseEnter={() => setHoveredItem('settings')}
              onMouseLeave={() => setHoveredItem(null)}
              onTouchStart={() => setHoveredItem('settings')}
              onTouchEnd={() => setHoveredItem(null)}
            >
              <Settings size={18} />
              <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>Settings</span>
            </div>
          </Link>

          <div
            onClick={async () => {
              const isConfirmed = await customConfirm({
                title: 'Leaving FINCORE?',
                message: 'Are you sure you want to log out of your secure session?',
                type: 'warning',
                confirmLabel: 'Logout',
                cancelLabel: 'Stay',
              });
              if (isConfirmed) {
                signOut();
                onClose?.();
              }
            }}
            style={{
              padding: '12px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: hoveredItem === 'logout' ? '#fca5a5' : '#ef4444',
              transition: 'all 0.2s',
              cursor: 'pointer',
              background: hoveredItem === 'logout' ? 'rgba(239, 68, 68, 0.06)' : 'transparent',
              opacity: 0.8,
              minHeight: '44px',
            }}
            onMouseEnter={() => setHoveredItem('logout')}
            onMouseLeave={() => setHoveredItem(null)}
            onTouchStart={() => setHoveredItem('logout')}
            onTouchEnd={() => setHoveredItem(null)}
          >
            <LogOut size={18} />
            <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>Logout</span>
          </div>
        </div>
      </aside>
    </>
  );
}
