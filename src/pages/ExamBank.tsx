import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';

const ExamBank = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchExams = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axiosClient.get('/api/exams');
      setExams(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '30px', color: '#0f172a' }}>🏦 Ngân Hàng Đề Thi</h1>
          <p style={{ margin: 0, color: '#64748b' }}>Quản lý kho đề thi đã bóc tách và sẵn sàng giao bài</p>
        </div>
        <button 
          onClick={() => navigate('/admin/create-exam')}
          style={{ padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)' }}
        >
          ✨ Tạo đề mới qua AI
        </button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.03)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '18px 20px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>ID / Mã Đề</th>
              <th style={{ padding: '18px 20px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Tiêu đề</th>
              <th style={{ padding: '18px 20px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Môn & Khối</th>
              <th style={{ padding: '18px 20px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Thời lượng</th>
              <th style={{ padding: '18px 20px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Đang tải dữ liệu...</td></tr>
            ) : exams.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Ngân hàng đề đang trống.</td></tr>
            ) : exams.map(exam => (
              <tr key={exam.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '18px 20px', color: '#64748b', fontWeight: 'bold' }}>{exam.id}</td>
                <td style={{ padding: '18px 20px', fontWeight: 'bold', color: '#0f172a', fontSize: '16px' }}>{exam.title}</td>
                <td style={{ padding: '18px 20px', color: '#475569' }}>
                  {exam.subject || 'Chưa cập nhật'} <br/>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>Khối: {exam.grade || '---'}</span>
                </td>
                <td style={{ padding: '18px 20px', color: '#475569' }}>{exam.duration_minutes} phút</td>
                <td style={{ padding: '18px 20px' }}>
                  <span style={{ padding: '6px 12px', backgroundColor: exam.status === 'PUBLISHED' ? '#dcfce7' : '#fef9c3', color: exam.status === 'PUBLISHED' ? '#166534' : '#854d0e', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                    {exam.status === 'PUBLISHED' ? 'Đã duyệt' : 'Bản nháp'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExamBank;

