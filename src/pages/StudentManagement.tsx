import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';
import type { Student } from '../types/core';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';

const StudentManagement = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  
  const [showModal, setShowModal] = useState(false);
  const [newStudent, setNewStudent] = useState({ full_name: '', parent_phone: '', school: '', grade: '' });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const navigate = useNavigate();

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axiosClient.get('/api/students', { 
        params: { search, grade: gradeFilter },
        headers: { Authorization: `Bearer ${token}` } 
      });
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchStudents();
    }, 300); // debounce search
    return () => clearTimeout(delayDebounceFn);
  }, [search, gradeFilter]);

  
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;
    try {
      await axiosClient.put(`/api/students/${selectedStudentId}/reset-password`, { newPassword });
      alert('Đổi mật khẩu thành công');
      setShowPasswordModal(false);
      setNewPassword('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi đổi mật khẩu');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      // Thêm default phone để pass qua validation cũ nếu có
      await axiosClient.post('/api/students', { ...newStudent, phone: newStudent.parent_phone });
      setShowModal(false);
      setNewStudent({ full_name: '', parent_phone: '', school: '', grade: '' });
      fetchStudents();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi tạo học sinh');
    }
  };

  return (
    <div style={{ padding: 'var(--spacing-6)', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
        <div>
          <h1 style={{ margin: '0 0 var(--spacing-2) 0', fontSize: '30px', color: 'var(--color-text)' }}>👨‍🎓 Hồ sơ Học sinh 360°</h1>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Quản lý danh sách và hồ sơ toàn diện của học sinh</p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          + Thêm học sinh
        </Button>
      </div>

      <Card style={{ marginBottom: 'var(--spacing-6)', padding: 'var(--spacing-4)', display: 'flex', gap: 'var(--spacing-4)' }}>
        <div style={{ flex: 1 }}>
          <Input 
            placeholder="🔍 Tìm kiếm theo tên học sinh..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ width: '200px' }}>
          <select 
            value={gradeFilter} 
            onChange={(e) => setGradeFilter(e.target.value)}
            style={{ width: '100%', padding: '12px 15px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxSizing: 'border-box', outline: 'none', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
          >
            <option value="ALL">Tất cả các khối</option>
            <option value="10">Khối 10</option>
            <option value="11">Khối 11</option>
            <option value="12">Khối 12</option>
          </select>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-background)' }}>
                <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)' }}>ID / Mã HS</th>
                <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)' }}>Họ Tên</th>
                <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)' }}>Trường & Khối</th>
                <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)' }}>SĐT Phụ huynh</th>
                <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: 'var(--spacing-10)', textAlign: 'center' }}>Đang tải dữ liệu...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={5}><EmptyState title="Không tìm thấy học sinh nào" description="Thử thay đổi bộ lọc hoặc thêm học sinh mới." /></td></tr>
              ) : students.map(student => (
                <tr key={student.id} style={{ borderBottom: '1px solid var(--color-background)', cursor: 'pointer' }} onClick={() => navigate(`/students/${student.id}`)} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--color-background)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-bold)' }}>{student.student_code || student.id}</td>
                  <td style={{ padding: 'var(--spacing-4)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text)', fontSize: 'var(--font-size-base)' }}>{student.full_name}</td>
                  <td style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)' }}>
                    {student.school || 'Chưa cập nhật'} <br/>
                    <Badge variant={student.grade ? 'info' : 'neutral'}>Khối: {student.grade || '---'}</Badge>
                  </td>
                  <td style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)' }}>{student.parent_phone || '---'}</td>
                  <td style={{ padding: 'var(--spacing-4)', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 'var(--spacing-2)', justifyContent: 'flex-end' }}>
                      <Button 
                        variant="secondary"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setSelectedStudentId(student.id); setShowPasswordModal(true); }}
                      >
                        🔑 Đổi MK
                      </Button>
                      <Button variant="outline" size="sm">Xem Hồ Sơ</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <Card style={{ padding: 'var(--spacing-8)', width: '450px' }}>
            <h2 style={{ margin: '0 0 var(--spacing-6) 0', color: 'var(--color-text)' }}>Thêm Học Sinh Mới</h2>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: 'var(--spacing-4)' }}>
                <Input 
                  label="Họ Tên"
                  required 
                  value={newStudent.full_name} 
                  onChange={e => setNewStudent({...newStudent, full_name: e.target.value})} 
                  placeholder="VD: Nguyễn Văn A" 
                />
              </div>
              <div style={{ marginBottom: 'var(--spacing-4)' }}>
                <Input 
                  label="SĐT Phụ huynh (dùng đăng nhập)"
                  required 
                  value={newStudent.parent_phone} 
                  onChange={e => setNewStudent({...newStudent, parent_phone: e.target.value})} 
                  placeholder="VD: 0912345678" 
                />
              </div>
              <div style={{ marginBottom: 'var(--spacing-4)' }}>
                <Input 
                  label="Trường"
                  value={newStudent.school} 
                  onChange={e => setNewStudent({...newStudent, school: e.target.value})} 
                  placeholder="VD: THPT Chuyên Sư Phạm" 
                />
              </div>
              <div style={{ marginBottom: 'var(--spacing-4)' }}>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-2)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Khối</label>
                <select value={newStudent.grade} onChange={e => setNewStudent({...newStudent, grade: e.target.value})} style={{ width: '100%', padding: 'var(--spacing-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxSizing: 'border-box', outline: 'none', backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
                  <option value="">Chọn khối</option>
                  <option value="10">Khối 10</option>
                  <option value="11">Khối 11</option>
                  <option value="12">Khối 12</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-6)' }}>
                <Button variant="ghost" type="button" onClick={() => setShowModal(false)}>Hủy</Button>
                <Button variant="primary" type="submit">Thêm Học Sinh</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {showPasswordModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <Card style={{ padding: 'var(--spacing-8)', width: '400px' }}>
            <h2 style={{ margin: '0 0 var(--spacing-6) 0', color: 'var(--color-text)' }}>Đổi Mật Khẩu</h2>
            <form onSubmit={handleResetPassword}>
              <div style={{ marginBottom: 'var(--spacing-4)' }}>
                <Input 
                  label="Mật khẩu mới"
                  required 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  placeholder="Nhập mật khẩu mới" 
                  type="password"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-6)' }}>
                <Button variant="ghost" type="button" onClick={() => {setShowPasswordModal(false); setNewPassword('');}}>Hủy</Button>
                <Button variant="primary" type="submit">Lưu Mật Khẩu</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
