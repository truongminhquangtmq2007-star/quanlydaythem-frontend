import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';

// ==========================================
// CẤU TRÚC DỮ LIỆU
// ==========================================
export interface SharedContext {
  id: number;
  content: string;
  image_url?: string;
  questionIds: number[];
  part?: string;
}

// ==========================================
// HÀM TIỆN ÍCH: Render LaTeX an toàn
// ==========================================
const renderContent = (text: string) => {
  if (!text) return '';
  const parts = text.split('$');
  return parts.map((part, index) => {
    if (index % 2 !== 0) {
      let cleanMath = part.trim().replace(/\\\\(frac|int|sum|lim|mathrm|text|begin|end|hline)/g, '\\$1');
      return (
        <InlineMath
          key={index}
          math={cleanMath}
          renderError={() => (
            <span style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)' }}>
              ⚠️ Lỗi công thức: {cleanMath}
            </span>
          )}
        />
      );
    }
    return <span key={index}>{part}</span>;
  });
};

// ==========================================
// COMPONENT HIỂN THỊ ẢNH (Chỉ đọc)
// ==========================================
const ImageBlock = ({ url }: { url: string }) => (
  <div style={{ float: 'right', marginLeft: 'var(--spacing-4)', marginBottom: 'var(--spacing-2)', maxWidth: '42%' }}>
    <img src={url} alt="Hình minh họa" style={{ width: '100%', maxHeight: '260px', objectFit: 'contain', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'block' }} />
  </div>
);

