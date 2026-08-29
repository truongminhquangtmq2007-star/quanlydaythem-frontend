const fs = require('fs');
const path = require('path');

// 1. Fix ClassManagement
let classPath = path.join(__dirname, 'src', 'pages', 'ClassManagement.tsx');
let classCode = fs.readFileSync(classPath, 'utf8');
classCode = classCode.replace('{cls.student_count || 0}/{cls.max_students}', '0/{cls.max_students}');
fs.writeFileSync(classPath, classCode);

// 2. Fix CreateExamAI
let createPath = path.join(__dirname, 'src', 'pages', 'CreateExamAI.tsx');
let createCode = fs.readFileSync(createPath, 'utf8');
createCode = createCode.replace(/onSubmit=\{handleSubmit\}/g, "onSubmit={handleSaveExam}");
createCode = createCode.replace(
  "onClick={handleSaveJson}>Lưu thay đổi</Button>",
  "onClick={() => { try { setEditContent(JSON.parse(jsonString)); setJsonError(''); } catch(e) { setJsonError('Lỗi JSON'); } }}>Lưu thay đổi</Button>"
);
fs.writeFileSync(createPath, createCode);

// 3. Fix ExamRoom
let roomPath = path.join(__dirname, 'src', 'pages', 'ExamRoom.tsx');
let roomCode = fs.readFileSync(roomPath, 'utf8');
roomCode = roomCode.replace(/onSubmit=\{handleSubmit\}/g, "onSubmit={handleSubmitExam}");
roomCode = roomCode.replace(/gradingResult=\{gradingResult\}/g, "gradingResult={gradingResult || undefined}");
fs.writeFileSync(roomPath, roomCode);

console.log("TS issues patched.");

