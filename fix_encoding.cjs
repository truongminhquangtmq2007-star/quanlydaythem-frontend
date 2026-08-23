const fs = require('fs');
let code = fs.readFileSync('src/pages/StudentProfile360.tsx', 'utf8');

// I will just find the handleGenerateAIEvaluation function and replace it cleanly.
// Since the encoding is broken, I'll match evaluating ? '...'.
code = code.replace(/const handleGenerateAIEvaluation = async \(\) => \{[\s\S]*?finally \{\s*setEvaluating\(false\);\s*\}\s*\};/, 
`const handleGenerateAIEvaluation = async () => {
    setEvaluating(true);
    try {
      const res = await axiosClient.post(\`/api/students/\${id}/ai-evaluation\`);
      setData(prev => prev ? { ...prev, profile: { ...prev.profile, ai_evaluation: res.data.data } } : null);
      alert('Đã tạo phân tích AI thành công!');
    } catch (err) {
      alert('Chức năng Phân tích & Định hướng AI đang lỗi API.');
    } finally {
      setEvaluating(false);
    }
  };`);

// For the button:
code = code.replace(/\{evaluating \? '[^']+' : '[^']+'\}/, "{evaluating ? '⏳ Đang phân tích...' : '✨ Phân tích & Định hướng AI'}");
code = code.replace(/<h3 style=\{\{ margin: '0 0 15px 0', color: '#6d28d9', display: 'flex', alignItems: 'center', gap: '8px' \}\}>[^<]+<\/h3>/, "<h3 style={{ margin: '0 0 15px 0', color: '#6d28d9', display: 'flex', alignItems: 'center', gap: '8px' }}>✨ Phân tích & Định hướng AI</h3>");

fs.writeFileSync('src/pages/StudentProfile360.tsx', code);
console.log('Fixed encoding in StudentProfile360.tsx');

