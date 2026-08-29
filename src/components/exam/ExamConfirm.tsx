import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface ExamConfirmProps {
  selectedExam: any;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ExamConfirm: React.FC<ExamConfirmProps> = ({ selectedExam, onCancel, onConfirm }) => {
  if (!selectedExam) return null;

  return (
    <div style={{ padding: 'var(--spacing-6)', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 128px)' }}>
      <Card style={{ maxWidth: '500px', width: '100%', padding: 'var(--spacing-8)', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: 'var(--spacing-4)' }}>⚠️</div>
        <h2 style={{ marginBottom: 'var(--spacing-2)' }}>Chuẩn bị làm bài</h2>
        <h3 style={{ color: 'var(--color-primary)', marginBottom: 'var(--spacing-6)' }}>{selectedExam.title}</h3>
        
        <div style={{ 
          backgroundColor: 'var(--color-warning-soft)', 
          padding: 'var(--spacing-4)', 
          borderRadius: 'var(--radius-md)',
          textAlign: 'left',
          marginBottom: 'var(--spacing-6)'
        }}>
          <h4 style={{ color: 'var(--color-warning)', marginBottom: 'var(--spacing-2)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
            <span>📋</span> Nội quy phòng thi:
          </h4>
          <ul style={{ margin: 0, paddingLeft: 'var(--spacing-5)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
            <li>Bài thi có thời gian <strong>{selectedExam.duration_minutes || 50} phút</strong>.</li>
            <li>Hệ thống sẽ <strong>tự động thu bài</strong> khi hết giờ.</li>
            <li><strong>KHÔNG</strong> chuyển tab hoặc thu nhỏ trình duyệt (Sẽ bị cảnh báo gian lận).</li>
            <li>Hệ thống có tính năng <strong>tự động lưu</strong> (Autosave).</li>
          </ul>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-4)' }}>
          <Button variant="outline" style={{ flex: 1 }} onClick={onCancel}>Quay lại</Button>
          <Button variant="primary" style={{ flex: 1 }} onClick={onConfirm}>Bắt đầu tính giờ</Button>
        </div>
      </Card>
    </div>
  );
};

