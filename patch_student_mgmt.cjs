const fs = require('fs');
let code = fs.readFileSync('src/pages/StudentManagement.tsx', 'utf8');

// 1. Add states for Reset Password
code = code.replace(
  "const [newStudent, setNewStudent] = useState({ full_name: '', parent_phone: '', school: '', grade: '' });",
  `const [newStudent, setNewStudent] = useState({ full_name: '', parent_phone: '', school: '', grade: '' });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');`
);

// 2. Add handleResetPassword function
const handleResetCode = `
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;
    try {
      await axiosClient.put(\`/api/students/\${selectedStudentId}/reset-password\`, { newPassword });
      alert('Đổi mật khẩu thành công');
      setShowPasswordModal(false);
      setNewPassword('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi đổi mật khẩu');
    }
  };
`;
code = code.replace(
  "const handleCreate = async (e: React.FormEvent) => {",
  handleResetCode + "\n  const handleCreate = async (e: React.FormEvent) => {"
);

// 3. Add Password Modal UI before final closing div
const passwordModalUI = `
      {showPasswordModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'white', padding: '35px', borderRadius: '20px', width: '400px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <h2 style={{ margin: '0 0 25px 0', color: '#0f172a' }}>Đổi Mật Khẩu Học Sinh</h2>
            <form onSubmit={handleResetPassword}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Mật khẩu mới</label>
                <input required type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none' }} placeholder="Nhập mật khẩu mới..." />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowPasswordModal(false)} style={{ padding: '12px 20px', backgroundColor: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Hủy</button>
                <button type="submit" style={{ padding: '12px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Lưu Mật Khẩu</button>
              </div>
            </form>
          </div>
        </div>
      )}
`;
code = code.replace(/    <\/div>\n  \);\n\};\n\nexport default StudentManagement;/g, passwordModalUI + "\n    </div>\n  );\n};\n\nexport default StudentManagement;");

// 4. Add the Reset Password button in the table
const newTableButtons = `                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedStudentId(student.id); setShowPasswordModal(true); }}
                      style={{ padding: '8px 12px', backgroundColor: '#fef3c7', color: '#d97706', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      🔑 Đổi MK
                    </button>
                    <button style={{ padding: '8px 16px', backgroundColor: '#eff6ff', color: '#3b82f6', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Xem Hồ Sơ</button>
                  </div>`;
code = code.replace(
  /<button style=\{\{ padding: '8px 16px', backgroundColor: '#eff6ff', color: '#3b82f6', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' \}\}>Xem Hồ Sơ<\/button>/g,
  newTableButtons
);

fs.writeFileSync('src/pages/StudentManagement.tsx', code);
console.log("Patched successfully");

