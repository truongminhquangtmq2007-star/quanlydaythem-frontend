import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

// ==========================================
// CẤU TRÚC DỮ LIỆU
// ==========================================
export interface SharedContext {
  id: number;
  content: string;
  image_url?: string;
  questionIds: number[];
  part: 'part1' | 'part2' | 'part3';
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
            <span style={{ color: '#ef4444', fontSize: '13px', fontWeight: 'bold' }}>
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
  <div style={{ float: 'right', marginLeft: '15px', marginBottom: '10px', maxWidth: '42%' }}>
    <img src={url} alt="Hình minh họa" style={{ width: '100%', maxHeight: '260px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #cbd5e1', display: 'block' }} />
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
        const res = await axios.get(`https://quanlydaythem-api.onrender.com/api/exams/key/${docId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
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
  const findGroupIfFirst = (part: 'part1' | 'part2' | 'part3', qId: number): SharedContext | null => {
    const groups: SharedContext[] = examData?.sharedContexts || [];
    const group = groups.find((g) => g.part === part && g.questionIds.includes(qId));
    if (!group) return null;
    const minId = Math.min(...group.questionIds);
    return qId === minId ? group : null;
  };

  const renderGroupBlock = (group: SharedContext) => (
    <div style={{ backgroundColor: '#fffbeb', border: '1px dashed #f59e0b', padding: '15px', borderRadius: '8px', marginBottom: '20px', color: '#78350f', lineHeight: '1.6', fontSize: '15px', clear: 'both' }}>
      {group.image_url && <ImageBlock url={group.image_url} />}
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
        📌 Sử dụng thông tin sau để trả lời các câu {group.questionIds.join(', ')}:
      </div>
      <div>{renderContent(group.content)}</div>
      <div style={{ clear: 'both' }} />
    </div>
  );

  if (isLoading) return <div style={{padding:'60px', textAlign:'center', fontSize:'18px', fontWeight:'bold'}}>Đang tải chi tiết đáp án...</div>;
  if (!examData || !examKey) return <div style={{padding:'60px', textAlign:'center', color:'#ef4444'}}>Không tìm thấy dữ liệu đề thi.</div>;

  const styles = {
    container: { padding: '40px 20px', backgroundColor: '#f1f5f9', minHeight: '100vh', fontFamily: 'Inter, Arial, sans-serif' },
    card: { maxWidth: '900px', margin: '0 auto', backgroundColor: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' },
    sectionTitle: { color: '#1e3a8a', fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase' as const, borderBottom: '2px solid #1e3a8a', paddingBottom: '10px', marginBottom: '30px' },
    questionBox: { marginBottom: '40px', clear: 'both' as const, borderBottom: '1px solid #e2e8f0', paddingBottom: '25px' },
    questionText: { fontWeight: 'bold', marginBottom: '15px', lineHeight: '1.6', fontSize: '16px', color: '#1e293b' },
    optionsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
    optionItem: (isCorrect: boolean) => ({ border: isCorrect ? '2px solid #10b981' : '1px solid #cbd5e1', backgroundColor: isCorrect ? '#ecfdf5' : 'white', borderRadius: '8px', padding: '12px 15px', display: 'flex', alignItems: 'center', gap: '10px' }),
    answerBadge: { marginTop: '15px', padding: '10px 15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', fontWeight: 'bold' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <button onClick={() => navigate(-1)} style={{ marginBottom: '25px', padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>← Quay lại</button>
        <h2 style={{ color: '#1e3a8a', marginBottom: '30px', textAlign: 'center', textTransform: 'uppercase' }}>📖 Xem Đáp Án & Lời Giải Chi Tiết</h2>

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
                            <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: isCorrect ? '5px solid #10b981' : '1px solid #94a3b8', backgroundColor: 'white' }}></div>
                            <div style={{ color: isCorrect ? '#065f46' : '#334155', fontWeight: isCorrect ? 'bold' : 'normal' }}>
                              <strong>{opt}.</strong> {renderContent(q.options[opt])}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={styles.answerBadge}>
                      <span style={{ color: '#10b981' }}>✅ Đáp án chuẩn:</span>
                      <span style={{ color: '#059669', fontSize: '18px' }}>{correctOpt || 'Chưa cập nhật'}</span>
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
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                      <tbody>
                        {['a', 'b', 'c', 'd'].map((stmt) => {
                          const ans = correctObj[stmt];
                          return (
                            <tr key={stmt} style={{ borderBottom: '1px dashed #e2e8f0' }}>
                              <td style={{ padding: '10px 0' }}><strong>{stmt})</strong> {renderContent(q.statements[stmt])}</td>
                              <td style={{ width: '100px', textAlign: 'right', fontWeight: 'bold', color: ans === 'Đ' ? '#10b981' : '#ef4444' }}>
                                {ans === 'Đ' ? 'ĐÚNG' : ans === 'S' ? 'SAI' : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* ==================== PHẦN 3 ==================== */}
        {examData.part3 && examData.part3.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
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
                      <span style={{ color: '#10b981' }}>✅ Đáp án đúng:</span>
                      <span style={{ color: '#059669', fontSize: '18px', backgroundColor: '#d1fae5', padding: '2px 10px', borderRadius: '4px' }}>
                        {correctAns || 'Chưa cập nhật'}
                      </span>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default ViewAnswers;