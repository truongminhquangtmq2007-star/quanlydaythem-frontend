import React, { useContext } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemePicker } from './ui/ThemePicker';

const StudentLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const studentName = user?.full_name || localStorage.getItem('studentName') || 'Học viên';

  const handleLogout = () => {
    logout();
    navigate('/student/login');
  };

  const menuItems = [
    { path: '/student/dashboard', icon: '🏠', label: 'Trang chủ' },
    { path: '/student/schedule', icon: '📅', label: 'Lịch học' },
    { path: '/student/documents', icon: '📁', label: 'Tài liệu của tôi' }, 
    { path: '/student/exams', icon: '📈', label: 'Kết quả kiểm tra' }, 
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-background)' }}>
      {/* SIDEBAR */}
      <div style={{ 
        width: '270px', 
        backgroundColor: 'var(--color-surface)', 
        borderRight: '1px solid var(--color-border)',
        display: 'flex', 
        flexDirection: 'column', 
        zIndex: 10 
      }}>
        <div style={{ 
          padding: 'var(--spacing-6) var(--spacing-5)', 
          textAlign: 'center', 
          borderBottom: '1px solid var(--color-border)' 
        }}>
          <div style={{ 
            width: '64px', height: '64px', 
            backgroundColor: 'var(--color-primary-soft)', 
            color: 'var(--color-primary)',
            borderRadius: '50%', 
            display: 'flex', justifyContent: 'center', alignItems: 'center', 
            margin: '0 auto var(--spacing-3) auto', 
            fontSize: '32px' 
          }}>
            🧑‍🎓
          </div>
          <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', color: 'var(--color-text)', fontWeight: 'var(--font-weight-semibold)' }}>
            {studentName}
          </h3>
          <p style={{ margin: 'var(--spacing-1) 0 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            Học viên trung tâm
          </p>
        </div>

        <div style={{ flex: 1, padding: 'var(--spacing-4) var(--spacing-3)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: 'var(--spacing-3) var(--spacing-4)',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  backgroundColor: isActive ? 'var(--color-primary-soft)' : 'transparent',
                  fontWeight: isActive ? 'var(--font-weight-medium)' : 'var(--font-weight-regular)',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseOver={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                }}
                onMouseOut={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span style={{ marginRight: 'var(--spacing-3)', fontSize: '1.25rem' }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>

        <div style={{ padding: 'var(--spacing-4)', borderTop: '1px solid var(--color-border)' }}>
          <button 
            onClick={handleLogout}
            style={{ 
              width: '100%', 
              padding: 'var(--spacing-3)', 
              backgroundColor: 'transparent', 
              color: 'var(--color-text-secondary)', 
              border: 'none', 
              borderRadius: 'var(--radius-md)', 
              cursor: 'pointer', 
              fontWeight: 'var(--font-weight-medium)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--spacing-2)',
              transition: 'all var(--transition-fast)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-danger-soft)';
              e.currentTarget.style.color = 'var(--color-danger)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }}
          >
            <span>🚪</span> Đăng xuất
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        
        {/* TOPBAR */}
        <header style={{
          height: '64px',
          backgroundColor: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 var(--spacing-6)',
          zIndex: 5
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 'var(--font-size-xl)', color: 'var(--color-text)' }}>
              {menuItems.find(i => location.pathname.startsWith(i.path))?.label || 'Dashboard'}
            </h1>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-6)' }}>
            <ThemePicker />
          </div>
        </header>

        {/* OUTLET */}
        <main style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-6)' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;
