import React from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface ExamHeaderProps {
  title: string;
  duration: number; // in minutes
  saveStatus: string;
  onExit: () => void;
  isSubmitting: boolean;
  timeLeft: number;
}

export const ExamHeader: React.FC<ExamHeaderProps> = ({ 
  title, duration, saveStatus, onExit, isSubmitting, timeLeft 
}) => {
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeLeft <= 300; // less than 5 minutes

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      padding: 'var(--spacing-3) var(--spacing-6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onExit} disabled={isSubmitting}>
          ← Thoát
        </Button>
        <div>
          <h1 style={{ margin: 0, fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)' }}>{title}</h1>
          <div className="flex items-center gap-2" style={{ fontSize: 'var(--font-size-xs)' }}>
            <span className="text-secondary">{duration} phút</span>
            {saveStatus && (
              <Badge variant={saveStatus.includes('Đã lưu') ? 'success' : saveStatus.includes('Lỗi') ? 'danger' : 'warning'}>
                {saveStatus}
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-2)',
        backgroundColor: isLowTime ? 'var(--color-danger-soft)' : 'var(--color-primary-soft)',
        color: isLowTime ? 'var(--color-danger)' : 'var(--color-primary)',
        padding: 'var(--spacing-2) var(--spacing-4)',
        borderRadius: 'var(--radius-full)',
        fontWeight: 'var(--font-weight-bold)',
        fontFamily: 'monospace',
        fontSize: 'var(--font-size-lg)'
      }}>
        ⏱ {formatTime(timeLeft)}
      </div>
    </header>
  );
};

