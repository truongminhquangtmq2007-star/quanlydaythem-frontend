import React from 'react';
import { Button } from '../ui/Button';

interface QuestionNavigatorProps {
  questions: any[];
  part1Answers: {[key: number]: string};
  part2Answers: {[key: number]: {[sub: string]: string}};
  part3Answers: {[key: number]: string};
  onScrollToQuestion: (q: any) => void;
  onSubmitClick: () => void;
}

export const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
  questions,
  part1Answers,
  part2Answers,
  part3Answers,
  onScrollToQuestion,
  onSubmitClick
}) => {
  const getStatus = (q: any) => {
    const isP1 = q.part === '1' || q.part === 'part1' || q.part_number === 1;
    const isP2 = q.part === '2' || q.part === 'part2' || q.part_number === 2;
    const isP3 = q.part === '3' || q.part === 'part3' || q.part_number === 3;

    if (isP1 && part1Answers[q.id]) return 'answered';
    if (isP3 && part3Answers[q.id] && String(part3Answers[q.id]).trim() !== '') return 'answered';
    if (isP2) {
      const p2 = part2Answers[q.id] || {};
      const stmts = q.statements ? Object.keys(q.statements) : (q.sub_questions?.map((s: any) => s.id || s) || ['a', 'b', 'c', 'd']);
      if (stmts.length > 0 && stmts.every((s: string) => p2[s])) return 'answered';
      if (stmts.length > 0 && stmts.some((s: string) => p2[s])) return 'partial';
    }
    return 'unanswered';
  };

  return (
    <div style={{
      width: '300px',
      backgroundColor: 'var(--color-surface)',
      borderLeft: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 64px)',
      position: 'sticky',
      top: '64px'
    }}>
      <div style={{ padding: 'var(--spacing-4)', borderBottom: '1px solid var(--color-border)' }}>
        <h3 style={{ margin: 0, fontSize: 'var(--font-size-base)' }}>Bản đồ câu hỏi</h3>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-4)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--spacing-2)' }}>
          {questions.map((q, idx) => {
            const status = getStatus(q);
            let bgColor = 'var(--color-surface)';
            let color = 'var(--color-text)';
            let borderColor = 'var(--color-border)';

            if (status === 'answered') {
              bgColor = 'var(--color-primary)';
              color = '#fff';
              borderColor = 'var(--color-primary)';
            } else if (status === 'partial') {
              bgColor = 'var(--color-warning-soft)';
              color = 'var(--color-warning)';
              borderColor = 'var(--color-warning)';
            }

            return (
              <button
                key={`${q.part || 'p'}-${q.id}-${idx}`}
                onClick={() => onScrollToQuestion(q)}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${borderColor}`,
                  backgroundColor: bgColor,
                  color: color,
                  fontWeight: 'var(--font-weight-medium)',
                  fontSize: 'var(--font-size-sm)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseOver={(e) => {
                  if (status === 'unanswered') e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                }}
                onMouseOut={(e) => {
                  if (status === 'unanswered') e.currentTarget.style.backgroundColor = 'var(--color-surface)';
                }}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ padding: 'var(--spacing-4)', borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-hover)' }}>
        <div style={{ display: 'flex', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-4)', fontSize: 'var(--font-size-xs)' }}>
          <div className="flex items-center gap-1"><div style={{ width: 12, height: 12, backgroundColor: 'var(--color-primary)', borderRadius: 2 }}></div> Đã làm</div>
          <div className="flex items-center gap-1"><div style={{ width: 12, height: 12, backgroundColor: 'var(--color-warning-soft)', border: '1px solid var(--color-warning)', borderRadius: 2 }}></div> Dang dở</div>
          <div className="flex items-center gap-1"><div style={{ width: 12, height: 12, border: '1px solid var(--color-border)', borderRadius: 2 }}></div> Chưa làm</div>
        </div>
        <Button 
          variant="primary"
          onClick={onSubmitClick}
          style={{ width: '100%' }}
        >
          Nộp Bài
        </Button>
      </div>
    </div>
  );
};

