import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useLocation, useNavigate } from 'react-router-dom';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

const ExamEditor = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [examData, setExamData] = useState<any>(location.state?.examContent || null);
  const [meta, setMeta] = useState<any>(location.state?.meta || {});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!examData) {
      alert('Không có dữ liệu đề thi. Vui lòng tải file lại.');
      navigate('/admin/create-exam');
    }
  }, [examData, navigate]);

  if (!examData) return null;

  // Render text containing KaTeX
  const renderMathText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\$+[^$]+\$+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        return <BlockMath key={index} math={part.slice(2, -2)} />;
      } else if (part.startsWith('$') && part.endsWith('$')) {
        return <InlineMath key={index} math={part.slice(1, -1)} />;
      }
      return <span key={index}>{part}</span>;
    });
  };

  const handleUpdateContent = (partKey: string, qIndex: number, field: string, value: string) => {
    const newData = { ...examData };
    newData[partKey][qIndex][field] = value;
    setExamData(newData);
  };

  const handleUpdateOption = (partKey: string, qIndex: number, optKey: string, value: string) => {
    const newData = { ...examData };
    newData[partKey][qIndex].options[optKey] = value;
    setExamData(newData);
  };

      const handlePublish = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const questions: any[] = [];
      const contexts: any[] = [];
      let tempContextIdCounter = 1;

      // Xử lý Shared Contexts
      const contextMap: Record<number, number> = {}; // map original context id to temp_id
      const sharedContexts = examData.sharedContexts || examData.shared_context || [];
      sharedContexts.forEach((ctx: any) => {
        const tempId = tempContextIdCounter++;
        contexts.push({
          temp_id: tempId,
          content: ctx.content,
          image_url: ctx.image_url
        });
        contextMap[ctx.id] = tempId;
      });

      // Xử lý Part 1 (MCQ)
      examData.part1?.forEach((q: any) => {
        questions.push({
          context_temp_id: q.context_id ? contextMap[q.context_id] : null,
          content: q.questionText,
          question_type: 'MCQ',
          difficulty: 'MEDIUM',
          raw_latex: q.questionText,
          options: [
            { content: q.options?.A || '', is_correct: q.correctAnswer === 'A' },
            { content: q.options?.B || '', is_correct: q.correctAnswer === 'B' },
            { content: q.options?.C || '', is_correct: q.correctAnswer === 'C' },
            { content: q.options?.D || '', is_correct: q.correctAnswer === 'D' }
          ]
        });
      });

      // Xử lý Part 2 (TRUE/FALSE)
      examData.part2?.forEach((q: any) => {
        questions.push({
          context_temp_id: q.context_id ? contextMap[q.context_id] : null,
          content: q.questionText,
          question_type: 'TRUE_FALSE',
          difficulty: 'MEDIUM',
          raw_latex: q.questionText,
          options: [
            { content: q.statements?.a || '', is_correct: q.correctAnswer?.a === 'Đ' },
            { content: q.statements?.b || '', is_correct: q.correctAnswer?.b === 'Đ' },
            { content: q.statements?.c || '', is_correct: q.correctAnswer?.c === 'Đ' },
            { content: q.statements?.d || '', is_correct: q.correctAnswer?.d === 'Đ' }
          ]
        });
      });

      // Xử lý Part 3 (SHORT ANSWER)
      examData.part3?.forEach((q: any) => {
        questions.push({
          context_temp_id: q.context_id ? contextMap[q.context_id] : null,
          content: q.questionText,
          question_type: 'SHORT_ANSWER',
          difficulty: 'HARD',
          raw_latex: q.questionText,
          options: [
            { content: q.correctAnswer || '', is_correct: true } // Lưu đáp án đúng duy nhất
          ]
        });
      });

      await axiosClient.post('/api/exams/publish', {
        document_id: meta.document_id,
        title: meta.title || 'Đề thi mới',
        grade: meta.grade || '12',
        subject: meta.subject || 'Chung',
        duration_minutes: meta.duration_minutes || 60,
        questions,
        contexts
      });
      
      alert('Xuất bản đề thi thành công!');
      navigate('/quan-ly-thi'); // Hoặc quay về ExamBank
    } catch (error) {
      console.error(error);
      alert('Lỗi xuất bản đề thi');
    } finally {
      setLoading(false);
    }
  };

  const updatePart2Option = (qIndex: number, optKey: string, value: string) => {
    const newData = { ...examData };
    if (!newData.part2[qIndex].statements) newData.part2[qIndex].statements = {};
    newData.part2[qIndex].statements[optKey] = value;
    setExamData(newData);
  };

  const updatePart2Answer = (qIndex: number, optKey: string, value: string) => {
    const newData = { ...examData };
    if (!newData.part2[qIndex].correctAnswer) newData.part2[qIndex].correctAnswer = {};
    newData.part2[qIndex].correctAnswer[optKey] = value;
    setExamData(newData);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f8fafc', overflow: 'hidden' }}>
      {/* TRÁI: PREVIEW (50%) */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', borderRight: '2px solid #e2e8f0', backgroundColor: 'white' }}>
        <h2 style={{ color: '#1e293b', borderBottom: '2px solid #3b82f6', paddingBottom: '10px' }}>👁️ Bản xem trước Đề thi</h2>
        
        {examData.sharedContexts?.map((ctx: any, i: number) => (
          <div key={`ctx-${i}`} style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#fef3c7', borderRadius: '10px', border: '1px dashed #f59e0b' }}>
            <strong>📌 Ngữ cảnh chung:</strong> {renderMathText(ctx.content)}
          </div>
        ))}

        <h3 style={{ color: '#2563eb' }}>Phần 1: Trắc nghiệm</h3>
        {examData.part1?.map((q: any, i: number) => (
          <div key={`p1-${i}`} style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f1f5f9', borderRadius: '10px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '16px' }}>Câu {q.id || i+1}: {renderMathText(q.questionText)}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ color: q.correctAnswer === 'A' ? '#16a34a' : 'inherit', fontWeight: q.correctAnswer === 'A' ? 'bold' : 'normal' }}>A. {renderMathText(q.options?.A)}</div>
              <div style={{ color: q.correctAnswer === 'B' ? '#16a34a' : 'inherit', fontWeight: q.correctAnswer === 'B' ? 'bold' : 'normal' }}>B. {renderMathText(q.options?.B)}</div>
              <div style={{ color: q.correctAnswer === 'C' ? '#16a34a' : 'inherit', fontWeight: q.correctAnswer === 'C' ? 'bold' : 'normal' }}>C. {renderMathText(q.options?.C)}</div>
              <div style={{ color: q.correctAnswer === 'D' ? '#16a34a' : 'inherit', fontWeight: q.correctAnswer === 'D' ? 'bold' : 'normal' }}>D. {renderMathText(q.options?.D)}</div>
            </div>
          </div>
        ))}

        <h3 style={{ color: '#2563eb' }}>Phần 2: Đúng / Sai</h3>
        {examData.part2?.map((q: any, i: number) => (
          <div key={`p2-${i}`} style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f1f5f9', borderRadius: '10px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '16px' }}>Câu {q.id || i+1}: {renderMathText(q.questionText)}</div>
            {['a', 'b', 'c', 'd'].map(opt => (
              <div key={opt} style={{ display: 'flex', gap: '10px', padding: '5px 0' }}>
                <strong style={{ color: q.correctAnswer?.[opt] === 'Đ' ? '#16a34a' : q.correctAnswer?.[opt] === 'S' ? '#dc2626' : 'inherit' }}>
                  [{q.correctAnswer?.[opt] || '?'}] {opt})
                </strong> 
                {renderMathText(q.statements?.[opt])}
              </div>
            ))}
          </div>
        ))}

        <h3 style={{ color: '#2563eb' }}>Phần 3: Trả lời ngắn</h3>
        {examData.part3?.map((q: any, i: number) => (
          <div key={`p3-${i}`} style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f1f5f9', borderRadius: '10px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '16px' }}>Câu {q.id || i+1}: {renderMathText(q.questionText)}</div>
            <div style={{ color: '#16a34a', fontWeight: 'bold' }}>Đáp án: {q.correctAnswer}</div>
          </div>
        ))}
      </div>

      {/* PHẢI: EDIT FORM (50%) */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: '#f8fafc', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: '#1e293b', margin: 0 }}>✏️ Chỉnh sửa Đề</h2>
          <button onClick={handlePublish} disabled={loading} style={{ padding: '12px 24px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(16,185,129,0.3)' }}>
            {loading ? 'Đang xuất bản...' : 'Xuất bản Đề thi'}
          </button>
        </div>

        {examData.part1?.map((q: any, i: number) => (
          <div key={`edit-p1-${i}`} style={{ marginBottom: '25px', padding: '20px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>P1 - Câu {q.id || i+1}:</label>
            <textarea value={q.questionText} onChange={e => handleUpdateContent('part1', i, 'questionText', e.target.value)} style={{ width: '100%', padding: '10px', minHeight: '60px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '10px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              {['A','B','C','D'].map(opt => (
                <div key={opt}><label>{opt}:</label><input value={q.options?.[opt] || ''} onChange={e => handleUpdateOption('part1', i, opt, e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} /></div>
              ))}
            </div>
            <div style={{ marginTop: '15px' }}>
              <label style={{ fontWeight: 'bold', marginRight: '10px' }}>Đáp án đúng:</label>
              <select value={q.correctAnswer} onChange={e => handleUpdateContent('part1', i, 'correctAnswer', e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
              </select>
            </div>
          </div>
        ))}

        {examData.part2?.map((q: any, i: number) => (
          <div key={`edit-p2-${i}`} style={{ marginBottom: '25px', padding: '20px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>P2 - Câu {q.id || i+1}:</label>
            <textarea value={q.questionText} onChange={e => handleUpdateContent('part2', i, 'questionText', e.target.value)} style={{ width: '100%', padding: '10px', minHeight: '60px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '10px' }} />
            {['a','b','c','d'].map(opt => (
              <div key={opt} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <select value={q.correctAnswer?.[opt] || ''} onChange={e => updatePart2Answer(i, opt, e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '60px' }}>
                  <option value="Đ">Đ</option><option value="S">S</option>
                </select>
                <input value={q.statements?.[opt] || ''} onChange={e => updatePart2Option(i, opt, e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
            ))}
          </div>
        ))}

        {examData.part3?.map((q: any, i: number) => (
          <div key={`edit-p3-${i}`} style={{ marginBottom: '25px', padding: '20px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>P3 - Câu {q.id || i+1}:</label>
            <textarea value={q.questionText} onChange={e => handleUpdateContent('part3', i, 'questionText', e.target.value)} style={{ width: '100%', padding: '10px', minHeight: '60px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '10px' }} />
            <div>
              <label style={{ fontWeight: 'bold' }}>Đáp án:</label>
              <input value={q.correctAnswer || ''} onChange={e => handleUpdateContent('part3', i, 'correctAnswer', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '5px' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExamEditor;
