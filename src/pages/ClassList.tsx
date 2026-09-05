import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { TableContainer, Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import { toast } from 'react-toastify';

interface ClassData {
  id: number;
  class_name: string;
}

const ClassList = () => {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [className, setClassName] = useState('');
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
    try {
      if (editingId) {
        await axiosClient.put(`/api/classes/${editingId}`, { class_name: className });
        toast.success('Cập nhật thông tin lớp học thành công!');
      } else {
        await axiosClient.post(`/api/classes`, { class_name: className });
        toast.success('Thêm lớp học mới thành công!');
      }
      setClassName(''); 
      setEditingId(null); 
      fetchClasses();
    } catch (error: any) {
      toast.error(`Lỗi: ${error.response?.data?.message || 'Có lỗi xảy ra'}`);
    }
  };

  const handleEditClick = (cls: ClassData) => {
    setEditingId(cls.id); 
    setClassName(cls.class_name);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number, name?: string) => {
    if (!window.confirm(`⚠️ BẠN CÓ CHẮC CHẮN MUỐN XÓA LỚP HỌC "${name || `#${id}`}"?\n\nLớp học sẽ bị gỡ khỏi danh sách quản lý. Dữ liệu lịch sử điểm danh và học phí sẽ được bảo lưu an toàn.`)) return;
    try {
      await axiosClient.delete(`/api/classes/${id}`);
      toast.success('Đã xóa lớp học thành công!');
      fetchClasses();
    } catch (error: any) {
      toast.error(`Lỗi: ${error.response?.data?.message || 'Không thể xóa lớp học này'}`);
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
      </Card>
      
      {/* CARD: BẢNG DỮ LIỆU */}
      <Card>
        <TableContainer>
          <Table>
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Tên Lớp Học</Th>
                <Th style={{ textAlign: 'center' }}>Hành động</Th>
              </Tr>
            </Thead>
            <Tbody>
              {classes.map((cls) => (
                <Tr key={cls.id}>
                  <Td style={{ color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-medium)' }}>#{cls.id}</Td>
                  <Td>
                    <Link to={`/classes/${cls.id}`} style={{ textDecoration: 'none', color: 'var(--color-text)', fontWeight: '700', fontSize: '15px' }}>
                      {cls.class_name}
                    </Link>
                  </Td>
                  <Td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                      <Link to={`/classes/${cls.id}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '6px 14px', backgroundColor: 'var(--color-primary-light, #e0f2fe)', color: 'var(--color-primary, #0369a1)', textDecoration: 'none', borderRadius: 'var(--radius-md)', fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-sm)', minHeight: '36px' }}>Chi tiết</Link>
                      <Button onClick={() => handleEditClick(cls)} variant="secondary" size="sm" style={{ minHeight: '36px' }}>Sửa</Button>
                      <Button onClick={() => handleDelete(cls.id, cls.class_name)} variant="danger" size="sm" style={{ minHeight: '36px' }}>Xóa</Button>
                    </div>
                  </Td>
                </Tr>
              ))}
              {classes.length === 0 && (
                <Tr>
                  <Td colSpan={3} style={{ padding: 'var(--spacing-10)' }}>
                    <EmptyState title="Chưa có lớp học nào" description="Bạn có thể tạo lớp học mới bằng form phía trên." />
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};

export default ClassList;
