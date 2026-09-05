import React from 'react';

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  onClose,
  className = ''
}) => {
  const icons: Record<string, string> = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    danger: '❌'
  };

  return (
    <div className={`alert-base alert-${variant} ${className}`} role="alert">
      <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{icons[variant] || 'ℹ️'}</span>
      <div style={{ flex: 1 }}>
        {title && <div style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: '2px' }}>{title}</div>}
        <div>{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng thông báo"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1rem',
            lineHeight: 1,
            color: 'inherit',
            opacity: 0.7,
            padding: '2px 4px'
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
};
