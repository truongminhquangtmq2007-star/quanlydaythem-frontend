const fs = require('fs');
let code = fs.readFileSync('src/pages/CreateExamAI.tsx', 'utf8');

// Ensure toast is imported
if (!code.includes('import { toast }')) {
    code = code.replace("import React, { useState } from 'react';", "import React, { useState } from 'react';\nimport { toast } from 'react-toastify';");
}

// Ensure PreviewExamComponent is defined so TS passes
if (!code.includes('const PreviewExamComponent')) {
    code = code.replace("const CreateExamAI = () => {", "const PreviewExamComponent = ({ data }: { data: any }) => {\n  return (\n    <div style={{ padding: '20px', textAlign: 'center' }}>\n      <h2 style={{ color: '#10b981' }}>🎉 Xem Trước Đề Thi (Mock Preview Component)</h2>\n      <p>ID Tài liệu: {data.document_id}</p>\n      <p>Số câu hỏi: {data.questions?.part1?.length || 0}</p>\n    </div>\n  );\n};\n\nconst CreateExamAI = () => {");
}

// Fix timeouts
code = code.replace(/timeout: 120000/g, 'timeout: 180000');

// Fix catch block
code = code.replace(/catch \(err: any\) \{\s*setError\(.*?\);\s*\}/s, 
`catch (error: any) {
        setIsLoading(false);
        if (error.code === 'ECONNABORTED' || error.response?.status === 504) {
            toast.error("Hệ thống AI đang quá tải và mất nhiều thời gian. Vui lòng thử lại sau.");
        } else {
            toast.error(error.response?.data?.message || "Có lỗi xảy ra khi bóc tách đề thi!");
        }
      }`);

// Add examData state
if (!code.includes('const [examData, setExamData] = useState<any>(null);')) {
    code = code.replace('const [loadingMessage, setLoadingMessage] = useState<string>(\'\');', 'const [loadingMessage, setLoadingMessage] = useState<string>(\'\');\n    const [examData, setExamData] = useState<any>(null);');
}

// Inside the success block
const oldIfResponseData = /if \(response\?\.data\) \{[\s\S]*?navigate\('\/exam-editor', \{ state: \{ examContent: content, meta \} \}\);\s*\}/;
if (oldIfResponseData.test(code)) {
    code = code.replace(oldIfResponseData, `if (response?.data?.status === 'success') {
          setIsLoading(false);
          setExamData(response.data.data);
        }`);
}

// Add if (examData) return <PreviewExamComponent data={examData} />
const returnIndex = code.indexOf('return (');
if (returnIndex !== -1 && !code.includes('if (examData) { return <PreviewExamComponent data={examData} /> }')) {
    code = code.substring(0, returnIndex) + 
    `if (examData) { return <PreviewExamComponent data={examData} /> }\n\n    ` + code.substring(returnIndex);
}

fs.writeFileSync('src/pages/CreateExamAI.tsx', code);
console.log("Patched CreateExamAI.tsx properly");
