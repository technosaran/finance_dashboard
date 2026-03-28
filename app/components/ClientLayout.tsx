'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import Sidebar from './Sidebar';
import { AuthProvider, useAuth } from './AuthContext';
import { FinanceProvider, useLedger } from './FinanceContext';
import { NotificationProvider } from './NotificationContext';
import { ErrorBoundary } from './error-boundaries/ErrorBoundary';

const AddTransactionModal = dynamic(() => import('./AddTransactionModal'), {
  ssr: false,
});

import {
  Menu,
  X,
  Plus,
  LayoutDashboard,
  TrendingUp,
  Activity,
  History,
  User,
  Landmark,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login';

  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <AuthConsumer isAuthPage={isAuthPage}>{children}</AuthConsumer>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

function AuthConsumer({
  children,
  isAuthPage,
}: {
  children: React.ReactNode;
  isAuthPage: boolean;
}) {
  const { loading: authLoading, user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if ((authLoading || !user) && !isAuthPage) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background:
            'radial-gradient(circle at top left, rgba(132, 216, 255, 0.12), transparent 32%), linear-gradient(180deg, #0b1629 0%, #071120 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
        }}
      >
        <div
          className="premium-card"
          style={{
            textAlign: 'center',
            minWidth: 'min(90vw, 320px)',
            padding: '28px',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              border: '3px solid rgba(255, 255, 255, 0.12)',
              borderTopColor: '#84d8ff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#ffffff' }}>
            Initializing Secure Session...
          </div>
          <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Preparing your dashboard surfaces and account data.
          </div>
        </div>
        <style jsx>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <FinanceProvider>
      <TransactionModalWrapper />
      {/* Global ambient background for liquid glass depth */}
      <div className="bg-mesh" aria-hidden="true" />
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        style={{
          position: 'absolute',
          left: '-9999px',
          zIndex: 999,
          padding: '12px 24px',
          background: '#6366f1',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: '8px',
          fontWeight: '700',
          fontSize: '0.9rem',
        }}
        onFocus={(e) => {
          e.currentTarget.style.left = '20px';
          e.currentTarget.style.top = '20px';
        }}
        onBlur={(e) => {
          e.currentTarget.style.left = '-9999px';
        }}
      >
        Skip to main content
      </a>
      <div
        className="app-shell"
        style={{ display: 'flex', height: '100dvh', flexDirection: 'column', overflow: 'hidden' }}
      >
        {!isAuthPage && (
          <header className="mobile-header liquid-glass-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="liquid-glass-btn"
                style={{
                  color: '#fff',
                  cursor: 'pointer',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '44px',
                  minHeight: '44px',
                }}
                aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                aria-expanded={isSidebarOpen}
                aria-controls="sidebar-navigation"
              >
                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    background:
                      'linear-gradient(180deg, rgba(255,255,255,0.36), rgba(255,255,255,0.08)), linear-gradient(135deg, rgba(123, 213, 255, 0.95), rgba(128, 132, 255, 0.92))',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow:
                      '0 10px 22px rgba(60, 144, 219, 0.28), inset 0 1px 0 rgba(255,255,255,0.38)',
                  }}
                  aria-hidden="true"
                >
                  <Landmark size={18} />
                </div>
                <span
                  style={{
                    fontWeight: '900',
                    color: '#fff',
                    fontSize: '1.2rem',
                    letterSpacing: '-0.5px',
                  }}
                >
                  FINCORE
                </span>
              </div>
            </div>
          </header>
        )}

        <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
          {!isAuthPage && (
            <>
              <div
                className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
                role="presentation"
                aria-hidden={!isSidebarOpen}
                style={{
                  position: 'fixed',
                  inset: 0,
                  background:
                    'radial-gradient(circle at top, rgba(132, 216, 255, 0.1), transparent 28%), rgba(4, 10, 18, 0.58)',
                  backdropFilter: 'blur(12px)',
                  zIndex: 99,
                  opacity: isSidebarOpen ? 1 : 0,
                  pointerEvents: isSidebarOpen ? 'auto' : 'none',
                  transition: 'opacity 0.3s ease',
                }}
              />
              <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            </>
          )}
          <main
            id="main-content"
            className="main-content"
            style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}
            role="main"
            aria-label="Main content"
          >
            {children}
          </main>
        </div>
        {!isAuthPage && <MobileNavigation />}
      </div>
    </FinanceProvider>
  );
}

function TransactionModalWrapper() {
  const { isTransactionModalOpen, setIsTransactionModalOpen } = useLedger();
  return (
    <AddTransactionModal
      isOpen={isTransactionModalOpen}
      onClose={() => setIsTransactionModalOpen(false)}
    />
  );
}

function MobileNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { setIsTransactionModalOpen } = useLedger();

  const navItems = [
    { label: 'Dash', icon: <LayoutDashboard size={20} />, path: '/' },
    { label: 'Stocks', icon: <TrendingUp size={20} />, path: '/stocks' },
    { label: 'Funds', icon: <Activity size={20} />, path: '/mutual-funds' },
    { label: 'Ledger', icon: <History size={20} />, path: '/ledger' },
    { label: 'Accounts', icon: <User size={20} />, path: '/accounts' },
  ];

  return (
    <>
      <button
        className="mobile-fab"
        onClick={() => setIsTransactionModalOpen(true)}
        aria-label="Add transaction"
      >
        <Plus size={28} strokeWidth={3} />
      </button>

      <nav className="mobile-bottom-nav">
        {navItems.map((item) => (
          <button
            key={item.path}
            className={`mobile-bottom-nav__item ${
              pathname === item.path ? 'mobile-bottom-nav__item--active' : ''
            }`}
            onClick={() => router.push(item.path)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
