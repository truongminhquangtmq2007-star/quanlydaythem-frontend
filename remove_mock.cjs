const fs = require('fs');
let code = fs.readFileSync('src/pages/CreateExamAI.tsx', 'utf8');

const targetRegex = /const PreviewExamComponent[\s\S]*?};\n\n/;

if (code.match(targetRegex)) {
    code = code.replace(targetRegex, "");
    fs.writeFileSync('src/pages/CreateExamAI.tsx', code);
    console.log("Removed PreviewExamComponent");
} else {
    console.log("Failed to remove PreviewExamComponent");
}
