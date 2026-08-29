import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  width = '100%', 
  height = '1rem', 
  borderRadius = 'var(--radius-md)', 
  className = '', 
  style, 
  ...props 
}) => {
  return (
    <div 
      className={`skeleton ${className}`} 
      style={{ width, height, borderRadius, ...style }} 
      {...props} 
    />
  );
};

