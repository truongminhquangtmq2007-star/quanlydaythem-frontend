const fs = require('fs');
let code = fs.readFileSync('src/pages/CreateExamAI.tsx', 'utf8');

// 1. Add loadingMessage state
if (!code.includes("const [loadingMessage, setLoadingMessage] = useState")) {
  code = code.replace("const [isLoading, setIsLoading] = useState(false);", "const [isLoading, setIsLoading] = useState(false);\n  const [loadingMessage, setLoadingMessage] = useState('Đang xử lý...');");
}

// 2. Add dynamic text and timeout for AI call
const targetStr = `        } else {
        const formData = new FormData();
        formData.append('document_id', '0');
        formData.append('class_id', String(classId));
        formData.append('durationMinutes', String(duration));
        formData.append('examFile', selectedFile as File);

        response = await axiosClient.post(
          \`/api/exams/parse-ai-file\`,
          formData, { headers: { 'Content-Type': 'multipart/form-data' } }
        );
      }`;

const replacementStr = `        } else {
        const formData = new FormData();
        formData.append('document_id', '0');
        formData.append('class_id', String(classId));
        formData.append('durationMinutes', String(duration));
        formData.append('examFile', selectedFile as File);
        
        // Timeout cho text
        const t1 = setTimeout(() => setLoadingMessage('AI đang đọc đề thi (Có thể mất 1-2 phút, vui lòng không tắt trang)...'), 3000);
        const t2 = setTimeout(() => setLoadingMessage('Đang xử lý dữ liệu...'), 45000);

        response = await axiosClient.post(
          \`/api/exams/parse-ai-file\`,
          formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 }
        );
        
        clearTimeout(t1);
        clearTimeout(t2);
      }`;

// Fallback logic for replace if it doesn't exactly match
if (code.includes('parse-ai-file')) {
  // If exact match doesn't work, just replace the axios call
  code = code.replace(/response = await axiosClient\.post\([\s\S]*?`\/api\/exams\/parse-ai-file`,\s*formData, \{ headers: \{ 'Content-Type': 'multipart\/form-data' \} \}\s*\);/, "const t1 = setTimeout(() => setLoadingMessage('AI đang đọc đề thi (Có thể mất 1-2 phút, vui lòng không tắt trang)...'), 3000);\n        const t2 = setTimeout(() => setLoadingMessage('Đang xử lý dữ liệu...'), 45000);\n\n        response = await axiosClient.post(\n          `/api/exams/parse-ai-file`,\n          formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 }\n        );\n        clearTimeout(t1);\n        clearTimeout(t2);");
}

// 3. Update setIsLoading(true) to also set default loading message
code = code.replace("setIsLoading(true);\n    setError(null);", "setIsLoading(true);\n    setLoadingMessage('Đang tải file lên...');\n    setError(null);");

// 4. Update the overlay UI
const oldOverlayRegex = /\{isLoading && \([\s\S]*?Vui lòng đợi trong giây lát<\/p>\s*<\/div>\s*\)\}/;
const newOverlay = `{isLoading && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ width: '60px', height: '60px', border: '6px solid #334155', borderTopColor: '#60a5fa', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <h2 style={{ marginTop: '24px', color: '#f8fafc', fontSize: '20px', fontWeight: 'bold' }}>Hệ thống đang làm việc</h2>
          <p style={{ color: '#94a3b8', fontSize: '15px', marginTop: '8px', maxWidth: '400px', textAlign: 'center', lineHeight: '1.5' }}>{loadingMessage}</p>
          <style>{\`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }\`}</style>
        </div>
      )}`;

if (oldOverlayRegex.test(code)) {
    code = code.replace(oldOverlayRegex, newOverlay);
}

fs.writeFileSync('src/pages/CreateExamAI.tsx', code);
console.log("Patched CreateExamAI again safely");
