import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';
import { EmptyState } from '../components/ui/EmptyState';
import { TableContainer, Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import { toast } from 'react-toastify';

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
  const [loading, setLoading] = useState(false);

  const fetchTeachers = async () => {
    try {
      const res = await axiosClient.get(`/api/auth/teachers`);
      setTeachers(res.data || []);
    } catch (error) {
      console.error("Lỗi lấy danh sách GV", error);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosClient.post(`/api/auth/teachers`, {
        username,
        password,
        full_name: fullName
      });
      
      toast.success('🎉 Tạo tài khoản Giáo viên thành công!');
      setUsername(''); 
      setPassword(''); 
      setFullName('');
      fetchTeachers();
    } catch (error: any) {
      toast.error('❌ ' + (error.response?.data?.message || 'Lỗi tạo giáo viên'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (teacherId: number, teacherName: string) => {
    const newPassword = window.prompt(`Nhập mật khẩu MỚI cho giáo viên ${teacherName}:`);
    if (!newPassword) return;

    try {
      await axiosClient.put(`/api/auth/teachers/${teacherId}/reset-password`, 
        { newPassword: newPassword }
      );
      toast.success('Đã cấp lại mật khẩu thành công!');
    } catch (error: any) {
      toast.error('Lỗi: Không thể cấp lại mật khẩu.');
    }
  };

  return (
    <div style={{ padding: 'var(--spacing-6)', maxWidth: '100%', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <h1 style={{ margin: '0 0 4px 0', fontSize: '24px', color: 'var(--color-text)', fontWeight: '800' }}>Quản Lý Giáo Viên</h1>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '14px' }}>Cấp phát và quản lý tài khoản giáo viên trong hệ thống</p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--spacing-6)', alignItems: 'start' }}>
        <Card style={{ padding: 'var(--spacing-6)' }}>
          <h2 style={{ margin: '0 0 var(--spacing-4) 0', fontSize: '18px', color: 'var(--color-text)', fontWeight: '700' }}>✨ Thêm Giáo viên mới</h2>
          <form onSubmit={handleCreateTeacher} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            <Input 
              required
              label="Tên hiển thị"
              placeholder="VD: Cô Lan Hóa"
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)}
            />
            <Input 
              required
              label="Tên đăng nhập (Username)"
              placeholder="VD: colan_hoa"
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
            />
            <Input 
              type="password"
              required
              label="Mật khẩu khởi tạo"
              placeholder="Tối thiểu 6 ký tự"
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" variant="primary" isLoading={loading} style={{ minHeight: '44px', marginTop: 'var(--spacing-2)' }}>
              + Tạo Tài Khoản
            </Button>
          </form>
        </Card>

        <Card style={{ padding: 'var(--spacing-6)' }}>
          <h2 style={{ margin: '0 0 var(--spacing-4) 0', fontSize: '18px', color: 'var(--color-text)', fontWeight: '700' }}>👥 Danh sách Giáo viên ({teachers.length})</h2>
          
          {teachers.length === 0 ? (
            <EmptyState title="Chưa có giáo viên nào" description="Sử dụng form bên cạnh để thêm tài khoản giáo viên mới." />
          ) : (
            <TableContainer>
              <Table>
                <Thead>
                  <Tr>
                    <Th>Giáo Viên</Th>
                    <Th>Username</Th>
                    <Th style={{ textAlign: 'center' }}>Hành động</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {teachers.map(t => (
                    <Tr key={t.id}>
                      <Td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Avatar name={t.full_name} size="sm" />
                          <div>
                            <div style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text)' }}>{t.full_name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>#{t.id}</div>
                          </div>
                        </div>
                      </Td>
                      <Td style={{ color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>{t.username}</Td>
                      <Td style={{ textAlign: 'center' }}>
                        <Button 
                          onClick={() => handleResetPassword(t.id, t.full_name)}
                          variant="outline" 
                          size="sm"
                          style={{ minHeight: '36px' }}
                        >
                          🔑 Đổi MK
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TeacherManager;
