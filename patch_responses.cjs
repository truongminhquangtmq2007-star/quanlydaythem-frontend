const fs = require('fs');
let code = fs.readFileSync('src/pages/CreateExamAI.tsx', 'utf8');

const targetStr = `        if (response?.data?.status === 'success') {
            setIsLoading(false);
            setExamData(response.data.data);
            setEditContent(response.data.data.examContent);
            setEditKeys(response.data.data.examKey);
            setJsonString(JSON.stringify(response.data.data.examContent, null, 2));
          }`;

const replacementStr = `        if (response?.data?.status === 'success') {
            setIsLoading(false);
            setExamData(response.data.data);
            setEditContent(response.data.data.examContent);
            setEditKeys(response.data.data.examKey);
            setJsonString(JSON.stringify(response.data.data.examContent, null, 2));
        } else if (response?.data?.examContent) {
            setIsLoading(false);
            setExamData(response.data);
            setEditContent(response.data.examContent);
            setEditKeys(response.data.examKey);
            setJsonString(JSON.stringify(response.data.examContent, null, 2));
        } else {
            setIsLoading(false);
            toast.error("Không nhận được dữ liệu hợp lệ từ AI.");
        }`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('src/pages/CreateExamAI.tsx', code);
console.log("Patched CreateExamAI to handle all response formats");

