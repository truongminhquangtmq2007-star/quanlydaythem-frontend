import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import axiosClient from '../api/axiosClient';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Alert } from './ui/Alert';

export interface AITutorBlockProps {
  examId: string | number;
  questionId: string | number;
  part?: 'part1' | 'part2' | 'part3';
  studentAnswer?: any;
}

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  mode?: 'SOCRATIC' | 'EXPLANATORY';
  isError?: boolean;
}

export const AITutorBlock: React.FC<AITutorBlockProps> = ({
  examId,
  questionId,
  part,
  studentAnswer
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuestion, setInputQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastPrompt, setLastPrompt] = useState<string>('');
  const [hasError, setHasError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [chatHistory, loading, isOpen]);

  const handleSend = async (customPrompt?: string) => {
    const promptToSend = customPrompt || inputQuestion;
    if (!promptToSend.trim() || loading) return;

    setLastPrompt(promptToSend);
    setHasError(false);
    setChatHistory(prev => [...prev, { role: 'user', content: promptToSend }]);
    setInputQuestion('');
    setLoading(true);

    try {
      const res = await axiosClient.post('/api/exams/ask-tutor', {
        exam_id: examId,
        question_id: questionId,
        part: part,
        student_question: promptToSend,
        student_answer: studentAnswer
      });

      const aiAnswer = res.data?.data?.answer || res.data?.answer || 'Gia sư AI đã xử lý xong.';
      const mode = res.data?.data?.mode;

      setChatHistory(prev => [
        ...prev,
        { role: 'ai', content: aiAnswer, mode }
      ]);
    } catch (err: any) {
      setHasError(true);
      const serverMsg = err.response?.data?.message || err.response?.data?.error?.message;
      const fallbackMsg = serverMsg 
        ? `⚠️ ${serverMsg}` 
        : '⚠️ Không thể kết nối tới Gia sư AI lúc này. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại.';
      
      setChatHistory(prev => [
        ...prev,
        { role: 'ai', content: fallbackMsg, isError: true }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastPrompt) {
      handleSend(lastPrompt);
    }
  };

  if (!examId) return null;

  const partLabel = part === 'part1' ? 'Phần 1' : part === 'part2' ? 'Phần 2' : part === 'part3' ? 'Phần 3' : '';

  return (
    <div style={{ marginTop: 'var(--spacing-3)' }}>
      {/* Toggle Button */}
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Hỏi Gia sư AI hướng dẫn câu này"
        title="Hỏi Gia sư AI hướng dẫn phương pháp câu này"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--spacing-2)',
          padding: 'var(--spacing-2) var(--spacing-4)',
          background: isOpen ? 'var(--color-primary)' : 'var(--color-primary-soft)',
          color: isOpen ? '#ffffff' : 'var(--color-primary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 'var(--font-weight-semibold)',
          cursor: 'pointer',
          transition: 'all var(--transition-fast)',
          boxShadow: 'var(--shadow-sm)'
        }}>
        <span>✨</span>
        <span>{isOpen ? 'Đóng Gia sư AI' : `Hỏi Gia sư AI ${partLabel ? `(${partLabel})` : ''}`}</span>
      </button>
      
      {/* Chat Container */}
      {isOpen && (
        <div style={{
          marginTop: 'var(--spacing-3)',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          padding: 'var(--spacing-4)',
          boxShadow: 'var(--shadow-md)',
          transition: 'all var(--transition-normal)'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--spacing-3)',
            borderBottom: '1px solid var(--color-border)',
            paddingBottom: 'var(--spacing-2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
              <span style={{ fontSize: '1.25rem' }}>🤖</span>
              <div>
                <div style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary)', fontSize: 'var(--font-size-sm)' }}>
                  Gia sư AI — Hướng dẫn phương pháp Câu {questionId} {partLabel ? `(${partLabel})` : ''}
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                  Hỗ trợ định dạng LaTeX công thức toán học và giải thích tư duy
                </div>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setIsOpen(false)} 
              aria-label="Đóng cửa sổ chat"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                fontSize: '1.25rem',
                fontWeight: 'bold',
                padding: '4px 8px'
              }}>
              ✕
            </button>
          </div>

          {/* Quick Starter Chips */}
          {chatHistory.length === 0 && (
            <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap', marginBottom: 'var(--spacing-3)' }}>
              <button 
                type="button" 
                onClick={() => handleSend("Hãy giải thích phương pháp và các bước tư duy của câu này.")}
                style={{
                  fontSize: 'var(--font-size-xs)',
                  padding: 'var(--spacing-1) var(--spacing-3)',
                  backgroundColor: 'var(--color-primary-soft)',
                  border: '1px solid var(--color-primary-muted)',
                  borderRadius: 'var(--radius-full)',
                  color: 'var(--color-primary)',
                  cursor: 'pointer',
                  transition: 'background var(--transition-fast)'
                }}>
                💡 Gợi ý phương pháp giải
              </button>
              <button 
                type="button" 
                onClick={() => handleSend("Tại sao đáp án em chọn bị sai? Bắt bệnh tư duy giúp em.")}
                style={{
                  fontSize: 'var(--font-size-xs)',
                  padding: 'var(--spacing-1) var(--spacing-3)',
                  backgroundColor: 'var(--color-primary-soft)',
                  border: '1px solid var(--color-primary-muted)',
                  borderRadius: 'var(--radius-full)',
                  color: 'var(--color-primary)',
                  cursor: 'pointer',
                  transition: 'background var(--transition-fast)'
                }}>
                🔍 Phân tích chỗ sai của em
              </button>
              <button 
                type="button" 
                onClick={() => handleSend("Nhắc lại công thức và lý thuyết trọng tâm dùng trong câu này.")}
                style={{
                  fontSize: 'var(--font-size-xs)',
                  padding: 'var(--spacing-1) var(--spacing-3)',
                  backgroundColor: 'var(--color-primary-soft)',
                  border: '1px solid var(--color-primary-muted)',
                  borderRadius: 'var(--radius-full)',
                  color: 'var(--color-primary)',
                  cursor: 'pointer',
                  transition: 'background var(--transition-fast)'
                }}>
                📚 Lý thuyết & công thức
              </button>
              <button 
                type="button" 
                onClick={() => handleSend("Gợi ý cho em bước biến đổi đầu tiên để giải tiếp.")}
                style={{
                  fontSize: 'var(--font-size-xs)',
                  padding: 'var(--spacing-1) var(--spacing-3)',
                  backgroundColor: 'var(--color-primary-soft)',
                  border: '1px solid var(--color-primary-muted)',
                  borderRadius: 'var(--radius-full)',
                  color: 'var(--color-primary)',
                  cursor: 'pointer',
                  transition: 'background var(--transition-fast)'
                }}>
                🎯 Gợi ý bước đầu tiên
              </button>
            </div>
          )}

          {/* Chat Messages Log */}
          <div style={{
            maxHeight: '320px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-3)',
            marginBottom: 'var(--spacing-3)',
            paddingRight: '4px'
          }}>
            {chatHistory.map((msg, idx) => (
              <div key={idx} style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '92%',
                backgroundColor: msg.role === 'user' ? 'var(--color-primary)' : (msg.isError ? 'var(--color-danger-soft)' : 'var(--color-surface-hover)'),
                color: msg.role === 'user' ? '#ffffff' : (msg.isError ? 'var(--color-danger)' : 'var(--color-text)'),
                padding: 'var(--spacing-3) var(--spacing-4)',
                borderRadius: 'var(--radius-lg)',
                border: msg.role === 'ai' ? (msg.isError ? '1px solid var(--color-danger)' : '1px solid var(--color-border)') : 'none',
                fontSize: 'var(--font-size-sm)',
                lineHeight: 1.6,
                boxShadow: 'var(--shadow-sm)'
              }}>
                {msg.role === 'ai' && msg.mode && (
                  <div style={{ marginBottom: 'var(--spacing-2)' }}>
                    <Badge variant={msg.mode === 'SOCRATIC' ? 'warning' : 'success'} size="sm" dot>
                      {msg.mode === 'SOCRATIC' ? '💡 Chế độ Gợi mở (Socratic)' : '📖 Lời giải chi tiết (Explanatory)'}
                    </Badge>
                  </div>
                )}
                {msg.role === 'user' ? (
                  <div>{msg.content}</div>
                ) : (
                  <div className="ai-markdown-container">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{
                alignSelf: 'flex-start',
                color: 'var(--color-primary)',
                fontSize: 'var(--font-size-xs)',
                fontStyle: 'italic',
                padding: 'var(--spacing-2) var(--spacing-4)',
                backgroundColor: 'var(--color-primary-soft)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-2)'
              }} aria-live="polite">
                <span className="spinner" style={{ width: '14px', height: '14px' }} />
                <span>Gia sư AI đang phân tích và chuẩn bị hướng dẫn...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Error & Retry Bar */}
          {hasError && !loading && (
            <div style={{ marginBottom: 'var(--spacing-2)' }}>
              <Alert variant="danger">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span>Đã xảy ra lỗi khi trao đổi với Gia sư AI.</span>
                  <Button variant="danger" size="sm" onClick={handleRetry} style={{ minHeight: '32px' }}>
                    🔄 Thử lại
                  </Button>
                </div>
              </Alert>
            </div>
          )}

          {/* Input Box */}
          <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
            <input 
              type="text" 
              value={inputQuestion} 
              disabled={loading}
              onChange={e => setInputQuestion(e.target.value)} 
              onKeyDown={e => { if (e.key === 'Enter') handleSend(); }} 
              placeholder="Hỏi bất kỳ điều gì bạn chưa hiểu về câu này..." 
              aria-label="Nhập câu hỏi cho Gia sư AI"
              className="input-base"
              style={{ flex: 1 }}
            />
            <Button 
              type="button"
              variant="primary"
              onClick={() => handleSend()} 
              disabled={loading || !inputQuestion.trim()}
              isLoading={loading}
            >
              Gửi
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AITutorBlock;
