const fs = require('fs');
let code = fs.readFileSync('src/pages/DocumentLibrary.tsx', 'utf8');

const newVariables = `
  const [docForm, setDocForm] = useState({ title: '', file_url: '' });
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
`;

code = code.replace(/const \[docForm, setDocForm\] = useState\(\{ title: '', file_url: '' \}\);/g, newVariables);

const newHandleAddDoc = `
  const handleAddDoc = async () => {
    if (!docForm.title || (!docForm.file_url && !docFile)) return;
    
    setUploadingDoc(true);
    let finalUrl = docForm.file_url;
    
    try {
      if (docFile) {
        const formData = new FormData();
        formData.append('file', docFile);
        
        const uploadRes = await axiosClient.post('/api/upload/document', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        finalUrl = uploadRes.data.secure_url;
      }
      
      await axiosClient.post('/api/documents', { title: docForm.title, file_url: finalUrl, folder_id: currentFolderId });
      setShowDocModal(false);
      setDocForm({ title: '', file_url: '' });
      setDocFile(null);
      fetchContents(currentFolderId);
    } catch (err: any) {
      alert('Lỗi thêm tài liệu: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingDoc(false);
    }
  };
`;

code = code.replace(/const handleAddDoc = async \(\) => \{[\s\S]*?catch \(err\) \{[\s\S]*?alert\('Lỗi thêm tài liệu'\);[\s\S]*?\}[\s\S]*?\};/g, newHandleAddDoc);
// Fallback for character encoding mismatch:
code = code.replace(/const handleAddDoc = async \(\) => \{[\s\S]*?catch \(err\) \{[\s\S]*?\}\s*\};/g, newHandleAddDoc);

const newModalInputs = `
              <input value={docForm.title} onChange={e => setDocForm({...docForm, title: e.target.value})} placeholder="Tên tài liệu..." style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tải file lên (PDF, Word...):</label>
                <input type="file" onChange={e => setDocFile(e.target.files?.[0] || null)} style={{ width: '100%', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }} />
              </div>
              <div style={{ textAlign: 'center', marginBottom: '10px', color: '#64748b' }}>Hoặc nhập URL trực tiếp:</div>
              <input value={docForm.file_url} onChange={e => setDocForm({...docForm, file_url: e.target.value})} placeholder="URL tài liệu (VD: https://...)" style={{ width: '100%', padding: '10px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button onClick={() => setShowDocModal(false)} disabled={uploadingDoc} style={{ padding: '10px 15px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Hủy</button>
                <button onClick={handleAddDoc} disabled={uploadingDoc} style={{ padding: '10px 15px', backgroundColor: uploadingDoc ? '#94a3b8' : '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: uploadingDoc ? 'not-allowed' : 'pointer' }}>
                  {uploadingDoc ? 'Đang tải lên...' : 'Lưu'}
                </button>
              </div>
`;

code = code.replace(
  /<input value=\{docForm\.title\} onChange=\{e => setDocForm\(\{\.\.\.docForm, title: e\.target\.value\}\)\} placeholder="[^"]+" style=\{\{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #cbd5e1' \}\} \/>[\s\S]*?<\/div>/g,
  newModalInputs
);

fs.writeFileSync('src/pages/DocumentLibrary.tsx', code);
console.log('Patched DocumentLibrary');

