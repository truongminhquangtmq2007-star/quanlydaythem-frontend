import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 1. LẤY ROLE TỪ LOCAL STORAGE ĐỂ PHÂN QUYỀN
  const role = localStorage.getItem('role'); 

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  // 2. CẤU HÌNH MENU LINH HOẠT THEO ROLE
  const menuItems = [
    { path: '/students', icon: '👨‍🎓', label: 'Quản lý Học sinh' },
    { path: '/classes', icon: '🏫', label: 'Quản lý Lớp học' },
    
    // CHỈ THÊM MENU "QUẢN LÝ GIÁO VIÊN" NẾU TÀI KHOẢN LÀ ADMIN
    ...(role === 'admin' ? [{ path: '/quan-ly-giao-vien', icon: '👨‍🏫', label: 'Quản lý Giáo viên' }] : []),
    
    { path: '/tai-lieu', icon: '📚', label: 'Kho Tài Liệu' }, 
    { path: '/quan-ly-thi', icon: '📊', label: 'Quản lý Thi & Điểm' }, 
    { path: '/quan-ly-tien-do', icon: '📅', label: 'Lịch Dạy & Điểm Danh' },
    { path: '/quan-ly-tai-chinh', icon: '💰', label: 'Quản lý Tài chính' }, 
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f0f4f8' }}>
      
      {/* SIDEBAR */}
      <div style={{ width: '280px', backgroundColor: '#1e293b', color: 'white', display: 'flex', flexDirection: 'column', boxShadow: '4px 0 20px rgba(0,0,0,0.05)', zIndex: 10 }}>
        
        <div style={{ padding: '35px 20px', textAlign: 'center', backgroundColor: '#0f172a' }}>
          <div style={{ width: '60px', height: '60px', backgroundColor: '#3b82f6', borderRadius: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 15px auto', fontSize: '28px', boxShadow: '0 4px 10px rgba(59, 130, 246, 0.4)' }}>
            ✨
          </div>
          <h2 style={{ margin: 0, fontSize: '20px', letterSpacing: '0.5px', color: '#f8fafc' }}>Gia Sư Minh Quang</h2>
          {/* Đổi chữ Admin Workspace thành Giáo viên nếu không phải Admin */}
          <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
            {role === 'admin' ? 'Admin Workspace' : 'Teacher Workspace'}
          </p>
        </div>
        
        <nav style={{ flex: 1, padding: '25px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {menuItems.map(item => {
            const isActive = location.pathname.includes(item.path);
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '15px', padding: '14px 20px', 
                  color: isActive ? '#0f172a' : '#cbd5e1', 
                  textDecoration: 'none', 
                  borderRadius: '12px',
                  backgroundColor: isActive ? '#ffffff' : 'transparent',
                  fontWeight: isActive ? '700' : '500',
                  fontSize: '15px',
                  whiteSpace: 'nowrap', 
                  transition: 'all 0.2s ease-in-out',
                  boxShadow: isActive ? '0 4px 15px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <span style={{ fontSize: '20px', filter: isActive ? 'none' : 'grayscale(100%) opacity(0.7)' }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '25px 20px' }}>
          <button 
            onClick={handleLogout} 
            style={{ width: '100%', padding: '14px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: '0.2s' }}
          >
            🚪 Đăng Xuất
          </button>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div style={{ flex: 1, height: '100vh', overflowY: 'auto' }}>
        <Outlet /> 
      </div>
      
    </div>
  );
};

export default AdminLayout;