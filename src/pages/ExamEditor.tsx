import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useLocation, useNavigate } from 'react-router-dom';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { Button } from '../components/ui/Button';

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

  
  const handleImageUpload = async (part: 'part1' | 'part2' | 'part3', index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await axiosClient.post('/api/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.url) {
        handleUpdateContent(part, index, 'image_url', res.data.url);
      }
    } catch (error: any) {
      alert('Lỗi tải ảnh: ' + (error.response?.data?.message || error.message));
    }
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
          part_number: 1,
          part: 'part1',
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
          part_number: 2,
          part: 'part2',
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
          part_number: 3,
          part: 'part3',
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
          contexts,
          class_id: meta.class_id,
          exam_content: examData
        });
      
      alert('Xuất bản đề thi thành công!');
      navigate('/quan-ly-thi'); // Hoặc quay về ExamBank
    } catch (error: any) {
      console.error("Publish Error:", error.response?.data || error);
      alert('Lỗi xuất bản đề thi: ' + (error.response?.data?.message || error.response?.data?.error || JSON.stringify(error.response?.data) || 'Không xác định'));
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
    <div style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--color-background)', overflow: 'hidden' }}>
      {/* TRÁI: PREVIEW (50%) */}
      <div style={{ flex: 1, padding: 'var(--spacing-5)', overflowY: 'auto', borderRight: '2px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <h2 style={{ color: 'var(--color-text)', borderBottom: '2px solid var(--color-primary)', paddingBottom: 'var(--spacing-2)' }}>👁️ Bản xem trước Đề thi</h2>
        
        

        <h3 style={{ color: 'var(--color-primary)' }}>Phần 1: Trắc nghiệm</h3>
        {examData.part1?.map((q: any, i: number) => {
            const ctx = q.context_id && (i === 0 || examData.part1[i - 1].context_id !== q.context_id) ? (examData.sharedContexts || examData.shared_context)?.find((c:any) => String(c.id) === String(q.context_id)) : null;
            return (
              <React.Fragment key={`p1-frag-${i}`}>
                {ctx && (
                  <div style={{ marginBottom: 'var(--spacing-4)', padding: 'var(--spacing-4)', backgroundColor: '#fef3c7', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-warning)' }}>
                    <strong>📖 Ngữ cảnh chung:</strong> {renderMathText(ctx.content)}
                    {ctx.image_url && <div style={{ marginTop: 'var(--spacing-2)' }}><img src={ctx.image_url} style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: 'var(--radius-md)' }} /></div>}
                  </div>
                )}
                <div key={`p1-${i}`} style={{ marginBottom: '25px', padding: 'var(--spacing-4)', backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-2)', fontSize: 'var(--font-size-base)' }}>Câu {q.id || i+1}: {renderMathText(q.questionText)}</div>
  {q.image_url && <div style={{ marginBottom: 'var(--spacing-2)' }}><img src={q.image_url} style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} /></div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-2)' }}>
              <div style={{ color: q.correctAnswer === 'A' ? '#16a34a' : 'inherit', fontWeight: q.correctAnswer === 'A' ? 'bold' : 'normal' }}>A. {renderMathText(q.options?.A)}</div>
              <div style={{ color: q.correctAnswer === 'B' ? '#16a34a' : 'inherit', fontWeight: q.correctAnswer === 'B' ? 'bold' : 'normal' }}>B. {renderMathText(q.options?.B)}</div>
              <div style={{ color: q.correctAnswer === 'C' ? '#16a34a' : 'inherit', fontWeight: q.correctAnswer === 'C' ? 'bold' : 'normal' }}>C. {renderMathText(q.options?.C)}</div>
              <div style={{ color: q.correctAnswer === 'D' ? '#16a34a' : 'inherit', fontWeight: q.correctAnswer === 'D' ? 'bold' : 'normal' }}>D. {renderMathText(q.options?.D)}</div>
            </div>
          </div>
        
              </React.Fragment>
            );
          })}

        <h3 style={{ color: 'var(--color-primary)' }}>Phần 2: Đúng / Sai</h3>
{examData.part2?.map((q: any, i: number) => {
  const ctx = q.context_id && (i === 0 || examData.part2[i - 1].context_id !== q.context_id) 
    ? (examData.sharedContexts || examData.shared_context)?.find((c:any) => String(c.id) === String(q.context_id)) 
    : null;
    
  return (
    <React.Fragment key={`p2-frag-${i}`}>
      {ctx && (
        <div style={{ marginBottom: 'var(--spacing-4)', padding: 'var(--spacing-4)', backgroundColor: '#fef3c7', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-warning)' }}>
          <strong>📖 Ngữ cảnh chung:</strong> {renderMathText(ctx.content)}
          {ctx.image_url && <div style={{ marginTop: 'var(--spacing-2)' }}><img src={ctx.image_url} style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: 'var(--radius-md)' }} /></div>}
        </div>
      )}
      <div key={`p2-${i}`} style={{ marginBottom: '25px', padding: 'var(--spacing-4)', backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-md)' }}>
        <div style={{ fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-2)', fontSize: 'var(--font-size-base)' }}>Câu {q.id || i+1}: {renderMathText(q.questionText)}</div>
        {q.image_url && <div style={{ marginBottom: 'var(--spacing-2)' }}><img src={q.image_url} style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} /></div>}
        {['a', 'b', 'c', 'd'].map(opt => (
          <div key={opt} style={{ display: 'flex', gap: 'var(--spacing-2)', padding: '5px 0' }}>
            <strong style={{ color: q.correctAnswer?.[opt] === 'Đ' ? '#16a34a' : q.correctAnswer?.[opt] === 'S' ? '#dc2626' : 'inherit' }}>
              [{q.correctAnswer?.[opt] || '?'}] {opt})
            </strong> 
            {renderMathText(q.statements?.[opt])}
          </div>
        ))}
      </div>
    </React.Fragment>
  ); // <-- SỬA: Đóng return của Phần 2 tại đây
})}  //  SỬA: Đóng vòng lặp map của Phần 2 tại đây

