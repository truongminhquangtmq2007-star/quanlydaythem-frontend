import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

// ==========================================
// Hàm tiện ích: Render LaTeX an toàn
// ==========================================
const renderContent = (text: string) => {
  if (!text) return '';
  const parts = text.split('$');
  return parts.map((part, index) => {
    if (index % 2 !== 0) {
      let cleanMath = part.trim();
      
      // 1. Sửa lỗi escape: Khử các dấu gạch chéo kép do JSON trả về
      cleanMath = cleanMath.replace(/\\\\([a-zA-Z]+)/g, '\\$1');
      
      // 2. Phòng hờ trường hợp chuỗi bị lỗi ký tự form-feed (\f) của JavaScript
      cleanMath = cleanMath.replace(/\x0C/g, '\\f'); 

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
// Kiểu dữ liệu (khớp với backend geminiService.ts / claudeService.ts)
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
  previewBox: { backgroundColor: '#fff', border: '1px solid #e2e8f0', padding: '15px', borderRadius: '8px', marginBottom: '15px', color: '#1e293b', lineHeight: '1.6', fontSize: '16px' },
  sharedBox: { backgroundColor: '#fffbeb', border: '1px dashed #f59e0b', padding: '15px', borderRadius: '8px', marginBottom: '15px', color: '#78350f', lineHeight: '1.6', fontSize: '15px' },
  toolRow: { marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f1f5f9', padding: '10px', borderRadius: '5px', border: '1px dashed #cbd5e1', flexWrap: 'wrap' as const, gap: '10px' },
  uploadLabel: { cursor: 'pointer', backgroundColor: '#e2e8f0', padding: '6px 12px', borderRadius: '5px', fontSize: '13px', fontWeight: 'bold', color: '#475569' },
  deleteImgBtn: { marginLeft: '10px', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' },
  jsonEditor: { width: '100%', height: '400px', padding: '15px', borderRadius: '8px', border: '2px solid #3b82f6', backgroundColor: '#1e293b', color: '#10b981', fontFamily: 'monospace', fontSize: '14px', resize: 'vertical' as const },
  saveBtn: { padding: '15px 40px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' },
};

// Ảnh gắn kèm câu hỏi/nhóm — hiển thị nổi bên phải, tự xuống dòng khi hết chỗ, có nút xóa
const ImageBlock = ({ url, onRemove }: { url: string; onRemove: () => void }) => (
  <div style={{ float: 'right', marginLeft: '15px', marginBottom: '10px', maxWidth: '42%' }}>
    <img src={url} alt="Hình minh họa" style={{ width: '100%', maxHeight: '260px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #cbd5e1', display: 'block' }} />
    <button onClick={onRemove} style={{ ...styles.deleteImgBtn, marginLeft: 0, marginTop: '6px', width: '100%' }}>Xóa ảnh</button>
  </div>
);

// Ô tải ảnh lên — dùng chung cho mọi câu hỏi / mọi nhóm ngữ cảnh
const UploadBox = ({ label = '📷 Tải ảnh lên', onFileSelected }: { label?: string; onFileSelected: (file: File) => void }) => (
  <label style={styles.uploadLabel}>
    {label}
    <input
      type="file"
      accept="image/*"
      style={{ display: 'none' }}
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) onFileSelected(file);
        e.target.value = ''; // cho phép chọn lại đúng file đó lần sau nếu cần
      }}
    />
  </label>
);

const CreateExamAI = () => {
  const [documentId, setDocumentId] = useState<number | string>('');
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
        const response = await axios.get('https://quanlydaythem-api.onrender.com/api/classes', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClassOptions(response.data);
      } catch (err) {}
    };
    fetchClasses();
  }, []);

  const handleParseExam = async () => {
    if (!documentId || !classId) return setError('Vui lòng chọn Mã đề và Lớp học!');
    if (inputMode === 'text' && !rawText) return setError('Vui lòng dán nội dung đề thi!');
    if (inputMode === 'file' && !selectedFile) return setError('Vui lòng chọn file PDF hoặc Hình ảnh!');

    setIsLoading(true); setError(''); setEditContent(null); setEditKeys(null); setJsonString(''); setJsonError('');

    try {
      const token = localStorage.getItem('token');
      let response;

      if (inputMode === 'text') {
        response = await axios.post(
          'https://quanlydaythem-api.onrender.com/api/exams/parse-ai-file',
          { document_id: Number(documentId), class_id: Number(classId), durationMinutes: Number(duration), rawText },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        const formData = new FormData();
        formData.append('document_id', String(documentId));
        formData.append('class_id', String(classId));
        formData.append('durationMinutes', String(duration));
        formData.append('examFile', selectedFile as File);

        response = await axios.post(
          'https://quanlydaythem-api.onrender.com/api/exams/parse-ai-file',
          formData,
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
        );
      }

      if (response?.data) {
        const content = response.data.examContent;
        // Đảm bảo luôn có mảng sharedContexts (kể cả khi AI không trả về) để tránh lỗi undefined khi render
        if (!content.sharedContexts) content.sharedContexts = [];
        setEditContent(content);
        setEditKeys(response.data.examKey);
        setJsonString(JSON.stringify(content, null, 2));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi bóc tách!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveExam = async () => {
    if (jsonError) return alert('❌ KHÔNG THỂ LƯU: Mã JSON của bạn đang bị lỗi cú pháp.');

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      await axios.post(
        'https://quanlydaythem-api.onrender.com/api/exams/save-answer-key',
        {
          document_id: documentId, class_id: classId, duration_minutes: duration, allow_view_answers: true,
          part1_key: editKeys.part1_key, part2_key: editKeys.part2_key, part3_key: editKeys.part3_key,
          exam_content: editContent,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('🎉 Đã lưu bộ đề và đáp án thành công vào hệ thống!');
    } catch (err) {
      alert('❌ Lỗi khi lưu đề. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // TẢI ẢNH THẬT LÊN CLOUDINARY (không dùng base64 để tránh payload quá lớn)
  // ==========================================
  const uploadImageToCloudinary = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'EXAM_IMAGE');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'https://quanlydaythem-api.onrender.com/api/documents/upload',
        formData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      );
      // ⚠️ Kiểm tra đúng tên field backend trả về (thường là file_url) — chỉnh lại nếu backend dùng tên khác
      return res.data.file_url || res.data.url || null;
    } catch (err) {
      alert('Lỗi khi tải ảnh lên máy chủ!');
      return null;
    }
  };

  // Gắn ảnh cho MỘT CÂU HỎI cụ thể trong 1 phần
  const handleQuestionImage = async (part: 'part1' | 'part2' | 'part3', index: number, file: File) => {
    const url = await uploadImageToCloudinary(file);
    if (!url) return;
    const newContent = { ...editContent, [part]: editContent[part].map((q: any, i: number) => (i === index ? { ...q, image_url: url } : q)) };
    setEditContent(newContent);
    setJsonString(JSON.stringify(newContent, null, 2));
  };

  const removeQuestionImage = (part: 'part1' | 'part2' | 'part3', index: number) => {
    const newContent = { ...editContent, [part]: editContent[part].map((q: any, i: number) => (i === index ? { ...q, image_url: undefined } : q)) };
    setEditContent(newContent);
    setJsonString(JSON.stringify(newContent, null, 2));
  };

  // Gắn ảnh cho MỘT NHÓM NGỮ CẢNH DÙNG CHUNG (sharedContext)
  const handleGroupImage = async (groupIndex: number, file: File) => {
    const url = await uploadImageToCloudinary(file);
    if (!url) return;
    const newContexts = editContent.sharedContexts.map((g: SharedContext, i: number) => (i === groupIndex ? { ...g, image_url: url } : g));
    const newContent = { ...editContent, sharedContexts: newContexts };
    setEditContent(newContent);
    setJsonString(JSON.stringify(newContent, null, 2));
  };

  const removeGroupImage = (groupIndex: number) => {
    const newContexts = editContent.sharedContexts.map((g: SharedContext, i: number) => (i === groupIndex ? { ...g, image_url: undefined } : g));
    const newContent = { ...editContent, sharedContexts: newContexts };
    setEditContent(newContent);
    setJsonString(JSON.stringify(newContent, null, 2));
  };

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setJsonString(val);
    try {
      const parsed = JSON.parse(val);
      setEditContent(parsed);
      setJsonError('');
    } catch (err: any) {
      setJsonError('Lỗi cú pháp JSON: Vui lòng kiểm tra lại dấu ngoặc {}, [], hoặc dấu phẩy (,).');
    }
  };

  const updateKey = (partKey: string, qId: number, value: string) => {
    const newKeys = { ...editKeys }; newKeys[partKey][qId] = value; setEditKeys(newKeys);
  };
  const updatePart2Key = (qId: number, stmtKey: string, value: string) => {
    const newKeys = { ...editKeys };
    if (!newKeys.part2_key[qId]) newKeys.part2_key[qId] = {};
    newKeys.part2_key[qId] = { ...newKeys.part2_key[qId], [stmtKey]: value };
    setEditKeys(newKeys);
  };

  // Tìm nhóm ngữ cảnh (nếu có) mà câu hỏi này là CÂU ĐẦU TIÊN của nhóm — để quyết định có hiển thị khối chung hay không
  const findGroupIfFirst = (part: 'part1' | 'part2' | 'part3', qId: number): SharedContext | null => {
    const groups: SharedContext[] = editContent?.sharedContexts || [];
    const group = groups.find((g) => g.part === part && g.questionIds.includes(qId));
    if (!group) return null;
    const minId = Math.min(...group.questionIds);
    return qId === minId ? group : null;
  };

  const renderGroupBlock = (group: SharedContext, groupIndex: number) => (
    <div style={{ ...styles.sharedBox, clear: 'both' }}>
      {group.image_url && <ImageBlock url={group.image_url} onRemove={() => removeGroupImage(groupIndex)} />}
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
        📌 Sử dụng thông tin sau để trả lời các câu {group.questionIds.join(', ')}:
      </div>
      <div>{renderContent(group.content)}</div>
      <div style={{ clear: 'both' }} />
      <div style={{ marginTop: '10px' }}>
        <UploadBox label="📷 Gắn ảnh minh họa dùng chung" onFileSelected={(file) => handleGroupImage(groupIndex, file)} />
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.header}><span>📑</span> Quản Lý Thi - Bóc Tách Đề AI</h2>
        <div style={styles.formGrid}>
          <div><label style={{ fontWeight: 'bold' }}>Mã tài liệu</label><input type="number" value={documentId} onChange={(e) => setDocumentId(e.target.value)} style={styles.input} /></div>
          <div><label style={{ fontWeight: 'bold' }}>Lớp học</label><select value={classId} onChange={(e) => setClassId(e.target.value)} style={styles.input}><option value="">-Chọn-</option>{classOptions.map((cls) => <option key={cls.id} value={cls.id}>{cls.class_name}</option>)}</select></div>
          <div><label style={{ fontWeight: 'bold' }}>Thời gian</label><input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} style={styles.input} /></div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0' }}>
          <div style={{ padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold', borderBottom: inputMode === 'text' ? '3px solid #3b82f6' : '3px solid transparent', color: inputMode === 'text' ? '#3b82f6' : '#64748b' }} onClick={() => setInputMode('text')}>📝 Nhập văn bản (Word)</div>
          <div style={{ padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold', borderBottom: inputMode === 'file' ? '3px solid #3b82f6' : '3px solid transparent', color: inputMode === 'file' ? '#3b82f6' : '#64748b' }} onClick={() => setInputMode('file')}>📎 Tải file lên (PDF/Ảnh)</div>
        </div>

        {inputMode === 'text' ? (
          <textarea value={rawText} onChange={(e) => setRawText(e.target.value)} style={{ ...styles.input, height: '200px', resize: 'vertical' }} />
        ) : (
          <div style={{ border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '40px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
            <input type="file" accept=".pdf, image/*" onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} />
          </div>
        )}
        {error && <p style={{ color: '#ef4444', fontWeight: 'bold' }}>{error}</p>}
        <button onClick={handleParseExam} disabled={isLoading} style={{ width: '100%', padding: '15px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' }}>
          {isLoading ? '⏳ Đang phân tích dữ liệu...' : '✨ Bắt Đầu Tạo Đề'}
        </button>
      </div>

      {editContent && editKeys && (
        <div style={{ ...styles.card, marginTop: '30px', borderTop: '4px solid #10b981' }}>
          <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', color: '#10b981' }}>👀 Live Preview (Bản xem trước)</h3>

          <div style={{ maxHeight: '650px', overflowY: 'auto', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>

            {/* ==================== PHẦN 1 ==================== */}
            <h4 style={{ color: '#1d4ed8' }}>Phần 1: Trắc nghiệm nhiều lựa chọn</h4>
            {editContent.part1?.map((q: any, index: number) => {
              const qId = q.id || index + 1;
              const group = findGroupIfFirst('part1', qId);
              return (
                <React.Fragment key={index}>
                  {group && renderGroupBlock(group, editContent.sharedContexts.indexOf(group))}
                  <div style={{ ...styles.previewBox, clear: 'both' }}>
                    <div>
                      {q.image_url && <ImageBlock url={q.image_url} onRemove={() => removeQuestionImage('part1', index)} />}
                      <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Câu {qId}: {renderContent(q.questionText)}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
                        {['A', 'B', 'C', 'D'].map((opt) => (<div key={opt}><strong>{opt}.</strong> {renderContent(q.options[opt])}</div>))}
                      </div>
                    </div>
                    <div style={{ clear: 'both' }} />

                    <div style={styles.toolRow}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 'bold', color: '#10b981' }}>👉 Chọn đáp án:</span>
                        <select style={{ padding: '5px' }} value={editKeys.part1_key[qId] || ''} onChange={(e) => updateKey('part1_key', qId, e.target.value)}>
                          <option value="">- Chọn -</option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                        </select>
                      </div>
                      <div>
                        <UploadBox onFileSelected={(file) => handleQuestionImage('part1', index, file)} />
                        {q.image_url && <button onClick={() => removeQuestionImage('part1', index)} style={styles.deleteImgBtn}>Xóa ảnh</button>}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}

            {/* ==================== PHẦN 2 ==================== */}
            <h4 style={{ color: '#1d4ed8', marginTop: '30px' }}>Phần 2: Trắc nghiệm Đúng/Sai</h4>
            {editContent.part2?.map((q: any, index: number) => {
              const qId = q.id || index + 1;
              const group = findGroupIfFirst('part2', qId);
              return (
                <React.Fragment key={index}>
                  {group && renderGroupBlock(group, editContent.sharedContexts.indexOf(group))}
                  <div style={{ ...styles.previewBox, clear: 'both' }}>
                    <div>
                      {q.image_url && <ImageBlock url={q.image_url} onRemove={() => removeQuestionImage('part2', index)} />}
                      <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Câu {qId}: {renderContent(q.questionText)}</div>
                      {['a', 'b', 'c', 'd'].map((stmt) => (
                        <div key={stmt} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px dashed #e2e8f0' }}>
                          <span><strong>{stmt})</strong> {renderContent(q.statements?.[stmt])}</span>
                          <select style={{ padding: '4px' }} value={editKeys.part2_key?.[qId]?.[stmt] || ''} onChange={(e) => updatePart2Key(qId, stmt, e.target.value)}>
                            <option value="">-</option><option value="Đ">Đ</option><option value="S">S</option>
                          </select>
                        </div>
                      ))}
                    </div>
                    <div style={{ clear: 'both' }} />
                    <div style={styles.toolRow}>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>Đáp án Đúng/Sai chỉnh trực tiếp ở từng dòng phía trên.</span>
                      <div>
                        <UploadBox onFileSelected={(file) => handleQuestionImage('part2', index, file)} />
                        {q.image_url && <button onClick={() => removeQuestionImage('part2', index)} style={styles.deleteImgBtn}>Xóa ảnh</button>}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}

            {/* ==================== PHẦN 3 ==================== */}
            <h4 style={{ color: '#1d4ed8', marginTop: '30px' }}>Phần 3: Trả lời ngắn</h4>
            {editContent.part3?.map((q: any, index: number) => {
              const qId = q.id || index + 1;
              const group = findGroupIfFirst('part3', qId);
              return (
                <React.Fragment key={index}>
                  {group && renderGroupBlock(group, editContent.sharedContexts.indexOf(group))}
                  <div style={{ ...styles.previewBox, clear: 'both' }}>
                    <div>
                      {q.image_url && <ImageBlock url={q.image_url} onRemove={() => removeQuestionImage('part3', index)} />}
                      <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Câu {qId}: {renderContent(q.questionText)}</div>
                    </div>
                    <div style={{ clear: 'both' }} />
                    <div style={styles.toolRow}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 'bold', color: '#10b981' }}>👉 Đáp án đúng:</span>
                        <input type="text" style={{ padding: '5px 10px', borderRadius: '5px', border: '1px solid #cbd5e1', width: '100px' }} value={editKeys.part3_key[qId] || ''} onChange={(e) => updateKey('part3_key', qId, e.target.value)} />
                      </div>
                      <div>
                        <UploadBox onFileSelected={(file) => handleQuestionImage('part3', index, file)} />
                        {q.image_url && <button onClick={() => removeQuestionImage('part3', index)} style={styles.deleteImgBtn}>Xóa ảnh</button>}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', color: '#3b82f6', marginTop: '40px' }}>🛠 Trình sửa mã JSON (nâng cao)</h3>
          <p style={{ fontSize: '13px', color: '#64748b' }}>Chỉ nên sửa ở đây nếu bạn hiểu cấu trúc JSON — mọi thay đổi ở trên đều tự động đồng bộ xuống đây.</p>
          <textarea style={{ ...styles.jsonEditor, borderColor: jsonError ? '#ef4444' : '#3b82f6' }} value={jsonString} onChange={handleJsonChange} spellCheck="false" />
          {jsonError && <p style={{ color: '#ef4444', fontWeight: 'bold', marginTop: '8px' }}>{jsonError}</p>}

          <div style={{ marginTop: '40px', textAlign: 'center', borderTop: '2px solid #e2e8f0', paddingTop: '20px' }}>
            <button onClick={handleSaveExam} disabled={isLoading} style={styles.saveBtn}>{isLoading ? '⏳ Đang lưu...' : '💾 XÁC NHẬN LƯU HỆ THỐNG'}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateExamAI;