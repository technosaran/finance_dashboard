'use client';

import { useEffect, useState } from 'react';
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

const PORTFOLIO_ROUTE_PREFIXES = ['/stocks', '/mutual-funds', '/fno', '/bonds'];

function isPortfolioPath(pathname: string) {
  return pathname === '/' || PORTFOLIO_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login';
  const isPortfolioRoute = isPortfolioPath(pathname);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <AuthConsumer isAuthPage={isAuthPage} isPortfolioRoute={isPortfolioRoute}>
            {children}
          </AuthConsumer>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

function AuthConsumer({
  children,
  isAuthPage,
  isPortfolioRoute,
}: {
  children: React.ReactNode;
  isAuthPage: boolean;
  isPortfolioRoute: boolean;
}) {
  const { loading: authLoading, user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if ((authLoading || !user) && !isAuthPage) {
    return (
      <div className="loading-overlay">
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" />
          <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <FinanceProvider isPortfolioRoute={isPortfolioRoute}>
      <TransactionModalWrapper isPortfolioRoute={isPortfolioRoute} />
      {/* Global ambient background for liquid glass depth */}
      <div className="bg-mesh" aria-hidden="true" />
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div
        style={{
          display: 'flex',
          height: '100dvh',
          backgroundColor: '#000000',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {!isAuthPage && (
          <header className="mobile-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.13)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  color: '#fff',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  minWidth: '44px',
                  minHeight: '44px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.18)',
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
                    background: 'linear-gradient(135deg, #1a8e68 0%, #155b58 100%)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
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
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(4px)',
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
            className={isAuthPage ? '' : 'main-content'}
            style={{
              flex: 1,
              overflowY: isAuthPage ? 'hidden' : 'auto',
              display: isAuthPage ? 'flex' : 'block',
              position: 'relative',
            }}
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

function TransactionModalWrapper({ isPortfolioRoute }: { isPortfolioRoute: boolean }) {
  const { isTransactionModalOpen, setIsTransactionModalOpen } = useLedger();

  useEffect(() => {
    if (isPortfolioRoute) {
      void import('./AddTransactionModal');
    }
  }, [isPortfolioRoute]);

  if (!isTransactionModalOpen) return null;

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
    { label: 'Home', icon: <LayoutDashboard size={20} />, path: '/' },
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
