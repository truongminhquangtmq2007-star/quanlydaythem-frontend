import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const TeacherProfile = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [fullName, setFullName] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setTitle(user.title || 'Thầy');
    }
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put('/api/auth/profile', 
        { full_name: fullName, title }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      updateUser({ full_name: fullName, title });
      setMessage('Cập nhật hồ sơ thành công!');
    } catch (err) {
      setMessage('Lỗi khi cập nhật hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ color: '#0f172a', marginBottom: '30px' }}>Hồ sơ cá nhân</h1>
      
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#475569' }}>Danh xưng hiển thị</label>
            <select 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none' }}
            >
              <option value="Thầy">Thầy</option>
              <option value="Cô">Cô</option>
              <option value="Mr">Mr</option>
              <option value="Ms">Ms</option>
              <option value="Gia sư">Gia sư</option>
              <option value="Coach">Coach</option>
            </select>
            <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>Sẽ hiển thị trước tên trên toàn bộ hệ thống (VD: Thầy Quang)</p>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#475569' }}>Họ và tên</label>
            <input 
              required
              value={fullName} 
              onChange={e => setFullName(e.target.value)} 
              placeholder="Nhập họ tên của bạn..."
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none' }} 
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button 
              type="submit" 
              disabled={loading}
              style={{ padding: '12px 24px', backgroundColor: loading ? '#94a3b8' : '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', boxShadow: '0 4px 15px rgba(59,130,246,0.3)' }}
            >
              {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </button>
          </div>
          
          {message && (
            <div style={{ padding: '15px', backgroundColor: message.includes('thành công') ? '#dcfce7' : '#fee2e2', color: message.includes('thành công') ? '#166534' : '#991b1b', borderRadius: '10px', textAlign: 'center', fontWeight: 'bold' }}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default TeacherProfile;

