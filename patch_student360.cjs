const fs = require('fs');

let code = fs.readFileSync('src/pages/StudentProfile360.tsx', 'utf8');

// 1. Add AI Evaluation button to the header
// The header has two buttons currently: Quay lại danh sách and Tạo Báo cáo Tuần (AI)
if (!code.includes('Phân tích & Định hướng AI')) {
  code = code.replace(
    /<\/div>\s*\{\/\* HEADER PROFILE \*\/\}/,
    `  <button onClick={handleGenerateAIEvaluation} disabled={evaluating} style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', backgroundColor: evaluating ? '#94a3b8' : '#8b5cf6', color: 'white', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(139,92,246,0.3)', transition: '0.2s' }}>
          {evaluating ? '⏳ Đang phân tích...' : '✨ Phân tích & Định hướng AI'}
        </button>
      </div>

      {/* HEADER PROFILE */}`
  );
  
  // 2. Add state and function
  const functionCode = `
  const [evaluating, setEvaluating] = useState(false);

  const handleGenerateAIEvaluation = async () => {
    setEvaluating(true);
    try {
      const token = localStorage.getItem('token');
      // Dummy API call or real if it exists. For now we just mock or call an endpoint.
      const res = await axiosClient.post(\`/api/students/\${id}/ai-evaluation\`);
      // Update data
      setData(prev => prev ? { ...prev, profile: { ...prev.profile, ai_evaluation: res.data.ai_evaluation } } : null);
      alert('Đã tạo phân tích AI thành công!');
    } catch (err) {
      alert('Chức năng Phân tích & Định hướng AI đang được bảo trì hoặc lỗi API.');
    } finally {
      setEvaluating(false);
    }
  };
`;
  code = code.replace(/const handleGenerateRemark = async/, functionCode + '\n  const handleGenerateRemark = async');
  
  // 3. Render the ai_evaluation if it exists
  const aiEvalRenderCode = `
      {/* AI EVALUATION SECTION */}
      {data.profile.ai_evaluation && Object.keys(data.profile.ai_evaluation).length > 0 && (
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #8b5cf6', boxShadow: '0 4px 15px rgba(139,92,246,0.1)', marginBottom: '30px' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#6d28d9', display: 'flex', alignItems: 'center', gap: '8px' }}>✨ Phân tích & Định hướng AI</h3>
          <div style={{ color: '#334155', lineHeight: '1.6', fontSize: '15px' }}>
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {typeof data.profile.ai_evaluation === 'string' ? data.profile.ai_evaluation : JSON.stringify(data.profile.ai_evaluation)}
            </ReactMarkdown>
          </div>
        </div>
      )}
  `;
  code = code.replace(/\{\/\* QUICK STATS \*\/\}/, aiEvalRenderCode + '\n      {/* QUICK STATS */}');
}

fs.writeFileSync('src/pages/StudentProfile360.tsx', code);
console.log('Patched StudentProfile360.tsx');

