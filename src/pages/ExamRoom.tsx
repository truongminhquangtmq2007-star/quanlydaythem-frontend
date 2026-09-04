import { useParams } from 'react-router-dom';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import ExamResult from './ExamResult';
import { ExamList } from '../components/exam/ExamList';
import { ExamConfirm } from '../components/exam/ExamConfirm';
import { ExamHeader } from '../components/exam/ExamHeader';
import { QuestionNavigator } from '../components/exam/QuestionNavigator';
import { SubmitConfirmModal } from '../components/exam/SubmitConfirmModal';
import { Button } from '../components/ui/Button';
import type { ExamGradingResult } from '../types/exam';

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


const renderContent = (text: string) => {
  if (!text) return '';

  let safeText = String(text);

  // Chuẩn hóa nhiều dấu \ liên tiếp thành 1 dấu \
  safeText = safeText.replace(/\\{2,}/g, '\\');

  // Sửa \_ thành _
  safeText = safeText.replace(/\\_/g, '_');

  const parts = safeText.split('$');

  return parts.map((part, index) => {
    // Text bình thường
    if (index % 2 === 0) {
      return <span key={index}>{part}</span>;
    }

    let math = part.trim();

    if (!math) return null;

    // ==================================================
    // QUAN TRỌNG:
    // XÓA CÁC KÝ TỰ ẨN / CONTROL CHARACTER
    // ==================================================

    // Xóa ký tự Unicode vô hình
    math = math.replace(
      /[\u200B-\u200D\uFEFF\u00AD\u2060]/g,
      ''
    );

    // Xóa các ký tự điều khiển ASCII
    // nhưng giữ khoảng trắng thông thường
    math = math.replace(
      /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g,
      ''
    );

    // Loại bỏ CR/LF/TAB nằm bên trong công thức
    math = math.replace(/[\r\n\t]/g, '');

    // Chuẩn hóa lại nhiều dấu \ nếu còn
    math = math.replace(/\\{2,}/g, '\\');

    // \_ phải là _
    math = math.replace(/\\_/g, '_');

    // DEBUG: xem chính xác từng ký tự KaTeX nhận được
    console.log(
      'KATEX RAW:',
      math,
      [...math].map(char => ({
        char,
        code: char.charCodeAt(0),
        hex: '0x' + char.charCodeAt(0).toString(16)
      }))
    );

    return (
      <InlineMath
        key={index}
        math={math}
        renderError={(error) => (
          <span
            style={{
              color: 'var(--color-danger)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-bold)'
            }}
          >
            ⚠️ Lỗi công thức: {math}
            <br />
            <span
              style={{
                fontSize: '11px',
                color: '#b91c1c'
              }}
            >
              {error.message}
            </span>
          </span>
        )}
      />
    );
  });
};

// ==========================================
// COMPONENT HIỂN THỊ ẢNH CHO HỌC SINH (Chỉ đọc)
// ==========================================
const ImageBlock = ({ url }: { url: string }) => (
  <div style={{ float: 'right', marginLeft: 'var(--spacing-4)', marginBottom: 'var(--spacing-2)', maxWidth: '42%' }}>
    <img src={url} alt="Hình minh họa" style={{ width: '100%', maxHeight: '260px', objectFit: 'contain', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'block' }} />
  </div>
);

const ExamRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [viewState, setViewState] = useState<'LIST' | 'CONFIRM' | 'EXAM' | 'RESULT'>('LIST');
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [examScore, setExamScore] = useState<any>(null);
  const [gradingResult, setGradingResult] = useState<ExamGradingResult | null>(null);
  const elapsedTimeRef = useRef<number>(0);
  
  // Anti-cheat & Modals
  const [cheatWarnings, setCheatWarnings] = useState(0);
  const [showCheatModal, setShowCheatModal] = useState(false);
  const [cheatReason, setCheatReason] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Lưu đáp án
  const [part1Answers, setPart1Answers] = useState<{[key: number]: string}>({});
  const [part2Answers, setPart2Answers] = useState<{[key: number]: {[sub: string]: 'Đ' | 'S'}}>({});
  const [part3Answers, setPart3Answers] = useState<{[key: number]: string}>({}); 
  
  const [myScores, setMyScores] = useState<{[key: number]: any[]}>({});
  const [examData, setExamData] = useState<any>(null); 
  const [fontSize, setFontSize] = useState<number>(16);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>('');

  const fetchExams = useCallback(async () => {
    try {
      const resDocs = await axiosClient.get(`/api/student/exams`);
      const resScores = await axiosClient.get(`/api/exams/my-submissions`);
      
      const historyMap: {[key: number]: any[]} = {};
      (resScores.data || []).forEach((s: any) => { 
          if (!historyMap[s.document_id]) historyMap[s.document_id] = [];
          historyMap[s.document_id].push(s);
      });
      
      setExams(Array.isArray(resDocs.data) ? resDocs.data : (resDocs.data.documents || []));
      setMyScores(historyMap);
    } catch (error) { console.error("Lỗi lấy đề thi:", error); }
  }, []);

  useEffect(() => { if (viewState === 'LIST') fetchExams(); }, [viewState, fetchExams]);

  const handleViewAttempt = async (attempt: any, doc: any) => {
    try {
      const res = await axiosClient.get(`/api/exams/submissions/${attempt.id}`);
      if (res.data) {
        setSelectedExam(doc);
        setGradingResult({
          score: {
            totalScore: res.data.total_score,
            p1Score: res.data.part1_score,
            p2Score: res.data.part2_score,
            p3Score: res.data.part3_score,
            allow_view_answers: res.data.allow_view_answers
          },
          summary: {
            total_questions: res.data.details?.length || 0,
            total_correct: res.data.details?.filter((d: any) => d.is_correct).length || 0,
            part1: { score: res.data.part1_score, correct: res.data.details?.filter((d: any) => d.part === 'part1' && d.is_correct).length || 0, total: res.data.details?.filter((d: any) => d.part === 'part1').length || 0 },
            part2: { score: res.data.part2_score, correct: res.data.details?.filter((d: any) => d.part === 'part2' && d.is_correct).length || 0, total: res.data.details?.filter((d: any) => d.part === 'part2').length || 0 },
            part3: { score: res.data.part3_score, correct: res.data.details?.filter((d: any) => d.part === 'part3' && d.is_correct).length || 0, total: res.data.details?.filter((d: any) => d.part === 'part3').length || 0 },
          },
          details: res.data.details,
          cheat_count: res.data.cheat_count
        } as any);
        setExamData(res.data.exam_content);
        setViewState('RESULT');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể tải chi tiết lần thi này.');
    }
  };

  const startExam = async () => {
    setPart1Answers({});
    setPart2Answers({});
    setPart3Answers({});
    setCheatWarnings(0);
    setGradingResult(null);
    setExamScore(null);
    elapsedTimeRef.current = 0;
    setSaveStatus('');
    try {
      const res = await axiosClient.get(`/api/exams/${selectedExam.id}/draft`);
      if (res.data && res.data.draft) {
        const draft = res.data.draft;
        const answers = typeof draft.student_answers === 'string' ? JSON.parse(draft.student_answers) : draft.student_answers;
        if (answers) {
          if (Array.isArray(answers)) {
            const p1: any = {};
            const p2: any = {};
            const p3: any = {};
            answers.forEach((item: any) => {
              const qId = item.question_id || item.id;
              if (item.part === 'part2' || item.part_number === 2) p2[qId] = item.student_answer;
              else if (item.part === 'part3' || item.part_number === 3) p3[qId] = item.student_answer;
              else if (item.part === 'part1' || item.part_number === 1) p1[qId] = item.student_answer;
            });
            setPart1Answers(p1);
            setPart2Answers(p2);
            setPart3Answers(p3);
          } else if (typeof answers === 'object') {
            if (answers.part1) setPart1Answers(answers.part1);
            if (answers.part2) setPart2Answers(answers.part2);
            if (answers.part3) setPart3Answers(answers.part3);
          }
        }
        if (draft.time_taken_seconds) {
          elapsedTimeRef.current = draft.time_taken_seconds;
        }
        if (draft.last_saved_at) {
          const dt = new Date(draft.last_saved_at);
          setSaveStatus(`Đã khôi phục nháp lúc ${dt.getHours()}:${dt.getMinutes() < 10 ? '0' : ''}${dt.getMinutes()}`);
        }
      }
    } catch (error) {
      console.error('Lỗi lấy nháp', error);
    }
    setViewState('EXAM');
  };

  useEffect(() => {
    if (viewState !== 'EXAM' || isSubmitting || !selectedExam) return;

    setSaveStatus('Đang lưu...');
    const timer = setTimeout(async () => {
      try {
        await axiosClient.post(`/api/exams/${selectedExam.id}/draft`, {
          answers: { part1: part1Answers, part2: part2Answers, part3: part3Answers },
          time_taken_seconds: elapsedTimeRef.current
        });
        const now = new Date();
        setSaveStatus(`Đã lưu lúc ${now.getHours()}:${now.getMinutes() < 10 ? '0' : ''}${now.getMinutes()}`);
      } catch (error) {
        setSaveStatus('Lỗi kết nối. Đang thử lưu lại...');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [part1Answers, part2Answers, part3Answers]);

  useEffect(() => {
    if (viewState === 'EXAM' && selectedExam) {
      const duration = selectedExam.duration_minutes ? selectedExam.duration_minutes * 60 : 50 * 60;
      setTimeLeft(duration);

      const fetchExamContent = async () => {
        try {
          const res = await axiosClient.get(`/api/exams/key/${selectedExam.id}?contentOnly=true`);

          if (res.data && res.data.exam_content) {
            setExamData(res.data.exam_content);
          } else {
            alert('Giáo viên chưa cập nhật nội dung chi tiết cho đề thi này!');
            setExamData({ part1: [], part2: [], part3: [], sharedContexts: [] });
          }
        } catch (error) {
          console.error('Lỗi khi tải nội dung đề thi:', error);
          alert('Không thể tải nội dung đề thi. Vui lòng thử lại!');
        }
      };

      fetchExamContent();
    }
  }, [viewState, selectedExam]);

  const triggerWarning = useCallback((reason: string) => {
    if (showCheatModal || viewState !== 'EXAM') return; 
    setCheatWarnings(prev => prev + 1);
    setCheatReason(reason);
    setShowCheatModal(true);
  }, [showCheatModal, viewState]);

  // ANTI-CHEAT & TIMER HOOK
  useEffect(() => {
    if (viewState !== 'EXAM') return;
    const requestFS = async () => { try { if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); } catch (e) {
      console.error(e);
    } };
    requestFS();

    const preventAction = (e: any) => e.preventDefault();
    document.addEventListener('contextmenu', preventAction);
    document.addEventListener('copy', preventAction);

    const handleVisibility = () => { if (document.hidden) triggerWarning('Bạn vừa chuyển Tab hoặc ẩn trình duyệt!'); };
    document.addEventListener('visibilitychange', handleVisibility);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') { navigator.clipboard.writeText(''); triggerWarning('Phát hiện hành vi Chụp màn hình!'); }
      if (e.key === 'F12' || (e.ctrlKey && e.key === 'r') || e.key === 'F5') e.preventDefault();
    };
    window.addEventListener('keydown', handleKeyDown);

    const timer = setInterval(() => {
      elapsedTimeRef.current += 1;
      setTimeLeft((prev) => { if (prev <= 1) { clearInterval(timer); forceSubmit(); return 0; } return prev - 1; });
    }, 1000);

    return () => {
      document.removeEventListener('contextmenu', preventAction); document.removeEventListener('copy', preventAction);
      document.removeEventListener('visibilitychange', handleVisibility); window.removeEventListener('keydown', handleKeyDown);
      clearInterval(timer);
    };
  }, [viewState, triggerWarning]);

  const forceSubmit = async () => {
    if (isSubmitting) return;
    setShowSubmitModal(false);
    setIsSubmitting(true);
    if (document.fullscreenElement) document.exitFullscreen().catch(()=>{});

    const timeTaken = elapsedTimeRef.current;

    try {
      const res = await axiosClient.post(`/api/exams/${selectedExam.id}/submit`, {
        document_id: selectedExam.id, 
        student_answers: { part1: part1Answers, part2: part2Answers, part3: part3Answers }, 
        cheat_count: cheatWarnings, 
        time_taken_seconds: timeTaken
      });

      setExamScore(res.data.score);
      setGradingResult(res.data as ExamGradingResult);
      setViewState('RESULT');
    } catch (error: any) { 
      alert("Lỗi nộp bài: " + (error?.response?.data?.message || error.message)); 
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // HÀM TÌM & HIỂN THỊ CÂU HỎI NHÓM (INLINE CONTEXT)
  // ==========================================
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
    <div style={{
      backgroundColor: '#fffbeb',
      border: '1px solid #fde68a',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--spacing-4) var(--spacing-5)',
      marginBottom: 'var(--spacing-4)',
      boxShadow: '0 2px 6px rgba(245, 158, 11, 0.08)',
      color: '#92400e',
      fontSize: `${fontSize - 1}px`,
      lineHeight: 1.6
    }}>
      {group.image_url && <ImageBlock url={group.image_url} />}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', color: '#b45309', marginBottom: '6px' }}>
        <span>📖 Dữ liệu ngữ cảnh chung cho các Câu {group.questionIds.join(', ')}:</span>
      </div>
      <div style={{ color: 'var(--color-text)' }}>{renderContent(group.content)}</div>
      <div style={{ clear: 'both' }} />
    </div>
  );

  // ================= VIEW 1: DANH SÁCH ĐỀ =================
  if (viewState === 'LIST') {
    return (
      <ExamList 
        exams={exams} 
        myScores={myScores} 
        onBack={() => navigate(-1)} 
        onSelectExam={(doc) => {
          setSelectedExam(doc);
          setViewState('CONFIRM');
        }}
        onViewAttempt={handleViewAttempt}
      />
    );
  }

  // ================= VIEW 2: CONFIRM =================
  if (viewState === 'CONFIRM') {
    return (
      <ExamConfirm 
        selectedExam={selectedExam} 
        onCancel={() => {
          setSelectedExam(null);
          setViewState('LIST');
        }} 
        onConfirm={startExam} 
      />
    );
  }

  // ================= VIEW 4: RESULT =================
  if (viewState === 'RESULT') {
    return (
      <ExamResult 
        examId={selectedExam?.id} 
        examTitle={selectedExam?.title}
        examData={examData}
        timeTakenSeconds={elapsedTimeRef.current}
        onBackToList={() => {
          setViewState('LIST');
          setSelectedExam(null);
          setExamScore(null);
          setGradingResult(null);
          setPart1Answers({});
          setPart2Answers({});
          setPart3Answers({});
          fetchExams();
        }}
        gradingResult={gradingResult || undefined}
      />
    );
  }

  // ================= VIEW 3: EXAM ROOM (DISTRACTION FREE) =================
  if (viewState === 'EXAM') {
    const examStyles = {
      sectionTitle: { fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary)', borderBottom: '2px solid var(--color-primary)', paddingBottom: 'var(--spacing-2)', marginBottom: 'var(--spacing-4)', marginTop: 'var(--spacing-8)' },
      questionBox: { backgroundColor: 'var(--color-surface)', padding: 'var(--spacing-6)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--spacing-6)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' },
      questionText: { fontSize: `${fontSize}px`, marginBottom: 'var(--spacing-4)', lineHeight: 1.6 },
      optionsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-3)' },
      optionItem: (selected: boolean) => ({
        padding: 'var(--spacing-3)', borderRadius: 'var(--radius-md)', border: selected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', backgroundColor: selected ? 'var(--color-primary-soft)' : 'var(--color-surface)', cursor: 'pointer', display: 'flex', gap: 'var(--spacing-3)', transition: 'all var(--transition-fast)'
      }),
      radioCircle: (selected: boolean) => ({
        width: '20px', height: '20px', minWidth: '20px', borderRadius: '50%', border: selected ? '6px solid var(--color-primary)' : '2px solid var(--color-border)', backgroundColor: 'var(--color-surface)', transition: 'all 0.2s'
      }),
      tfTable: { width: '100%', borderCollapse: 'collapse' as const, marginTop: 'var(--spacing-3)' },
      tfCell: { padding: 'var(--spacing-3)', borderBottom: '1px solid var(--color-border)', fontSize: `${fontSize - 1}px` }
    };

    const answeredCount = Object.keys(part1Answers).length 
      + Object.keys(part2Answers).reduce((acc, qId) => acc + Object.keys(part2Answers[Number(qId)]).length, 0) 
      + Object.keys(part3Answers).length;
      
    let totalQ = 0;
    if (examData?.part1) totalQ += examData.part1.length;
    if (examData?.part2) {
      examData.part2.forEach((q: any) => {
        totalQ += (q.sub_questions?.length || 4);
      });
    }
    if (examData?.part3) totalQ += examData.part3.length;

    const allQuestions = [
      ...(examData?.part1 || []).map((q: any) => ({ ...q, part: 'part1', part_number: 1 })),
      ...(examData?.part2 || []).map((q: any) => ({ ...q, part: 'part2', part_number: 2 })),
      ...(examData?.part3 || []).map((q: any) => ({ ...q, part: 'part3', part_number: 3 }))
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--color-background)', overflow: 'hidden' }}>
        <ExamHeader 
          title={selectedExam?.title || 'Đang thi'} 
          duration={selectedExam?.duration_minutes || 50} 
          saveStatus={saveStatus}
          isSubmitting={isSubmitting}
          timeLeft={timeLeft}
          onExit={() => {
            if (window.confirm("Bạn có chắc chắn muốn thoát? Kết quả có thể không được lưu đầy đủ.")) {
               setViewState('LIST');
            }
          }}
        />

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* LEFT: CONTENT */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-8)' }} id="exam-scroll-area">
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--spacing-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', backgroundColor: 'var(--color-surface)', padding: 'var(--spacing-2) var(--spacing-4)', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Cỡ chữ:</span>
                  <button onClick={() => setFontSize(f => Math.max(14, f - 2))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 'var(--font-size-lg)' }}>A-</button>
                  <span style={{ fontWeight: 'var(--font-weight-bold)' }}>{fontSize}px</span>
                  <button onClick={() => setFontSize(f => Math.min(24, f + 2))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 'var(--font-size-lg)' }}>A+</button>
                </div>
              </div>

              {!examData ? (
                 <div className="text-center text-muted">Đang tải đề thi...</div>
              ) : (
                <>
                  {/* PART 1 */}
                  {examData.part1 && examData.part1.length > 0 && (
                    <div style={{ marginBottom: 'var(--spacing-10)' }}>
                      <div style={examStyles.sectionTitle}>PHẦN I. CÂU TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN</div>
                      {examData.part1.map((q: any) => {
                        const group = findGroupIfFirst('part1', q.id);
                        return (
                          <React.Fragment key={q.id}>
                            {group && renderGroupBlock(group)}
                            <div id={`q-part1-${q.id}`} style={examStyles.questionBox}>
                              {q.image_url && <ImageBlock url={q.image_url} />}
                              <div style={examStyles.questionText}>
                                <strong>Câu {q.id}. </strong>{renderContent(q.questionText)}
                              </div>
                              <div style={examStyles.optionsGrid}>
                                {['A', 'B', 'C', 'D'].map((opt) => (
                                  <div key={opt} style={examStyles.optionItem(part1Answers[q.id] === opt)} onClick={() => setPart1Answers({ ...part1Answers, [q.id]: opt })}>
                                    <div style={examStyles.radioCircle(part1Answers[q.id] === opt)}></div>
                                    <div><strong>{opt}.</strong> {renderContent(q.options[opt])}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}

                  {/* PART 2 */}
                  {examData.part2 && examData.part2.length > 0 && (
                    <div style={{ marginBottom: 'var(--spacing-10)' }}>
                      <div style={examStyles.sectionTitle}>PHẦN II. CÂU TRẮC NGHIỆM ĐÚNG/SAI</div>
                      {examData.part2.map((q: any) => {
                        const group = findGroupIfFirst('part2', q.id);
                        return (
                          <React.Fragment key={q.id}>
                            {group && renderGroupBlock(group)}
                            <div id={`q-part2-${q.id}`} style={examStyles.questionBox}>
                              {q.image_url && <ImageBlock url={q.image_url} />}
                              <div style={examStyles.questionText}>
                                <strong>Câu {q.id}. </strong>{renderContent(q.questionText)}
                              </div>
                              <table style={examStyles.tfTable}>
                                <thead>
                                  <tr>
                                    <th style={{ textAlign: 'left', padding: 'var(--spacing-3)', borderBottom: '2px solid var(--color-border)' }}>Phát biểu</th>
                                    <th style={{ width: '60px', textAlign: 'center', padding: 'var(--spacing-3)', borderBottom: '2px solid var(--color-border)' }}>Đúng</th>
                                    <th style={{ width: '60px', textAlign: 'center', padding: 'var(--spacing-3)', borderBottom: '2px solid var(--color-border)' }}>Sai</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {q.statements && Object.keys(q.statements).map((stmt) => {
                                    const currentAns = part2Answers[q.id]?.[stmt];
                                    return (
                                      <tr key={stmt}>
                                        <td style={examStyles.tfCell}><strong>{stmt})</strong> {renderContent(q.statements[stmt])}</td>
                                        <td style={{ textAlign: 'center', borderBottom: '1px solid var(--color-border)' }}>
                                          <div 
                                            onClick={() => setPart2Answers({ ...part2Answers, [q.id]: { ...part2Answers[q.id], [stmt]: 'Đ' } })}
                                            style={{ margin: '0 auto', cursor: 'pointer', ...examStyles.radioCircle(currentAns === 'Đ') }}></div>
                                        </td>
                                        <td style={{ textAlign: 'center', borderBottom: '1px solid var(--color-border)' }}>
                                          <div 
                                            onClick={() => setPart2Answers({ ...part2Answers, [q.id]: { ...part2Answers[q.id], [stmt]: 'S' } })}
                                            style={{ margin: '0 auto', cursor: 'pointer', ...examStyles.radioCircle(currentAns === 'S') }}></div>
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

                  {/* PART 3 */}
                  {examData.part3 && examData.part3.length > 0 && (
                    <div style={{ marginBottom: 'var(--spacing-10)' }}>
                      <div style={examStyles.sectionTitle}>PHẦN III. CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN</div>
                      {examData.part3.map((q: any) => {
                        const group = findGroupIfFirst('part3', q.id);
                        return (
                          <React.Fragment key={q.id}>
                            {group && renderGroupBlock(group)}
                            <div id={`q-part3-${q.id}`} style={examStyles.questionBox}>
                              {q.image_url && <ImageBlock url={q.image_url} />}
                              <div style={examStyles.questionText}>
                                <strong>Câu {q.id}. </strong>{renderContent(q.questionText)}
                              </div>
                              <input 
                                type="text"
                                className="input-base"
                                placeholder="Nhập câu trả lời của bạn..."
                                value={part3Answers[q.id] || ''}
                                onChange={(e) => setPart3Answers({ ...part3Answers, [q.id]: e.target.value })}
                                style={{ marginTop: 'var(--spacing-3)', fontSize: `${fontSize}px` }}
                              />
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* RIGHT: NAVIGATOR */}
          <QuestionNavigator 
            questions={allQuestions}
            part1Answers={part1Answers}
            part2Answers={part2Answers}
            part3Answers={part3Answers}
            onScrollToQuestion={(q) => {
              const qPart = q.part || (q.part_number === 2 ? 'part2' : q.part_number === 3 ? 'part3' : 'part1');
              const el = document.getElementById(`q-${qPart}-${q.id}`) || document.getElementById(`q-${q.id}`);
              if (el) {
                const container = document.getElementById('exam-scroll-area');
                if (container) {
                   container.scrollTo({ top: el.offsetTop - 20, behavior: 'smooth' });
                }
              }
            }}
            onSubmitClick={() => setShowSubmitModal(true)} 
          />
        </div>

        {/* SUBMISSION CONFIRMATION MODAL */}
        <SubmitConfirmModal 
          isOpen={showSubmitModal} 
          onClose={() => setShowSubmitModal(false)}
          onSubmit={forceSubmit}
          totalQuestions={totalQ}
          answeredCount={answeredCount}
          isSubmitting={isSubmitting}
        />

        {/* CHEAT WARNING MODAL */}
        {showCheatModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ backgroundColor: 'var(--color-surface)', padding: 'var(--spacing-8)', borderRadius: 'var(--radius-lg)', textAlign: 'center', maxWidth: '420px', boxShadow: 'var(--shadow-xl)' }}>
              <div style={{ fontSize: '48px', marginBottom: 'var(--spacing-4)' }}>🚨</div>
              <h2 style={{ color: 'var(--color-danger)', marginBottom: 'var(--spacing-4)' }}>CẢNH BÁO VI PHẠM!</h2>
              <p style={{ marginBottom: 'var(--spacing-6)', color: 'var(--color-text)', lineHeight: 1.6 }}>{cheatReason || 'Phát hiện hành vi rời khỏi phòng thi hoặc sao chép.'}</p>
              <Button 
                variant="danger" 
                onClick={() => {
                  setShowCheatModal(false);
                  setCheatReason('');
                }}
                style={{ width: '100%' }}>
                Đã hiểu & Tiếp tục làm bài
              </Button>
            </div>
          </div>
        )}

      </div>
    );
  }

  return null;
};

export default ExamRoom;
