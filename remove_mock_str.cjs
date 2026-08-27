const fs = require('fs');
let code = fs.readFileSync('src/pages/CreateExamAI.tsx', 'utf8');

const targetStr = `const PreviewExamComponent = ({ data }: { data: any }) => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2 style={{ color: '#10b981' }}>🎉 Xem Trước Đề Thi (Mock Preview Component)</h2>
      <p>ID Tài liệu: {data.document_id}</p>
      <p>Số câu hỏi (Part 1): {data.questions?.part1?.length || 0}</p>
    </div>
  );
};`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, "");
    fs.writeFileSync('src/pages/CreateExamAI.tsx', code);
    console.log("Removed PreviewExamComponent string");
} else {
    console.log("Failed to remove PreviewExamComponent string");
}

