const fs = require('fs');
let code = fs.readFileSync('src/pages/CreateExamAI.tsx', 'utf8');

const regex = /document_id: responseData\.document_id \|\| 0,\s*title: finalTitle,\s*grade: finalGrade,\s*subject: finalSubject,\s*duration_minutes: Number\(duration\)/;
const replaceWith = `document_id: responseData.document_id || 0,
            title: finalTitle,
            grade: finalGrade,
            subject: finalSubject,
            duration_minutes: Number(duration),
            class_id: Number(classId)`;

if (code.match(regex)) {
    code = code.replace(regex, replaceWith);
    fs.writeFileSync('src/pages/CreateExamAI.tsx', code);
    console.log("Patched CreateExamAI.tsx");
} else {
    console.log("Failed to patch CreateExamAI.tsx");
}
