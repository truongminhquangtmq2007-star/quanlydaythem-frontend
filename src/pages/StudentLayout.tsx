import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';

const StudentLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const navItemStyle = (path: string) => ({
    padding: '12px 20px',
    borderRadius: 'var(--radius-lg)',
    cursor: 'pointer',
    backgroundColor: location.pathname.includes(path) ? '#eff6ff' : 'transparent',
    color: location.pathname.includes(path) ? 'var(--color-primary)' : 'var(--color-text-secondary)',
    fontWeight: location.pathname.includes(path) ? 'bold' : 'normal',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-2)',
    transition: 'all 0.2s'
  });

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--color-background)', fontFamily: 'Inter, sans-serif' }}>
      {/* SIDEBAR */}
      <div style={{ width: '250px', backgroundColor: 'var(--color-surface)', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '30px 20px', borderBottom: '1px solid var(--color-background)' }}>
          <h2 style={{ margin: 0, color: '#1e3a8a', fontSize: 'var(--font-size-xl)', fontWeight: '900', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
            🎓 Student Portal
          </h2>
        </div>
        
        <div style={{ flex: 1, padding: '20px 15px', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
          <div onClick={() => navigate('/student/dashboard')} style={navItemStyle('/student/dashboard')}>
            🏠 Trang Chủ
          </div>
          <div onClick={() => navigate('/student/schedule')} style={navItemStyle('/student/schedule')}>
            📅 Lịch Học
          </div>
          <div onClick={() => navigate('/student/documents')} style={navItemStyle('/student/documents')}>
            📚 Bài Tập & Tài Liệu
          </div>
        </div>

        <div style={{ padding: 'var(--spacing-5)' }}>
          <Button onClick={handleLogout} style={{ width: '100%', padding: 'var(--spacing-3)', backgroundColor: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 'var(--radius-lg)', fontWeight: 'var(--font-weight-bold)', cursor: 'pointer' }}>
            Đăng xuất
          </Button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default StudentLayout;
