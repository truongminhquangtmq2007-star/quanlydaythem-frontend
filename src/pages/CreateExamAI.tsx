import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Wizard } from '../components/ui/Wizard';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import axiosClient from '../api/axiosClient';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

// ==========================================
// HÀM RENDER "BỌC THÉP" TỐI THƯỢNG (XỬ LÝ MỌI KÝ TỰ TÀNG HÌNH & LATEX)
// ==========================================
const renderContent = (text: string) => {
  if (!text) return '';
  let safeText = String(text);
  safeText = safeText.replace(/\\{2,}/g, '\\');
  safeText = safeText.replace(/\\_/g, '_');
  const parts = safeText.split('$');

  return parts.map((part, index) => {
    if (index % 2 === 0) {
      return <span key={index}>{part}</span>;
    }
    let math = part.trim();
    if (!math) return null;

    math = math.replace(/[\u200B-\u200D\uFEFF\u00AD\u2060]/g, '');
    math = math.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
    math = math.replace(/[\r\n\t]/g, '');
    math = math.replace(/\\{2,}/g, '\\');
    math = math.replace(/\\_/g, '_');

    return (
      <InlineMath
        key={index}
        math={math}
        renderError={(error) => (
          <span style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-sm)', fontWeight: 'bold' }}>
            ⚠️ Lỗi công thức: {math} ({error.message})
          </span>
        )}
      />
    );
  });
};

interface SharedContext {
  id: number;
  content: string;
  image_url?: string;
  questionIds: number[];
  part?: string;
}

