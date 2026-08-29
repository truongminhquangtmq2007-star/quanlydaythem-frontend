import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

const Login = () => {
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
      const response = await axiosClient.post(`/api/auth/login`, {
        username: username,
        password: password
      });
      
      login(response.data.token, response.data.user);
      localStorage.setItem('role', response.data.user.role.toLowerCase());
      
      navigate('/students'); 
      
    } catch (error) {
      setMessage('Sai tên đăng nhập hoặc mật khẩu!');
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
            👩‍🏫
          </div>
          <h2 style={{ margin: 0, color: 'var(--color-text)' }}>Giáo viên / Quản trị</h2>
          <p className="text-secondary" style={{ marginTop: 'var(--spacing-2)' }}>Đăng nhập vào hệ thống quản lý</p>
        </div>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <Input 
            label="Tên đăng nhập" 
            placeholder="Nhập tên đăng nhập" 
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
            Đăng Nhập Hệ Thống
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
            Bạn là Học sinh?
          </span>
          <Link 
            to="/student/login" 
            style={{ 
              fontSize: 'var(--font-size-sm)', 
              color: 'var(--color-primary)', 
              fontWeight: 'var(--font-weight-medium)' 
            }}
          >
            Quay lại Cổng Học Sinh &rarr;
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Login;
