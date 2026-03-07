'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { Command, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Shield } from 'lucide-react';

export default function LoginPage() {
  const { signIn, user, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, redirect away from login
  useEffect(() => {
    if (!loading && user) {
      window.location.href = '/';
    }
  }, [user, loading]);

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
        // Successful login - AuthContext state updates and our useEffect handles redirect
        // We also do a direct redirect here just in case
        window.location.href = '/';
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Background Decorative Elements */}
      <div className="login-bg-orb login-bg-orb--primary" />
      <div className="login-bg-orb login-bg-orb--secondary" />

      {/* Main Content Container */}
      <div className="login-content">
        {/* Brand Logo */}
        <div className="login-brand">
          <div className="login-logo">
            <Command size={36} />
          </div>
          <span className="login-title">
            FIN<span className="login-title-accent">CORE</span>
          </span>
        </div>

        {/* Login Card */}
        <div className="login-card">
          <div className="login-card-header">
            <h1 className="login-card-title">Welcome back</h1>
            <p className="login-card-subtitle">Enter your credentials to access your dashboard</p>
          </div>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleEmailLogin} className="login-form">
            {/* Email Field */}
            <div>
              <label className="login-label">Email Address</label>
              <div className="login-input-wrapper">
                <Mail size={18} className="login-input-icon" />
                <input
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

            {/* Password Field */}
            <div>
              <div className="login-password-header">
                <label className="login-label" style={{ marginBottom: 0 }}>
                  Password
                </label>
                <a href="#" className="login-forgot-link">
                  Forgot password?
                </a>
              </div>
              <div className="login-input-wrapper">
                <Lock size={18} className="login-input-icon" />
                <input
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

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              aria-busy={isLoading}
              aria-label={isLoading ? 'Signing in...' : 'Sign in to your account'}
              className="login-submit"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* Security badge */}
          <div
            style={{
              marginTop: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              color: '#475569',
              fontSize: '0.75rem',
              fontWeight: '600',
            }}
          >
            <Shield size={13} color="#475569" />
            <span>256-bit encrypted · Secured by Supabase</span>
          </div>
        </div>
      </div>
    </div>
  );
}
