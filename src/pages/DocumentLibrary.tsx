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

  // Move Modal states
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [itemToMove, setItemToMove] = useState<{type: 'FOLDER'|'DOC', id: number} | null>(null);
  const [targetFolderId, setTargetFolderId] = useState<number | null>(null);
  const [allFolders, setAllFolders] = useState<Folder[]>([]);
  const [folderSearch, setFolderSearch] = useState('');
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    fetchContents(currentFolderId);
  }, [currentFolderId]);

  const fetchContents = async (folderId: number | null) => {
    try {
      const res = await axiosClient.get(`/api/folders/${folderId || '0'}/contents`);
      setFolders(res.data.folders || []);
      setDocuments(res.data.documents || []);
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

  // Delete Modal state
  const [docToDelete, setDocToDelete] = useState<DocumentInfo | null>(null);
  const [deletingDoc, setDeletingDoc] = useState(false);

  const confirmDeleteDoc = async () => {
    if (!docToDelete) return;
    setDeletingDoc(true);
    try {
      await axiosClient.delete(`/api/documents/${docToDelete.id}`);
      setDocToDelete(null);
      fetchContents(currentFolderId);
      alert('Đã xóa tài liệu thành công!');
    } catch (err: any) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Lỗi khi xóa tài liệu');
    } finally {
      setDeletingDoc(false);
    }
  };

  const handleDeleteDoc = (doc: DocumentInfo) => {
    setDocToDelete(doc);
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

  const openMoveModal = async (docId: number) => {
    setItemToMove({ type: 'DOC', id: docId });
    setTargetFolderId(currentFolderId);
    setFolderSearch('');
    try {
      const res = await axiosClient.get('/api/folders/drive?category=STORAGE');
      setAllFolders(res.data.folders || []);
    } catch (err) {
      console.error('Lỗi tải danh sách thư mục:', err);
    }
    setShowMoveModal(true);
  };

  const handleMoveItem = async () => {
    if (!itemToMove) return;
    setMoving(true);
    try {
      if (itemToMove.type === 'DOC') {
        const doc = documents.find(d => d.id === itemToMove.id);
        const title = doc ? doc.title : undefined;
        await axiosClient.put(`/api/documents/${itemToMove.id}`, { title, folder_id: targetFolderId });
      }
      setShowMoveModal(false);
      fetchContents(currentFolderId);
      alert('Di chuyển tài liệu thành công!');
    } catch (err: any) {
      alert('Lỗi di chuyển: ' + (err?.response?.data?.error || err?.response?.data?.message || 'Thao tác không hợp lệ'));
    } finally {
      setMoving(false);
    }
  };

  // Helper to build folder tree hierarchy
  const buildFolderTree = (parentId: number | null = null, depth: number = 0): { folder: Folder; depth: number }[] => {
    const directChildren = allFolders.filter(f => f.parent_id === parentId);
    let result: { folder: Folder; depth: number }[] = [];
    for (const child of directChildren) {
      result.push({ folder: child, depth });
      result = result.concat(buildFolderTree(child.id, depth + 1));
    }
    return result;
  };

  const folderTree = buildFolderTree(null, 0);
  const filteredFolderTree = folderSearch.trim() 
    ? allFolders.filter(f => f.name.toLowerCase().includes(folderSearch.toLowerCase())).map(f => ({ folder: f, depth: 0 }))
    : folderTree;

  const selectedTargetName = targetFolderId === null 
    ? '🏠 Thư mục gốc (Trang chủ)' 
    : (allFolders.find(f => f.id === targetFolderId)?.name || 'Thư mục đã chọn');

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
              <Button variant="secondary" size="sm" onClick={() => openMoveModal(d.id)}>Di chuyển</Button>
              <Button variant="danger" size="sm" onClick={() => handleDeleteDoc(d)}>Xóa</Button>
            </div>
          </Card>
        ))}
      </div>

      {folders.length === 0 && documents.length === 0 && (
        <div style={{ marginTop: 'var(--spacing-10)' }}>
          <EmptyState title="Thư mục trống" description="Chưa có thư mục hoặc tài liệu nào ở đây." />
        </div>
      )}

      {/* Modal Tạo Thư Mục */}
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

      {/* Modal Thêm Tài Liệu */}
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

      {/* Modal Di Chuyển Tài Liệu Trực Quan (Folder Picker) */}
      {showMoveModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <Card style={{ padding: 'var(--spacing-6)', width: '480px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 var(--spacing-3) 0', color: 'var(--color-text)' }}>📁 Chọn Thư Mục Đích</h3>
            <p style={{ margin: '0 0 var(--spacing-4) 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              Chọn thư mục bạn muốn chuyển tài liệu vào:
            </p>

            <div style={{ marginBottom: 'var(--spacing-3)' }}>
              <Input 
                placeholder="🔎 Tìm thư mục theo tên..." 
                value={folderSearch} 
                onChange={e => setFolderSearch(e.target.value)} 
              />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-3)', marginBottom: 'var(--spacing-4)', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', backgroundColor: 'var(--color-background)' }}>
              {/* Root option */}
              <div 
                onClick={() => setTargetFolderId(null)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  border: targetFolderId === null ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  backgroundColor: targetFolderId === null ? '#eff6ff' : 'var(--color-surface)',
                  fontWeight: targetFolderId === null ? 'bold' : 'normal',
                  color: 'var(--color-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>🏠 Thư mục gốc (Trang chủ)</span>
                {targetFolderId === null && <span style={{ color: 'var(--color-primary)' }}>✓ Đã chọn</span>}
              </div>

              {/* Folder list / tree */}
              {filteredFolderTree.map(({ folder, depth }) => {
                const isSelected = targetFolderId === folder.id;
                return (
                  <div 
                    key={`target-${folder.id}`}
                    onClick={() => setTargetFolderId(folder.id)}
                    style={{
                      padding: '10px 14px',
                      paddingLeft: `${14 + depth * 20}px`,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      backgroundColor: isSelected ? '#eff6ff' : 'var(--color-surface)',
                      fontWeight: isSelected ? 'bold' : 'normal',
                      color: 'var(--color-text)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{depth > 0 ? '└── ' : ''}📁 {folder.name}</span>
                    {isSelected && <span style={{ color: 'var(--color-primary)' }}>✓ Đã chọn</span>}
                  </div>
                );
              })}

              {filteredFolderTree.length === 0 && folderSearch.trim() && (
                <div style={{ textAlign: 'center', padding: '16px', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                  Không tìm thấy thư mục nào phù hợp với từ khóa.
                </div>
              )}
            </div>

            <div style={{ marginBottom: 'var(--spacing-4)', padding: '8px 12px', backgroundColor: 'var(--color-primary-soft)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)', fontWeight: 'var(--font-weight-medium)' }}>
              Đích đến: <strong>{selectedTargetName}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-2)' }}>
              <Button variant="ghost" onClick={() => setShowMoveModal(false)} disabled={moving}>Hủy</Button>
              <Button variant="primary" onClick={handleMoveItem} disabled={moving}>
                {moving ? 'Đang di chuyển...' : 'Di chuyển ngay'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Xác Nhận Xóa Tài Liệu */}
      {docToDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <Card style={{ padding: 'var(--spacing-6)', width: '450px' }}>
            <h3 style={{ margin: '0 0 12px 0', color: 'var(--color-danger)' }}>🗑️ Xác Nhận Xóa Tài Liệu</h3>
            <p style={{ margin: '0 0 16px 0', color: 'var(--color-text)', fontSize: '15px' }}>
              Bạn có chắc chắn muốn xóa tài liệu: <strong style={{ color: 'var(--color-primary)' }}>{docToDelete.title}</strong>?
            </p>
            <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '13px', color: '#991b1b', marginBottom: '20px' }}>
              ⚠️ Thao tác này sẽ xóa tài liệu khỏi kho và dọn dẹp các liên kết bài tập đã gán vào lớp.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)' }}>
              <Button variant="ghost" onClick={() => setDocToDelete(null)} disabled={deletingDoc}>Hủy</Button>
              <Button variant="danger" onClick={confirmDeleteDoc} disabled={deletingDoc}>
                {deletingDoc ? 'Đang xóa...' : 'Xác nhận xóa'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DocumentLibrary;
