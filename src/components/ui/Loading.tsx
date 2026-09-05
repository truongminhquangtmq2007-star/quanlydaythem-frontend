import React from 'react';

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  text,
  fullScreen = false
}) => {
  const sizePx = size === 'sm' ? 20 : size === 'lg' ? 44 : 32;

  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--spacing-3)',
        padding: 'var(--spacing-4)'
      }}
      role="status"
      aria-live="polite"
    >
      <div
        className="spinner"
        style={{
          width: `${sizePx}px`,
          height: `${sizePx}px`,
          borderWidth: size === 'sm' ? '2px' : '3px',
          borderColor: 'var(--color-primary)',
          borderRightColor: 'transparent'
        }}
      />
      {text && (
        <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
          {text}
        </span>
      )}
      <span className="sr-only">Đang tải...</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 'var(--z-modal)',
          backdropFilter: 'blur(2px)'
        }}
      >
        {content}
      </div>
    );
  }

  return content;
};