const CreateExamAI: React.FC = () => {
  const navigate = useNavigate();

  // General Exam Configuration
  const [examTitle, setExamTitle] = useState<string>('');
  const [classId, setClassId] = useState<number | string>('');
  const [duration, setDuration] = useState<number | string>(50);
  const [subject, setSubject] = useState<string>('Toán Học');
  const [grade, setGrade] = useState<string>('12');
  const [topic, setTopic] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('DIFFERENTIATED');
  const [p1Count, setP1Count] = useState<number>(12);
  const [p2Count, setP2Count] = useState<number>(4);
  const [p3Count, setP3Count] = useState<number>(6);
  const [additionalPrompt, setAdditionalPrompt] = useState<string>('');

  // Mode Selection: 'generate' (Prompt AI), 'text' (Paste), 'file' (Upload)
  const [inputMode, setInputMode] = useState<'generate' | 'text' | 'file'>('generate');
  const [rawText, setRawText] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string>('');

  // Loading and State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [classOptions, setClassOptions] = useState<any[]>([]);

  // Generated Exam Content and Keys
  const [editContent, setEditContent] = useState<any>(null);
  const [editKeys, setEditKeys] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  // Single Question Regeneration State
  const [regeneratingQId, setRegeneratingQId] = useState<string | null>(null);

  // JSON Raw Editor
  const [jsonString, setJsonString] = useState<string>('');
  const [jsonError, setJsonError] = useState<string>('');

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await axiosClient.get('/api/classes');
        setClassOptions(response.data || []);
      } catch (err) {
        console.error('Lỗi lấy danh sách lớp:', err);
      }
    };
    fetchClasses();
  }, []);

  // Update default exam title when subject or topic changes
  useEffect(() => {
    if (!examTitle || examTitle.startsWith('Đề thi AI')) {
      const selectedClass = classOptions.find((c: any) => String(c.id) === String(classId));
      const className = selectedClass ? selectedClass.class_name : `Lớp ${grade}`;
      const topicStr = topic ? ` - ${topic}` : '';
      setExamTitle(`Đề thi AI ${subject} (${className})${topicStr}`);
    }
  }, [subject, grade, topic, classId, classOptions]);

  // Adjust counts if English is chosen
  useEffect(() => {
    if (subject.toLowerCase().includes('anh') || subject.toLowerCase().includes('english')) {
      setP1Count(40);
      setP2Count(0);
      setP3Count(0);
    }
  }, [subject]);

  // Handle Generate or Parse
  const handleProcessExam = async () => {
    if (!classId) return setError('Vui lòng chọn Lớp học!');
    if (inputMode === 'generate' && !topic.trim()) {
      return setError('Vui lòng nhập Chủ đề hoặc Trọng tâm kiến thức đề thi!');
    }
    if (inputMode === 'text' && !rawText.trim()) {
      return setError('Vui lòng dán nội dung văn bản đề thi!');
    }
    if (inputMode === 'file' && !selectedFile) {
      return setError('Vui lòng chọn file đề thi (PDF, DOCX, Ảnh)!');
    }

    setIsLoading(true);
    setError('');
    setValidationErrors([]);
    setEditContent(null);
    setEditKeys(null);
    setJsonString('');
    setJsonError('');

    try {
      let responseData: any = null;

      if (inputMode === 'generate') {
        setLoadingMessage('✨ AI đang phân tích tiêu chuẩn đề thi & cấu trúc ma trận...');
        const t1 = setTimeout(() => setLoadingMessage('⚙️ Đang tạo và giải chi tiết từng câu hỏi Part 1, 2, 3...'), 3000);
        const t2 = setTimeout(() => setLoadingMessage('🔍 Đang kiểm tra chất lượng đề thi, LaTeX và đáp án...'), 25000);

        const response = await axiosClient.post(
          '/api/exams/generate-ai-exam',
          {
            action: 'generate',
            subject,
            grade,
            topic,
            questionCount: {
              part1: Number(p1Count),
              part2: Number(p2Count),
              part3: Number(p3Count)
            },
            difficulty,
            durationMinutes: Number(duration),
            class_id: classId ? Number(classId) : undefined,
            additionalPrompt
          },
          { timeout: 180000 }
        );

        clearTimeout(t1);
        clearTimeout(t2);
        responseData = response.data;
      } else if (inputMode === 'text') {
        setLoadingMessage('📝 AI đang đọc và bóc tách cấu trúc văn bản đề thi...');
        const response = await axiosClient.post(
          '/api/exams/parse-ai-text',
          { document_id: 0, class_id: Number(classId), durationMinutes: Number(duration), rawText },
          { timeout: 180000 }
        );
        responseData = response.data;
      } else {
        setLoadingMessage('📄 Đang tải file lên và AI bóc tách nội dung đề thi...');
        const formData = new FormData();
        formData.append('document_id', '0');
        formData.append('class_id', String(classId));
        formData.append('durationMinutes', String(duration));
        formData.append('examFile', selectedFile as File);

        const response = await axiosClient.post(
          '/api/exams/parse-ai-file',
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 180000 }
        );
        responseData = response.data?.data || response.data;
        if (responseData?.file_url) {
          setFileUrl(responseData.file_url);
        }
      }

      if (responseData && responseData.examContent) {
        const content = responseData.examContent;
        if (!content.sharedContexts) content.sharedContexts = content.shared_context || [];
        setEditContent(content);
        setEditKeys(responseData.examKey || {});
        setValidationErrors(responseData.validationErrors || responseData.errors || []);
        setIsLoading(false);
        setCurrentStep(2); // Jump directly to Preview & Edit step
        toast.success(responseData.message || 'Khởi tạo đề thi thành công!');
      } else {
        setIsLoading(false);
        toast.error('Không nhận được dữ liệu cấu trúc đề thi hợp lệ từ AI.');
      }
    } catch (err: any) {
      setIsLoading(false);
      console.error('Lỗi khi tạo/bóc tách đề thi:', err);
      if (err.code === 'ECONNABORTED' || err.response?.status === 504) {
        toast.error('Hệ thống AI đang quá tải hoặc tốn quá nhiều thời gian phản hồi. Vui lòng thử lại sau.');
      } else if (err.response?.status === 429) {
        toast.error('Hạn ngạch AI tạm thời đạt giới hạn. Vui lòng thử lại sau ít phút.');
      } else if (err.response?.data?.errors) {
        setValidationErrors(err.response.data.errors);
        if (err.response.data.examContent) {
          setEditContent(err.response.data.examContent);
          setCurrentStep(2);
        }
        toast.warn('Đề thi tạo ra có một số điểm chưa chuẩn. Bạn có thể sửa trực tiếp trên màn hình.');
      } else {
        toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi tạo đề thi!');
      }
    }
  };

  // Regenerate Single Question via AI
  const handleRegenerateQuestion = async (part: 'part1' | 'part2' | 'part3', qId: number) => {
    const currentQ = editContent?.[part]?.find((q: any) => q.id === qId);
    if (!currentQ) return;

    setRegeneratingQId(`${part}_${qId}`);
    try {
      const res = await axiosClient.post('/api/exams/generate-ai-exam', {
        action: 'regenerate_question',
        subject,
        grade,
        topic: currentQ.topic || topic || 'Chung',
        difficulty: currentQ.difficulty || difficulty,
        targetQuestion: {
          part,
          id: qId,
          currentQuestion: currentQ
        }
      });

      if (res.data?.success && res.data?.data?.question) {
        const newQ = res.data.data.question;
        setEditContent((prev: any) => {
          const updatedList = (prev[part] || []).map((q: any) => (q.id === qId ? newQ : q));
          const updatedContent = { ...prev, [part]: updatedList };
          setJsonString(JSON.stringify(updatedContent, null, 2));
          return updatedContent;
        });

        // Sync editKeys
        setEditKeys((prev: any) => {
          const keyField = `${part}_key`;
          return {
            ...prev,
            [keyField]: {
              ...(prev?.[keyField] || {}),
              [qId]: newQ.correctAnswer
            }
          };
        });

        toast.success(`Đã đổi mới câu ${qId} thành công!`);
      } else {
        toast.error('AI không trả về câu hỏi hợp lệ.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Lỗi khi tạo lại câu hỏi bằng AI');
    } finally {
      setRegeneratingQId(null);
    }
  };

  // Update Part 1 or Part 3 key and content
  const updateKey = (partKey: 'part1_key' | 'part3_key', qId: number, value: string) => {
    setEditKeys((prev: any) => ({
      ...prev,
      [partKey]: {
        ...(prev?.[partKey] || {}),
        [qId]: value
      }
    }));

    const part = partKey === 'part1_key' ? 'part1' : 'part3';
    setEditContent((prev: any) => {
      const newContent = {
        ...prev,
        [part]: (prev[part] || []).map((q: any) => (q.id === qId ? { ...q, correctAnswer: value } : q))
      };
      setJsonString(JSON.stringify(newContent, null, 2));
      return newContent;
    });
  };

  // Update Part 2 statement answer
  const updatePart2Key = (qId: number, stmtKey: string, value: 'Đ' | 'S') => {
    setEditKeys((prev: any) => ({
      ...prev,
      part2_key: {
        ...(prev?.part2_key || {}),
        [qId]: {
          ...(prev?.part2_key?.[qId] || {}),
          [stmtKey]: value
        }
      }
    }));

    setEditContent((prev: any) => {
      const newContent = {
        ...prev,
        part2: (prev.part2 || []).map((q: any) => {
          if (q.id !== qId) return q;
          return {
            ...q,
            correctAnswer: {
              ...(q.correctAnswer || {}),
              [stmtKey]: value
            }
          };
        })
      };
      setJsonString(JSON.stringify(newContent, null, 2));
      return newContent;
    });
  };

  // In-place text update for question content or explanation
  const _handleUpdateQuestionField = (part: 'part1' | 'part2' | 'part3', qId: number, field: string, val: string) => {
    setEditContent((prev: any) => {
      const newContent = {
        ...prev,
        [part]: (prev[part] || []).map((q: any) => (q.id === qId ? { ...q, [field]: val } : q))
      };
      setJsonString(JSON.stringify(newContent, null, 2));
      return newContent;
    });
  };

  // In-place update for Part 1 option text
  const _handleUpdateOption = (qId: number, optKey: string, val: string) => {
    setEditContent((prev: any) => {
      const newContent = {
        ...prev,
        part1: (prev.part1 || []).map((q: any) => {
          if (q.id !== qId) return q;
          return {
            ...q,
            options: {
              ...(q.options || {}),
              [optKey]: val
            }
          };
        })
      };
      setJsonString(JSON.stringify(newContent, null, 2));
      return newContent;
    });
  };

  // In-place update for Part 2 statement text
  const _handleUpdateStatement = (qId: number, stmtKey: string, val: string) => {
    setEditContent((prev: any) => {
      const newContent = {
        ...prev,
        part2: (prev.part2 || []).map((q: any) => {
          if (q.id !== qId) return q;
          return {
            ...q,
            statements: {
              ...(q.statements || {}),
              [stmtKey]: val
            }
          };
        })
      };
      setJsonString(JSON.stringify(newContent, null, 2));
      return newContent;
    });
  };

  // Save Draft or Publish Exam
  const handleSaveOrPublish = async (isDraft: boolean = false) => {
    if (!examTitle.trim()) {
      toast.error('Vui lòng nhập Tên đề thi trước khi lưu!');
      return;
    }
    if (!editContent?.part1 || !editContent?.part2 || !editContent?.part3) {
      toast.error('Dữ liệu cấu trúc đề thi không hợp lệ.');
      return;
    }

    // Pre-flight check when publishing (non-draft)
    if (!isDraft) {
      const invalidP1 = editContent.part1.some((q: any) => !['A', 'B', 'C', 'D'].includes(String(q.correctAnswer || '').trim().toUpperCase()));
      if (invalidP1) {
        toast.error('Có câu hỏi Phần 1 chưa chọn đáp án đúng hợp lệ [A, B, C, D]!');
        return;
      }
      const invalidP2 = editContent.part2.some((q: any) => {
        const c = q.correctAnswer || {};
        return !['Đ', 'S'].includes(c.a) || !['Đ', 'S'].includes(c.b) || !['Đ', 'S'].includes(c.c) || !['Đ', 'S'].includes(c.d);
      });
      if (invalidP2) {
        toast.error('Có câu hỏi Phần 2 chưa nhập đủ đáp án Đúng/Sai cho cả 4 mệnh đề!');
        return;
      }
      const invalidP3 = editContent.part3.some((q: any) => !String(q.correctAnswer || '').trim());
      if (invalidP3) {
        toast.error('Có câu hỏi Phần 3 chưa nhập đáp án trả lời ngắn!');
        return;
      }
    }

    setIsLoading(true);
    setLoadingMessage(isDraft ? '💾 Đang lưu bản nháp đề thi...' : '🚀 Đang xuất bản đề thi lên hệ thống...');
    try {
      const res = await axiosClient.post('/api/exams/publish', {
        document_id: 0,
        title: examTitle,
        grade,
        subject,
        duration_minutes: Number(duration),
        class_id: classId ? Number(classId) : null,
        exam_content: editContent,
        allow_view_answers: true,
        file_url: fileUrl || 'ai-generated',
        is_draft: isDraft
      });

      if (res.data?.success) {
        toast.success(isDraft ? '🎉 Đã lưu nháp đề thi thành công!' : '🎉 Xuất bản đề thi thành công!');
        navigate('/quan-ly-thi');
      } else {
        toast.error(res.data?.message || 'Có lỗi xảy ra khi lưu đề thi.');
      }
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.errors) {
        setValidationErrors(err.response.data.errors);
        toast.error(`Lỗi kiểm định khảo thí: ${err.response.data.errors[0]?.message || 'Dữ liệu chưa đạt chuẩn'}`);
      } else {
        toast.error(err.response?.data?.message || 'Lỗi server khi lưu đề thi');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const findGroupIfFirst = (part: 'part1' | 'part2' | 'part3', qId: number): SharedContext | null => {
    const groups: SharedContext[] = editContent?.sharedContexts || editContent?.shared_context || [];
    const group = groups.find((g) => {
      const qIds = (g.questionIds || (g as any).question_ids || []).map(Number);
      const inPart = g.part === part || (!g.part && (editContent?.[part] || []).some((q: any) => qIds.includes(Number(q.id))));
      return inPart && qIds.includes(Number(qId));
    });
    if (!group) return null;
    const qIds = (group.questionIds || (group as any).question_ids || []).map(Number);
    const minId = Math.min(...qIds);
    return Number(qId) === minId ? group : null;
  };

  return (
    <div style={{ padding: 'var(--spacing-6)', maxWidth: '1100px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: 'var(--spacing-6)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
        <span style={{ fontSize: 'var(--font-size-3xl)' }}>✨</span> Tạo Đề Thi Với AI (Production Engine)
      </h1>

      {isLoading ? (
        <Card style={{ padding: 'var(--spacing-10)', textAlign: 'center' }}>
          <div className="spinner" style={{ fontSize: '48px', color: 'var(--color-primary)', margin: '0 auto var(--spacing-6) auto' }}></div>
          <h2 style={{ color: 'var(--color-primary)', marginBottom: 'var(--spacing-3)' }}>{loadingMessage || 'AI đang làm việc...'}</h2>
          <p className="text-secondary">Quá trình khởi tạo và kiểm định có thể mất từ 30s đến 2 phút. Vui lòng không đóng trình duyệt.</p>
        </Card>
      ) : (
        <Wizard
          currentStep={currentStep}
          onNext={() => {
            if (currentStep === 1) {
              handleProcessExam();
            } else {
              setCurrentStep((c) => c + 1);
            }
          }}
          onPrev={() => setCurrentStep((c) => c - 1)}
          onSubmit={() => handleSaveOrPublish(false)}
          isSubmitting={isLoading}
          submitLabel="Xuất bản đề thi"
          steps={[
            // STEP 1: GENERAL CONFIG
            {
              id: 'config',
              label: '1. Cấu hình chung',
              isValid: !!examTitle && !!classId,
              content: (
                <div className="flex flex-col gap-5">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                    <div className="flex flex-col gap-2">
                      <label style={{ fontWeight: 500, fontSize: '14px' }}>Môn học <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                      <select className="input-base" value={subject} onChange={(e) => setSubject(e.target.value)}>
                        <option value="Toán Học">Toán Học</option>
                        <option value="Vật Lý">Vật Lý</option>
                        <option value="Hóa Học">Hóa Học</option>
                        <option value="Sinh Học">Sinh Học</option>
                        <option value="Tiếng Anh">Tiếng Anh</option>
                        <option value="Lịch Sử">Lịch Sử</option>
                        <option value="Địa Lý">Địa Lý</option>
                        <option value="Tin Học">Tin Học</option>
                        <option value="Khoa Học Tự Nhiên">Khoa Học Tự Nhiên</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label style={{ fontWeight: 500, fontSize: '14px' }}>Khối lớp <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                      <select className="input-base" value={grade} onChange={(e) => setGrade(e.target.value)}>
                        <option value="12">Lớp 12 (Ôn thi THPT)</option>
                        <option value="11">Lớp 11</option>
                        <option value="10">Lớp 10</option>
                        <option value="9">Lớp 9</option>
                        <option value="8">Lớp 8</option>
                        <option value="7">Lớp 7</option>
                        <option value="6">Lớp 6</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label style={{ fontWeight: 500, fontSize: '14px' }}>Lớp học giảng dạy <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                      <select className="input-base" value={classId} onChange={(e) => setClassId(e.target.value)} required>
                        <option value="">-- Chọn lớp học --</option>
                        {classOptions.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.class_name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label style={{ fontWeight: 500, fontSize: '14px' }}>Thời gian làm bài (Phút)</label>
                      <Input type="number" value={duration as any} onChange={(e) => setDuration(e.target.value)} min={15} max={180} />
                    </div>
                  </div>

                  <Input
                    label="Tên đề thi hiển thị"
                    placeholder="VD: Đề thi Giữa kỳ 1 Toán 12 - Chương Hàm Số"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    required
                  />
                </div>
              )
            },

            // STEP 2: SOURCE & SPECIFICATIONS
            {
              id: 'source',
              label: '2. Tiêu chí & Nguồn đề',
              isValid: inputMode === 'generate' ? (!!topic.trim() || !!rawText.trim()) : (inputMode === 'text' ? !!rawText.trim() : !!selectedFile),
              content: (
                <div className="flex flex-col gap-5">
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <Button
                      variant={inputMode === 'generate' ? 'primary' : 'outline'}
                      onClick={() => setInputMode('generate')}
                      style={{ flex: 1, minWidth: '180px' }}
                    >
                      ✨ AI Tự Động Soạn Đề
                    </Button>
                    <Button
                      variant={inputMode === 'text' ? 'primary' : 'outline'}
                      onClick={() => setInputMode('text')}
                      style={{ flex: 1, minWidth: '180px' }}
                    >
                      📝 Bóc Tách Văn Bản (Text)
                    </Button>
                    <Button
                      variant={inputMode === 'file' ? 'primary' : 'outline'}
                      onClick={() => setInputMode('file')}
                      style={{ flex: 1, minWidth: '180px' }}
                    >
                      📄 Tải Lên Tệp Đề (PDF/Ảnh)
                    </Button>
                  </div>

                  {inputMode === 'generate' && (
                    <div className="flex flex-col gap-4" style={{ backgroundColor: 'var(--color-surface)', padding: '20px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                      <Input
                        label="Chủ đề / Kiến thức trọng tâm *"
                        placeholder="VD: Tính đơn điệu, cực trị của hàm số và bài toán tương giao đồ thị"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        required
                      />

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        <div className="flex flex-col gap-2">
                          <label style={{ fontWeight: 500, fontSize: '14px' }}>Mức độ đề thi</label>
                          <select className="input-base" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                            <option value="DIFFERENTIATED">Chuẩn phân hóa THPT (40% NB - 30% TH - 30% VD)</option>
                            <option value="EASY">Cơ bản / Nhận biết (Ôn tập nắm chắc điểm 7)</option>
                            <option value="MEDIUM">Trung bình / Thông hiểu (Mục tiêu 8 điểm)</option>
                            <option value="HARD">Vận dụng cao / Nâng cao (Mục tiêu 9+ điểm)</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-2">
                          <label style={{ fontWeight: 500, fontSize: '14px' }}>Phần 1: Trắc nghiệm 4 lựa chọn</label>
                          <Input type="number" value={p1Count} onChange={(e) => setP1Count(Math.max(0, Number(e.target.value)))} min={0} />
                        </div>

                        <div className="flex flex-col gap-2">
                          <label style={{ fontWeight: 500, fontSize: '14px' }}>Phần 2: Đúng / Sai (4 ý)</label>
                          <Input type="number" value={p2Count} onChange={(e) => setP2Count(Math.max(0, Number(e.target.value)))} min={0} />
                        </div>

                        <div className="flex flex-col gap-2">
                          <label style={{ fontWeight: 500, fontSize: '14px' }}>Phần 3: Trả lời ngắn</label>
                          <Input type="number" value={p3Count} onChange={(e) => setP3Count(Math.max(0, Number(e.target.value)))} min={0} />
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label style={{ fontWeight: 500, fontSize: '14px' }}>Yêu cầu bổ sung cho AI (Tùy chọn)</label>
                        <textarea
                          className="input-base"
                          rows={3}
                          placeholder="VD: Cho nhiều câu hỏi liên hệ thực tế, tránh các dạng toán mẹo, viết lời giải chi tiết từng bước..."
                          value={additionalPrompt}
                          onChange={(e) => setAdditionalPrompt(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {inputMode === 'text' && (
                    <div className="flex flex-col gap-2">
                      <label style={{ fontWeight: 500, fontSize: '14px' }}>Dán văn bản đề thi</label>
                      <textarea
                        className="input-base"
                        rows={10}
                        placeholder="Dán toàn bộ câu hỏi và đáp án vào đây..."
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                      />
                    </div>
                  )}

                  {inputMode === 'file' && (
                    <div style={{ padding: '30px', border: '2px dashed var(--color-border)', borderRadius: '8px', textAlign: 'center', backgroundColor: 'var(--color-surface-hover)' }}>
                      <div style={{ fontSize: '48px', marginBottom: '12px' }}>📄</div>
                      <input
                        type="file"
                        accept=".pdf,.docx,.png,.jpg,.jpeg"
                        onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                        id="file-upload"
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'inline-flex', padding: '8px 16px', backgroundColor: 'var(--color-primary)', color: '#fff', borderRadius: '6px', fontWeight: 500 }}>
                        Chọn tệp tải lên
                      </label>
                      {selectedFile && <p style={{ marginTop: '12px', color: 'var(--color-success)', fontWeight: 500 }}>Đã chọn: {selectedFile.name}</p>}
                      <p className="text-secondary" style={{ marginTop: '8px', fontSize: '13px' }}>Hỗ trợ PDF, DOCX, Ảnh (tối đa 10MB)</p>
                    </div>
                  )}

                  {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}
                </div>
              )
            },

            // STEP 3: PREVIEW & IN-PLACE EDIT
            {
              id: 'preview',
              label: '3. Kiểm tra & Chỉnh sửa',
              isValid: !!editContent,
              content: (
                <div className="flex flex-col gap-4">
                  {!editContent ? (
                    <div className="text-center text-muted" style={{ padding: '30px' }}>
                      Chưa có dữ liệu. Vui lòng quay lại bước trước để AI tạo hoặc bóc tách đề thi.
                    </div>
                  ) : (
                    <>
                      {/* Status and Action Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-success-soft)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--color-success)' }}>
                        <div style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>
                          ✅ Đề thi đã sẵn sàng! (Phần 1: {editContent.part1?.length || 0} câu | Phần 2: {editContent.part2?.length || 0} câu | Phần 3: {editContent.part3?.length || 0} câu)
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Button variant="outline" size="sm" onClick={() => setJsonString(jsonString ? '' : JSON.stringify(editContent, null, 2))}>
                            {jsonString ? 'Ẩn JSON' : '⚙️ Sửa JSON'}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleSaveOrPublish(true)}>
                            💾 Lưu nháp
                          </Button>
                          <Button variant="primary" size="sm" onClick={() => handleSaveOrPublish(false)}>
                            🚀 Xuất bản ngay
                          </Button>
                        </div>
                      </div>

                      {/* Validation Errors Notice if any */}
                      {validationErrors.length > 0 && (
                        <div style={{ backgroundColor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '8px', padding: '12px 16px', color: '#be123c' }}>
                          <strong>⚠️ Chú ý khảo thí ({validationErrors.length} điểm cần lưu ý):</strong>
                          <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                            {validationErrors.map((err: any, i: number) => (
                              <li key={i} style={{ fontSize: '13px' }}>{err.message}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {jsonString !== '' ? (
                        <div style={{ marginTop: '10px' }}>
                          <h3 style={{ marginBottom: '8px' }}>Chỉnh sửa trực tiếp dữ liệu JSON</h3>
                          <textarea
                            className="input-base"
                            rows={15}
                            value={jsonString}
                            onChange={(e) => setJsonString(e.target.value)}
                            style={{ fontFamily: 'monospace', fontSize: '13px' }}
                          />
                          {jsonError && <p style={{ color: 'var(--color-danger)', marginTop: '8px' }}>{jsonError}</p>}
                          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            <Button variant="primary" onClick={() => { try { setEditContent(JSON.parse(jsonString)); setJsonError(''); toast.success('Đã lưu thay đổi JSON!'); } catch (_e) { setJsonError('Lỗi cú pháp JSON'); } }}>
                              Lưu thay đổi JSON
                            </Button>
                            <Button variant="ghost" onClick={() => setJsonString('')}>Đóng</Button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ maxHeight: '68vh', overflowY: 'auto', padding: '16px', border: '1px solid var(--color-border)', borderRadius: '8px', backgroundColor: 'var(--color-surface)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                          {/* PART 1 */}
                          {editContent.part1 && editContent.part1.length > 0 && (
                            <div>
                              <div style={{ color: 'var(--color-primary)', fontWeight: 'bold', fontSize: '16px', borderBottom: '2px solid var(--color-primary)', paddingBottom: '6px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>PHẦN I. CÂU TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN ({editContent.part1.length} CÂU)</span>
                              </div>

                              {editContent.part1.map((q: any, idx: number) => {
                                const group = findGroupIfFirst('part1', q.id);
                                const isRegen = regeneratingQId === `part1_${q.id}`;
                                return (
                                  <div key={q.id || idx} style={{ marginBottom: '16px', padding: '16px', borderRadius: '8px', backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)' }}>
                                    {group && (
                                      <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '8px 12px', marginBottom: '10px', color: '#92400e', fontSize: '13px' }}>
                                        <strong>📖 Ngữ liệu chung cho câu {group.questionIds.join(', ')}:</strong>
                                        <div style={{ marginTop: '4px' }}>{renderContent(group.content)}</div>
                                      </div>
                                    )}

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '10px' }}>
                                      <div style={{ fontWeight: 600, flex: 1 }}>
                                        <span style={{ color: 'var(--color-primary)' }}>Câu {q.id || idx + 1}: </span>
                                        {renderContent(q.questionText)}
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRegenerateQuestion('part1', q.id)}
                                        disabled={isRegen}
                                        style={{ fontSize: '12px', padding: '4px 8px' }}
                                      >
                                        {isRegen ? '🔄 Đang đổi...' : '🔄 Đổi câu này'}
                                      </Button>
                                    </div>

                                    {/* Options Grid */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', marginBottom: '10px' }}>
                                      {['A', 'B', 'C', 'D'].map((opt) => {
                                        const isCorrect = (q.correctAnswer === opt || editKeys.part1_key?.[q.id] === opt);
                                        return (
                                          <div
                                            key={opt}
                                            onClick={() => updateKey('part1_key', q.id, opt)}
                                            style={{
                                              padding: '10px 12px',
                                              borderRadius: '6px',
                                              border: isCorrect ? '2px solid var(--color-success)' : '1px solid var(--color-border)',
                                              backgroundColor: isCorrect ? '#ecfdf5' : 'var(--color-surface)',
                                              cursor: 'pointer',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '8px'
                                            }}
                                          >
                                            <span style={{ fontWeight: 'bold', color: isCorrect ? 'var(--color-success)' : 'inherit' }}>{opt}.</span>
                                            <span style={{ fontSize: '13px' }}>{renderContent(q.options?.[opt] || '')}</span>
                                            {isCorrect && <span style={{ marginLeft: 'auto', color: 'var(--color-success)', fontWeight: 'bold', fontSize: '12px' }}>✓ Đúng</span>}
                                          </div>
                                        );
                                      })}
                                    </div>

                                    {q.explanation && (
                                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-surface)', padding: '8px 12px', borderRadius: '4px' }}>
                                        <strong>💡 Lời giải / Phương pháp:</strong> {renderContent(q.explanation)}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* PART 2 */}
                          {editContent.part2 && editContent.part2.length > 0 && (
                            <div>
                              <div style={{ color: '#d97706', fontWeight: 'bold', fontSize: '16px', borderBottom: '2px solid #f59e0b', paddingBottom: '6px', marginBottom: '16px' }}>
                                PHẦN II. CÂU TRẮC NGHIỆM ĐÚNG / SAI ({editContent.part2.length} CÂU)
                              </div>

                              {editContent.part2.map((q: any, idx: number) => {
                                const group = findGroupIfFirst('part2', q.id);
                                const isRegen = regeneratingQId === `part2_${q.id}`;
                                return (
                                  <div key={q.id || idx} style={{ marginBottom: '16px', padding: '16px', borderRadius: '8px', backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)' }}>
                                    {group && (
                                      <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '8px 12px', marginBottom: '10px', color: '#92400e', fontSize: '13px' }}>
                                        <strong>📖 Ngữ liệu chung cho câu {group.questionIds.join(', ')}:</strong>
                                        <div style={{ marginTop: '4px' }}>{renderContent(group.content)}</div>
                                      </div>
                                    )}

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '10px' }}>
                                      <div style={{ fontWeight: 600, flex: 1 }}>
                                        <span style={{ color: '#d97706' }}>Câu {q.id || idx + 1}: </span>
                                        {renderContent(q.questionText)}
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRegenerateQuestion('part2', q.id)}
                                        disabled={isRegen}
                                        style={{ fontSize: '12px', padding: '4px 8px' }}
                                      >
                                        {isRegen ? '🔄 Đang đổi...' : '🔄 Đổi câu này'}
                                      </Button>
                                    </div>

                                    {/* Statements Table */}
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '10px' }}>
                                      <tbody>
                                        {['a', 'b', 'c', 'd'].map((stmt) => {
                                          const ans = q.correctAnswer?.[stmt] || editKeys.part2_key?.[q.id]?.[stmt];
                                          return (
                                            <tr key={stmt} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                              <td style={{ padding: '8px' }}>
                                                <strong>{stmt})</strong> {renderContent(q.statements?.[stmt] || '')}
                                              </td>
                                              <td style={{ width: '140px', textAlign: 'right', padding: '8px' }}>
                                                <div style={{ display: 'inline-flex', gap: '6px' }}>
                                                  <button
                                                    type="button"
                                                    onClick={() => updatePart2Key(q.id, stmt, 'Đ')}
                                                    style={{
                                                      padding: '4px 12px',
                                                      borderRadius: '4px',
                                                      border: ans === 'Đ' ? '2px solid var(--color-success)' : '1px solid var(--color-border)',
                                                      backgroundColor: ans === 'Đ' ? '#dcfce7' : 'var(--color-surface)',
                                                      color: ans === 'Đ' ? '#15803d' : 'inherit',
                                                      fontWeight: 'bold',
                                                      cursor: 'pointer'
                                                    }}
                                                  >
                                                    Đúng
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => updatePart2Key(q.id, stmt, 'S')}
                                                    style={{
                                                      padding: '4px 12px',
                                                      borderRadius: '4px',
                                                      border: ans === 'S' ? '2px solid var(--color-danger)' : '1px solid var(--color-border)',
                                                      backgroundColor: ans === 'S' ? '#fee2e2' : 'var(--color-surface)',
                                                      color: ans === 'S' ? '#b91c1c' : 'inherit',
                                                      fontWeight: 'bold',
                                                      cursor: 'pointer'
                                                    }}
                                                  >
                                                    Sai
                                                  </button>
                                                </div>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>

                                    {q.explanation && (
                                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-surface)', padding: '8px 12px', borderRadius: '4px' }}>
                                        <strong>💡 Lời giải / Phương pháp:</strong> {renderContent(q.explanation)}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* PART 3 */}
                          {editContent.part3 && editContent.part3.length > 0 && (
                            <div>
                              <div style={{ color: '#7c3aed', fontWeight: 'bold', fontSize: '16px', borderBottom: '2px solid #8b5cf6', paddingBottom: '6px', marginBottom: '16px' }}>
                                PHẦN III. CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN ({editContent.part3.length} CÂU)
                              </div>

                              {editContent.part3.map((q: any, idx: number) => {
                                const group = findGroupIfFirst('part3', q.id);
                                const isRegen = regeneratingQId === `part3_${q.id}`;
                                return (
                                  <div key={q.id || idx} style={{ marginBottom: '16px', padding: '16px', borderRadius: '8px', backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)' }}>
                                    {group && (
                                      <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '8px 12px', marginBottom: '10px', color: '#92400e', fontSize: '13px' }}>
                                        <strong>📖 Ngữ liệu chung cho câu {group.questionIds.join(', ')}:</strong>
                                        <div style={{ marginTop: '4px' }}>{renderContent(group.content)}</div>
                                      </div>
                                    )}

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '10px' }}>
                                      <div style={{ fontWeight: 600, flex: 1 }}>
                                        <span style={{ color: '#7c3aed' }}>Câu {q.id || idx + 1}: </span>
                                        {renderContent(q.questionText)}
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRegenerateQuestion('part3', q.id)}
                                        disabled={isRegen}
                                        style={{ fontSize: '12px', padding: '4px 8px' }}
                                      >
                                        {isRegen ? '🔄 Đang đổi...' : '🔄 Đổi câu này'}
                                      </Button>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>Đáp án chuẩn:</span>
                                      <input
                                        type="text"
                                        className="input-base"
                                        value={q.correctAnswer ?? editKeys.part3_key?.[q.id] ?? ''}
                                        onChange={(e) => updateKey('part3_key', q.id, e.target.value)}
                                        placeholder="Nhập số hoặc kết quả ngắn..."
                                        style={{ maxWidth: '240px', padding: '6px 12px', fontSize: '14px' }}
                                      />
                                    </div>

                                    {(q.solution || q.explanation) && (
                                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-surface)', padding: '8px 12px', borderRadius: '4px' }}>
                                        <strong>💡 Lời giải / Hướng dẫn giải:</strong> {renderContent(q.solution || q.explanation)}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
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
