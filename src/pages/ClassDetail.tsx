import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useParams, useNavigate } from 'react-router-dom';
import type { ClassInfo, ClassMember, Session, Attendance } from '../types/core';

const ClassDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'MEMBERS' | 'SESSIONS' | 'ASSIGNMENTS' | 'ANALYTICS'>('MEMBERS');
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [members, setMembers] = useState<ClassMember[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [attendanceList, setAttendanceList] = useState<Attendance[]>([]);
  
  // States for assignments
  const [assignments, setAssignments] = useState<any[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [allDocs, setAllDocs] = useState<any[]>([]);
  const [newAssignment, setNewAssignment] = useState({ title: '', document_id: '', due_at: '' });

  // States for analytics
  const [weakTopics, setWeakTopics] = useState<any[]>([]);

  // States for adding a new member
  const [showAddMember, setShowAddMember] = useState(false);
  const [newStudentId, setNewStudentId] = useState('');

  const token = localStorage.getItem('token');

  const fetchData = async () => {
    try {
      const clsRes = await axiosClient.get(`/api/classes/${id}`);
      setClassInfo(clsRes.data);
      
      const membersRes = await axiosClient.get(`/api/classes/${id}/members`);
      setMembers(membersRes.data);

      const sessionsRes = await axiosClient.get(`/api/classes/${id}/sessions`);
      setSessions(sessionsRes.data);

      const assignRes = await axiosClient.get(`/api/classes/${id}/assignments`);
      setAssignments(assignRes.data);
      
      const analyticsRes = await axiosClient.get(`/api/analytics/classes/${id}/weak-topics`);
      setWeakTopics(analyticsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosClient.post(`/api/classes/${id}/members`, { student_id: newStudentId });
      setShowAddMember(false);
      setNewStudentId('');
      fetchData(); // reload
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi thêm học sinh');
    }
  };

  const handleCreateSession = async () => {
    const session_date = prompt('Nhập ngày cho buổi học (YYYY-MM-DD)', new Date().toISOString().split('T')[0]);
    if (!session_date) return;
    try {
      await axiosClient.post(`/api/classes/${id}/sessions`, { session_date, start_time: '18:00', end_time: '19:30' });
      fetchData();
    } catch (err) {
      alert('Lỗi tạo buổi học');
    }
  };

  const handleOpenAssignModal = async () => {
    try {
      const res = await axiosClient.get('/api/documents');
      setAllDocs(res.data);
      setShowAssignModal(true);
    } catch (err) {
      alert('Lỗi tải danh sách tài liệu');
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosClient.post(`/api/assignments`, { 
        ...newAssignment, 
        class_id: id 
      });
      setShowAssignModal(false);
      setNewAssignment({ title: '', document_id: '', due_at: '' });
      fetchData();
    } catch (err) {
      alert('Lỗi giao bài tập');
    }
  };

  const fetchAttendance = async (sessionId: number) => {
    try {
      const res = await axiosClient.get(`/api/classes/sessions/${sessionId}/attendance`);
      setAttendanceList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  
  const handleSyncCalendar = async () => {
    if (!activeSession) return;
    try {
      await axiosClient.post(`/api/sessions/${activeSession.id}/sync-calendar`);
      alert('Đồng bộ lại lịch Google thành công!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi đồng bộ lịch');
    }
  };

  const selectSession = (sess: Session) => {
    setActiveSession(sess);
    fetchAttendance(sess.id);
  };

  const handleUpdateAttendance = async (studentId: number, status: string) => {
    if (!activeSession) return;
    setAttendanceList(prev => prev.map(a => a.student_id === studentId ? { ...a, status: status as any } : a));
    try {
      await axiosClient.put(`/api/classes/sessions/${activeSession.id}/attendance`, 
        { student_id: studentId, status }
      );
    } catch (err) {
      alert('Lỗi cập nhật điểm danh');
      fetchAttendance(activeSession.id);
    }
  };

  if (!classInfo) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Đang tải dữ liệu lớp học...</div>;

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
      <button onClick={() => navigate('/classes')} style={{ marginBottom: '20px', padding: '10px 20px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: '0.2s' }}>
        ← Quay lại danh sách
      </button>

      {/* HEADER CARD */}
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', marginBottom: '30px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', margin: '0 0 15px 0' }}>
              <h1 style={{ margin: 0, fontSize: '32px', color: '#0f172a' }}>{classInfo.name || classInfo.class_name}</h1>
              {classInfo.class_type === 'ONLINE' ? (
                <span style={{ backgroundColor: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>📡 LỚP ONLINE</span>
              ) : (
                <span style={{ backgroundColor: '#fff7ed', color: '#f97316', border: '1px solid #fed7aa', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>🏫 LỚP OFFLINE</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '30px', color: '#64748b', fontSize: '15px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>Mã lớp: <strong style={{ color: '#334155', backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '6px' }}>{classInfo.class_code || '---'}</strong></span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>Môn học: <strong style={{ color: '#334155' }}>{classInfo.subject || '---'}</strong></span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>Sĩ số: <strong style={{ color: '#3b82f6' }}>{members.length}/{classInfo.max_students || 20}</strong></span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            {classInfo.class_type === 'ONLINE' && classInfo.meet_link && (
              <a href={classInfo.meet_link} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(59,130,246,0.3)' }}>
                🎥 Mở Link Meet
              </a>
            )}
            <button 
              onClick={async () => {
                if(window.confirm('Bạn có chắc chắn muốn xóa lớp học này không? Tất cả dữ liệu liên quan (học sinh, lịch học, điểm danh) sẽ bị xóa vĩnh viễn.')) {
                  try {
                    await axiosClient.delete(`/api/classes/${id}`);
                    alert('Đã xóa lớp học thành công.');
                    navigate('/classes');
                  } catch (err) {
                    alert('Lỗi khi xóa lớp học');
                  }
                }
              }}
              style={{ padding: '12px 24px', backgroundColor: '#ef4444', color: 'white', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(239,68,68,0.3)' }}
            >
              🗑️ Xóa lớp
            </button>
          </div>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
        <button 
          onClick={() => setActiveTab('MEMBERS')}
          style={{ padding: '14px 28px', borderRadius: '12px', border: 'none', backgroundColor: activeTab === 'MEMBERS' ? '#3b82f6' : 'white', color: activeTab === 'MEMBERS' ? 'white' : '#64748b', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', transition: '0.2s', boxShadow: activeTab === 'MEMBERS' ? '0 4px 10px rgba(59,130,246,0.3)' : '0 2px 5px rgba(0,0,0,0.02)' }}
        >
          👥 Danh sách Học sinh
        </button>
        <button 
          onClick={() => setActiveTab('SESSIONS')}
          style={{ padding: '14px 28px', borderRadius: '12px', border: 'none', backgroundColor: activeTab === 'SESSIONS' ? '#3b82f6' : 'white', color: activeTab === 'SESSIONS' ? 'white' : '#64748b', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', transition: '0.2s', boxShadow: activeTab === 'SESSIONS' ? '0 4px 10px rgba(59,130,246,0.3)' : '0 2px 5px rgba(0,0,0,0.02)' }}
        >
          📅 Quản lý Buổi học & Điểm danh
        </button>
        <button 
          onClick={() => setActiveTab('ASSIGNMENTS')}
          style={{ padding: '14px 28px', borderRadius: '12px', border: 'none', backgroundColor: activeTab === 'ASSIGNMENTS' ? '#3b82f6' : 'white', color: activeTab === 'ASSIGNMENTS' ? 'white' : '#64748b', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', transition: '0.2s', boxShadow: activeTab === 'ASSIGNMENTS' ? '0 4px 10px rgba(59,130,246,0.3)' : '0 2px 5px rgba(0,0,0,0.02)' }}
        >
          📝 Tài liệu & Bài tập
        </button>
        <button 
          onClick={() => setActiveTab('ANALYTICS')}
          style={{ padding: '14px 28px', borderRadius: '12px', border: 'none', backgroundColor: activeTab === 'ANALYTICS' ? '#3b82f6' : 'white', color: activeTab === 'ANALYTICS' ? 'white' : '#64748b', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', transition: '0.2s', boxShadow: activeTab === 'ANALYTICS' ? '0 4px 10px rgba(59,130,246,0.3)' : '0 2px 5px rgba(0,0,0,0.02)' }}
        >
          📊 Phân tích Lớp học
        </button>
      </div>

      {/* TAB CONTENT: MEMBERS */}
      {activeTab === 'MEMBERS' && (
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <h2 style={{ margin: 0, color: '#1e293b' }}>Học sinh trong lớp ({members.length})</h2>
            <button onClick={() => setShowAddMember(true)} style={{ padding: '10px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(16,185,129,0.3)' }}>+ Thêm học sinh</button>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '15px 20px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0', borderTopLeftRadius: '10px' }}>Mã HS</th>
                <th style={{ padding: '15px 20px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Họ Tên</th>
                <th style={{ padding: '15px 20px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Số điện thoại</th>
                <th style={{ padding: '15px 20px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Ngày tham gia</th>
                <th style={{ padding: '15px 20px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0', borderTopRightRadius: '10px' }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Lớp chưa có học sinh nào. Bấm "Thêm học sinh" để xếp lớp.</td></tr>
              ) : members.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9', transition: '0.2s' }}>
                  <td style={{ padding: '18px 20px', color: '#64748b', fontWeight: 'bold' }}>{m.student_code || `HS${m.student_id}`}</td>
                  <td style={{ padding: '18px 20px', fontWeight: 'bold', color: '#0f172a' }}>{m.full_name}</td>
                  <td style={{ padding: '18px 20px', color: '#475569' }}>{m.phone || '---'}</td>
                  <td style={{ padding: '18px 20px', color: '#475569' }}>{new Date(m.enroll_date).toLocaleDateString('vi-VN')}</td>
                  <td style={{ padding: '18px 20px' }}>
                    <span style={{ padding: '6px 12px', backgroundColor: m.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9', color: m.status === 'ACTIVE' ? '#166534' : '#64748b', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB CONTENT: SESSIONS */}
      {activeTab === 'SESSIONS' && (
        <div style={{ display: 'flex', gap: '25px', minHeight: '600px' }}>
          
          {/* Cột trái: Danh sách buổi học */}
          <div style={{ width: '320px', backgroundColor: 'white', padding: '25px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h3 style={{ margin: 0, color: '#1e293b' }}>Lịch sử Buổi học</h3>
              <button onClick={handleCreateSession} style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', boxShadow: '0 4px 6px rgba(59,130,246,0.2)' }}>+ Tạo buổi</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flex: 1, paddingRight: '5px' }}>
              {sessions.length === 0 ? (
                <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>Chưa có buổi học nào được tạo.</div>
              ) : sessions.map(sess => (
                <div 
                  key={sess.id} 
                  onClick={() => selectSession(sess)}
                  style={{ 
                    padding: '16px', borderRadius: '12px', cursor: 'pointer', border: '2px solid', transition: '0.2s',
                    borderColor: activeSession?.id === sess.id ? '#3b82f6' : '#f1f5f9', 
                    backgroundColor: activeSession?.id === sess.id ? '#eff6ff' : 'white' 
                  }}
                >
                  <div style={{ fontWeight: 'bold', fontSize: '15px', color: activeSession?.id === sess.id ? '#1d4ed8' : '#334155' }}>
                    Ngày {new Date(sess.session_date).toLocaleDateString('vi-VN')}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b', marginTop: '6px', fontWeight: '500' }}>
                    🕒 {sess.start_time ? sess.start_time.substring(0,5) : '18:00'} - {sess.end_time ? sess.end_time.substring(0,5) : '19:30'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cột phải: Chi tiết Điểm danh */}
          <div style={{ flex: 1, backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
            {!activeSession ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: '40px', marginBottom: '15px' }}>👈</div>
                <div style={{ fontSize: '18px', fontWeight: '500' }}>Chọn một buổi học bên trái để xem và điểm danh</div>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <h2 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '24px' }}>Bảng Điểm Danh - {new Date(activeSession.session_date).toLocaleDateString('vi-VN')}</h2>
                      <button onClick={handleSyncCalendar} style={{ padding: '6px 12px', backgroundColor: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>🔄 Đồng bộ Calendar</button>
                    </div>
                    <div style={{ color: '#64748b', fontSize: '15px' }}>Dữ liệu điểm danh được <strong style={{color: '#10b981'}}>lưu tự động ngay lập tức</strong> khi bạn click vào trạng thái.</div>
                  </div>
                  <div style={{ padding: '8px 16px', backgroundColor: '#f1f5f9', borderRadius: '8px', color: '#475569', fontWeight: 'bold' }}>
                    Sĩ số tham gia: {attendanceList.length}
                  </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '15px 20px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9', width: '35%' }}>Học sinh</th>
                      <th style={{ padding: '15px 20px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9' }}>Trạng thái Điểm danh nhanh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceList.length === 0 ? (
                      <tr><td colSpan={2} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Không có dữ liệu điểm danh cho buổi này.</td></tr>
                    ) : attendanceList.map(a => (
                      <tr key={a.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={{ padding: '20px', fontWeight: 'bold', color: '#1e293b', fontSize: '16px' }}>
                          {a.full_name} <br/>
                          <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 'normal' }}>ID: {a.student_code || a.student_id}</span>
                        </td>
                        <td style={{ padding: '20px' }}>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                              onClick={() => handleUpdateAttendance(a.student_id, 'PRESENT')}
                              style={{ 
                                padding: '10px 16px', borderRadius: '8px', border: '2px solid', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s',
                                backgroundColor: a.status === 'PRESENT' ? '#10b981' : 'white', 
                                color: a.status === 'PRESENT' ? 'white' : '#10b981', 
                                borderColor: '#10b981',
                                opacity: a.status === 'PRESENT' ? 1 : 0.6
                              }}>✅ Có mặt</button>
                            
                            <button 
                              onClick={() => handleUpdateAttendance(a.student_id, 'LATE')}
                              style={{ 
                                padding: '10px 16px', borderRadius: '8px', border: '2px solid', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s',
                                backgroundColor: a.status === 'LATE' ? '#f59e0b' : 'white', 
                                color: a.status === 'LATE' ? 'white' : '#f59e0b', 
                                borderColor: '#f59e0b',
                                opacity: a.status === 'LATE' ? 1 : 0.6
                              }}>⏰ Đi muộn</button>
                            
                            <button 
                              onClick={() => handleUpdateAttendance(a.student_id, 'ABSENT_EXCUSED')}
                              style={{ 
                                padding: '10px 16px', borderRadius: '8px', border: '2px solid', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s',
                                backgroundColor: a.status === 'ABSENT_EXCUSED' ? '#f97316' : 'white', 
                                color: a.status === 'ABSENT_EXCUSED' ? 'white' : '#f97316', 
                                borderColor: '#f97316',
                                opacity: a.status === 'ABSENT_EXCUSED' ? 1 : 0.6
                              }}>📝 Vắng phép</button>
                            
                            <button 
                              onClick={() => handleUpdateAttendance(a.student_id, 'ABSENT_UNEXCUSED')}
                              style={{ 
                                padding: '10px 16px', borderRadius: '8px', border: '2px solid', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s',
                                backgroundColor: a.status === 'ABSENT_UNEXCUSED' ? '#ef4444' : 'white', 
                                color: a.status === 'ABSENT_UNEXCUSED' ? 'white' : '#ef4444', 
                                borderColor: '#ef4444',
                                opacity: a.status === 'ABSENT_UNEXCUSED' ? 1 : 0.6
                              }}>❌ Vắng K/P</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: ASSIGNMENTS */}
      {activeTab === 'ASSIGNMENTS' && (
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <h2 style={{ margin: 0, color: '#1e293b' }}>Bài tập đã giao ({assignments.length})</h2>
            <button onClick={handleOpenAssignModal} style={{ padding: '10px 20px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(139,92,246,0.3)' }}>+ Giao bài tập mới</button>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '15px 20px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0', borderTopLeftRadius: '10px' }}>Tiêu đề Giao bài</th>
                <th style={{ padding: '15px 20px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Tài liệu gốc</th>
                <th style={{ padding: '15px 20px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Ngày Giao</th>
                <th style={{ padding: '15px 20px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Hạn chót (Due Date)</th>
                <th style={{ padding: '15px 20px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0', borderTopRightRadius: '10px', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Chưa có bài tập nào được giao cho lớp này.</td></tr>
              ) : assignments.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9', transition: '0.2s' }}>
                  <td style={{ padding: '18px 20px', fontWeight: 'bold', color: '#0f172a' }}>{a.title}</td>
                  <td style={{ padding: '18px 20px', color: '#475569' }}>
                    <span style={{ padding: '4px 8px', backgroundColor: '#eff6ff', color: '#3b82f6', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', marginRight: '8px' }}>{a.document_type}</span>
                    {a.document_title}
                  </td>
                  <td style={{ padding: '18px 20px', color: '#475569' }}>{new Date(a.created_at).toLocaleDateString('vi-VN')}</td>
                  <td style={{ padding: '18px 20px' }}>
                    {a.due_at ? (
                      <span style={{ padding: '6px 12px', backgroundColor: new Date(a.due_at) < new Date() ? '#fef2f2' : '#fefce8', color: new Date(a.due_at) < new Date() ? '#ef4444' : '#b45309', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}>
                        {new Date(a.due_at).toLocaleDateString('vi-VN')} {new Date(a.due_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    ) : 'Không có hạn'}
                  </td>
                  <td style={{ padding: '18px 20px', textAlign: 'right' }}>
                    <a href={a.file_url} target="_blank" rel="noreferrer" style={{ padding: '8px 16px', backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px' }}>Mở Đề</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB CONTENT: ANALYTICS */}
      {activeTab === 'ANALYTICS' && (
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#1e293b' }}>📊 Phân Tích Những Chuyên Đề Yếu Nhất Lớp</h2>
          {weakTopics.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Chưa có đủ dữ liệu bài làm để phân tích lớp.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {weakTopics.map((t, idx) => {
                const rate = Number(t.accuracy_rate);
                let color = '#10b981'; // Green
                let icon = '✅';
                if (rate < 50) {
                  color = '#ef4444'; // Red
                  icon = '⚠️';
                } else if (rate < 80) {
                  color = '#f59e0b'; // Yellow
                  icon = '⚡';
                }

                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 'bold', color: '#334155' }}>{icon} {t.topic}</span>
                      <span style={{ fontWeight: 'bold', color }}>{rate}% ({t.total_corrects}/{t.total_attempts})</span>
                    </div>
                    <div style={{ width: '100%', height: '12px', backgroundColor: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{ width: `${rate}%`, height: '100%', backgroundColor: color, borderRadius: '6px', transition: 'width 0.5s' }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal Thêm Học Sinh */}
      {showAddMember && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'white', padding: '35px', borderRadius: '20px', width: '450px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <h2 style={{ margin: '0 0 25px 0', color: '#0f172a' }}>Thêm Học Sinh Vào Lớp</h2>
            <form onSubmit={handleAddMember}>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#475569', fontSize: '14px' }}>ID Học sinh</label>
                <input required value={newStudentId} onChange={e => setNewStudentId(e.target.value)} type="number" placeholder="Nhập ID học sinh (Ví dụ: 1, 2, 3...)" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none', fontSize: '15px' }} />
                <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#64748b' }}>*Bạn có thể xem ID học sinh ở menu Học viên.</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowAddMember(false)} style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#f1f5f9', color: '#475569', cursor: 'pointer', fontWeight: 'bold' }}>Hủy</button>
                <button type="submit" style={{ padding: '12px 24px', borderRadius: '10px', border: 'none', backgroundColor: '#10b981', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Thêm Học Sinh</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Giao Bài Tập */}
      {showAssignModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'white', padding: '35px', borderRadius: '20px', width: '500px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <h2 style={{ margin: '0 0 25px 0', color: '#0f172a' }}>Giao Bài Tập Cho Lớp</h2>
            <form onSubmit={handleCreateAssignment}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Tiêu đề giao bài</label>
                <input required value={newAssignment.title} onChange={e => setNewAssignment({...newAssignment, title: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none' }} placeholder="VD: Bài tập về nhà tuần 1" />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Chọn Tài Liệu / Đề Thi gốc</label>
                <select required value={newAssignment.document_id} onChange={e => setNewAssignment({...newAssignment, document_id: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: 'white' }}>
                  <option value="">-- Chọn tài liệu trong kho --</option>
                  {allDocs.map(d => <option key={d.id} value={d.id}>[{d.type}] {d.title}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Hạn chót nộp bài (Due Date)</label>
                <input required type="datetime-local" value={newAssignment.due_at} onChange={e => setNewAssignment({...newAssignment, due_at: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowAssignModal(false)} style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#f1f5f9', color: '#475569', cursor: 'pointer', fontWeight: 'bold' }}>Hủy</button>
                <button type="submit" style={{ padding: '12px 24px', borderRadius: '10px', border: 'none', backgroundColor: '#8b5cf6', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Giao Bài Tập</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassDetail;

