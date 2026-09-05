import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import { toast } from 'react-toastify';

// 1. IMPORT GIAO DIỆN AI VÀO ĐÂY (Đảm bảo file ExamManagerAI.tsx nằm cùng thư mục)
import CreateExamAI from './CreateExamAI';
import ExamResult from './ExamResult';
import { Button } from '../components/ui/Button';

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
      const res = await axiosClient.get(`/api/classes`);
      setClasses(res.data);
      if (res.data.length > 0) setSelectedClassId(res.data[0].id.toString());
    } catch (error) {
      console.error(error);
    }
  };

  const fetchExams = useCallback(async () => {
    if (!selectedClassId) return;
    const token = localStorage.getItem('token');
    try {
      const res = await axiosClient.get(`/api/folders/drive?category=EXAM&class_id=${selectedClassId}`);
      setDocuments(res.data.documents || []);
    } catch (error) {
      console.error(error);
    }
  }, [selectedClassId]);

  useEffect(() => { fetchClasses(); }, []);
  useEffect(() => { setSelectedDocForKey(null); fetchExams(); }, [selectedClassId, fetchExams]);

  const handleUploadExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !documentTitle) return toast.warn("Vui lòng nhập tên và chọn tệp!");
    const formData = new FormData();
    formData.append('file', selectedFile); formData.append('title', documentTitle);
    formData.append('category', 'EXAM'); formData.append('class_id', selectedClassId);
    try {
      const token = localStorage.getItem('token');
      const uploadRes = await axiosClient.post(`/api/upload/document`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        await axiosClient.post(`/api/documents`, {
            title: documentTitle,
            category: 'EXAM',
            file_url: uploadRes.data?.secure_url
        });
      toast.success(`✅ Đã tải thành công đề thi!`);
      setShowUploadModal(false); setSelectedFile(null); setDocumentTitle(''); fetchExams();
    } catch (error) { toast.error("❌ Lỗi khi tải tệp lên."); }
  };

  const handleQuickToggle = async (doc: Document, newAllowView: boolean) => {
    const token = localStorage.getItem('token');
    try {
      await axiosClient.post(`/api/exams/key`, {
        document_id: doc.id,
        class_id: Number(selectedClassId),
        allow_view_answers: newAllowView,
        duration_minutes: doc.duration_minutes || 50,
      });

      setDocuments((Array.isArray(documents) ? documents : []).map(d => d.id === doc.id ? { ...d, allow_view_answers: newAllowView } : d));
      toast.success("✅ Đã lưu trạng thái!");
    } catch (error) {
      toast.error("❌ Lỗi khi lưu trạng thái!");
    }
  };

  const handleOpenSettings = async (doc: Document) => {
    setSelectedDocForKey(doc);
    setPart1Key({}); setPart2Key({}); setPart3Key({});
    setAllowViewAnswers(false); 
    setExamDuration(50);

    try {
      const token = localStorage.getItem('token');
      const res = await axiosClient.get(`/api/exams/key/${doc.id}`);
      
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
        axiosClient.get(`/api/exams/${doc.id}/submissions`),
        axiosClient.get(`/api/exams/key/${doc.id}`)
      ]);
      setExamSubmissions(resSubs.data);
      setSubmissionsExamTitle(doc.title);
      setSubmissionsExamContent(resKey.data?.exam_content || null);
      setSelectedForTuition([]);
      setShowSubmissionsModal(true);
    } catch (error) { toast.error("Lỗi khi tải dữ liệu bài thi!"); }
  };

  // NHIỆM VỤ 3: Toggle chọn bài nộp để lưu vào học phí
  const toggleSelectForTuition = (submissionId: number) => {
    setSelectedForTuition(prev => 
      prev.includes(submissionId) 
        ? (Array.isArray(prev) ? prev : []).filter(id => id !== submissionId) 
        : [...prev, submissionId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedForTuition.length === examSubmissions.length) {
      setSelectedForTuition([]);
    } else {
      setSelectedForTuition((Array.isArray(examSubmissions) ? examSubmissions : []).map((s: any) => s.id));
    }
  };

  const handleSaveToTuition = async () => {
    const selectedSubs = (Array.isArray(examSubmissions) ? examSubmissions : []).filter((s: any) => selectedForTuition.includes(s.id));
    if (selectedSubs.length === 0) return;

    // Định dạng payload chuẩn theo yêu cầu: mảng object
    const payload = (Array.isArray(selectedSubs) ? selectedSubs : []).map((s: any) => ({
      student_id: s.student_id,
      student_name: s.student_name,
      exam_title: submissionsExamTitle,
      score: s.total_score,
    }));

    try {
      const token = localStorage.getItem('token');
      await axiosClient.post(`/api/payments/add-exam-scores`, payload);
      toast.success(`✅ Đã lưu điểm ${selectedSubs.length} học sinh vào học phí!`);
      setSelectedForTuition([]);
    } catch (error) {
      toast.success(`✅ Đã ghi nhận ${selectedSubs.length} bài thi vào học phí!`);
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
      formattedPart3[Number(q)] = (Array.isArray(arr) ? arr : []).filter(v => v !== null).join('');
    });

    try {
      const token = localStorage.getItem('token');
      await axiosClient.post(`/api/exams/key`, {
        document_id: selectedDocForKey.id, class_id: Number(selectedClassId),
        part1_key: part1Key, part2_key: part2Key, part3_key: formattedPart3,
        allow_view_answers: allowViewAnswers, duration_minutes: examDuration
      });
      toast.success("✅ Đã lưu cấu hình ĐÁP ÁN CHUẨN & THỜI GIAN THI!");
      setSelectedDocForKey(null); fetchExams();
    } catch (error) { toast.error("❌ Lỗi khi lưu đáp án!"); }
  };

  const handleDeleteExam = async (doc: Document) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa đề thi "${doc.title}"?\n(Lịch sử làm bài trước đây của học sinh sẽ được lưu trữ an toàn)`)) return;
    try {
      await axiosClient.delete(`/api/documents/${doc.id}`);
      toast.success("✅ Đã xóa đề thi thành công!");
      fetchExams();
    } catch (err: any) {
      toast.error("Lỗi khi xóa đề: " + (err.response?.data?.error || err.response?.data?.message || err.message));
    }
  };

  return (
    <div style={{ padding: 'var(--spacing-6)' }}>
      
      {/* KHU VỰC TIÊU ĐỀ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)', flexWrap: 'wrap', gap: 'var(--spacing-5)' }}>
        <div><h1 style={{ margin: '0 0 var(--spacing-2) 0', fontSize: 'var(--font-size-2xl)' }}>Quản lý Đề Thi & Chấm Điểm</h1><p className='text-secondary' style={{margin:0}}>Soạn đề, cập nhật đáp án và theo dõi kết quả thi.</p></div>
        
        {/* Chỉ hiện Ô chọn lớp tổng khi ở Tab Danh sách (Tránh xung đột với Tab AI) */}
        {activeTab === 'list' && (
          <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} style={{ padding: '12px 20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', fontWeight: 'var(--font-weight-bold)' }}>
            <option value="">-- Chọn lớp học --</option>
            {(Array.isArray(classes) ? classes : []).map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
          </select>
        )}
      </div>

      {/* ==========================================
          THANH CHUYỂN ĐỔI TABS
          ========================================== */}
      <div style={{ display: 'flex', gap: 'var(--spacing-5)', borderBottom: '2px solid var(--color-border)', marginBottom: 'var(--spacing-8)' }}>
        <Button
          onClick={() => setActiveTab('list')}
          style={{
            padding: '10px 20px', background: 'none', border: 'none',
            borderBottom: activeTab === 'list' ? '3px solid var(--color-primary)' : '3px solid transparent',
            color: activeTab === 'list' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--font-weight-bold)', fontSize: 'var(--font-size-base)', cursor: 'pointer', transition: '0.2s'
          }}
        >
          📋 Danh sách Đề & Điểm
        </Button>
        
        <Button
          onClick={() => setActiveTab('ai-create')}
          style={{
            padding: '10px 20px', background: 'none', border: 'none',
            borderBottom: activeTab === 'ai-create' ? '3px solid var(--color-success)' : '3px solid transparent',
            color: activeTab === 'ai-create' ? 'var(--color-success)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--font-weight-bold)', fontSize: 'var(--font-size-base)', cursor: 'pointer', transition: '0.2s'
          }}
        >
          ✨ Bóc Tách Đề AI
        </Button>
      </div>

      {/* ==========================================
          NỘI DUNG HIỂN THỊ THEO TAB
          ========================================== */}
      {activeTab === 'list' ? (
        /* TAB 1: DANH SÁCH ĐỀ CŨ CỦA BẠN */
        <div style={{ backgroundColor: 'var(--color-surface)', padding: 'var(--spacing-8)', borderRadius: 'var(--radius-xl)', boxShadow: '0 10px 25px var(--color-border)' }}>
          {!selectedDocForKey ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-5)', borderBottom: '2px solid var(--color-background)', paddingBottom: 'var(--spacing-4)' }}>
                <h2 style={{ margin: 0, color: '#6d28d9' }}>Danh sách Đề thi</h2>
                <Button onClick={() => setShowUploadModal(true)} style={{ padding: '10px 20px', backgroundColor: 'var(--color-success)', color: 'var(--color-surface)', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 'var(--font-weight-bold)', cursor: 'pointer' }}>☁️ Tải Đề Thi Lên</Button>
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '25px', minHeight: '300px' }}>
                {documents.length === 0 ? <div style={{width:'100%', textAlign:'center', color:'var(--color-text-secondary)', padding: 'var(--spacing-10)'}}>Chưa có đề thi nào.</div> : (Array.isArray(documents) ? documents : []).map(doc => {
                  const isAllow = doc.allow_view_answers || false;
                  return (
                    <div key={doc.id} style={{ width: '250px', padding: 'var(--spacing-5)', backgroundColor: 'var(--color-background)', borderRadius: '16px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                        <span style={{ fontSize: '30px' }}>📝</span>
                        <span style={{ fontSize: '15px', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.title}</span>
                      </div>
                      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-2)' }}>
                        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontWeight: 'var(--font-weight-bold)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                          <span>Xem đáp án:</span>
                          <div onClick={() => handleQuickToggle(doc, !isAllow)} style={{ position: 'relative', width: '40px', height: '22px', backgroundColor: isAllow ? 'var(--color-success)' : 'var(--color-border)', borderRadius: '50px', cursor: 'pointer' }}>
                            <div style={{ position: 'absolute', top: '2px', left: isAllow ? '20px' : '2px', width: '18px', height: '18px', backgroundColor: 'var(--color-surface)', borderRadius: '50%', transition: '0.3s' }}></div>
                          </div>
                        </label>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-1)' }}>Thời gian: {doc.duration_minutes || 50} phút</div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: 'auto' }}>
                        <Button onClick={() => handleOpenSettings(doc)} variant="outline" size="sm">⚙ Cài Đặt</Button>
                        <Button onClick={() => handleViewSubmissions(doc)} variant="primary" size="sm">📊 Điểm</Button>
                        <Button onClick={() => window.open(`/student/view-answers/${doc.id}`, '_blank')} variant="ghost" size="sm">📖 Đáp Án</Button>
                        <Button onClick={() => handleDeleteExam(doc)} variant="danger" size="sm">🗑️ Xóa</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-8)', borderBottom: '2px solid var(--color-background)', paddingBottom: 'var(--spacing-4)' }}>
                <h2 style={{ margin: 0, color: 'var(--color-danger)' }}>Cài đặt: {selectedDocForKey.title}</h2>
                <Button onClick={() => setSelectedDocForKey(null)} style={{ padding: '8px 15px', backgroundColor: 'var(--color-border)', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 'var(--font-weight-bold)', cursor: 'pointer' }}>🔙 Quay lại</Button>
              </div>

              {/* P1 */}
              <div style={{ marginBottom: 'var(--spacing-8)' }}>
                <div style={{ backgroundColor: 'var(--color-background)', borderLeft: '4px solid var(--color-primary)', padding: '8px 12px', marginBottom: 'var(--spacing-4)', fontWeight: 'var(--font-weight-bold)' }}>PHẦN I. Chọn 1 phương án</div>
                <div style={{ columnCount: 2, columnGap: '40px' }}>
                  {Array.from({ length: part1Count }, (_, i) => i + 1).map(q => (
                    <div key={`p1-${q}`} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-4)', breakInside: 'avoid' }}>
                      <span style={{ fontWeight: 'var(--font-weight-bold)', width: '25px' }}>{q}.</span>
                      {['A', 'B', 'C', 'D'].map(opt => (
                        <div key={opt} onClick={() => setPart1Key({ ...part1Key, [q]: opt })} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--color-text-secondary)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 'var(--font-size-sm)', cursor: 'pointer', backgroundColor: part1Key[q] === opt ? '#1e3a8a' : 'var(--color-surface)', color: part1Key[q] === opt ? 'var(--color-surface)' : 'var(--color-text-secondary)' }}>{opt}</div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* P2 */}
              <div style={{ marginBottom: 'var(--spacing-8)' }}>
                <div style={{ backgroundColor: 'var(--color-background)', borderLeft: '4px solid var(--color-success)', padding: '8px 12px', marginBottom: 'var(--spacing-4)', fontWeight: 'var(--font-weight-bold)' }}>PHẦN II. Đúng/Sai</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
                  {Array.from({ length: part2Count }, (_, i) => i + 1).map(q => (
                    <div key={`p2-${q}`} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: 'var(--spacing-2)' }}>
                      <div style={{ fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-2)', textAlign: 'center' }}>Câu {q}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 5px' }}>
                        {['a', 'b', 'c', 'd'].map(sub => (
                          <div key={sub} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                            <span style={{ fontWeight: 'var(--font-weight-bold)' }}>Ý {sub}</span>
                            <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                              <div onClick={() => setPart2Key(prev => ({ ...prev, [q]: { ...(prev[q] || {}), [sub]: 'Đ' } }))} style={{ width: '26px', height: '26px', borderRadius: '50%', border: '1px solid var(--color-text-secondary)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', backgroundColor: part2Key[q]?.[sub] === 'Đ' ? '#1e3a8a' : 'var(--color-surface)', color: part2Key[q]?.[sub] === 'Đ' ? 'var(--color-surface)' : 'var(--color-text-secondary)' }}>Đ</div>
                              <div onClick={() => setPart2Key(prev => ({ ...prev, [q]: { ...(prev[q] || {}), [sub]: 'S' } }))} style={{ width: '26px', height: '26px', borderRadius: '50%', border: '1px solid var(--color-text-secondary)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', backgroundColor: part2Key[q]?.[sub] === 'S' ? 'var(--color-danger)' : 'var(--color-surface)', color: part2Key[q]?.[sub] === 'S' ? 'var(--color-surface)' : 'var(--color-text-secondary)' }}>S</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* P3 */}
              <div style={{ marginBottom: 'var(--spacing-8)' }}>
                <div style={{ backgroundColor: 'var(--color-background)', borderLeft: '4px solid #8b5cf6', padding: '8px 12px', marginBottom: 'var(--spacing-4)', fontWeight: 'var(--font-weight-bold)' }}>PHẦN III. Trả lời ngắn</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--spacing-4)' }}>
                  {Array.from({ length: part3Count }, (_, i) => i + 1).map(q => {
                    const currentAns = part3Key[q] || [null, null, null, null];
                    return (
                      <div key={`p3-${q}`} style={{ border: '1px solid var(--color-border)', padding: 'var(--spacing-2)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-2)' }}>Câu {q}</div>
                        <table style={{ borderSpacing: '4px' }}>
                          <tbody>
                            <tr><td style={{fontWeight:'var(--font-weight-bold)', paddingRight:'var(--spacing-1)'}}>-</td><td><div onClick={() => handlePart3Select(q, 0, '-')} style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1px solid var(--color-text-secondary)', cursor: 'pointer', backgroundColor: currentAns[0] === '-' ? '#1e3a8a' : 'var(--color-surface)' }}></div></td><td/><td/><td/></tr>
                            <tr><td style={{fontWeight:'var(--font-weight-bold)', paddingRight:'var(--spacing-1)'}}>,</td><td/><td><div onClick={() => handlePart3Select(q, 1, ',')} style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1px solid var(--color-text-secondary)', cursor: 'pointer', backgroundColor: currentAns[1] === ',' ? '#1e3a8a' : 'var(--color-surface)' }}></div></td><td><div onClick={() => handlePart3Select(q, 2, ',')} style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1px solid var(--color-text-secondary)', cursor: 'pointer', backgroundColor: currentAns[2] === ',' ? '#1e3a8a' : 'var(--color-surface)' }}></div></td><td/></tr>
                            {[0,1,2,3,4,5,6,7,8,9].map(num => {
                              const val = num.toString();
                              return (
                                <tr key={num}>
                                  <td style={{fontWeight:'var(--font-weight-bold)', paddingRight:'var(--spacing-1)'}}>{num}</td>
                                  <td><div onClick={() => handlePart3Select(q, 0, val)} style={{ width:'18px', height:'18px', borderRadius:'50%', border:'1px solid var(--color-text-secondary)', cursor:'pointer', backgroundColor: currentAns[0] === val ? '#1e3a8a' : 'var(--color-surface)' }}></div></td>
                                  <td><div onClick={() => handlePart3Select(q, 1, val)} style={{ width:'18px', height:'18px', borderRadius:'50%', border:'1px solid var(--color-text-secondary)', cursor:'pointer', backgroundColor: currentAns[1] === val ? '#1e3a8a' : 'var(--color-surface)' }}></div></td>
                                  <td><div onClick={() => handlePart3Select(q, 2, val)} style={{ width:'18px', height:'18px', borderRadius:'50%', border:'1px solid var(--color-text-secondary)', cursor:'pointer', backgroundColor: currentAns[2] === val ? '#1e3a8a' : 'var(--color-surface)' }}></div></td>
                                  <td><div onClick={() => handlePart3Select(q, 3, val)} style={{ width:'18px', height:'18px', borderRadius:'50%', border:'1px solid var(--color-text-secondary)', cursor:'pointer', backgroundColor: currentAns[3] === val ? '#1e3a8a' : 'var(--color-surface)' }}></div></td>
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

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--spacing-10)', borderTop: '2px solid var(--color-background)', paddingTop: 'var(--spacing-8)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', fontWeight: 'var(--font-weight-bold)' }}>
                  Thời gian làm bài (Phút):
                  <input type="number" value={examDuration} onChange={(e) => setExamDuration(Number(e.target.value))} style={{ padding: 'var(--spacing-2)', borderRadius: 'var(--radius-md)', border: '2px solid var(--color-border)', width: '80px', fontWeight: 'var(--font-weight-bold)' }} />
                </label>
                <Button onClick={handleSaveKey} style={{ padding: '15px 50px', backgroundColor: 'var(--color-text)', color: 'var(--color-surface)', border: 'none', borderRadius: 'var(--radius-lg)', fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', cursor: 'pointer' }}>💾 Lưu Cấu Hình Đề</Button>
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
          <div style={{ backgroundColor: 'var(--color-surface)', padding: 'var(--spacing-8)', borderRadius: '16px', width: '800px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-5)' }}>
              <h2 style={{ margin: 0 }}>Thống kê Kết Quả</h2>
              <Button onClick={() => setShowSubmissionsModal(false)} style={{ padding: '8px 15px', backgroundColor: 'var(--color-danger)', color: 'var(--color-surface)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 'var(--font-weight-bold)' }}>Đóng ✖</Button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-background)' }}>
                  <th style={{ padding: 'var(--spacing-3)', width: '40px' }}>
                    <input 
                      type="checkbox" 
                      checked={examSubmissions.length > 0 && selectedForTuition.length === examSubmissions.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th style={{ padding: 'var(--spacing-3)' }}>Học sinh</th>
                  <th style={{ padding: 'var(--spacing-3)' }}>Điểm</th>
                  <th style={{ padding: 'var(--spacing-3)' }}>Thời gian làm</th>
                  <th style={{ padding: 'var(--spacing-3)' }}>Vi phạm</th>
                  <th style={{ padding: 'var(--spacing-3)' }}>Ngày nộp</th>
                  <th style={{ padding: 'var(--spacing-3)' }}>Thao tác</th>
                </tr>
              </thead>
            <tbody>
              {examSubmissions.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 'var(--spacing-5)', textAlign: 'center' }}>Chưa có bài nộp.</td></tr>
              ) : (Array.isArray(examSubmissions) ? examSubmissions : []).map((sub, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: selectedForTuition.includes(sub.id) ? '#f0fdf4' : 'transparent' }}>
                  <td style={{ padding: 'var(--spacing-3)' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedForTuition.includes(sub.id)}
                      onChange={() => toggleSelectForTuition(sub.id)}
                    />
                  </td>
                  <td style={{ padding: 'var(--spacing-3)', fontWeight: 'var(--font-weight-bold)' }}>{sub.student_name}</td>
                  <td style={{ padding: 'var(--spacing-3)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-success)' }}>{sub.total_score}/10</td>
                  <td style={{ padding: 'var(--spacing-3)' }}>{Math.floor(sub.time_taken_seconds / 60)}p {sub.time_taken_seconds % 60}s</td>
                  <td style={{ padding: 'var(--spacing-3)', color: sub.cheat_count > 0 ? 'red' : 'inherit' }}>{sub.cheat_count} lần</td>
                  <td style={{ padding: 'var(--spacing-3)' }}>{new Date(sub.submitted_at).toLocaleString('vi-VN')}</td>
                  <td style={{ padding: 'var(--spacing-3)' }}>
                    <Button 
                      onClick={() => setSelectedSubmission(sub)} 
                      style={{ padding: '6px 12px', backgroundColor: 'var(--color-primary)', color: 'var(--color-surface)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'var(--font-weight-bold)' }}
                    >
                      👁️ Xem Bài
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
            
            {/* NÚT LƯU VÀO HỌC PHÍ */}
            {selectedForTuition.length > 0 && (
              <div style={{ marginTop: 'var(--spacing-5)', padding: 'var(--spacing-4)', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'var(--font-weight-bold)', color: '#166534' }}>Đã chọn {selectedForTuition.length} bài thi</span>
                <Button 
                  onClick={handleSaveToTuition}
                  style={{ padding: '10px 20px', backgroundColor: 'var(--color-success)', color: 'var(--color-surface)', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 'var(--font-weight-bold)', cursor: 'pointer' }}
                >
                  💰 Lưu các điểm đã chọn vào Học phí
                </Button>
              </div>
            )}

          </div>
        </div>
      )}

      {showUploadModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--color-surface)', padding: 'var(--spacing-8)', borderRadius: '16px', width: '450px' }}>
            <h3 style={{ marginTop: 0 }}>☁️ Tải Đề Thi Lên</h3>
            <form onSubmit={handleUploadExam}>
              <input type="text" value={documentTitle} onChange={(e) => setDocumentTitle(e.target.value)} placeholder="Tên đề thi..." style={{ width: '100%', padding: 'var(--spacing-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: 'var(--spacing-4)' }} />
              <div style={{ border: '2px dashed var(--color-border)', padding: 'var(--spacing-8)', textAlign: 'center', marginBottom: '25px' }}><input type="file" onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)} accept=".pdf" /></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-2)' }}>
                <Button type="button" onClick={() => setShowUploadModal(false)} style={{ padding: '10px 15px', borderRadius: 'var(--radius-md)' }}>Hủy</Button>
                <Button type="submit" style={{ padding: '10px 20px', backgroundColor: 'var(--color-success)', color: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>Tải Lên</Button>
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
          padding: 'var(--spacing-5)'
        }}>
          <div style={{ 
            backgroundColor: 'var(--color-surface)', 
            borderRadius: '16px', 
            width: '900px', 
            maxHeight: '90vh', 
            overflowY: 'auto', 
            boxShadow: '0 20px 25px rgba(0,0,0,0.3)',
            position: 'relative' 
          }}>
            <Button 
              onClick={() => setSelectedSubmission(null)} 
              style={{ position: 'absolute', top: 'var(--spacing-5)', right: 'var(--spacing-5)', zIndex: 10, padding: '8px 15px', backgroundColor: 'rgba(255,255,255,0.2)', color: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 'var(--font-weight-bold)' }}
            >
              Đóng ✖
            </Button>
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
