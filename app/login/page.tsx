'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../components/AuthContext';
import {
  Command,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  TrendingUp,
  PieChart,
  BarChart3,
  Wallet,
  KeyRound,
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
    <div className="lp-root font-inter">
      <style jsx global>{`
        html,
        body {
          overflow: hidden !important;
          height: 100% !important;
          background: #000 !important;
        }
      `}</style>

      <div className="lp-transition-overlay" />

      {/* ── Left branding panel ── */}
      <div className="lp-left" aria-hidden="true">
        <div className="lp-left-orb lp-left-orb--a" />
        <div className="lp-left-orb lp-left-orb--b" />

        <div className="lp-left-inner lp-text-stagger">
          {/* Brand */}
          <div className="lp-brand">
            <div className="lp-logo">
              <Command size={32} />
            </div>
            <span className="lp-brand-name">
              FIN<span className="lp-brand-accent">CORE</span>
            </span>
          </div>

          {/* Hero text */}
          <div className="lp-hero">
            <h2 className="lp-hero-title text-balance">
              Wealth tracking, <br />
              reimagined.
            </h2>
            <p className="lp-hero-sub">
              The all-in-one finance dashboard for serious investors. Control your entire portfolio
              in one seamless view.
            </p>
          </div>

          {/* Feature list */}
          <ul className="lp-features" role="list">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="lp-feature-item">
                <div className="lp-feature-icon">
                  <Icon size={20} />
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
              <span className="lp-stat-value tracking-tightest">10K+</span>
              <span className="lp-stat-label">Active users</span>
            </div>
            <div className="lp-stat">
              <span className="lp-stat-value tracking-tightest">₹500Cr+</span>
              <span className="lp-stat-label">Wealth tracked</span>
            </div>
          </div>
        </div>

        <div className="lp-scroll-hint">
          <span>Explore Platform</span>
          <div className="lp-scroll-line" />
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="lp-right">
        <div className="lp-form-wrap lp-form-entrance">
          {/* Mobile-only brand mark */}
          <div className="lp-mobile-brand">
            <div className="lp-logo lp-logo--sm">
              <Command size={24} />
            </div>
            <span className="lp-brand-name lp-brand-name--sm">FINCORE</span>
          </div>

          <div className="lp-card">
            {/* Private access badge */}
            <div className="lp-access-badge">
              <KeyRound size={14} aria-hidden="true" />
              <span>Private Beta Access</span>
            </div>

            <div className="lp-form-header">
              <h1 className="lp-form-title tracking-tighter">Welcome back</h1>
              <p className="lp-form-subtitle">Secure access to your dashboard</p>
            </div>

            {error && (
              <div className="login-error input--error" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleEmailLogin} className="login-form" noValidate>
              <div className="input-group">
                <label className="login-label" htmlFor="lp-email">
                  Email Address
                </label>
                <div className="login-input-wrapper">
                  <input
                    id="lp-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    aria-label="Email Address"
                    aria-required="true"
                    autoComplete="email"
                    autoFocus
                    disabled={isLoading}
                    className={`login-input ${error ? 'login-input--error' : ''}`}
                  />
                </div>
              </div>

              <div className="input-group">
                <div className="login-password-header">
                  <label className="login-label" htmlFor="lp-password">
                    Password
                  </label>
                </div>
                <div className="login-input-wrapper">
                  <input
                    id="lp-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    aria-label="Password"
                    aria-required="true"
                    autoComplete="current-password"
                    disabled={isLoading}
                    className={`login-input ${error ? 'login-input--error' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="login-password-toggle"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="login-submit">
                {isLoading ? (
                  <div className="loading-dots">
                    <span>•</span>
                    <span>•</span>
                    <span>•</span>
                  </div>
                ) : (
                  <>
                    Sign In <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>

            <div className="lp-security-note">
              <Shield size={14} />
              <span>AES-256 Encrypted Session</span>
            </div>
          </div>

          <div className="lp-private-notice">
            <span>To request access, contact</span>
            <a href="mailto:saransci2006@gmail.com" className="lp-private-notice__link">
              saransci2006@gmail.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
