const fs = require('fs');
let code = fs.readFileSync('src/pages/ExamRoom.tsx', 'utf8');

code = code.replace(/<SubmitConfirmModal([\s\S]*?)onBackToList=\{/g, "<SubmitConfirmModal$1onClose={");
fs.writeFileSync('src/pages/ExamRoom.tsx', code);

