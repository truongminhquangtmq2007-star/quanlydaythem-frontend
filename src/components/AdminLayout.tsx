import React, { useContext, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemePicker } from './ui/ThemePicker';
import { Avatar } from './ui/Avatar';

interface MenuGroup {
  title?: string;
  items: { path: string; icon: string; label: string }[];
}

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const token = localStorage.getItem('token');
  const role = (localStorage.getItem('role') || user?.role || '').toLowerCase();
  const displayName = user ? `${user.title ? user.title + ' ' : ''}${user.full_name || 'Giáo viên'}` : 'Giáo viên';

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

  const menuGroups: MenuGroup[] = [
    {
      title: 'GIẢNG DẠY',
      items: [
        { path: '/classes', icon: '🏫', label: 'Quản lý Lớp học' },
        { path: '/students', icon: '🎓', label: 'Hồ sơ Học sinh' },
        { path: '/quan-ly-tien-do', icon: '📅', label: 'Lịch dạy & Điểm danh' },
        { path: '/tai-lieu', icon: '📁', label: 'Kho Tài Liệu' }
      ]
    },
    {
      title: 'ĐÁNH GIÁ',
      items: [
        { path: '/quan-ly-thi', icon: '📝', label: 'Quản lý Thi & Điểm' }
      ]
    },
    {
      title: 'CÔNG CỤ AI',
      items: [
        { path: '/admin/create-exam', icon: '✨', label: 'Tạo đề thi bằng AI' }
      ]
    },
    ...(role === 'admin' ? [{
      title: 'HỆ THỐNG',
      items: [
        { path: '/quan-ly-giao-vien', icon: '👩‍🏫', label: 'Quản lý Giáo viên' }
      ]
    }] : []),
    {
      title: 'CÁ NHÂN',
      items: [
        { path: '/quan-ly-tai-chinh', icon: '💰', label: 'Quản lý Tài chính' },
        { path: '/ho-so', icon: '⚙️', label: 'Hồ sơ cá nhân' }
      ]
    }
  ];

  // Flat list for title lookup
  const allMenuItems = menuGroups.flatMap(g => g.items);

  // 5 Core items for mobile bottom navigation
  const bottomNavItems = [
    { path: '/classes', icon: '🏫', label: 'Lớp học' },
    { path: '/students', icon: '🎓', label: 'Học sinh' },
    { path: '/quan-ly-thi', icon: '📝', label: 'Thi & Điểm' },
    { path: '/quan-ly-tien-do', icon: '📅', label: 'Lịch dạy' },
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
        className={`admin-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}
        style={{ 
          width: '280px', 
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

          <Avatar name={displayName} size="lg" style={{ marginBottom: 'var(--spacing-3)' }} />
          <h2 style={{ margin: 0, fontSize: 'var(--font-size-lg)', color: 'var(--color-text)', fontWeight: 'var(--font-weight-semibold)' }}>
            {displayName}
          </h2>
          <p style={{ margin: 'var(--spacing-1) 0 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            {role === 'admin' ? 'Admin Workspace' : 'Teacher Workspace'}
          </p>
        </div>

        <div style={{ flex: 1, padding: 'var(--spacing-4) var(--spacing-3)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
          {menuGroups.map((group, gIdx) => (
            <div key={gIdx} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
              {group.title && (
                <div style={{
                  padding: 'var(--spacing-1) var(--spacing-3)',
                  fontSize: '11px',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-text-secondary)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase'
                }}>
                  {group.title}
                </div>
              )}
              {group.items.map((item) => {
                const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: 'var(--spacing-2) var(--spacing-3)',
                      borderRadius: 'var(--radius-md)',
                      textDecoration: 'none',
                      color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                      backgroundColor: isActive ? 'var(--color-primary-soft)' : 'transparent',
                      fontWeight: isActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                      transition: 'all var(--transition-fast)',
                      minHeight: '40px',
                      fontSize: 'var(--font-size-sm)'
                    }}
                    onMouseOver={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                    }}
                    onMouseOut={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span style={{ marginRight: 'var(--spacing-3)', fontSize: '1.15rem' }}>{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
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
            <h1 style={{ margin: 0, fontSize: '18px', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {allMenuItems.find(i => location.pathname.startsWith(i.path))?.label || 'Quản lý dạy thêm'}
            </h1>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
            <ThemePicker />
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
              <Avatar name={displayName} size="sm" />
              <div className="user-info-text" style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text)' }}>{displayName}</span>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                  {role === 'admin' ? 'Quản trị viên' : 'Giáo viên'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* OUTLET SCROLLABLE CONTENT */}
        <main className="main-content-scroll" style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-4)', boxSizing: 'border-box' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>

        {/* MOBILE BOTTOM NAVIGATION BAR */}
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

          {/* More / Menu trigger in bottom navigation */}
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
          .admin-sidebar {
            position: fixed !important;
            top: 0;
            bottom: 0;
            left: 0;
            transform: translateX(-100%);
            box-shadow: 2px 0 16px rgba(0,0,0,0.15);
          }
          .admin-sidebar.mobile-open {
            transform: translateX(0) !important;
          }
          .user-info-text {
            display: none !important;
          }
          .main-content-scroll {
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

export default AdminLayout;
