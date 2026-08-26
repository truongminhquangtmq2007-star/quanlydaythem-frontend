const fs = require('fs');
let code = fs.readFileSync('src/pages/CreateExamAI.tsx', 'utf8');

// Add state
if (!code.includes('const [loadingMessage, setLoadingMessage] = useState<string>(')) {
    code = code.replace("const [isLoading, setIsLoading] = useState<boolean>(false);", "const [isLoading, setIsLoading] = useState<boolean>(false);\n  const [loadingMessage, setLoadingMessage] = useState<string>('');");
}

// Fix handleParseExam
const oldHandleParse = `      setIsLoading(true); setError(''); setEditContent(null); setEditKeys(null); setJsonString(''); setJsonError('');

    try {
      const token = localStorage.getItem('token');
      let response;

      // Truyền tạm document_id = 0 để qua cổng AI (vì AI không dùng id này, nó chỉ dùng để lưu)
      if (inputMode === 'text') {
        const t1 = setTimeout(() => setLoadingMessage('AI đang đọc đề thi (Có thể mất 1-2 phút, vui lòng không tắt trang)...'), 3000);
        const t2 = setTimeout(() => setLoadingMessage('Đang xử lý dữ liệu...'), 45000);

        response = await axiosClient.post(
          \`/api/exams/parse-ai-file\`,
          formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 }
        );
        clearTimeout(t1);
        clearTimeout(t2);
      }`;

const newHandleParse = `      setIsLoading(true); setLoadingMessage('Đang tải dữ liệu lên...'); setError(''); setEditContent(null); setEditKeys(null); setJsonString(''); setJsonError('');

    try {
      let response;
      const t1 = setTimeout(() => setLoadingMessage('AI đang đọc đề thi (Có thể mất 1-2 phút, vui lòng không tắt trang)...'), 3000);
      const t2 = setTimeout(() => setLoadingMessage('Đang xử lý dữ liệu...'), 45000);

      if (inputMode === 'text') {
        response = await axiosClient.post(
          \`/api/exams/parse-ai-text\`,
          { document_id: 0, class_id: Number(classId), durationMinutes: Number(duration), rawText },
          { timeout: 120000 }
        );
      } else {
        const formData = new FormData();
        formData.append('document_id', '0');
        formData.append('class_id', String(classId));
        formData.append('durationMinutes', String(duration));
        formData.append('examFile', selectedFile as File);

        response = await axiosClient.post(
          \`/api/exams/parse-ai-file\`,
          formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 }
        );
      }
      
      clearTimeout(t1);
      clearTimeout(t2);`;

code = code.replace(/setIsLoading\(true\); setError\(''\);[\s\S]*?clearTimeout\(t2\);\s*\}/, newHandleParse);

fs.writeFileSync('src/pages/CreateExamAI.tsx', code);
console.log("Patched CreateExamAI.tsx states and functions");

