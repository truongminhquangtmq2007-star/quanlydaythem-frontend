import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ExamRoom = () => {
  const navigate = useNavigate();
  const [viewState, setViewState] = useState<'LIST' | 'CONFIRM' | 'EXAM' | 'RESULT'>('LIST');
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [examScore, setExamScore] = useState<any>(null);
  
  const [cheatWarnings, setCheatWarnings] = useState(0);
  const [showCheatModal, setShowCheatModal] = useState(false);
  const [cheatReason, setCheatReason] = useState('');

  const part1Count = 40; const part2Count = 4; const part3Count = 6;
  const [part1Answers, setPart1Answers] = useState<{[key: number]: string}>({});
  const [part2Answers, setPart2Answers] = useState<{[key: number]: {[sub: string]: 'Đ' | 'S'}}>({});
  const [part3Answers, setPart3Answers] = useState<{[key: number]: (string | null)[]}>({});
  
  const [myScores, setMyScores] = useState<{[key: number]: any[]}>({});

  const fetchExams = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const classId = localStorage.getItem('classId') || '1';
      const resDocs = await axios.get(`[https://quanlydaythem-api.onrender.com](https://quanlydaythem-api.onrender.com)/api/folders/drive?category=EXAM&class_id=${classId}`, { headers: { Authorization: `Bearer ${token}` } });
      const resScores = await axios.get(`[https://quanlydaythem-api.onrender.com](https://quanlydaythem-api.onrender.com)/api/exams/my-submissions`, { headers: { Authorization: `Bearer ${token}` } });
      
      const historyMap: {[key: number]: any[]} = {};
      resScores.data.forEach((s: any) => { 
          if (!historyMap[s.document_id]) historyMap[s.document_id] = [];
          historyMap[s.document_id].push(s);
      });
      
      setExams(resDocs.data.documents || []);
      setMyScores(historyMap);
    } catch (error) { console.error("Lỗi lấy đề thi"); }
  }, []);

  useEffect(() => { if (viewState === 'LIST') fetchExams(); }, [viewState, fetchExams]);

  useEffect(() => {
    if (viewState === 'EXAM' && selectedExam) {
      const duration = selectedExam.duration_minutes ? selectedExam.duration_minutes * 60 : 50 * 60;
      setTimeLeft(duration);
    }
  }, [viewState, selectedExam]);

  const triggerWarning = useCallback((reason: string) => {
    if (showCheatModal || viewState !== 'EXAM') return; 
    setCheatWarnings(prev => prev + 1); setCheatReason(reason); setShowCheatModal(true);
  }, [showCheatModal, viewState]);

  useEffect(() => {
    if (viewState !== 'EXAM') return;
    const requestFS = async () => { try { if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); } catch (e) {} };
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
      setTimeLeft((prev) => { if (prev <= 1) { clearInterval(timer); forceSubmit(); return 0; } return prev - 1; });
    }, 1000);

    return () => {
      document.removeEventListener('contextmenu', preventAction); document.removeEventListener('copy', preventAction);
      document.removeEventListener('visibilitychange', handleVisibility); window.removeEventListener('keydown', handleKeyDown);
      clearInterval(timer);
    };
  }, [viewState, triggerWarning]);

  const handlePart3Select = (question: number, colIndex: number, value: string) => {
    setPart3Answers(prev => {
      const currentAns = prev[question] || [null, null, null, null];
      const newAns = [...currentAns]; newAns[colIndex] = newAns[colIndex] === value ? null : value;
      return { ...prev, [question]: newAns };
    });
  };

  const forceSubmit = async () => {
    setViewState('RESULT');
    if (document.fullscreenElement) document.exitFullscreen().catch(()=>{});
    const formattedPart3: {[key: number]: string} = {};
    Object.keys(part3Answers).forEach(q => { formattedPart3[Number(q)] = part3Answers[Number(q)].filter(v => v !== null).join(''); });

    const timeTaken = ((selectedExam?.duration_minutes || 50) * 60) - timeLeft;

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('[https://quanlydaythem-api.onrender.com](https://quanlydaythem-api.onrender.com)/api/exams/submit', {
        document_id: selectedExam.id, student_answers: { part1: part1Answers, part2: part2Answers, part3: formattedPart3 }, 
        cheat_count: cheatWarnings, time_taken_seconds: timeTaken
      }, { headers: { Authorization: `Bearer ${token}` } });
      setExamScore(res.data.score); // Đã có allow_view_answers từ Backend trả về
    } catch (error: any) { alert("Lỗi nộp bài!"); }
  };

  const wrapperStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: '#f1f5f9', overflowY: 'auto' };

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
  <button 
    onClick={() => navigate(`/student/view-answers/${doc.id}`)} 
    style={{ 
      marginTop: '10px', 
      padding: '12px', 
      width: '100%', // <--- THAY ĐỔI Ở ĐÂY: Chiếm 100% chiều rộng
      backgroundColor: '#fff', 
      color: '#f59e0b', 
      border: '2px solid #f59e0b', 
      borderRadius: '8px', 
      cursor: 'pointer', 
      fontWeight: 'bold',
      transition: '0.2s', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      gap: '8px',
      boxSizing: 'border-box' // Đảm bảo padding không làm nút bị tràn ra ngoài
    }}
    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f59e0b'; e.currentTarget.style.color = 'white'; }}
    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#f59e0b'; }}
  >
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

  if (viewState === 'CONFIRM') {
    return (
      <div style={{...wrapperStyle, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9'}}>
        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '20px', width: '500px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
          <div style={{ fontSize: '50px', marginBottom: '15px' }}>⏱️</div>
          <h2 style={{ margin: '0 0 15px 0', color: '#1e293b' }}>Xác nhận vào thi</h2>
          <p style={{ color: '#475569', fontSize: '15px', lineHeight: '1.6', marginBottom: '30px' }}>Bạn chuẩn bị làm bài thi: <strong>{selectedExam?.title}</strong>.<br/>Thời gian làm bài: <strong>{selectedExam?.duration_minutes || 50} phút</strong>.<br/><br/>Hệ thống sẽ chuyển sang chế độ <strong>Toàn màn hình</strong>.</p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <button onClick={() => setViewState('LIST')} style={{ padding: '12px 25px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Quay lại</button>
            <button onClick={() => { setPart1Answers({}); setPart2Answers({}); setPart3Answers({}); setCheatWarnings(0); setViewState('EXAM'); }} style={{ padding: '12px 25px', backgroundColor: '#1e40af', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Bắt đầu thi</button>
          </div>
        </div>
      </div>
    );
  }

  if (viewState === 'RESULT') {
    return (
      <div style={{...wrapperStyle, display: 'flex', flexDirection: 'column'}}>
        <div style={{ backgroundColor: '#1e40af', padding: '15px 30px', color: 'white', display: 'flex', justifyContent: 'center' }}><h1 style={{ margin: 0, fontSize: '24px' }}>KẾT QUẢ THI</h1></div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'white', border: '2px solid #1e40af', padding: '40px', width: '500px', textAlign: 'center', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <p style={{ color: '#10b981', fontWeight: 'bold', fontSize: '20px', marginBottom: '20px' }}>Nộp bài thành công!</p>
            {examScore ? (
              <div style={{ textAlign: 'left', marginBottom: '30px', marginLeft: '50px', fontSize: '16px', fontWeight: 'bold' }}>
                <p style={{ color: '#475569' }}>Phần I: {examScore.p1Score}đ</p>
                <p style={{ color: '#475569' }}>Phần II: {examScore.p2Score}đ</p>
                <p style={{ color: '#475569' }}>Phần III: {examScore.p3Score}đ</p>
                <h3 style={{ color: '#ea580c', fontSize: '26px', marginTop: '15px' }}>Tổng điểm: {examScore.totalScore} / 10</h3>
                
                {/* NÚT XEM ĐÁP ÁN DỰA VÀO TRẠNG THÁI TỪ BACKEND */}
                <div style={{ marginTop: '25px', textAlign: 'center', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                  {examScore.allow_view_answers ? (
                    <button style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>
                      Xem chi tiết đáp án
                    </button>
                  ) : (
                    <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '14px' }}>Giáo viên chưa mở khóa đáp án chi tiết.</span>
                  )}
                </div>

              </div>
            ) : <p>Đang xử lý điểm...</p>}
            <button onClick={() => { setViewState('LIST'); fetchExams(); }} style={{ padding: '12px 30px', backgroundColor: '#1e40af', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}>Về danh sách đề</button>
          </div>
        </div>
      </div>
    );
  }

  // ================= MÀN HÌNH LÀM BÀI CHÍNH (ĐẦY ĐỦ 3 PHẦN) =================
  return (
    <div style={{...wrapperStyle, overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
      {showCheatModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(239, 68, 68, 0.95)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '16px', textAlign: 'center', width: '450px' }}>
            <h1 style={{ color: '#dc2626', fontSize: '50px', margin: '0 0 15px 0' }}>⚠️</h1>
            <h2 style={{ color: '#dc2626', marginTop: 0 }}>CẢNH BÁO GIAN LẬN</h2>
            <p style={{ fontWeight: 'bold' }}>{cheatReason}</p>
            <div style={{ backgroundColor: '#fef2f2', padding: '10px', borderRadius: '8px', color: '#b91c1c', fontWeight: 'bold', margin: '20px 0' }}>Số lần vi phạm: {cheatWarnings}</div>
            <button onClick={() => { setShowCheatModal(false); try { document.documentElement.requestFullscreen(); }catch(e){} }} style={{ padding: '12px 40px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Tiếp tục làm bài</button>
          </div>
        </div>
      )}

      <div style={{ backgroundColor: '#1e3a8a', color: 'white', padding: '10px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <span style={{ fontWeight: 'bold' }}>Đề thi: {selectedExam?.title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ fontSize: '20px', fontWeight: 'bold' }}>🕒 {Math.floor(timeLeft/60).toString().padStart(2,'0')}:{(timeLeft%60).toString().padStart(2,'0')}</span>
          <button onClick={() => { if(window.confirm("Xác nhận nộp bài?")) forceSubmit() }} style={{ padding: '8px 20px', backgroundColor: 'white', color: '#1e3a8a', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>NỘP BÀI</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* BÊN TRÁI: FILE ĐỀ THI */}
        <div style={{ flex: 6, borderRight: '2px solid #cbd5e1', backgroundColor: '#525659' }}>
          {selectedExam?.file_url ? <iframe src={`${selectedExam.file_url}#toolbar=0`} width="100%" height="100%" style={{ border: 'none' }} title="Đề thi" /> : <div style={{color:'white', padding:'20px'}}>Đề thi không tải được</div>}
        </div>
        
        {/* BÊN PHẢI: PHIẾU TÔ TRẮC NGHIỆM ĐẦY ĐỦ */}
        <div style={{ flex: 4, padding: '20px', backgroundColor: 'white', overflowY: 'auto' }}>
          <h2 style={{ textAlign: 'center', color: '#1e3a8a', fontSize: '20px', fontWeight: 'bold', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px' }}>PHIẾU TRẢ LỜI TRẮC NGHIỆM</h2>
          
          {/* PHẦN 1 */}
          <div style={{ marginBottom: '30px' }}>
            <div style={{ backgroundColor: '#f8fafc', borderLeft: '4px solid #3b82f6', padding: '8px 12px', marginBottom: '15px', fontWeight: 'bold' }}>PHẦN I. Chọn 1 phương án</div>
            <div style={{ columnCount: 2, columnGap: '40px' }}>
              {Array.from({ length: part1Count }, (_, i) => i + 1).map(q => (
                <div key={`p1-${q}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '15px', breakInside: 'avoid' }}>
                  <span style={{ fontWeight: 'bold', width: '25px' }}>{q}.</span>
                  {['A', 'B', 'C', 'D'].map(opt => (
                    <div key={opt} onClick={() => setPart1Answers({ ...part1Answers, [q]: opt })} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #94a3b8', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '13px', cursor: 'pointer', backgroundColor: part1Answers[q] === opt ? '#1e3a8a' : 'white', color: part1Answers[q] === opt ? 'white' : '#64748b' }}>{opt}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* PHẦN 2 */}
          <div style={{ marginBottom: '30px' }}>
            <div style={{ backgroundColor: '#f8fafc', borderLeft: '4px solid #10b981', padding: '8px 12px', marginBottom: '15px', fontWeight: 'bold' }}>PHẦN II. Đúng/Sai</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              {Array.from({ length: part2Count }, (_, i) => i + 1).map(q => (
                <div key={`p2-${q}`} style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>Câu {q}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 5px' }}>
                    {['a', 'b', 'c', 'd'].map(sub => (
                      <div key={sub} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 'bold' }}>Ý {sub}</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <div onClick={() => setPart2Answers(prev => ({ ...prev, [q]: { ...(prev[q] || {}), [sub]: 'Đ' } }))} style={{ width: '26px', height: '26px', borderRadius: '50%', border: '1px solid #94a3b8', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px', cursor: 'pointer', backgroundColor: part2Answers[q]?.[sub] === 'Đ' ? '#1e3a8a' : 'white', color: part2Answers[q]?.[sub] === 'Đ' ? 'white' : '#64748b' }}>Đ</div>
                          <div onClick={() => setPart2Answers(prev => ({ ...prev, [q]: { ...(prev[q] || {}), [sub]: 'S' } }))} style={{ width: '26px', height: '26px', borderRadius: '50%', border: '1px solid #94a3b8', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px', cursor: 'pointer', backgroundColor: part2Answers[q]?.[sub] === 'S' ? '#ef4444' : 'white', color: part2Answers[q]?.[sub] === 'S' ? 'white' : '#64748b' }}>S</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PHẦN 3 */}
          <div style={{ marginBottom: '30px' }}>
            <div style={{ backgroundColor: '#f8fafc', borderLeft: '4px solid #8b5cf6', padding: '8px 12px', marginBottom: '15px', fontWeight: 'bold' }}>PHẦN III. Trả lời ngắn</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '15px' }}>
              {Array.from({ length: part3Count }, (_, i) => i + 1).map(q => {
                const currentAns = part3Answers[q] || [null, null, null, null];
                return (
                  <div key={`p3-${q}`} style={{ border: '1px solid #cbd5e1', padding: '10px', borderRadius: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Câu {q}</div>
                    <table style={{ borderSpacing: '4px', borderCollapse: 'separate' }}>
                      <tbody>
                        <tr>
                          <td style={{ fontWeight: 'bold', textAlign: 'right', paddingRight: '5px' }}>-</td>
                          <td><div onClick={() => handlePart3Select(q, 0, '-')} style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1px solid #94a3b8', cursor: 'pointer', backgroundColor: currentAns[0] === '-' ? '#1e3a8a' : 'white' }}></div></td>
                          <td></td><td></td><td></td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 'bold', textAlign: 'right', paddingRight: '5px' }}>,</td>
                          <td></td>
                          <td><div onClick={() => handlePart3Select(q, 1, ',')} style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1px solid #94a3b8', cursor: 'pointer', backgroundColor: currentAns[1] === ',' ? '#1e3a8a' : 'white' }}></div></td>
                          <td><div onClick={() => handlePart3Select(q, 2, ',')} style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1px solid #94a3b8', cursor: 'pointer', backgroundColor: currentAns[2] === ',' ? '#1e3a8a' : 'white' }}></div></td>
                          <td></td>
                        </tr>
                        {[0,1,2,3,4,5,6,7,8,9].map(num => {
                          const val = num.toString();
                          return (
                            <tr key={num}>
                              <td style={{ fontWeight: 'bold', textAlign: 'right', paddingRight: '5px' }}>{num}</td>
                              <td><div onClick={() => handlePart3Select(q, 0, val)} style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1px solid #94a3b8', cursor: 'pointer', backgroundColor: currentAns[0] === val ? '#1e3a8a' : 'white' }}></div></td>
                              <td><div onClick={() => handlePart3Select(q, 1, val)} style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1px solid #94a3b8', cursor: 'pointer', backgroundColor: currentAns[1] === val ? '#1e3a8a' : 'white' }}></div></td>
                              <td><div onClick={() => handlePart3Select(q, 2, val)} style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1px solid #94a3b8', cursor: 'pointer', backgroundColor: currentAns[2] === val ? '#1e3a8a' : 'white' }}></div></td>
                              <td><div onClick={() => handlePart3Select(q, 3, val)} style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1px solid #94a3b8', cursor: 'pointer', backgroundColor: currentAns[3] === val ? '#1e3a8a' : 'white' }}></div></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ExamRoom;