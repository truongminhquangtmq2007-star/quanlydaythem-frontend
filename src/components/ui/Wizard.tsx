import React from 'react';
import { Card } from './Card';
import { Button } from './Button';

interface WizardStep {
  id: string;
  label: string;
  content: React.ReactNode;
  isValid?: boolean;
}

interface WizardProps {
  steps: WizardStep[];
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  isSubmitting?: boolean;
  onSubmit: () => void;
  submitLabel?: string;
}

export const Wizard: React.FC<WizardProps> = ({
  steps, currentStep, onNext, onPrev, isSubmitting, onSubmit, submitLabel = 'Hoàn thành'
}) => {
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      {/* HEADER: Progress */}
      <div style={{ 
        display: 'flex', 
        backgroundColor: 'var(--color-surface-hover)', 
        borderBottom: '1px solid var(--color-border)',
        padding: '0 var(--spacing-4)'
      }}>
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isPast = index < currentStep;
          return (
            <div key={step.id} style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              padding: 'var(--spacing-4) 0',
              position: 'relative'
            }}>
              <div style={{
                width: '32px', height: '32px',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: isActive ? 'var(--color-primary)' : isPast ? 'var(--color-primary-soft)' : 'var(--color-surface)',
                color: isActive ? '#fff' : isPast ? 'var(--color-primary)' : 'var(--color-text-muted)',
                fontWeight: 'bold',
                border: `2px solid ${isActive || isPast ? 'var(--color-primary)' : 'var(--color-border)'}`,
                zIndex: 2,
                transition: 'all var(--transition-fast)'
              }}>
                {isPast ? '✓' : index + 1}
              </div>
              <span style={{ 
                marginTop: 'var(--spacing-2)', 
                fontSize: 'var(--font-size-xs)', 
                fontWeight: isActive ? 'bold' : 'normal',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                textAlign: 'center'
              }}>
                {step.label}
              </span>
              {index > 0 && (
                <div style={{
                  position: 'absolute',
                  top: 'var(--spacing-7)',
                  left: '-50%',
                  right: '50%',
                  height: '2px',
                  backgroundColor: isPast || isActive ? 'var(--color-primary)' : 'var(--color-border)',
                  zIndex: 1
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* CONTENT */}
      <div style={{ padding: 'var(--spacing-8)' }}>
        {steps[currentStep].content}
      </div>

      {/* FOOTER */}
      <div style={{ 
        padding: 'var(--spacing-4) var(--spacing-8)', 
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        justifyContent: 'space-between',
        backgroundColor: 'var(--color-surface-hover)'
      }}>
        <Button variant="ghost" onClick={onPrev} disabled={currentStep === 0 || isSubmitting}>
          Quay lại
        </Button>
        {currentStep < steps.length - 1 ? (
          <Button variant="primary" onClick={onNext} disabled={!steps[currentStep].isValid}>
            Tiếp tục
          </Button>
        ) : (
          <Button variant="primary" onClick={onSubmit} isLoading={isSubmitting} disabled={!steps[currentStep].isValid}>
            {submitLabel}
          </Button>
        )}
      </div>
    </Card>
  );
};

