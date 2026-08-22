import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate, Link } from 'react-router-dom'; 

import { AuthContext } from '../context/AuthContext';

const StudentLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { login } = React.useContext(AuthContext);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axiosClient.post(`/api/auth/student/login`, { username, password });
      
      login(res.data.token, res.data.user);
      localStorage.setItem('role', 'STUDENT');
      localStorage.setItem('studentName', res.data.user.full_name || res.data.user.username);
      localStorage.setItem('studentId', res.data.user.id); 
      
      navigate('/student/dashboard');
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Lỗi kết nối máy chủ');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '30px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', borderRadius: '10px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h2 style={{ color: '#007bff' }}>Cổng Học Sinh</h2>
      <p style={{ color: '#6c757d', marginBottom: '20px' }}>Vui lòng đăng nhập để xem tài liệu và bài tập</p>
      
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="text" 
          placeholder="Tên đăng nhập" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }} 
          required 
        />
        <input 
          type="password" 
          placeholder="Mật khẩu" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }} 
          required 
        />
        <button type="submit" style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
          Đăng Nhập
        </button>
      </form>
      {message && <p style={{ color: 'red', marginTop: '15px', fontWeight: 'bold' }}>❌ {message}</p>}

      {/* --- KHỐI LINK SANG TRANG ADMIN --- */}
      <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
        <span style={{ fontSize: '14px', color: '#64748b' }}>
          Bạn là Admin/Giáo viên?{' '}
        </span>
        {/* Đã cập nhật chính xác đường dẫn /login dựa trên App.tsx */}
        <Link 
          to="/login" 
          style={{ 
            fontSize: '14px', 
            color: '#3b82f6', 
            fontWeight: '600', 
            textDecoration: 'none',
            cursor: 'pointer' 
          }}
          onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
        >
          Đăng nhập tại đây
        </Link>
      </div>
    </div>
  );
};

export default StudentLogin;
