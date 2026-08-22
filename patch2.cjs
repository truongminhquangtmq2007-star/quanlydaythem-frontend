const fs = require('fs');
let code = fs.readFileSync('src/pages/ExamRoom.tsx', 'utf8');

const replacement = `    return (
      <div style={{...wrapperStyle, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9'}}>
        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '20px', width: '500px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
          <div style={{ fontSize: '50px', marginBottom: '15px' }}>⏱️</div>
          <h2 style={{ margin: '0 0 15px 0', color: '#1e293b' }}>Xác nhận vào thi</h2>
          <p style={{ color: '#475569', fontSize: '15px', lineHeight: '1.6', marginBottom: '30px' }}>Bạn chuẩn bị làm bài thi: <strong>{selectedExam?.title}</strong>.<br/>Thời gian làm bài: <strong>{selectedExam?.duration_minutes || 50} phút</strong>.<br/><br/>Hệ thống sẽ chuyển sang chế độ <strong>Toàn màn hình</strong>.</p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <button onClick={() => setViewState('LIST')} style={{ padding: '12px 25px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Quay lại</button>
            <button onClick={startExam} style={{ padding: '12px 25px', backgroundColor: '#1e40af', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Bắt đầu thi</button>
          </div>
        </div>
      </div>
    );
  }

  // ================= VIEW 3: KẾT QUẢ THI =================
  if (viewState === 'RESULT') {`;

const regex = /    return \(\n      <div style=\{\{\.\.\.wrapperStyle, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9'\}\}>\n        <div style=\{\{ backgroundColor: 'white', padding: '40px', borderRadius: '20px', width: '500px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba\(0,0,0,0\.25\)' \}\}>\n\n  \/\/ ================= VIEW 3: KẾT QUẢ THI =================\n  if \(viewState === 'RESULT'\) \{/m;

code = code.replace(regex, replacement);
fs.writeFileSync('src/pages/ExamRoom.tsx', code);
console.log("Patched successfully");

