const fs = require('fs');

let code = fs.readFileSync('src/pages/ExamResult.tsx', 'utf8');

// Fix destructuring
if (!code.includes('examId,')) {
  code = code.replace(
    /isTeacherView = false,\n\s*\} = props;/,
    "isTeacherView = false,\n    examId,\n  } = props;"
  );
}

// Fix qId in AITutorBlock
// Part 1: examData.part1.map((q: any) => { ...
// Find the exact line in part 1
// It's after: `const isCorrect = detail?.is_correct ?? false;` ... `q.id` is available.
code = code.replace(
  /\{examId && <AITutorBlock examId=\{examId\} questionId=\{\(typeof qId !== 'undefined' \? qId : q\.id\)\.toString\(\)\} \/>\}/g,
  (match, offset, string) => {
    // If it's near "part1Details", we use q.id
    // If it's near "part2Details" or "part3Details", we use qId
    return "{examId && <AITutorBlock examId={examId} questionId={(typeof q !== 'undefined' && q?.id ? q.id : (typeof qId !== 'undefined' ? qId : '')).toString()} />}";
  }
);
// Actually, in TypeScript even inside typeof it throws TS2304 if it's completely missing in scope.
// Let's just fix the exact blocks.

