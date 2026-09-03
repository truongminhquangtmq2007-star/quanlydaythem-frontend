import React, { useContext, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemePicker } from './ui/ThemePicker';

const StudentLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const token = localStorage.getItem('token');
  const role = (localStorage.getItem('role') || user?.role || '').toLowerCase();
  const studentName = user?.full_name || localStorage.getItem('studentName') || 'Học viên';

  if (!token) {
    return <Navigate to="/student/login" replace />;
  }

  if (role === 'teacher' || role === 'admin') {
    return <Navigate to="/classes" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/student/login');
  };

  const menuItems = [
    { path: '/student/dashboard', icon: '🏠', label: 'Trang chủ' },

    { path: '/student/documents', icon: '📁', label: 'Tài liệu của tôi' }, 
    { path: '/student/exams', icon: '📝', label: 'Phòng thi trực tuyến' }, 
  ];

  // 4 Core items for student mobile bottom navigation
  const bottomNavItems = [
    { path: '/student/dashboard', icon: '🏠', label: 'Trang chủ' },
 
    { path: '/student/documents', icon: '📁', label: 'Tài liệu' }, 
    { path: '/student/exams', icon: '📝', label: 'Phòng thi' }, 
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

      {/* SIDEBAR DRAWER */}
      <div 
        className={`student-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}
        style={{ 
          width: '270px', 
          backgroundColor: 'var(--color-surface)', 
          borderRight: '1px solid var(--color-border)',
          display: 'flex', 
          flexDirection: 'column', 
          zIndex: 50,
          transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div style={{ 
          padding: 'var(--spacing-6) var(--spacing-5)', 
          textAlign: 'center', 
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative'
        }}>
          {/* Close button on mobile drawer */}
          <button
            className="mobile-drawer-close"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'transparent',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              padding: '4px 8px'
            }}
          >
            ✕
          </button>

          <div style={{ 
            width: '56px', height: '56px', 
            backgroundColor: 'var(--color-primary-soft)', 
            color: 'var(--color-primary)',
            borderRadius: '50%', 
            display: 'flex', justifyContent: 'center', alignItems: 'center', 
            marginBottom: 'var(--spacing-3)', 
            fontSize: '28px' 
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
                  minHeight: '44px'
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
              minHeight: '44px',
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
          height: '60px',
          backgroundColor: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 var(--spacing-4)',
          zIndex: 5
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Mở menu"
              style={{
                background: 'transparent',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '18px',
                cursor: 'pointer',
                color: 'var(--color-text)',
                minHeight: '40px',
                minWidth: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ☰
            </button>
            <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {menuItems.find(i => location.pathname.startsWith(i.path))?.label || 'Cổng thông tin học viên'}
            </h2>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
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
                {studentName ? studentName.charAt(0) : 'S'}
              </div>
              <div className="user-info-text" style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text)' }}>{studentName}</span>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Học viên</span>
              </div>
            </div>
          </div>
        </header>

        {/* OUTLET SCROLLABLE CONTENT */}
        <main className="student-main-scroll" style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-4)', boxSizing: 'border-box' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>

        {/* MOBILE BOTTOM NAVIGATION FOR STUDENT */}
        <nav className="mobile-bottom-nav" style={{
          backgroundColor: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '6px 0',
          paddingBottom: 'calc(6px + env(safe-area-inset-bottom, 0px))',
          zIndex: 30
        }}>
          {bottomNavItems.map(item => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  fontSize: '11px',
                  fontWeight: isActive ? 'bold' : 'normal',
                  minWidth: '56px',
                  minHeight: '44px',
                  gap: '2px'
                }}
              >
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          <button
            onClick={() => setMobileMenuOpen(true)}
            style={{
              background: 'transparent',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-secondary)',
              fontSize: '11px',
              minWidth: '56px',
              minHeight: '44px',
              cursor: 'pointer',
              gap: '2px'
            }}
          >
            <span style={{ fontSize: '18px' }}>☰</span>
            <span>Thêm</span>
          </button>
        </nav>

      </div>

      <style>{`
        @media (max-width: 768px) {
          .student-sidebar {
            position: fixed !important;
            top: 0;
            bottom: 0;
            left: 0;
            transform: translateX(-100%);
            box-shadow: 2px 0 16px rgba(0,0,0,0.15);
          }
          .student-sidebar.mobile-open {
            transform: translateX(0) !important;
          }
          .user-info-text {
            display: none !important;
          }
          .student-main-scroll {
            padding-bottom: calc(70px + env(safe-area-inset-bottom, 0px)) !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-menu-btn, .mobile-drawer-close, .mobile-bottom-nav {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default StudentLayout;
