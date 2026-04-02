'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../components/AuthContext';
import { Command, Eye, EyeOff, ArrowRight, Shield, AlertCircle } from 'lucide-react';

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
          background: #071018 !important;
        }
      `}</style>

      {/* Ambient background orbs */}
      <div className="lp-orb lp-orb--a" aria-hidden="true" />
      <div className="lp-orb lp-orb--b" aria-hidden="true" />

      {/* Centered card */}
      <div className="lp-card">
        {/* Brand */}
        <div className="lp-brand">
          <div className="lp-logo">
            <Command size={28} />
          </div>
          <span className="lp-brand-name">
            FIN<span className="lp-brand-accent">CORE</span>
          </span>
        </div>

        {/* Heading */}
        <div className="lp-heading">
          <h1 className="lp-title">Welcome back</h1>
          <p className="lp-subtitle">Sign in to your dashboard</p>
        </div>

        {/* Error */}
        {error && (
          <div className="lp-error" role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleEmailLogin} className="lp-form" noValidate>
          <div className="lp-field">
            <label className="lp-label" htmlFor="lp-email">
              Email
            </label>
            <input
              id="lp-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              aria-label="Email"
              aria-required="true"
              autoComplete="email"
              autoFocus
              disabled={isLoading}
              className={`lp-input${error ? ' lp-input--error' : ''}`}
            />
          </div>

          <div className="lp-field">
            <label className="lp-label" htmlFor="lp-password">
              Password
            </label>
            <div className="lp-input-wrap">
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
                className={`lp-input${error ? ' lp-input--error' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="lp-pw-toggle"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="lp-submit">
            {isLoading ? (
              <span className="lp-spinner" aria-label="Signing in…" />
            ) : (
              <>
                Sign In <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="lp-footer">
          <Shield size={13} aria-hidden="true" />
          <span>AES-256 encrypted · end-to-end secure</span>
        </div>

        <p className="lp-contact">
          Need access?{' '}
          <a href="mailto:saransci2006@gmail.com" className="lp-contact__link">
            saransci2006@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}
