import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
      const res = await axios.get('https://quanlydaythem-api.onrender.com/api/auth/student/login/api/auth/teachers', {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      await axios.post('https://quanlydaythem-api.onrender.com/api/auth/student/login/api/auth/teachers', {
        username,
        password,
        full_name: fullName
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage('🎉 Tạo tài khoản Giáo viên thành công!');
      setUsername(''); setPassword(''); setFullName('');
      fetchTeachers();
    } catch (error: any) {
      setMessage('❌ ' + (error.response?.data?.message || 'Lỗi tạo giáo viên'));
    }
  };

  // HÀM XỬ LÝ CẤP LẠI MẬT KHẨU
  const handleResetPassword = async (teacherId: number, teacherName: string) => {
    const newPassword = window.prompt(`Nhập mật khẩu MỚI cho giáo viên ${teacherName}:`);
    if (!newPassword) return; // Hủy nếu không nhập gì

    try {
      const token = localStorage.getItem('token');
      await axios.put(`https://quanlydaythem-api.onrender.com/api/auth/student/login/api/auth/teachers/${teacherId}/reset-password`, 
        { newPassword: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('✅ Đã cấp lại mật khẩu thành công!');
    } catch (error: any) {
      alert('❌ Lỗi: Không thể cấp lại mật khẩu.');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2 style={{ color: '#0f172a', marginBottom: '20px' }}>Quản Lý Giáo Viên</h2>
      
      {/* KHỐI TẠO GIÁO VIÊN */}
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '30px', maxWidth: '600px' }}>
        <h3 style={{ marginTop: 0, color: '#3b82f6' }}>Thêm Giáo viên mới</h3>
        <form onSubmit={handleCreateTeacher} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="text" placeholder="Tên hiển thị (VD: Cô Lan Hóa)" required
            value={fullName} onChange={(e) => setFullName(e.target.value)}
            style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
          />
          <input 
            type="text" placeholder="Tên đăng nhập (Username)" required
            value={username} onChange={(e) => setUsername(e.target.value)}
            style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
          />
          <input 
            type="password" placeholder="Mật khẩu" required
            value={password} onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
          />
          <button type="submit" style={{ padding: '10px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
            + Tạo Tài Khoản
          </button>
        </form>
        {message && <p style={{ marginTop: '15px', fontWeight: 'bold', color: message.includes('❌') ? 'red' : 'green' }}>{message}</p>}
      </div>

      {/* DANH SÁCH GIÁO VIÊN */}
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0, color: '#475569' }}>Danh sách Giáo viên</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '12px' }}>ID</th>
              <th style={{ padding: '12px' }}>Tên hiển thị</th>
              <th style={{ padding: '12px' }}>Username</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px' }}>#{t.id}</td>
                <td style={{ padding: '12px', fontWeight: 'bold', color: '#0f172a' }}>{t.full_name}</td>
                <td style={{ padding: '12px', color: '#64748b' }}>{t.username}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <button 
                    onClick={() => handleResetPassword(t.id, t.full_name)}
                    style={{ padding: '6px 12px', backgroundColor: '#fef3c7', color: '#b45309', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                  >
                    🔑 Cấp lại Mật khẩu
                  </button>
                </td>
              </tr>
            ))}
            {teachers.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Chưa có giáo viên nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeacherManager;