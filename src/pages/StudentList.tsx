import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';

interface Student {
  id: number;
  full_name: string;
  phone_number: string;
  school_name: string;
  email?: string;
}

const StudentList = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('123456'); // Thêm state lưu mật khẩu mặc định
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const navigate = useNavigate();

  const fetchStudents = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const response = await axiosClient.get(`/api/students`);
      setStudents(response.data);
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    try {
      if (editingId) {
        // Nếu là Cập nhật (Sửa) thì không gửi password
        await axiosClient.put(`/api/students/${editingId}`, {
          full_name: fullName,
          phone_number: phoneNumber,
          school_name: schoolName
        });
        toast.success('Cập nhật thông tin thành công!');
      } else {
        // Nếu là Tạo mới thì gửi kèm password
        await axiosClient.post(`/api/students`, {
          full_name: fullName,
          phone_number: phoneNumber,
          school_name: schoolName,
            email: email,
          password: password // Gắn mật khẩu vào đây
        });
        toast.success('Thêm học sinh thành công!');
      }

      setFullName('');
      setPhoneNumber('');
      setSchoolName('');
        setEmail('');
      setPassword('123456'); // Reset lại mật khẩu mặc định trên ô input
      setEditingId(null);
      fetchStudents();
    } catch (error: any) {
      setMessage(`❌ Lỗi: ${error.response?.data?.message || 'Có lỗi xảy ra'}`);
    }
  };

  const handleEditClick = (student: Student) => {
    setEditingId(student.id);
    setFullName(student.full_name);
    setPhoneNumber(student.phone_number);
    setSchoolName(student.school_name || '');
      setEmail(student.email || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm('Bạn có chắc chắn muốn xóa học sinh này không?');
    if (!confirmDelete) return;

    const token = localStorage.getItem('token');
    try {
      await axiosClient.delete(`/api/students/${id}`);
      toast.success('Đã xóa học sinh thành công!');
      fetchStudents();
    } catch (error) {
      toast.error('Không thể xóa học sinh này.');
    }
  };

  // HÀM XỬ LÝ CẤP LẠI MẬT KHẨU
  const handleResetPassword = async (studentId: number, studentName: string) => {
    const newPassword = window.prompt(`Nhập mật khẩu MỚI cho học sinh ${studentName}:`);
    if (!newPassword) return; 

    try {
      const token = localStorage.getItem('token');
      await axiosClient.put(`/api/students/${studentId}/reset-password`, 
        { newPassword: newPassword }
      );
      toast.success('Đã cấp lại mật khẩu thành công!');
    } catch (error: any) {
      toast.error('Lỗi: Không thể cấp lại mật khẩu.');
    }
  };

  return (
    <div style={{ padding: 'var(--spacing-6)', maxWidth: '100%', boxSizing: 'border-box' }}>
      
      {/* 1. TIÊU ĐỀ TRANG */}
      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <h1 style={{ margin: '0 0 var(--spacing-2) 0', color: 'var(--color-text)', fontSize: '30px' }}>Danh Sách Học Sinh</h1>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '15px' }}>Quản lý thông tin cá nhân và tài khoản đăng nhập của học viên.</p>
      </div>

      {/* 2. KHUNG THÊM / SỬA HỌC SINH MỚI */}
      <Card style={{ marginBottom: 'var(--spacing-6)', padding: 'var(--spacing-6)' }}>
        <h3 style={{ marginTop: 0, color: 'var(--color-text)', marginBottom: 'var(--spacing-5)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
          <span style={{ color: editingId ? 'var(--color-primary)' : '#8b5cf6', fontSize: 'var(--font-size-xl)' }}>
            {editingId ? '✏️' : '➕'}
          </span> 
          {editingId ? 'Cập Nhật Thông Tin' : 'Thêm Học Sinh Mới'}
        </h3>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 'var(--spacing-4)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <Input 
              placeholder="Họ và Tên" 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              required
            />
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <Input 
              placeholder="Số điện thoại (Dùng làm Tên đăng nhập)" 
              value={phoneNumber} 
              onChange={(e) => setPhoneNumber(e.target.value)} 
              required
            />
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <Input 
              placeholder="Trường học (Không bắt buộc)" 
              value={schoolName} 
              onChange={(e) => setSchoolName(e.target.value)} 
            />
          </div>
          
          {/* Ô Nhập Mật Khẩu (Chỉ hiện khi tạo mới, ẩn đi khi đang sửa) */}
          {!editingId && (
            <div style={{ width: '120px' }}>
              <Input 
                placeholder="Mật khẩu" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required
              />
            </div>
          )}
          
          <div style={{ flex: 1, minWidth: '200px' }}>
            <Input 
              type="email" 
              placeholder="Email (Không bắt buộc)" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>
          
          <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
            <Button type="submit" variant={editingId ? 'primary' : 'primary'}>
              {editingId ? 'Cập Nhật' : 'Lưu Mới'}
            </Button>
            
            {editingId && (
              <Button type="button" variant="ghost" onClick={() => { setEditingId(null); setFullName(''); setPhoneNumber(''); setSchoolName(''); }}>
                Hủy
              </Button>
            )}
          </div>
        </form>
        {message && <p style={{ marginTop: 'var(--spacing-4)', fontWeight: 'var(--font-weight-bold)', color: message.includes('❌') ? 'var(--color-danger)' : 'var(--color-success)' }}>{message}</p>}
      </Card>
      
      {/* 3. BẢNG DANH SÁCH HỌC SINH */}
      <Card style={{ overflow: 'hidden', padding: 0 }}>
        <div className="overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-background)' }}>
                <th style={{ padding: 'var(--spacing-4) var(--spacing-5)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '1px solid var(--color-background)' }}>ID</th>
                <th style={{ padding: 'var(--spacing-4) var(--spacing-5)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '1px solid var(--color-background)' }}>Họ và Tên</th>
                <th style={{ padding: 'var(--spacing-4) var(--spacing-5)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '1px solid var(--color-background)' }}>Tài khoản (SĐT)</th>
                <th style={{ padding: 'var(--spacing-4) var(--spacing-5)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '1px solid var(--color-background)' }}>Trường</th>
                <th style={{ padding: 'var(--spacing-4) var(--spacing-5)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '1px solid var(--color-background)', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {(!Array.isArray(students) || students.length === 0) ? (
                <tr>
                  <td colSpan={5} style={{ padding: 'var(--spacing-10)' }}>
                    <EmptyState title="Chưa có dữ liệu học sinh" />
                  </td>
                </tr>
              ) : (
                (Array.isArray(students) ? students : []).map((student) => (
                  <tr key={student.id} style={{ borderBottom: '1px solid var(--color-background)', transition: '0.2s', backgroundColor: editingId === student.id ? 'var(--color-background)' : 'var(--color-surface)' }}>
                    <td style={{ padding: 'var(--spacing-4) var(--spacing-5)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-bold)' }}>#{student.id}</td>
                    <td style={{ padding: 'var(--spacing-4) var(--spacing-5)', color: 'var(--color-text)', fontWeight: 'var(--font-weight-bold)' }}>{student.full_name}</td>
                    <td style={{ padding: 'var(--spacing-4) var(--spacing-5)', color: 'var(--color-primary)', fontWeight: 'var(--font-weight-semibold)' }}>{student.phone_number}</td>
                    <td style={{ padding: 'var(--spacing-4) var(--spacing-5)', color: 'var(--color-text-secondary)' }}>{student.school_name || '-'}</td>
                    <td style={{ padding: 'var(--spacing-4) var(--spacing-5)', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 'var(--spacing-2)', justifyContent: 'center' }}>
                        <Button variant="outline" size="sm" onClick={() => handleEditClick(student)}>Sửa</Button>
                        <Button variant="danger" size="sm" onClick={() => handleDelete(student.id)}>Xóa</Button>
                        <Button variant="secondary" size="sm" onClick={() => handleResetPassword(student.id, student.full_name)}>🔑 Reset MK</Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
    </div>
  );
};

export default StudentList;
