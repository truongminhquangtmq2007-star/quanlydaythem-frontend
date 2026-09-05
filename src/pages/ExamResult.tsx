import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import type { ExamGradingResult, QuestionGradingDetail, SharedContext } from '../types/exam';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import axiosClient from '../api/axiosClient';
import { Button } from '../components/ui/Button';

// ==========================================
// HÀM TIỆN ÍCH: Render LaTeX an toàn
// ==========================================
const renderContent = (text: string) => {
  if (!text) return '';
  let safeText = String(text);
  safeText = safeText.replace(/\\{2,}/g, '\\');
  safeText = safeText.replace(/\\_/g, '_');
  const parts = safeText.split('$');
  return parts.map((part, index) => {
    if (index % 2 === 0) return <span key={index}>{part}</span>;
    let math = part.trim();
    if (!math) return null;
    math = math.replace(/[\u200B-\u200D\uFEFF\u00AD\u2060]/g, '');
    math = math.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    math = math.replace(/[\r\n\t]/g, '');
    math = math.replace(/\\{2,}/g, '\\');
    math = math.replace(/\\_/g, '_');
    return (
      <InlineMath key={index} math={math}
        renderError={(error) => (
          <span style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)' }}>
            ⚠️ {math} <br /><span style={{ fontSize: '11px', color: '#b91c1c' }}>{error.message}</span>
          </span>
        )}
      />
    );
  });
};

const ImageBlock = ({ url }: { url: string }) => (
  <div style={{ float: 'right', marginLeft: 'var(--spacing-4)', marginBottom: 'var(--spacing-2)', maxWidth: '42%' }}>
    <img src={url} alt="Hình minh họa" style={{ width: '100%', maxHeight: '260px', objectFit: 'contain', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'block' }} />
  </div>
);

// ==========================================
// PROPS — Hỗ trợ cả học sinh lẫn giáo viên
// ==========================================
interface ExamResultProps {
  examId?: string | number;
  // Chế độ 1: Học sinh (full result từ submitExam response)
  gradingResult?: ExamGradingResult;
  examData?: any; // FullExamData
  examTitle?: string;
  timeTakenSeconds?: number;
  onBackToList?: () => void;
  onViewAnswers?: () => void;

  // Chế độ 2: Giáo viên (truyền data thô từ submission object)
  data?: QuestionGradingDetail[];
  submission?: any; // submission row from getExamSubmissions
  isTeacherView?: boolean;
}

