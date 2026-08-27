const fs = require('fs');
let code = fs.readFileSync('src/pages/CreateExamAI.tsx', 'utf8');

const oldCode = /if\s*\(\s*response\?\.data\?\.status\s*===\s*'success'\s*\)\s*\{\s*setIsLoading\(false\);\s*setExamData\(response\.data\.data\);\s*setEditContent\(response\.data\.data\.examContent\);\s*setEditKeys\(response\.data\.data\.examKey\);\s*setJsonString\(JSON\.stringify\(response\.data\.data\.examContent,\s*null,\s*2\)\);\s*\}/;

const newCode = `if (response?.data?.status === 'success') {
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

if (code.match(oldCode)) {
    code = code.replace(oldCode, newCode);
    fs.writeFileSync('src/pages/CreateExamAI.tsx', code);
    console.log("Successfully patched CreateExamAI response handling");
} else {
    console.log("Failed to match regex for patch");
}

