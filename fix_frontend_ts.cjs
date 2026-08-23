const fs = require('fs');

let code = fs.readFileSync('src/pages/ExamResult.tsx', 'utf8');
const { execSync } = require('child_process');

// 1. In ExamResult, destructure examId from props or useParams
// Add import useParams if not there
if (!code.includes('useParams')) {
  code = code.replace("import React, { useState } from 'react';", "import React, { useState } from 'react';\nimport { useParams } from 'react-router-dom';");
}

// 2. Add const { id } = useParams();
if (!code.includes('const { id } = useParams();')) {
  code = code.replace(
    /const \[aiExplanations, setAiExplanations\] = useState/,
    "const { id } = useParams();\n  const examId = props.examId || id;\n  const [aiExplanations, setAiExplanations] = useState"
  );
}

// 3. Fix qId issue in Part 1 (line 412 is Part 1)
// In Part 1, it iterates over `examData.part1.map((q: any) => {` and there is no `qId`.
code = code.replace(
  /\{examId && <AITutorBlock examId=\{examId\} questionId=\{\(typeof qId !== 'undefined' \? qId : q\.id\)\.toString\(\)\} \/>\}/g,
  (match, offset, string) => {
    // If it's near "part1", we use q.id
    // But since regex is hard to pinpoint, let's replace them specifically.
    return "{examId && <AITutorBlock examId={examId} questionId={typeof qId !== 'undefined' ? qId.toString() : q.id.toString()} />}";
  }
);
// But `typeof qId` still throws TS2304.
// Let's manually replace the 3 occurrences.
const parts = code.split('{examId && <AITutorBlock examId={examId} questionId={(typeof qId !== \'undefined\' ? qId : q.id).toString()} />}');
if (parts.length === 4) {
  code = parts[0] + 
         "{examId && <AITutorBlock examId={examId} questionId={q.id.toString()} />}" + 
         parts[1] + 
         "{examId && <AITutorBlock examId={examId} questionId={qId.toString()} />}" + 
         parts[2] + 
         "{examId && <AITutorBlock examId={examId} questionId={qId.toString()} />}" + 
         parts[3];
}

fs.writeFileSync('src/pages/ExamResult.tsx', code);
console.log('Fixed ExamResult.tsx');

// Fix ExamRoom.tsx
let examRoomCode = fs.readFileSync('src/pages/ExamRoom.tsx', 'utf8');
if (!examRoomCode.includes('useParams')) {
    examRoomCode = examRoomCode.replace("import React", "import { useParams } from 'react-router-dom';\nimport React");
}
if (!examRoomCode.includes('const { id } = useParams();')) {
    examRoomCode = examRoomCode.replace("const ExamRoom = () => {", "const ExamRoom = () => {\n  const { id } = useParams();");
}
fs.writeFileSync('src/pages/ExamRoom.tsx', examRoomCode);
console.log('Fixed ExamRoom.tsx');

try {
  execSync('npx tsc --noEmit', { cwd: '.', stdio: 'inherit' });
} catch (e) {
  console.log('TSC failed');
}

