import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); 
    try {
      const response = await axios.post('https://quanlydaythem-api.onrender.com/api/auth/student/login/api/auth/login', {
        username: username,
        password: password
      });
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', response.data.user.role);
      setMessage('🎉 Đăng nhập thành công!');
      
      navigate('/students'); 
      
    } catch (error) {
      setMessage('❌ Sai tên đăng nhập hoặc mật khẩu!');
    }
  };

  return (
    <div style={{ padding: '50px', maxWidth: '400px', margin: '100px auto', textAlign: 'center', fontFamily: 'sans-serif', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', borderRadius: '12px' }}>
      
      <h2 style={{ color: '#0f172a', marginBottom: '20px' }}>Cổng Quản Trị (Giáo viên)</h2>
      
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="text" 
          placeholder="Tên đăng nhập quản trị" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ padding: '12px', fontSize: '15px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
        />
        <input 
          type="password" 
          placeholder="Mật khẩu" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: '12px', fontSize: '15px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
        />
        <button type="submit" style={{ padding: '12px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', transition: '0.2s' }}>
          Đăng Nhập Hệ Thống
        </button>
      </form>
      
      <p style={{ marginTop: '20px', fontWeight: 'bold', color: message.includes('❌') ? 'red' : 'green' }}>
        {message}
      </p>

      {/* --- KHỐI QUAY LẠI TRANG HỌC SINH --- */}
      <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
        <span style={{ fontSize: '14px', color: '#64748b' }}>
          Bạn là Học sinh?{' '}
        </span>
        {/* Đã cập nhật chính xác đường dẫn /student/login dựa trên App.tsx */}
        <Link 
          to="/student/login" 
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
          Quay lại Cổng Học Sinh
        </Link>
      </div>
    </div>
  );
};

export default Login;