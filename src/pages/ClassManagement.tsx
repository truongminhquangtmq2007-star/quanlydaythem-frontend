import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';
import type { ClassInfo } from '../types/core';

const ClassManagement = () => {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newClass, setNewClass] = useState({ class_code: '', name: '', subject: '', max_students: 20, class_type: 'OFFLINE', meet_link: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axiosClient.get('/api/classes');
      setClasses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axiosClient.post('/api/classes', newClass);
      setShowModal(false);
      setNewClass({ class_code: '', name: '', subject: '', max_students: 20, class_type: 'OFFLINE', meet_link: '' });
      fetchClasses();
    } catch (err) {
      alert('Lỗi tạo lớp học');
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '30px', color: '#0f172a' }}>📚 Quản lý Lớp học</h1>
          <p style={{ margin: 0, color: '#64748b' }}>Hệ thống lớp học cốt lõi (Giai đoạn 1)</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          style={{ padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)' }}
        >
          + Tạo lớp mới
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>Đang tải danh sách lớp...</div>
      ) : classes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', backgroundColor: 'white', borderRadius: '16px', color: '#64748b' }}>Chưa có lớp học nào.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
          {classes.map(cls => (
            <div 
              key={cls.id} 
              onClick={() => navigate(`/classes/${cls.id}`)}
              style={{ padding: '25px', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.03)', cursor: 'pointer', transition: 'all 0.2s ease', border: '1px solid #f1f5f9', position: 'relative', overflow: 'hidden' }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#3b82f6' }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', marginTop: '5px' }}>
                <span style={{ padding: '6px 12px', backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}>
                  {cls.class_code || `Mã: ${cls.id}`}
                </span>
                <span style={{ color: '#10b981', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                  Hoạt động
                </span>
              </div>
              <h3 style={{ margin: '0 0 15px 0', color: '#0f172a', fontSize: '22px' }}>{cls.name || cls.class_name}</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', color: '#64748b', fontSize: '14px' }}>
                  <span style={{ width: '80px' }}>Môn học:</span>
                  <strong style={{ color: '#334155' }}>{cls.subject || 'Chưa cập nhật'}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', color: '#64748b', fontSize: '14px' }}>
                  <span style={{ width: '80px' }}>Sĩ số tối đa:</span>
                  <strong style={{ color: '#334155' }}>{cls.max_students || 20}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'white', padding: '35px', borderRadius: '20px', width: '400px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <h2 style={{ margin: '0 0 25px 0', color: '#0f172a' }}>Tạo Lớp Mới</h2>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Mã lớp</label>
                <input required value={newClass.class_code} onChange={e => setNewClass({...newClass, class_code: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none' }} placeholder="VD: TOAN10A1" />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Tên lớp</label>
                <input required value={newClass.name} onChange={e => setNewClass({...newClass, name: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none' }} placeholder="VD: Lớp Toán Thầy Minh" />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Môn học</label>
                <input value={newClass.subject} onChange={e => setNewClass({...newClass, subject: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none' }} placeholder="VD: Toán" />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Hình thức học</label>
                <select value={newClass.class_type} onChange={e => setNewClass({...newClass, class_type: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none' }}>
                  <option value="OFFLINE">Học Trực tiếp (Offline)</option>
                  <option value="ONLINE">Học Trực tuyến (Online)</option>
                </select>
              </div>
              {newClass.class_type === 'ONLINE' && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Google Meet Link</label>
                  <input value={newClass.meet_link} onChange={e => setNewClass({...newClass, meet_link: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none' }} placeholder="VD: https://meet.google.com/abc-xyz" />
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '30px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 'bold', cursor: 'pointer' }}>Hủy</button>
                <button type="submit" style={{ padding: '12px 24px', borderRadius: '10px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Tạo Lớp</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;

