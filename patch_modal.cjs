const fs = require('fs');
let code = fs.readFileSync('src/pages/ClassDetail.tsx', 'utf8');

// 1. Change handleOpenAssignModal
const oldHandleOpenAssignModal = `const handleOpenAssignModal = async () => {
      try {
        const res = await axiosClient.get('/api/documents');
        setAllDocs(res.data);
        setShowAssignModal(true);
      } catch (err) {
        alert('Lỗi tải danh sách tài liệu');
      }
    };`;
    
const newHandleOpenAssignModal = `const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);
    const [isAssigning, setIsAssigning] = useState(false);
    
    const handleOpenAssignModal = async () => {
      try {
        const res = await axiosClient.get(\`/api/classes/\${id}/assignable-documents\`);
        setAllDocs(res.data);
        
        // Auto select documents that already belong to this class
        const alreadyAssigned = res.data.filter((d: any) => d.folder_class_id === Number(id)).map((d: any) => d.id);
        setSelectedDocIds(alreadyAssigned);
        
        setShowAssignModal(true);
      } catch (err) {
        alert('Lỗi tải danh sách tài liệu');
      }
    };`;

code = code.replace(
  `const handleOpenAssignModal = async () => {\n      try {\n        const res = await axiosClient.get('/api/documents');\n        setAllDocs(res.data);\n        setShowAssignModal(true);\n      } catch (err) {\n        alert('L\\u1ED7i t\\u1EA3i danh s\\u00E1ch t\\u00E0i li\\u1EC7u');\n      }\n    };`, 
  newHandleOpenAssignModal
);

// Fallback replace for handleOpenAssignModal if exact string failed
if (!code.includes('get(`/api/classes/${id}/assignable-documents`)')) {
    code = code.replace(/const handleOpenAssignModal = async \(\) => \{[\s\S]*?\};/, newHandleOpenAssignModal);
}

// 2. Change handleCreateAssignment
const newHandleCreateAssignment = `const handleCreateAssignment = async (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedDocIds.length === 0) {
        alert('Vui lòng chọn ít nhất 1 tài liệu.');
        return;
      }
      setIsAssigning(true);
      try {
        await axiosClient.post(\`/api/classes/\${id}/assign-documents\`, { 
          document_ids: selectedDocIds 
        });
        alert('Gán tài liệu vào lớp thành công.');
        setShowAssignModal(false);
        fetchData(); // refresh assignments list
      } catch (err) {
        alert('Lỗi giao tài liệu/đề thi');
      } finally {
        setIsAssigning(false);
      }
    };`;

code = code.replace(/const handleCreateAssignment = async \(e: React\.FormEvent\) => \{[\s\S]*?\};/, newHandleCreateAssignment);

// 3. Update Modal UI
const oldModalUI = `<form onSubmit={handleCreateAssignment}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Tiêu đề giao bài</label>
                  <input required value={newAssignment.title} onChange={e => setNewAssignment({...newAssignment, title: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none' }} placeholder="VD: Bài tập về nhà tuần 1" />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Chọn Tài Liệu / Đề Thi gốc</label>
                  <select required value={newAssignment.document_id} onChange={e => setNewAssignment({...newAssignment, document_id: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: 'white' }}>
                    <option value="">-- Chọn tài liệu trong kho --</option>
                    {allDocs.map(d => <option key={d.id} value={d.id}>[{d.type}] {d.title}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: '25px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Hạn chót nộp bài (Due Date)</label>
                  <input required type="datetime-local" value={newAssignment.due_at} onChange={e => setNewAssignment({...newAssignment, due_at: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button type="button" onClick={() => setShowAssignModal(false)} style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#f1f5f9', color: '#475569', cursor: 'pointer', fontWeight: 'bold' }}>Hủy</button>
                  <button type="submit" style={{ padding: '12px 24px', borderRadius: '10px', border: 'none', backgroundColor: '#8b5cf6', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Giao Bài Tập</button>
                </div>
              </form>`;

