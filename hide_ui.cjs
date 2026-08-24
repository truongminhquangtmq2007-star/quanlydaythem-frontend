const fs = require('fs');

let code = fs.readFileSync('src/pages/StudentProfile360.tsx', 'utf8');
code = code.replace(
  /<button onClick=\{\(\) => navigate\(\`\/students\/\$\{id\}\/report\`\)\}.*?>[\s\S]*?Tạo Báo cáo Tuần \(AI\)[\s\S]*?<\/button>/,
  '{/* NÚT ẨN DO LỖI DB: <button onClick={() => navigate(`/students/${id}/report`)} ...>✨ Tạo Báo cáo Tuần (AI)</button> */}'
);

code = code.replace(
  /<button onClick=\{handleGenerateAIEvaluation\}.*?>[\s\S]*?Phân tích & Định hướng AI[\s\S]*?<\/button>/,
  '{/* NÚT ẨN DO LỖI DB: <button onClick={handleGenerateAIEvaluation}>✨ Phân tích & Định hướng AI</button> */}'
);

code = code.replace(
  /<button onClick=\{handleGenerateRemark\}.*?>[\s\S]*?Tạo nhận xét AI[\s\S]*?<\/button>/,
  '{/* NÚT ẨN DO LỖI DB: <button onClick={handleGenerateRemark}>✨ Tạo nhận xét AI</button> */}'
);

fs.writeFileSync('src/pages/StudentProfile360.tsx', code);

let classDetail = fs.readFileSync('src/pages/ClassDetail.tsx', 'utf8');
classDetail = classDetail.replace(
  /<button\s+onClick=\{\(\) => setActiveTab\('assignments'\)\}.*?>[\s\S]*?Bài tập[\s\S]*?<\/button>/g,
  '{/* ẨN TẠM THỜI: <button onClick={() => setActiveTab(\'assignments\')}>Bài tập</button> */}'
);
fs.writeFileSync('src/pages/ClassDetail.tsx', classDetail);

let studentDashboard = fs.readFileSync('src/pages/StudentDashboard.tsx', 'utf8');
studentDashboard = studentDashboard.replace(
  /<div style=\{\{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 4px 15px rgba\(0,0,0,0.03\)' \}\}>[\s\S]*?<h2.*?Đề thi & Bài tập gần đây[\s\S]*?<\/div>[\s\S]*?<\/div>/,
  '{/* ẨN TẠM THỜI SECTION ĐỀ THI BÀI TẬP DO LỖI DB */}'
);
fs.writeFileSync('src/pages/StudentDashboard.tsx', studentDashboard);

console.log('Done hiding features');
