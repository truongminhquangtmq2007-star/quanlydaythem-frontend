import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

interface Folder {
  id: number;
  name: string;
  parent_id: number | null;
}

interface DocumentInfo {
  id: number;
  title: string;
  file_url: string;
  folder_id: number | null;
}

const DocumentLibrary = () => {
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<{id: number | null, name: string}[]>([{id: null, name: 'Trang chủ'}]);

  // Modal states
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderName, setFolderName] = useState('');
  
  const [showDocModal, setShowDocModal] = useState(false);
  const [docForm, setDocForm] = useState({ title: '', file_url: '' });

  const [showMoveModal, setShowMoveModal] = useState(false);
  const [itemToMove, setItemToMove] = useState<{type: 'FOLDER'|'DOC', id: number} | null>(null);
  const [targetFolderId, setTargetFolderId] = useState<number | null>(null);

  useEffect(() => {
    fetchContents(currentFolderId);
  }, [currentFolderId]);

  const fetchContents = async (folderId: number | null) => {
    try {
      const res = await axiosClient.get(`/api/folders/${folderId || '0'}/contents`);
      setFolders(res.data.folders);
      setDocuments(res.data.documents);
    } catch (err) {
      console.error(err);
    }
  };

  const navigateTo = (folderId: number | null, folderName?: string) => {
    setCurrentFolderId(folderId);
    if (folderId === null) {
      setBreadcrumbs([{id: null, name: 'Trang chủ'}]);
    } else if (folderName) {
      const idx = breadcrumbs.findIndex(b => b.id === folderId);
      if (idx !== -1) {
        setBreadcrumbs(breadcrumbs.slice(0, idx + 1));
      } else {
        setBreadcrumbs([...breadcrumbs, {id: folderId, name: folderName}]);
      }
    }
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;
    try {
      await axiosClient.post('/api/folders', { name: folderName, parent_id: currentFolderId, category: 'STORAGE' });
      setShowFolderModal(false);
      setFolderName('');
      fetchContents(currentFolderId);
    } catch (err) {
      alert('Lỗi tạo thư mục');
    }
  };

  const handleAddDoc = async () => {
    if (!docForm.title || !docForm.file_url) return;
    try {
      await axiosClient.post('/api/documents', { ...docForm, folder_id: currentFolderId });
      setShowDocModal(false);
      setDocForm({ title: '', file_url: '' });
      fetchContents(currentFolderId);
    } catch (err) {
      alert('Lỗi thêm tài liệu');
    }
  };

  const handleDeleteDoc = async (id: number) => {
    if (!window.confirm('Xóa tài liệu này?')) return;
    try {
      await axiosClient.delete(`/api/documents/${id}`);
      fetchContents(currentFolderId);
    } catch (err) {
      alert('Lỗi xóa tài liệu');
    }
  };

  const handleDeleteFolder = async (id: number) => {
    if (!window.confirm('Xóa thư mục này? (Phải trống mới xóa được)')) return;
    try {
      await axiosClient.delete(`/api/folders/${id}`);
      fetchContents(currentFolderId);
    } catch (err) {
      alert('Không thể xóa thư mục (có thể không trống)');
    }
  };

  const handleMoveItem = async () => {
    if (!itemToMove) return;
    try {
      if (itemToMove.type === 'DOC') {
        // Cần pass title để update
        const doc = documents.find(d => d.id === itemToMove.id);
        if (doc) {
          await axiosClient.put(`/api/documents/${itemToMove.id}`, { title: doc.title, folder_id: targetFolderId });
        }
      }
      setShowMoveModal(false);
      fetchContents(currentFolderId);
    } catch (err) {
      alert('Lỗi di chuyển');
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>📚 Kho Tài Liệu</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowFolderModal(true)} style={{ padding: '10px 15px', backgroundColor: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            + Tạo thư mục
          </button>
          <button onClick={() => setShowDocModal(true)} style={{ padding: '10px 15px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            + Thêm tài liệu
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', fontSize: '15px', color: '#3b82f6', cursor: 'pointer' }}>
        {breadcrumbs.map((b, idx) => (
          <React.Fragment key={idx}>
            <span onClick={() => navigateTo(b.id, b.name)} style={{ fontWeight: idx === breadcrumbs.length - 1 ? 'bold' : 'normal', textDecoration: 'underline' }}>
              {b.name}
            </span>
            {idx < breadcrumbs.length - 1 && <span style={{ color: '#94a3b8', textDecoration: 'none' }}> / </span>}
          </React.Fragment>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
        {folders.map(f => (
          <div key={`f-${f.id}`} style={{ padding: '20px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div onClick={() => navigateTo(f.id, f.name)} style={{ fontSize: '40px', marginBottom: '10px' }}>📁</div>
            <div onClick={() => navigateTo(f.id, f.name)} style={{ fontWeight: 'bold', color: '#334155', textAlign: 'center', marginBottom: '10px', wordBreak: 'break-all' }}>{f.name}</div>
            <button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(f.id); }} style={{ padding: '4px 8px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Xóa</button>
          </div>
        ))}

        {documents.map(d => (
          <div key={`d-${d.id}`} style={{ padding: '20px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📄</div>
            <div style={{ fontWeight: 'bold', color: '#334155', textAlign: 'center', marginBottom: '15px', wordBreak: 'break-all' }}>{d.title}</div>
            <div style={{ display: 'flex', gap: '5px' }}>
              <a href={d.file_url} target="_blank" rel="noreferrer" style={{ padding: '4px 8px', backgroundColor: '#3b82f6', color: 'white', textDecoration: 'none', borderRadius: '4px', fontSize: '13px' }}>Mở</a>
              <button onClick={() => { setItemToMove({type: 'DOC', id: d.id}); setShowMoveModal(true); }} style={{ padding: '4px 8px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Di chuyển</button>
              <button onClick={() => handleDeleteDoc(d.id)} style={{ padding: '4px 8px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Xóa</button>
            </div>
          </div>
        ))}
        {folders.length === 0 && documents.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#94a3b8', padding: '40px' }}>Thư mục trống</div>
        )}
      </div>

      {showFolderModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '400px' }}>
            <h3 style={{ margin: '0 0 20px 0' }}>Tạo thư mục mới</h3>
            <input value={folderName} onChange={e => setFolderName(e.target.value)} placeholder="Tên thư mục..." style={{ width: '100%', padding: '10px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowFolderModal(false)} style={{ padding: '10px 15px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Hủy</button>
              <button onClick={handleCreateFolder} style={{ padding: '10px 15px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Tạo</button>
            </div>
          </div>
        </div>
      )}

      {showDocModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '400px' }}>
            <h3 style={{ margin: '0 0 20px 0' }}>Thêm tài liệu</h3>
            <input value={docForm.title} onChange={e => setDocForm({...docForm, title: e.target.value})} placeholder="Tên tài liệu..." style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            <input value={docForm.file_url} onChange={e => setDocForm({...docForm, file_url: e.target.value})} placeholder="URL tài liệu (VD: https://...)" style={{ width: '100%', padding: '10px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowDocModal(false)} style={{ padding: '10px 15px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Hủy</button>
              <button onClick={handleAddDoc} style={{ padding: '10px 15px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Lưu</button>
            </div>
          </div>
        </div>
      )}

      {showMoveModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '400px' }}>
            <h3 style={{ margin: '0 0 20px 0' }}>Di chuyển tới...</h3>
            <p style={{ marginBottom: '15px', color: '#64748b' }}>Nhập ID thư mục đích (0 để đưa ra ngoài Trang chủ):</p>
            <input type="number" onChange={e => setTargetFolderId(e.target.value ? Number(e.target.value) : null)} placeholder="Folder ID..." style={{ width: '100%', padding: '10px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowMoveModal(false)} style={{ padding: '10px 15px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Hủy</button>
              <button onClick={handleMoveItem} style={{ padding: '10px 15px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Di chuyển</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentLibrary;
