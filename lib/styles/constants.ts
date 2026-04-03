/**
 * Shared color and style constants for the dark theme.
 * Used across inline styles to avoid duplication.
 */

// Note: these hex values are the source of truth for inline styles.
// They intentionally mirror the CSS variables defined in globals.css :root
// (e.g. --text-primary, --accent, --danger) but must remain as literals here
// because CSS variables are not available in JS inline style objects.
export const colors = {
  bgPage: '#071018',
  bgCard: '#0b1519',
  bgInput: '#0a1216',
  border: 'rgba(160, 188, 180, 0.14)',
  textPrimary: '#e9f1ef',
  textMuted: '#99aba8',
  textHeading: '#f4f8f7',
  accent: '#1ea672',
  accentHover: '#43c08a',
  success: '#20b072',
  danger: '#ef4444',
  dangerHover: '#dc2626',
  warning: '#f2a93b',
} as const;

export const cardStyle: React.CSSProperties = {
  background: colors.bgCard,
  borderRadius: '16px',
  border: `1px solid ${colors.border}`,
  padding: '24px',
};

export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
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
  padding: '12px 24px',
  background: colors.accent,
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.95rem',
};

export const buttonDangerStyle: React.CSSProperties = {
  padding: '12px 24px',
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
  padding: '16px',
};

export const labelStyle: React.CSSProperties = {
  display: 'block',
  color: colors.textMuted,
  marginBottom: '8px',
  fontSize: '0.9rem',
};
