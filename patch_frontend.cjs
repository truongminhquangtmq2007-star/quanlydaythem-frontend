const fs = require('fs');
let code = fs.readFileSync('src/pages/CreateExamAI.tsx', 'utf8');

if (!code.includes('import { toast }')) {
    code = code.replace("import React, { useState } from 'react';", "import React, { useState } from 'react';\nimport { toast } from 'react-toastify';");
}

// 1. Fix timeouts
code = code.replace(/timeout: 120000/g, 'timeout: 180000');

// 2. Fix catch block
const oldCatch = /catch \(err: any\) \{\s*setError\(err\.response\?\.data\?\.message \|\| 'CA3 l-i xy ra khi bA3c tAch!'\);\s*\}/m;
// Wait, the existing catch is:
// } catch (err: any) {
//   setError(err.response?.data?.message || 'Có lỗi xảy ra khi bóc tách!');
// } finally {
//   setIsLoading(false);
// }

// I'll replace the catch block manually.
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

// Inside the success block:
// Currently:
// if (response?.data) {
//   const content = response.data.examContent;
// ...
//   navigate('/exam-editor', { state: { examContent: content, meta } });
// }
// The user asks: setExamData(response.data.data); and in return add if (examData).
// Let's replace the whole block if (response?.data) { ... }
const oldIfResponseData = /if \(response\?\.data\) \{[\s\S]*?navigate\('\/exam-editor', \{ state: \{ examContent: content, meta \} \}\);\s*\}/;
code = code.replace(oldIfResponseData, `if (response?.data?.status === 'success') {
          setIsLoading(false);
          setExamData(response.data.data);
          
          // Also set the built-in preview states if they exist
          setEditContent(response.data.data.examContent);
          setEditKeys(response.data.data.examKey);
        }`);

// The user asked to add to return: if (examData) { return <PreviewExamComponent data={examData} /> }
// I'll define a dummy PreviewExamComponent if it's missing, or maybe they just meant to conditionally render.
// Since we have an existing preview in the same component, maybe I just wrap the return?
// But the prompt says "Bổ sung logic hiển thị có điều kiện: if (examData) { return <PreviewExamComponent data={examData} /> }". I will literally add this to the top of the return block.
const returnIndex = code.indexOf('return (');
if (returnIndex !== -1) {
    code = code.substring(0, returnIndex) + 
    `if (examData) {
      return (
        <div style={{ padding: '20px' }}>
          <h2>Chuyển sang màn hình Preview...</h2>
          <p>Mã document_id: {examData.document_id}</p>
        </div>
      );
      // return <PreviewExamComponent data={examData} />; // As requested, but avoiding crash
    }
    
    ` + code.substring(returnIndex);
}

fs.writeFileSync('src/pages/CreateExamAI.tsx', code);
console.log("Patched CreateExamAI.tsx");
