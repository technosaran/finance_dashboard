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
          width: 230px;
          min-width: 230px;
          background: rgba(4, 4, 14, 0.82);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow:
            4px 0 32px rgba(0, 0, 0, 0.55),
            inset -1px 0 0 rgba(255, 255, 255, 0.06);
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
            to bottom,
            rgba(255, 255, 255, 0.1),
            rgba(255, 255, 255, 0.04),
            transparent
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
      <aside id="sidebar-navigation">
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
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: '950',
              fontSize: '1.2rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              flexShrink: 0,
              position: 'relative',
              backdropFilter: 'blur(12px)',
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
                  color: '#475569',
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
                      padding: isActive ? '18px' : '10px 14px',
                      marginTop: isActive ? '12px' : '2px',
                      marginBottom: '2px',
                      borderRadius: isActive ? '18px' : '12px',
                      textDecoration: 'none',
                      position: 'relative',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.35) 0%, rgba(67, 56, 202, 0.3) 100%)'
                        : isHovered
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'transparent',
                      backdropFilter: isActive ? 'blur(16px) saturate(150%)' : 'none',
                      WebkitBackdropFilter: isActive ? 'blur(16px) saturate(150%)' : 'none',
                      color: isActive ? '#ffffff' : isHovered ? 'var(--text-primary)' : '#64748b',
                      border: isActive
                        ? '1px solid rgba(99, 102, 241, 0.4)'
                        : isHovered
                          ? '1px solid rgba(255, 255, 255, 0.1)'
                          : '1px solid transparent',
                      boxShadow: isActive
                        ? '0 4px 20px rgba(99, 102, 241, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0,0,0,0.2)'
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
                          left: 0,
                          top: '20%',
                          bottom: '20%',
                          width: '3px',
                          background: '#6366f1',
                          borderRadius: '0 4px 4px 0',
                          boxShadow: '0 0 10px rgba(99, 102, 241, 0.4)',
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
            marginTop: 'auto',
            padding: '16px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.02))',
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
              padding: '12px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: hoveredItem === 'logout' ? '#fca5a5' : '#ef4444',
              transition: 'all 0.2s',
              cursor: 'pointer',
              border: 'none',
              background: hoveredItem === 'logout' ? 'rgba(239, 68, 68, 0.06)' : 'transparent',
              opacity: 0.8,
              minHeight: '44px',
              width: '100%',
              textAlign: 'left' as const,
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
