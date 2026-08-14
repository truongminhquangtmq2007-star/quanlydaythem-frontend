import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface Folder { id: number; name: string; parent_id: number | null; }
interface Document { id: number; title: string; file_url: string; }
interface Breadcrumb { id: number | null; name: string; }

const DocumentManager = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  const [folders, setFolders] = useState<Folder[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentParentId, setCurrentParentId] = useState<number | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([ { id: null, name: 'Thư mục gốc' } ]);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentTitle, setDocumentTitle] = useState('');

  const fetchClasses = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get('[https://quanlydaythem-api.onrender.com](https://quanlydaythem-api.onrender.com)/api/classes', { headers: { Authorization: `Bearer ${token}` } });
      setClasses(res.data);
    } catch (error) { console.error("Lỗi lấy danh sách lớp"); }
  };

  const fetchDriveContents = useCallback(async (parentId: number | null) => {
    if (!selectedClassId) return;
    const token = localStorage.getItem('token');
    try {
      // LUÔN LUÔN LÀ 'STORAGE' (Kho lưu trữ)
      const url = `[https://quanlydaythem-api.onrender.com](https://quanlydaythem-api.onrender.com)/api/folders/drive?category=STORAGE&class_id=${selectedClassId}${parentId ? `&parent_id=${parentId}` : ''}`;
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setFolders(res.data.folders || []);
      setDocuments(res.data.documents || []);
    } catch (error) { console.error("Lỗi tải dữ liệu Drive", error); }
  }, [selectedClassId]);

  useEffect(() => { fetchClasses(); }, []);

  useEffect(() => {
    setCurrentParentId(null);
    setBreadcrumbs([{ id: null, name: 'Thư mục gốc' }]);
    if (selectedClassId) fetchDriveContents(null);
  }, [selectedClassId, fetchDriveContents]);

  useEffect(() => {
    if (selectedClassId) fetchDriveContents(currentParentId);
  }, [currentParentId, fetchDriveContents]);

  const handleDoubleClickFolder = (folderId: number, folderName: string) => {
    setCurrentParentId(folderId);
    setBreadcrumbs([...breadcrumbs, { id: folderId, name: folderName }]);
  };

  const handleClickBreadcrumb = (id: number | null, index: number) => {
    setCurrentParentId(id);
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName) return alert("Vui lòng nhập tên thư mục!");
    const token = localStorage.getItem('token');
    try {
      await axios.post('[https://quanlydaythem-api.onrender.com](https://quanlydaythem-api.onrender.com)/api/folders', {
        name: folderName, category: 'STORAGE', class_id: selectedClassId, parent_id: currentParentId
      }, { headers: { Authorization: `Bearer ${token}` } });
      setShowFolderModal(false); setFolderName(''); fetchDriveContents(currentParentId);
    } catch (error) { alert("Lỗi khi tạo thư mục"); }
  };

  const handleDeleteFolder = async (folderId: number) => {
    if (!window.confirm('CẢNH BÁO: Xóa thư mục này sẽ xóa luôn cả các thư mục con. Chắc chắn không?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`[https://quanlydaythem-api.onrender.com](https://quanlydaythem-api.onrender.com)/api/folders/${folderId}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchDriveContents(currentParentId);
    } catch (error) { alert('❌ Lỗi khi xóa thư mục!'); }
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !documentTitle) return alert("Vui lòng nhập tên và chọn tệp!");
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', documentTitle);
    formData.append('category', 'STORAGE'); // LUÔN LÀ STORAGE
    formData.append('class_id', selectedClassId);
    if (currentParentId) formData.append('folder_id', currentParentId.toString());

    const token = localStorage.getItem('token');
    try {
      await axios.post('[https://quanlydaythem-api.onrender.com](https://quanlydaythem-api.onrender.com)/api/documents/upload', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      alert(`✅ Đã tải thành công tệp lên Kho Lưu Trữ!`);
      setShowUploadModal(false); setSelectedFile(null); setDocumentTitle(''); fetchDriveContents(currentParentId);
    } catch (error) { alert("❌ Lỗi khi tải tệp lên."); }
  };

  const handleDeleteDocument = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa tài liệu này?")) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`[https://quanlydaythem-api.onrender.com](https://quanlydaythem-api.onrender.com)/api/documents/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchDriveContents(currentParentId);
    } catch (error) { alert("Lỗi khi xóa tệp"); }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '100%', boxSizing: 'border-box', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '30px' }}>Kho Lưu Trữ Lý Thuyết</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>Quản lý bài giảng và tài liệu học tập của các lớp.</p>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', color: '#475569' }}>Lớp đang chọn:</span>
          <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} style={{ padding: '12px 20px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontWeight: 'bold', color: '#0f172a' }}>
            <option value="">-- Chọn lớp học --</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
          </select>
        </div>
      </div>

      {!selectedClassId ? (
        <div style={{ backgroundColor: 'white', padding: '60px', borderRadius: '20px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.03)', color: '#94a3b8' }}>
          <div style={{ fontSize: '50px', marginBottom: '15px' }}>🏫</div><h2>Chưa chọn lớp học</h2>
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f1f5f9', padding: '10px 20px', borderRadius: '12px', fontSize: '15px', flexWrap: 'wrap' }}>
              {breadcrumbs.map((crumb, index) => (
                <span key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span onClick={() => handleClickBreadcrumb(crumb.id, index)} style={{ cursor: 'pointer', color: index === breadcrumbs.length - 1 ? '#0f172a' : '#3b82f6', fontWeight: index === breadcrumbs.length - 1 ? 'bold' : 'normal' }}>{crumb.name}</span>
                  {index < breadcrumbs.length - 1 && <span style={{ color: '#94a3b8' }}>/</span>}
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowFolderModal(true)} style={{ padding: '10px 18px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>📁 + Thư mục</button>
              <button onClick={() => setShowUploadModal(true)} style={{ padding: '10px 18px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>☁️ Tải tệp lên</button>
            </div>
          </div>

          <div style={{ minHeight: '300px', borderTop: '2px solid #f1f5f9', paddingTop: '25px', display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
            {folders.length === 0 && documents.length === 0 && <div style={{ width: '100%', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Trống.</div>}
            {folders.map(folder => (
              <div key={folder.id} onDoubleClick={() => handleDoubleClickFolder(folder.id, folder.name)} style={{ position: 'relative', width: '130px', padding: '20px 10px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                <span style={{ fontSize: '45px', marginBottom: '10px' }}>📁</span>
                <span style={{ textAlign: 'center', wordBreak: 'break-word', fontSize: '14px', fontWeight: 'bold', color: '#334155' }}>{folder.name}</span>
                <div onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }} style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: '#ef4444', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>X</div>
              </div>
            ))}
            {documents.map(doc => (
              <div key={doc.id} style={{ position: 'relative', width: '130px', padding: '20px 10px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                <span style={{ fontSize: '45px', marginBottom: '10px' }}>{doc.file_url.includes('.pdf') ? '📕' : doc.file_url.includes('.doc') ? '📘' : '📄'}</span>
                <span style={{ textAlign: 'center', wordBreak: 'break-word', fontSize: '13px', fontWeight: 'bold', color: '#0f172a', marginBottom: '12px' }}>{doc.title}</span>
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '6px 12px', backgroundColor: '#e2e8f0', color: '#475569', borderRadius: '8px', fontSize: '12px', textDecoration: 'none', fontWeight: 'bold' }}>Mở tệp</a>
                <div onClick={() => handleDeleteDocument(doc.id)} style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: '#ef4444', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>X</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals Tải file & Tạo thư mục (Giữ nguyên cấu trúc cũ) */}
      {showFolderModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '400px' }}>
            <h3 style={{ marginTop: 0 }}>📁 Tạo Thư Mục Mới</h3>
            <form onSubmit={handleCreateFolder}>
              <input type="text" value={folderName} onChange={(e) => setFolderName(e.target.value)} placeholder="Tên thư mục..." autoFocus style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '25px' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowFolderModal(false)} style={{ padding: '10px 15px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Hủy</button>
                <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Tạo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '450px' }}>
            <h3 style={{ marginTop: 0 }}>☁️ Tải Tài Liệu Lên</h3>
            <form onSubmit={handleUploadFile}>
              <input type="text" value={documentTitle} onChange={(e) => setDocumentTitle(e.target.value)} placeholder="Tên tài liệu..." style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '15px' }} />
              <div style={{ border: '2px dashed #cbd5e1', padding: '30px', textAlign: 'center', marginBottom: '25px' }}>
                <input type="file" onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowUploadModal(false)} style={{ padding: '10px 15px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Hủy</button>
                <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Tải Lên</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManager;