const fs = require('fs');
let code = fs.readFileSync('src/pages/ExamRoom.tsx', 'utf8');

code = code.replace(/<ExamResult\s*gradingResult=\{gradingResult\}/g, "<ExamResult\n            examId={selectedExam?.id || id}\n            gradingResult={gradingResult}");

fs.writeFileSync('src/pages/ExamRoom.tsx', code);
console.log('Patched ExamRoom.tsx');

