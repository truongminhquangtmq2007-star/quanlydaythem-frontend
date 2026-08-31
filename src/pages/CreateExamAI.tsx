import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Wizard } from '../components/ui/Wizard';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';



import axiosClient from '../api/axiosClient';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

// ==========================================
// HÀM RENDER "BỌC THÉP" TỐI THƯỢNG (XỬ LÝ MỌI KÝ TỰ TÀNG HÌNH)
// ==========================================
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
// Kiểu dữ liệu
// ==========================================
interface SharedContext {
  id: number;
  content: string;
  image_url?: string;
  questionIds: number[];
  part?: string;
}


const styles = {
  container: { maxWidth: '1200px', margin: '30px auto', fontFamily: 'Inter, Arial, sans-serif', color: 'var(--color-text)' },
  card: { backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', boxShadow: '0 4px 20px var(--color-border)', padding: 'var(--spacing-8)' },
  header: { color: 'var(--color-text)', fontSize: 'var(--font-size-2xl)', margin: '0 0 20px 0', borderBottom: '2px solid var(--color-border)', paddingBottom: 'var(--spacing-4)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-5)', marginBottom: '25px' },
  input: { width: '100%', padding: '10px 15px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '15px', boxSizing: 'border-box' as const },
  previewBox: { backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: 'var(--spacing-5)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-4)', color: 'var(--color-text)', lineHeight: '1.6', fontSize: 'var(--font-size-base)', whiteSpace: 'pre-wrap' as const },
  sharedBox: { backgroundColor: 'var(--color-surface)beb', border: '1px dashed var(--color-warning)', padding: 'var(--spacing-4)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-4)', color: '#78350f', lineHeight: '1.6', fontSize: '15px', whiteSpace: 'pre-wrap' as const },
  jsonEditor: { width: '100%', height: '400px', padding: 'var(--spacing-4)', borderRadius: 'var(--radius-md)', border: '2px solid var(--color-primary)', backgroundColor: 'var(--color-text)', color: 'var(--color-success)', fontFamily: 'monospace', fontSize: 'var(--font-size-sm)', resize: 'vertical' as const },
  saveBtn: { padding: '15px 40px', backgroundColor: 'var(--color-success)', color: 'var(--color-surface)', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' },
};

// ==========================================
// COMPONENT RENDER ẢNH
// ==========================================
const ImageBlock = ({ url, onRemove }: { url: string; onRemove: () => void }) => (
  <div style={{ float: 'right', marginLeft: 'var(--spacing-4)', marginBottom: 'var(--spacing-2)', maxWidth: '40%', textAlign: 'center' }}>
    <img src={url} alt="Hình minh họa" style={{ width: '100%', maxHeight: '250px', objectFit: 'contain', borderRadius: 'var(--radius-md)', border: '2px solid var(--color-border)', display: 'block', marginBottom: 'var(--spacing-2)' }} />
    <button onClick={onRemove} style={{ backgroundColor: '#fee2e2', color: 'var(--color-danger)', border: 'none', padding: '6px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)' }}>🗑️ Xóa ảnh này</button>
  </div>
);

import { useNavigate } from 'react-router-dom';

const CreateExamAI = () => {
  const navigate = useNavigate();
  // Thay thế documentId bằng examTitle
  const [examTitle, setExamTitle] = useState<string>(''); 
  const [classId, setClassId] = useState<number | string>('');
  const [duration, setDuration] = useState<number | string>(50);

  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const [rawText, setRawText] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [examData, setExamData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [classOptions, setClassOptions] = useState<any[]>([]);

  const [editContent, setEditContent] = useState<any>(null);
  const [editKeys, setEditKeys] = useState<any>(null);
  const [jsonString, setJsonString] = useState<string>('');
  const [jsonError, setJsonError] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axiosClient.get(`/api/classes`);
        setClassOptions(response.data);
      } catch (err) {
      console.error(err);
    }
    };
    fetchClasses();
  }, []);

  const handleParseExam = async () => {
    if (!classId) return setError('Vui lòng chọn Lớp học!');
    if (inputMode === 'text' && !rawText) return setError('Vui lòng dán nội dung đề thi!');
    if (inputMode === 'file' && !selectedFile) return setError('Vui lòng chọn file PDF/Ảnh!');

          setIsLoading(true); setLoadingMessage('Đang tải dữ liệu lên...'); setError(''); setEditContent(null); setEditKeys(null); setJsonString(''); setJsonError('');

    try {
      let response;
      const t1 = setTimeout(() => setLoadingMessage('AI đang đọc đề thi (Có thể mất 1-2 phút, vui lòng không tắt trang)...'), 3000);
      const t2 = setTimeout(() => setLoadingMessage('Đang xử lý dữ liệu...'), 45000);

      if (inputMode === 'text') {
        response = await axiosClient.post(
          `/api/exams/parse-ai-text`,
          { document_id: 0, class_id: Number(classId), durationMinutes: Number(duration), rawText },
          { timeout: 180000 }
        );
      } else {
        const formData = new FormData();
        formData.append('document_id', '0');
        formData.append('class_id', String(classId));
        formData.append('durationMinutes', String(duration));
        formData.append('examFile', selectedFile as File);

        response = await axiosClient.post(
          `/api/exams/parse-ai-file`,
          formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 180000 }
        );
      }
      
      clearTimeout(t1);
      clearTimeout(t2);

      let responseData = response?.data;
      if (responseData?.status === 'success' && responseData.data) {
          responseData = responseData.data;
      }

      if (responseData && responseData.examContent) {
        const content = responseData.examContent;
        if (!content.sharedContexts) content.sharedContexts = [];
        
        const finalTitle = examTitle || `Đề thi AI - Lớp ${classOptions.find((c: any) => c.id == classId)?.class_name || 'Mới'}`;
        const finalGrade = classOptions.find((c: any) => c.id == classId)?.grade || '12';
        const finalSubject = classOptions.find((c: any) => c.id == classId)?.subject || 'Chung';

        const meta = {
            document_id: responseData.document_id || 0,
            title: finalTitle,
            grade: finalGrade,
            subject: finalSubject,
            duration_minutes: Number(duration),
            class_id: Number(classId)
        };
        
        setIsLoading(false);
        // Chuyển hướng sang màn hình ExamEditor (Phase 3)
        navigate('/exam-editor', { state: { examContent: content, meta } });
      } else {
        setIsLoading(false);
        toast.error("Không nhận được dữ liệu hợp lệ từ AI.");
      }
    } catch (error: any) {
        setIsLoading(false);
        if (error.code === 'ECONNABORTED' || error.response?.status === 504) {
            toast.error("Hệ thống AI đang quá tải và mất nhiều thời gian. Vui lòng thử lại sau.");
        } else {
            toast.error(error.response?.data?.message || "Có lỗi xảy ra khi bóc tách đề thi!");
        }
      }
  };

  // ==========================================
  // LUỒNG TỰ ĐỘNG HÓA LƯU TÀI LIỆU
  // ==========================================
  const handleSaveExam = async () => {
    if (jsonError) return alert('❌ Mã JSON đang bị lỗi cú pháp.');
    if (!examTitle.trim()) return alert('⚠️ Vui lòng nhập Tên đề thi trước khi lưu!');
    if (!editContent?.part1 || !editContent?.part2 || !editContent?.part3) {
  return alert('❌ Dữ liệu đề thi không hợp lệ!');
}

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');

      // BƯỚC 1: TỰ ĐỘNG TẠO TÀI LIỆU ĐỂ LẤY ID CHUẨN
      let fileToUpload = selectedFile;
      if (inputMode === 'text' || !fileToUpload) {
          // Tạo một file txt ảo từ văn bản để đẩy lên server
          const blob = new Blob([rawText || 'Nội dung đề thi được tạo tự động từ AI'], { type: 'text/plain' });
          fileToUpload = new File([blob], `${examTitle}.txt`, { type: 'text/plain' });
      }
      const invalidPart1 = editContent.part1.some(
  (q: any) => !['A', 'B', 'C', 'D'].includes(editKeys.part1_key?.[q.id])
);

if (invalidPart1) {
  return alert('⚠️ Có câu Phần 1 chưa chọn đáp án!');
}
      const invalidPart2 = editContent.part2.some((q: any) => {
  const key = editKeys.part2_key?.[q.id];

  return !key ||
    !['Đ', 'S'].includes(key.a) ||
    !['Đ', 'S'].includes(key.b) ||
    !['Đ', 'S'].includes(key.c) ||
    !['Đ', 'S'].includes(key.d);
});

if (invalidPart2) {
  return alert('⚠️ Có câu Phần 2 chưa nhập đủ đáp án Đúng/Sai!');
}
      const invalidPart3 = editContent.part3.some(
  (q: any) => !String(editKeys.part3_key?.[q.id] || '').trim()
);

if (invalidPart3) {
  return alert('⚠️ Có câu Phần 3 chưa nhập đáp án!');
}

      const formData = new FormData();
      formData.append('title', examTitle);
      formData.append('category', 'EXAM');
      formData.append('file', fileToUpload);

      const uploadRes = await axiosClient.post(
          `/api/upload/document`,
          formData, { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        
        const docRes = await axiosClient.post(`/api/documents`, {
            title: examTitle,
            category: 'EXAM',
            file_url: uploadRes.data?.secure_url
        });
        
        const newDocumentId = docRes.data?.id;
      if (!newDocumentId) throw new Error("Không thể khởi tạo mã tài liệu gốc.");
      const finalPart1Key = editContent.part1.reduce((acc: any, q: any) => {
  acc[q.id] = q.correctAnswer || editKeys.part1_key?.[q.id] || '';
  return acc;
}, {});

const finalPart2Key = editContent.part2.reduce((acc: any, q: any) => {
  acc[q.id] = q.correctAnswer || editKeys.part2_key?.[q.id] || {};
  return acc;
}, {});

const finalPart3Key = editContent.part3.reduce((acc: any, q: any) => {
  acc[q.id] = q.correctAnswer || editKeys.part3_key?.[q.id] || '';
  return acc;
}, {});
      // BƯỚC 2: LƯU ĐÁP ÁN VÀO ĐÚNG ID VỪA TẠO
      await axiosClient.post(
        `/api/exams/key`,
        {
          document_id: newDocumentId, 
          class_id: classId, 
          duration_minutes: duration, 
          allow_view_answers: true,
          part1_key: editKeys.part1_key, 
          part2_key: editKeys.part2_key, 
          part3_key: editKeys.part3_key,
          exam_content: editContent,
        }
      );
      alert('🎉 Đã tự động tạo tài liệu và lưu bộ đề thành công!');
    } catch (err: any) { 
      console.error("LỖI CHI TIẾT TỪ BACKEND:", err);
      const errorMessage = err.response?.data?.message || err.message || "Lỗi không xác định";
      alert(`❌ Lỗi từ Server: ${errorMessage}`);
    } finally { 
      setIsLoading(false); 
    }
  };

  const uploadImageToCloudinary = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'EXAM_IMAGE');
    try {
      const res = await axiosClient.post(`/api/upload/image`, formData, { 
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'multipart/form-data' } 
        });
        return res.data?.url || null;
    } catch (err) { alert('Lỗi tải ảnh!'); return null; }
  };

  const handleQuestionImage = async (part: 'part1' | 'part2' | 'part3', index: number, file: File) => {
    const url = await uploadImageToCloudinary(file);
    if (!url) return;
    const newContent = { ...editContent, [part]: editContent[part].map((q: any, i: number) => (i === index ? { ...q, image_url: url } : q)) };
    setEditContent(newContent); setJsonString(JSON.stringify(newContent, null, 2));
  };

  const removeQuestionImage = (part: 'part1' | 'part2' | 'part3', index: number) => {
    const newContent = { ...editContent, [part]: editContent[part].map((q: any, i: number) => (i === index ? { ...q, image_url: undefined } : q)) };
    setEditContent(newContent); setJsonString(JSON.stringify(newContent, null, 2));
  };

  const updateKey = (
  partKey: 'part1_key' | 'part3_key',
  qId: number,
  value: string
) => {

  // Cập nhật đáp án để lưu database
  setEditKeys((prev: any) => ({
    ...prev,
    [partKey]: {
      ...prev[partKey],
      [qId]: value
    }
  }));

  // Đồng bộ vào nội dung đề
  const part = partKey === 'part1_key' ? 'part1' : 'part3';

  setEditContent((prev: any) => {
    const newContent = {
      ...prev,
      [part]: prev[part].map((q: any) =>
        q.id === qId
          ? { ...q, correctAnswer: value }
          : q
      )
    };

    setJsonString(JSON.stringify(newContent, null, 2));

    return newContent;
  });
};
  const updatePart2Key = (
  qId: number,
  stmtKey: string,
  value: string
) => {

  setEditKeys((prev: any) => ({
    ...prev,
    part2_key: {
      ...prev.part2_key,
      [qId]: {
        ...prev.part2_key?.[qId],
        [stmtKey]: value
      }
    }
  }));

  setEditContent((prev: any) => {
    const newContent = {
      ...prev,
      part2: prev.part2.map((q: any) => {
        if (q.id !== qId) return q;

        return {
          ...q,
          correctAnswer: {
            ...q.correctAnswer,
            [stmtKey]: value
          }
        };
      })
    };

    setJsonString(JSON.stringify(newContent, null, 2));

    return newContent;
  });
};

  const findGroupIfFirst = (part: 'part1' | 'part2' | 'part3', qId: number): SharedContext | null => {
    const groups: SharedContext[] = editContent?.sharedContexts || editContent?.shared_context || [];
    const group = groups.find((g) => (g.part === part || (!g.part && part === 'part1')) && g.questionIds.includes(qId));
    if (!group) return null;
    return qId === Math.min(...group.questionIds) ? group : null;
  };


  return (
    <div style={{ padding: 'var(--spacing-6)', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: 'var(--spacing-6)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
        <span style={{ fontSize: 'var(--font-size-3xl)' }}>✨</span> Tạo Đề Thi Với AI
      </h1>
      
      {isLoading ? (
        <Card style={{ padding: 'var(--spacing-10)', textAlign: 'center' }}>
          <div className="spinner" style={{ fontSize: '48px', color: 'var(--color-primary)', margin: '0 auto var(--spacing-6) auto' }}></div>
          <h2 style={{ color: 'var(--color-primary)' }}>{loadingMessage || 'AI đang phân tích đề thi...'}</h2>
          <p className="text-secondary">Quá trình này có thể mất từ 1 - 3 phút. Vui lòng không đóng trình duyệt.</p>
        </Card>
      ) : (
        <Wizard
          currentStep={currentStep}
          onNext={() => {
            if (currentStep === 1) {
              handleParseExam();
              setCurrentStep(2);
            } else if (currentStep === 2) { 
              // Do nothing, next is submit
            } else {
              setCurrentStep(c => c + 1);
            }
          }}
          onPrev={() => setCurrentStep(c => c - 1)}
          onSubmit={handleSaveExam}
          isSubmitting={isLoading}
          submitLabel="Lưu & Xuất bản"
          steps={[
            {
              id: 'config',
              label: 'Cấu hình chung',
              isValid: !!examTitle && !!classId,
              content: (
                <div className="flex flex-col gap-6">
                  <Input 
                    label="Tên đề thi"
                    placeholder="VD: Đề thi Giữa kỳ Hóa 12"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    required
                  />
                  <div className="flex flex-col gap-2">
                    <label style={{ fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)' }}>Lớp học <span style={{color: 'var(--color-danger)'}}>*</span></label>
                    <select 
                      className="input-base"
                      value={classId} 
                      onChange={(e) => setClassId(e.target.value)} 
                      required
                    >
                      <option value="">-- Chọn lớp học --</option>
                      {classOptions.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.class_name}</option>
                      ))}
                    </select>
                  </div>
                  <Input 
                    label="Thời gian thi (Phút)"
                    type="number"
                    value={duration as any}
                    onChange={(e) => setDuration(e.target.value)}
                    required
                  />
                </div>
              )
            },
            {
              id: 'source',
              label: 'Nguồn đề thi',
              isValid: inputMode === 'text' ? !!rawText : !!selectedFile,
              content: (
                <div className="flex flex-col gap-6">
                  <div style={{ display: 'flex', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-2)' }}>
                    <Button variant={inputMode === 'text' ? 'primary' : 'outline'} onClick={() => setInputMode('text')} style={{ flex: 1 }}>Nhập văn bản (Text)</Button>
                    <Button variant={inputMode === 'file' ? 'primary' : 'outline'} onClick={() => setInputMode('file')} style={{ flex: 1 }}>Tải lên File (PDF, DOCX)</Button>
                  </div>
                  
                  {inputMode === 'text' ? (
                    <div className="flex flex-col gap-2">
                      <label style={{ fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)' }}>Nội dung văn bản</label>
                      <textarea 
                        className="input-base"
                        rows={10} 
                        placeholder="Dán nội dung câu hỏi vào đây (Hỗ trợ định dạng LaTeX)..."
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        style={{ resize: 'vertical' }}
                      />
                    </div>
                  ) : (
                    <div style={{ padding: 'var(--spacing-10)', border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-lg)', textAlign: 'center', backgroundColor: 'var(--color-surface-hover)' }}>
                       <div style={{ fontSize: '48px', marginBottom: 'var(--spacing-4)' }}>📄</div>
                       <input 
                         type="file" 
                         accept=".pdf,.docx,.png,.jpg,.jpeg" 
                         onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                         id="file-upload"
                         style={{ display: 'none' }}
                       />
                       <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'inline-flex', padding: 'var(--spacing-2) var(--spacing-4)', backgroundColor: 'var(--color-primary)', color: 'var(--color-surface)', borderRadius: 'var(--radius-md)', fontWeight: 'var(--font-weight-medium)' }}>
                         Chọn tệp tải lên
                       </label>
                       {selectedFile && <p style={{ marginTop: 'var(--spacing-4)', color: 'var(--color-success)', fontWeight: 'var(--font-weight-medium)' }}>Đã chọn: {selectedFile.name}</p>}
                       <p className="text-secondary" style={{ marginTop: 'var(--spacing-4)', fontSize: 'var(--font-size-sm)' }}>Hỗ trợ PDF, DOCX, Ảnh (tối đa 10MB)</p>
                    </div>
                  )}
                  {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}
                </div>
              )
            },
            {
              id: 'preview',
              label: 'Kiểm tra & Cấu trúc',
              isValid: !!editContent,
              content: (
                <div className="flex flex-col gap-4">
                  {!editContent ? (
                    <div className="text-center text-muted" style={{ padding: 'var(--spacing-8)' }}>Chưa có dữ liệu. Vui lòng quay lại bước Nguồn đề thi và tiếp tục để AI phân tích.</div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-success-soft)', padding: 'var(--spacing-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-success)' }}>
                         <div style={{ color: 'var(--color-success)', fontWeight: 'var(--font-weight-bold)' }}>✅ Phân tích thành công!</div>
                         <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                            <Button variant="outline" size="sm" onClick={() => { setJsonString(JSON.stringify(editContent, null, 2)); }}>Sửa JSON Nội dung</Button>
                         </div>
                      </div>

                      <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: 'var(--spacing-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface)' }}>
                        <pre style={{ whiteSpace: 'pre-wrap', fontSize: 'var(--font-size-sm)', fontFamily: 'monospace', margin: 0 }}>
                          {JSON.stringify(editContent, null, 2)}
                        </pre>
                      </div>

                      {(jsonString !== '') && (
                        <div style={{ marginTop: 'var(--spacing-6)' }}>
                          <h3 style={{ marginBottom: 'var(--spacing-2)' }}>Chỉnh sửa JSON</h3>
                          <textarea 
                            className="input-base"
                            rows={15}
                            value={jsonString}
                            onChange={(e) => setJsonString(e.target.value)}
                            style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-sm)' }}
                          />
                          {jsonError && <p style={{ color: 'var(--color-danger)', marginTop: 'var(--spacing-2)' }}>{jsonError}</p>}
                          <div style={{ display: 'flex', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-4)' }}>
                            <Button variant="primary" onClick={() => { try { setEditContent(JSON.parse(jsonString)); setJsonError(''); } catch(e) { setJsonError('Lỗi JSON'); } }}>Lưu thay đổi</Button>
                            <Button variant="ghost" onClick={() => { setJsonString(''); }}>Hủy</Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            }
          ]}
        />
      )}
    </div>
  );
};

export default CreateExamAI;
