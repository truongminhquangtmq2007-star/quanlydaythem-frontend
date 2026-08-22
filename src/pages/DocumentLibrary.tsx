import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import type { DocumentInfo } from '../types/core';

const DocumentLibrary = () => {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  
  const [showModal, setShowModal] = useState(false);
  const [newDoc, setNewDoc] = useState({ title: '', description: '', type: 'REFERENCE', grade: '', subject: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axiosClient.get('/api/documents', { 
        params: { search, type: typeFilter, grade: gradeFilter },
        headers: { Authorization: `Bearer ${token}` } 
      });
      setDocuments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => fetchDocuments(), 300);
    return () => clearTimeout(delay);
  }, [search, typeFilter, gradeFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Vui lòng chọn file!');
      return;
    }
    try {
      setIsUploading(true);
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', newDoc.title);
      formData.append('description', newDoc.description);
      formData.append('type', newDoc.type);
      formData.append('grade', newDoc.grade);
      formData.append('subject', newDoc.subject);

      await axiosClient.post('/api/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setShowModal(false);
      setNewDoc({ title: '', description: '', type: 'REFERENCE', grade: '', subject: '' });
      setSelectedFile(null);
      fetchDocuments();
    } catch (err) {
      alert('Lỗi thêm tài liệu');
    } finally {
      setIsUploading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'LECTURE': return '📖';
      case 'EXERCISE': return '✍️';
      case 'EXAM': return '📝';
      default: return '📄';
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '30px', color: '#0f172a' }}>📚 Thư Viện Học Liệu</h1>
          <p style={{ margin: 0, color: '#64748b' }}>Quản lý Bài giảng, Bài tập, Đề thi và Tài liệu tham khảo</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          style={{ padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)' }}
        >
          + Tải lên tài liệu
        </button>
      </div>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', backgroundColor: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <input 
          type="text" 
          placeholder="🔍 Tìm kiếm tài liệu..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: '12px 15px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none' }}
        />
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {['ALL', 'LECTURE', 'EXAM'].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: typeFilter === type ? '#3b82f6' : '#f1f5f9',
                color: typeFilter === type ? 'white' : '#475569',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: '0.2s'
              }}
            >
              {type === 'ALL' ? 'Tất cả' : type === 'LECTURE' ? 'Bài giảng' : 'Đề thi'}
            </button>
          ))}
        </div>
        <select 
          value={gradeFilter} 
          onChange={(e) => setGradeFilter(e.target.value)}
          style={{ width: '150px', padding: '12px 15px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: 'white' }}
        >
          <option value="ALL">Tất cả khối</option>
          <option value="10">Khối 10</option>
          <option value="11">Khối 11</option>
          <option value="12">Khối 12</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Đang tải thư viện...</div>
      ) : documents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '16px', color: '#64748b' }}>Không tìm thấy tài liệu phù hợp.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' }}>
          {documents.map(doc => (
            <div key={doc.id} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ fontSize: '40px', marginBottom: '15px' }}>{getIcon(doc.type)}</div>
              <h3 style={{ margin: '0 0 10px 0', color: '#0f172a', fontSize: '18px', lineHeight: '1.4' }}>{doc.title}</h3>
              <p style={{ margin: '0 0 15px 0', color: '#64748b', fontSize: '14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{doc.description || 'Không có mô tả'}</p>
              
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <span style={{ padding: '4px 10px', backgroundColor: '#eff6ff', color: '#3b82f6', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>{doc.subject || 'Chung'}</span>
                {doc.grade && <span style={{ padding: '4px 10px', backgroundColor: '#fef3c7', color: '#d97706', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>Khối {doc.grade}</span>}
              </div>
              
              <a href={doc.file_url} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', padding: '10px', backgroundColor: '#f8fafc', color: '#334155', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', border: '1px solid #e2e8f0', transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#e2e8f0'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#f8fafc'}>
                🔗 Mở Tài liệu
              </a>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'white', padding: '35px', borderRadius: '20px', width: '500px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <h2 style={{ margin: '0 0 25px 0', color: '#0f172a' }}>Tải Lên Tài Liệu</h2>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Tiêu đề</label>
                <input required value={newDoc.title} onChange={e => setNewDoc({...newDoc, title: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none' }} placeholder="VD: Đề thi thử Hóa học" />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>File Tài Liệu</label>
                <input type="file" accept=".pdf,.doc,.docx,.jpg,.png" required onChange={e => setSelectedFile(e.target.files?.[0] || null)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#f8fafc' }} />
              </div>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Loại</label>
                  <select value={newDoc.type} onChange={e => setNewDoc({...newDoc, type: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none' }}>
                    <option value="REFERENCE">Tham khảo</option>
                    <option value="LECTURE">Bài giảng</option>
                    <option value="EXERCISE">Bài tập</option>
                    <option value="EXAM">Đề thi</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Khối</label>
                  <select value={newDoc.grade} onChange={e => setNewDoc({...newDoc, grade: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none' }}>
                    <option value="">Chung</option>
                    <option value="10">Khối 10</option>
                    <option value="11">Khối 11</option>
                    <option value="12">Khối 12</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Môn học (Tùy chọn)</label>
                <input value={newDoc.subject} onChange={e => setNewDoc({...newDoc, subject: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none' }} placeholder="VD: Hóa học" />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 'bold', cursor: 'pointer' }}>Hủy</button>
                <button type="submit" disabled={isUploading} style={{ padding: '12px 24px', borderRadius: '10px', border: 'none', backgroundColor: isUploading ? '#94a3b8' : '#3b82f6', color: 'white', fontWeight: 'bold', cursor: isUploading ? 'not-allowed' : 'pointer' }}>
                  {isUploading ? 'Đang tải file lên...' : 'Lưu Tài Liệu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentLibrary;

