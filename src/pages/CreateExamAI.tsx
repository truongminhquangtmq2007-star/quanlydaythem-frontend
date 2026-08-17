import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

// Hàm tiện ích: Render LaTeX an toàn (Chống sập giao diện nếu gõ sai mã Toán)
const renderContent = (text: string) => {
  if (!text) return '';
  const parts = text.split('$');
  return parts.map((part, index) => {
    if (index % 2 !== 0) {
      return (
        <InlineMath 
          key={index} 
          math={part} 
          renderError={(error) => <span style={{ color: 'red', fontWeight: 'bold' }}>${part}$</span>} 
        />
      );
    }
    return <span key={index}>{part}</span>;
  });
};

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
  
  // 👉 STATE MỚI CHO TÍNH NĂNG LIVE JSON EDITOR
  const [jsonString, setJsonString] = useState<string>('');
  const [jsonError, setJsonError] = useState<string>('');

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('https://quanlydaythem-api.onrender.com/api/classes', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setClassOptions(response.data);
      } catch (err) {
        console.error('Lỗi lấy danh sách lớp:', err);
      }
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
          { document_id: Number(documentId), class_id: Number(classId), durationMinutes: Number(duration), rawText: rawText },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        const formData = new FormData();
        formData.append('document_id', String(documentId)); formData.append('class_id', String(classId));
        formData.append('durationMinutes', String(duration)); formData.append('examFile', selectedFile as File);

        response = await axios.post(
          'https://quanlydaythem-api.onrender.com/api/exams/parse-ai-file', 
          formData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
        );
      }
      
      if (response && response.data) {
        setEditContent(response.data.examContent);
        setEditKeys(response.data.examKey);
        // Đổ dữ liệu JSON vào khung Editor
        setJsonString(JSON.stringify(response.data.examContent, null, 2));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi gọi AI bóc tách!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveExam = async () => {
    if (jsonError) {
      alert('❌ KHÔNG THỂ LƯU: Mã JSON của bạn đang bị lỗi cú pháp. Vui lòng sửa lại lỗi báo đỏ ở dưới cùng.');
      return;
    }

    if (editContent) {
      if (editContent.part1) {
        for (let i = 0; i < editContent.part1.length; i++) {
          const qId = editContent.part1[i].id || i + 1;
          if (!editKeys.part1_key[qId] || editKeys.part1_key[qId].trim() === '') return alert(`❌ Bạn chưa chọn đáp án cho Câu ${qId} (Phần 1).`);
        }
      }
      if (editContent.part2) {
        for (let i = 0; i < editContent.part2.length; i++) {
          const qId = editContent.part2[i].id || i + 1;
          for (const stmt of ['a', 'b', 'c', 'd']) {
            if (!editKeys.part2_key[qId] || !editKeys.part2_key[qId][stmt] || editKeys.part2_key[qId][stmt].trim() === '') {
              return alert(`❌ Bạn chưa chọn Đúng/Sai cho Câu ${qId}, ý ${stmt}) (Phần 2).`);
            }
          }
        }
      }
      if (editContent.part3) {
        for (let i = 0; i < editContent.part3.length; i++) {
          const qId = editContent.part3[i].id || i + 1;
          if (!editKeys.part3_key[qId] || editKeys.part3_key[qId].trim() === '') return alert(`❌ Bạn chưa nhập đáp án cho Câu ${qId} (Phần 3).`);
        }
      }
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      await axios.post(
        'https://quanlydaythem-api.onrender.com/api/exams/save-answer-key', 
        {
          document_id: documentId, class_id: classId, duration_minutes: duration, allow_view_answers: true,
          part1_key: editKeys.part1_key, part2_key: editKeys.part2_key, part3_key: editKeys.part3_key,
          exam_content: editContent 
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

  // 👉 HÀM XỬ LÝ KHI NGƯỜI DÙNG GÕ VÀO Ô JSON
  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setJsonString(val);
    try {
      const parsed = JSON.parse(val);
      setEditContent(parsed);
      setJsonError(''); // Nếu parse thành công -> Xóa lỗi
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
    newKeys.part2_key[qId][stmtKey] = value; setEditKeys(newKeys);
  };

  const styles = {
    container: { maxWidth: '1200px', margin: '30px auto', fontFamily: 'Inter, Arial, sans-serif', color: '#333' },
    card: { backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', padding: '30px' },
    header: { color: '#1e293b', fontSize: '24px', margin: '0 0 20px 0', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '25px' },
    label: { display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' },
    input: { width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' as const },
    previewBox: { backgroundColor: '#fff', border: '1px solid #e2e8f0', padding: '15px', borderRadius: '8px', marginBottom: '15px', color: '#1e293b', lineHeight: '1.6', fontSize: '16px' },
    jsonEditor: { width: '100%', height: '500px', padding: '15px', borderRadius: '8px', border: '2px solid #3b82f6', backgroundColor: '#1e293b', color: '#10b981', fontFamily: 'monospace', fontSize: '14px', boxSizing: 'border-box' as const, resize: 'vertical' as const },
    button: { width: '100%', padding: '15px', backgroundColor: isLoading ? '#94a3b8' : '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: isLoading ? 'not-allowed' : 'pointer', marginTop: '20px' },
    saveBtn: { padding: '15px 40px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.header}><span>📑</span> Quản Lý Thi - Bóc Tách Đề AI</h2>
        <div style={styles.formGrid}>
          <div><label style={styles.label}>Mã tài liệu</label><input type="number" placeholder="Nhập ID..." value={documentId} onChange={(e) => setDocumentId(e.target.value)} style={styles.input} /></div>
          <div><label style={styles.label}>Giao đề cho Lớp học</label><select value={classId} onChange={(e) => setClassId(e.target.value)} style={styles.input}><option value="">-- Chọn lớp học --</option>{classOptions.map(cls => <option key={cls.id} value={cls.id}>{cls.class_name}</option>)}</select></div>
          <div><label style={styles.label}>Thời gian (Phút)</label><input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} style={styles.input} /></div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0' }}>
          <div style={{ padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold', borderBottom: inputMode === 'text' ? '3px solid #3b82f6' : '3px solid transparent', color: inputMode === 'text' ? '#3b82f6' : '#64748b' }} onClick={() => setInputMode('text')}>📝 Nhập văn bản (Word)</div>
          <div style={{ padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold', borderBottom: inputMode === 'file' ? '3px solid #3b82f6' : '3px solid transparent', color: inputMode === 'file' ? '#3b82f6' : '#64748b' }} onClick={() => setInputMode('file')}>📎 Tải file lên (PDF/Ảnh)</div>
        </div>

        {inputMode === 'text' ? (
          <textarea value={rawText} onChange={(e) => setRawText(e.target.value)} placeholder="Dán nội dung đề thi vào đây..." style={{ ...styles.input, height: '200px', resize: 'vertical' }} />
        ) : (
          <div style={{ border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '40px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
            <input type="file" accept=".pdf, image/*" onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} />
          </div>
        )}

        {error && <div style={{ color: '#ef4444', backgroundColor: '#fef2f2', padding: '10px', borderRadius: '8px', marginTop: '15px' }}>❌ {error}</div>}
        <button onClick={handleParseExam} disabled={isLoading} style={styles.button}>{isLoading ? '⏳ Đang phân tích dữ liệu...' : '✨ Bắt Đầu Tạo Đề'}</button>
      </div>

      {editContent && editKeys && (
        <div style={{ ...styles.card, marginTop: '30px', borderTop: '4px solid #10b981' }}>
          
          {/* ========================================================== */}
          {/* KHU VỰC 1: LIVE PREVIEW (HIỂN THỊ VĂN BẢN VÀ CHỌN ĐÁP ÁN) */}
          {/* ========================================================== */}
          <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', color: '#10b981' }}>👀 Live Preview (Bản xem trước)</h3>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>Kiểm tra văn bản hiển thị và <strong>chọn đáp án chuẩn</strong> tại đây. Nếu muốn sửa nội dung câu hỏi, hãy sửa ở bảng JSON bên dưới.</p>
          
          <div style={{ maxHeight: '600px', overflowY: 'auto', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            
            {/* PHẦN 1 */}
            <h4 style={{ color: '#1d4ed8' }}>Phần 1: Trắc nghiệm nhiều lựa chọn</h4>
            {editContent.part1?.map((q: any, index: number) => {
              const qId = q.id || index + 1;
              return (
                <div key={index} style={styles.previewBox}>
                  <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Câu {qId}: {renderContent(q.questionText)}</div>
                  {/* Hiển thị ảnh nếu giáo viên điền link vào JSON */}
                  {q.image_url && <img src={q.image_url} alt="Hình vẽ minh họa" style={{ maxWidth: '100%', maxHeight: '300px', marginBottom: '10px', borderRadius: '8px' }} />}
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {['A', 'B', 'C', 'D'].map(opt => (
                      <div key={opt}><strong>{opt}.</strong> {renderContent(q.options[opt])}</div>
                    ))}
                  </div>
                  
                  <div style={{ marginTop: '15px', backgroundColor: '#ecfdf5', padding: '10px', borderRadius: '5px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #a7f3d0' }}>
                    <span style={{ fontWeight: 'bold', color: '#10b981' }}>👉 Chọn đáp án chuẩn:</span>
                    <select style={{ padding: '5px' }} value={editKeys.part1_key[qId] || ''} onChange={(e) => updateKey('part1_key', qId, e.target.value)}>
                      <option value="">- Chọn -</option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                    </select>
                  </div>
                </div>
              );
            })}

            {/* PHẦN 2 */}
            <h4 style={{ color: '#15803d', marginTop: '30px' }}>Phần 2: Đúng/Sai</h4>
            {editContent.part2?.map((q: any, index: number) => {
              const qId = q.id || index + 1;
              return (
                <div key={index} style={styles.previewBox}>
                  <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Câu {qId}: {renderContent(q.questionText)}</div>
                  {q.image_url && <img src={q.image_url} alt="Hình vẽ minh họa" style={{ maxWidth: '100%', maxHeight: '300px', marginBottom: '10px', borderRadius: '8px' }} />}
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {['a', 'b', 'c', 'd'].map(stmt => (
                      <div key={stmt} style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px dashed #e2e8f0', paddingBottom: '8px' }}>
                        <div style={{ flex: 1 }}><strong>{stmt})</strong> {renderContent(q.statements[stmt])}</div>
                        <select style={{ padding: '6px', borderRadius: '5px', backgroundColor: '#fffbeb', border: '1px solid #f59e0b' }} value={editKeys.part2_key?.[qId]?.[stmt] || ''} onChange={(e) => updatePart2Key(qId, stmt, e.target.value)}>
                          <option value="">- Chọn -</option><option value="Đ">Đúng</option><option value="S">Sai</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* PHẦN 3 */}
            <h4 style={{ color: '#a21caf', marginTop: '30px' }}>Phần 3: Trả lời ngắn</h4>
            {editContent.part3?.map((q: any, index: number) => {
              const qId = q.id || index + 1;
              return (
                <div key={index} style={styles.previewBox}>
                  <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Câu {qId}: {renderContent(q.questionText)}</div>
                  {q.image_url && <img src={q.image_url} alt="Hình vẽ minh họa" style={{ maxWidth: '100%', maxHeight: '300px', marginBottom: '10px', borderRadius: '8px' }} />}
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', backgroundColor: '#f1f5f9', padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1' }}>
                    <span style={{ fontWeight: 'bold', color: '#475569' }}>Nhập đáp án chuẩn:</span>
                    <input type="text" style={{ padding: '5px', width: '200px', border: '1px solid #94a3b8', borderRadius: '4px' }} value={editKeys.part3_key[qId] || ''} onChange={(e) => updateKey('part3_key', qId, e.target.value)} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* ========================================================== */}
          {/* KHU VỰC 2: JSON EDITOR (CHỈNH SỬA VĂN BẢN GỐC) */}
          {/* ========================================================== */}
          <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', color: '#3b82f6', marginTop: '40px' }}>🛠 Trình sửa mã JSON (Gõ để cập nhật Preview)</h3>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '10px' }}>Chỉnh sửa trực tiếp lỗi LaTeX, thêm sửa chữ. Bạn có thể thêm <code>"image_url": "link_anh_cua_ban"</code> vào bất kỳ câu nào để chèn hình.</p>
          
          <textarea 
            style={{...styles.jsonEditor, borderColor: jsonError ? '#ef4444' : '#3b82f6'}} 
            value={jsonString} 
            onChange={handleJsonChange} 
            spellCheck="false"
          />
          
          {jsonError && (
            <div style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '12px', borderRadius: '8px', marginTop: '10px', fontWeight: 'bold', border: '1px solid #f87171' }}>
              {jsonError}
            </div>
          )}

          <div style={{ marginTop: '40px', textAlign: 'center', borderTop: '2px solid #e2e8f0', paddingTop: '20px' }}>
            <button onClick={handleSaveExam} disabled={isLoading} style={styles.saveBtn}>
              {isLoading ? '⏳ Đang lưu...' : '💾 XÁC NHẬN ĐỦ ĐÁP ÁN & LƯU LÊN HỆ THỐNG'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateExamAI;