const fs = require('fs');
let code = fs.readFileSync('src/pages/ExamRoom.tsx', 'utf8');

code = code.replace(/scoreData=\{examScore\}/g, '');
code = code.replace(/onClose=\{\(\) => navigate\('\/dashboard'\)\}/g, "onBackToList={() => navigate('/dashboard')}");
code = code.replace(/handleSubmit/g, "forceSubmit");

fs.writeFileSync('src/pages/ExamRoom.tsx', code);

