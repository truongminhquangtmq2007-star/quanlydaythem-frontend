import React, { useState } from 'react';
import axios from 'axios';

const CreateExamAI = () => {
  // 1. Quản lý trạng thái
  const [documentId, setDocumentId] = useState<number | string>('');
  const [classId, setClassId] = useState<number | string>('');
  const [duration, setDuration] = useState<number | string>(50);
  
  // Trạng thái cho chế độ nhập liệu
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const [rawText, setRawText] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  // Mock data danh sách lớp (Sau này bạn gọi API get danh sách lớp từ Backend để đổ vào đây)
  // Xóa cái mảng classOptions cứng cũ đi và thay bằng State này:
  const [classOptions, setClassOptions] = useState<any[]>([]);

  // Thêm useEffect để gọi API lấy danh sách lớp khi load trang
  React.useEffect(() => {
    const fetchClasses = async () => {
      try {
        const token = localStorage.getItem('token');
        // Thay URL này bằng API lấy danh sách lớp thực tế của bạn
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

  // 2. Hàm gọi API bóc tách đề
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
    setResult(null);

    try {
      const token = localStorage.getItem('token'); 

      let response;

      if (inputMode === 'text') {
        // LUỒNG 1: Dùng JSON như cũ (Đã hoạt động)
        response = await axios.post(
          'https://quanlydaythem-api.onrender.com/api/exams/parse-ai-file',
          {
            document_id: Number(documentId),
            class_id: Number(classId),
            durationMinutes: Number(duration),
            rawText: rawText
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // LUỒNG 2: Dùng FormData để gửi File (Cần nâng cấp Backend ở bước sau)
        const formData = new FormData();
        formData.append('document_id', String(documentId));
        formData.append('class_id', String(classId));
        formData.append('durationMinutes', String(duration));
        formData.append('examFile', selectedFile as File);

        // TÌM VÀ SỬA ĐƯỜNG LINK NÀY:
        const response = await axios.post(
          'https://quanlydaythem-api.onrender.com/api/exams/parse-ai-file', // Đã sửa thành link Render
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
      }
      if (response && response.data){
      setResult(response.data);}
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi gọi AI bóc tách!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // 3. CSS Inline phong cách Dashboard hiện đại
  const styles = {
    container: { maxWidth: '1000px', margin: '30px auto', fontFamily: 'Inter, Arial, sans-serif', color: '#333' },
    card: { backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', padding: '30px' },
    header: { color: '#1e293b', fontSize: '24px', margin: '0 0 20px 0', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '25px' },
    label: { display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' },
    input: { width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' as const },
    tabContainer: { display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0' },
    tab: (active: boolean) => ({
      padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold', borderBottom: active ? '3px solid #3b82f6' : '3px solid transparent', color: active ? '#3b82f6' : '#64748b', transition: 'all 0.2s'
    }),
    uploadBox: { border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '40px', textAlign: 'center' as const, backgroundColor: '#f8fafc', cursor: 'pointer' },
    button: { width: '100%', padding: '15px', backgroundColor: isLoading ? '#94a3b8' : '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: isLoading ? 'not-allowed' : 'pointer', marginTop: '20px', transition: 'background 0.3s' },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.header}>
          <span>📑</span> Quản Lý Thi - Bóc Tách Đề AI
        </h2>

        {/* Thiết lập thông số */}
        <div style={styles.formGrid}>
          <div>
            <label style={styles.label}>Mã tài liệu (Document ID)</label>
            <input type="number" placeholder="Nhập ID..." value={documentId} onChange={(e) => setDocumentId(e.target.value)} style={styles.input} />
          </div>
          <div>
            <label style={styles.label}>Giao đề cho Lớp học</label>
            <select value={classId} onChange={(e) => setClassId(e.target.value)} style={styles.input}>
              <option value="">-- Chọn lớp học --</option>
              {classOptions.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.class_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={styles.label}>Thời gian làm bài (Phút)</label>
            <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} style={styles.input} />
          </div>
        </div>

        {/* Hệ thống Tabs */}
        <div style={styles.tabContainer}>
          <div style={styles.tab(inputMode === 'text')} onClick={() => setInputMode('text')}>
            📝 Nhập văn bản (Word)
          </div>
          <div style={styles.tab(inputMode === 'file')} onClick={() => setInputMode('file')}>
            📎 Tải file lên (PDF/Ảnh)
          </div>
        </div>

        {/* Khu vực Nội dung theo Tab */}
        {inputMode === 'text' ? (
          <div>
            <p style={{ fontSize: '13px', color: '#f59e0b', margin: '0 0 10px 0' }}>💡 Dán văn bản kèm bảng đáp án hoặc bôi đậm đáp án đúng để AI nhận diện.</p>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Dán nội dung đề thi vào đây..."
              style={{ ...styles.input, height: '200px', resize: 'vertical' }}
            />
          </div>
        ) : (
          <div style={styles.uploadBox}>
            <p style={{ fontSize: '16px', color: '#475569', marginBottom: '15px' }}>
              Kéo thả hoặc nhấp để chọn file (Hỗ trợ: .pdf, .png, .jpg)
            </p>
            <input type="file" accept=".pdf, image/*" onChange={handleFileChange} />
            {selectedFile && <p style={{ color: '#10b981', marginTop: '15px', fontWeight: 'bold' }}>Đã chọn: {selectedFile.name}</p>}
          </div>
        )}

        {error && <div style={{ color: '#ef4444', backgroundColor: '#fef2f2', padding: '10px', borderRadius: '8px', marginTop: '15px' }}>❌ {error}</div>}
        
        <button onClick={handleParseExam} disabled={isLoading} style={styles.button}>
          {isLoading ? '⏳ Đang phân tích dữ liệu (Vui lòng đợi)...' : '✨ Bắt Đầu Tạo Đề'}
        </button>
      </div>

{/* KHU VỰC HIỂN THỊ KẾT QUẢ AI BÓC TÁCH (FORMAT 3 PHẦN) */}
      {result && result.examContent && (
        <div style={{ ...styles.card, marginTop: '30px', borderTop: '4px solid #10b981' }}>
          <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', color: '#10b981' }}>
            ✅ Đã nhận phản hồi từ hệ thống
          </h3>
          <p style={{ color: '#f59e0b', fontWeight: 'bold', backgroundColor: '#fef3c7', padding: '10px', borderRadius: '8px' }}>
            Trạng thái Backend: {result.message}
          </p>
          
          {/* PHẦN 1: Trắc nghiệm nhiều lựa chọn */}
          <div style={{ marginTop: '25px' }}>
            <h4 style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '10px 15px', borderRadius: '8px' }}>
              Phần 1: Câu hỏi trắc nghiệm nhiều phương án lựa chọn
            </h4>
            {result.examContent.part1 && result.examContent.part1.length > 0 ? (
              <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                {result.examContent.part1.map((q: any, index: number) => (
                  <div key={index} style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px dashed #cbd5e1' }}>
                    <p style={{ fontWeight: 'bold' }}>Câu {index + 1}: {q.question_text || q.question || 'Nội dung câu hỏi...'}</p>
                    {/* Hỗ trợ linh hoạt nếu AI trả về A,B,C,D rời rạc hoặc mảng options */}
                    <div style={{ marginLeft: '15px', color: '#475569' }}>
                      {q.option_a && <div>A. {q.option_a}</div>}
                      {q.option_b && <div>B. {q.option_b}</div>}
                      {q.option_c && <div>C. {q.option_c}</div>}
                      {q.option_d && <div>D. {q.option_d}</div>}
                      {q.options && Array.isArray(q.options) && q.options.map((opt: string, i: number) => (
                        <div key={i}>{String.fromCharCode(65 + i)}. {opt}</div>
                      ))}
                    </div>
                    {/* Hiển thị đáp án nếu có trong examKey */}
                    {result.examKey?.part1_key && result.examKey.part1_key[index + 1] && (
                      <p style={{ color: '#10b981', fontWeight: 'bold', marginTop: '10px' }}>
                        👉 Đáp án: {result.examKey.part1_key[index + 1]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#94a3b8', fontStyle: 'italic', paddingLeft: '15px' }}>Chưa có dữ liệu hoặc danh sách câu hỏi trống.</p>
            )}
          </div>

          {/* PHẦN 2: Đúng/Sai */}
          <div style={{ marginTop: '25px' }}>
            <h4 style={{ backgroundColor: '#f0fdf4', color: '#15803d', padding: '10px 15px', borderRadius: '8px' }}>
              Phần 2: Câu hỏi trắc nghiệm Đúng/Sai
            </h4>
            {result.examContent.part2 && result.examContent.part2.length > 0 ? (
              <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                {result.examContent.part2.map((q: any, index: number) => (
                  <div key={index} style={{ marginBottom: '15px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '15px' }}>
                    <p style={{ fontWeight: 'bold' }}>Câu {index + 1}: {q.question_text || q.question}</p>
                    {/* Liệt kê các ý a, b, c, d */}
                    <div style={{ marginLeft: '15px', color: '#475569' }}>
                      {q.statements && Array.isArray(q.statements) && q.statements.map((stmt: string, i: number) => (
                        <div key={i}>{String.fromCharCode(97 + i)}) {stmt}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#94a3b8', fontStyle: 'italic', paddingLeft: '15px' }}>Chưa có dữ liệu hoặc danh sách câu hỏi trống.</p>
            )}
          </div>

          {/* PHẦN 3: Tự luận / Trả lời ngắn */}
          <div style={{ marginTop: '25px' }}>
            <h4 style={{ backgroundColor: '#fdf4ff', color: '#a21caf', padding: '10px 15px', borderRadius: '8px' }}>
              Phần 3: Câu hỏi Trả lời ngắn / Tự luận
            </h4>
            {result.examContent.part3 && result.examContent.part3.length > 0 ? (
              <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                {result.examContent.part3.map((q: any, index: number) => (
                  <div key={index} style={{ marginBottom: '15px' }}>
                    <p style={{ fontWeight: 'bold', margin: '0 0 5px 0' }}>Câu {index + 1}:</p>
                    <p style={{ color: '#334155', margin: 0 }}>{q.question_text || q.question}</p>
                    {/* Hiển thị đáp án tự luận/trả lời ngắn */}
                    {result.examKey?.part3_key && result.examKey.part3_key[index + 1] && (
                      <div style={{ backgroundColor: '#f1f5f9', padding: '10px', borderRadius: '5px', marginTop: '10px' }}>
                        <span style={{ fontWeight: 'bold', color: '#475569' }}>Đáp án: </span>
                        <span style={{ color: '#0f172a' }}>{result.examKey.part3_key[index + 1]}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#94a3b8', fontStyle: 'italic', paddingLeft: '15px' }}>Chưa có dữ liệu hoặc danh sách câu hỏi trống.</p>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default CreateExamAI;