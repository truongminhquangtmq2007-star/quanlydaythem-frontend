import React, { SelectHTMLAttributes } from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, helperText, options, children, id, ...props }, ref) => {
    const selectId = id || (label ? `select-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
    const errorId = error && selectId ? `${selectId}-error` : undefined;
    const helperId = helperText && selectId ? `${selectId}-helper` : undefined;

    return (
      <div className={`flex flex-col gap-2 ${className}`} style={{ width: '100%' }}>
        {label && (
          <label
            htmlFor={selectId}
            style={{
              fontWeight: 'var(--font-weight-medium)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text)'
            }}
          >
            {label}
            {props.required && <span style={{ color: 'var(--color-danger)', marginLeft: '4px' }}>*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className="select-base"
          aria-invalid={!!error}
          aria-describedby={errorId || helperId}
          style={error ? { borderColor: 'var(--color-danger)' } : {}}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
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
Select.displayName = 'Select';
