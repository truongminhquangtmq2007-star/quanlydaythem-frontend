import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

// ==========================================
// HÀM RENDER "BỌC THÉP" TỐI THƯỢNG (XỬ LÝ MỌI KÝ TỰ TÀNG HÌNH)
// ==========================================
const renderContent = (text: string) => {
  if (!text) return '';

  let safeText = String(text);

safeText = safeText
  .replace(/\\{2,}/g, '\\')
  .replace(/\\_/g, '_');

  // =====================================================
  // BƯỚC 2: Tách nội dung bằng dấu $
  // =====================================================

  const parts = safeText.split('$');

  return parts.map((part, index) => {
    // Text thường
    if (index % 2 === 0) {
      return <span key={index}>{part}</span>;
    }

    // Công thức toán
    const math = part.trim();

    if (!math) {
      return null;
    }

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
// Kiểu dữ liệu
// ==========================================
interface SharedContext {
  id: number;
  content: string;
  image_url?: string;
  questionIds: number[];
  part: 'part1' | 'part2' | 'part3';
}

const styles = {
  container: { maxWidth: '1200px', margin: '30px auto', fontFamily: 'Inter, Arial, sans-serif', color: '#333' },
  card: { backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', padding: '30px' },
  header: { color: '#1e293b', fontSize: '24px', margin: '0 0 20px 0', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '25px' },
  input: { width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' as const },
  previewBox: { backgroundColor: '#fff', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '8px', marginBottom: '15px', color: '#1e293b', lineHeight: '1.6', fontSize: '16px', whiteSpace: 'pre-wrap' as const },
  sharedBox: { backgroundColor: '#fffbeb', border: '1px dashed #f59e0b', padding: '15px', borderRadius: '8px', marginBottom: '15px', color: '#78350f', lineHeight: '1.6', fontSize: '15px', whiteSpace: 'pre-wrap' as const },
  jsonEditor: { width: '100%', height: '400px', padding: '15px', borderRadius: '8px', border: '2px solid #3b82f6', backgroundColor: '#1e293b', color: '#10b981', fontFamily: 'monospace', fontSize: '14px', resize: 'vertical' as const },
  saveBtn: { padding: '15px 40px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' },
};

// ==========================================
// COMPONENT RENDER ẢNH
// ==========================================
const ImageBlock = ({ url, onRemove }: { url: string; onRemove: () => void }) => (
  <div style={{ float: 'right', marginLeft: '15px', marginBottom: '10px', maxWidth: '40%', textAlign: 'center' }}>
    <img src={url} alt="Hình minh họa" style={{ width: '100%', maxHeight: '250px', objectFit: 'contain', borderRadius: '8px', border: '2px solid #cbd5e1', display: 'block', marginBottom: '8px' }} />
    <button onClick={onRemove} style={{ backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>🗑️ Xóa ảnh này</button>
  </div>
);

const CreateExamAI = () => {
  // Thay thế documentId bằng examTitle
  const [examTitle, setExamTitle] = useState<string>(''); 
  const [classId, setClassId] = useState<number | string>('');
  const [duration, setDuration] = useState<number | string>(50);

  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const [rawText, setRawText] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [classOptions, setClassOptions] = useState<any[]>([]);

  const [editContent, setEditContent] = useState<any>(null);
  const [editKeys, setEditKeys] = useState<any>(null);
  const [jsonString, setJsonString] = useState<string>('');
  const [jsonError, setJsonError] = useState<string>('');

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('https://quanlydaythem-api.onrender.com/api/classes', { headers: { Authorization: `Bearer ${token}` } });
        setClassOptions(response.data);
      } catch (err) {}
    };
    fetchClasses();
  }, []);

  const handleParseExam = async () => {
    if (!classId) return setError('Vui lòng chọn Lớp học!');
    if (inputMode === 'text' && !rawText) return setError('Vui lòng dán nội dung đề thi!');
    if (inputMode === 'file' && !selectedFile) return setError('Vui lòng chọn file PDF/Ảnh!');

    setIsLoading(true); setError(''); setEditContent(null); setEditKeys(null); setJsonString(''); setJsonError('');

    try {
      const token = localStorage.getItem('token');
      let response;

      // Truyền tạm document_id = 0 để qua cổng AI (vì AI không dùng id này, nó chỉ dùng để lưu)
      if (inputMode === 'text') {
        response = await axios.post(
          'https://quanlydaythem-api.onrender.com/api/exams/parse-ai-text',
          { document_id: 0, class_id: Number(classId), durationMinutes: Number(duration), rawText },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        const formData = new FormData();
        formData.append('document_id', '0');
        formData.append('class_id', String(classId));
        formData.append('durationMinutes', String(duration));
        formData.append('examFile', selectedFile as File);

        response = await axios.post(
          'https://quanlydaythem-api.onrender.com/api/exams/parse-ai-file',
          formData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
        );
      }

      if (response?.data) {
        const content = response.data.examContent;
        if (!content.sharedContexts) content.sharedContexts = [];
        setEditContent(content);
        setEditKeys(response.data.examKey);
        setJsonString(JSON.stringify(content, null, 2));
        
        // Tự động gợi ý tên đề thi nếu chưa nhập
        if (!examTitle) setExamTitle(`Đề thi AI - Lớp ${classOptions.find(c => c.id == classId)?.class_name || 'Mới'}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi bóc tách!');
    } finally {
      setIsLoading(false);
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

      const uploadRes = await axios.post(
        'https://quanlydaythem-api.onrender.com/api/documents/upload',
        formData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      );

      const newDocumentId = uploadRes.data?.document?.id;
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
      await axios.post(
        'https://quanlydaythem-api.onrender.com/api/exams/key',
        {
          document_id: newDocumentId, 
          class_id: classId, 
          duration_minutes: duration, 
          allow_view_answers: true,
          part1_key: editKeys.part1_key, 
          part2_key: editKeys.part2_key, 
          part3_key: editKeys.part3_key,
          exam_content: editContent,
        },
        { headers: { Authorization: `Bearer ${token}` } }
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
      const res = await axios.post('https://quanlydaythem-api.onrender.com/api/documents/upload', formData, { 
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'multipart/form-data' } 
      });
      return res.data?.document?.file_url || res.data?.file_url || null;
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
    const groups: SharedContext[] = editContent?.sharedContexts || [];
    const group = groups.find((g) => g.part === part && g.questionIds.includes(qId));
    if (!group) return null;
    return qId === Math.min(...group.questionIds) ? group : null;
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.header}>📑 Bóc Tách Đề AI (Tự động hóa)</h2>
        <div style={styles.formGrid}>
          {/* Ô MÃ TÀI LIỆU ĐÃ ĐƯỢC THAY BẰNG TÊN ĐỀ THI */}
          <div><label style={{ fontWeight: 'bold' }}>Tên đề thi</label><input type="text" placeholder="Nhập tên đề..." value={examTitle} onChange={(e) => setExamTitle(e.target.value)} style={styles.input} /></div>
          <div><label style={{ fontWeight: 'bold' }}>Lớp</label><select value={classId} onChange={(e) => setClassId(e.target.value)} style={styles.input}><option value="">-Chọn-</option>{classOptions.map((c) => <option key={c.id} value={c.id}>{c.class_name}</option>)}</select></div>
          <div><label style={{ fontWeight: 'bold' }}>Thời gian (Phút)</label><input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} style={styles.input} /></div>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <div style={{ padding: '10px', cursor: 'pointer', borderBottom: inputMode === 'text' ? '3px solid #3b82f6' : '3px solid transparent' }} onClick={() => setInputMode('text')}>📝 Văn bản (Word)</div>
          <div style={{ padding: '10px', cursor: 'pointer', borderBottom: inputMode === 'file' ? '3px solid #3b82f6' : '3px solid transparent' }} onClick={() => setInputMode('file')}>📎 File (PDF/Ảnh)</div>
        </div>
        {inputMode === 'text' ? <textarea value={rawText} onChange={(e) => setRawText(e.target.value)} style={{ ...styles.input, height: '150px' }} /> : <input type="file" onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} />}
        <button onClick={handleParseExam} disabled={isLoading} style={{ width: '100%', padding: '15px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', marginTop: '20px', cursor: 'pointer' }}>{isLoading ? '⏳ Đang xử lý...' : '✨ Bắt Đầu Phân Tích'}</button>
      </div>

      {editContent && editKeys && (
        <div style={{ ...styles.card, marginTop: '30px', borderTop: '4px solid #10b981' }}>
          <h3 style={{ color: '#10b981' }}>👀 Live Preview</h3>
          <div style={{ maxHeight: '700px', overflowY: 'auto', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            
            {/* ==================== PHẦN 1 ==================== */}
            <h4 style={{ color: '#1d4ed8' }}>Phần 1: Trắc nghiệm nhiều lựa chọn</h4>
            {editContent.part1?.map((q: any, index: number) => {
              const qId = q.id || index + 1;
              const group = findGroupIfFirst('part1', qId);
              return (
                <div key={index} style={{ clear: 'both' }}>
                  {group && (
                    <div style={styles.sharedBox}>
                      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>📌 Dùng chung cho câu {group.questionIds.join(', ')}:</div>
                      <div>{renderContent(group.content)}</div>
                    </div>
                  )}
                  <div style={styles.previewBox}>
                    {q.image_url && <ImageBlock url={q.image_url} onRemove={() => removeQuestionImage('part1', index)} />}
                    <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Câu {qId}: {renderContent(q.questionText)}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {['A', 'B', 'C', 'D'].map((opt) => (<div key={opt}><strong>{opt}.</strong> {renderContent(q.options[opt])}</div>))}
                    </div>
                    <div style={{ clear: 'both' }} />

                    <div style={{ marginTop: '20px', padding: '12px 15px', backgroundColor: '#ecfdf5', border: '1px solid #10b981', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 'bold', color: '#047857' }}>👉 Chọn đáp án chuẩn:</span>
                        <select style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '15px' }} value={editKeys.part1_key[qId] || ''} onChange={(e) => updateKey('part1_key', qId, e.target.value)}>
                          <option value="">- Chọn -</option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                        </select>
                      </div>
                      <label style={{ cursor: 'pointer', backgroundColor: '#3b82f6', color: 'white', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        📸 TẢI ẢNH LÊN
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { if(e.target.files?.[0]) handleQuestionImage('part1', index, e.target.files[0]); e.target.value = ''; }} />
                      </label>
                    </div>

                  </div>
                </div>
              );
            })}

            {/* ==================== PHẦN 2 ==================== */}
            <h4 style={{ color: '#1d4ed8', marginTop: '30px' }}>Phần 2: Trắc nghiệm Đúng/Sai</h4>
            {editContent.part2?.map((q: any, index: number) => {
              const qId = q.id || index + 1;
              const group = findGroupIfFirst('part2', qId);
              return (
                <div key={index} style={{ clear: 'both' }}>
                  {group && (
                    <div style={styles.sharedBox}>
                      <div style={{ fontWeight: 'bold' }}>📌 Dùng chung cho câu {group.questionIds.join(', ')}:</div>
                      <div>{renderContent(group.content)}</div>
                    </div>
                  )}
                  <div style={styles.previewBox}>
                    {q.image_url && <ImageBlock url={q.image_url} onRemove={() => removeQuestionImage('part2', index)} />}
                    <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Câu {qId}: {renderContent(q.questionText)}</div>
                    {['a', 'b', 'c', 'd'].map((stmt) => (
                      <div key={stmt} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #e2e8f0' }}>
                        <span><strong>{stmt})</strong> {renderContent(q.statements?.[stmt])}</span>
                        <select style={{ padding: '4px' }} value={editKeys.part2_key?.[qId]?.[stmt] || ''} onChange={(e) => updatePart2Key(qId, stmt, e.target.value)}><option value="">-</option><option value="Đ">Đ</option><option value="S">S</option></select>
                      </div>
                    ))}
                    <div style={{ clear: 'both' }} />

                    <div style={{ marginTop: '20px', padding: '12px 15px', backgroundColor: '#ecfdf5', border: '1px solid #10b981', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#047857', fontWeight: 'bold' }}>Đáp án Đ/S ở từng dòng trên.</span>
                      <label style={{ cursor: 'pointer', backgroundColor: '#3b82f6', color: 'white', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        📸 TẢI ẢNH LÊN
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { if(e.target.files?.[0]) handleQuestionImage('part2', index, e.target.files[0]); e.target.value = ''; }} />
                      </label>
                    </div>

                  </div>
                </div>
              );
            })}

            {/* ==================== PHẦN 3 ==================== */}
            <h4 style={{ color: '#1d4ed8', marginTop: '30px' }}>Phần 3: Trả lời ngắn</h4>
            {editContent.part3?.map((q: any, index: number) => {
              const qId = q.id || index + 1;
              const group = findGroupIfFirst('part3', qId);
              return (
                <div key={index} style={{ clear: 'both' }}>
                  {group && (
                    <div style={styles.sharedBox}>
                      <div style={{ fontWeight: 'bold' }}>📌 Dùng chung cho câu {group.questionIds.join(', ')}:</div>
                      <div>{renderContent(group.content)}</div>
                    </div>
                  )}
                  <div style={styles.previewBox}>
                    {q.image_url && <ImageBlock url={q.image_url} onRemove={() => removeQuestionImage('part3', index)} />}
                    <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Câu {qId}: {renderContent(q.questionText)}</div>
                    <div style={{ clear: 'both' }} />

                    <div style={{ marginTop: '20px', padding: '12px 15px', backgroundColor: '#ecfdf5', border: '1px solid #10b981', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 'bold', color: '#047857' }}>👉 Đáp án chuẩn:</span>
                        <input type="text" style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #cbd5e1' }} value={editKeys.part3_key[qId] || ''} onChange={(e) => updateKey('part3_key', qId, e.target.value)} />
                      </div>
                      <label style={{ cursor: 'pointer', backgroundColor: '#3b82f6', color: 'white', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        📸 TẢI ẢNH LÊN
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { if(e.target.files?.[0]) handleQuestionImage('part3', index, e.target.files[0]); e.target.value = ''; }} />
                      </label>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

          <h3 style={{ marginTop: '30px', color: '#3b82f6' }}>🛠 Trình sửa mã JSON</h3>
          <textarea style={{ ...styles.jsonEditor }} value={jsonString} onChange={(e) => {
            setJsonString(e.target.value);
            try { setEditContent(JSON.parse(e.target.value)); setJsonError(''); } catch (err) { setJsonError('Lỗi cú pháp JSON'); }
          }} spellCheck="false" />
          <button onClick={handleSaveExam} disabled={isLoading} style={{ ...styles.saveBtn, marginTop: '20px', width: '100%' }}>
            {isLoading ? '⏳ ĐANG LƯU VÀ TẠO TÀI LIỆU...' : '💾 XÁC NHẬN LƯU HỆ THỐNG'}
          </button>
        </div>
      )}
    </div>
  );
};

export default CreateExamAI;