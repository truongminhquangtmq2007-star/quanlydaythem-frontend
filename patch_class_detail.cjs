const fs = require('fs');
let code = fs.readFileSync('src/pages/ClassDetail.tsx', 'utf8');

const handleSyncFn = `
  const handleSyncCalendar = async () => {
    if (!activeSession) return;
    try {
      await axiosClient.post(\`/api/classes/sessions/\${activeSession.id}/sync-calendar\`);
      alert('Đồng bộ lại lịch Google thành công!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi đồng bộ lịch');
    }
  };
`;

if (!code.includes('handleSyncCalendar')) {
  code = code.replace("const selectSession = (sess: Session) => {", handleSyncFn + "\n  const selectSession = (sess: Session) => {");
}

const buttonUI = `<div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <h2 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '24px' }}>Bảng Điểm Danh - {new Date(activeSession.session_date).toLocaleDateString('vi-VN')}</h2>
                      <button onClick={handleSyncCalendar} style={{ padding: '6px 12px', backgroundColor: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>🔄 Đồng bộ Calendar</button>
                    </div>`;

code = code.replace(
  `<h2 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '24px' }}>Bảng Điểm Danh - {new Date(activeSession.session_date).toLocaleDateString('vi-VN')}</h2>`,
  buttonUI
);

fs.writeFileSync('src/pages/ClassDetail.tsx', code);
console.log("Patched ClassDetail");

