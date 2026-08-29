import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';

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
      const response = await axiosClient.get(`/api/classes`);
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
        await axiosClient.put(`/api/classes/${editingId}`, { class_name: className });
        setMessage('✅ Cập nhật thành công!');
      } else {
        await axiosClient.post(`/api/classes`, { class_name: className });
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
      await axiosClient.delete(`/api/classes/${id}`);
      fetchClasses();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={{ padding: 'var(--spacing-8)', width: '100%', boxSizing: 'border-box' }}>      
      {/* HEADER PAGE */}
      <div style={{ marginBottom: 'var(--spacing-8)' }}>
        <h1 style={{ margin: 0, color: 'var(--color-text)', fontSize: '28px', fontWeight: '800' }}>Quản Lý Lớp Học</h1>
        <p style={{ margin: 'var(--spacing-2) 0 0 0', color: 'var(--color-text-secondary)', fontSize: '15px' }}>Tạo và kiểm soát danh sách các lớp học/nhóm học viên của bạn.</p>
      </div>

      {/* CARD: FORM NHẬP LIỆU */}
      <Card style={{ marginBottom: 'var(--spacing-8)' }}>
        <h3 style={{ marginTop: 0, color: 'var(--color-text)', fontSize: 'var(--font-size-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
          {editingId ? '✏️ Chỉnh sửa thông tin lớp' : '✨ Tạo lớp học mới'}
        </h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 'var(--spacing-4)', alignItems: 'center', flexWrap: 'wrap', marginTop: 'var(--spacing-5)' }}>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <Input 
              placeholder="Tên lớp học (VD: Lớp Toán 10 - Sunny)" 
              value={className} 
              onChange={(e: any) => setClassName(e.target.value)} 
              required
            />
          </div>
          <Button type="submit" variant={editingId ? 'primary' : 'primary'}>
            {editingId ? 'Lưu thay đổi' : 'Thêm vào danh sách'}
          </Button>
          {editingId && (
            <Button type="button" variant="ghost" onClick={() => { setEditingId(null); setClassName(''); }}>
              Hủy
            </Button>
          )}
        </form>
        {message && <p style={{ marginTop: 'var(--spacing-4)', marginBottom: 0, fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-sm)', color: message.includes('❌') ? 'var(--color-danger)' : 'var(--color-success)' }}>{message}</p>}
      </Card>
      
      {/* CARD: BẢNG DỮ LIỆU */}
      <Card>
        <div className="overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: 'var(--color-background)', borderBottom: '2px solid var(--color-border)' }}>
              <tr>
                <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase' }}>ID</th>
                <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase' }}>Tên Lớp Học</th>
                <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', textAlign: 'center' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((cls) => (
                <tr key={cls.id} style={{ borderBottom: '1px solid var(--color-background)' }}>
                  <td style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-medium)' }}>#{cls.id}</td>
                  <td style={{ padding: 'var(--spacing-4)' }}>
                    <Link to={`/classes/${cls.id}`} style={{ textDecoration: 'none', color: 'var(--color-text)', fontWeight: '700', fontSize: '15px' }}>
                      {cls.class_name}
                    </Link>
                  </td>
                  <td style={{ padding: 'var(--spacing-4)', textAlign: 'center' }}>
                    <Link to={`/classes/${cls.id}`} style={{ display: 'inline-block', marginRight: 'var(--spacing-2)', padding: 'var(--spacing-2) var(--spacing-4)', backgroundColor: '#e0f2fe', color: '#0369a1', textDecoration: 'none', borderRadius: 'var(--radius-md)', fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-sm)' }}>Chi tiết</Link>
                    <Button onClick={() => handleEditClick(cls)} variant="secondary" size="sm" style={{ marginRight: 'var(--spacing-2)' }}>Sửa</Button>
                    <Button onClick={() => handleDelete(cls.id)} variant="danger" size="sm">Xóa</Button>
                  </td>
                </tr>
              ))}
              {classes.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ padding: 'var(--spacing-10)' }}>
                    <EmptyState title="Chưa có lớp học nào" description="Bạn có thể tạo lớp học mới bằng form phía trên." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ClassList;
