import React from 'react';

export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  style?: React.CSSProperties;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  name = '',
  size = 'md',
  className = '',
  style
}) => {
  const sizeMap = {
    sm: { size: 32, fontSize: '0.75rem' },
    md: { size: 40, fontSize: '0.875rem' },
    lg: { size: 48, fontSize: '1rem' },
    xl: { size: 64, fontSize: '1.25rem' }
  };

  const { size: dimension, fontSize } = sizeMap[size] || sizeMap.md;

  const getInitials = (fullName: string) => {
    if (!fullName) return '?';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <div
      className={`avatar-base ${className}`}
      style={{
        width: `${dimension}px`,
        height: `${dimension}px`,
        fontSize,
        ...style
      }}
      aria-label={name || alt}
    >
      {src ? (
        <img src={src} alt={alt} className="avatar-img" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
};
