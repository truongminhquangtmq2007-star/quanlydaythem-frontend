import React, { useContext } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

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
    { path: '/student/dashboard', icon: '🎓', label: 'Trang chủ' },
    { path: '/student/schedule', icon: '📅', label: 'Lịch học' },
    { path: '/student/documents', icon: '📚', label: 'Tài liệu của tôi' }, 
    { path: '/student/exams', icon: '📝', label: 'Kết quả kiểm tra' }, 
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'transparent' }}>
      
      {/* SIDEBAR: Màu trầm (Slate Dark) giống hệt trang Giáo viên */}
      <div style={{ width: '270px', backgroundColor: '#1e293b', display: 'flex', flexDirection: 'column', zIndex: 10, boxShadow: '4px 0 20px rgba(0,0,0,0.05)' }}>
        
        {/* KHU VỰC THÔNG TIN HỌC SINH (Nền đậm hơn một chút để tạo điểm nhấn) */}
        <div style={{ padding: '35px 20px 25px 20px', textAlign: 'center', backgroundColor: '#0f172a' }}>
          <div style={{ width: '70px', height: '70px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '32px', margin: '0 auto 15px auto', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)' }}>
            👨‍🎓
          </div>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#f8fafc' }}>
            {user ? `${user.title === 'Em' ? '' : user.title} ${studentName}`.trim() : `Chào em, ${studentName}`}
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>Học viên trung tâm</p>
        </div>
        
        {/* MENU */}
        <nav style={{ flex: 1, padding: '20px 15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {menuItems.map(item => {
            const isActive = location.pathname.includes(item.path);
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '15px', padding: '14px 18px', 
                  color: isActive ? '#0f172a' : '#cbd5e1', 
                  textDecoration: 'none', 
                  backgroundColor: isActive ? '#ffffff' : 'transparent',
                  fontWeight: isActive ? 'bold' : 'normal',
                  fontSize: '15px',
                  borderRadius: '14px', /* Vẫn giữ bo góc mềm mại */
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

        {/* NÚT ĐĂNG XUẤT */}
        <div style={{ padding: '20px' }}>
          <button 
            onClick={handleLogout} 
            style={{ width: '100%', padding: '14px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '14px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: '0.2s' }}
          >
            🚪 Đăng Xuất
          </button>
        </div>
      </div>

      {/* NỘI DUNG BÊN PHẢI */}
      <div style={{ flex: 1, height: '100vh', overflowY: 'auto' }}>
        <Outlet /> 
      </div>
      
    </div>
  );
};

export default StudentLayout;
