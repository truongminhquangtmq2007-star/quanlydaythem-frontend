import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useParams, useNavigate } from 'react-router-dom';
import type { ClassInfo, ClassMember, Session, Attendance } from '../types/core';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';

const ClassDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'MEMBERS' | 'SESSIONS' | 'ASSIGNMENTS' | 'ANALYTICS'>('MEMBERS');
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [members, setMembers] = useState<ClassMember[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [attendanceList, setAttendanceList] = useState<Attendance[]>([]);
  const [showAbsentModal, setShowAbsentModal] = useState<any>(null);
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [evalData, setEvalData] = useState<any>({ student_id: 0, student_name: '', teacher_notes: '', focus_level: 'Bình thường' });
  
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axiosClient.get(`/api/students/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSearchResults(res.data);
      } catch (err) {
        console.error(err);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);
  const [allStudents, setAllStudents] = useState<any[]>([]);

  const token = localStorage.getItem('token');

  
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const delay = setTimeout(() => {
        axiosClient.get(`/api/students/search?q=${encodeURIComponent(searchQuery)}`)
          .then(res => setAllStudents(res.data));
      }, 500);
      return () => clearTimeout(delay);
    } else {
      setAllStudents([]);
    }
  }, [searchQuery]);

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

  const [savingSession, setSavingSession] = useState(false);

  const handleCreateSession = () => {
    setEditingSession({ 
      class_id: id, 
      session_date: new Date().toISOString().split('T')[0], 
      start_time: '18:00', 
      end_time: '19:30',
      content: '', 
      homework: '' 
    });
    setShowSessionModal(true);
  };

  const handleEditSession = (sess: any) => {
    setEditingSession({ 
      ...sess, 
      start_time: sess.start_time ? sess.start_time.substring(0,5) : '18:00',
      end_time: sess.end_time ? sess.end_time.substring(0,5) : '19:30',
      content: sess.content || '',
      homework: sess.homework || ''
    });
    setShowSessionModal(true);
  };

  const handleSaveSession = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingSession || !editingSession.session_date) {
      alert('Vui lòng chọn ngày học!');
      return;
    }
    setSavingSession(true);
    try {
      if (editingSession.id) {
        await axiosClient.post('/api/sessions/upsert', editingSession);
      } else {
        await axiosClient.post(`/api/classes/${id}/sessions`, editingSession);
      }
      setShowSessionModal(false);
      const sessionsRes = await axiosClient.get(`/api/classes/${id}/sessions`);
      setSessions(sessionsRes.data);
      alert('Lưu buổi học thành công!');
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Lỗi khi lưu buổi học');
    } finally {
      setSavingSession(false);
    }
  };
  
  const handleDeleteSession = async (sessId: number) => {
    if (!window.confirm("Xóa buổi học này?")) return;
    try {
       await axiosClient.delete(`/api/sessions/${sessId}`);
       if (activeSession?.id === sessId) setActiveSession(null);
       const sessionsRes = await axiosClient.get(`/api/classes/${id}/sessions`);
       setSessions(sessionsRes.data);
    } catch(err) {
       alert('Lỗi xóa');
    }
  };


  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);
    const [isAssigning, setIsAssigning] = useState(false);
    
    const handleOpenAssignModal = async () => {
      try {
        const res = await axiosClient.get(`/api/classes/${id}/assignable-documents`);
        setAllDocs(res.data);
        
        // Auto select documents that already belong to this class
        const alreadyAssigned = res.data.filter((d: any) => d.folder_class_id === Number(id)).map((d: any) => d.id);
        setSelectedDocIds(alreadyAssigned);
        
        setShowAssignModal(true);
      } catch (err) {
        alert('Lỗi tải danh sách tài liệu');
      }
    };

  const handleCreateAssignment = async (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedDocIds.length === 0) {
        alert('Vui lòng chọn ít nhất 1 tài liệu.');
        return;
      }
      setIsAssigning(true);
      try {
        await axiosClient.post(`/api/classes/${id}/assign-documents`, { 
          document_ids: selectedDocIds 
        });
        alert('Gán tài liệu vào lớp thành công.');
        setShowAssignModal(false);
        fetchData(); // refresh assignments list
      } catch (err) {
        alert('Lỗi giao tài liệu/đề thi');
      } finally {
        setIsAssigning(false);
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

  
  const handlePublishSession = async () => {
        if (!window.confirm("Công bố các buổi học (Nháp) của lớp này cho phụ huynh/học sinh?")) return;
        try {
            await axiosClient.post('/api/sessions/publish', { class_id: id });
            alert("Đã công bố!");
            const sessionsRes = await axiosClient.get(`/api/classes/${id}/sessions`);
            setSessions(sessionsRes.data);
        } catch(err) {
            alert("Lỗi");
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

  const handleOpenEval = async (studentId: number, studentName: string) => {
    setEvalData({ student_id: studentId, student_name: studentName, teacher_notes: '', focus_level: 'Bình thường' });
    try {
      const res = await axiosClient.get(`/api/sessions/evaluations?session_id=${activeSession?.id}&student_id=${studentId}`);
      if (res.data && res.data.length > 0) {
        setEvalData({ student_id: studentId, student_name: studentName, teacher_notes: res.data[0].teacher_notes || '', focus_level: res.data[0].focus_level || 'Bình thường' });
      }
    } catch(e) {}
    setShowEvalModal(true);
  };
  
  const handleSaveEval = async () => {
    if (!activeSession) return;
    try {
      await axiosClient.post('/api/sessions/evaluate', {
        session_id: activeSession.id,
        student_id: evalData.student_id,
        is_present: true,
        focus_level: evalData.focus_level,
        teacher_notes: evalData.teacher_notes
      });
      setShowEvalModal(false);
      alert("Đã lưu nhận xét");
    } catch(e) { alert("Lỗi lưu nhận xét"); }
  };
  
  const handleUpdateAttendance = async (studentId: number, status: string, notes?: string) => {
    if (!activeSession) return;
    setAttendanceList(prev => prev.map(a => a.student_id === studentId ? { ...a, status: status as any, notes: notes !== undefined ? notes : a.notes } : a));
    try {
      await axiosClient.put(`/api/classes/sessions/${activeSession.id}/attendance`, 
        { student_id: studentId, status, note: notes || '', absent_reason: notes || '' }
      );
    } catch (err) {
      alert('Lỗi cập nhật điểm danh');
      fetchAttendance(activeSession.id);
    }
  };

  if (!classInfo) return <div style={{ padding: 'var(--spacing-10)' }}><EmptyState title="Đang tải dữ liệu lớp học..." /></div>;

  return (
    <div style={{ padding: 'var(--spacing-8)', maxWidth: '1200px', margin: '0 auto' }}>
      <Button onClick={() => navigate('/classes')} variant="outline" style={{ marginBottom: 'var(--spacing-5)' }}>
        ← Quay lại danh sách
      </Button>

      {/* HEADER CARD */}
      <Card style={{ marginBottom: 'var(--spacing-8)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', margin: '0 0 15px 0' }}>
              <h1 style={{ margin: 0, fontSize: 'var(--font-size-3xl)', color: 'var(--color-text)' }}>{classInfo.class_name || classInfo.class_name}</h1>
              {classInfo.class_type === 'ONLINE' ? (
                <Badge variant="info">📡 LỚP ONLINE</Badge>
              ) : (
                <Badge variant="warning">🏫 LỚP OFFLINE</Badge>
              )}
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-8)', color: 'var(--color-text-secondary)', fontSize: '15px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>Mã lớp: <strong style={{ color: '#334155', backgroundColor: 'var(--color-background)', padding: '4px 10px', borderRadius: '6px' }}>{classInfo.id || '---'}</strong></span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>Môn học: <strong style={{ color: '#334155' }}>{classInfo.class_type || '---'}</strong></span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>Sĩ số: <strong style={{ color: 'var(--color-primary)' }}>{members.length}/{classInfo.current_students || 20}</strong></span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-4)' }}>
            {classInfo.class_type === 'ONLINE' && classInfo.meet_link && (
              <a href={classInfo.meet_link} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                <Button variant="primary">🎥 Mở Link Meet</Button>
              </a>
            )}
            <Button 
              variant="danger"
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
            >
              🗑️ Xóa lớp
            </Button>
          </div>
        </div>
      </Card>

      {/* TAB NAVIGATION */}
      <div style={{ display: 'flex', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)' }}>
        <Button onClick={() => setActiveTab('MEMBERS')} variant={activeTab === 'MEMBERS' ? 'primary' : 'outline'}>👥 Danh sách Học sinh</Button>
        <Button onClick={() => setActiveTab('SESSIONS')} variant={activeTab === 'SESSIONS' ? 'primary' : 'outline'}>📅 Quản lý Buổi học</Button>
        <Button onClick={() => setActiveTab('ASSIGNMENTS')} variant={activeTab === 'ASSIGNMENTS' ? 'primary' : 'outline'}>📝 Tài liệu & Bài tập</Button>
        <Button onClick={() => setActiveTab('ANALYTICS')} variant={activeTab === 'ANALYTICS' ? 'primary' : 'outline'}>📊 Phân tích Lớp học</Button>
      </div>

      {/* TAB CONTENT: MEMBERS */}
      {activeTab === 'MEMBERS' && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
            <h2 style={{ margin: 0, color: 'var(--color-text)' }}>Học sinh trong lớp ({members.length})</h2>
            <Button onClick={() => setShowAddMember(true)} variant="primary">+ Thêm học sinh</Button>
          </div>
          
          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-background)' }}>
                  <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)', borderTopLeftRadius: '10px' }}>Mã HS</th>
                  <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)' }}>Họ Tên</th>
                  <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)' }}>Số điện thoại</th>
                  <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)' }}>Ngày tham gia</th>
                  <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)', borderTopRightRadius: '10px' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: 'var(--spacing-10)' }}><EmptyState title="Lớp chưa có học sinh nào." description="Bấm Thêm học sinh để xếp lớp." /></td></tr>
                ) : members.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--color-background)', transition: '0.2s' }}>
                    <td style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-bold)' }}>{m.student_code || `HS${m.student_id}`}</td>
                    <td style={{ padding: 'var(--spacing-4)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text)' }}>{m.full_name}</td>
                    <td style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)' }}>{m.phone || '---'}</td>
                    <td style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)' }}>{new Date(m.enroll_date).toLocaleDateString('vi-VN')}</td>
                    <td style={{ padding: 'var(--spacing-4)' }}>
                      <Badge variant={m.status === 'ACTIVE' ? 'primary' : 'neutral'}>
                        {m.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB CONTENT: SESSIONS */}
      {activeTab === 'SESSIONS' && (
        <div style={{ display: 'flex', gap: 'var(--spacing-6)', minHeight: '600px' }}>
          
          {/* Cột trái: Danh sách buổi học */}
          <Card style={{ width: '320px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
              <h3 style={{ margin: 0, color: 'var(--color-text)' }}>Lịch sử Buổi học</h3>
              <Button onClick={handleCreateSession} variant="primary" size="sm">+ Tạo buổi</Button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)', overflowY: 'auto', flex: 1, paddingRight: 'var(--spacing-1)' }}>
              {sessions.length === 0 ? (
                <EmptyState title="Chưa có buổi học nào" />
              ) : sessions.map(sess => (
                <div 
                  key={sess.id} 
                  onClick={() => selectSession(sess)}
                  style={{ 
                    padding: 'var(--spacing-4)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', border: '2px solid', transition: '0.2s',
                    borderColor: activeSession?.id === sess.id ? 'var(--color-primary)' : 'var(--color-background)', 
                    backgroundColor: activeSession?.id === sess.id ? '#eff6ff' : 'var(--color-surface)' 
                  }}
                >
                  <div style={{ fontWeight: 'var(--font-weight-bold)', fontSize: '15px', color: activeSession?.id === sess.id ? 'var(--color-primary)' : '#334155' }}>
                    Ngày {new Date(sess.session_date).toLocaleDateString('vi-VN')}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: '6px', fontWeight: 'var(--font-weight-medium)' }}>
                    🕒 {sess.start_time ? sess.start_time.substring(0,5) : '18:00'}
                  </div>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                    <Button onClick={(e) => { e.stopPropagation(); handleEditSession(sess); }} variant="outline" size="sm" style={{ padding: '2px 8px', fontSize: '12px' }}>Sửa</Button>
                    <Button onClick={(e) => { e.stopPropagation(); handleDeleteSession(sess.id); }} variant="danger" size="sm" style={{ padding: '2px 8px', fontSize: '12px' }}>Xóa</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Cột phải: Chi tiết Điểm danh */}
          <Card style={{ flex: 1 }}>
            {!activeSession ? (
              <EmptyState title="Chọn một buổi học bên trái để xem và điểm danh" />
            ) : (
              <div>
                <div style={{ marginBottom: 'var(--spacing-8)', paddingBottom: 'var(--spacing-5)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
                      <h2 style={{ margin: '0 0 8px 0', color: 'var(--color-text)', fontSize: 'var(--font-size-2xl)' }}>Bảng Điểm Danh - {new Date(activeSession.session_date).toLocaleDateString('vi-VN')}</h2>
                      <Button onClick={handlePublishSession} variant="primary" size="sm">🚀 Công bố</Button>
                      <Button onClick={handleSyncCalendar} variant="secondary" size="sm">🔄 Đồng bộ</Button>
                    </div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>Dữ liệu điểm danh được <strong style={{color: 'var(--color-success)'}}>lưu tự động ngay lập tức</strong>.</div>
                  </div>
                  <div style={{ padding: '8px 16px', backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-bold)' }}>
                    Sĩ số tham gia: {attendanceList.length}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-background)', width: '35%' }}>Học sinh</th>
                        <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-background)' }}>Trạng thái Điểm danh nhanh</th>
     <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-background)', textAlign: 'center' }}>Nhận xét</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceList.length === 0 ? (
                        <tr><td colSpan={2} style={{ padding: 'var(--spacing-10)' }}><EmptyState title="Không có dữ liệu điểm danh cho buổi này." /></td></tr>
                      ) : attendanceList.map(a => (
                        <tr key={a.id} style={{ borderBottom: '1px solid var(--color-background)' }}>
                          <td style={{ padding: 'var(--spacing-5)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text)', fontSize: 'var(--font-size-base)' }}>
                            {a.full_name} <br/>
                            <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', fontWeight: 'normal' }}>ID: {a.student_code || a.student_id}</span>
                          </td>
                          <td style={{ padding: 'var(--spacing-5)' }}>
                            <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                              <Button 
                                onClick={() => handleUpdateAttendance(a.student_id, 'PRESENT')}
                                variant={a.status === 'PRESENT' ? 'primary' : 'outline'}
                              >✅ Có mặt</Button>
                              
                              <Button 
                                onClick={() => handleUpdateAttendance(a.student_id, 'LATE')}
                                variant={a.status === 'LATE' ? 'secondary' : 'outline'}
                              >⏰ Đi muộn</Button>
                              
                              <Button 
                                onClick={() => setShowAbsentModal({ student_id: a.student_id, full_name: a.full_name || 'Học viên', notes: a.notes || '' })}
                                variant={a.status === 'ABSENT_EXCUSED' ? 'danger' : 'outline'}
                              >📝 Vắng phép</Button>
                              {a.status === 'ABSENT_EXCUSED' && a.notes && (
                                <div style={{ fontSize: '12px', color: 'var(--color-danger)', marginTop: '4px' }}>Lý do: {a.notes}</div>
                              )}
                              
                              <Button 
                                onClick={() => handleUpdateAttendance(a.student_id, 'ABSENT_UNEXCUSED')}
                                variant={a.status === 'ABSENT_UNEXCUSED' ? 'danger' : 'outline'}
                              >❌ Vắng K/P</Button>
                            </div>
                          </td>
                          <td style={{ padding: 'var(--spacing-5)', textAlign: 'center' }}>
                            <Button onClick={() => handleOpenEval(a.student_id, a.full_name || 'Học viên')} variant="outline" size="sm">💬 Nhận xét</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB CONTENT: ASSIGNMENTS */}
      {activeTab === 'ASSIGNMENTS' && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
            <h2 style={{ margin: 0, color: 'var(--color-text)' }}>Bài tập đã giao ({assignments.length})</h2>
            <Button onClick={handleOpenAssignModal} variant="primary">+ Giao bài tập mới</Button>
          </div>
          
          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-background)' }}>
                  <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)', borderTopLeftRadius: '10px' }}>Tiêu đề Giao bài</th>
                  <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)' }}>Tài liệu gốc</th>
                  <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)' }}>Ngày Giao</th>
                  <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)' }}>Hạn chót (Due Date)</th>
                  <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)', borderTopRightRadius: '10px', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {assignments.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: 'var(--spacing-10)' }}><EmptyState title="Chưa có bài tập nào được giao cho lớp này." /></td></tr>
                ) : assignments.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--color-background)', transition: '0.2s' }}>
                    <td style={{ padding: 'var(--spacing-4)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text)' }}>{a.title}</td>
                    <td style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)' }}>
                      <Badge variant="info" style={{ marginRight: 'var(--spacing-2)' }}>{a.category || 'Tài liệu'}</Badge>
                      {a.folder_name ? `Thư mục: ${a.folder_name}` : 'Không có thư mục'}
                    </td>
                    <td style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)' }}>{new Date(a.created_at).toLocaleDateString('vi-VN')}</td>
                    <td style={{ padding: 'var(--spacing-4)' }}>
                      {a.due_at ? (
                        <Badge variant={new Date(a.due_at) < new Date() ? 'danger' : 'warning'}>
                          {new Date(a.due_at).toLocaleDateString('vi-VN')} {new Date(a.due_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                        </Badge>
                      ) : 'Không có hạn'}
                    </td>
                    <td style={{ padding: 'var(--spacing-4)', textAlign: 'right' }}>
                      <a href={a.file_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                        <Button variant="secondary" size="sm">Mở Đề</Button>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB CONTENT: ANALYTICS */}
      {activeTab === 'ANALYTICS' && (
        <Card>
          <h2 style={{ margin: '0 0 20px 0', color: 'var(--color-text)' }}>📊 Phân Tích Những Chuyên Đề Yếu Nhất Lớp</h2>
          {weakTopics.length === 0 ? (
            <EmptyState title="Chưa có đủ dữ liệu bài làm để phân tích lớp." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
              {weakTopics.map((t, idx) => {
                const rate = Number(t.accuracy_rate);
                let color = 'var(--color-success)'; // Green
                let icon = '✅';
                if (rate < 50) {
                  color = 'var(--color-danger)'; // Red
                  icon = '⚠️';
                } else if (rate < 80) {
                  color = 'var(--color-warning)'; // Yellow
                  icon = '⚡';
                }

                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
                      <span style={{ fontWeight: 'var(--font-weight-bold)', color: '#334155' }}>{icon} {t.topic}</span>
                      <span style={{ fontWeight: 'var(--font-weight-bold)', color }}>{rate}% ({t.total_corrects}/{t.total_attempts})</span>
                    </div>
                    <div style={{ width: '100%', height: '12px', backgroundColor: 'var(--color-background)', borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{ width: `${rate}%`, height: '100%', backgroundColor: color, borderRadius: '6px', transition: 'width 0.5s' }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      )}

      {/* Modal Thêm Học Sinh */}
      {showAddMember && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <Card style={{ width: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ margin: '0 0 20px 0', color: 'var(--color-text)' }}>Thêm Học Sinh Vào Lớp</h2>
            
            <div style={{ marginBottom: '15px' }}>
              <Input 
                placeholder="🔍 Nhập tên hoặc SĐT để tìm..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', paddingRight: '5px' }}>
              {searchResults.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-secondary)' }}>
                  Không tìm thấy học sinh nào.
                </div>
              ) : (
                searchResults.map(st => (
                  <div 
                    key={st.id} 
                    onClick={() => setNewStudentId(st.id.toString())}
                    style={{ 
                      padding: '12px', 
                      borderRadius: '8px', 
                      border: newStudentId === st.id.toString() ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      backgroundColor: newStudentId === st.id.toString() ? '#eff6ff' : 'var(--color-surface)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold', color: 'var(--color-text)', marginBottom: '4px' }}>{st.full_name}</div>
                      <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'flex', gap: '10px' }}>
                        <span>📱 {st.phone_number ? st.phone_number.substring(0, 7) + '***' : '---'}</span>
                        <span>🏫 {st.school_name || '---'}</span>
                      </div>
                    </div>
                    {newStudentId === st.id.toString() && <span style={{ color: 'var(--color-primary)' }}>✓ Đã chọn</span>}
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)', marginTop: 'auto' }}>
              <Button type="button" onClick={() => { setShowAddMember(false); setNewStudentId(''); setSearchQuery(''); }} variant="ghost">Hủy</Button>
              <Button type="button" onClick={handleAddMember} disabled={!newStudentId} variant="primary">Thêm Vào Lớp</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Tạo / Sửa Buổi Học */}
      {showSessionModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <Card style={{ width: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 20px 0', color: 'var(--color-text)' }}>
              {editingSession?.id ? '✏️ Chỉnh Sửa Buổi Học' : '📅 Tạo Buổi Học Mới'}
            </h2>
            <form onSubmit={handleSaveSession}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)' }}>
                <Input 
                  type="date" 
                  label="Ngày học" 
                  value={editingSession?.session_date || ''} 
                  onChange={e => setEditingSession({ ...editingSession, session_date: e.target.value })} 
                  required 
                />
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
                  <Input 
                    type="time" 
                    label="Giờ bắt đầu" 
                    value={editingSession?.start_time || '18:00'} 
                    onChange={e => setEditingSession({ ...editingSession, start_time: e.target.value })} 
                    required 
                  />
                  <Input 
                    type="time" 
                    label="Giờ kết thúc" 
                    value={editingSession?.end_time || '19:30'} 
                    onChange={e => setEditingSession({ ...editingSession, end_time: e.target.value })} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--spacing-1)', fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text)' }}>
                    Nội dung buổi học:
                  </label>
                  <textarea 
                    value={editingSession?.content || ''} 
                    onChange={e => setEditingSession({ ...editingSession, content: e.target.value })} 
                    placeholder="VD: Ôn tập Hàm số bậc 2, giải các bài tập nâng cao..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-3)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      fontFamily: 'inherit',
                      fontSize: 'var(--font-size-base)',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--spacing-1)', fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text)' }}>
                    Bài tập về nhà:
                  </label>
                  <textarea 
                    value={editingSession?.homework || ''} 
                    onChange={e => setEditingSession({ ...editingSession, homework: e.target.value })} 
                    placeholder="VD: Làm bài 1 -> 5 trang 42 SGK..."
                    rows={2}
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-3)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      fontFamily: 'inherit',
                      fontSize: 'var(--font-size-base)',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)' }}>
                <Button type="button" onClick={() => setShowSessionModal(false)} variant="ghost" disabled={savingSession}>
                  Hủy
                </Button>
                <Button type="submit" variant="primary" disabled={savingSession}>
                  {savingSession ? 'Đang lưu...' : (editingSession?.id ? 'Cập nhật' : 'Tạo buổi học')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal Nhận Xét Học Sinh */}
      {showEvalModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <Card style={{ width: '480px' }}>
            <h2 style={{ margin: '0 0 15px 0', color: 'var(--color-text)' }}>
              💬 Nhận Xét Buổi Học
            </h2>
            <div style={{ marginBottom: '15px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>
              Học sinh: <span style={{ color: 'var(--color-primary)' }}>{evalData.student_name}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-1)', fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text)' }}>
                  Mức độ tập trung:
                </label>
                <select 
                  value={evalData.focus_level} 
                  onChange={e => setEvalData({ ...evalData, focus_level: e.target.value })}
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-3)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    fontFamily: 'inherit',
                    fontSize: 'var(--font-size-base)',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="Rất tốt">🌟 Rất tốt / Tích cực</option>
                  <option value="Bình thường">👍 Bình thường</option>
                  <option value="Chưa tập trung">⚠️ Chưa tập trung / Cần nhắc nhở</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-1)', fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text)' }}>
                  Lời nhận xét của giáo viên:
                </label>
                <textarea 
                  value={evalData.teacher_notes} 
                  onChange={e => setEvalData({ ...evalData, teacher_notes: e.target.value })} 
                  placeholder="Nhập nhận xét chi tiết về bài học, thái độ học tập..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-3)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    fontFamily: 'inherit',
                    fontSize: 'var(--font-size-base)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)' }}>
              <Button type="button" onClick={() => setShowEvalModal(false)} variant="ghost">Hủy</Button>
              <Button type="button" onClick={handleSaveEval} variant="primary">Lưu nhận xét</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Nhập Lý Do Vắng Phép */}
      {showAbsentModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <Card style={{ width: '450px' }}>
            <h2 style={{ margin: '0 0 15px 0', color: 'var(--color-text)' }}>
              📝 Ghi Chú Lý Do Vắng Phép
            </h2>
            <div style={{ marginBottom: '15px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>
              Học sinh: <span style={{ color: 'var(--color-primary)' }}>{showAbsentModal.full_name}</span>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <Input 
                label="Lý do nghỉ" 
                placeholder="VD: Bị ốm, bận việc gia đình có xin trước..." 
                value={showAbsentModal.notes || ''} 
                onChange={e => setShowAbsentModal({ ...showAbsentModal, notes: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)' }}>
              <Button type="button" onClick={() => setShowAbsentModal(null)} variant="ghost">Hủy</Button>
              <Button 
                type="button" 
                onClick={() => {
                  handleUpdateAttendance(showAbsentModal.student_id, 'ABSENT_EXCUSED', showAbsentModal.notes);
                  setShowAbsentModal(null);
                }} 
                variant="danger"
              >
                Xác nhận Vắng phép
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Giao Bài Tập */}
      {showAssignModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <Card style={{ width: '500px' }}>
            <h2 style={{ margin: '0 0 25px 0', color: 'var(--color-text)' }}>Gán Tài Liệu / Đề Thi Vào Lớp</h2>
            <form onSubmit={handleCreateAssignment}>
                <div style={{ marginBottom: 'var(--spacing-5)', maxHeight: '60vh', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-4)', backgroundColor: 'var(--color-background)' }}>
                  {Object.values(
                    allDocs.reduce((acc, doc) => {
                      const key = doc.folder_id ? `${doc.folder_id}_${doc.folder_name}` : 'null_Chưa phân loại';
                      if (!acc[key]) acc[key] = { folder_id: doc.folder_id, folder_name: doc.folder_name || 'Chưa phân loại', docs: [] };
                      acc[key].docs.push(doc);
                      return acc;
                    }, {} as Record<string, any>)
                  ).map((group: any) => {
                    const allSelected = group.docs.length > 0 && group.docs.every((d: any) => selectedDocIds.includes(d.id));
                    const someSelected = group.docs.some((d: any) => selectedDocIds.includes(d.id));
                    return (
                      <div key={group.folder_id || 'null'} style={{ marginBottom: 'var(--spacing-4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', padding: 'var(--spacing-2)', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-md)', fontWeight: 'var(--font-weight-bold)', color: '#334155' }}>
                          <input 
                            type="checkbox" 
                            checked={allSelected}
                            ref={input => {
                              if (input) {
                                input.indeterminate = !allSelected && someSelected;
                              }
                            }}
                            onChange={(e) => {
                              if (e.target.checked) {
                                const newIds = new Set([...selectedDocIds, ...group.docs.map((d: any) => d.id)]);
                                setSelectedDocIds(Array.from(newIds));
                              } else {
                                const newIds = selectedDocIds.filter(id => !group.docs.find((d: any) => d.id === id));
                                setSelectedDocIds(newIds);
                              }
                            }}
                          />
                          📁 {group.folder_name}
                        </div>
                        <div style={{ paddingLeft: '25px', marginTop: 'var(--spacing-1)' }}>
                          {group.docs.map((doc: any) => (
                            <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', padding: '6px 0', color: 'var(--color-text-secondary)' }}>
                              <input 
                                type="checkbox" 
                                checked={selectedDocIds.includes(doc.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedDocIds([...selectedDocIds, doc.id]);
                                  } else {
                                    setSelectedDocIds(selectedDocIds.filter(id => id !== doc.id));
                                  }
                                }}
                              />
                              📄 {doc.title} {doc.folder_class_id === Number(id) && <Badge variant="primary">Đã gán</Badge>}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {allDocs.length === 0 && <EmptyState title="Không có tài liệu nào trong kho" />}
                </div>
                
                <div style={{ marginBottom: 'var(--spacing-5)', color: 'var(--color-text)', fontWeight: 'var(--font-weight-bold)' }}>
                  Đã chọn {selectedDocIds.length} tài liệu
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)' }}>
                  <Button type="button" onClick={() => setShowAssignModal(false)} variant="ghost">Hủy</Button>
                  <Button type="submit" disabled={isAssigning} variant="primary">
                    {isAssigning ? 'Đang gán...' : 'Gán vào lớp'}
                  </Button>
                </div>
              </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ClassDetail;
