import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface ExamListProps {
  exams: any[];
  myScores: {[key: number]: any[]};
  onBack: () => void;
  onSelectExam: (doc: any) => void;
}

export const ExamList: React.FC<ExamListProps> = ({ exams, myScores, onBack, onSelectExam }) => {
  return (
    <div style={{ padding: 'var(--spacing-6)' }}>
      <div style={{ marginBottom: 'var(--spacing-6)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
        <Button variant="outline" onClick={onBack} style={{ alignSelf: 'flex-start' }}>
          &larr; Quay lại
        </Button>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', margin: 0 }}>Khu vực luyện thi</h1>
        <p className="text-secondary">Hoàn thành các đề thi dưới đây để nâng cao năng lực.</p>
      </div>

      {exams.length === 0 ? (
        <div className="text-center text-muted" style={{ padding: 'var(--spacing-8)' }}>Chưa có đề thi nào.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-6)' }}>
          {exams.map(doc => {
            const attempts = myScores[doc.id] || [];
            const isCompleted = attempts.length > 0;

            return (
              <Card key={doc.id} style={{ display: 'flex', flexDirection: 'column', padding: 'var(--spacing-6)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)' }}>
                  <div style={{ 
                    width: '48px', height: '48px', 
                    borderRadius: 'var(--radius-md)', 
                    backgroundColor: 'var(--color-primary-soft)', 
                    display: 'flex', justifyContent: 'center', alignItems: 'center', 
                    fontSize: '24px' 
                  }}>📝</div>
                  <div>
                    <h3 style={{ margin: '0 0 var(--spacing-1) 0', fontSize: 'var(--font-size-base)' }}>{doc.title}</h3>
                    <Badge variant="neutral">{doc.duration_minutes || 50} Phút</Badge>
                  </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: 'var(--spacing-4)', borderTop: '1px dashed var(--color-border)' }}>
                  {isCompleted ? (
                    <div>
                      <p style={{ margin: '0 0 var(--spacing-2) 0', fontSize: 'var(--font-size-xs)', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>
                        LỊCH SỬ THI ({attempts.length} lần)
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-4)', maxHeight: '120px', overflowY: 'auto' }}>
                        {attempts.map((att, idx) => (
                           <div key={idx} style={{ 
                             display: 'flex', justifyContent: 'space-between', 
                             fontSize: 'var(--font-size-sm)', backgroundColor: 'var(--color-surface-hover)', 
                             padding: 'var(--spacing-2) var(--spacing-3)', borderRadius: 'var(--radius-sm)' 
                           }}>
                             <span>Lần {attempts.length - idx}</span>
                             <span style={{ fontWeight: 'bold', color: 'var(--color-success)' }}>{att.total_score}đ</span>
                           </div>
                        ))}
                      </div>
                      <Button variant="outline" style={{ width: '100%' }} onClick={() => onSelectExam(doc)}>
                        Thi lại
                      </Button>
                    </div>
                  ) : (
                    <Button variant="primary" style={{ width: '100%' }} onClick={() => onSelectExam(doc)}>
                      Bắt đầu thi
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

