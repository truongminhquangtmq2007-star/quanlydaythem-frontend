import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

interface ClassData {
  id: number;
  class_name: string;
}

const ClassList = () => {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [className, setClassName] = useState('');
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const navigate = useNavigate();

  const fetchClasses = async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    try {
      const response = await axios.get('https://quanlydaythem-api.onrender.com/api/classes', { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setClasses(response.data);
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) { 
        localStorage.removeItem('token'); 
        navigate('/login'); 
      }
    }
  };

  useEffect(() => { fetchClasses(); }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      if (editingId) {
        await axios.put(`https://quanlydaythem-api.onrender.com/api/classes/${editingId}`, { class_name: className }, { headers: { Authorization: `Bearer ${token}` } });
        setMessage('✅ Cập nhật thành công!');
      } else {
        await axios.post('https://quanlydaythem-api.onrender.com/api/classes', { class_name: className }, { headers: { Authorization: `Bearer ${token}` } });
        setMessage('✅ Thêm mới thành công!');
      }
      setClassName(''); setEditingId(null); fetchClasses();
    } catch (error: any) {
      setMessage(`❌ Lỗi: ${error.response?.data?.message || 'Có lỗi xảy ra'}`);
    }
  };

  const handleEditClick = (cls: ClassData) => {
    setEditingId(cls.id); setClassName(cls.class_name);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Chắc chắn xóa? Các dữ liệu liên quan sẽ bị ảnh hưởng.')) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`https://quanlydaythem-api.onrender.com/api/classes/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchClasses();
    } catch (error) {}
  };

  return (
    <div style={{ padding: '40px', width: '100%', boxSizing: 'border-box' }}>      
      {/* HEADER PAGE */}
      <div style={{ marginBottom: '35px' }}>
        <h1 style={{ margin: 0, color: '#1e293b', fontSize: '28px', fontWeight: '800' }}>Quản Lý Lớp Học</h1>
        <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: '15px' }}>Tạo và kiểm soát danh sách các lớp học/nhóm học viên của bạn.</p>
      </div>

      {/* CARD: FORM NHẬP LIỆU */}
      <div style={{ backgroundColor: '#ffffff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '30px', border: '1px solid #f1f5f9' }}>
        <h3 style={{ marginTop: 0, color: '#334155', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {editingId ? '✏️ Chỉnh sửa thông tin lớp' : '✨ Tạo lớp học mới'}
        </h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', marginTop: '20px' }}>
          <input 
            type="text" 
            placeholder="Tên lớp học (VD: Lớp Toán 10 - Sunny)" 
            value={className} 
            onChange={(e) => setClassName(e.target.value)} 
            style={{ padding: '12px 16px', flex: 1, minWidth: '250px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', transition: '0.3s' }} 
            required
          />
          <button type="submit" style={{ padding: '12px 25px', backgroundColor: editingId ? '#3b82f6' : '#10b981', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', transition: '0.2s', boxShadow: editingId ? '0 4px 10px rgba(59,130,246,0.3)' : '0 4px 10px rgba(16,185,129,0.3)' }}>
            {editingId ? 'Lưu thay đổi' : 'Thêm vào danh sách'}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setClassName(''); }} style={{ padding: '12px 20px', backgroundColor: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}>
              Hủy
            </button>
          )}
        </form>
        {message && <p style={{ marginTop: '15px', marginBottom: 0, fontWeight: '600', fontSize: '14px', color: message.includes('❌') ? '#ef4444' : '#10b981' }}>{message}</p>}
      </div>
      
      {/* CARD: BẢNG DỮ LIỆU */}
      <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '18px 25px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ID</th>
              <th style={{ padding: '18px 25px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tên Lớp Học</th>
              <th style={{ padding: '18px 25px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((cls) => (
              <tr key={cls.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}>
                <td style={{ padding: '18px 25px', color: '#94a3b8', fontWeight: '500' }}>#{cls.id}</td>
                <td style={{ padding: '18px 25px' }}>
                  <Link to={`/classes/${cls.id}`} style={{ textDecoration: 'none', color: '#0f172a', fontWeight: '700', fontSize: '15px' }}>
                    {cls.class_name}
                  </Link>
                </td>
                <td style={{ padding: '18px 25px', textAlign: 'center' }}>
                  <Link to={`/classes/${cls.id}`} style={{ display: 'inline-block', marginRight: '10px', padding: '8px 16px', backgroundColor: '#e0f2fe', color: '#0369a1', textDecoration: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px' }}>Chi tiết</Link>
                  <button onClick={() => handleEditClick(cls)} style={{ marginRight: '10px', padding: '8px 16px', backgroundColor: '#fef3c7', color: '#b45309', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Sửa</button>
                  <button onClick={() => handleDelete(cls.id)} style={{ padding: '8px 16px', backgroundColor: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Xóa</button>
                </td>
              </tr>
            ))}
            {classes.length === 0 && (
              <tr>
                <td colSpan={3} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Chưa có lớp học nào được tạo.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default ClassList;
