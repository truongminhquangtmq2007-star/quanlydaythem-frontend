import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// 1. IMPORT GIAO DIỆN AI VÀO ĐÂY (Đảm bảo file ExamManagerAI.tsx nằm cùng thư mục)
import CreateExamAI from './CreateExamAI';
import ExamResult from './ExamResult';

interface Document { 
  id: number; title: string; file_url: string; 
  allow_view_answers?: boolean; duration_minutes?: number;
}

const ExamManagement = () => {
  // ==========================================
  // STATE MỚI CHO TABS
  // ==========================================
  const [activeTab, setActiveTab] = useState<'list' | 'ai-create'>('list');

  // ==========================================
  // CÁC STATE CŨ CỦA BẠN (GIỮ NGUYÊN)
  // ==========================================
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentTitle, setDocumentTitle] = useState('');
  const [selectedDocForKey, setSelectedDocForKey] = useState<Document | null>(null);
  
  const part1Count = 40; const part2Count = 4; const part3Count = 6;
  const [part1Key, setPart1Key] = useState<{[key: number]: string}>({});
  const [part2Key, setPart2Key] = useState<{[key: number]: {[sub: string]: 'Đ' | 'S'}}>({});
  const [part3Key, setPart3Key] = useState<{[key: number]: (string | null)[]}>({});
  const [allowViewAnswers, setAllowViewAnswers] = useState(false);
  const [examDuration, setExamDuration] = useState<number>(50);

  // Modal Kết quả
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [examSubmissions, setExamSubmissions] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [submissionsExamTitle, setSubmissionsExamTitle] = useState('');
  const [submissionsExamContent, setSubmissionsExamContent] = useState<any>(null);

  // NHIỆM VỤ 3: State chọn lọc lưu vào học phí
  const [selectedForTuition, setSelectedForTuition] = useState<number[]>([]);

  const fetchClasses = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get('https://quanlydaythem-api.onrender.com/api/classes', { headers: { Authorization: `Bearer ${token}` } });
      setClasses(res.data);
      if (res.data.length > 0) setSelectedClassId(res.data[0].id.toString());
    } catch (error) {}
  };

  const fetchExams = useCallback(async () => {
    if (!selectedClassId) return;
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`https://quanlydaythem-api.onrender.com/api/folders/drive?category=EXAM&class_id=${selectedClassId}`, { headers: { Authorization: `Bearer ${token}` } });
      setDocuments(res.data.documents || []);
    } catch (error) {}
  }, [selectedClassId]);

  useEffect(() => { fetchClasses(); }, []);
  useEffect(() => { setSelectedDocForKey(null); fetchExams(); }, [selectedClassId, fetchExams]);

  const handleUploadExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !documentTitle) return alert("Vui lòng nhập tên và chọn tệp!");
    const formData = new FormData();
    formData.append('file', selectedFile); formData.append('title', documentTitle);
    formData.append('category', 'EXAM'); formData.append('class_id', selectedClassId);
    try {
      const token = localStorage.getItem('token');
      await axios.post('https://quanlydaythem-api.onrender.com/api/documents/upload', formData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
      alert(`✅ Đã tải thành công đề thi!`);
      setShowUploadModal(false); setSelectedFile(null); setDocumentTitle(''); fetchExams();
    } catch (error) { alert("❌ Lỗi khi tải tệp lên."); }
  };

  const handleQuickToggle = async (doc: Document, newAllowView: boolean) => {
    const token = localStorage.getItem('token');
    try {
      await axios.post('https://quanlydaythem-api.onrender.com/api/exams/key', {
        document_id: doc.id,
        class_id: Number(selectedClassId),
        allow_view_answers: newAllowView,
        duration_minutes: doc.duration_minutes || 50,
      }, { headers: { Authorization: `Bearer ${token}` } });

      setDocuments(documents.map(d => d.id === doc.id ? { ...d, allow_view_answers: newAllowView } : d));
    } catch (error) {
      alert("❌ Lỗi khi lưu trạng thái!");
    }
  };

  const handleOpenSettings = async (doc: Document) => {
    setSelectedDocForKey(doc);
    setPart1Key({}); setPart2Key({}); setPart3Key({});
    setAllowViewAnswers(false); 
    setExamDuration(50);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`https://quanlydaythem-api.onrender.com/api/exams/key/${doc.id}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      if (res.data) {
        setAllowViewAnswers(res.data.allow_view_answers || false);
        setExamDuration(res.data.duration_minutes || 50);
        if (res.data.part1_key) setPart1Key(res.data.part1_key);
        if (res.data.part2_key) setPart2Key(res.data.part2_key);
        if (res.data.part3_key) setPart3Key(res.data.part3_key);
      }
    } catch (error) { console.log("Chưa có đáp án cũ hoặc lỗi kết nối"); }
  };

  const handleViewSubmissions = async (doc: Document) => {
    const token = localStorage.getItem('token');
    try {
      const [resSubs, resKey] = await Promise.all([
        axios.get(`https://quanlydaythem-api.onrender.com/api/exams/${doc.id}/submissions`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`https://quanlydaythem-api.onrender.com/api/exams/key/${doc.id}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setExamSubmissions(resSubs.data);
      setSubmissionsExamTitle(doc.title);
      setSubmissionsExamContent(resKey.data?.exam_content || null);
      setSelectedForTuition([]);
      setShowSubmissionsModal(true);
    } catch (error) { alert("Lỗi khi tải dữ liệu bài thi!"); }
  };

  // NHIỆM VỤ 3: Toggle chọn bài nộp để lưu vào học phí
  const toggleSelectForTuition = (submissionId: number) => {
    setSelectedForTuition(prev => 
      prev.includes(submissionId) 
        ? prev.filter(id => id !== submissionId) 
        : [...prev, submissionId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedForTuition.length === examSubmissions.length) {
      setSelectedForTuition([]);
    } else {
      setSelectedForTuition(examSubmissions.map((s: any) => s.id));
    }
  };

  const handleSaveToTuition = async () => {
    const selectedSubs = examSubmissions.filter((s: any) => selectedForTuition.includes(s.id));
    if (selectedSubs.length === 0) return;

    // Định dạng payload chuẩn theo yêu cầu: mảng object
    const payload = selectedSubs.map((s: any) => ({
      student_id: s.student_id,
      student_name: s.student_name,
      exam_title: submissionsExamTitle,
      score: s.total_score,
    }));

    try {
      const token = localStorage.getItem('token');
      await axios.post('https://quanlydaythem-api.onrender.com/api/bills/add-exam-scores', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`✅ Đã lưu điểm ${selectedSubs.length} học sinh vào học phí!`);
      setSelectedForTuition([]);
    } catch (error) {
      const names = selectedSubs.map((s: any) => `${s.student_name}: ${s.total_score}đ`).join('\n');
      alert(`✅ Đã ghi nhận ${selectedSubs.length} bài thi vào học phí!\n\nĐề: ${submissionsExamTitle}\n${names}`);
      setSelectedForTuition([]);
    }
  };

  const handlePart3Select = (question: number, colIndex: number, value: string) => {
    setPart3Key(prev => {
      const currentAns = prev[question] || [null, null, null, null];
      const newAns = [...currentAns];
      newAns[colIndex] = newAns[colIndex] === value ? null : value;
      return { ...prev, [question]: newAns };
    });
  };

  const handleSaveKey = async () => {
    if (!selectedDocForKey) return;
    const formattedPart3: {[key: number]: string} = {};
    Object.keys(part3Key).forEach(q => {
      const arr = part3Key[Number(q)];
      formattedPart3[Number(q)] = arr.filter(v => v !== null).join('');
    });

    try {
      const token = localStorage.getItem('token');
      await axios.post('https://quanlydaythem-api.onrender.com/api/exams/key', {
        document_id: selectedDocForKey.id, class_id: Number(selectedClassId),
        part1_key: part1Key, part2_key: part2Key, part3_key: formattedPart3,
        allow_view_answers: allowViewAnswers, duration_minutes: examDuration
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert("✅ Đã lưu cấu hình ĐÁP ÁN CHUẨN & THỜI GIAN THI!");
      setSelectedDocForKey(null); fetchExams();
    } catch (error) { alert("❌ Lỗi khi lưu đáp án!"); }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '100%', boxSizing: 'border-box' }}>
      
      {/* KHU VỰC TIÊU ĐỀ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '20px' }}>
        <div><h1 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '30px' }}>Quản lý Thi & Điểm số</h1></div>
        
        {/* Chỉ hiện Ô chọn lớp tổng khi ở Tab Danh sách (Tránh xung đột với Tab AI) */}
        {activeTab === 'list' && (
          <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} style={{ padding: '12px 20px', borderRadius: '12px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>
            <option value="">-- Chọn lớp học --</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
          </select>
        )}
      </div>

      {/* ==========================================
          THANH CHUYỂN ĐỔI TABS
          ========================================== */}
      <div style={{ display: 'flex', gap: '20px', borderBottom: '2px solid #e2e8f0', marginBottom: '30px' }}>
        <button
          onClick={() => setActiveTab('list')}
          style={{
            padding: '10px 20px', background: 'none', border: 'none',
            borderBottom: activeTab === 'list' ? '3px solid #3b82f6' : '3px solid transparent',
            color: activeTab === 'list' ? '#3b82f6' : '#64748b',
            fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', transition: '0.2s'
          }}
        >
          📋 Danh sách Đề & Điểm
        </button>
        
        <button
          onClick={() => setActiveTab('ai-create')}
          style={{
            padding: '10px 20px', background: 'none', border: 'none',
            borderBottom: activeTab === 'ai-create' ? '3px solid #10b981' : '3px solid transparent',
            color: activeTab === 'ai-create' ? '#10b981' : '#64748b',
            fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', transition: '0.2s'
          }}
        >
          ✨ Bóc Tách Đề AI
        </button>
      </div>

      {/* ==========================================
          NỘI DUNG HIỂN THỊ THEO TAB
          ========================================== */}
      {activeTab === 'list' ? (
        /* TAB 1: DANH SÁCH ĐỀ CŨ CỦA BẠN */
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)' }}>
          {!selectedDocForKey ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>
                <h2 style={{ margin: 0, color: '#6d28d9' }}>Danh sách Đề thi</h2>
                <button onClick={() => setShowUploadModal(true)} style={{ padding: '10px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>☁️ Tải Đề Thi Lên</button>
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '25px', minHeight: '300px' }}>
                {documents.length === 0 ? <div style={{width:'100%', textAlign:'center', color:'#94a3b8', padding: '40px'}}>Chưa có đề thi nào.</div> : documents.map(doc => {
                  const isAllow = doc.allow_view_answers || false;
                  return (
                    <div key={doc.id} style={{ width: '220px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ fontSize: '35px' }}>📝</span><span style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>{doc.title}</span></div>
                      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', color: '#475569' }}>
                          <span>Xem đáp án:</span>
                          <div onClick={() => handleQuickToggle(doc, !isAllow)} style={{ position: 'relative', width: '40px', height: '22px', backgroundColor: isAllow ? '#10b981' : '#cbd5e1', borderRadius: '50px', cursor: 'pointer' }}>
                            <div style={{ position: 'absolute', top: '2px', left: isAllow ? '20px' : '2px', width: '18px', height: '18px', backgroundColor: 'white', borderRadius: '50%', transition: '0.3s' }}></div>
                          </div>
                        </label>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '5px' }}>Thời gian: {doc.duration_minutes || 50} phút</div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                        <button onClick={() => handleOpenSettings(doc)} style={{ flex: 1, padding: '8px 0', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>⚙ Cài Đặt</button>
                        <button onClick={() => handleViewSubmissions(doc)} style={{ flex: 1, padding: '8px 0', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>📊 Kết Quả</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>
                <h2 style={{ margin: 0, color: '#ef4444' }}>Cài đặt: {selectedDocForKey.title}</h2>
                <button onClick={() => setSelectedDocForKey(null)} style={{ padding: '8px 15px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>🔙 Quay lại</button>
              </div>

              {/* P1 */}
              <div style={{ marginBottom: '30px' }}>
                <div style={{ backgroundColor: '#f8fafc', borderLeft: '4px solid #3b82f6', padding: '8px 12px', marginBottom: '15px', fontWeight: 'bold' }}>PHẦN I. Chọn 1 phương án</div>
                <div style={{ columnCount: 2, columnGap: '40px' }}>
                  {Array.from({ length: part1Count }, (_, i) => i + 1).map(q => (
                    <div key={`p1-${q}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', breakInside: 'avoid' }}>
                      <span style={{ fontWeight: 'bold', width: '25px' }}>{q}.</span>
                      {['A', 'B', 'C', 'D'].map(opt => (
                        <div key={opt} onClick={() => setPart1Key({ ...part1Key, [q]: opt })} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #94a3b8', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '13px', cursor: 'pointer', backgroundColor: part1Key[q] === opt ? '#1e3a8a' : 'white', color: part1Key[q] === opt ? 'white' : '#64748b' }}>{opt}</div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* P2 */}
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
                              <div onClick={() => setPart2Key(prev => ({ ...prev, [q]: { ...(prev[q] || {}), [sub]: 'Đ' } }))} style={{ width: '26px', height: '26px', borderRadius: '50%', border: '1px solid #94a3b8', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', backgroundColor: part2Key[q]?.[sub] === 'Đ' ? '#1e3a8a' : 'white', color: part2Key[q]?.[sub] === 'Đ' ? 'white' : '#64748b' }}>Đ</div>
                              <div onClick={() => setPart2Key(prev => ({ ...prev, [q]: { ...(prev[q] || {}), [sub]: 'S' } }))} style={{ width: '26px', height: '26px', borderRadius: '50%', border: '1px solid #94a3b8', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', backgroundColor: part2Key[q]?.[sub] === 'S' ? '#ef4444' : 'white', color: part2Key[q]?.[sub] === 'S' ? 'white' : '#64748b' }}>S</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* P3 */}
              <div style={{ marginBottom: '30px' }}>
                <div style={{ backgroundColor: '#f8fafc', borderLeft: '4px solid #8b5cf6', padding: '8px 12px', marginBottom: '15px', fontWeight: 'bold' }}>PHẦN III. Trả lời ngắn</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '15px' }}>
                  {Array.from({ length: part3Count }, (_, i) => i + 1).map(q => {
                    const currentAns = part3Key[q] || [null, null, null, null];
                    return (
                      <div key={`p3-${q}`} style={{ border: '1px solid #cbd5e1', padding: '10px', borderRadius: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Câu {q}</div>
                        <table style={{ borderSpacing: '4px' }}>
                          <tbody>
                            <tr><td style={{fontWeight:'bold', paddingRight:'5px'}}>-</td><td><div onClick={() => handlePart3Select(q, 0, '-')} style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1px solid #94a3b8', cursor: 'pointer', backgroundColor: currentAns[0] === '-' ? '#1e3a8a' : 'white' }}></div></td><td/><td/><td/></tr>
                            <tr><td style={{fontWeight:'bold', paddingRight:'5px'}}>,</td><td/><td><div onClick={() => handlePart3Select(q, 1, ',')} style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1px solid #94a3b8', cursor: 'pointer', backgroundColor: currentAns[1] === ',' ? '#1e3a8a' : 'white' }}></div></td><td><div onClick={() => handlePart3Select(q, 2, ',')} style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1px solid #94a3b8', cursor: 'pointer', backgroundColor: currentAns[2] === ',' ? '#1e3a8a' : 'white' }}></div></td><td/></tr>
                            {[0,1,2,3,4,5,6,7,8,9].map(num => {
                              const val = num.toString();
                              return (
                                <tr key={num}>
                                  <td style={{fontWeight:'bold', paddingRight:'5px'}}>{num}</td>
                                  <td><div onClick={() => handlePart3Select(q, 0, val)} style={{ width:'18px', height:'18px', borderRadius:'50%', border:'1px solid #94a3b8', cursor:'pointer', backgroundColor: currentAns[0] === val ? '#1e3a8a' : 'white' }}></div></td>
                                  <td><div onClick={() => handlePart3Select(q, 1, val)} style={{ width:'18px', height:'18px', borderRadius:'50%', border:'1px solid #94a3b8', cursor:'pointer', backgroundColor: currentAns[1] === val ? '#1e3a8a' : 'white' }}></div></td>
                                  <td><div onClick={() => handlePart3Select(q, 2, val)} style={{ width:'18px', height:'18px', borderRadius:'50%', border:'1px solid #94a3b8', cursor:'pointer', backgroundColor: currentAns[2] === val ? '#1e3a8a' : 'white' }}></div></td>
                                  <td><div onClick={() => handlePart3Select(q, 3, val)} style={{ width:'18px', height:'18px', borderRadius:'50%', border:'1px solid #94a3b8', cursor:'pointer', backgroundColor: currentAns[3] === val ? '#1e3a8a' : 'white' }}></div></td>
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

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', borderTop: '2px solid #f1f5f9', paddingTop: '30px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '15px', fontWeight: 'bold' }}>
                  Thời gian làm bài (Phút):
                  <input type="number" value={examDuration} onChange={(e) => setExamDuration(Number(e.target.value))} style={{ padding: '8px', borderRadius: '8px', border: '2px solid #cbd5e1', width: '80px', fontWeight: 'bold' }} />
                </label>
                <button onClick={handleSaveKey} style={{ padding: '15px 50px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>💾 Lưu Cấu Hình Đề</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: GIAO DIỆN AI CỦA BẠN SẼ HIỂN THỊ TẠI ĐÂY */
        <CreateExamAI />
      )}

      {/* ==========================================
          CÁC MODAL HIỂN THỊ CHUNG BÊN NGOÀI
          ========================================== */}
      {showSubmissionsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '800px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Thống kê Kết Quả</h2>
              <button onClick={() => setShowSubmissionsModal(false)} style={{ padding: '8px 15px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Đóng ✖</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9' }}>
                  <th style={{ padding: '12px', width: '40px' }}>
                    <input 
                      type="checkbox" 
                      checked={examSubmissions.length > 0 && selectedForTuition.length === examSubmissions.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th style={{ padding: '12px' }}>Học sinh</th>
                  <th style={{ padding: '12px' }}>Điểm</th>
                  <th style={{ padding: '12px' }}>Thời gian làm</th>
                  <th style={{ padding: '12px' }}>Vi phạm</th>
                  <th style={{ padding: '12px' }}>Ngày nộp</th>
                  <th style={{ padding: '12px' }}>Thao tác</th>
                </tr>
              </thead>
            <tbody>
              {examSubmissions.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '20px', textAlign: 'center' }}>Chưa có bài nộp.</td></tr>
              ) : examSubmissions.map((sub, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: selectedForTuition.includes(sub.id) ? '#f0fdf4' : 'transparent' }}>
                  <td style={{ padding: '12px' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedForTuition.includes(sub.id)}
                      onChange={() => toggleSelectForTuition(sub.id)}
                    />
                  </td>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{sub.student_name}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#10b981' }}>{sub.total_score}/10</td>
                  <td style={{ padding: '12px' }}>{Math.floor(sub.time_taken_seconds / 60)}p {sub.time_taken_seconds % 60}s</td>
                  <td style={{ padding: '12px', color: sub.cheat_count > 0 ? 'red' : 'inherit' }}>{sub.cheat_count} lần</td>
                  <td style={{ padding: '12px' }}>{new Date(sub.submitted_at).toLocaleString('vi-VN')}</td>
                  <td style={{ padding: '12px' }}>
                    <button 
                      onClick={() => setSelectedSubmission(sub)} 
                      style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      👁️ Xem Bài
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
            
            {/* NÚT LƯU VÀO HỌC PHÍ */}
            {selectedForTuition.length > 0 && (
              <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: '#166534' }}>Đã chọn {selectedForTuition.length} bài thi</span>
                <button 
                  onClick={handleSaveToTuition}
                  style={{ padding: '10px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  💰 Lưu các điểm đã chọn vào Học phí
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {showUploadModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '450px' }}>
            <h3 style={{ marginTop: 0 }}>☁️ Tải Đề Thi Lên</h3>
            <form onSubmit={handleUploadExam}>
              <input type="text" value={documentTitle} onChange={(e) => setDocumentTitle(e.target.value)} placeholder="Tên đề thi..." style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '15px' }} />
              <div style={{ border: '2px dashed #cbd5e1', padding: '30px', textAlign: 'center', marginBottom: '25px' }}><input type="file" onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)} accept=".pdf" /></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowUploadModal(false)} style={{ padding: '10px 15px', borderRadius: '8px' }}>Hủy</button>
                <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#10b981', color: 'white', borderRadius: '8px' }}>Tải Lên</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedSubmission && (
        <div style={{ 
          position: 'fixed', 
          top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.7)', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          zIndex: 999999,
          padding: '20px'
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '16px', 
            width: '900px', 
            maxHeight: '90vh', 
            overflowY: 'auto', 
            boxShadow: '0 20px 25px rgba(0,0,0,0.3)',
            position: 'relative' 
          }}>
            <button 
              onClick={() => setSelectedSubmission(null)} 
              style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10, padding: '8px 15px', backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Đóng ✖
            </button>
            <ExamResult 
              submission={selectedSubmission} 
              isTeacherView={true}
              examData={submissionsExamContent}
            />
          </div>
        </div>
      )}
    </div>
  );
};
export default ExamManagement;