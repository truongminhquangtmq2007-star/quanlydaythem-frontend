import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate, Link } from 'react-router-dom'; 
import { AuthContext } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

const StudentLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = React.useContext(AuthContext);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await axiosClient.post(`/api/auth/student/login`, { username, password });
      
      login(res.data.token, res.data.user);
      localStorage.setItem('role', 'STUDENT');
      localStorage.setItem('studentName', res.data.user.full_name || res.data.user.username);
      localStorage.setItem('studentId', res.data.user.id); 
      
      navigate('/student/dashboard');
    } catch (error: any) {
      console.log(error.response);
      setMessage(error.response?.data?.message || 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: 'var(--color-background)',
      padding: 'var(--spacing-4)'
    }}>
      <Card style={{ 
        width: '100%', 
        maxWidth: '420px', 
        padding: 'var(--spacing-8)',
        textAlign: 'center'
      }}>
        
        <div style={{ marginBottom: 'var(--spacing-6)' }}>
          <div style={{ 
            width: '64px', height: '64px', 
            borderRadius: '50%', backgroundColor: 'var(--color-primary-soft)', 
            color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            fontSize: 'var(--font-size-3xl)', margin: '0 auto var(--spacing-4) auto' 
          }}>
            🎓
          </div>
          <h2 style={{ margin: 0, color: 'var(--color-text)' }}>Cổng Học Sinh</h2>
          <p className="text-secondary" style={{ marginTop: 'var(--spacing-2)' }}>Vui lòng đăng nhập để xem tài liệu và bài tập</p>
        </div>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <Input 
            label="Tên đăng nhập / SĐT" 
            placeholder="Nhập tài khoản" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <Input 
            label="Mật khẩu" 
            type="password" 
            placeholder="Nhập mật khẩu" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          {message && (
            <div style={{ 
              color: 'var(--color-danger)', 
              backgroundColor: 'var(--color-danger-soft)', 
              padding: 'var(--spacing-3)', 
              borderRadius: 'var(--radius-md)', 
              fontSize: 'var(--font-size-sm)' 
            }}>
              {message}
            </div>
          )}

          <Button type="submit" size="lg" isLoading={loading} style={{ marginTop: 'var(--spacing-2)' }}>
            Đăng Nhập
          </Button>
        </form>
        
        <div style={{ 
          marginTop: 'var(--spacing-6)', 
          paddingTop: 'var(--spacing-6)', 
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-2)'
        }}>
          <span className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
            Bạn là Admin / Giáo viên?
          </span>
          <Link 
            to="/login" 
            style={{ 
              fontSize: 'var(--font-size-sm)', 
              color: 'var(--color-primary)', 
              fontWeight: 'var(--font-weight-medium)' 
            }}
          >
            Đăng nhập tại đây &rarr;
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default StudentLogin;
