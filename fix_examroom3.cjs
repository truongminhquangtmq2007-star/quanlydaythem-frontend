const fs = require('fs');
let code = fs.readFileSync('src/pages/ExamRoom.tsx', 'utf8');
code = code.replace(/onClose=\{/g, "onBackToList={");
fs.writeFileSync('src/pages/ExamRoom.tsx', code);

