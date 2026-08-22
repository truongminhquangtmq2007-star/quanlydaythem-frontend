import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

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
    borderRadius: '12px',
    cursor: 'pointer',
    backgroundColor: location.pathname.includes(path) ? '#eff6ff' : 'transparent',
    color: location.pathname.includes(path) ? '#2563eb' : '#64748b',
    fontWeight: location.pathname.includes(path) ? 'bold' : 'normal',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    transition: 'all 0.2s'
  });

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      {/* SIDEBAR */}
      <div style={{ width: '250px', backgroundColor: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '30px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ margin: 0, color: '#1e3a8a', fontSize: '20px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px' }}>
            🎓 Student Portal
          </h2>
        </div>
        
        <div style={{ flex: 1, padding: '20px 15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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

        <div style={{ padding: '20px' }}>
          <button onClick={handleLogout} style={{ width: '100%', padding: '12px', backgroundColor: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
            Đăng xuất
          </button>
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
