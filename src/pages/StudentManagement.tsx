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
  const [newStudent, setNewStudent] = useState({ full_name: '', phone_number: '', school_name: '' });
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
      setStudents(res.data || []);
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
      const createRes = await axiosClient.post('/api/students', { ...newStudent });
      setShowModal(false);
      setNewStudent({ full_name: '', phone_number: '', school_name: '' });
      if (createRes.data && createRes.data.student) {
        setStudents(prev => [createRes.data.student, ...(Array.isArray(prev) ? prev : [])]);
      }
      alert('Thêm học sinh mới thành công!');
      fetchStudents();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi tạo học sinh');
    }
  };

  return (
    <div style={{ padding: 'var(--spacing-4)', maxWidth: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '24px', color: 'var(--color-text)' }}>👨‍🎓 Hồ sơ Học sinh 360°</h1>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '14px' }}>Quản lý danh sách và hồ sơ học tập toàn diện</p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)} style={{ minHeight: '44px' }}>
          + Thêm học sinh
        </Button>
      </div>

      <Card style={{ marginBottom: 'var(--spacing-4)', padding: 'var(--spacing-4)' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <Input 
              placeholder="🔍 Tìm kiếm theo tên học sinh..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ width: '160px' }}>
            <select 
              value={gradeFilter} 
              onChange={(e) => setGradeFilter(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxSizing: 'border-box', outline: 'none', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', minHeight: '44px' }}
            >
              <option value="ALL">Tất cả khối</option>
              <option value="10">Khối 10</option>
              <option value="11">Khối 11</option>
              <option value="12">Khối 12</option>
            </select>
          </div>
        </div>
      </Card>

      <Card style={{ padding: 'var(--spacing-4)' }}>
        {/* DESKTOP TABLE */}
        <div className="desktop-student-table" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-background)' }}>
                <th style={{ padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)' }}>Mã HS</th>
                <th style={{ padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)' }}>Họ Tên</th>
                <th style={{ padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)' }}>Trường & Khối</th>
                <th style={{ padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)' }}>SĐT Phụ huynh</th>
                <th style={{ padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: 'var(--spacing-6)', textAlign: 'center' }}>Đang tải dữ liệu...</td></tr>
              ) : (!Array.isArray(students) || students.length === 0) ? (
                <tr><td colSpan={5}><EmptyState title="Không tìm thấy học sinh nào" description="Thử thay đổi bộ lọc hoặc bấm '+ Thêm học sinh'." /></td></tr>
              ) : (Array.isArray(students) ? students : []).map(student => (
                <tr key={student.id} style={{ borderBottom: '1px solid var(--color-background)', cursor: 'pointer' }} onClick={() => navigate(`/students/${student.id}`)}>
                  <td style={{ padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>{student.student_code || student.id}</td>
                  <td style={{ padding: 'var(--spacing-3)', fontWeight: 'bold', color: 'var(--color-text)' }}>{student.full_name}</td>
                  <td style={{ padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)' }}>
                    {student.school_name || 'Chưa cập nhật'} {student.grade && `• Khối ${student.grade}`}
                  </td>
                  <td style={{ padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)' }}>{student.phone_number || '---'}</td>
                  <td style={{ padding: 'var(--spacing-3)', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <Button 
                        variant="secondary"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setSelectedStudentId(student.id); setShowPasswordModal(true); }}
                        style={{ minHeight: '36px' }}
                      >
                        🔑 Đổi MK
                      </Button>
                      <Button variant="outline" size="sm" style={{ minHeight: '36px' }}>Xem Hồ Sơ</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS LIST */}
        <div className="mobile-student-cards" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Đang tải dữ liệu...</div>
          ) : (!Array.isArray(students) || students.length === 0) ? (
            <EmptyState title="Không tìm thấy học sinh nào" description="Thử thay đổi bộ lọc hoặc thêm học sinh mới." />
          ) : (
            students.map(student => (
              <div 
                key={student.id}
                onClick={() => navigate(`/students/${student.id}`)}
                style={{
                  padding: '14px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '16px', color: 'var(--color-text)' }}>{student.full_name}</strong>
                  <Badge variant="primary">{student.student_code || `#${student.id}`}</Badge>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  🏫 {student.school_name || 'Chưa cập nhật'} {student.grade ? `• Khối ${student.grade}` : ''}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  📞 SĐT: <strong>{student.phone_number || '---'}</strong>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <Button 
                    onClick={(e) => { e.stopPropagation(); navigate(`/students/${student.id}`); }} 
                    variant="outline" 
                    size="sm" 
                    style={{ flex: 1, minHeight: '44px' }}
                  >
                    Xem hồ sơ 360°
                  </Button>
                  <Button 
                    onClick={(e) => { e.stopPropagation(); setSelectedStudentId(student.id); setShowPasswordModal(true); }} 
                    variant="secondary" 
                    size="sm" 
                    style={{ minHeight: '44px' }}
                  >
                    🔑 Đổi MK
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* MODAL THÊM HỌC SINH */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <Card style={{ padding: '20px', width: '100%', maxWidth: '450px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', color: 'var(--color-text)' }}>Thêm Học Sinh Mới</h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Input 
                label="Họ Tên học sinh"
                required 
                value={newStudent.full_name} 
                onChange={e => setNewStudent({...newStudent, full_name: e.target.value})} 
                placeholder="VD: Nguyễn Văn A" 
              />
              <Input 
                label="Số điện thoại phụ huynh (dùng đăng nhập)"
                required 
                value={newStudent.phone_number} 
                onChange={e => setNewStudent({...newStudent, phone_number: e.target.value})} 
                placeholder="VD: 0912345678" 
              />
              <Input 
                label="Trường học"
                value={newStudent.school_name} 
                onChange={e => setNewStudent({...newStudent, school_name: e.target.value})} 
                placeholder="VD: THPT Chuyên Sư Phạm" 
              />
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <Button variant="ghost" type="button" onClick={() => setShowModal(false)} style={{ minHeight: '44px' }}>Hủy</Button>
                <Button variant="primary" type="submit" style={{ minHeight: '44px' }}>Thêm Học Sinh</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL ĐỔI MẬT KHẨU */}
      {showPasswordModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <Card style={{ padding: '20px', width: '100%', maxWidth: '400px' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', color: 'var(--color-text)' }}>Đổi Mật Khẩu</h2>
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Input 
                label="Mật khẩu mới"
                required 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                placeholder="Nhập mật khẩu mới" 
                type="password"
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <Button variant="ghost" type="button" onClick={() => {setShowPasswordModal(false); setNewPassword('');}} style={{ minHeight: '44px' }}>Hủy</Button>
                <Button variant="primary" type="submit" style={{ minHeight: '44px' }}>Lưu Mật Khẩu</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-student-table {
            display: none !important;
          }
          .mobile-student-cards {
            display: flex !important;
          }
        }
        @media (min-width: 769px) {
          .desktop-student-table {
            display: block !important;
          }
          .mobile-student-cards {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default StudentManagement;
