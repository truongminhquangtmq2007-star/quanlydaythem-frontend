const fs = require('fs');
const path = require('path');

let roomPath = path.join(__dirname, 'src', 'pages', 'ExamRoom.tsx');
let roomCode = fs.readFileSync(roomPath, 'utf8');

const oldStr = `<ExamResult 
        scoreData={examScore}
        examId={selectedExam?.id || id}
        onClose={() => navigate('/dashboard')}
        gradingResult={gradingResult || undefined}
      />`;

const newStr = `<ExamResult 
        examId={selectedExam?.id || id}
        gradingResult={gradingResult || undefined}
        examData={examData}
        examTitle={selectedExam?.title || 'Kết quả thi'}
        timeTakenSeconds={0}
        onBackToList={() => navigate('/dashboard')}
      />`;

roomCode = roomCode.replace(oldStr, newStr);

// Backup in case the exact string match fails
roomCode = roomCode.replace(
  /scoreData=\{examScore\}\s*examId=\{selectedExam\?\.id \|\| id\}\s*onClose=\{.*?\}\s*gradingResult=\{gradingResult.*?\}/,
  "examId={selectedExam?.id || id}\n        gradingResult={gradingResult || undefined}\n        examData={examData}\n        examTitle={selectedExam?.title || 'Kết quả thi'}\n        timeTakenSeconds={0}\n        onBackToList={() => navigate('/dashboard')}"
);

roomCode = roomCode.replace(/onSubmit=\{handleSubmitExam\}/g, "onSubmit={forceSubmit}");
roomCode = roomCode.replace(/onSubmit=\{handleSubmit\}/g, "onSubmit={forceSubmit}");
fs.writeFileSync(roomPath, roomCode);

console.log("ExamRoom TS fixed.");

