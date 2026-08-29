import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';

interface Teacher {
  id: number;
  username: string;
  full_name: string;
}

const TeacherManager = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState('');

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axiosClient.get(`/api/auth/teachers`);
      setTeachers(res.data);
    } catch (error) {
      console.error("Lỗi lấy danh sách GV", error);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axiosClient.post(`/api/auth/teachers`, {
        username,
        password,
        full_name: fullName
      });
      
      setMessage('🎉 Tạo tài khoản Giáo viên thành công!');
      setUsername(''); setPassword(''); setFullName('');
      fetchTeachers();
    } catch (error: any) {
      setMessage('❌ ' + (error.response?.data?.message || 'Lỗi tạo giáo viên'));
    }
  };

  const handleResetPassword = async (teacherId: number, teacherName: string) => {
    const newPassword = window.prompt(`Nhập mật khẩu MỚI cho giáo viên ${teacherName}:`);
    if (!newPassword) return;

    try {
      const token = localStorage.getItem('token');
      await axiosClient.put(`/api/auth/teachers/${teacherId}/reset-password`, 
        { newPassword: newPassword }
      );
      alert('✅ Đã cấp lại mật khẩu thành công!');
    } catch (error: any) {
      alert('❌ Lỗi: Không thể cấp lại mật khẩu.');
    }
  };

  return (
    <div style={{ padding: 'var(--spacing-5)', fontFamily: 'sans-serif' }}>
      <h2 style={{ color: 'var(--color-text)', marginBottom: 'var(--spacing-5)' }}>Quản Lý Giáo Viên</h2>
      
      <Card style={{ marginBottom: 'var(--spacing-8)', maxWidth: '600px' }}>
        <h3 style={{ marginTop: 0, color: 'var(--color-primary)' }}>Thêm Giáo viên mới</h3>
        <form onSubmit={handleCreateTeacher} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          <Input 
            required
            placeholder="Tên hiển thị (VD: Cô Lan Hóa)"
            value={fullName} onChange={(e) => setFullName(e.target.value)}
          />
          <Input 
            required
            placeholder="Tên đăng nhập (Username)"
            value={username} onChange={(e) => setUsername(e.target.value)}
          />
          <Input 
            type="password"
            required
            placeholder="Mật khẩu"
            value={password} onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" variant="primary">
            + Tạo Tài Khoản
          </Button>
        </form>
        {message && <p style={{ marginTop: 'var(--spacing-4)', fontWeight: 'var(--font-weight-bold)', color: message.includes('❌') ? 'red' : 'green' }}>{message}</p>}
      </Card>

      <Card>
        <h3 style={{ marginTop: 0, color: 'var(--color-text-secondary)' }}>Danh sách Giáo viên</h3>
        
        {teachers.length === 0 ? (
          <EmptyState title="Chưa có giáo viên nào" />
        ) : (
          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-background)', borderBottom: '2px solid var(--color-border)' }}>
                  <th style={{ padding: 'var(--spacing-3)' }}>ID</th>
                  <th style={{ padding: 'var(--spacing-3)' }}>Tên hiển thị</th>
                  <th style={{ padding: 'var(--spacing-3)' }}>Username</th>
                  <th style={{ padding: 'var(--spacing-3)', textAlign: 'center' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--color-background)' }}>
                    <td style={{ padding: 'var(--spacing-3)' }}>#{t.id}</td>
                    <td style={{ padding: 'var(--spacing-3)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text)' }}>{t.full_name}</td>
                    <td style={{ padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)' }}>{t.username}</td>
                    <td style={{ padding: 'var(--spacing-3)', textAlign: 'center' }}>
                      <Button 
                        onClick={() => handleResetPassword(t.id, t.full_name)}
                        variant="outline" size="sm"
                      >
                        🔑 Cấp lại Mật khẩu
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default TeacherManager;
