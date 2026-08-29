import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';

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
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

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
      alert('Lỗi thêm tài liệu: ' + (err?.response?.data?.message || err.message));
    } finally {
      setUploadingDoc(false);
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
    <div style={{ padding: 'var(--spacing-8)', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-5)' }}>
        <h2>📚 Kho Tài Liệu</h2>
        <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
          <Button variant="outline" onClick={() => setShowFolderModal(true)}>
            + Tạo thư mục
          </Button>
          <Button variant="primary" onClick={() => setShowDocModal(true)}>
            + Thêm tài liệu
          </Button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-5)', fontSize: 'var(--font-size-base)', color: 'var(--color-primary)', cursor: 'pointer' }}>
        {breadcrumbs.map((b, idx) => (
          <React.Fragment key={idx}>
            <span onClick={() => navigateTo(b.id, b.name)} style={{ fontWeight: idx === breadcrumbs.length - 1 ? 'var(--font-weight-bold)' : 'var(--font-weight-medium)', textDecoration: 'underline' }}>
              {b.name}
            </span>
            {idx < breadcrumbs.length - 1 && <span style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}> / </span>}
          </React.Fragment>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--spacing-5)' }}>
        {folders.map(f => (
          <Card key={`f-${f.id}`} style={{ padding: 'var(--spacing-5)', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
            <div onClick={() => navigateTo(f.id, f.name)} style={{ fontSize: '40px', marginBottom: 'var(--spacing-2)' }}>📁</div>
            <div onClick={() => navigateTo(f.id, f.name)} style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text)', textAlign: 'center', marginBottom: 'var(--spacing-2)', wordBreak: 'break-all' }}>{f.name}</div>
            <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteFolder(f.id); }}>Xóa</Button>
          </Card>
        ))}

        {documents.map(d => (
          <Card key={`d-${d.id}`} style={{ padding: 'var(--spacing-5)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: 'var(--spacing-2)' }}>📄</div>
            <div style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text)', textAlign: 'center', marginBottom: 'var(--spacing-4)', wordBreak: 'break-all' }}>{d.title}</div>
            <div style={{ display: 'flex', gap: 'var(--spacing-1)', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Button variant="primary" size="sm" onClick={() => window.open(d.file_url, '_blank')}>Mở</Button>
              <Button variant="secondary" size="sm" onClick={() => { setItemToMove({type: 'DOC', id: d.id}); setShowMoveModal(true); }}>Di chuyển</Button>
              <Button variant="danger" size="sm" onClick={() => handleDeleteDoc(d.id)}>Xóa</Button>
            </div>
          </Card>
        ))}
      </div>

      {folders.length === 0 && documents.length === 0 && (
        <div style={{ marginTop: 'var(--spacing-10)' }}>
          <EmptyState title="Thư mục trống" description="Chưa có thư mục hoặc tài liệu nào ở đây." />
        </div>
      )}

      {showFolderModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <Card style={{ padding: 'var(--spacing-8)', width: '400px' }}>
            <h3 style={{ margin: '0 0 var(--spacing-5) 0' }}>Tạo thư mục mới</h3>
            <Input value={folderName} onChange={e => setFolderName(e.target.value)} placeholder="Tên thư mục..." />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-5)' }}>
              <Button variant="ghost" onClick={() => setShowFolderModal(false)}>Hủy</Button>
              <Button variant="primary" onClick={handleCreateFolder}>Tạo</Button>
            </div>
          </Card>
        </div>
      )}

      {showDocModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <Card style={{ padding: 'var(--spacing-8)', width: '400px' }}>
              <h3 style={{ margin: '0 0 var(--spacing-5) 0' }}>Thêm tài liệu</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                <Input label="Tên tài liệu" value={docForm.title} onChange={e => setDocForm({...docForm, title: e.target.value})} placeholder="Tên tài liệu..." />
                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--spacing-1)', fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)' }}>Tải file lên (PDF, Word...):</label>
                  <input type="file" onChange={e => setDocFile(e.target.files?.[0] || null)} style={{ width: '100%', padding: 'var(--spacing-2)', backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-border)' }} />
                </div>
                <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Hoặc nhập URL trực tiếp:</div>
                <Input label="URL tài liệu" value={docForm.file_url} onChange={e => setDocForm({...docForm, file_url: e.target.value})} placeholder="URL tài liệu (VD: https://...)" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-5)' }}>
                <Button variant="ghost" onClick={() => setShowDocModal(false)} disabled={uploadingDoc}>Hủy</Button>
                <Button variant="primary" onClick={handleAddDoc} isLoading={uploadingDoc} disabled={uploadingDoc}>
                  Lưu
                </Button>
              </div>
            </Card>
        </div>
      )}

      {showMoveModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <Card style={{ padding: 'var(--spacing-8)', width: '400px' }}>
            <h3 style={{ margin: '0 0 var(--spacing-5) 0' }}>Di chuyển tới...</h3>
            <Input type="number" label="ID thư mục đích (0 để đưa ra ngoài Trang chủ)" onChange={e => setTargetFolderId(e.target.value ? Number(e.target.value) : null)} placeholder="Folder ID..." />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-5)' }}>
              <Button variant="ghost" onClick={() => setShowMoveModal(false)}>Hủy</Button>
              <Button variant="secondary" onClick={handleMoveItem}>Di chuyển</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DocumentLibrary;
