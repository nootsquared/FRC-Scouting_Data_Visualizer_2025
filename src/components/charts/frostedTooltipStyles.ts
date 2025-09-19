import React from 'react';

export const frostedTooltipContentStyle: React.CSSProperties = {
  background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.82) 55%, rgba(15, 23, 42, 0.78) 100%)',
  border: '1px solid rgba(148, 163, 184, 0.35)',
  borderRadius: '16px',
  boxShadow: '0 24px 48px rgba(8, 15, 30, 0.45)',
  padding: '16px 18px',
  color: '#E2E8F0',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  fontFamily: 'var(--font-sans, "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif)',
};

export const frostedTooltipLabelStyle: React.CSSProperties = {
  color: 'rgba(148, 163, 184, 0.95)',
  fontWeight: 600,
  fontSize: '12px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginBottom: '8px',
};

export const frostedTooltipItemStyle: React.CSSProperties = {
  color: '#F8FAFC',
  fontWeight: 600,
  fontSize: '13px',
  padding: '4px 0',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};