const newModalUI = `<form onSubmit={handleCreateAssignment}>
                <div style={{ marginBottom: '20px', maxHeight: '60vh', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '15px', backgroundColor: '#f8fafc' }}>
                  {Object.values(
                    allDocs.reduce((acc, doc) => {
                      const key = doc.folder_id ? \`\${doc.folder_id}_\${doc.folder_name}\` : 'null_Chưa phân loại';
                      if (!acc[key]) acc[key] = { folder_id: doc.folder_id, folder_name: doc.folder_name || 'Chưa phân loại', docs: [] };
                      acc[key].docs.push(doc);
                      return acc;
                    }, {} as Record<string, any>)
                  ).map((group: any) => {
                    const allSelected = group.docs.length > 0 && group.docs.every((d: any) => selectedDocIds.includes(d.id));
                    const someSelected = group.docs.some((d: any) => selectedDocIds.includes(d.id));
                    return (
                      <div key={group.folder_id || 'null'} style={{ marginBottom: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', backgroundColor: '#e2e8f0', borderRadius: '8px', fontWeight: 'bold', color: '#334155' }}>
                          <input 
                            type="checkbox" 
                            checked={allSelected}
                            ref={input => {
                              if (input) {
                                input.indeterminate = !allSelected && someSelected;
                              }
                            }}
                            onChange={(e) => {
                              if (e.target.checked) {
                                const newIds = new Set([...selectedDocIds, ...group.docs.map((d: any) => d.id)]);
                                setSelectedDocIds(Array.from(newIds));
                              } else {
                                const newIds = selectedDocIds.filter(id => !group.docs.find((d: any) => d.id === id));
                                setSelectedDocIds(newIds);
                              }
                            }}
                          />
                          📁 {group.folder_name}
                        </div>
                        <div style={{ paddingLeft: '25px', marginTop: '5px' }}>
                          {group.docs.map((doc: any) => (
                            <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', color: '#475569' }}>
                              <input 
                                type="checkbox" 
                                checked={selectedDocIds.includes(doc.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedDocIds([...selectedDocIds, doc.id]);
                                  } else {
                                    setSelectedDocIds(selectedDocIds.filter(id => id !== doc.id));
                                  }
                                }}
                              />
                              📄 {doc.title} {doc.folder_class_id === Number(id) && <span style={{fontSize: '11px', backgroundColor: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px'}}>Đã gán</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {allDocs.length === 0 && <div style={{textAlign: 'center', color: '#94a3b8', padding: '20px'}}>Không có tài liệu nào trong kho</div>}
                </div>
                
                <div style={{ marginBottom: '20px', color: '#0f172a', fontWeight: 'bold' }}>
                  Đã chọn {selectedDocIds.length} tài liệu
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button type="button" onClick={() => setShowAssignModal(false)} style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#f1f5f9', color: '#475569', cursor: 'pointer', fontWeight: 'bold' }}>Hủy</button>
                  <button type="submit" disabled={isAssigning} style={{ padding: '12px 24px', borderRadius: '10px', border: 'none', backgroundColor: isAssigning ? '#cbd5e1' : '#8b5cf6', color: 'white', fontWeight: 'bold', cursor: isAssigning ? 'not-allowed' : 'pointer' }}>
                    {isAssigning ? 'Đang gán...' : 'Gán vào lớp'}
                  </button>
                </div>
              </form>`;

// We will use replace with regex for the whole form block
code = code.replace(/<form onSubmit=\{handleCreateAssignment\}>[\s\S]*?<\/form>/, newModalUI);

// Replace title "Giao Bài Tập Cho Lớp" with "Gán Tài Liệu / Đề Thi Vào Lớp"
code = code.replace(
  /<h2 style=\{\{ margin: '0 0 25px 0', color: '#0f172a' \}\}>Giao Bài Tập Cho Lớp<\/h2>/,
  "<h2 style={{ margin: '0 0 25px 0', color: '#0f172a' }}>Gán Tài Liệu / Đề Thi Vào Lớp</h2>"
);

fs.writeFileSync('src/pages/ClassDetail.tsx', code);
console.log("Patched ClassDetail.tsx successfully.");
