const fs = require('fs');
let code = fs.readFileSync('src/pages/ExamEditor.tsx', 'utf8');

const imageInput = `
              <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', color: '#475569', fontWeight: 'bold' }}>
                  📷 Tải ảnh lên
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      alert('Tính năng đang phát triển: Upload ảnh ' + e.target.files[0].name);
                    }
                  }} />
                </label>
              </div>`;

code = code.replace(/<textarea value=\{q.questionText\}[^>]+ \/>/g, (match) => {
  return match + imageInput;
});

fs.writeFileSync('src/pages/ExamEditor.tsx', code);
console.log('Added image inputs to ExamEditor');

