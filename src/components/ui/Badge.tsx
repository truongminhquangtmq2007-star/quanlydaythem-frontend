import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ 
  variant = 'neutral', 
  size = 'md',
  dot = false,
  className = '', 
  children, 
  ...props 
}) => {
  const sizeStyle = size === 'sm' ? { fontSize: '0.7rem', padding: '0.1rem 0.4rem' } : {};
  return (
    <span className={`badge badge-${variant} ${className}`} style={{ ...sizeStyle, ...props.style }} {...props}>
      {dot && (
        <span 
          style={{ 
            width: '6px', 
            height: '6px', 
            borderRadius: '50%', 
            backgroundColor: 'currentColor', 
            marginRight: '4px',
            display: 'inline-block' 
          }} 
        />
      )}
      {children}
    </span>
  );
};

