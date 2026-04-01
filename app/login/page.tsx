'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../components/AuthContext';
import {
  Command,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Shield,
  TrendingUp,
  PieChart,
  BarChart3,
  Wallet,
  KeyRound,
  AtSign,
} from 'lucide-react';

const FEATURES = [
  {
    icon: TrendingUp,
    title: 'Portfolio Tracking',
    desc: 'Stocks, mutual funds, bonds & FnO in one place',
  },
  {
    icon: PieChart,
    title: 'Smart Allocation',
    desc: 'Visual breakdowns of your entire wealth',
  },
  {
    icon: BarChart3,
    title: 'Real-time Analytics',
    desc: 'Live P&L, XIRR and performance insights',
  },
  {
    icon: Wallet,
    title: 'Goals & Budgets',
    desc: 'Plan, track and achieve your financial goals',
  },
];

export default function LoginPage() {
  const { signIn, user, loading } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [loading, router, user]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const { error: authError } = await signIn(email, password);

      if (authError) {
        setError(authError.message || 'Invalid email or password');
        setIsLoading(false);
      } else {
        router.replace('/');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="lp-root">
      <style jsx global>{`
        html,
        body {
          overflow: hidden !important;
          height: 100% !important;
        }
      `}</style>

      {/* ── Left branding panel ── */}
      <div className="lp-left" aria-hidden="true">
        <div className="lp-left-orb lp-left-orb--a" />
        <div className="lp-left-orb lp-left-orb--b" />
        <div className="lp-left-orb lp-left-orb--c" />

        <div className="lp-left-inner">
          {/* Brand */}
          <div className="lp-brand">
            <div className="lp-logo">
              <Command size={28} />
            </div>
            <span className="lp-brand-name">
              FIN<span className="lp-brand-accent">CORE</span>
            </span>
          </div>

          {/* Hero text */}
          <div className="lp-hero">
            <h2 className="lp-hero-title">Your wealth,&nbsp;one&nbsp;view.</h2>
            <p className="lp-hero-sub">
              The all-in-one finance dashboard built for serious investors.
            </p>
          </div>

          {/* Feature list */}
          <ul className="lp-features" role="list">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="lp-feature-item">
                <div className="lp-feature-icon">
                  <Icon size={16} />
                </div>
                <div>
                  <p className="lp-feature-title">{title}</p>
                  <p className="lp-feature-desc">{desc}</p>
                </div>
              </li>
            ))}
          </ul>

          {/* Bottom stats strip */}
          <div className="lp-stats">
            <div className="lp-stat">
              <span className="lp-stat-value">10K+</span>
              <span className="lp-stat-label">Active users</span>
            </div>
            <div className="lp-stat-divider" />
            <div className="lp-stat">
              <span className="lp-stat-value">₹500Cr+</span>
              <span className="lp-stat-label">Wealth tracked</span>
            </div>
            <div className="lp-stat-divider" />
            <div className="lp-stat">
              <span className="lp-stat-value">99.9%</span>
              <span className="lp-stat-label">Uptime</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="lp-right">
        <div className="lp-right-orb lp-right-orb--a" />
        <div className="lp-right-orb lp-right-orb--b" />
        <div className="lp-right-orb lp-right-orb--c" />

        <div className="lp-form-wrap">
          {/* Mobile-only brand mark */}
          <div className="lp-mobile-brand">
            <div className="lp-logo lp-logo--sm">
              <Command size={20} />
            </div>
            <span className="lp-brand-name lp-brand-name--sm">
              FIN<span className="lp-brand-accent">CORE</span>
            </span>
          </div>

          <div className="lp-card">
            {/* Private access badge */}
            <div className="lp-access-badge">
              <KeyRound size={11} aria-hidden="true" />
              <span>Private Access &middot; Invite Only</span>
            </div>

            <div className="lp-form-header">
              <h1 className="lp-form-title">Welcome back</h1>
              <p className="lp-form-subtitle">Sign in to your finance dashboard</p>
            </div>

            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleEmailLogin} className="login-form" noValidate>
              <div>
                <label className="login-label" htmlFor="lp-email">
                  Email Address
                </label>
                <div className="login-input-wrapper">
                  <Mail size={18} className="login-input-icon" />
                  <input
                    id="lp-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    aria-label="Email Address"
                    aria-required="true"
                    aria-invalid={error ? 'true' : 'false'}
                    autoComplete="email"
                    autoFocus
                    disabled={isLoading}
                    className={`login-input${error ? ' login-input--error' : ''}${isLoading ? ' login-input--disabled' : ''}`}
                  />
                </div>
              </div>

              <div>
                <div className="login-password-header">
                  <label className="login-label" htmlFor="lp-password" style={{ marginBottom: 0 }}>
                    Password
                  </label>
                </div>
                <div className="login-input-wrapper">
                  <Lock size={18} className="login-input-icon" />
                  <input
                    id="lp-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    aria-label="Password"
                    aria-required="true"
                    aria-invalid={error ? 'true' : 'false'}
                    autoComplete="current-password"
                    disabled={isLoading}
                    className={`login-input login-input--password${error ? ' login-input--error' : ''}${isLoading ? ' login-input--disabled' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="login-password-toggle"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                aria-busy={isLoading}
                aria-label={isLoading ? 'Signing in…' : 'Sign in to your account'}
                className="login-submit"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign In <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>

            <div className="lp-security-note">
              <Shield size={13} />
              <span>Protected by Supabase authentication</span>
            </div>
          </div>

          <div className="lp-private-notice">
            <AtSign size={14} aria-hidden="true" />
            <span>
              Private site &mdash; to request access, email{' '}
              <a href="mailto:saransci2006@gmail.com" className="lp-private-notice__link">
                saransci2006@gmail.com
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
