import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Student {
  id: number;
  full_name: string;
  phone_number: string;
  school_name: string;
}

const StudentList = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [password, setPassword] = useState('123456'); // Thêm state lưu mật khẩu mặc định
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const navigate = useNavigate();

  const fetchStudents = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const response = await axios.get('https://quanlydaythem-api.onrender.com/api/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data);
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    try {
      if (editingId) {
        // Nếu là Cập nhật (Sửa) thì không gửi password
        await axios.put(`https://quanlydaythem-api.onrender.com/api/students/${editingId}`, {
          full_name: fullName,
          phone_number: phoneNumber,
          school_name: schoolName
        }, { headers: { Authorization: `Bearer ${token}` } });
        setMessage('✅ Cập nhật thông tin thành công!');
      } else {
        // Nếu là Tạo mới thì gửi kèm password
        await axios.post('https://quanlydaythem-api.onrender.com/api/students', {
          full_name: fullName,
          phone_number: phoneNumber,
          school_name: schoolName,
          password: password // Gắn mật khẩu vào đây
        }, { headers: { Authorization: `Bearer ${token}` } });
        setMessage('✅ Thêm học sinh thành công!');
      }

      setFullName('');
      setPhoneNumber('');
      setSchoolName('');
      setPassword('123456'); // Reset lại mật khẩu mặc định trên ô input
      setEditingId(null);
      fetchStudents();
    } catch (error: any) {
      setMessage(`❌ Lỗi: ${error.response?.data?.message || 'Có lỗi xảy ra'}`);
    }
  };

  const handleEditClick = (student: Student) => {
    setEditingId(student.id);
    setFullName(student.full_name);
    setPhoneNumber(student.phone_number);
    setSchoolName(student.school_name || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm('Bạn có chắc chắn muốn xóa học sinh này không?');
    if (!confirmDelete) return;

    const token = localStorage.getItem('token');
    try {
      await axios.delete(`https://quanlydaythem-api.onrender.com/api/students/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('✅ Đã xóa học sinh thành công!');
      fetchStudents();
    } catch (error) {
      setMessage('❌ Không thể xóa học sinh này.');
    }
  };

  // HÀM XỬ LÝ CẤP LẠI MẬT KHẨU
  const handleResetPassword = async (studentId: number, studentName: string) => {
    const newPassword = window.prompt(`Nhập mật khẩu MỚI cho học sinh ${studentName}:`);
    if (!newPassword) return; 

    try {
      const token = localStorage.getItem('token');
      await axios.put(`https://quanlydaythem-api.onrender.com/api/students/${studentId}/reset-password`, 
        { newPassword: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('✅ Đã cấp lại mật khẩu thành công!');
    } catch (error: any) {
      alert('❌ Lỗi: Không thể cấp lại mật khẩu.');
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '100%', boxSizing: 'border-box' }}>
      
      {/* 1. TIÊU ĐỀ TRANG */}
      <div style={{ marginBottom: '35px', paddingBottom: '15px' }}>
        <h1 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '30px' }}>Danh Sách Học Sinh</h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>Quản lý thông tin cá nhân và tài khoản đăng nhập của học viên.</p>
      </div>

      {/* 2. KHUNG THÊM / SỬA HỌC SINH MỚI */}
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)', marginBottom: '35px' }}>
        <h3 style={{ marginTop: 0, color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: editingId ? '#3b82f6' : '#8b5cf6', fontSize: '20px' }}>
            {editingId ? '✏️' : '➕'}
          </span> 
          {editingId ? 'Cập Nhật Thông Tin' : 'Thêm Học Sinh Mới'}
        </h3>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Họ và Tên" 
            value={fullName} 
            onChange={(e) => setFullName(e.target.value)} 
            style={{ flex: 1, minWidth: '200px', padding: '14px 15px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#f8fafc' }} 
            required
          />
          <input 
            type="text" 
            placeholder="Số điện thoại (Dùng làm Tên đăng nhập)" 
            value={phoneNumber} 
            onChange={(e) => setPhoneNumber(e.target.value)} 
            style={{ flex: 1, minWidth: '200px', padding: '14px 15px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#f8fafc' }} 
            required
          />
          <input 
            type="text" 
            placeholder="Trường học (Không bắt buộc)" 
            value={schoolName} 
            onChange={(e) => setSchoolName(e.target.value)} 
            style={{ flex: 1, minWidth: '200px', padding: '14px 15px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#f8fafc' }} 
          />
          
          {/* Ô Nhập Mật Khẩu (Chỉ hiện khi tạo mới, ẩn đi khi đang sửa) */}
          {!editingId && (
            <input 
              type="text" 
              placeholder="Mật khẩu" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              style={{ width: '120px', padding: '14px 15px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#f8fafc' }} 
              required
            />
          )}
          
          <button type="submit" style={{ padding: '14px 25px', backgroundColor: editingId ? '#3b82f6' : '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: editingId ? '0 4px 10px rgba(59, 130, 246, 0.2)' : '0 4px 10px rgba(16, 185, 129, 0.2)', transition: '0.2s' }}>
            {editingId ? 'Cập Nhật' : 'Lưu Mới'}
          </button>
          
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setFullName(''); setPhoneNumber(''); setSchoolName(''); }} style={{ padding: '14px 20px', backgroundColor: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}>
              Hủy
            </button>
          )}
        </form>
        {message && <p style={{ marginTop: '15px', fontWeight: 'bold', color: message.includes('❌') ? '#ef4444' : '#10b981' }}>{message}</p>}
      </div>
      
      {/* 3. BẢNG DANH SÁCH HỌC SINH */}
      <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)', overflow: 'hidden', marginBottom: '40px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '18px 25px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>ID</th>
                <th style={{ padding: '18px 25px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>Họ và Tên</th>
                <th style={{ padding: '18px 25px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>Tài khoản (SĐT)</th>
                <th style={{ padding: '18px 25px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>Trường</th>
                <th style={{ padding: '18px 25px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu học sinh.</td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9', transition: '0.2s', backgroundColor: editingId === student.id ? '#eff6ff' : 'white' }}>
                    <td style={{ padding: '20px 25px', color: '#64748b', fontWeight: 'bold' }}>#{student.id}</td>
                    <td style={{ padding: '20px 25px', color: '#0f172a', fontWeight: 'bold' }}>{student.full_name}</td>
                    <td style={{ padding: '20px 25px', color: '#0ea5e9', fontWeight: '600' }}>{student.phone_number}</td>
                    <td style={{ padding: '20px 25px', color: '#475569' }}>{student.school_name || '-'}</td>
                    <td style={{ padding: '20px 25px', textAlign: 'center' }}>
                      <button onClick={() => handleEditClick(student)} style={{ marginRight: '8px', padding: '8px 16px', backgroundColor: '#fef3c7', color: '#d97706', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}>Sửa</button>
                      <button onClick={() => handleDelete(student.id)} style={{ marginRight: '8px', padding: '8px 16px', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}>Xóa</button>
                      <button onClick={() => handleResetPassword(student.id, student.full_name)} style={{ padding: '8px 16px', backgroundColor: '#e0e7ff', color: '#4338ca', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}>🔑 Reset MK</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
};

export default StudentList;