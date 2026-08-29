import React from 'react';

interface QuestionNavigatorProps {
  questions: any[];
  part1Answers: {[key: number]: string};
  part2Answers: {[key: number]: {[sub: string]: string}};
  part3Answers: {[key: number]: string};
  onScrollToQuestion: (qId: number) => void;
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
    if (q.part === '1' && part1Answers[q.id]) return 'answered';
    if (q.part === '3' && part3Answers[q.id] && part3Answers[q.id].trim() !== '') return 'answered';
    if (q.part === '2') {
      const p2 = part2Answers[q.id] || {};
      const subs = q.sub_questions || [];
      if (subs.length > 0 && subs.every((sub: any) => p2[sub.id])) return 'answered';
      if (subs.length > 0 && subs.some((sub: any) => p2[sub.id])) return 'partial';
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
                key={q.id}
                onClick={() => onScrollToQuestion(q.id)}
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
        <button 
          onClick={onSubmitClick}
          className="btn btn-primary"
          style={{ width: '100%' }}
        >
          Nộp Bài
        </button>
      </div>
    </div>
  );
};

