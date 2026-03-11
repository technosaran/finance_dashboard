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

/** Extract user initials for avatar display */
function getUserInitials(
  user: { email?: string; user_metadata?: Record<string, string | undefined> } | null | undefined
): string {
  if (!user) return '?';
  if (user.user_metadata?.full_name) {
    const parts = user.user_metadata.full_name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  if (user.user_metadata?.name) {
    const parts = user.user_metadata.name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  if (user.email) {
    return user.email.slice(0, 2).toUpperCase();
  }
  return '?';
}

/** Extract display name from user */
function getUserDisplayName(
  user: { email?: string; user_metadata?: Record<string, string | undefined> } | null | undefined
): string {
  if (!user) return 'User';
  if (user.user_metadata?.full_name) return user.user_metadata.full_name.split(' ')[0];
  if (user.user_metadata?.name) return user.user_metadata.name.split(' ')[0];
  if (!user.email) return 'User';
  const localPart = user.email.split('@')[0];
  const name = localPart.split(/[._-]/)[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { signOut, user } = useAuth();
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
          background: linear-gradient(180deg, #020617 0%, #0a0f1e 50%, #020617 100%);
          border-right: 1px solid rgba(99, 102, 241, 0.08);
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
          background: linear-gradient(
            180deg,
            transparent 0%,
            rgba(99, 102, 241, 0.2) 50%,
            transparent 100%
          );
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
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
              top: '-20px',
              left: '-20px',
              filter: 'blur(20px)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              minWidth: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '900',
              fontSize: '1.2rem',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
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
                color: '#fff',
                letterSpacing: '-0.5px',
                whiteSpace: 'nowrap',
                lineHeight: 1.2,
              }}
            >
              FIN
              <span
                style={{
                  background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                CORE
              </span>
            </span>
            <span
              style={{
                fontSize: '0.6rem',
                color: '#475569',
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
                  color: '#334155',
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
                        ? `linear-gradient(135deg, ${item.color}20, ${item.color}05)`
                        : isHovered
                          ? 'rgba(255,255,255,0.04)'
                          : 'transparent',
                      color: isActive ? '#fff' : isHovered ? '#f8fafc' : '#64748b',
                      border: isActive
                        ? `1px solid ${item.color}30`
                        : isHovered
                          ? '1px solid rgba(255,255,255,0.05)'
                          : '1px solid transparent',
                      boxShadow: isActive ? `0 4px 12px ${item.color}10` : 'none',
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
                          background: item.color,
                          borderRadius: '0 4px 4px 0',
                          boxShadow: `0 0 10px ${item.color}`,
                        }}
                      />
                    )}
                    <div
                      style={{
                        color: isActive ? item.color : 'inherit',
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
            borderTop: '1px solid rgba(255,255,255,0.04)',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '10%',
              right: '10%',
              height: '1px',
              background:
                'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.15), transparent)',
            }}
          />

          {/* User profile row */}
          {user && (
            <div
              style={{
                padding: '10px 12px',
                marginBottom: '4px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(99, 102, 241, 0.05)',
                border: '1px solid rgba(99, 102, 241, 0.1)',
              }}
            >
              <div className="user-avatar">{getUserInitials(user)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    color: '#e2e8f0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {getUserDisplayName(user)}
                </div>
                <div
                  style={{
                    fontSize: '0.62rem',
                    color: '#475569',
                    fontWeight: '500',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user.email}
                </div>
              </div>
            </div>
          )}

          {/* Command Palette shortcut hint */}
          <div
            style={{
              padding: '8px 12px',
              marginBottom: '4px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(99, 102, 241, 0.05)',
              border: '1px solid rgba(99, 102, 241, 0.1)',
            }}
          >
            <span style={{ fontSize: '0.7rem', fontWeight: '600', color: '#475569' }}>
              Quick search
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <kbd
                style={{
                  padding: '2px 5px',
                  borderRadius: '4px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontSize: '0.6rem',
                  fontWeight: '700',
                  color: '#64748b',
                  fontFamily: 'monospace',
                }}
              >
                ⌘
              </kbd>
              <kbd
                style={{
                  padding: '2px 5px',
                  borderRadius: '4px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontSize: '0.6rem',
                  fontWeight: '700',
                  color: '#64748b',
                  fontFamily: 'monospace',
                }}
              >
                K
              </kbd>
            </div>
          </div>

          <Link href="/settings" style={{ textDecoration: 'none' }} onClick={onClose}>
            <div
              style={{
                padding: '12px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: hoveredItem === 'settings' ? '#cbd5e1' : '#475569',
                transition: 'all 0.2s',
                cursor: 'pointer',
                background: hoveredItem === 'settings' ? 'rgba(255,255,255,0.03)' : 'transparent',
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
