import React from 'react';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, icon, action, className = '', style, ...props }) => {
  return (
    <div className={`empty-state ${className}`} style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--spacing-10)',
      textAlign: 'center',
      backgroundColor: 'var(--color-surface)',
      borderRadius: 'var(--radius-lg)',
      border: '1px dashed var(--color-border)',
      color: 'var(--color-text-secondary)',
      margin: 'var(--spacing-4) 0',
      ...style
    }} {...props}>
      {icon && <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-4)', opacity: 0.5 }}>{icon}</div>}
      <h3 style={{ color: 'var(--color-text)', marginBottom: 'var(--spacing-2)' }}>{title}</h3>
      {description && <p style={{ maxWidth: '400px', marginBottom: 'var(--spacing-6)' }}>{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
};

