import { useParams } from 'react-router-dom';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import ExamResult from './ExamResult';
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
              color: '#ef4444',
              fontSize: '13px',
              fontWeight: 'bold'
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
  <div style={{ float: 'right', marginLeft: '15px', marginBottom: '10px', maxWidth: '42%' }}>
    <img src={url} alt="Hình minh họa" style={{ width: '100%', maxHeight: '260px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #cbd5e1', display: 'block' }} />
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
  
  // Anti-cheat
  const [cheatWarnings, setCheatWarnings] = useState(0);
  const [showCheatModal, setShowCheatModal] = useState(false);
  const [cheatReason, setCheatReason] = useState('');

  // Lưu đáp án
  const [part1Answers, setPart1Answers] = useState<{[key: number]: string}>({});
  const [part2Answers, setPart2Answers] = useState<{[key: number]: {[sub: string]: 'Đ' | 'S'}}>({});
  const [part3Answers, setPart3Answers] = useState<{[key: number]: string}>({}); 
  
  const [myScores, setMyScores] = useState<{[key: number]: any[]}>({});
  const [examData, setExamData] = useState<any>(null); 
  const [fontSize, setFontSize] = useState<number>(16);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [activeContext, setActiveContext] = useState<SharedContext | null>(null);

  const fetchExams = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      // const classId = localStorage.getItem('classId') || '1';
      const resDocs = await axiosClient.get(`/api/student/exams`);
      const resScores = await axiosClient.get(`/api/exams/my-submissions`);
      
      const historyMap: {[key: number]: any[]} = {};
      resScores.data.forEach((s: any) => { 
          if (!historyMap[s.document_id]) historyMap[s.document_id] = [];
          historyMap[s.document_id].push(s);
      });
      
      setExams(Array.isArray(resDocs.data) ? resDocs.data : (resDocs.data.documents || []));
      setMyScores(historyMap);
    } catch (error) { console.error("Lỗi lấy đề thi"); }
  }, []);

  useEffect(() => { if (viewState === 'LIST') fetchExams(); }, [viewState, fetchExams]);

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
          if (answers.part1) setPart1Answers(answers.part1);
          if (answers.part2) setPart2Answers(answers.part2);
          if (answers.part3) setPart3Answers(answers.part3);
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
          const token = localStorage.getItem('token');
          const res = await axiosClient.get(`/api/exams/key/${selectedExam.id}`);

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
    setCheatWarnings(prev => prev + 1); setCheatReason(reason); setShowCheatModal(true);
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
    setViewState('RESULT');
    setIsSubmitting(true);
    if (document.fullscreenElement) document.exitFullscreen().catch(()=>{});

    const timeTaken = elapsedTimeRef.current;

    try {
      const token = localStorage.getItem('token');
      const res = await axiosClient.post(`/api/exams/${selectedExam.id}/submit`, {
        document_id: selectedExam.id, 
        student_answers: { part1: part1Answers, part2: part2Answers, part3: part3Answers }, 
        cheat_count: cheatWarnings, 
        time_taken_seconds: timeTaken
      });

      // Lưu cả object đầy đủ để truyền cho ExamResult
      setExamScore(res.data.score);
      setGradingResult(res.data as ExamGradingResult);
    } catch (error: any) { 
      alert("Lỗi nộp bài: " + (error?.response?.data?.message || error.message)); 
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // HÀM TÌM & HIỂN THỊ CÂU HỎI NHÓM
  // ==========================================
  const findContext = (qId: number): SharedContext | null => {
    const groups: SharedContext[] = examData?.sharedContexts || examData?.shared_context || [];
    return groups.find((g) => g.questionIds.includes(qId)) || null;
  };
  
  const wrapperStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: '#f1f5f9', overflowY: 'auto' };

  // ================= VIEW 1: DANH SÁCH ĐỀ =================
  if (viewState === 'LIST') {
    return (
      <div style={wrapperStyle}>
        <div style={{ background: '#1e40af', padding: '40px 40px 100px 40px', color: 'white' }}>
          <button onClick={() => navigate(-1)} style={{ marginBottom: '20px', padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>🔙 Quay lại</button>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '30px', textTransform: 'uppercase' }}>Khu vực luyện thi</h1>
          <p style={{ margin: 0, fontSize: '15px', color: '#bfdbfe' }}>Hoàn thành các đề thi dưới đây để nâng cao năng lực.</p>
        </div>

        <div style={{ margin: '-50px 40px 40px 40px', backgroundColor: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' }}>
            {exams.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Chưa có đề thi nào.</div>
            ) : exams.map(doc => {
              const attempts = myScores[doc.id] || [];
              const isCompleted = attempts.length > 0;

              return (
                <div key={doc.id} style={{ backgroundColor: '#f8fafc', borderRadius: '16px', padding: '25px', display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '12px', backgroundColor: '#eff6ff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px' }}>📝</div>
                    <div>
                      <h3 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '18px' }}>{doc.title}</h3>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>⏱ {doc.duration_minutes || 50} Phút</span>
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px dashed #cbd5e1' }}>
                    {isCompleted ? (
                      <div>
                        <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>LỊCH SỬ THI ({attempts.length} lần)</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px', maxHeight: '100px', overflowY: 'auto' }}>
                          {attempts.map((att, idx) => (
                             <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', backgroundColor: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                               <span>Lần {attempts.length - idx}</span><span style={{ fontWeight: 'bold', color: '#10b981' }}>{att.total_score}đ</span>
                             </div>
                          ))}
                        </div>
                        <button onClick={() => { setSelectedExam(doc); setViewState('CONFIRM'); }} style={{ width: '100%', padding: '12px 0', backgroundColor: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Luyện Lại ➔</button>
                      {doc.allow_view_answers && (
                        <button onClick={() => navigate(`/student/view-answers/${doc.id}`)} style={{ marginTop: '10px', padding: '12px', width: '100%', backgroundColor: '#fff', color: '#f59e0b', border: '2px solid #f59e0b', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxSizing: 'border-box' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f59e0b'; e.currentTarget.style.color = 'white'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#f59e0b'; }}>
                          👁️ Xem đáp án
                        </button>
                      )}
                      </div>
                    ) : (
                      <button onClick={() => { setSelectedExam(doc); setViewState('CONFIRM'); }} style={{ width: '100%', padding: '12px 0', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Vào Thi Ngay ⚡</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ================= VIEW 2: MÀN HÌNH XÁC NHẬN =================
  if (viewState === 'CONFIRM') {
    return (
      <div style={{...wrapperStyle, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9'}}>
        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '20px', width: '500px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
          <div style={{ fontSize: '50px', marginBottom: '15px' }}>⏱️</div>
          <h2 style={{ margin: '0 0 15px 0', color: '#1e293b' }}>Xác nhận vào thi</h2>
          <p style={{ color: '#475569', fontSize: '15px', lineHeight: '1.6', marginBottom: '30px' }}>Bạn chuẩn bị làm bài thi: <strong>{selectedExam?.title}</strong>.<br/>Thời gian làm bài: <strong>{selectedExam?.duration_minutes || 50} phút</strong>.<br/><br/>Hệ thống sẽ chuyển sang chế độ <strong>Toàn màn hình</strong>.</p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <button onClick={() => setViewState('LIST')} style={{ padding: '12px 25px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Quay lại</button>
            <button onClick={startExam} style={{ padding: '12px 25px', backgroundColor: '#1e40af', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Bắt đầu thi</button>
          </div>
        </div>
      </div>
    );
  }

  // ================= VIEW 3: KẾT QUẢ THI =================
  if (viewState === 'RESULT') {
    // Đang xử lý hoặc chưa có kết quả
    if (isSubmitting || !gradingResult) {
      return (
        <div style={{...wrapperStyle, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
          <div style={{ textAlign: 'center', color: '#475569' }}>
            <div style={{ fontSize: '50px', marginBottom: '20px' }}>⏳</div>
            <h2 style={{ margin: '0 0 10px 0' }}>Đang chấm điểm bài thi...</h2>
            <p>Vui lòng chờ trong giây lát</p>
          </div>
        </div>
      );
    }

    // Hiển thị kết quả đầy đủ
    return (
      <div style={wrapperStyle}>
        <ExamResult
            examId={selectedExam?.id || id}
            gradingResult={gradingResult}
          examData={examData}
          examTitle={selectedExam?.title || 'Kết quả thi'}
          timeTakenSeconds={elapsedTimeRef.current}
          onBackToList={() => { setViewState('LIST'); fetchExams(); }}
          onViewAnswers={examScore?.allow_view_answers ? () => navigate(`/student/view-answers/${selectedExam.id}`) : undefined}
        />
      </div>
    );
  }

  // ================= VIEW 4: MÀN HÌNH LÀM BÀI CHÍNH =================
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const totalQuestions = (examData?.part1?.length || 0) + (examData?.part2?.length || 0) + (examData?.part3?.length || 0);
  const answeredCount = Object.keys(part1Answers).length + Object.keys(part2Answers).length + Object.keys(part3Answers).filter(k => part3Answers[Number(k)]?.trim() !== '').length;

  const examStyles = {
    layout: { backgroundColor: '#f1f5f9', minHeight: '100vh', display: 'flex', flexDirection: 'column' as const, fontSize: `${fontSize}px`, position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 },
    header: { backgroundColor: '#1e293b', color: 'white', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    titleArea: { display: 'flex', flexDirection: 'column' as const, gap: '4px' },
    examTitle: { fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase' as const, margin: 0 },
    studentInfo: { fontSize: '13px', color: '#cbd5e1', display: 'flex', gap: '20px' },
    statusArea: { display: 'flex', alignItems: 'center', gap: '15px' },
    timer: { border: '1px solid #475569', padding: '6px 15px', borderRadius: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' },
    submitBtn: { backgroundColor: 'transparent', color: 'white', border: '1px solid white', padding: '8px 20px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' },
    toolbar: { backgroundColor: '#fff', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' },
    toolGroup: { display: 'flex', alignItems: 'center', gap: '10px' },
    outlineBtn: { backgroundColor: 'white', border: '1px solid #cbd5e1', padding: '6px 15px', borderRadius: '5px', cursor: 'pointer', color: '#475569' },
    primaryBtn: { backgroundColor: '#3b82f6', border: 'none', padding: '7px 15px', borderRadius: '5px', cursor: 'pointer', color: 'white' },
    darkBtn: { backgroundColor: '#1e293b', border: 'none', padding: '7px 15px', borderRadius: '5px', cursor: 'pointer', color: 'white' },
    fontBtn: { backgroundColor: 'white', border: '1px solid #cbd5e1', padding: '6px 10px', cursor: 'pointer', color: '#475569' },
    mainContent: { flex: 1, padding: '30px 20px', overflowY: 'auto' as const, paddingBottom: '100px' },
    card: { backgroundColor: '#fff', maxWidth: '900px', margin: '0 auto', borderRadius: '8px', padding: '40px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
    sectionTitle: { color: '#1e3a8a', fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase' as const, borderBottom: '2px solid #1e3a8a', paddingBottom: '10px', marginBottom: '30px' },
    questionBox: { marginBottom: '40px', clear: 'both' as const },
    questionText: { fontWeight: 'bold', marginBottom: '15px', lineHeight: '1.6' },
    optionsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
    optionItem: (isSelected: boolean) => ({ border: isSelected ? '2px solid #3b82f6' : '1px solid #cbd5e1', backgroundColor: isSelected ? '#eff6ff' : 'white', borderRadius: '8px', padding: '12px 15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s' }),
    radioCircle: (isSelected: boolean) => ({ width: '18px', height: '18px', borderRadius: '50%', border: isSelected ? '5px solid #3b82f6' : '1px solid #94a3b8', backgroundColor: 'white' }),
    tfTable: { width: '100%', borderCollapse: 'collapse' as const, marginTop: '10px' },
    tfCell: { padding: '12px', borderBottom: '1px dashed #e2e8f0' },
    footer: { position: 'fixed' as const, bottom: 0, left: 0, right: 0, backgroundColor: 'white', borderTop: '1px solid #e2e8f0', padding: '15px', display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' as const },
    navBubble: (isAnswered: boolean) => ({ width: '35px', height: '35px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', backgroundColor: isAnswered ? '#3b82f6' : 'white', color: isAnswered ? 'white' : '#64748b', border: isAnswered ? 'none' : '1px solid #cbd5e1' })
  };

  return (
    <div style={examStyles.layout}>
      {/* MODAL CẢNH BÁO GIAN LẬN */}
      {showCheatModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(239, 68, 68, 0.95)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '16px', textAlign: 'center', width: '450px' }}>
            <h1 style={{ color: '#dc2626', fontSize: '50px', margin: '0 0 15px 0' }}>⚠️</h1>
            <h2 style={{ color: '#dc2626', marginTop: 0 }}>CẢNH BÁO GIAN LẬN</h2>
            <p style={{ fontWeight: 'bold' }}>{cheatReason}</p>
            <div style={{ backgroundColor: '#fef2f2', padding: '10px', borderRadius: '8px', color: '#b91c1c', fontWeight: 'bold', margin: '20px 0' }}>Số lần vi phạm: {cheatWarnings}</div>
            <button onClick={() => { setShowCheatModal(false); try { document.documentElement.requestFullscreen(); }catch (e) {
      console.error(e);
    } }} style={{ padding: '12px 40px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Tiếp tục làm bài</button>
          </div>
        </div>
      )}

      {/* 1. TOP HEADER */}
      <div style={examStyles.header}>
        <div style={examStyles.titleArea}>
          <h1 style={examStyles.examTitle}>{selectedExam?.title || 'ĐỀ THAM KHẢO TỐT NGHIỆP THPT'}</h1>
          <div style={examStyles.studentInfo}>
            <span><strong>Thí sinh:</strong> Ẩn danh</span>
            <span><strong>SBD:</strong> GUEST</span>
            <span><strong>Môn thi:</strong> TOÁN</span>
          </div>
        </div>
        <div style={examStyles.statusArea}>
          <div style={{...examStyles.timer, gap: '15px', display: 'flex'}}>
            <span style={{ fontSize: '14px', color: '#cbd5e1', fontWeight: 'normal' }}>{saveStatus}</span>
            <span>
              <span>⏱</span> {formatTime(timeLeft)}
            </span>
          </div>
          <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px', color: '#10b981' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%' }}></span> Mạng ổn định
          </div>
          <button style={examStyles.submitBtn} onClick={() => { if(window.confirm("Xác nhận nộp bài?")) forceSubmit() }} disabled={isSubmitting}>
            {isSubmitting ? 'ĐANG XỬ LÝ...' : 'NỘP BÀI'}
          </button>
        </div>
      </div>

      {/* 2. SUB TOOLBAR */}
      <div style={examStyles.toolbar}>
        <button style={examStyles.outlineBtn} onClick={() => window.confirm("Thoát sẽ không lưu bài, bạn chắc chứ?") && setViewState('LIST')}>Thoát</button>
        <div style={examStyles.toolGroup}>
          <button style={examStyles.outlineBtn}>Quay lại</button>
          <button style={examStyles.primaryBtn}>Tiếp theo</button>
        </div>
        <div style={examStyles.toolGroup}>
          <span style={{ fontSize: '14px', color: '#475569', fontWeight: 'bold', marginRight: '15px' }}>
            Đã làm: <span style={{ color: '#3b82f6' }}>{answeredCount} / {totalQuestions}</span>
          </span>
          <button style={examStyles.darkBtn}>Lưu nháp</button>
          <div style={{ display: 'flex', marginLeft: '10px' }}>
            <button style={{ ...examStyles.fontBtn, borderRadius: '5px 0 0 5px' }} onClick={() => setFontSize(prev => Math.max(12, prev - 1))}>A-</button>
            <button style={{ ...examStyles.fontBtn, borderRadius: '0 5px 5px 0', borderLeft: 'none' }} onClick={() => setFontSize(prev => Math.min(24, prev + 1))}>A+</button>
          </div>
        </div>
      </div>

      {/* 3. MAIN CONTENT */}
      <div style={examStyles.mainContent}>
        {!examData ? (
          <div style={{ padding: '50px', textAlign: 'center', fontWeight: 'bold' }}>Đang tải nội dung đề thi...</div>
        ) : (
          <div style={examStyles.card}>
            
            {/* PHẦN 1 */}
            {examData.part1 && examData.part1.length > 0 && (
              <div style={{ marginBottom: '50px' }}>
                <div style={examStyles.sectionTitle}>PHẦN I. CÂU TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN</div>
                {examData.part1.map((q: any) => {
                  const ctx = findContext(q.id);
  return (
    <React.Fragment key={q.id}>
      {ctx && (
        <div style={{ marginBottom: '10px' }}>
          <button onClick={() => setActiveContext(ctx)} style={{ backgroundColor: '#fffbeb', border: '1px solid #f59e0b', color: '#b45309', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>📖 Xem dữ liệu chung (Context)</button>
        </div>
      )}
      <div id={`q-${q.id}`} style={examStyles.questionBox} onMouseEnter={() => setActiveContext(findContext(q.id))} onClick={() => setActiveContext(findContext(q.id))}>
                        <div>
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
                        <div style={{ clear: 'both' }}></div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            {/* PHẦN 2 */}
            {examData.part2 && examData.part2.length > 0 && (
              <div style={{ marginBottom: '50px' }}>
                <div style={examStyles.sectionTitle}>PHẦN II. CÂU TRẮC NGHIỆM ĐÚNG/SAI</div>
                {examData.part2.map((q: any) => {
                  const ctx = findContext(q.id);
  return (
    <React.Fragment key={q.id}>
      {ctx && (
        <div style={{ marginBottom: '10px' }}>
          <button onClick={() => setActiveContext(ctx)} style={{ backgroundColor: '#fffbeb', border: '1px solid #f59e0b', color: '#b45309', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>📖 Xem dữ liệu chung (Context)</button>
        </div>
      )}
      <div id={`q-${q.id}`} style={examStyles.questionBox} onMouseEnter={() => setActiveContext(findContext(q.id))} onClick={() => setActiveContext(findContext(q.id))}>
                        <div>
                          {q.image_url && <ImageBlock url={q.image_url} />}
                          <div style={examStyles.questionText}>
                            <strong>Câu {q.id}. </strong>{renderContent(q.questionText)}
                          </div>
                          <table style={examStyles.tfTable}>
                            <tbody>
                              {['a', 'b', 'c', 'd'].map((stmt) => (
                                <tr key={stmt}>
                                  <td style={examStyles.tfCell}><strong>{stmt})</strong> {renderContent(q.statements[stmt])}</td>
                                  <td style={{ ...examStyles.tfCell, width: '120px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                      <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <input type="radio" checked={part2Answers[q.id]?.[stmt] === 'Đ'} onChange={() => setPart2Answers(prev => ({ ...prev, [q.id]: { ...(prev[q.id] || {}), [stmt]: 'Đ' } }))} /> Đ
                                      </label>
                                      <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <input type="radio" checked={part2Answers[q.id]?.[stmt] === 'S'} onChange={() => setPart2Answers(prev => ({ ...prev, [q.id]: { ...(prev[q.id] || {}), [stmt]: 'S' } }))} /> S
                                      </label>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div style={{ clear: 'both' }}></div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            {/* PHẦN 3 */}
            {examData.part3 && examData.part3.length > 0 && (
              <div style={{ marginBottom: '10px' }}>
                <div style={examStyles.sectionTitle}>PHẦN III. CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN</div>
                {examData.part3.map((q: any) => {
                  const ctx = findContext(q.id);
  return (
    <React.Fragment key={q.id}>
      {ctx && (
        <div style={{ marginBottom: '10px' }}>
          <button onClick={() => setActiveContext(ctx)} style={{ backgroundColor: '#fffbeb', border: '1px solid #f59e0b', color: '#b45309', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>📖 Xem dữ liệu chung (Context)</button>
        </div>
      )}
      <div id={`q-${q.id}`} style={examStyles.questionBox} onMouseEnter={() => setActiveContext(findContext(q.id))} onClick={() => setActiveContext(findContext(q.id))}>
                        <div>
                          {q.image_url && <ImageBlock url={q.image_url} />}
                          <div style={examStyles.questionText}>
                            <strong>Câu {q.id}. </strong>{renderContent(q.questionText)}
                          </div>
                          <div style={{ marginTop: '10px' }}>
                            <span style={{ fontWeight: 'bold', marginRight: '15px' }}>Đáp án của bạn:</span>
                            <input 
                              type="text" 
                              style={{ padding: '10px 15px', borderRadius: '5px', border: '2px solid #cbd5e1', fontSize: '16px', width: '200px' }} 
                              value={part3Answers[q.id] || ''} 
                              onChange={(e) => setPart3Answers({ ...part3Answers, [q.id]: e.target.value })}
                              placeholder="Nhập giá trị..."
                            />
                          </div>
                        </div>
                        <div style={{ clear: 'both' }}></div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      
      {/* 5. SIDE PANEL (CONTEXT) */}
      <div style={{ position: 'fixed', right: '0', top: '130px', bottom: '80px', width: '350px', backgroundColor: 'white', borderLeft: '2px solid #e2e8f0', boxShadow: '-5px 0 20px rgba(0,0,0,0.1)', padding: '20px', overflowY: 'auto', zIndex: 90, transition: 'transform 0.3s ease-in-out', transform: activeContext ? 'translateX(0)' : 'translateX(100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
          <h3 style={{ margin: 0, color: '#1e3a8a', fontSize: '16px' }}>📖 Dữ liệu chung</h3>
          <button onClick={() => setActiveContext(null)} style={{ border: 'none', background: '#f1f5f9', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✖</button>
        </div>
        {activeContext && (
          <div style={{ lineHeight: '1.6', color: '#334155', fontSize: '15px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '15px', color: '#b45309', backgroundColor: '#fffbeb', padding: '8px', borderRadius: '5px', fontSize: '13px' }}>📌 Dùng cho các câu: {activeContext.questionIds.join(', ')}</div>
            {activeContext.image_url && <img src={activeContext.image_url} alt="Minh họa" style={{ width: '100%', marginBottom: '15px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />}
            <div>{renderContent(activeContext.content)}</div>
          </div>
        )}
      </div>

      {/* 4. FOOTER */}
      <div style={examStyles.footer}>
        {[...(examData?.part1 || []), ...(examData?.part2 || []), ...(examData?.part3 || [])].map((q: any) => {
          const isAnswered = part1Answers[q.id] || (part2Answers[q.id] && Object.keys(part2Answers[q.id]).length > 0) || (part3Answers[q.id] && part3Answers[q.id].trim() !== '');
          return (
            <a href={`#q-${q.id}`} key={q.id} style={{ textDecoration: 'none' }}>
              <div style={examStyles.navBubble(!!isAnswered)}>{q.id}</div>
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default ExamRoom;
