const fs = require('fs');
let code = fs.readFileSync('src/pages/StudentDashboard.tsx', 'utf8');

const importAxios = `import { axiosClient } from '../api/axiosClient';`;
if (!code.includes('import { axiosClient }')) {
  // Try to find imports
  code = code.replace("import React,", "import { axiosClient } from '../api/axiosClient';\nimport React,");
}

// Add state for email update
const stateHooks = `  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');`;

if (!code.includes('showEmailModal')) {
  code = code.replace("  const [data, setData] = useState<any>(null);", "  const [data, setData] = useState<any>(null);\n" + stateHooks);
}

// Set email input when data loads
const effectHook = `        setData(res.data);
        if (res.data.profile?.email) {
            setEmailInput(res.data.profile.email);
        }`;
code = code.replace("setData(res.data);", effectHook);

// Handle email update function
const handleEmailUpdate = `
  const handleUpdateEmail = async () => {
    try {
      await axiosClient.put('/api/student/email', { email: emailInput });
      alert('Cập nhật email thành công!');
      setShowEmailModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi cập nhật email');
    }
  };
`;
if (!code.includes('handleUpdateEmail')) {
  code = code.replace("useEffect(() => {", handleEmailUpdate + "\n  useEffect(() => {");
}

// Add email UI below school name
const uiOld = `<p style={{ margin: 0, color: '#64748b' }}>Trường {data.profile.school}</p>`;
const uiNew = `<p style={{ margin: 0, color: '#64748b' }}>Trường {data.profile.school}</p>
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '14px', color: '#334155' }}>Email: {data.profile.email || 'Chưa cập nhật'}</span>
            <button onClick={() => setShowEmailModal(true)} style={{ padding: '4px 10px', fontSize: '12px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Cập nhật</button>
          </div>`;

code = code.replace(uiOld, uiNew);

// Add modal UI at the end
const modalUI = `
      {showEmailModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '15px', width: '400px' }}>
            <h3>Cập nhật Email</h3>
            <p style={{ fontSize: '13px', color: '#64748b' }}>Dùng để nhận lời mời học từ Google Calendar</p>
            <input 
              type="email" 
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Nhập email của em..."
              style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1', marginBottom: '20px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowEmailModal(false)} style={{ padding: '8px 16px', border: 'none', backgroundColor: '#e2e8f0', borderRadius: '5px', cursor: 'pointer' }}>Hủy</button>
              <button onClick={handleUpdateEmail} style={{ padding: '8px 16px', border: 'none', backgroundColor: '#3b82f6', color: 'white', borderRadius: '5px', cursor: 'pointer' }}>Lưu</button>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace("</div>\n    </div>\n  );\n}", modalUI + "\n</div>\n    </div>\n  );\n}");
fs.writeFileSync('src/pages/StudentDashboard.tsx', code);
console.log("Patched StudentDashboard");
