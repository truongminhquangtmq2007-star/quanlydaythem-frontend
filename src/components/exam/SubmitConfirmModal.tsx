import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface SubmitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  totalQuestions: number;
  answeredCount: number;
  isSubmitting: boolean;
}

export const SubmitConfirmModal: React.FC<SubmitConfirmModalProps> = ({
  isOpen, onClose, onSubmit, totalQuestions, answeredCount, isSubmitting
}) => {
  const unansweredCount = totalQuestions - answeredCount;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Xác nhận nộp bài"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Kiểm tra lại</Button>
          <Button variant="primary" onClick={onSubmit} isLoading={isSubmitting}>Nộp bài ngay</Button>
        </>
      }
    >
      <div style={{ textAlign: 'center', padding: 'var(--spacing-4) 0' }}>
        <div style={{ fontSize: '48px', marginBottom: 'var(--spacing-4)' }}>📝</div>
        <h3 style={{ marginBottom: 'var(--spacing-2)' }}>Bạn có chắc chắn muốn nộp bài?</h3>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 'var(--spacing-6)', 
          marginTop: 'var(--spacing-6)',
          padding: 'var(--spacing-4)',
          backgroundColor: 'var(--color-surface-hover)',
          borderRadius: 'var(--radius-md)'
        }}>
          <div>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'bold', color: 'var(--color-success)' }}>{answeredCount}</div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Đã làm</div>
          </div>
          <div style={{ width: '1px', backgroundColor: 'var(--color-border)' }}></div>
          <div>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'bold', color: unansweredCount > 0 ? 'var(--color-danger)' : 'var(--color-text)' }}>{unansweredCount}</div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Chưa làm</div>
          </div>
        </div>
        
        {unansweredCount > 0 && (
          <p style={{ color: 'var(--color-warning)', marginTop: 'var(--spacing-4)', fontWeight: 'var(--font-weight-medium)' }}>
            ⚠️ Bạn vẫn còn {unansweredCount} câu chưa hoàn thành.
          </p>
        )}
      </div>
    </Modal>
  );
};

