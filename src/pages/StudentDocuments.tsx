import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface Folder { id: number; name: string; parent_id: number | null; }
interface Document { id: number; title: string; file_url: string; }
interface Breadcrumb { id: number | null; name: string; }

const StudentDocuments = () => {
  const classId = localStorage.getItem('classId') || '1'; 

  const [folders, setFolders] = useState<Folder[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentParentId, setCurrentParentId] = useState<number | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([{ id: null, name: 'Thư mục gốc' }]);

  const fetchDriveContents = useCallback(async (parentId: number | null) => {
    const token = localStorage.getItem('token');
    try {
      // Đã sửa lỗi cú pháp ở dòng này (dùng phép cộng chuỗi thay vì nhúng template phức tạp)
      const url = `https://quanlydaythem-api.onrender.com/api/auth/student/login/api/folders/drive?category=STORAGE&class_id=${classId}` + (parentId ? `&parent_id=${parentId}` : '');
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setFolders(res.data.folders || []);
      setDocuments(res.data.documents || []);
    } catch (error) { console.error("Lỗi tải dữ liệu", error); }
  }, [classId]);

  useEffect(() => {
    fetchDriveContents(currentParentId);
  }, [currentParentId, fetchDriveContents]);

  const handleDoubleClickFolder = (folderId: number, folderName: string) => {
    setCurrentParentId(folderId);
    setBreadcrumbs([...breadcrumbs, { id: folderId, name: folderName }]);
  };

  const handleClickBreadcrumb = (id: number | null, index: number) => {
    setCurrentParentId(id);
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
  };

  return (
    <div style={{ backgroundColor: '#f1f5f9', minHeight: '100vh', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      
      {/* BANNER HEADER CHUẨN MỰC */}
      <div style={{ background: '#1e40af', padding: '40px 40px 100px 40px', color: 'white' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Tài liệu & Giáo trình
        </h1>
        <p style={{ margin: 0, fontSize: '15px', color: '#bfdbfe' }}>
          Truy cập bài giảng và bài tập được giáo viên tải lên.
        </p>
      </div>

      {/* KHUNG NỘI DUNG CHÍNH (ĐÈ LÊN BANNER) */}
      <div style={{ margin: '-60px 40px 40px 40px', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', padding: '30px' }}>
        
        {/* THANH ĐIỀU HƯỚNG BREADCRUMB */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f8fafc', padding: '14px 20px', borderRadius: '10px', fontSize: '14px', marginBottom: '30px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '16px', marginRight: '4px' }}>🏠</span>
          {breadcrumbs.map((crumb, index) => (
            <span key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span 
                onClick={() => handleClickBreadcrumb(crumb.id, index)}
                style={{ 
                  cursor: 'pointer', 
                  color: index === breadcrumbs.length - 1 ? '#0f172a' : '#3b82f6', 
                  fontWeight: index === breadcrumbs.length - 1 ? '700' : '500',
                  transition: 'color 0.2s' 
                }}
              >
                {crumb.name}
              </span>
              {index < breadcrumbs.length - 1 && <span style={{ color: '#cbd5e1', fontWeight: 'bold' }}>/</span>}
            </span>
          ))}
        </div>

        {/* LƯỚI TÀI LIỆU (GRID LAYOUT) - SẮP XẾP RẤT GỌN GÀNG */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '25px' }}>
          
          {folders.length === 0 && documents.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>📂</div>
              <div>Thư mục này hiện đang trống.</div>
            </div>
          )}

          {/* RENDER FOLDERS */}
          {folders.map(folder => (
            <div 
              key={`folder-${folder.id}`} 
              onDoubleClick={() => handleDoubleClickFolder(folder.id, folder.name)}
              style={{ 
                backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', 
                padding: '25px 15px', display: 'flex', flexDirection: 'column', alignItems: 'center', 
                cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' 
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 15px rgba(0,0,0,0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
            >
              <span style={{ fontSize: '55px', marginBottom: '15px' }}>📁</span>
              <span style={{ textAlign: 'center', wordBreak: 'break-word', fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
                {folder.name}
              </span>
            </div>
          ))}

          {/* RENDER DOCUMENTS */}
          {documents.map(doc => (
            <div 
              key={`doc-${doc.id}`} 
              style={{ 
                backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', 
                padding: '25px 15px 20px 15px', display: 'flex', flexDirection: 'column', alignItems: 'center', 
                boxShadow: '0 4px 10px rgba(0,0,0,0.03)', transition: 'transform 0.2s ease' 
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.03)'; }}
            >
              <span style={{ fontSize: '50px', marginBottom: '15px' }}>
                {doc.file_url.includes('.pdf') ? '📕' : doc.file_url.includes('.doc') ? '📘' : doc.file_url.includes('.xls') ? '📗' : '📄'}
              </span>
              <span style={{ 
                textAlign: 'center', wordBreak: 'break-word', fontSize: '14px', fontWeight: '600', 
                color: '#334155', marginBottom: '20px', lineHeight: '1.4', flex: 1
              }}>
                {doc.title}
              </span>
              
              <a 
                href={doc.file_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ 
                  width: '100%', display: 'block', textAlign: 'center', padding: '10px 0', 
                  backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '10px', 
                  fontSize: '14px', textDecoration: 'none', fontWeight: 'bold', transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#3b82f6'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff'; e.currentTarget.style.color = '#2563eb'; }}
              >
                Tải về ⬇
              </a>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
};

export default StudentDocuments;