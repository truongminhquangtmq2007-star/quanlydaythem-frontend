const fs = require('fs');
let code = fs.readFileSync('src/pages/ExamEditor.tsx', 'utf8');

code = code.replace(
  /\} catch \(error\) \{\s*console\.error\(error\);\s*alert\('[^']+'\);\s*\}/,
  `} catch (error: any) {
      console.error("Publish Error:", error.response?.data || error);
      alert('Lỗi xuất bản đề thi: ' + (error.response?.data?.message || error.response?.data?.error || JSON.stringify(error.response?.data) || 'Không xác định'));
    }`
);

fs.writeFileSync('src/pages/ExamEditor.tsx', code);
console.log('Patched error handling in ExamEditor');

