import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

// Hàm tiện ích: Render LaTeX và Text để hiển thị Preview
const renderContent = (text: string) => {
  if (!text) return '';
  const parts = text.split('$');
  return parts.map((part, index) => {
    if (index % 2 !== 0) return <InlineMath key={index} math={part} />;
    return <span key={index}>{part}</span>;
  });
};

const CreateExamAI = () => {
  // 1. Quản lý trạng thái thông số
  const [documentId, setDocumentId] = useState<number | string>('');
  const [classId, setClassId] = useState<number | string>('');
  const [duration, setDuration] = useState<number | string>(50);
  
  // Trạng thái nhập liệu
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const [rawText, setRawText] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [classOptions, setClassOptions] = useState<any[]>([]);

  // 2. Trạng thái ĐỂ CHỈNH SỬA (Editable State)
  const [editContent, setEditContent] = useState<any>(null);
  const [editKeys, setEditKeys] = useState<any>(null);

  // Lấy danh sách lớp
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

  // HÀM 1: GỌI AI BÓC TÁCH
  const handleParseExam = async () => {
    if (!documentId || !classId) {
      setError('Vui lòng chọn Mã đề và Lớp học!');
      return;
    }
    if (inputMode === 'text' && !rawText) {
      setError('Vui lòng dán nội dung đề thi!');
      return;
    }
    if (inputMode === 'file' && !selectedFile) {
      setError('Vui lòng chọn file PDF hoặc Hình ảnh!');
      return;
    }

    setIsLoading(true);
    setError('');
    setEditContent(null);
    setEditKeys(null);

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
      
      if (response && response.data) {
        setEditContent(response.data.examContent);
        setEditKeys(response.data.examKey);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi gọi AI bóc tách!');
    } finally {
      setIsLoading(false);
    }
  };

  // HÀM 2: LƯU ĐỀ CHÍNH THỨC VÀO DATABASE
  // HÀM 2: LƯU ĐỀ CHÍNH THỨC VÀO DATABASE
  const handleSaveExam = async () => {
    // ==========================================
    // 🛑 BƯỚC KIỂM TRA: ĐẢM BẢO KHÔNG BỎ TRỐNG ĐÁP ÁN
    // ==========================================
    if (editContent) {
      // 1. Kiểm tra Phần 1 (Trắc nghiệm 1 lựa chọn)
      if (editContent.part1) {
        for (let i = 0; i < editContent.part1.length; i++) {
          const qId = editContent.part1[i].id || i + 1;
          if (!editKeys.part1_key[qId] || editKeys.part1_key[qId].trim() === '') {
            alert(`❌ KHÔNG THỂ LƯU: Bạn chưa chọn đáp án chuẩn cho Câu ${qId} (Phần 1).`);
            return; // Dừng tiến trình lưu
          }
        }
      }

      // 2. Kiểm tra Phần 2 (Đúng/Sai - Phải đủ 4 ý a, b, c, d)
      if (editContent.part2) {
        for (let i = 0; i < editContent.part2.length; i++) {
          const qId = editContent.part2[i].id || i + 1;
          const requiredStmts = ['a', 'b', 'c', 'd'];
          for (const stmt of requiredStmts) {
            // Kiểm tra xem câu đó có tồn tại trong key chưa, và ý đó đã chọn Đ/S chưa
            if (!editKeys.part2_key[qId] || !editKeys.part2_key[qId][stmt] || editKeys.part2_key[qId][stmt].trim() === '') {
              alert(`❌ KHÔNG THỂ LƯU: Bạn chưa chọn Đúng/Sai cho Câu ${qId}, ý ${stmt}) (Phần 2).`);
              return; // Dừng tiến trình lưu
            }
          }
        }
      }

      // 3. Kiểm tra Phần 3 (Trả lời ngắn)
      if (editContent.part3) {
        for (let i = 0; i < editContent.part3.length; i++) {
          const qId = editContent.part3[i].id || i + 1;
          if (!editKeys.part3_key[qId] || editKeys.part3_key[qId].trim() === '') {
            alert(`❌ KHÔNG THỂ LƯU: Bạn chưa nhập đáp án cho Câu ${qId} (Phần 3).`);
            return; // Dừng tiến trình lưu
          }
        }
      }
    }
    // ==========================================

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      await axios.post(
        'https://quanlydaythem-api.onrender.com/api/exams/save-answer-key', 
        {
          document_id: documentId,
          class_id: classId,
          duration_minutes: duration,
          allow_view_answers: true,
          part1_key: editKeys.part1_key,
          part2_key: editKeys.part2_key,
          part3_key: editKeys.part3_key,
          
          // Gửi nội dung câu hỏi đã chỉnh sửa lên Backend
          exam_content: editContent 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('🎉 Đã lưu bộ đề và đáp án thành công vào hệ thống!');
    } catch (err) {
      console.error(err);
      alert('❌ Lỗi khi lưu đề. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Cập nhật State khi gõ
  const updateQuestionText = (part: string, index: number, value: string) => {
    const newContent = { ...editContent }; newContent[part][index].questionText = value; setEditContent(newContent);
  };
  const updateOptionText = (part: string, index: number, optKey: string, value: string) => {
    const newContent = { ...editContent }; newContent[part][index].options[optKey] = value; setEditContent(newContent);
  };
  const updateStatementText = (index: number, stmtKey: string, value: string) => {
    const newContent = { ...editContent }; newContent.part2[index].statements[stmtKey] = value; setEditContent(newContent);
  };
  const updateKey = (partKey: string, qId: number, value: string) => {
    const newKeys = { ...editKeys }; newKeys[partKey][qId] = value; setEditKeys(newKeys);
  };
  const updatePart2Key = (qId: number, stmtKey: string, value: string) => {
    const newKeys = { ...editKeys };
    if (!newKeys.part2_key[qId]) newKeys.part2_key[qId] = {};
    newKeys.part2_key[qId][stmtKey] = value; setEditKeys(newKeys);
  };

  // 3. CSS Inline phong cách Dashboard
  const styles = {
    container: { maxWidth: '1000px', margin: '30px auto', fontFamily: 'Inter, Arial, sans-serif', color: '#333' },
    card: { backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', padding: '30px' },
    header: { color: '#1e293b', fontSize: '24px', margin: '0 0 20px 0', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '25px' },
    label: { display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' },
    input: { width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' as const },
    textarea: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #94a3b8', fontSize: '14px', minHeight: '60px', fontFamily: 'inherit', backgroundColor: '#fff' },
    previewBox: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '6px', marginBottom: '8px', color: '#1e293b', lineHeight: '1.6' },
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

      {/* KHU VỰC CHỈNH SỬA KẾT QUẢ TỪ AI */}
      {editContent && editKeys && (
        <div style={{ ...styles.card, marginTop: '30px', borderTop: '4px solid #10b981' }}>
          <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', color: '#10b981' }}>✏️ Kiểm tra và chỉnh sửa trước khi lưu</h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>* Khung viền xanh nhạt là hiển thị thực tế. Bạn hãy chỉnh sửa code LaTeX ở ô trắng bên dưới.</p>
          
          {/* PHẦN 1 */}
          <div style={{ marginTop: '25px' }}>
            <h4 style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '10px 15px', borderRadius: '8px' }}>Phần 1: Trắc nghiệm nhiều lựa chọn</h4>
            {editContent.part1?.map((q: any, index: number) => {
              const qId = q.id || index + 1;
              return (
                <div key={index} style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px dashed #cbd5e1' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Câu {qId}:</div>
                  <div style={styles.previewBox}>{renderContent(q.questionText)}</div>
                  <textarea style={styles.textarea} value={q.questionText} onChange={(e) => updateQuestionText('part1', index, e.target.value)} />
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                    {['A', 'B', 'C', 'D'].map(opt => (
                      <div key={opt} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontWeight: 'bold', color: '#475569' }}>{opt}.</span>
                          <div style={{ ...styles.previewBox, marginBottom: 0, padding: '5px 10px', flex: 1 }}>{renderContent(q.options[opt])}</div>
                        </div>
                        <input type="text" style={{ ...styles.input, padding: '8px', marginLeft: '22px', width: 'calc(100% - 22px)' }} value={q.options[opt] || ''} onChange={(e) => updateOptionText('part1', index, opt, e.target.value)} />
                      </div>
                    ))}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px', backgroundColor: '#ecfdf5', padding: '10px', borderRadius: '5px' }}>
                    <span style={{ fontWeight: 'bold', color: '#10b981' }}>👉 Đáp án chuẩn:</span>
                    <select style={{ padding: '5px', borderRadius: '5px' }} value={editKeys.part1_key[qId] || ''} onChange={(e) => updateKey('part1_key', qId, e.target.value)}>
                      <option value="">-- Chọn --</option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>

          {/* PHẦN 2 */}
          <div style={{ marginTop: '25px' }}>
            <h4 style={{ backgroundColor: '#f0fdf4', color: '#15803d', padding: '10px 15px', borderRadius: '8px' }}>Phần 2: Đúng/Sai</h4>
            {editContent.part2?.map((q: any, index: number) => {
              const qId = q.id || index + 1;
              return (
                <div key={index} style={{ marginBottom: '20px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '20px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Câu {qId}:</div>
                  <div style={styles.previewBox}>{renderContent(q.questionText)}</div>
                  <textarea style={styles.textarea} value={q.questionText} onChange={(e) => updateQuestionText('part2', index, e.target.value)} />
                  
                  <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {['a', 'b', 'c', 'd'].map(stmt => (
                      <div key={stmt} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <strong>{stmt})</strong>
                          <div style={{ ...styles.previewBox, marginBottom: 0, padding: '5px 10px', flex: 1 }}>{renderContent(q.statements[stmt])}</div>
                          <select style={{ padding: '6px', borderRadius: '5px', backgroundColor: '#fffbeb', border: '1px solid #f59e0b', width: '80px' }} value={editKeys.part2_key?.[qId]?.[stmt] || ''} onChange={(e) => updatePart2Key(qId, stmt, e.target.value)}>
                            <option value="">-Chọn-</option><option value="Đ">Đúng</option><option value="S">Sai</option>
                          </select>
                        </div>
                        <input type="text" style={{ ...styles.input, padding: '8px', marginLeft: '25px', width: 'calc(100% - 115px)' }} value={q.statements[stmt] || ''} onChange={(e) => updateStatementText(index, stmt, e.target.value)} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* PHẦN 3 */}
          <div style={{ marginTop: '25px' }}>
            <h4 style={{ backgroundColor: '#fdf4ff', color: '#a21caf', padding: '10px 15px', borderRadius: '8px' }}>Phần 3: Trả lời ngắn</h4>
            {editContent.part3?.map((q: any, index: number) => {
              const qId = q.id || index + 1;
              return (
                <div key={index} style={{ marginBottom: '20px', paddingBottom: '15px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Câu {qId}:</div>
                  <div style={styles.previewBox}>{renderContent(q.questionText)}</div>
                  <textarea style={styles.textarea} value={q.questionText} onChange={(e) => updateQuestionText('part3', index, e.target.value)} />
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', backgroundColor: '#f1f5f9', padding: '10px', borderRadius: '5px' }}>
                    <span style={{ fontWeight: 'bold', color: '#475569' }}>Đáp án:</span>
                    <input type="text" style={{ ...styles.input, padding: '5px', width: '200px' }} value={editKeys.part3_key[qId] || ''} onChange={(e) => updateKey('part3_key', qId, e.target.value)} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '40px', textAlign: 'center', borderTop: '2px solid #e2e8f0', paddingTop: '20px' }}>
            <button onClick={handleSaveExam} disabled={isLoading} style={styles.saveBtn}>
              {isLoading ? '⏳ Đang lưu...' : '💾 XÁC NHẬN & ĐƯA ĐỀ LÊN HỆ THỐNG'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateExamAI;