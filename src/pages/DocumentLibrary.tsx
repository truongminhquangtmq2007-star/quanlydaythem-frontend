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

  // Delete Modal state
  const [docToDelete, setDocToDelete] = useState<DocumentInfo | null>(null);
  const [deletingDoc, setDeletingDoc] = useState(false);

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

  const confirmDeleteDoc = async () => {
    if (!docToDelete) return;
    setDeletingDoc(true);
    try {
      await axiosClient.delete(`/api/documents/${docToDelete.id}`);
      setDocToDelete(null);
      fetchContents(currentFolderId);
    } catch (err) {
      alert('Lỗi xóa tài liệu');
    } finally {
      setDeletingDoc(false);
    }
  };

  const handleDeleteDoc = (doc: DocumentInfo) => {
    setDocToDelete(doc);
  };

  const handleDeleteFolder = async (folderId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thư mục này và các thư mục/tài liệu bên trong?')) return;
    try {
      await axiosClient.delete(`/api/folders/${folderId}`);
      fetchContents(currentFolderId);
    } catch (err) {
      alert('Lỗi xóa thư mục');
    }
  };

  const openMoveModal = async (docId: number) => {
    setItemToMove({ type: 'DOC', id: docId });
    setTargetFolderId(currentFolderId);
    setFolderSearch('');
    setShowMoveModal(true);
    
    try {
      const res = await axiosClient.get('/api/folders');
      setAllFolders(res.data || []);
    } catch (err) {
      console.error('Lỗi tải danh sách thư mục:', err);
    }
  };

  const handleConfirmMove = async () => {
    if (!itemToMove) return;
    setMoving(true);
    try {
      if (itemToMove.type === 'DOC') {
        await axiosClient.put(`/api/documents/${itemToMove.id}/move`, { folder_id: targetFolderId });
      }
      setShowMoveModal(false);
      setItemToMove(null);
      fetchContents(currentFolderId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi di chuyển tài liệu');
    } finally {
      setMoving(false);
    }
  };

  const buildFolderTree = (parentId: number | null = null, depth = 0): { folder: Folder; depth: number }[] => {
    const children = allFolders.filter(f => f.parent_id === parentId);
    let result: { folder: Folder; depth: number }[] = [];
    for (const child of children) {
      result.push({ folder: child, depth });
      result = result.concat(buildFolderTree(child.id, depth + 1));
    }
    return result;
  };

  const folderTree = buildFolderTree(null, 0);
  const filteredFolderTree = folderSearch.trim()
    ? folderTree.filter(item => item.folder.name.toLowerCase().includes(folderSearch.toLowerCase()))
    : folderTree;

  return (
    <div style={{ padding: 'var(--spacing-4)', maxWidth: '100%', boxSizing: 'border-box' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-5)', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '24px', color: 'var(--color-text)' }}>📚 Kho Tài Liệu</h1>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '14px' }}>Lưu trữ bài giảng, đề thi và tài liệu học tập của bạn</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button variant="outline" onClick={() => setShowFolderModal(true)} style={{ minHeight: '44px' }}>
            + Tạo thư mục
          </Button>
          <Button variant="primary" onClick={() => setShowDocModal(true)} style={{ minHeight: '44px' }}>
            + Thêm tài liệu
          </Button>
        </div>
      </div>

      {/* BREADCRUMBS WITH HORIZONTAL SCROLL ON MOBILE */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--spacing-5)', fontSize: '14px', color: 'var(--color-primary)', overflowX: 'auto', paddingBottom: '4px', whiteSpace: 'nowrap', WebkitOverflowScrolling: 'touch' }}>
        {breadcrumbs.map((b, idx) => (
          <React.Fragment key={idx}>
            <span onClick={() => navigateTo(b.id, b.name)} style={{ fontWeight: idx === breadcrumbs.length - 1 ? 'bold' : 'normal', textDecoration: 'underline', cursor: 'pointer' }}>
              {b.name}
            </span>
            {idx < breadcrumbs.length - 1 && <span style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}> / </span>}
          </React.Fragment>
        ))}
      </div>

      {/* GRID ITEMS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
        {folders.map(f => (
          <Card key={`f-${f.id}`} style={{ padding: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', textAlign: 'center' }}>
            <div onClick={() => navigateTo(f.id, f.name)} style={{ fontSize: '36px', marginBottom: '6px' }}>📁</div>
            <div onClick={() => navigateTo(f.id, f.name)} style={{ fontWeight: 'bold', color: 'var(--color-text)', marginBottom: '8px', wordBreak: 'break-word', fontSize: '14px' }}>
              {f.name}
            </div>
            <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteFolder(f.id); }} style={{ minHeight: '36px', width: '100%' }}>
              Xóa
            </Button>
          </Card>
        ))}

        {documents.map(d => (
          <Card key={`d-${d.id}`} style={{ padding: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '6px' }}>📄</div>
            <div style={{ fontWeight: 'bold', color: 'var(--color-text)', marginBottom: '10px', wordBreak: 'break-word', fontSize: '13.5px', lineHeight: '1.3' }}>
              {d.title}
            </div>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', width: '100%', justifyContent: 'center' }}>
              <Button variant="primary" size="sm" onClick={() => window.open(d.file_url, '_blank')} style={{ flex: 1, minHeight: '36px' }}>Mở</Button>
              <Button variant="secondary" size="sm" onClick={() => openMoveModal(d.id)} style={{ flex: 1, minHeight: '36px' }}>Chuyển</Button>
              <Button variant="danger" size="sm" onClick={() => handleDeleteDoc(d)} style={{ minHeight: '36px' }}>✕</Button>
            </div>
          </Card>
        ))}
      </div>

      {folders.length === 0 && documents.length === 0 && (
        <div style={{ marginTop: 'var(--spacing-8)' }}>
          <EmptyState title="Thư mục trống" description="Chưa có thư mục hoặc tài liệu nào ở đây." />
        </div>
      )}

      {/* Modal Tạo Thư Mục */}
      {showFolderModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' }}>
          <Card style={{ padding: '20px', width: '100%', maxWidth: '400px' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '18px' }}>Tạo thư mục mới</h3>
            <Input value={folderName} onChange={e => setFolderName(e.target.value)} placeholder="Tên thư mục..." />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <Button variant="ghost" onClick={() => setShowFolderModal(false)} style={{ minHeight: '44px' }}>Hủy</Button>
              <Button variant="primary" onClick={handleCreateFolder} style={{ minHeight: '44px' }}>Tạo</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Thêm Tài Liệu */}
      {showDocModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' }}>
          <Card style={{ padding: '20px', width: '100%', maxWidth: '440px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '18px' }}>Thêm tài liệu mới</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Input label="Tên tài liệu" value={docForm.title} onChange={e => setDocForm({...docForm, title: e.target.value})} placeholder="Tên tài liệu..." />
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: 'var(--color-text)' }}>Tải file lên (PDF, Word...):</label>
                <input type="file" onChange={e => setDocFile(e.target.files?.[0] || null)} style={{ width: '100%', padding: '10px', backgroundColor: 'var(--color-background)', borderRadius: '6px', border: '1px dashed var(--color-border)', boxSizing: 'border-box' }} />
              </div>
              <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '13px' }}>Hoặc nhập URL trực tiếp:</div>
              <Input label="URL tài liệu" value={docForm.file_url} onChange={e => setDocForm({...docForm, file_url: e.target.value})} placeholder="URL tài liệu (VD: https://...)" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <Button variant="ghost" onClick={() => setShowDocModal(false)} disabled={uploadingDoc} style={{ minHeight: '44px' }}>Hủy</Button>
              <Button variant="primary" onClick={handleAddDoc} isLoading={uploadingDoc} disabled={uploadingDoc} style={{ minHeight: '44px' }}>
                Lưu tài liệu
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Di Chuyển Tài Liệu (Folder Picker) */}
      {showMoveModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px', backdropFilter: 'blur(4px)' }}>
          <Card style={{ padding: '20px', width: '100%', maxWidth: '460px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: 'var(--color-text)' }}>📁 Chọn Thư Mục Đích</h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Chọn thư mục bạn muốn chuyển tài liệu vào:
            </p>

            <div style={{ marginBottom: '10px' }}>
              <Input 
                placeholder="🔎 Tìm thư mục theo tên..." 
                value={folderSearch} 
                onChange={e => setFolderSearch(e.target.value)} 
              />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '10px', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '260px', backgroundColor: 'var(--color-background)' }}>
              <div 
                onClick={() => setTargetFolderId(null)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
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

              {filteredFolderTree.map(({ folder, depth }) => {
                const isSelected = targetFolderId === folder.id;
                return (
                  <div 
                    key={`target-${folder.id}`}
                    onClick={() => setTargetFolderId(folder.id)}
                    style={{
                      padding: '10px 12px',
                      paddingLeft: `${12 + depth * 16}px`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      backgroundColor: isSelected ? '#eff6ff' : 'var(--color-surface)',
                      fontWeight: isSelected ? 'bold' : 'normal',
                      color: 'var(--color-text)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>{depth > 0 ? '└── ' : ''}📁 {folder.name}</span>
                    {isSelected && <span style={{ color: 'var(--color-primary)' }}>✓ Đã chọn</span>}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="ghost" onClick={() => setShowMoveModal(false)} disabled={moving} style={{ minHeight: '44px' }}>Hủy</Button>
              <Button variant="primary" onClick={handleConfirmMove} isLoading={moving} disabled={moving} style={{ minHeight: '44px' }}>
                Xác nhận chuyển
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Xác Nhận Xóa Tài Liệu */}
      {docToDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' }}>
          <Card style={{ padding: '20px', width: '100%', maxWidth: '400px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: 'var(--color-danger)' }}>Xóa Tài Liệu?</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--color-text)' }}>
              Bạn có chắc chắn muốn xóa tài liệu <strong>"{docToDelete.title}"</strong> không?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="ghost" onClick={() => setDocToDelete(null)} disabled={deletingDoc} style={{ minHeight: '44px' }}>Hủy</Button>
              <Button variant="danger" onClick={confirmDeleteDoc} isLoading={deletingDoc} disabled={deletingDoc} style={{ minHeight: '44px' }}>
                Xóa vĩnh viễn
              </Button>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
};

export default DocumentLibrary;
