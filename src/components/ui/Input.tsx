import React, { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, id, ...props }, ref) => {
    const inputId = id || (label ? `input-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
    const errorId = error && inputId ? `${inputId}-error` : undefined;
    const helperId = helperText && inputId ? `${inputId}-helper` : undefined;
    
    return (
      <div className={`flex flex-col gap-2 ${className}`} style={{ width: '100%' }}>
        {label && (
          <label htmlFor={inputId} style={{ fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text)' }}>
            {label}
            {props.required && <span style={{ color: 'var(--color-danger)', marginLeft: '4px' }}>*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className="input-base"
          aria-invalid={!!error}
          aria-describedby={errorId || helperId}
          style={error ? { borderColor: 'var(--color-danger)' } : {}}
          {...props}
        />
        {error ? (
          <span id={errorId} style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-xs)' }} role="alert">
            {error}
          </span>
        ) : helperText ? (
          <span id={helperId} style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
            {helperText}
          </span>
        ) : null}
      </div>
    );
  }
);
Input.displayName = 'Input';

