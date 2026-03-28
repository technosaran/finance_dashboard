'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Activity,
  Banknote,
  Book,
  Command,
  LayoutDashboard,
  LogOut,
  Settings,
  ShoppingBag,
  Target,
  TrendingUp,
  Users,
  Wallet,
  Zap,
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
      title: 'Overview',
      items: [
        { label: 'Dashboard', href: '/', icon: <LayoutDashboard size={18} />, color: '#7ed7ff' },
        { label: 'Accounts', href: '/accounts', icon: <Wallet size={18} />, color: '#67e8b6' },
      ],
    },
    {
      title: 'Investments',
      items: [
        {
          label: 'Stocks',
          href: '/stocks',
          icon: <TrendingUp size={18} />,
          color: '#7dd3fc',
          settingsKey: 'stocksVisible',
        },
        {
          label: 'Mutual Funds',
          href: '/mutual-funds',
          icon: <Activity size={18} />,
          color: '#fbbf24',
          settingsKey: 'mutualFundsVisible',
        },
        {
          label: 'FnO',
          href: '/fno',
          icon: <Zap size={18} />,
          color: '#c4b5fd',
          settingsKey: 'fnoVisible',
        },
        {
          label: 'Bonds',
          href: '/bonds',
          icon: <TrendingUp size={18} />,
          color: '#5eead4',
          settingsKey: 'bondsVisible',
        },
        {
          label: 'Forex',
          href: '/forex',
          icon: <Activity size={18} />,
          color: '#fb7185',
          settingsKey: 'forexVisible',
        },
      ].filter((item) => isVisible(item.settingsKey)),
    },
    {
      title: 'Tracking',
      items: [
        {
          label: 'Ledger',
          href: '/ledger',
          icon: <Book size={18} />,
          color: '#93c5fd',
          settingsKey: 'ledgerVisible',
        },
        {
          label: 'Income',
          href: '/salary',
          icon: <Banknote size={18} />,
          color: '#67e8b6',
          settingsKey: 'incomeVisible',
        },
        {
          label: 'Expenses',
          href: '/expenses',
          icon: <ShoppingBag size={18} />,
          color: '#fdba74',
          settingsKey: 'expensesVisible',
        },
      ].filter((item) => isVisible(item.settingsKey)),
    },
    {
      title: 'Planning',
      items: [
        {
          label: 'Goals',
          href: '/goals',
          icon: <Target size={18} />,
          color: '#f9a8d4',
          settingsKey: 'goalsVisible',
        },
        {
          label: 'Family',
          href: '/family',
          icon: <Users size={18} />,
          color: '#d8b4fe',
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
          background: rgba(15, 27, 47, 0.5);
          backdrop-filter: blur(36px) saturate(180%);
          -webkit-backdrop-filter: blur(36px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 30px;
          box-shadow:
            0 26px 60px rgba(3, 10, 25, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.28),
            inset 0 -1px 0 rgba(255, 255, 255, 0.04);
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 14px;
          top: 14px;
          bottom: 14px;
          height: calc(100dvh - 28px);
          z-index: 100;
          transform: ${isOpen ? 'translateX(0)' : 'translateX(calc(-100% - 28px))'};
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
        }

        aside::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at top left, rgba(122, 213, 255, 0.12), transparent 30%),
            radial-gradient(circle at 86% 12%, rgba(188, 153, 255, 0.12), transparent 24%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 30%);
          pointer-events: none;
          z-index: 0;
        }

        aside::after {
          content: '';
          position: absolute;
          top: 0;
          left: 12%;
          right: 12%;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.7),
            rgba(210, 232, 255, 0.5),
            transparent
          );
          pointer-events: none;
        }

        @media (min-width: 768px) {
          aside {
            position: sticky;
            top: 20px;
            left: 20px;
            transform: none !important;
            margin: 20px 0 20px 20px;
            height: calc(100vh - 40px);
            flex-shrink: 0;
            align-self: stretch;
          }
        }
      `}</style>

      <aside id="sidebar-navigation" className="liquid-glass-sidebar">
        <div
          style={{
            padding: '24px 20px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            overflow: 'hidden',
            flexShrink: 0,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              minWidth: '46px',
              height: '46px',
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0.08)), linear-gradient(135deg, rgba(116, 210, 255, 0.95), rgba(128, 135, 255, 0.92))',
              border: '1px solid rgba(255, 255, 255, 0.24)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow:
                '0 16px 26px rgba(44, 128, 219, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.42)',
              flexShrink: 0,
            }}
          >
            <Command size={18} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span
              style={{
                fontSize: '1.2rem',
                fontWeight: '900',
                color: 'var(--text-primary)',
                letterSpacing: '-0.04em',
                lineHeight: 1.1,
              }}
            >
              FINCORE
            </span>
            <span
              style={{
                fontSize: '0.68rem',
                color: 'var(--text-secondary)',
                fontWeight: '700',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Wealth cockpit
            </span>
          </div>
        </div>

        <div
          style={{
            margin: '0 16px 10px',
            padding: '14px',
            borderRadius: '22px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.18)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              color: 'var(--text-tertiary)',
              fontSize: '0.68rem',
              fontWeight: '700',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            Surface mode
          </div>
          <div style={{ color: '#ffffff', fontSize: '0.92rem', fontWeight: '800' }}>
            Liquid glass dashboard
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '4px' }}>
            Fast access to every portfolio area.
          </div>
        </div>

        <nav
          style={{
            flex: 1,
            padding: '8px 12px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            overflowY: 'auto',
            overflowX: 'hidden',
            position: 'relative',
            zIndex: 1,
          }}
          role="navigation"
          aria-label="Main navigation"
        >
          {navSections.map((section, sectionIdx) => (
            <div
              key={section.title}
              style={{ marginBottom: sectionIdx < navSections.length - 1 ? '6px' : '0' }}
            >
              <div
                style={{
                  padding: '8px 12px 6px',
                  fontSize: '0.64rem',
                  fontWeight: '800',
                  color: 'var(--text-tertiary)',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  userSelect: 'none',
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
                      padding: isActive ? '14px 16px' : '12px 14px',
                      marginTop: '2px',
                      marginBottom: '2px',
                      borderRadius: isActive ? '20px' : '18px',
                      textDecoration: 'none',
                      position: 'relative',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      background: isActive
                        ? `linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.08)), ${item.color}22`
                        : isHovered
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(255, 255, 255, 0.02)',
                      backdropFilter: 'blur(18px) saturate(160%)',
                      WebkitBackdropFilter: 'blur(18px) saturate(160%)',
                      color: isActive
                        ? '#ffffff'
                        : isHovered
                          ? 'var(--text-primary)'
                          : 'var(--text-secondary)',
                      border: isActive
                        ? '1px solid rgba(255, 255, 255, 0.22)'
                        : isHovered
                          ? '1px solid rgba(255, 255, 255, 0.12)'
                          : '1px solid rgba(255, 255, 255, 0.05)',
                      boxShadow: isActive
                        ? `0 14px 26px ${item.color}22, inset 0 1px 0 rgba(255, 255, 255, 0.26)`
                        : 'none',
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
                          right: '14px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '8px',
                          height: '8px',
                          background: item.color,
                          borderRadius: '999px',
                          boxShadow: `0 0 14px ${item.color}`,
                        }}
                      />
                    )}

                    <div
                      style={{
                        color: isActive ? '#ffffff' : item.color,
                        transition: 'all 0.3s ease',
                        transform: isActive || isHovered ? 'scale(1.05)' : 'scale(1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '34px',
                        height: '34px',
                        borderRadius: '12px',
                        background:
                          isActive || isHovered
                            ? 'rgba(255, 255, 255, 0.12)'
                            : 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow:
                          isActive || isHovered ? 'inset 0 1px 0 rgba(255, 255, 255, 0.2)' : 'none',
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
                          padding: '2px 8px',
                          borderRadius: '999px',
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

        <div
          style={{
            marginTop: 'auto',
            padding: '16px 14px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.03))',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Link href="/settings" style={{ textDecoration: 'none' }} onClick={onClose}>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: hoveredItem === 'settings' ? 'var(--text-primary)' : 'var(--text-secondary)',
                transition: 'all 0.2s',
                cursor: 'pointer',
                background:
                  hoveredItem === 'settings'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                minHeight: '46px',
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

          <button
            type="button"
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
              padding: '12px 14px',
              borderRadius: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: hoveredItem === 'logout' ? '#fca5a5' : '#ef4444',
              transition: 'all 0.2s',
              cursor: 'pointer',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background:
                hoveredItem === 'logout' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.04)',
              opacity: 0.86,
              minHeight: '46px',
              width: '100%',
              textAlign: 'left',
            }}
            onMouseEnter={() => setHoveredItem('logout')}
            onMouseLeave={() => setHoveredItem(null)}
            onTouchStart={() => setHoveredItem('logout')}
            onTouchEnd={() => setHoveredItem(null)}
          >
            <LogOut size={18} />
            <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