<h3 style={{ color: 'var(--color-primary)' }}>Phần 3: Trả lời ngắn</h3>
{examData.part3?.map((q: any, i: number) => {
  const ctx = q.context_id && (i === 0 || examData.part3[i - 1].context_id !== q.context_id)
    ? (examData.sharedContexts || examData.shared_context)?.find((c: any) => String(c.id) === String(q.context_id))
    : null;

  return (
    <React.Fragment key={`p3-frag-${i}`}>
      {ctx && (
        <div style={{ marginBottom: 'var(--spacing-4)', padding: 'var(--spacing-4)', backgroundColor: '#fef3c7', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-warning)' }}>
          <strong>📖 Ngữ cảnh chung:</strong> {renderMathText(ctx.content)}
          {ctx.image_url && <div style={{ marginTop: 'var(--spacing-2)' }}><img src={ctx.image_url} style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: 'var(--radius-md)' }} /></div>}
        </div>
      )}
      <div key={`p3-${i}`} style={{ marginBottom: '25px', padding: 'var(--spacing-4)', backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-md)' }}>
        <div style={{ fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-2)', fontSize: 'var(--font-size-base)' }}>Câu {q.id || i+1}: {renderMathText(q.questionText)}</div>
        {q.image_url && <div style={{ marginBottom: 'var(--spacing-2)' }}><img src={q.image_url} style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} /></div>}
        <div style={{ color: '#16a34a', fontWeight: 'var(--font-weight-bold)' }}>Đáp án: {q.correctAnswer}</div>
      </div>
    </React.Fragment>
  );
})}
{/* XÓA thẻ </React.Fragment> thừa bị rớt xuống đây */}
      </div>

      {/* PHẢI: EDIT FORM (50%) */}
      <div style={{ flex: 1, padding: 'var(--spacing-5)', overflowY: 'auto', backgroundColor: 'var(--color-background)', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-5)' }}>
          <h2 style={{ color: 'var(--color-text)', margin: 0 }}>✏️ Chỉnh sửa Đề</h2>
          <Button onClick={handlePublish} disabled={loading} style={{ padding: '12px 24px', backgroundColor: 'var(--color-success)', color: 'var(--color-surface)', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 'var(--font-weight-bold)', cursor: 'pointer', boxShadow: '0 4px 6px rgba(16,185,129,0.3)' }}>
            {loading ? 'Đang xuất bản...' : 'Xuất bản Đề thi'}
          </Button>
        </div>

        {examData.part1?.map((q: any, i: number) => (
          <div key={`edit-p1-${i}`} style={{ marginBottom: '25px', padding: 'var(--spacing-5)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', boxShadow: '0 2px 5px var(--color-border)' }}>
            <label style={{ fontWeight: 'var(--font-weight-bold)', display: 'block', marginBottom: 'var(--spacing-2)' }}>P1 - Câu {q.id || i+1}:</label>
            <textarea value={q.questionText} onChange={e => handleUpdateContent('part1', i, 'questionText', e.target.value)} style={{ width: '100%', padding: 'var(--spacing-2)', minHeight: '60px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: 'var(--spacing-2)' }} />
  <div style={{ marginBottom: 'var(--spacing-2)' }}>
    <label style={{ display: 'inline-block', padding: '6px 12px', backgroundColor: 'var(--color-border)', borderRadius: '6px', cursor: 'pointer', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)' }}>
      📷 Tải ảnh lên
      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload('part1', i, e)} />
    </label>
    {q.image_url && <div style={{ marginTop: 'var(--spacing-2)' }}><img src={q.image_url} alt="Minh họa" style={{ maxWidth: '200px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} /></div>}
  </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
              {['A','B','C','D'].map(opt => (
                <div key={opt}><label>{opt}:</label><input value={q.options?.[opt] || ''} onChange={e => handleUpdateOption('part1', i, opt, e.target.value)} style={{ width: '100%', padding: 'var(--spacing-2)', borderRadius: '6px', border: '1px solid var(--color-border)' }} /></div>
              ))}
            </div>
            <div style={{ marginTop: 'var(--spacing-4)' }}>
              <label style={{ fontWeight: 'var(--font-weight-bold)', marginRight: 'var(--spacing-2)' }}>Đáp án đúng:</label>
              <select value={q.correctAnswer} onChange={e => handleUpdateContent('part1', i, 'correctAnswer', e.target.value)} style={{ padding: 'var(--spacing-2)', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
              </select>
            </div>
          </div>
        ))}

        {examData.part2?.map((q: any, i: number) => (
          <div key={`edit-p2-${i}`} style={{ marginBottom: '25px', padding: 'var(--spacing-5)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', boxShadow: '0 2px 5px var(--color-border)' }}>
            <label style={{ fontWeight: 'var(--font-weight-bold)', display: 'block', marginBottom: 'var(--spacing-2)' }}>P2 - Câu {q.id || i+1}:</label>
            <textarea value={q.questionText} onChange={e => handleUpdateContent('part2', i, 'questionText', e.target.value)} style={{ width: '100%', padding: 'var(--spacing-2)', minHeight: '60px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: 'var(--spacing-2)' }} />
  <div style={{ marginBottom: 'var(--spacing-2)' }}>
    <label style={{ display: 'inline-block', padding: '6px 12px', backgroundColor: 'var(--color-border)', borderRadius: '6px', cursor: 'pointer', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)' }}>
      📷 Tải ảnh lên
      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload('part2', i, e)} />
    </label>
    {q.image_url && <div style={{ marginTop: 'var(--spacing-2)' }}><img src={q.image_url} alt="Minh họa" style={{ maxWidth: '200px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} /></div>}
  </div>
            {['a','b','c','d'].map(opt => (
              <div key={opt} style={{ display: 'flex', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
                <select value={q.correctAnswer?.[opt] || ''} onChange={e => updatePart2Answer(i, opt, e.target.value)} style={{ padding: 'var(--spacing-2)', borderRadius: '6px', border: '1px solid var(--color-border)', width: '60px' }}>
                  <option value="Đ">Đ</option><option value="S">S</option>
                </select>
                <input value={q.statements?.[opt] || ''} onChange={e => updatePart2Option(i, opt, e.target.value)} style={{ flex: 1, padding: 'var(--spacing-2)', borderRadius: '6px', border: '1px solid var(--color-border)' }} />
              </div>
            ))}
          </div>
        ))}

        {examData.part3?.map((q: any, i: number) => (
          <div key={`edit-p3-${i}`} style={{ marginBottom: '25px', padding: 'var(--spacing-5)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', boxShadow: '0 2px 5px var(--color-border)' }}>
            <label style={{ fontWeight: 'var(--font-weight-bold)', display: 'block', marginBottom: 'var(--spacing-2)' }}>P3 - Câu {q.id || i+1}:</label>
            <textarea value={q.questionText} onChange={e => handleUpdateContent('part3', i, 'questionText', e.target.value)} style={{ width: '100%', padding: 'var(--spacing-2)', minHeight: '60px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: 'var(--spacing-2)' }} />
  <div style={{ marginBottom: 'var(--spacing-2)' }}>
    <label style={{ display: 'inline-block', padding: '6px 12px', backgroundColor: 'var(--color-border)', borderRadius: '6px', cursor: 'pointer', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)' }}>
      📷 Tải ảnh lên
      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload('part3', i, e)} />
    </label>
    {q.image_url && <div style={{ marginTop: 'var(--spacing-2)' }}><img src={q.image_url} alt="Minh họa" style={{ maxWidth: '200px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} /></div>}
  </div>
            <div>
              <label style={{ fontWeight: 'var(--font-weight-bold)' }}>Đáp án:</label>
              <input value={q.correctAnswer || ''} onChange={e => handleUpdateContent('part3', i, 'correctAnswer', e.target.value)} style={{ width: '100%', padding: 'var(--spacing-2)', borderRadius: '6px', border: '1px solid var(--color-border)', marginTop: 'var(--spacing-1)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExamEditor;
