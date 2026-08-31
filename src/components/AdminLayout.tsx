import React, { useContext, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemePicker } from './ui/ThemePicker';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const token = localStorage.getItem('token');
  const role = (localStorage.getItem('role') || user?.role || '').toLowerCase();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'student') {
    return <Navigate to="/student/dashboard" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/students', icon: '🎓', label: 'Quản lý Học sinh' },
    { path: '/classes', icon: '🏫', label: 'Quản lý Lớp học' },
    ...(role === 'admin' ? [{ path: '/quan-ly-giao-vien', icon: '👩‍🏫', label: 'Quản lý Giáo viên' }] : []),
    { path: '/tai-lieu', icon: '📁', label: 'Kho Tài Liệu' }, 
    { path: '/quan-ly-thi', icon: '📝', label: 'Quản lý Thi & Điểm' }, 
    { path: '/quan-ly-tien-do', icon: '📅', label: 'Lịch Dạy & Điểm Danh' },
    { path: '/quan-ly-tai-chinh', icon: '💰', label: 'Quản lý Tài chính' }, 
    { path: '/ho-so', icon: '⚙️', label: 'Hồ sơ cá nhân' }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-background)', position: 'relative' }}>
      
      {/* MOBILE OVERLAY */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 40
          }}
        />
      )}

      {/* SIDEBAR */}
      <div 
        className={`admin-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}
        style={{ 
          width: '280px', 
          backgroundColor: 'var(--color-surface)', 
          borderRight: '1px solid var(--color-border)',
          display: 'flex', 
          flexDirection: 'column', 
          zIndex: 50,
          transition: 'transform 0.2s ease-in-out'
        }}
      >
        <div style={{ 
          padding: 'var(--spacing-6) var(--spacing-5)', 
          textAlign: 'center', 
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <div style={{ 
            width: '48px', height: '48px', 
            backgroundColor: 'var(--color-primary-soft)', 
            color: 'var(--color-primary)',
            borderRadius: 'var(--radius-lg)', 
            display: 'flex', justifyContent: 'center', alignItems: 'center', 
            marginBottom: 'var(--spacing-3)', 
            fontSize: '24px' 
          }}>
            🎓
          </div>
          <h2 style={{ margin: 0, fontSize: 'var(--font-size-lg)', color: 'var(--color-text)', fontWeight: 'var(--font-weight-semibold)' }}>
            {user ? `${user.title || ''} ${user.full_name}` : 'Gia Sư Minh Quang'}
          </h2>
          <p style={{ margin: 'var(--spacing-1) 0 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            {role === 'admin' ? 'Admin Workspace' : 'Teacher Workspace'}
          </p>
        </div>

        <div style={{ flex: 1, padding: 'var(--spacing-4) var(--spacing-3)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
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

        <div style={{ padding: 'var(--spacing-4) var(--spacing-4)', borderTop: '1px solid var(--color-border)' }}>
          <button 
            onClick={handleLogout}
            style={{ 
              width: '100%', 
              padding: 'var(--spacing-3)', 
              backgroundColor: 'transparent', 
              color: 'var(--color-danger)', 
              border: 'none', 
              borderRadius: 'var(--radius-md)', 
              cursor: 'pointer', 
              fontWeight: 'var(--font-weight-medium)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--spacing-2)',
              transition: 'background-color var(--transition-fast)'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--color-danger-soft)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span>🚪</span> Đăng xuất
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', minWidth: 0 }}>
        
        {/* TOPBAR */}
        <header style={{
          height: '64px',
          backgroundColor: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 var(--spacing-4)',
          zIndex: 5
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: 'transparent',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '18px',
                cursor: 'pointer',
                color: 'var(--color-text)'
              }}
            >
              ☰
            </button>
            <h1 style={{ margin: 0, fontSize: 'var(--font-size-lg)', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {menuItems.find(i => location.pathname.startsWith(i.path))?.label || 'Dashboard'}
            </h1>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
            <ThemePicker />
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
              <div style={{ 
                width: '34px', height: '34px', 
                borderRadius: 'var(--radius-full)', 
                backgroundColor: 'var(--color-primary-soft)', 
                color: 'var(--color-primary)',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                fontWeight: 'var(--font-weight-bold)',
                fontSize: '14px'
              }}>
                {user?.full_name ? user.full_name.charAt(0) : 'T'}
              </div>
              <div className="user-info-text" style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text)' }}>{user?.full_name}</span>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Giáo viên</span>
              </div>
            </div>
          </div>
        </header>

        {/* OUTLET */}
        <main style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-4)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .admin-sidebar {
            position: fixed !important;
            top: 0;
            bottom: 0;
            left: 0;
            transform: translateX(-100%);
            box-shadow: 2px 0 10px rgba(0,0,0,0.1);
          }
          .admin-sidebar.mobile-open {
            transform: translateX(0) !important;
          }
          .user-info-text {
            display: none !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-menu-btn {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;
