import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StudentDocuments = () => {
  const [docs, setDocs] = useState<any[]>([]);

  useEffect(() => {
    const fetchDocs = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await axios.get('/api/student/documents', { headers: { Authorization: `Bearer ${token}` } });
        setDocs(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDocs();
  }, []);

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ color: '#0f172a', marginBottom: '20px' }}>📚 Bài Tập & Tài Liệu</h1>
      <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
        {docs.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8' }}>Chưa có tài liệu nào.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '15px', color: '#64748b' }}>Tiêu đề / Loại</th>
                <th style={{ padding: '15px', color: '#64748b' }}>Lớp</th>
                <th style={{ padding: '15px', color: '#64748b' }}>Hạn chót</th>
                <th style={{ padding: '15px', color: '#64748b', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {docs.map(d => (
                <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '15px' }}>
                    <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{d.title}</div>
                    <div style={{ fontSize: '12px', color: '#3b82f6', backgroundColor: '#eff6ff', padding: '2px 8px', borderRadius: '10px', display: 'inline-block', marginTop: '5px' }}>{d.type}</div>
                  </td>
                  <td style={{ padding: '15px', color: '#475569' }}>{d.class_name}</td>
                  <td style={{ padding: '15px' }}>
                    {d.due_at ? (
                      <span style={{ color: new Date(d.due_at) < new Date() ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                        {new Date(d.due_at).toLocaleDateString('vi-VN')} {new Date(d.due_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '15px', textAlign: 'right' }}>
                    <a href={d.file_url} target="_blank" rel="noreferrer" style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
                      Xem / Làm Bài
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StudentDocuments;
