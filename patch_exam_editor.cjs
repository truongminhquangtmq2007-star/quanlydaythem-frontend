const fs = require('fs');
let code = fs.readFileSync('src/pages/ExamEditor.tsx', 'utf8');

const regex = /duration_minutes: meta\.duration_minutes \|\| 60,\s*questions,\s*contexts\s*\}/;
const replaceWith = `duration_minutes: meta.duration_minutes || 60,
          questions,
          contexts,
          class_id: meta.class_id,
          exam_content: examData
        }`;

if (code.match(regex)) {
    code = code.replace(regex, replaceWith);
    fs.writeFileSync('src/pages/ExamEditor.tsx', code);
    console.log("Patched ExamEditor.tsx");
} else {
    console.log("Failed to patch ExamEditor.tsx");
}
