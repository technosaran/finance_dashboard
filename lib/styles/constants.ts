/**
 * Shared color and style constants for the dark theme.
 * Used across inline styles to avoid duplication.
 */

export const colors = {
  bgPage: '#000000',
  bgCard: '#050505',
  bgInput: '#000000',
  border: '#1a1a1a',
  textPrimary: '#e2e8f0',
  textMuted: '#94a3b8',
  textHeading: '#f8fafc',
  accent: '#6366f1',
  accentHover: '#818cf8',
  success: '#22c55e',
  danger: '#ef4444',
  dangerHover: '#dc2626',
  warning: '#f59e0b',
} as const;

export const cardStyle: React.CSSProperties = {
  background: colors.bgCard,
  borderRadius: '16px',
  border: `1px solid ${colors.border}`,
  padding: '24px',
};

export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: colors.bgInput,
  border: `1px solid ${colors.border}`,
  borderRadius: '8px',
  color: colors.textPrimary,
  fontSize: '0.95rem',
};

export const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
};

export const buttonPrimaryStyle: React.CSSProperties = {
  padding: '10px 24px',
  background: colors.accent,
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.95rem',
};

export const buttonDangerStyle: React.CSSProperties = {
  padding: '10px 24px',
  background: colors.danger,
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.95rem',
};

export const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '20px',
};

export const labelStyle: React.CSSProperties = {
  display: 'block',
  color: colors.textMuted,
  marginBottom: '6px',
  fontSize: '0.9rem',
};
