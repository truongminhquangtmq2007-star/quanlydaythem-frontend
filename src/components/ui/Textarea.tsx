import React, { TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', label, error, helperText, id, rows = 3, ...props }, ref) => {
    const textareaId = id || (label ? `textarea-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
    const errorId = error && textareaId ? `${textareaId}-error` : undefined;
    const helperId = helperText && textareaId ? `${textareaId}-helper` : undefined;

    return (
      <div className={`flex flex-col gap-2 ${className}`} style={{ width: '100%' }}>
        {label && (
          <label
            htmlFor={textareaId}
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
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className="textarea-base"
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
Textarea.displayName = 'Textarea';
