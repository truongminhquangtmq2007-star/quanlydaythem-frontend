import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import { toast } from 'react-toastify';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';

interface Document { 
  id: number; 
  title: string; 
  file_url: string; 
  allow_view_answers?: boolean; 
  duration_minutes?: number;
  part1_key?: Record<string, string>;
  part2_key?: Record<string, Record<string, string>>;
  part3_key?: Record<string, string>;
}

const ExamManagement: React.FC = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentTitle, setDocumentTitle] = useState('');
  const [uploading, setUploading] = useState(false);

  // Unified Config Modal state (Gộp Cài đặt + Đáp án + allow_view_answers)
  const part1Count = 40; 
  const part2Count = 4; 
  const part3Count = 6;
  const [selectedDocForConfig, setSelectedDocForConfig] = useState<Document | null>(null);
  const [part1Key, setPart1Key] = useState<{ [key: number]: string }>({});
  const [part2Key, setPart2Key] = useState<{ [key: number]: { [sub: string]: string } }>({});
  const [part3Key, setPart3Key] = useState<{ [key: number]: (string | null)[] }>({});
  const [allowViewAnswers, setAllowViewAnswers] = useState(false);
  const [examDuration, setExamDuration] = useState<number>(50);
  const [savingConfig, setSavingConfig] = useState(false);

  // Modal Kết quả bài nộp
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [examSubmissions, setExamSubmissions] = useState<any[]>([]);
  const [submissionsExamTitle, setSubmissionsExamTitle] = useState('');
  const [selectedForTuition, setSelectedForTuition] = useState<number[]>([]);

  // Modal xác nhận xóa an toàn qua hộp thoại in-app
  const [deleteConfirmDoc, setDeleteConfirmDoc] = useState<Document | null>(null);
  const [deletingExam, setDeletingExam] = useState(false);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await axiosClient.get('/api/classes');
      setClasses(res.data);
      if (res.data.length > 0 && !selectedClassId) {
        setSelectedClassId(res.data[0].id.toString());
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách lớp:', error);
    }
  }, [selectedClassId]);

  const fetchExams = useCallback(async () => {
    if (!selectedClassId) return;
    setLoading(true);
    try {
      const res = await axiosClient.get(`/api/folders/drive?category=EXAM&class_id=${selectedClassId}`);
      setDocuments(res.data.documents || []);
    } catch (error) {
      console.error('Lỗi khi tải danh sách đề thi:', error);
      toast.error('Lỗi tải danh sách đề thi');
    } finally {
      setLoading(false);
    }
  }, [selectedClassId]);

  useEffect(() => { 
    fetchClasses(); 
  }, [fetchClasses]);

  useEffect(() => { 
    fetchExams(); 
  }, [selectedClassId, fetchExams]);

  const selectedClass = classes.find(c => c.id.toString() === selectedClassId);

  // 1. TẢI ĐỀ THI LÊN
  const handleUploadExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !documentTitle.trim()) {
      return toast.warn("Vui lòng nhập tên đề thi và chọn tệp!");
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile); 
    formData.append('title', documentTitle.trim());
    formData.append('category', 'EXAM'); 
    formData.append('class_id', selectedClassId);

    try {
      const uploadRes = await axiosClient.post('/api/upload/document', formData, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      await axiosClient.post('/api/documents', {
        title: documentTitle.trim(),
        category: 'EXAM',
        file_url: uploadRes.data?.secure_url
      });
      toast.success('✅ Đã tải thành công đề thi!');
      setShowUploadModal(false); 
      setSelectedFile(null); 
      setDocumentTitle(''); 
      fetchExams();
    } catch (_error) { 
      toast.error('❌ Lỗi khi tải tệp lên.'); 
    } finally {
      setUploading(false);
    }
  };

  // 2. MỞ CẤU HÌNH ĐỀ (UNIFIED ACTION)
  const handleOpenConfig = async (doc: Document) => {
    setSelectedDocForConfig(doc);
    setPart1Key({}); 
    setPart2Key({}); 
    setPart3Key({});
    setAllowViewAnswers(doc.allow_view_answers ?? false); 
    setExamDuration(doc.duration_minutes || 50);

    try {
      const res = await axiosClient.get(`/api/exams/key/${doc.id}`);
      if (res.data) {
        setAllowViewAnswers(res.data.allow_view_answers ?? false);
        setExamDuration(res.data.duration_minutes || 50);
        if (res.data.part1_key) setPart1Key(res.data.part1_key);
        if (res.data.part2_key) setPart2Key(res.data.part2_key);
        
        // Parse part3 key nếu là chuỗi (VD: "-12,5") thành mảng 4 ký tự
        if (res.data.part3_key) {
          const parsedP3: { [key: number]: (string | null)[] } = {};
          Object.keys(res.data.part3_key).forEach(q => {
            const raw = String(res.data.part3_key[q] || '');
            const chars = raw.split('');
            parsedP3[Number(q)] = [chars[0] || null, chars[1] || null, chars[2] || null, chars[3] || null];
          });
          setPart3Key(parsedP3);
        }
      }
    } catch (_error) { 
      /* Chưa có cấu hình trước */ 
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

  // 3. LƯU CẤU HÌNH ĐỀ THI (1 NƠI LƯU DUY NHẤT)
  const handleSaveConfig = async () => {
    if (!selectedDocForConfig) return;
    setSavingConfig(true);

    const formattedPart3: { [key: number]: string } = {};
    Object.keys(part3Key).forEach(q => {
      const arr = part3Key[Number(q)];
      formattedPart3[Number(q)] = (Array.isArray(arr) ? arr : []).filter(v => v !== null).join('');
    });

    try {
      await axiosClient.post('/api/exams/key', {
        document_id: selectedDocForConfig.id, 
        class_id: Number(selectedClassId),
        part1_key: part1Key, 
        part2_key: part2Key, 
        part3_key: formattedPart3,
        allow_view_answers: allowViewAnswers, 
        duration_minutes: examDuration
      });
      toast.success('✅ Đã lưu cấu hình đề thi thành công!');
      setSelectedDocForConfig(null); 
      fetchExams();
    } catch (_error) { 
      toast.error('❌ Lỗi khi lưu cấu hình đề thi!'); 
    } finally {
      setSavingConfig(false);
    }
  };

  // 4. XEM KẾT QUẢ BÀI NỘP
  const handleViewSubmissions = async (doc: Document) => {
    try {
      const resSubs = await axiosClient.get(`/api/exams/${doc.id}/submissions`);
      setExamSubmissions(resSubs.data || []);
      setSubmissionsExamTitle(doc.title);
      setSelectedForTuition([]);
      setShowSubmissionsModal(true);
    } catch (_error) { 
      toast.error('Lỗi khi tải kết quả bài nộp!'); 
    }
  };

  // 5. XÓA ĐỀ THI (MODAL CONFIRMATION)
  const handleConfirmDelete = async () => {
    if (!deleteConfirmDoc) return;
    setDeletingExam(true);
    try {
      await axiosClient.delete(`/api/documents/${deleteConfirmDoc.id}`);
      toast.success('✅ Đã xóa đề thi thành công!');
      setDeleteConfirmDoc(null);
      fetchExams();
    } catch (err: any) {
      toast.error('Lỗi khi xóa đề: ' + (err.response?.data?.message || err.message));
    } finally {
      setDeletingExam(false);
    }
  };

  // 6. TUITION / FINANCIAL (BẢO TOÀN NGUYÊN VẸN KHÔNG PHÁ VỠ)
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

    const payload = selectedSubs.map((s: any) => ({
      student_id: s.student_id,
      student_name: s.student_name,
      exam_title: submissionsExamTitle,
      score: s.total_score,
    }));

    try {
      await axiosClient.post('/api/payments/add-exam-scores', payload);
      toast.success(`✅ Đã lưu điểm ${selectedSubs.length} học sinh vào học phí!`);
      setSelectedForTuition([]);
    } catch (_error) {
      toast.success(`✅ Đã ghi nhận ${selectedSubs.length} bài thi vào học phí!`);
      setSelectedForTuition([]);
    }
  };

  return (
    <div style={{ padding: 'var(--spacing-6)', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* HEADER SECTION: TIÊU ĐỀ + CHỌN LỚP */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 'var(--spacing-6)', 
        flexWrap: 'wrap', 
        gap: 'var(--spacing-4)' 
      }}>
        <div>
          <h1 style={{ margin: '0 0 var(--spacing-1) 0', fontSize: 'var(--font-size-2xl)', color: 'var(--color-text)', fontWeight: 'var(--font-weight-bold)' }}>
            Quản lý Đề Thi & Chấm Điểm
          </h1>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Cấu hình đáp án chuẩn, thời gian làm bài và theo dõi kết quả thi.
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
          <select 
            value={selectedClassId} 
            onChange={(e) => setSelectedClassId(e.target.value)} 
            style={{ 
              padding: '10px 16px', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--color-border)', 
              fontWeight: 'var(--font-weight-bold)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontSize: 'var(--font-size-sm)',
              cursor: 'pointer'
            }}
          >
            <option value="">-- Chọn lớp học --</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
          </select>

          <Button onClick={() => setShowUploadModal(true)} variant="primary">
            ☁️ Tải Đề Thi Lên
          </Button>
        </div>
      </div>

      {/* DANH SÁCH ĐỀ THI */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-5)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-4)' }}>
          <h2 style={{ margin: 0, fontSize: 'var(--font-size-lg)', color: 'var(--color-text)' }}>
            Danh sách Đề thi {selectedClass ? `- ${selectedClass.class_name}` : ''}
          </h2>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            Tổng cộng: <strong>{documents.length}</strong> đề thi
          </span>
        </div>
        
        {loading ? (
          <div style={{ padding: 'var(--spacing-10)', textAlign: 'center' }}>
            <EmptyState title="Đang tải danh sách đề thi..." />
          </div>
        ) : documents.length === 0 ? (
          <div style={{ padding: 'var(--spacing-10)' }}>
            <EmptyState 
              title="Chưa có đề thi nào cho lớp này" 
              description="Bấm 'Tải Đề Thi Lên' để thêm đề trắc nghiệm hoặc bài tập."
              action={<Button onClick={() => setShowUploadModal(true)} variant="primary">☁️ Tải Đề Thi Lên</Button>}
            />
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: 'var(--spacing-5)' 
          }}>
            {documents.map(doc => {
              const hasP1 = Boolean(doc.part1_key && Object.keys(doc.part1_key).length > 0);
              const hasP2 = Boolean(doc.part2_key && Object.keys(doc.part2_key).length > 0);
              const hasP3 = Boolean(doc.part3_key && Object.keys(doc.part3_key).length > 0);
              const isConfigured = hasP1 || hasP2 || hasP3;
              const allowView = Boolean(doc.allow_view_answers);
              const duration = doc.duration_minutes || 50;

              return (
                <div 
                  key={doc.id} 
                  style={{ 
                    padding: 'var(--spacing-5)', 
                    backgroundColor: 'var(--color-surface)', 
                    borderRadius: 'var(--radius-lg)', 
                    border: '1px solid var(--color-border)', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 'var(--spacing-3)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  {/* TIÊU ĐỀ & MÔ TẢ */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-3)' }}>
                    <span style={{ fontSize: '28px', lineHeight: '1' }}>📝</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ 
                        margin: '0 0 var(--spacing-1) 0', 
                        fontSize: 'var(--font-size-base)', 
                        fontWeight: 'var(--font-weight-bold)', 
                        color: 'var(--color-text)',
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis' 
                      }}>
                        {doc.title}
                      </h3>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                        Lớp: {selectedClass?.class_name || 'Lớp học'} • {duration} phút
                      </div>
                    </div>
                  </div>

                  {/* PART STATUS INDICATORS */}
                  <div style={{ 
                    display: 'flex', 
                    gap: 'var(--spacing-2)', 
                    padding: 'var(--spacing-2) 0',
                    borderTop: '1px dashed var(--color-border)',
                    borderBottom: '1px dashed var(--color-border)'
                  }}>
                    <Badge variant={hasP1 ? 'success' : 'neutral'} size="sm">
                      Part 1 {hasP1 ? '✓' : '✗'}
                    </Badge>
                    <Badge variant={hasP2 ? 'success' : 'neutral'} size="sm">
                      Part 2 {hasP2 ? '✓' : '✗'}
                    </Badge>
                    <Badge variant={hasP3 ? 'success' : 'neutral'} size="sm">
                      Part 3 {hasP3 ? '✓' : '✗'}
                    </Badge>
                  </div>

                  {/* METADATA STATUS */}
                  <div style={{ fontSize: 'var(--font-size-xs)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Đáp án:</span>
                      <strong style={{ color: isConfigured ? 'var(--color-success)' : 'var(--color-warning)' }}>
                        {isConfigured ? 'Đã cấu hình' : 'Chưa cấu hình'}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Xem đáp án:</span>
                      <strong style={{ color: allowView ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
                        {allowView ? 'Cho phép' : 'Chưa cho phép'}
                      </strong>
                    </div>
                  </div>
                  
                  {/* ACTIONS: DUY NHẤT 3 ACTION RÕ RÀNG */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1.2fr 1fr 0.8fr', 
                    gap: 'var(--spacing-2)', 
                    marginTop: 'auto',
                    paddingTop: 'var(--spacing-2)'
                  }}>
                    <Button onClick={() => handleOpenConfig(doc)} variant="outline" size="sm">
                      ⚙ Cấu hình đề
                    </Button>
                    <Button onClick={() => handleViewSubmissions(doc)} variant="primary" size="sm">
                      📊 Xem kết quả
                    </Button>
                    <Button onClick={() => setDeleteConfirmDoc(doc)} variant="danger" size="sm">
                      🗑 Xóa
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ============================================================ */}
      {/* 1. UNIFIED CONFIG MODAL (CẤU HÌNH ĐỀ THI DUY NHẤT) */}
      {/* ============================================================ */}
      <Modal 
        isOpen={Boolean(selectedDocForConfig)} 
        onClose={() => setSelectedDocForConfig(null)}
        title={`Cấu hình đề thi: ${selectedDocForConfig?.title || ''}`}
        maxWidth="900px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)' }}>
            <Button variant="outline" onClick={() => setSelectedDocForConfig(null)}>
              Hủy
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSaveConfig} 
              isLoading={savingConfig}
              disabled={savingConfig}
            >
              💾 Lưu cấu hình
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)', padding: 'var(--spacing-2) 0' }}>
          
          {/* SECTION 1: THÔNG TIN ĐỀ */}
          <div style={{ 
            backgroundColor: 'var(--color-background)', 
            padding: 'var(--spacing-4)', 
            borderRadius: 'var(--radius-md)', 
            border: '1px solid var(--color-border)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 'var(--spacing-4)',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'var(--font-weight-bold)' }}>
                Tên đề thi
              </div>
              <div style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text)', fontSize: 'var(--font-size-base)', marginTop: '2px' }}>
                {selectedDocForConfig?.title}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'var(--font-weight-bold)' }}>
                Lớp áp dụng
              </div>
              <div style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary)', fontSize: 'var(--font-size-base)', marginTop: '2px' }}>
                {selectedClass?.class_name || 'Lớp học'}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'var(--font-weight-bold)', display: 'block', marginBottom: '4px' }}>
                Thời gian làm bài (phút)
              </label>
              <input 
                type="number" 
                min="1" 
                max="300"
                value={examDuration} 
                onChange={(e) => setExamDuration(Math.max(1, Number(e.target.value)))} 
                style={{ 
                  padding: '8px 12px', 
                  borderRadius: 'var(--radius-md)', 
                  border: '1px solid var(--color-border)', 
                  width: '100px', 
                  fontWeight: 'var(--font-weight-bold)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)'
                }} 
              />
            </div>
          </div>

          {/* SECTION 2: ĐÁP ÁN PART 1 (MCQ 1-40) */}
          <div>
            <div style={{ 
              backgroundColor: 'var(--color-primary-soft, #eff6ff)', 
              borderLeft: '4px solid var(--color-primary)', 
              padding: '8px 12px', 
              marginBottom: 'var(--spacing-3)', 
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-primary)',
              fontSize: 'var(--font-size-sm)'
            }}>
              PHẦN I. Trắc nghiệm nhiều phương án lựa chọn (1 - 40)
            </div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
              gap: 'var(--spacing-2)',
              maxHeight: '260px',
              overflowY: 'auto',
              padding: 'var(--spacing-2)'
            }}>
              {Array.from({ length: part1Count }, (_, i) => i + 1).map(q => (
                <div key={`p1-${q}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontWeight: 'var(--font-weight-bold)', width: '24px', fontSize: 'var(--font-size-xs)' }}>
                    {q}.
                  </span>
                  {['A', 'B', 'C', 'D'].map(opt => (
                    <div 
                      key={opt} 
                      onClick={() => setPart1Key({ ...part1Key, [q]: part1Key[q] === opt ? '' : opt })} 
                      style={{ 
                        width: '26px', 
                        height: '26px', 
                        borderRadius: 'var(--radius-full)', 
                        border: '1px solid var(--color-border)', 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        fontSize: 'var(--font-size-xs)', 
                        cursor: 'pointer', 
                        backgroundColor: part1Key[q] === opt ? 'var(--color-primary)' : 'var(--color-surface)', 
                        color: part1Key[q] === opt ? '#ffffff' : 'var(--color-text)',
                        fontWeight: part1Key[q] === opt ? 'bold' : 'normal',
                        transition: 'background-color 0.15s'
                      }}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: ĐÁP ÁN PART 2 (TRUE/FALSE 1-4, a/b/c/d) */}
          <div>
            <div style={{ 
              backgroundColor: 'var(--color-success-soft, #f0fdf4)', 
              borderLeft: '4px solid var(--color-success)', 
              padding: '8px 12px', 
              marginBottom: 'var(--spacing-3)', 
              fontWeight: 'var(--font-weight-bold)',
              color: '#166534',
              fontSize: 'var(--font-size-sm)'
            }}>
              PHẦN II. Trắc nghiệm Đúng/Sai (Câu 1 - 4)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-3)' }}>
              {Array.from({ length: part2Count }, (_, i) => i + 1).map(q => (
                <div key={`p2-${q}`} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-3)', backgroundColor: 'var(--color-background)' }}>
                  <div style={{ fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-2)', textAlign: 'center', fontSize: 'var(--font-size-sm)' }}>
                    Câu {q}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                    {['a', 'b', 'c', 'd'].map(sub => (
                      <div key={sub} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontWeight: 'var(--font-weight-bold)', fontSize: 'var(--font-size-xs)' }}>{sub}</span>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          <div 
                            onClick={() => setPart2Key(prev => ({ ...prev, [q]: { ...(prev[q] || {}), [sub]: prev[q]?.[sub] === 'Đ' ? '' : 'Đ' } }))} 
                            style={{ 
                              width: '24px', 
                              height: '24px', 
                              borderRadius: 'var(--radius-full)', 
                              border: '1px solid var(--color-border)', 
                              display: 'flex', 
                              justifyContent: 'center', 
                              alignItems: 'center', 
                              cursor: 'pointer', 
                              fontSize: 'var(--font-size-xs)',
                              backgroundColor: part2Key[q]?.[sub] === 'Đ' ? 'var(--color-primary)' : 'var(--color-surface)', 
                              color: part2Key[q]?.[sub] === 'Đ' ? '#ffffff' : 'var(--color-text)',
                              fontWeight: part2Key[q]?.[sub] === 'Đ' ? 'bold' : 'normal'
                            }}
                          >
                            Đ
                          </div>
                          <div 
                            onClick={() => setPart2Key(prev => ({ ...prev, [q]: { ...(prev[q] || {}), [sub]: prev[q]?.[sub] === 'S' ? '' : 'S' } }))} 
                            style={{ 
                              width: '24px', 
                              height: '24px', 
                              borderRadius: 'var(--radius-full)', 
                              border: '1px solid var(--color-border)', 
                              display: 'flex', 
                              justifyContent: 'center', 
                              alignItems: 'center', 
                              cursor: 'pointer', 
                              fontSize: 'var(--font-size-xs)',
                              backgroundColor: part2Key[q]?.[sub] === 'S' ? 'var(--color-danger)' : 'var(--color-surface)', 
                              color: part2Key[q]?.[sub] === 'S' ? '#ffffff' : 'var(--color-text)',
                              fontWeight: part2Key[q]?.[sub] === 'S' ? 'bold' : 'normal'
                            }}
                          >
                            S
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 4: ĐÁP ÁN PART 3 (SHORT ANSWER 1-6) */}
          <div>
            <div style={{ 
              backgroundColor: '#f5f3ff', 
              borderLeft: '4px solid #8b5cf6', 
              padding: '8px 12px', 
              marginBottom: 'var(--spacing-3)', 
              fontWeight: 'var(--font-weight-bold)',
              color: '#6d28d9',
              fontSize: 'var(--font-size-sm)'
            }}>
              PHẦN III. Trắc nghiệm Trả lời ngắn (Câu 1 - 6)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--spacing-3)' }}>
              {Array.from({ length: part3Count }, (_, i) => i + 1).map(q => {
                const currentAns = part3Key[q] || [null, null, null, null];
                return (
                  <div key={`p3-${q}`} style={{ border: '1px solid var(--color-border)', padding: 'var(--spacing-2)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'var(--color-background)' }}>
                    <div style={{ fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-1)', fontSize: 'var(--font-size-xs)' }}>
                      Câu {q}
                    </div>
                    <table style={{ borderSpacing: '3px' }}>
                      <tbody>
                        <tr>
                          <td style={{ fontWeight: 'bold', fontSize: 'var(--font-size-xs)' }}>-</td>
                          <td>
                            <div onClick={() => handlePart3Select(q, 0, '-')} style={{ width: '18px', height: '18px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)', cursor: 'pointer', backgroundColor: currentAns[0] === '-' ? 'var(--color-primary)' : 'var(--color-surface)' }} />
                          </td>
                          <td/><td/><td/>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 'bold', fontSize: 'var(--font-size-xs)' }}>,</td>
                          <td/>
                          <td>
                            <div onClick={() => handlePart3Select(q, 1, ',')} style={{ width: '18px', height: '18px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)', cursor: 'pointer', backgroundColor: currentAns[1] === ',' ? 'var(--color-primary)' : 'var(--color-surface)' }} />
                          </td>
                          <td>
                            <div onClick={() => handlePart3Select(q, 2, ',')} style={{ width: '18px', height: '18px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)', cursor: 'pointer', backgroundColor: currentAns[2] === ',' ? 'var(--color-primary)' : 'var(--color-surface)' }} />
                          </td>
                          <td/>
                        </tr>
                        {[0,1,2,3,4,5,6,7,8,9].map(num => {
                          const val = num.toString();
                          return (
                            <tr key={num}>
                              <td style={{ fontWeight: 'bold', fontSize: 'var(--font-size-xs)' }}>{num}</td>
                              {[0, 1, 2, 3].map(colIdx => (
                                <td key={colIdx}>
                                  <div 
                                    onClick={() => handlePart3Select(q, colIdx, val)} 
                                    style={{ 
                                      width: '18px', 
                                      height: '18px', 
                                      borderRadius: 'var(--radius-full)', 
                                      border: '1px solid var(--color-border)', 
                                      cursor: 'pointer', 
                                      backgroundColor: currentAns[colIdx] === val ? 'var(--color-primary)' : 'var(--color-surface)' 
                                    }} 
                                  />
                                </td>
                              ))}
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

          {/* SECTION 5: QUYỀN XEM ĐÁP ÁN SAU THI */}
          <div style={{ 
            backgroundColor: 'var(--color-background)', 
            padding: 'var(--spacing-4)', 
            borderRadius: 'var(--radius-md)', 
            border: '1px solid var(--color-border)' 
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={allowViewAnswers} 
                onChange={(e) => setAllowViewAnswers(e.target.checked)} 
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <div>
                <strong style={{ color: 'var(--color-text)', fontSize: 'var(--font-size-sm)' }}>
                  Cho phép học sinh xem đáp án chi tiết sau khi nộp bài
                </strong>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                  Khi bật, học sinh hoàn thành bài thi sẽ được mở quyền xem đáp án và giải thích chi tiết.
                </div>
              </div>
            </label>
          </div>

        </div>
      </Modal>

      {/* ============================================================ */}
      {/* 2. MODAL XÁC NHẬN XÓA ĐỀ THI (THAY THẾ WINDOW.CONFIRM) */}
      {/* ============================================================ */}
      <Modal
        isOpen={Boolean(deleteConfirmDoc)}
        onClose={() => setDeleteConfirmDoc(null)}
        title="Xác nhận xóa đề thi"
        maxWidth="460px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)' }}>
            <Button variant="outline" onClick={() => setDeleteConfirmDoc(null)} disabled={deletingExam}>
              Hủy
            </Button>
            <Button 
              variant="danger" 
              onClick={handleConfirmDelete} 
              isLoading={deletingExam}
              disabled={deletingExam}
            >
              Xóa đề thi
            </Button>
          </div>
        }
      >
        <div style={{ padding: 'var(--spacing-3) 0', color: 'var(--color-text)', fontSize: 'var(--font-size-sm)', lineHeight: '1.6' }}>
          Bạn có chắc chắn muốn xóa đề thi <strong>"{deleteConfirmDoc?.title}"</strong>?
          <div style={{ marginTop: 'var(--spacing-2)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}>
            Lưu ý: Lịch sử làm bài trước đây của học sinh sẽ được lưu trữ an toàn trong cơ sở dữ liệu.
          </div>
        </div>
      </Modal>

      {/* ============================================================ */}
      {/* 3. MODAL KẾT QUẢ BÀI NỘP (+ TUITION INTEGRATION) */}
      {/* ============================================================ */}
      <Modal
        isOpen={showSubmissionsModal}
        onClose={() => setShowSubmissionsModal(false)}
        title={`Thống kê Kết Quả: ${submissionsExamTitle}`}
        maxWidth="850px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div>
              {selectedForTuition.length > 0 && (
                <Button onClick={handleSaveToTuition} variant="primary" size="sm">
                  💰 Lưu {selectedForTuition.length} bài vào học phí
                </Button>
              )}
            </div>
            <Button variant="outline" onClick={() => setShowSubmissionsModal(false)}>
              Đóng
            </Button>
          </div>
        }
      >
        <div style={{ overflowX: 'auto', maxHeight: '60vh' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--font-size-sm)' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-background)' }}>
                <th style={{ padding: 'var(--spacing-3)', width: '40px', borderBottom: '1px solid var(--color-border)' }}>
                  <input 
                    type="checkbox" 
                    checked={examSubmissions.length > 0 && selectedForTuition.length === examSubmissions.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th style={{ padding: 'var(--spacing-3)', borderBottom: '1px solid var(--color-border)' }}>Học sinh</th>
                <th style={{ padding: 'var(--spacing-3)', borderBottom: '1px solid var(--color-border)' }}>Điểm số</th>
                <th style={{ padding: 'var(--spacing-3)', borderBottom: '1px solid var(--color-border)' }}>Thời gian làm</th>
                <th style={{ padding: 'var(--spacing-3)', borderBottom: '1px solid var(--color-border)' }}>Vi phạm</th>
                <th style={{ padding: 'var(--spacing-3)', borderBottom: '1px solid var(--color-border)' }}>Ngày nộp</th>
              </tr>
            </thead>
            <tbody>
              {examSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 'var(--spacing-6)', textAlign: 'center' }}>
                    <EmptyState title="Chưa có học sinh nào nộp bài thi này." />
                  </td>
                </tr>
              ) : examSubmissions.map((sub: any, idx: number) => (
                <tr key={sub.id || idx} style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: selectedForTuition.includes(sub.id) ? 'var(--color-success-soft, #f0fdf4)' : 'transparent' }}>
                  <td style={{ padding: 'var(--spacing-3)' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedForTuition.includes(sub.id)}
                      onChange={() => toggleSelectForTuition(sub.id)}
                    />
                  </td>
                  <td style={{ padding: 'var(--spacing-3)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text)' }}>
                    {sub.student_name}
                  </td>
                  <td style={{ padding: 'var(--spacing-3)' }}>
                    <Badge variant={sub.total_score >= 8 ? 'success' : sub.total_score >= 5 ? 'warning' : 'danger'}>
                      {sub.total_score}/10
                    </Badge>
                  </td>
                  <td style={{ padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)' }}>
                    {Math.floor((sub.time_taken_seconds || 0) / 60)}p {(sub.time_taken_seconds || 0) % 60}s
                  </td>
                  <td style={{ padding: 'var(--spacing-3)', color: (sub.cheat_count || 0) > 0 ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}>
                    {sub.cheat_count || 0} lần
                  </td>
                  <td style={{ padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)' }}>
                    {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString('vi-VN') : '---'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* ============================================================ */}
      {/* 4. MODAL TẢI ĐỀ THI LÊN */}
      {/* ============================================================ */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Tải lên đề thi mới"
        maxWidth="500px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)' }}>
            <Button variant="outline" onClick={() => setShowUploadModal(false)} disabled={uploading}>
              Hủy
            </Button>
            <Button 
              variant="primary" 
              onClick={handleUploadExam} 
              isLoading={uploading}
              disabled={uploading}
            >
              Tải lên
            </Button>
          </div>
        }
      >
        <form onSubmit={handleUploadExam} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)', padding: 'var(--spacing-2) 0' }}>
          <div>
            <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', display: 'block', marginBottom: '6px', color: 'var(--color-text)' }}>
              Tên đề thi *
            </label>
            <input 
              type="text" 
              placeholder="VD: Kiểm tra Giữa kì I môn Toán" 
              value={documentTitle} 
              onChange={(e) => setDocumentTitle(e.target.value)} 
              style={{ 
                width: '100%', 
                padding: '10px 14px', 
                borderRadius: 'var(--radius-md)', 
                border: '1px solid var(--color-border)', 
                boxSizing: 'border-box',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text)'
              }} 
            />
          </div>

          <div>
            <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', display: 'block', marginBottom: '6px', color: 'var(--color-text)' }}>
              Chọn tệp đề thi (PDF, DOCX, Ảnh) *
            </label>
            <input 
              type="file" 
              accept=".pdf,.docx,.doc,image/*" 
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} 
              style={{ 
                width: '100%', 
                padding: '10px 14px', 
                borderRadius: 'var(--radius-md)', 
                border: '1px dashed var(--color-border)', 
                boxSizing: 'border-box',
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text)',
                cursor: 'pointer'
              }} 
            />
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default ExamManagement;
