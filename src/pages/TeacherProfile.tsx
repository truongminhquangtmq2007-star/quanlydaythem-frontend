import React, { useState, useContext, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { AuthContext } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

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
      const res = await axiosClient.put('/api/auth/profile', 
        { full_name: fullName, title }
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
    <div style={{ padding: 'var(--spacing-8)', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ color: 'var(--color-text)', marginBottom: 'var(--spacing-8)' }}>Hồ sơ cá nhân</h1>
      
      <Card>
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-2)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-secondary)' }}>Danh xưng hiển thị</label>
            <select 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              style={{ width: '100%', padding: 'var(--spacing-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', outline: 'none' }}
            >
              <option value="Thầy">Thầy</option>
              <option value="Cô">Cô</option>
              <option value="Mr">Mr</option>
              <option value="Ms">Ms</option>
              <option value="Gia sư">Gia sư</option>
              <option value="Coach">Coach</option>
            </select>
            <p style={{ margin: '5px 0 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Sẽ hiển thị trước tên trên toàn bộ hệ thống (VD: Thầy Quang)</p>
          </div>

          <div>
            <Input 
              required
              label="Họ và tên"
              value={fullName} 
              onChange={e => setFullName(e.target.value)} 
              placeholder="Nhập họ tên của bạn..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--spacing-2)' }}>
            <Button 
              type="submit" 
              variant="primary"
              isLoading={loading}
              disabled={loading}
            >
              {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </Button>
          </div>
          
          {message && (
            <div style={{ padding: 'var(--spacing-4)', backgroundColor: message.includes('thành công') ? 'var(--color-success-light, #dcfce7)' : 'var(--color-danger-light, #fee2e2)', color: message.includes('thành công') ? 'var(--color-success, #166534)' : 'var(--color-danger, #991b1b)', borderRadius: 'var(--radius-md)', textAlign: 'center', fontWeight: 'var(--font-weight-bold)' }}>
              {message}
            </div>
          )}
        </form>
      </Card>
    </div>
  );
};

export default TeacherProfile;