// ==========================================
// HELPER: format thời gian
// ==========================================
const formatDuration = (seconds: number): string => {
  if (!seconds && seconds !== 0) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins} phút ${secs.toString().padStart(2, '0')} giây`;
};

// ==========================================
// HELPER: tìm nhóm câu hỏi chùm
// ==========================================
const findGroupIfFirst = (examData: any, part: string, qId: number): SharedContext | null => {
  if (!examData) return null;
  const groups: SharedContext[] = examData?.sharedContexts || examData?.shared_context || [];
  const group = groups.find((g) => {
    const qIds = (g.questionIds || (g as any).question_ids || []).map(Number);
    const inPart = g.part === part || (!g.part && (
      (examData?.[part] || []).some((q: any) => qIds.includes(Number(q.id)))
    ));
    return inPart && qIds.includes(Number(qId));
  });
  if (!group) return null;
  const qIds = (group.questionIds || (group as any).question_ids || []).map(Number);
  const minId = Math.min(...qIds);
  return Number(qId) === minId ? group : null;
};

const renderGroupBlock = (group: SharedContext) => (
  <div style={{ backgroundColor: 'var(--color-surface)beb', border: '1px dashed var(--color-warning)', padding: 'var(--spacing-4)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-5)', color: '#78350f', lineHeight: '1.6', fontSize: '15px', clear: 'both' }}>
    {group.image_url && <ImageBlock url={group.image_url} />}
    <div style={{ fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-2)' }}>
      📌 Sử dụng thông tin sau để trả lời các câu {group.questionIds.join(', ')}:
    </div>
    <div>{renderContent(group.content)}</div>
    <div style={{ clear: 'both' }} />
  </div>
);

// ==========================================
// HELPER: Lấy detail theo question_id
// ==========================================
const getDetail = (details: QuestionGradingDetail[], qId: number): QuestionGradingDetail | undefined => {
  return details.find(d => d.question_id === qId);
};

// ==========================================
import AITutorBlock from '../components/AITutorBlock';

const ExamResult: React.FC<ExamResultProps> = (props) => {
  const {
    gradingResult,
    examData,
    examTitle,
    timeTakenSeconds,
    onBackToList,
    onViewAnswers,
    data,
    submission,
    isTeacherView = false,
  } = props;

  const { id } = useParams();
  const examId = props.examId || id;

  // ==========================================
  // CHUẨN HÓA DỮ LIỆU — hỗ trợ cả 2 chế độ
  // ==========================================
  let details: QuestionGradingDetail[] = [];
  let totalScore = 0;
  let p1Score = 0, p2Score = 0, p3Score = 0;
  let p1Correct = 0, p1Total = 0;
  let p2Correct = 0, p2Total = 0;
  let p3Correct = 0, p3Total = 0;
  let totalCorrect = 0, totalQuestions = 0;
  let cheatCount = 0;
  let displayTimeTaken = 0;
  let allowViewAnswers = false;
  let displayTitle = examTitle || 'Kết quả thi';

  if (gradingResult) {
    // Chế độ Học sinh — từ full ExamGradingResult
    details = gradingResult.details || [];
    totalScore = gradingResult.score?.totalScore ?? 0;
    p1Score = gradingResult.score?.p1Score ?? gradingResult.summary?.part1?.score ?? 0;
    p2Score = gradingResult.score?.p2Score ?? gradingResult.summary?.part2?.score ?? 0;
    p3Score = gradingResult.score?.p3Score ?? gradingResult.summary?.part3?.score ?? 0;
    p1Correct = gradingResult.summary?.part1?.correct ?? 0;
    p1Total = gradingResult.summary?.part1?.total ?? 0;
    p2Correct = gradingResult.summary?.part2?.correct ?? 0;
    p2Total = gradingResult.summary?.part2?.total ?? 0;
    p3Correct = gradingResult.summary?.part3?.correct ?? 0;
    p3Total = gradingResult.summary?.part3?.total ?? 0;
    totalCorrect = gradingResult.summary?.total_correct ?? 0;
    totalQuestions = gradingResult.summary?.total_questions ?? 0;
    cheatCount = gradingResult.cheat_count ?? 0;
    displayTimeTaken = timeTakenSeconds ?? 0;
    allowViewAnswers = gradingResult.score?.allow_view_answers ?? false;
  } else if (isTeacherView && submission) {
    // Chế độ Giáo viên — từ submission row
    const rawDetails = data || submission.detailed_results;
    details = typeof rawDetails === 'string' ? JSON.parse(rawDetails) : (rawDetails || []);
    totalScore = Number(submission.total_score) || 0;
    p1Score = Number(submission.part1_score) || 0;
    p2Score = Number(submission.part2_score) || 0;
    p3Score = Number(submission.part3_score) || 0;
    cheatCount = Number(submission.cheat_count) || 0;
    displayTimeTaken = Number(submission.time_taken_seconds) || 0;
    displayTitle = `Bài làm của ${submission.student_name || 'Học sinh'}`;

    // Tính lại tổng từ details
    details.forEach(d => {
      if (d.part === 'part1') { p1Total++; if (d.is_correct) p1Correct++; }
      else if (d.part === 'part2') { p2Total++; if (d.is_correct) p2Correct++; }
      else if (d.part === 'part3') { p3Total++; if (d.is_correct) p3Correct++; }
    });
    totalCorrect = p1Correct + p2Correct + p3Correct;
    totalQuestions = p1Total + p2Total + p3Total;
  }

  const isEnglishExam = p2Total === 0 && p3Total === 0;

  // Tính grade color
  const getScoreColor = (s: number) => {
    if (s >= 8) return 'var(--color-success)';
    if (s >= 6.5) return 'var(--color-primary)';
    if (s >= 5) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  const scoreColor = getScoreColor(totalScore);

  // ==========================================
  // STYLES
  // ==========================================
  const styles = {
      container: { backgroundColor: 'var(--color-background)', minHeight: isTeacherView ? 'auto' : '100vh', paddingBottom: 'var(--spacing-16)' } as React.CSSProperties,
      header: { background: 'var(--color-primary)', padding: 'var(--spacing-8) var(--spacing-6)', color: 'var(--color-surface)', borderRadius: isTeacherView ? '0' : '0 0 var(--radius-xl) var(--radius-xl)' } as React.CSSProperties,
      headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)', maxWidth: '1000px', margin: '0 auto var(--spacing-6) auto' } as React.CSSProperties,
      backBtn: { padding: 'var(--spacing-2) var(--spacing-4)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.3)', backgroundColor: 'transparent', color: 'var(--color-surface)', fontWeight: 'var(--font-weight-medium)', cursor: 'pointer', fontSize: 'var(--font-size-sm)', transition: 'all var(--transition-fast)' } as React.CSSProperties,
      scorePanel: { display: 'flex', alignItems: 'center', gap: 'var(--spacing-10)', justifyContent: 'center', flexWrap: 'wrap' as const, maxWidth: '1000px', margin: '0 auto' } as React.CSSProperties,
      bigScore: { textAlign: 'center' as const } as React.CSSProperties,
      bigScoreValue: { fontSize: isTeacherView ? '56px' : '72px', fontWeight: 'var(--font-weight-bold)', lineHeight: 1, textShadow: 'var(--shadow-sm)', color: 'var(--color-surface)' } as React.CSSProperties,
      bigScoreLabel: { fontSize: 'var(--font-size-sm)', color: 'rgba(255,255,255,0.8)', marginTop: 'var(--spacing-1)', fontWeight: 'var(--font-weight-semibold)' } as React.CSSProperties,
      statCards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--spacing-3)', flex: 1, maxWidth: '600px' } as React.CSSProperties,
      statCard: (bg: string) => ({ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-4)', textAlign: 'center' as const, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)' }) as React.CSSProperties,
      statValue: { fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text)', margin: 0 } as React.CSSProperties,
      statLabel: { fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-1)', fontWeight: 'var(--font-weight-semibold)' } as React.CSSProperties,
      breakdownContainer: { margin: isTeacherView ? '0' : '-30px auto 0 auto', maxWidth: '1000px', position: 'relative' as const, zIndex: 10 } as React.CSSProperties,
      breakdownCard: { backgroundColor: 'var(--color-surface)', borderRadius: isTeacherView ? '0' : 'var(--radius-lg)', padding: 'var(--spacing-6)', boxShadow: isTeacherView ? 'none' : 'var(--shadow-md)', marginBottom: 'var(--spacing-6)' } as React.CSSProperties,
      breakdownGrid: { display: 'grid', gridTemplateColumns: isEnglishExam ? '1fr' : '1fr 1fr 1fr', gap: 'var(--spacing-4)' } as React.CSSProperties,
      partBox: (color: string) => ({ border: `1px solid ${color}`, borderRadius: 'var(--radius-md)', padding: 'var(--spacing-4)', textAlign: 'center' as const, backgroundColor: 'var(--color-surface)' }) as React.CSSProperties,
      reviewCard: { maxWidth: '1000px', margin: '0 auto', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-8)', boxShadow: 'var(--shadow-sm)', marginBottom: 'var(--spacing-8)' } as React.CSSProperties,
      sectionTitle: { color: 'var(--color-primary)', fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', borderBottom: '2px solid var(--color-primary)', paddingBottom: 'var(--spacing-2)', marginBottom: 'var(--spacing-6)', marginTop: 'var(--spacing-8)' } as React.CSSProperties,
      questionBox: { marginBottom: 'var(--spacing-6)', clear: 'both' as const, borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-6)' } as React.CSSProperties,
      questionText: { fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--spacing-4)', lineHeight: '1.6', fontSize: 'var(--font-size-base)', color: 'var(--color-text)' } as React.CSSProperties,
      optionsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' } as React.CSSProperties,
    };
  // ==========================================
  const renderPart1Review = () => {
    const part1Details = (Array.isArray(details) ? details : []).filter(d => d.part === 'part1');
    if (part1Details.length === 0) return null;

    // Nếu có examData, render đầy đủ đề; nếu không (teacher view), render dạng compact
    if (examData?.part1 && examData.part1.length > 0) {
      return (
        <div>
          <div style={styles.sectionTitle}>
            {isEnglishExam ? 'CÂU TRẮC NGHIỆM' : 'PHẦN I. CÂU TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN'}
          </div>
          {examData.part1.map((q: any) => {
            const detail = getDetail(details, q.id);
            const studentAns = detail?.student_answer || '';
            const correctAns = detail?.correct_answer || '';
            const isCorrect = detail?.is_correct ?? false;
            const group = findGroupIfFirst(examData, 'part1', q.id);

            return (
              <React.Fragment key={q.id}>
                {group && renderGroupBlock(group)}
                <div style={styles.questionBox}>
                  {q.image_url && <ImageBlock url={q.image_url} />}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-2)' }}>
                    <div style={styles.questionText}>
                      <strong>Câu {q.id}. </strong>{renderContent(q.questionText)}
                    </div>
                    <div style={{
                      padding: '4px 12px', borderRadius: 'var(--radius-xl)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)',
                      backgroundColor: isCorrect ? '#dcfce7' : '#fef2f2',
                      color: isCorrect ? '#15803d' : '#dc2626',
                      whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 'var(--spacing-2)'
                    }}>
                      {isCorrect ? '✓ Đúng' : '✗ Sai'} ({detail?.score_earned ?? 0}đ)
                    </div>
                  </div>
                  <div style={styles.optionsGrid}>
                    {['A', 'B', 'C', 'D'].map((opt) => {
                      const isCorrectOpt = opt === correctAns;
                      const isStudentOpt = opt === studentAns;
                      const isWrong = isStudentOpt && !isCorrectOpt;

                      let borderColor = 'var(--color-border)';
                      let bgColor = 'var(--color-background)';
                      let textColor = 'var(--color-text-secondary)';

                      if (isCorrectOpt) {
                        borderColor = 'var(--color-success)'; bgColor = '#ecfdf5'; textColor = '#065f46';
                      }
                      if (isWrong) {
                        borderColor = 'var(--color-danger)'; bgColor = '#fef2f2'; textColor = '#991b1b';
                      }

                      return (
                        <div key={opt} style={{
                          border: `2px solid ${borderColor}`, backgroundColor: bgColor,
                          borderRadius: 'var(--radius-md)', padding: '10px 14px',
                          display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', position: 'relative'
                        }}>
                          <div style={{
                            width: '20px', height: '20px', borderRadius: '50%',
                            border: isCorrectOpt ? '5px solid var(--color-success)' : isWrong ? '5px solid var(--color-danger)' : '2px solid var(--color-border)',
                            backgroundColor: 'var(--color-surface)', flexShrink: 0
                          }} />
                          <div style={{ color: textColor, fontWeight: (isCorrectOpt || isWrong) ? 'bold' : 'normal' }}>
                            <strong>{opt}.</strong> {renderContent(q.options?.[opt] || '')}
                          </div>
                          {isCorrectOpt && <span style={{ position: 'absolute', right: 'var(--spacing-2)', fontSize: 'var(--font-size-base)' }}>✅</span>}
                          {isWrong && <span style={{ position: 'absolute', right: 'var(--spacing-2)', fontSize: 'var(--font-size-base)' }}>❌</span>}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ clear: 'both' }} />
                  {examId && <AITutorBlock examId={examId} questionId={q.id} part="part1" studentAnswer={studentAns} />}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      );
    }

    // Fallback: Teacher view compact — không có examData đầy đủ
    return (
      <div>
        <div style={styles.sectionTitle}>
          {isEnglishExam ? 'CÂU TRẮC NGHIỆM' : 'PHẦN I. CÂU TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--spacing-2)' }}>
          {part1Details.map(d => (
            <div key={d.question_id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px', borderRadius: 'var(--radius-md)',
              backgroundColor: d.is_correct ? '#ecfdf5' : '#fef2f2',
              border: `1px solid ${d.is_correct ? '#a7f3d0' : '#fecaca'}`
            }}>
              <span style={{ fontWeight: '700', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Câu {d.question_id}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  fontWeight: '800', fontSize: '15px',
                  color: d.is_correct ? '#059669' : '#dc2626',
                  textDecoration: d.is_correct ? 'none' : 'line-through'
                }}>{d.student_answer || '—'}</span>
                {!d.is_correct && (
                  <span style={{
                    fontWeight: '800', fontSize: '15px', color: '#059669',
                    backgroundColor: '#d1fae5', padding: '1px 8px', borderRadius: 'var(--radius-sm)'
                  }}>{d.correct_answer}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ==========================================
  // RENDER PART 2 — Đúng / Sai
  // ==========================================
  const renderPart2Review = () => {
    const part2Details = (Array.isArray(details) ? details : []).filter(d => d.part === 'part2');
    if (part2Details.length === 0) return null;

    return (
      <div>
        <div style={styles.sectionTitle}>PHẦN II. CÂU TRẮC NGHIỆM ĐÚNG / SAI</div>
        {part2Details.map(detail => {
          const qId = detail.question_id;
          const stmtResults = detail.statement_results || [];
          const correctCount = detail.correct_statements_count ?? (Array.isArray(stmtResults) ? stmtResults : []).filter(s => s.is_correct).length;
          const qScore = detail.score_earned ?? 0;
          const q = examData?.part2?.find((x: any) => x.id === qId);
          const group = q ? findGroupIfFirst(examData, 'part2', qId) : null;

          let baremLabel = '';
          if (correctCount === 0) baremLabel = '0 ý đúng → 0đ';
          else if (correctCount === 1) baremLabel = '1 ý đúng → 0.1đ';
          else if (correctCount === 2) baremLabel = '2 ý đúng → 0.25đ';
          else if (correctCount === 3) baremLabel = '3 ý đúng → 0.5đ';
          else if (correctCount === 4) baremLabel = '4 ý đúng → 1.0đ';

          return (
            <React.Fragment key={qId}>
              {group && renderGroupBlock(group)}
              <div style={styles.questionBox}>
                {q?.image_url && <ImageBlock url={q.image_url} />}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-2)' }}>
                  <div style={styles.questionText}>
                    <strong>Câu {qId}. </strong>{q ? renderContent(q.questionText) : ''}
                  </div>
                  <div style={{
                    padding: '6px 14px', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)',
                    backgroundColor: correctCount === 4 ? '#dcfce7' : correctCount >= 2 ? '#fefce8' : '#fef2f2',
                    color: correctCount === 4 ? '#15803d' : correctCount >= 2 ? '#a16207' : '#dc2626',
                    whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 'var(--spacing-2)', textAlign: 'center' as const
                  }}>
                    <div>{baremLabel}</div>
                    <div style={{ fontSize: 'var(--font-size-base)', marginTop: '2px' }}>+{qScore}đ</div>
                  </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 'var(--spacing-2)' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                      <th style={{ padding: 'var(--spacing-2)', textAlign: 'left', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Mệnh đề</th>
                      <th style={{ padding: 'var(--spacing-2)', textAlign: 'center', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', width: '100px' }}>Trò chọn</th>
                      <th style={{ padding: 'var(--spacing-2)', textAlign: 'center', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', width: '100px' }}>Đáp án chuẩn</th>
                      <th style={{ padding: 'var(--spacing-2)', textAlign: 'center', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', width: '60px' }}>Kết quả</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['a', 'b', 'c', 'd'].map((stmt) => {
                      const stmtResult = stmtResults.find(s => s.statement === stmt);
                      const studentVal = stmtResult?.student || '—';
                      const correctVal = stmtResult?.correct || '—';
                      const isStmtCorrect = stmtResult?.is_correct ?? false;

                      return (
                        <tr key={stmt} style={{
                          borderBottom: '1px dashed var(--color-border)',
                          backgroundColor: isStmtCorrect ? '#f0fdf4' : (studentVal !== '—' ? '#fef2f2' : 'transparent')
                        }}>
                          <td style={{ padding: '10px 8px' }}>
                            <strong>{stmt})</strong> {q ? renderContent(q.statements?.[stmt] || '') : `Ý ${stmt}`}
                          </td>
                          <td style={{
                            padding: '10px 8px', textAlign: 'center', fontWeight: 'var(--font-weight-bold)',
                            color: isStmtCorrect ? 'var(--color-success)' : (studentVal !== '—' ? 'var(--color-danger)' : 'var(--color-text-secondary)')
                          }}>
                            {studentVal === 'Đ' ? 'ĐÚNG' : studentVal === 'S' ? 'SAI' : studentVal}
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-success)' }}>
                            {correctVal === 'Đ' ? 'ĐÚNG' : correctVal === 'S' ? 'SAI' : correctVal}
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: 'var(--font-size-lg)' }}>
                            {isStmtCorrect ? '✅' : '❌'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div style={{ clear: 'both' }} />
                {examId && <AITutorBlock examId={examId} questionId={qId} part="part2" studentAnswer={stmtResults} />}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // ==========================================
  // RENDER PART 3 — Trả lời ngắn
  // ==========================================
  const renderPart3Review = () => {
    const part3Details = (Array.isArray(details) ? details : []).filter(d => d.part === 'part3');
    if (part3Details.length === 0) return null;

    return (
      <div>
        <div style={styles.sectionTitle}>PHẦN III. CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN</div>
        {part3Details.map(detail => {
          const qId = detail.question_id;
          const studentAns = detail.student_answer ?? '';
          const correctAns = detail.correct_answer ?? '';
          const isCorrect = detail.is_correct ?? false;
          const scoreEarned = detail.score_earned ?? 0;
          const maxScore = detail.max_score ?? 0;
          const q = examData?.part3?.find((x: any) => x.id === qId);
          const group = q ? findGroupIfFirst(examData, 'part3', qId) : null;

          return (
            <React.Fragment key={qId}>
              {group && renderGroupBlock(group)}
              <div style={styles.questionBox}>
                {q?.image_url && <ImageBlock url={q.image_url} />}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-2)' }}>
                  <div style={styles.questionText}>
                    <strong>Câu {qId}. </strong>{q ? renderContent(q.questionText) : ''}
                  </div>
                  <div style={{
                    padding: '4px 12px', borderRadius: 'var(--radius-xl)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)',
                    backgroundColor: isCorrect ? '#dcfce7' : '#fef2f2',
                    color: isCorrect ? '#15803d' : '#dc2626',
                    whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 'var(--spacing-2)'
                  }}>
                    {isCorrect ? '✓ Đúng' : '✗ Sai'} ({scoreEarned}/{maxScore}đ)
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-5)', marginTop: 'var(--spacing-3)', flexWrap: 'wrap' }}>
                  {/* Câu trả lời học sinh */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)',
                    padding: '10px 16px', borderRadius: 'var(--radius-md)',
                    backgroundColor: isCorrect ? '#ecfdf5' : '#fef2f2',
                    border: `2px solid ${isCorrect ? 'var(--color-success)' : 'var(--color-danger)'}`
                  }}>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Trò trả lời:</span>
                    <span style={{
                      fontWeight: 'var(--font-weight-bold)', fontSize: 'var(--font-size-base)',
                      color: isCorrect ? '#065f46' : '#991b1b',
                      textDecoration: isCorrect ? 'none' : 'line-through'
                    }}>
                      {studentAns || '(Bỏ trống)'}
                    </span>
                  </div>

                  {/* Đáp án đúng (hiển thị khi sai) */}
                  {!isCorrect && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)',
                      padding: '10px 16px', borderRadius: 'var(--radius-md)',
                      backgroundColor: '#ecfdf5', border: '2px solid var(--color-success)'
                    }}>
                      <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Đáp án đúng:</span>
                      <span style={{ fontWeight: 'var(--font-weight-bold)', fontSize: 'var(--font-size-base)', color: '#065f46' }}>
                        {correctAns}
                      </span>
                    </div>
                  )}
                </div>
                <div style={{ clear: 'both' }} />
                {examId && <AITutorBlock examId={examId} questionId={qId} part="part3" studentAnswer={studentAns} />}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // ==========================================
  // MAIN RENDER
  // ==========================================
  return (
    <div style={styles.container}>
      {/* ======== HEADER + SCORE ======== */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          {onBackToList ? (
            <Button style={styles.backBtn} onClick={onBackToList}>← Về danh sách đề</Button>
          ) : <div />}
          <h2 style={{ margin: 0, fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: '#bfdbfe' }}>{displayTitle}</h2>
          <div style={{ width: '120px' }} />
        </div>

        <div style={styles.scorePanel}>
          {/* Điểm tổng lớn */}
          <div style={styles.bigScore}>
            <div style={{ ...styles.bigScoreValue, color: scoreColor, WebkitTextStroke: '1px rgba(255,255,255,0.3)' }}>
              {totalScore}
            </div>
            <div style={styles.bigScoreLabel}>TRÊN THANG ĐIỂM 10</div>
          </div>

          {/* Stat cards */}
          <div style={styles.statCards}>
            <div style={styles.statCard('rgba(16,185,129,0.9)')}>
              <div style={styles.statValue}>{totalCorrect}/{totalQuestions}</div>
              <div style={styles.statLabel}>CÂU ĐÚNG</div>
            </div>
            <div style={styles.statCard('rgba(59,130,246,0.9)')}>
              <div style={{ ...styles.statValue, fontSize: 'var(--font-size-sm)' }}>{formatDuration(displayTimeTaken)}</div>
              <div style={styles.statLabel}>THỜI GIAN</div>
            </div>
            <div style={styles.statCard(cheatCount > 0 ? 'rgba(239,68,68,0.95)' : 'rgba(100,116,139,0.7)')}>
              <div style={styles.statValue}>{cheatCount}</div>
              <div style={styles.statLabel}>{cheatCount > 0 ? '⚠️ VI PHẠM' : 'KHÔNG VI PHẠM'}</div>
            </div>
            {!isEnglishExam && (
              <div style={styles.statCard('rgba(168,85,247,0.9)')}>
                <div style={{ ...styles.statValue, fontSize: 'var(--font-size-sm)' }}>
                  {p1Score} + {p2Score} + {p3Score}
                </div>
                <div style={styles.statLabel}>P1 + P2 + P3</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ======== BREAKDOWN PER PART ======== */}
      <div style={styles.breakdownContainer}>
        <div style={styles.breakdownCard}>
          <h3 style={{ margin: '0 0 15px 0', color: 'var(--color-text)', fontSize: 'var(--font-size-base)' }}>📊 Chi tiết theo phần</h3>
          <div style={styles.breakdownGrid}>
            {/* Part 1 */}
            <div style={styles.partBox('var(--color-primary)')}>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-2)' }}>
                {isEnglishExam ? 'Trắc nghiệm' : 'Phần I — Trắc nghiệm'}
              </div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--color-primary-dark)' }}>{p1Score}đ</div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-1)' }}>
                {p1Correct}/{p1Total} câu đúng
              </div>
              <div style={{ marginTop: 'var(--spacing-2)', height: '6px', borderRadius: '3px', backgroundColor: 'var(--color-border)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '3px', backgroundColor: 'var(--color-primary)',
                  width: p1Total > 0 ? `${(p1Correct / p1Total) * 100}%` : '0%', transition: 'width 0.5s ease'
                }} />
              </div>
            </div>

            {/* Part 2 */}
            {!isEnglishExam && (
              <div style={styles.partBox('var(--color-warning)')}>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-2)' }}>Phần II — Đúng / Sai</div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: '#d97706' }}>{p2Score}đ</div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-1)' }}>{p2Correct}/{p2Total} câu đúng hoàn toàn</div>
                <div style={{ marginTop: 'var(--spacing-2)', height: '6px', borderRadius: '3px', backgroundColor: 'var(--color-border)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '3px', backgroundColor: 'var(--color-warning)',
                    width: p2Total > 0 ? `${(p2Correct / p2Total) * 100}%` : '0%', transition: 'width 0.5s ease'
                  }} />
                </div>
              </div>
            )}

            {/* Part 3 */}
            {!isEnglishExam && (
              <div style={styles.partBox('#8b5cf6')}>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-2)' }}>Phần III — Trả lời ngắn</div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: '#7c3aed' }}>{p3Score}đ</div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-1)' }}>{p3Correct}/{p3Total} câu đúng</div>
                <div style={{ marginTop: 'var(--spacing-2)', height: '6px', borderRadius: '3px', backgroundColor: 'var(--color-border)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '3px', backgroundColor: '#8b5cf6',
                    width: p3Total > 0 ? `${(p3Correct / p3Total) * 100}%` : '0%', transition: 'width 0.5s ease'
                  }} />
                </div>
              </div>
            )}
          </div>

          {/* Nút xem đáp án chi tiết */}
          {allowViewAnswers && onViewAnswers && (
            <div style={{ textAlign: 'center', marginTop: 'var(--spacing-5)' }}>
              <Button onClick={onViewAnswers} style={{
                padding: '10px 25px', backgroundColor: 'var(--color-warning)', color: 'var(--color-surface)',
                border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 'var(--font-weight-bold)', cursor: 'pointer', fontSize: 'var(--font-size-sm)'
              }}>
                👁️ Xem đáp án chuẩn chi tiết
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ======== REVIEW CHI TIẾT BÀI LÀM ======== */}
      {(isTeacherView || allowViewAnswers) && details.length > 0 && (
        <div style={{ padding: isTeacherView ? '0' : '0 30px 60px 30px' }}>
          <div style={styles.reviewCard}>
            <h2 style={{ margin: '0 0 10px 0', color: 'var(--color-text)', fontSize: 'var(--font-size-xl)', textAlign: 'center' }}>
              📝 CHI TIẾT BÀI LÀM
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', margin: '0 0 20px 0' }}>
              Xem lại từng câu hỏi với đáp án đã chọn và đáp án đúng
            </p>

            {renderPart1Review()}
            {renderPart2Review()}
            {renderPart3Review()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamResult;
