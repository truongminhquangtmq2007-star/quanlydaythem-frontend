const fs = require('fs');

let code = fs.readFileSync('src/pages/ExamResult.tsx', 'utf8');
const { execSync } = require('child_process');

const targetStr = "{examId && <AITutorBlock examId={examId} questionId={typeof qId !== 'undefined' ? qId.toString() : q.id.toString()} />}";

const parts = code.split(targetStr);
if (parts.length === 4) {
  // Replace the first occurrence (Part 1) with q.id
  // Replace the second occurrence (Part 2) with qId
  // Replace the third occurrence (Part 3) with qId
  code = parts[0] + 
         "{examId && <AITutorBlock examId={examId} questionId={q.id.toString()} />}" + 
         parts[1] + 
         "{examId && <AITutorBlock examId={examId} questionId={qId.toString()} />}" + 
         parts[2] + 
         "{examId && <AITutorBlock examId={examId} questionId={qId.toString()} />}" + 
         parts[3];
  
  fs.writeFileSync('src/pages/ExamResult.tsx', code);
  console.log('Fixed qId issues in ExamResult.tsx');
  
  try {
    execSync('npx tsc --noEmit', { cwd: '.', stdio: 'inherit' });
    console.log('TSC passed!');
  } catch (e) {
    console.log('TSC failed!');
  }
} else {
  console.log('Could not find 3 occurrences of target string. Found: ' + (parts.length - 1));
}

