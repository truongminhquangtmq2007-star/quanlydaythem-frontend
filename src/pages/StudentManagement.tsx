import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';
import type { Student } from '../types/core';

const StudentManagement = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  
  const [showModal, setShowModal] = useState(false);
  const [newStudent, setNewStudent] = useState({ full_name: '', parent_phone: '', school: '', grade: '' });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const navigate = useNavigate();

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axiosClient.get('/api/students', { 
        params: { search, grade: gradeFilter },
        headers: { Authorization: `Bearer ${token}` } 
      });
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchStudents();
    }, 300); // debounce search
    return () => clearTimeout(delayDebounceFn);
  }, [search, gradeFilter]);

  
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;
    try {
      await axiosClient.put(`/api/students/${selectedStudentId}/reset-password`, { newPassword });
      alert('Đổi mật khẩu thành công');
      setShowPasswordModal(false);
      setNewPassword('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi đổi mật khẩu');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      // Thêm default phone để pass qua validation cũ nếu có
      await axiosClient.post('/api/students', { ...newStudent, phone: newStudent.parent_phone });
      setShowModal(false);
      setNewStudent({ full_name: '', parent_phone: '', school: '', grade: '' });
      fetchStudents();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi tạo học sinh');
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '30px', color: '#0f172a' }}>👨‍🎓 Hồ sơ Học sinh 360°</h1>
          <p style={{ margin: 0, color: '#64748b' }}>Quản lý danh sách và hồ sơ toàn diện của học sinh</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          style={{ padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)' }}
        >
          + Thêm học sinh
        </button>
      </div>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', backgroundColor: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div style={{ flex: 1 }}>
          <input 
            type="text" 
            placeholder="🔍 Tìm kiếm theo tên học sinh..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '12px 15px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none' }}
          />
        </div>
        <div style={{ width: '200px' }}>
          <select 
            value={gradeFilter} 
            onChange={(e) => setGradeFilter(e.target.value)}
            style={{ width: '100%', padding: '12px 15px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none', backgroundColor: 'white' }}
          >
            <option value="ALL">Tất cả các khối</option>
            <option value="10">Khối 10</option>
            <option value="11">Khối 11</option>
            <option value="12">Khối 12</option>
          </select>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.03)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '18px 20px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>ID / Mã HS</th>
              <th style={{ padding: '18px 20px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Họ Tên</th>
              <th style={{ padding: '18px 20px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Trường & Khối</th>
              <th style={{ padding: '18px 20px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>SĐT Phụ huynh</th>
              <th style={{ padding: '18px 20px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Đang tải dữ liệu...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Không tìm thấy học sinh nào.</td></tr>
            ) : students.map(student => (
              <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={() => navigate(`/students/${student.id}`)} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <td style={{ padding: '18px 20px', color: '#64748b', fontWeight: 'bold' }}>{student.student_code || student.id}</td>
                <td style={{ padding: '18px 20px', fontWeight: 'bold', color: '#0f172a', fontSize: '16px' }}>{student.full_name}</td>
                <td style={{ padding: '18px 20px', color: '#475569' }}>
                  {student.school || 'Chưa cập nhật'} <br/>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>Khối: {student.grade || '---'}</span>
                </td>
                <td style={{ padding: '18px 20px', color: '#475569' }}>{student.parent_phone || '---'}</td>
                <td style={{ padding: '18px 20px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedStudentId(student.id); setShowPasswordModal(true); }}
                      style={{ padding: '8px 12px', backgroundColor: '#fef3c7', color: '#d97706', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      🔑 Đổi MK
                    </button>
                    <button style={{ padding: '8px 16px', backgroundColor: '#eff6ff', color: '#3b82f6', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Xem Hồ Sơ</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'white', padding: '35px', borderRadius: '20px', width: '450px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <h2 style={{ margin: '0 0 25px 0', color: '#0f172a' }}>Thêm Học Sinh Mới</h2>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Họ Tên</label>
                <input required value={newStudent.full_name} onChange={e => setNewStudent({...newStudent, full_name: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none' }} placeholder="VD: Nguyễn Văn A" />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>SĐT Phụ huynh (dùng đăng nhập)</label>
                <input required value={newStudent.parent_phone} onChange={e => setNewStudent({...newStudent, parent_phone: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none' }} placeholder="VD: 0912345678" />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Trường</label>
                <input value={newStudent.school} onChange={e => setNewStudent({...newStudent, school: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none' }} placeholder="VD: THPT Chuyên Sư Phạm" />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Khối</label>
                <select value={newStudent.grade} onChange={e => setNewStudent({...newStudent, grade: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none', backgroundColor: 'white' }}>
                  <option value="">Chọn khối</option>
                  <option value="10">Khối 10</option>
                  <option value="11">Khối 11</option>
                  <option value="12">Khối 12</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '30px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 'bold', cursor: 'pointer' }}>Hủy</button>
                <button type="submit" style={{ padding: '12px 24px', borderRadius: '10px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Thêm Học Sinh</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;

