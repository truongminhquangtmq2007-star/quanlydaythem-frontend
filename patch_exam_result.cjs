const fs = require('fs');

let code = fs.readFileSync('src/pages/ExamResult.tsx', 'utf8');

// 1. Add examId to ExamResultProps
if (!code.includes('examId?: string | number;')) {
  code = code.replace(/interface ExamResultProps \{/, "interface ExamResultProps {\n  examId?: string | number;");
  code = code.replace(/isTeacherView = false,\n  \} = props;/, "isTeacherView = false,\n    examId,\n  } = props;");
}

// 2. Add AITutorBlock
if (!code.includes('const AITutorBlock')) {
const aiTutorCode = `
const AITutorBlock = ({ examId, questionId }: { examId: string | number, questionId: string }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [question, setQuestion] = React.useState('');
  const [chatHistory, setChatHistory] = React.useState<{role: 'user'|'ai', content: string}[]>([]);
  const [loading, setLoading] = React.useState(false);

  const handleSend = async () => {
    if (!question.trim()) return;
    const currentQ = question;
    setChatHistory(prev => [...prev, { role: 'user', content: currentQ }]);
    setQuestion('');
    setLoading(true);

    try {
      const res = await axiosClient.post('/api/exams/ask-tutor', {
        exam_id: examId,
        question_id: questionId,
        student_question: currentQ
      });
      setChatHistory(prev => [...prev, { role: 'ai', content: res.data.answer }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'ai', content: 'Lỗi: Không thể kết nối tới Gia sư AI.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!examId) return null;

  return (
    <div style={{ marginTop: '15px' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ padding: '8px 16px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
        💬 Hỏi Gia sư AI giải thích câu này
      </button>
      
      {isOpen && (
        <div style={{ marginTop: '15px', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
          {chatHistory.map((msg, idx) => (
            <div key={idx} style={{ marginBottom: '10px', display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
               <div style={{
                 backgroundColor: msg.role === 'user' ? '#3b82f6' : '#ffffff',
                 color: msg.role === 'user' ? 'white' : '#1e293b',
                 padding: '10px 15px',
                 borderRadius: '12px',
                 border: msg.role === 'ai' ? '1px solid #cbd5e1' : 'none',
                 maxWidth: '100%',
                 overflowX: 'auto'
               }}>
                 {msg.role === 'user' ? msg.content : (
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {msg.content}
                    </ReactMarkdown>
                 )}
               </div>
            </div>
          ))}
          {loading && <div style={{ color: '#64748b', fontSize: '14px', fontStyle: 'italic', marginBottom: '10px' }}>AI đang phân tích lời giải...</div>}
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <input 
               type="text" 
               value={question} 
               onChange={e => setQuestion(e.target.value)} 
               onKeyDown={e => e.key === 'Enter' && handleSend()}
               placeholder="Nhập thắc mắc (VD: Tại sao bước 2 lại ra công thức đó?)..." 
               style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
            <button 
               onClick={handleSend} 
               disabled={loading}
               style={{ padding: '10px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
               Gửi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ExamResult`;

  code = code.replace(/const ExamResult/g, aiTutorCode);
}

// 3. Inject <AITutorBlock> into the DOM for part1, 2, 3
// Part 1: below <div style={{ clear: 'both' }} /> </div>
code = code.replace(
  /<div style=\{\{ clear: 'both' \}\} \/>\s*<\/div>\s*<\/React.Fragment>/g,
  `<div style={{ clear: 'both' }} />
                  {examId && <AITutorBlock examId={examId} questionId={qId?.toString() || q?.id?.toString() || detail?.question_id?.toString() || ''} />}
                </div>
              </React.Fragment>`
);

// We need to fix qId/q.id/detail.question_id based on scope.
// In Part 1: q.id
// In Part 2: qId
// In Part 3: qId
code = code.replace(
  /<div style=\{\{ clear: 'both' \}\} \/>\s*\{examId && <AITutorBlock examId=\{examId\} questionId=\{qId\?\.[^}]+\} \/>\}\s*<\/div>\s*<\/React.Fragment>/g,
  `<div style={{ clear: 'both' }} />
                  {examId && <AITutorBlock examId={examId} questionId={(typeof qId !== 'undefined' ? qId : q.id).toString()} />}
                </div>
              </React.Fragment>`
);

fs.writeFileSync('src/pages/ExamResult.tsx', code);
console.log('Patched ExamResult.tsx');