const ViewAnswers = () => {
  const { docId } = useParams();
  const navigate = useNavigate();
  const [examData, setExamData] = useState<any>(null);
  const [examKey, setExamKey] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchExamDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axiosClient.get(`/api/exams/key/${docId}`);
        
        // Backend trả về key gồm exam_content và các bảng đáp án part1_key, part2_key, part3_key
        if (res.data) {
          setExamData(res.data.exam_content || {});
          setExamKey(res.data);
        }
      } catch (e) { 
        alert("Không thể tải chi tiết đáp án đề thi!"); 
      } finally {
        setIsLoading(false);
      }
    };
    fetchExamDetails();
  }, [docId]);

  // Tìm nhóm ngữ cảnh (câu hỏi chùm)
  const findGroupIfFirst = (part: string, qId: number): SharedContext | null => {
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

  if (isLoading) return <div style={{padding:'var(--spacing-10)'}}><EmptyState title="Đang tải chi tiết đáp án..." /></div>;
  if (!examData || !examKey) return <div style={{padding:'var(--spacing-10)'}}><EmptyState title="Không tìm thấy dữ liệu đề thi." /></div>;

  const styles = {
    container: { padding: 'var(--spacing-10) var(--spacing-5)', backgroundColor: 'var(--color-background)', minHeight: '100vh', fontFamily: 'Inter, Arial, sans-serif' },
    sectionTitle: { color: '#1e3a8a', fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', textTransform: 'uppercase' as const, borderBottom: '2px solid #1e3a8a', paddingBottom: 'var(--spacing-2)', marginBottom: 'var(--spacing-8)' },
    questionBox: { marginBottom: 'var(--spacing-10)', clear: 'both' as const, borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-6)' },
    questionText: { fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-4)', lineHeight: '1.6', fontSize: 'var(--font-size-base)', color: 'var(--color-text)' },
    optionsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' },
    optionItem: (isCorrect: boolean) => ({ border: isCorrect ? '2px solid var(--color-success)' : '1px solid var(--color-border)', backgroundColor: isCorrect ? '#ecfdf5' : 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: '12px 15px', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }),
    answerBadge: { marginTop: 'var(--spacing-4)', padding: '10px 15px', backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-border)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', fontSize: '15px', fontWeight: 'var(--font-weight-bold)' }
  };

  return (
    <div style={styles.container}>
      <Card style={{ maxWidth: '900px', margin: '0 auto', padding: 'var(--spacing-10)' }}>
        <Button onClick={() => navigate(-1)} variant="outline" style={{ marginBottom: 'var(--spacing-6)' }}>← Quay lại</Button>
        <h2 style={{ color: '#1e3a8a', marginBottom: 'var(--spacing-8)', textAlign: 'center', textTransform: 'uppercase' }}>📖 Xem Đáp Án & Lời Giải Chi Tiết</h2>

        {/* ==================== PHẦN 1 ==================== */}
        {examData.part1 && examData.part1.length > 0 && (
          <div style={{ marginBottom: '50px' }}>
            <div style={styles.sectionTitle}>PHẦN I. TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN</div>
            {examData.part1.map((q: any) => {
              const qId = q.id;
              const correctOpt = examKey.part1_key?.[qId];
              const group = findGroupIfFirst('part1', qId);

              return (
                <React.Fragment key={qId}>
                  {group && renderGroupBlock(group)}
                  <div style={styles.questionBox}>
                    {q.image_url && <ImageBlock url={q.image_url} />}
                    <div style={styles.questionText}>
                      <strong>Câu {qId}. </strong>{renderContent(q.questionText)}
                    </div>
                    <div style={styles.optionsGrid}>
                      {['A', 'B', 'C', 'D'].map((opt) => {
                        const isCorrect = (opt === correctOpt);
                        return (
                          <div key={opt} style={styles.optionItem(isCorrect)}>
                            <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: isCorrect ? '5px solid var(--color-success)' : '1px solid var(--color-text-secondary)', backgroundColor: 'var(--color-surface)' }}></div>
                            <div style={{ color: isCorrect ? '#065f46' : '#334155', fontWeight: isCorrect ? 'bold' : 'normal' }}>
                              <strong>{opt}.</strong> {renderContent(q.options[opt])}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={styles.answerBadge}>
                      <span style={{ color: 'var(--color-success)' }}>✅ Đáp án chuẩn:</span>
                      <span style={{ color: '#059669', fontSize: 'var(--font-size-lg)' }}>{correctOpt || 'Chưa cập nhật'}</span>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* ==================== PHẦN 2 ==================== */}
        {examData.part2 && examData.part2.length > 0 && (
          <div style={{ marginBottom: '50px' }}>
            <div style={styles.sectionTitle}>PHẦN II. TRẮC NGHIỆM ĐÚNG / SAI</div>
            {examData.part2.map((q: any) => {
              const qId = q.id;
              const correctObj = examKey.part2_key?.[qId] || {};
              const group = findGroupIfFirst('part2', qId);

              return (
                <React.Fragment key={qId}>
                  {group && renderGroupBlock(group)}
                  <div style={styles.questionBox}>
                    {q.image_url && <ImageBlock url={q.image_url} />}
                    <div style={styles.questionText}>
                      <strong>Câu {qId}. </strong>{renderContent(q.questionText)}
                    </div>
                    <div className="overflow-x-auto">
                      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 'var(--spacing-2)' }}>
                        <tbody>
                          {['a', 'b', 'c', 'd'].map((stmt) => {
                            const ans = correctObj[stmt];
                            return (
                              <tr key={stmt} style={{ borderBottom: '1px dashed var(--color-border)' }}>
                                <td style={{ padding: '10px 0' }}><strong>{stmt})</strong> {renderContent(q.statements[stmt])}</td>
                                <td style={{ width: '100px', textAlign: 'right', fontWeight: 'var(--font-weight-bold)', color: ans === 'Đ' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                  {ans === 'Đ' ? 'ĐÚNG' : ans === 'S' ? 'SAI' : '-'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* ==================== PHẦN 3 ==================== */}
        {examData.part3 && examData.part3.length > 0 && (
          <div style={{ marginBottom: 'var(--spacing-5)' }}>
            <div style={styles.sectionTitle}>PHẦN III. TRẢ LỜI NGẮN</div>
            {examData.part3.map((q: any) => {
              const qId = q.id;
              const correctAns = examKey.part3_key?.[qId];
              const group = findGroupIfFirst('part3', qId);

              return (
                <React.Fragment key={qId}>
                  {group && renderGroupBlock(group)}
                  <div style={styles.questionBox}>
                    {q.image_url && <ImageBlock url={q.image_url} />}
                    <div style={styles.questionText}>
                      <strong>Câu {qId}. </strong>{renderContent(q.questionText)}
                    </div>
                    <div style={styles.answerBadge}>
                      <span style={{ color: 'var(--color-success)' }}>✅ Đáp án đúng:</span>
                      <span style={{ color: '#059669', fontSize: 'var(--font-size-lg)', backgroundColor: '#d1fae5', padding: '2px 10px', borderRadius: 'var(--radius-sm)' }}>
                        {correctAns || 'Chưa cập nhật'}
                      </span>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}

      </Card>
    </div>
  );
};

export default ViewAnswers;
