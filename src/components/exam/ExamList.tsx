import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';

interface ExamListProps {
  exams: any[];
  myScores: {[key: number]: any[]};
  onBack: () => void;
  onSelectExam: (doc: any) => void;
  onViewAttempt?: (attempt: any, doc: any) => void;
}

export const ExamList: React.FC<ExamListProps> = ({ exams, myScores, onBack, onSelectExam, onViewAttempt }) => {
  return (
    <div style={{ padding: 'var(--spacing-6)', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--spacing-6)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
        <Button variant="outline" onClick={onBack} style={{ alignSelf: 'flex-start' }}>
          &larr; Quay lại
        </Button>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', margin: 0 }}>🎯 Khu Vực Luyện Thi & Làm Bài</h1>
        <p className="text-secondary">Luyện đề không giới hạn số lần, xem lại kết quả từng lượt thi và nhận hướng dẫn chi tiết từ Gia sư AI.</p>
      </div>

      {exams.length === 0 ? (
        <EmptyState
          icon="📝"
          title="Chưa có đề thi nào"
          description="Hiện tại chưa có đề thi nào được mở cho lớp của bạn. Hãy liên hệ giáo viên hoặc quay lại sau nhé!"
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--spacing-6)' }}>
          {exams.map(doc => {
            const attempts = myScores[doc.id] || [];
            const isCompleted = attempts.length > 0;

            return (
              <Card key={doc.id} style={{ display: 'flex', flexDirection: 'column', padding: 'var(--spacing-6)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-4)' }}>
                  <div style={{ 
                    width: '48px', height: '48px', 
                    borderRadius: 'var(--radius-md)', 
                    backgroundColor: 'var(--color-primary-soft)', 
                    display: 'flex', justifyContent: 'center', alignItems: 'center', 
                    fontSize: '24px' 
                  }}>📝</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: '0 0 var(--spacing-1) 0', fontSize: 'var(--font-size-base)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.title}</h3>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <Badge variant="neutral">⏱️ {doc.duration_minutes || 50} Phút</Badge>
                      {doc.allow_view_answers && <Badge variant="success">✓ Có đáp án</Badge>}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: 'var(--spacing-4)', borderTop: '1px dashed var(--color-border)' }}>
                  {isCompleted ? (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>
                          LỊCH SỬ THI ({attempts.length} lần)
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 'bold' }}>
                          Cao nhất: {Math.max(...attempts.map(a => Number(a.total_score) || 0))}đ
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-4)', maxHeight: '150px', overflowY: 'auto' }}>
                        {attempts.map((att, idx) => (
                           <div key={idx} style={{ 
                             display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                             fontSize: 'var(--font-size-sm)', backgroundColor: 'var(--color-surface-hover)', 
                             padding: 'var(--spacing-2) var(--spacing-3)', borderRadius: 'var(--radius-sm)',
                             border: '1px solid var(--color-border)'
                           }}>
                             <div>
                               <strong>Lần {attempts.length - idx}</strong>
                               <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginLeft: '6px' }}>
                                 ({Math.round((att.time_taken_seconds || 0) / 60)} phút)
                               </span>
                             </div>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                               <span style={{ fontWeight: 'bold', color: Number(att.total_score) >= 8 ? 'var(--color-success)' : Number(att.total_score) >= 5 ? 'var(--color-warning)' : 'var(--color-danger)' }}>
                                 {att.total_score}đ
                               </span>
                               {onViewAttempt && (
                                 <Button 
                                   variant="outline" 
                                   size="sm" 
                                   onClick={() => onViewAttempt(att, doc)}
                                   style={{ padding: '2px 8px', fontSize: '12px', minHeight: '28px' }}
                                 >
                                   Xem kết quả
                                 </Button>
                                )}
                             </div>
                           </div>
                        ))}
                      </div>
                      <Button variant="primary" style={{ width: '100%' }} onClick={() => onSelectExam(doc)}>
                        🔄 Luyện thi lại
                      </Button>
                    </div>
                  ) : (
                    <Button variant="primary" style={{ width: '100%' }} onClick={() => onSelectExam(doc)}>
                      🚀 Bắt đầu làm bài
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

