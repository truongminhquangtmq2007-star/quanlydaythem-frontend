import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const studentId = localStorage.getItem('studentId') || '1'; 

  const [sessions, setSessions] = useState<any[]>([]);

  const fetchSchedule = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/student/login'); return; }
    try {
      const res = await axios.get(`[https://quanlydaythem-api.onrender.com](https://quanlydaythem-api.onrender.com)/api/sessions/published?student_id=${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessions(res.data);
    } catch (error) { console.error("Lỗi lấy lộ trình"); }
  }, [studentId, navigate]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  return (
    <div style={{ backgroundColor: '#f1f5f9', minHeight: '100vh', fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif", paddingBottom: '50px' }}>
      
      {/* BANNER HEADER CÙNG PHONG CÁCH VỚI PHÒNG THI */}
      <div style={{ 
        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', 
        padding: '50px 40px 100px 40px', 
        color: 'white', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '32px', fontWeight: '800', letterSpacing: '1px' }}>
          TIẾN ĐỘ HỌC TẬP
        </h1>
        <p style={{ margin: 0, fontSize: '16px', opacity: 0.9, fontWeight: '500' }}>
          Theo dõi lộ trình bài giảng và đánh giá chi tiết từ giáo viên.
        </p>
      </div>

      {/* THÂN TRANG TRÀN LÊN TRÊN */}
      <div style={{ maxWidth: '1200px', margin: '-50px auto 0 auto', padding: '0 20px', position: 'relative', zIndex: 10 }}>
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.02)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            {sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                <div style={{ fontSize: '50px', marginBottom: '15px', opacity: 0.5 }}>📭</div>
                <h3 style={{ color: '#475569', margin: '0 0 10px 0' }}>Chưa có dữ liệu</h3>
                <p style={{ color: '#94a3b8', margin: 0 }}>Lịch học và nhận xét từ giáo viên sẽ hiển thị tại đây.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    <th style={{ padding: '20px 25px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0', fontWeight: '800' }}>Thời gian</th>
                    <th style={{ padding: '20px 25px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0', fontWeight: '800' }}>Nội dung & BTVN</th>
                    <th style={{ padding: '20px 25px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0', textAlign: 'center', fontWeight: '800' }}>Điểm danh</th>
                    <th style={{ padding: '20px 25px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0', textAlign: 'center', fontWeight: '800' }}>Đánh giá</th>
                    <th style={{ padding: '20px 25px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0', fontWeight: '800' }}>Lời khuyên</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => {
                    const isEvaluated = session.focus_level != null;
                    const rowBgColor = session.is_paid ? '#f0fdf4' : (isEvaluated ? 'white' : '#f8fafc');

                    return (
                      <tr key={session.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: rowBgColor, transition: '0.2s' }}>
                        <td style={{ padding: '20px 25px' }}>
                          <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '15px' }}>
                            {session.session_date ? new Date(session.session_date).toLocaleDateString('vi-VN') : ''}
                          </div>
                          <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '6px', fontWeight: 'bold' }}>
                            {session.start_time ? session.start_time.slice(0, 5) : ''}
                          </div>
                        </td>
                        <td style={{ padding: '20px 25px' }}>
                          <div style={{ fontWeight: 'bold', color: '#0284c7', fontSize: '16px', marginBottom: '8px' }}>{session.content}</div>
                          {session.homework && (
                            <div style={{ fontSize: '13px', color: '#047857', backgroundColor: '#d1fae5', padding: '6px 12px', borderRadius: '8px', display: 'inline-block', fontWeight: '600' }}>
                              📌 BTVN: {session.homework}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '20px 25px', textAlign: 'center' }}>
                          {isEvaluated ? (
                            session.is_present 
                            ? <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>Có mặt</span> 
                            : <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>Vắng</span>
                          ) : (
                            <span style={{ color: '#cbd5e1', fontStyle: 'italic', fontSize: '13px', fontWeight: 'bold' }}>Chưa cập nhật</span>
                          )}
                        </td>
                        <td style={{ padding: '20px 25px', textAlign: 'center', fontSize: '18px' }}>
                          {isEvaluated ? <span style={{ fontWeight: '900', color: '#f59e0b' }}>{session.focus_level}</span> : <span style={{ color: '#cbd5e1' }}>-</span>}
                        </td>
                        <td style={{ padding: '20px 25px', color: '#475569', fontSize: '14px', lineHeight: '1.5' }}>
                          {isEvaluated ? (session.teacher_notes || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Không có ghi chú</span>) : <span style={{ color: '#cbd5e1' }}>-</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;