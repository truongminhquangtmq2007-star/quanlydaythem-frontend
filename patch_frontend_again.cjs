const fs = require('fs');
let code = fs.readFileSync('src/pages/CreateExamAI.tsx', 'utf8');

// 1. Add toast and component
code = code.replace(
    "import React, { useState, useEffect } from 'react';",
    "import React, { useState, useEffect } from 'react';\nimport { toast } from 'react-toastify';\n\nconst PreviewExamComponent = ({ data }: { data: any }) => {\n  return (\n    <div style={{ padding: '20px', textAlign: 'center' }}>\n      <h2 style={{ color: '#10b981' }}>🎉 Xem Trước Đề Thi (Mock Preview Component)</h2>\n      <p>ID Tài liệu: {data.document_id}</p>\n      <p>Số câu hỏi (Part 1): {data.questions?.part1?.length || 0}</p>\n    </div>\n  );\n};\n"
);

// 2. Add examData state
code = code.replace(
    "const [loadingMessage, setLoadingMessage] = useState<string>('');",
    "const [loadingMessage, setLoadingMessage] = useState<string>('');\n  const [examData, setExamData] = useState<any>(null);"
);

// 3. Update timeouts
code = code.replace(/timeout: 120000/g, 'timeout: 180000');

// 4. Update success logic inside handleParseExam
const oldIfResponseData = /if \(response\?\.data\) \{[\s\S]*?navigate\('\/exam-editor', \{ state: \{ examContent: content, meta \} \}\);\s*\}/;
if (oldIfResponseData.test(code)) {
    code = code.replace(oldIfResponseData, `if (response?.data?.status === 'success') {
        setIsLoading(false);
        setExamData(response.data.data);
      }`);
} else {
    console.error("Could not match oldIfResponseData");
}

// 5. Update catch block
code = code.replace(
    /catch \(err: any\) \{\s*setError\(err\.response\?\.data\?\.message \|\| 'CA3 l-i xy ra khi bA3c tAch!'\);\s*\}\s*finally \{\s*setIsLoading\(false\);\s*\}/,
    `catch (error: any) {
        setIsLoading(false);
        if (error.code === 'ECONNABORTED' || error.response?.status === 504) {
            toast.error("Hệ thống AI đang quá tải và mất nhiều thời gian. Vui lòng thử lại sau.");
        } else {
            toast.error(error.response?.data?.message || "Có lỗi xảy ra khi bóc tách đề thi!");
        }
      }`
);

// wait, the catch block regex might not match unicode. Let's do a more robust regex:
code = code.replace(
    /catch \(err: any\) \{\s*setError\([^;]+;\s*\}\s*finally \{\s*setIsLoading\(false\);\s*\}/s,
    `catch (error: any) {
        setIsLoading(false);
        if (error.code === 'ECONNABORTED' || error.response?.status === 504) {
            toast.error("Hệ thống AI đang quá tải và mất nhiều thời gian. Vui lòng thử lại sau.");
        } else {
            toast.error(error.response?.data?.message || "Có lỗi xảy ra khi bóc tách đề thi!");
        }
      }`
);

// 6. Insert conditional return
// The user asks: "Tìm phần `return (...)` của component. Bổ sung logic hiển thị có điều kiện: `if (examData) { return <PreviewExamComponent data={examData} /> }`"
// We want to insert it right before the actual return of CreateExamAI.
// Let's find: `return (` inside `const CreateExamAI`
const mainReturnRegex = /return \(\s*<div style=\{\{ maxWidth:/;
code = code.replace(mainReturnRegex, `if (examData) { return <PreviewExamComponent data={examData} /> }\n\n  return (\n    <div style={{ maxWidth:`);

fs.writeFileSync('src/pages/CreateExamAI.tsx', code);
console.log("Patched CreateExamAI again");
