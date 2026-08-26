const fs = require('fs');
let code = fs.readFileSync('src/pages/CreateExamAI.tsx', 'utf8');

// Add loading state message
if (!code.includes("const [loadingMessage, setLoadingMessage] = useState('Đang xử lý...')")) {
    code = code.replace("const [isLoading, setIsLoading] = useState(false);", "const [isLoading, setIsLoading] = useState(false);\n  const [loadingMessage, setLoadingMessage] = useState('Đang tải file lên...');");
}

const handleGenerateOld = `setIsLoading(true);
      setError(null);

      try {
        let response;
        if (selectedFile) {
          const formData = new FormData();
          formData.append('class_id', String(classId));
          formData.append('durationMinutes', String(duration));
          formData.append('examFile', selectedFile as File);

          response = await axiosClient.post(
            \`/api/exams/parse-ai-file\`,
            formData, { headers: { 'Content-Type': 'multipart/form-data' } }
          );
        }`;
        
const handleGenerateNew = `setIsLoading(true);
      setLoadingMessage('Đang tải file lên...');
      setError(null);

      try {
        let response;
        if (selectedFile) {
          const formData = new FormData();
          formData.append('class_id', String(classId));
          formData.append('durationMinutes', String(duration));
          formData.append('examFile', selectedFile as File);

          // Change message after 3 seconds
          const msgTimer = setTimeout(() => {
              setLoadingMessage('AI đang đọc đề thi (Có thể mất 1-2 phút, vui lòng không tắt trang)...');
          }, 3000);
          
          const msgTimer2 = setTimeout(() => {
              setLoadingMessage('Đang xử lý dữ liệu và tổng hợp kết quả...');
          }, 45000);

          response = await axiosClient.post(
            \`/api/exams/parse-ai-file\`,
            formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 }
          );
          
          clearTimeout(msgTimer);
          clearTimeout(msgTimer2);
        }`;

code = code.replace(handleGenerateOld, handleGenerateNew);

// UI overlay
const overlayOld = `
      {isLoading && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '50px', height: '50px', border: '5px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <h2 style={{ marginTop: '20px', color: '#1e293b' }}>Đang phân tích bằng AI...</h2>
          <p style={{ color: '#64748b' }}>Vui lòng đợi trong giây lát</p>
        </div>
      )}
`;

const overlayNew = `
      {isLoading && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ width: '60px', height: '60px', border: '6px solid #334155', borderTopColor: '#60a5fa', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <h2 style={{ marginTop: '24px', color: '#f8fafc', fontSize: '20px', fontWeight: 'bold' }}>Hệ thống đang làm việc</h2>
          <p style={{ color: '#94a3b8', fontSize: '15px', marginTop: '8px', maxWidth: '400px', textAlign: 'center', lineHeight: '1.5' }}>{loadingMessage}</p>
          <style>{\`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }\`}</style>
        </div>
      )}
`;

// Replace if exists, else append
if (code.includes('Đang phân tích bằng AI...')) {
    code = code.replace(/\{isLoading && \([\s\S]*?Vui lòng đợi trong giây lát<\/p>\s*<\/div>\s*\)\}/m, overlayNew.trim());
} else if (!code.includes('Hệ thống đang làm việc')) {
    code = code.replace('return (', 'return (\n    <>\n' + overlayNew.trim());
    code = code.substring(0, code.lastIndexOf(')')) + '\n    </>\n  )';
}

fs.writeFileSync('src/pages/CreateExamAI.tsx', code);
console.log("Patched CreateExamAI frontend");
