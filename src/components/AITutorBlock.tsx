import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import axiosClient from '../api/axiosClient';
import { Button } from './ui/Button';

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
          gap: '6px',
          padding: '6px 14px',
          background: isOpen ? '#6d28d9' : 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
          color: isOpen ? '#ffffff' : '#6d28d9',
          border: '1px solid #c4b5fd',
          borderRadius: 'var(--radius-md)',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}>
        <span>✨</span>
        <span>{isOpen ? 'Đóng Gia sư AI' : `Hỏi Gia sư AI ${partLabel ? `(${partLabel})` : ''}`}</span>
      </button>
      
      {/* Chat Container */}
      {isOpen && (
        <div style={{
          marginTop: 'var(--spacing-3)',
          backgroundColor: '#faf5ff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid #d8b4fe',
          padding: 'var(--spacing-4)',
          boxShadow: '0 4px 16px rgba(109, 40, 217, 0.1)',
          transition: 'all 0.3s ease'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--spacing-3)',
            borderBottom: '1px solid #e9d5ff',
            paddingBottom: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🤖</span>
              <div>
                <div style={{ fontWeight: 'bold', color: '#6d28d9', fontSize: '13px' }}>
                  Gia sư AI — Hướng dẫn phương pháp Câu {questionId} {partLabel ? `(${partLabel})` : ''}
                </div>
                <div style={{ fontSize: '11px', color: '#7c3aed' }}>
                  Hỗ trợ định dạng LaTeX công thức toán học và giải thích tư duy
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              aria-label="Đóng cửa sổ chat"
              style={{
                background: 'none',
                border: 'none',
                color: '#9333ea',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                padding: '4px 8px'
              }}>
              ✕
            </button>
          </div>

          {/* Quick Starter Chips */}
          {chatHistory.length === 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: 'var(--spacing-3)' }}>
              <button 
                type="button" 
                onClick={() => handleSend("Hãy giải thích phương pháp và các bước tư duy của câu này.")}
                style={{
                  fontSize: '12px',
                  padding: '5px 12px',
                  backgroundColor: '#f3e8ff',
                  border: '1px solid #c084fc',
                  borderRadius: '16px',
                  color: '#6b21a8',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}>
                💡 Gợi ý phương pháp giải
              </button>
              <button 
                type="button" 
                onClick={() => handleSend("Tại sao đáp án em chọn bị sai? Bắt bệnh tư duy giúp em.")}
                style={{
                  fontSize: '12px',
                  padding: '5px 12px',
                  backgroundColor: '#f3e8ff',
                  border: '1px solid #c084fc',
                  borderRadius: '16px',
                  color: '#6b21a8',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}>
                🔍 Phân tích chỗ sai của em
              </button>
              <button 
                type="button" 
                onClick={() => handleSend("Nhắc lại công thức và lý thuyết trọng tâm dùng trong câu này.")}
                style={{
                  fontSize: '12px',
                  padding: '5px 12px',
                  backgroundColor: '#f3e8ff',
                  border: '1px solid #c084fc',
                  borderRadius: '16px',
                  color: '#6b21a8',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}>
                📚 Lý thuyết & công thức
              </button>
              <button 
                type="button" 
                onClick={() => handleSend("Gợi ý cho em bước biến đổi đầu tiên để giải tiếp.")}
                style={{
                  fontSize: '12px',
                  padding: '5px 12px',
                  backgroundColor: '#f3e8ff',
                  border: '1px solid #c084fc',
                  borderRadius: '16px',
                  color: '#6b21a8',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
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
            gap: '10px',
            marginBottom: 'var(--spacing-3)',
            paddingRight: '4px'
          }}>
            {chatHistory.map((msg, idx) => (
              <div key={idx} style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '92%',
                backgroundColor: msg.role === 'user' ? '#7c3aed' : (msg.isError ? '#fff1f2' : '#ffffff'),
                color: msg.role === 'user' ? '#ffffff' : (msg.isError ? '#be123c' : '#1e1b4b'),
                padding: '10px 14px',
                borderRadius: '12px',
                border: msg.role === 'ai' ? (msg.isError ? '1px solid #fecdd3' : '1px solid #e9d5ff') : 'none',
                fontSize: '13px',
                lineHeight: 1.6,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
              }}>
                {msg.role === 'ai' && msg.mode && (
                  <div style={{
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: msg.mode === 'SOCRATIC' ? '#d97706' : '#16a34a',
                    marginBottom: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span>{msg.mode === 'SOCRATIC' ? '🛡️ Chế độ Gợi mở (Socratic)' : '📖 Lời giải chi tiết'}</span>
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
                color: '#6d28d9',
                fontSize: '12px',
                fontStyle: 'italic',
                padding: '8px 14px',
                backgroundColor: '#f5f3ff',
                borderRadius: '10px',
                border: '1px solid #e9d5ff',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span className="spinner-icon">✨</span>
                <span>Gia sư AI đang phân tích và chuẩn bị hướng dẫn...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Error & Retry Bar */}
          {hasError && !loading && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: '8px',
              padding: '6px 12px',
              marginBottom: '8px',
              fontSize: '12px',
              color: '#991b1b'
            }}>
              <span>Đã xảy ra lỗi khi trao đổi với Gia sư AI.</span>
              <button 
                type="button" 
                onClick={handleRetry}
                style={{
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}>
                🔄 Thử lại
              </button>
            </div>
          )}

          {/* Input Box */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <input 
              type="text" 
              value={inputQuestion} 
              disabled={loading}
              onChange={e => setInputQuestion(e.target.value)} 
              onKeyDown={e => { if (e.key === 'Enter') handleSend(); }} 
              placeholder="Hỏi bất kỳ điều gì bạn chưa hiểu về câu này..." 
              aria-label="Nhập câu hỏi cho Gia sư AI"
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #d8b4fe',
                fontSize: '13px',
                backgroundColor: '#ffffff'
              }}
            />
            <Button 
              type="button"
              onClick={() => handleSend()} 
              disabled={loading || !inputQuestion.trim()}
              style={{
                padding: '8px 16px',
                backgroundColor: loading || !inputQuestion.trim() ? '#c4b5fd' : '#7c3aed',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: loading || !inputQuestion.trim() ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '13px'
              }}>
              Gửi
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AITutorBlock;
