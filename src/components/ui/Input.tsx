import React, { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, id, ...props }, ref) => {
    const inputId = id || (label ? `input-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
    
    return (
      <div className={`flex flex-col gap-2 ${className}`} style={{ width: '100%' }}>
        {label && (
          <label htmlFor={inputId} style={{ fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)' }}>
            {label}
            {props.required && <span style={{ color: 'var(--color-danger)', marginLeft: '4px' }}>*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className="input-base"
          style={error ? { borderColor: 'var(--color-danger)' } : {}}
          {...props}
        />
        {error && (
          <span style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-xs)' }}>
            {error}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

