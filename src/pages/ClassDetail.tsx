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
  const [evalData, setEvalData] = useState<any>({ 
    student_id: 0, 
    student_name: '', 
    teacher_notes: '', 
    focus_level: 'Bình thường',
    homework: '',
    due_date: ''
  });
  
  // States for assignments
  const [assignments, setAssignments] = useState<any[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [allDocs, setAllDocs] = useState<any[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);
  const [assignForm, setAssignForm] = useState({
    session_id: '',
    due_at: '',
    title: ''
  });
  const [isAssigning, setIsAssigning] = useState(false);

  // States for analytics
  const [weakTopics, setWeakTopics] = useState<any[]>([]);

  // States for adding a new member
  const [showAddMember, setShowAddMember] = useState(false);
  const [newStudentId, setNewStudentId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [savingSession, setSavingSession] = useState(false);

  // Debounced search for students
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await axiosClient.get(`/api/students/search?q=${encodeURIComponent(searchQuery.trim())}`);
        setSearchResults(res.data || []);
      } catch (err) {
        console.error("Lỗi tìm kiếm học sinh:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchData = async () => {
    try {
      const clsRes = await axiosClient.get(`/api/classes/${id}`);
      setClassInfo(clsRes.data);
      
      const membersRes = await axiosClient.get(`/api/classes/${id}/members`);
      setMembers(membersRes.data || []);

      const sessionsRes = await axiosClient.get(`/api/classes/${id}/sessions`);
      const loadedSessions: Session[] = sessionsRes.data || [];
      setSessions(loadedSessions);

      // Default select first session if none active
      if (loadedSessions.length > 0) {
        if (!activeSession) {
          setActiveSession(loadedSessions[0]);
          fetchAttendance(loadedSessions[0].id);
        } else {
          const stillExists = loadedSessions.find(s => s.id === activeSession.id);
          if (stillExists) {
            fetchAttendance(stillExists.id);
          } else {
            setActiveSession(loadedSessions[0]);
            fetchAttendance(loadedSessions[0].id);
          }
        }
      }

      const assignRes = await axiosClient.get(`/api/classes/${id}/assignments`);
      setAssignments(assignRes.data || []);
      
      const analyticsRes = await axiosClient.get(`/api/analytics/classes/${id}/weak-topics`);
      setWeakTopics(analyticsRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAddMember = async (studentIdToAdd: number | string) => {
    const sId = studentIdToAdd || newStudentId;
    if (!sId) return;
    try {
      await axiosClient.post(`/api/classes/${id}/members`, { student_id: sId });
      alert("Đã thêm học sinh vào lớp thành công!");
      setShowAddMember(false);
      setNewStudentId('');
      setSearchQuery('');
      setSearchResults([]);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi thêm học sinh');
    }
  };

  const handleCreateSession = () => {
    setEditingSession({ 
      class_id: id, 
      session_date: new Date().toISOString().split('T')[0], 
      start_time: '18:00', 
      end_time: '19:30',
      content: ''
    });
    setShowSessionModal(true);
  };

  const handleEditSession = (sess: any) => {
    setEditingSession({ 
      ...sess, 
      start_time: sess.start_time ? sess.start_time.substring(0,5) : '18:00',
      end_time: sess.end_time ? sess.end_time.substring(0,5) : '19:30',
      content: sess.content || ''
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
      setSessions(sessionsRes.data || []);
      alert('Lưu buổi học thành công!');
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Lỗi khi lưu buổi học');
    } finally {
      setSavingSession(false);
    }
  };
  
  const handleDeleteSession = async (sessId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa buổi học này?")) return;
    try {
       await axiosClient.delete(`/api/sessions/${sessId}`);
       if (activeSession?.id === sessId) setActiveSession(null);
       const sessionsRes = await axiosClient.get(`/api/classes/${id}/sessions`);
       setSessions(sessionsRes.data || []);
       alert("Đã xóa buổi học.");
    } catch(err) {
       alert('Lỗi khi xóa buổi học');
    }
  };

  const handleOpenAssignModal = async () => {
    try {
      const res = await axiosClient.get(`/api/classes/${id}/assignable-documents`);
      setAllDocs(res.data || []);
      setSelectedDocIds([]);
      setAssignForm({
        session_id: activeSession ? String(activeSession.id) : '',
        due_at: '',
        title: ''
      });
      setShowAssignModal(true);
    } catch (err) {
      alert('Lỗi tải danh sách tài liệu');
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDocIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 tài liệu để gán vào lớp.');
      return;
    }
    setIsAssigning(true);
    try {
      const selectedSession = sessions.find(s => String(s.id) === String(assignForm.session_id));
      await axiosClient.post(`/api/classes/${id}/assign-documents`, { 
        document_ids: selectedDocIds,
        session_id: assignForm.session_id ? Number(assignForm.session_id) : null,
        session_date: selectedSession ? new Date(selectedSession.session_date).toLocaleDateString('vi-VN') : null,
        due_at: assignForm.due_at || null,
        title: assignForm.title || null
      });
      alert('Gán tài liệu / bài tập vào lớp thành công.');
      setShowAssignModal(false);
      const assignRes = await axiosClient.get(`/api/classes/${id}/assignments`);
      setAssignments(assignRes.data || []);
    } catch (err) {
      alert('Lỗi khi giao tài liệu/bài tập vào lớp');
    } finally {
      setIsAssigning(false);
    }
  };

  const fetchAttendance = async (sessionId: number) => {
    try {
      const res = await axiosClient.get(`/api/classes/sessions/${sessionId}/attendance`);
      setAttendanceList(res.data || []);
    } catch (err) {
      console.error("Lỗi tải điểm danh:", err);
      setAttendanceList([]);
    }
  };
  
  const handlePublishSession = async () => {
    if (!window.confirm("Công bố các buổi học (Nháp) của lớp này cho phụ huynh và học sinh?")) return;
    try {
      await axiosClient.post('/api/sessions/publish', { class_id: id });
      alert("Đã công bố thành công!");
      const sessionsRes = await axiosClient.get(`/api/classes/${id}/sessions`);
      setSessions(sessionsRes.data || []);
    } catch(err) {
      alert("Lỗi khi công bố");
    }
  };
    
  const handleSyncCalendar = async () => {
    if (!activeSession) return;
    try {
      await axiosClient.post(`/api/sessions/${activeSession.id}/sync-calendar`);
      alert('Đồng bộ lại Google Calendar thành công!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi đồng bộ lịch Google');
    }
  };

  const selectSession = (sess: Session) => {
    setActiveSession(sess);
    fetchAttendance(sess.id);
  };

  const handleUpdateAttendance = async (studentId: number, status: string, notes?: string) => {
    if (!activeSession) return;
    try {
      await axiosClient.put(`/api/classes/sessions/${activeSession.id}/attendance`, {
        student_id: studentId,
        status,
        note: notes || null,
        absent_reason: notes || null
      });
      fetchAttendance(activeSession.id);
    } catch (err) {
      alert('Lỗi cập nhật điểm danh');
    }
  };

  const handleOpenEval = async (studentId: number, studentName: string) => {
    setEvalData({ 
      student_id: studentId, 
      student_name: studentName, 
      teacher_notes: '', 
      focus_level: 'Bình thường',
      homework: '',
      due_date: ''
    });
    try {
      const res = await axiosClient.get(`/api/sessions/evaluations?session_id=${activeSession?.id}&student_id=${studentId}`);
      if (res.data && res.data.length > 0) {
        setEvalData({ 
          student_id: studentId, 
          student_name: studentName, 
          teacher_notes: res.data[0].teacher_notes || '', 
          focus_level: res.data[0].focus_level || 'Bình thường',
          homework: '',
          due_date: ''
        });
      }
    } catch(e) {}
    setShowEvalModal(true);
  };
  
  const handleSaveEval = async () => {
    if (!activeSession) return;
    try {
      let combinedNotes = evalData.teacher_notes || '';
      if (evalData.homework) {
        combinedNotes += (combinedNotes ? '\n' : '') + `[BTVN: ${evalData.homework}${evalData.due_date ? ` | Hạn: ${evalData.due_date}` : ''}]`;
      }

      await axiosClient.post('/api/sessions/evaluate', {
        session_id: activeSession.id,
        student_id: evalData.student_id,
        is_present: true,
        focus_level: evalData.focus_level,
        teacher_notes: combinedNotes
      });
      setShowEvalModal(false);
      alert('Đã lưu nhận xét và bài tập của học sinh thành công!');
      fetchAttendance(activeSession.id);
    } catch (err) {
      alert('Lỗi khi lưu nhận xét');
    }
  };

  return (
    <div style={{ padding: 'var(--spacing-10)', maxWidth: '100%', boxSizing: 'border-box' }}>
      
      {/* HEADER LỚP HỌC */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-8)', paddingBottom: 'var(--spacing-6)', borderBottom: '1px solid var(--color-border)', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-2)' }}>
            <h1 style={{ margin: 0, color: 'var(--color-text)', fontSize: '32px' }}>{classInfo?.class_name || 'Đang tải...'}</h1>
            <Badge variant="primary">Mã lớp: {id}</Badge>
            <Badge variant={classInfo?.is_active ? 'success' : 'danger'}>{classInfo?.is_active ? 'Đang hoạt động' : 'Tạm dừng'}</Badge>
          </div>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '15px' }}>
            Học phí: <strong>{classInfo?.tuition_fee ? classInfo.tuition_fee.toLocaleString('vi-VN') + ' đ/buổi' : 'Chưa thiết lập'}</strong> — Lịch: {classInfo?.schedule || 'Chưa thiết lập'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
          <Button onClick={() => navigate('/classes')} variant="outline">Quay lại danh sách</Button>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div style={{ display: 'flex', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-8)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-3)' }}>
        <Button 
          onClick={() => setActiveTab('MEMBERS')} 
          variant={activeTab === 'MEMBERS' ? 'primary' : 'ghost'}
        >
          👥 Danh Sách Học Sinh ({members.length})
        </Button>
        <Button 
          onClick={() => setActiveTab('SESSIONS')} 
          variant={activeTab === 'SESSIONS' ? 'primary' : 'ghost'}
        >
          📅 Buổi Học & Điểm Danh ({sessions.length})
        </Button>
        <Button 
          onClick={() => setActiveTab('ASSIGNMENTS')} 
          variant={activeTab === 'ASSIGNMENTS' ? 'primary' : 'ghost'}
        >
          📚 Tài Liệu & Bài Tập ({assignments.length})
        </Button>
        <Button 
          onClick={() => setActiveTab('ANALYTICS')} 
          variant={activeTab === 'ANALYTICS' ? 'primary' : 'ghost'}
        >
          📊 Phân Tích Chuyên Đề
        </Button>
      </div>

      {/* TAB CONTENT: MEMBERS */}
      {activeTab === 'MEMBERS' && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
            <h2 style={{ margin: 0, color: 'var(--color-text)' }}>Danh sách thành viên lớp</h2>
            <Button onClick={() => { setShowAddMember(true); setSearchQuery(''); setSearchResults([]); }} variant="primary">
              + Thêm Học Sinh Vào Lớp
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-background)' }}>
                  <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)', borderTopLeftRadius: '10px' }}>Họ và Tên</th>
                  <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)' }}>Số Điện Thoại</th>
                  <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)' }}>Trường</th>
                  <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)', borderTopRightRadius: '10px', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: 'var(--spacing-10)' }}>
                      <EmptyState title="Lớp chưa có học sinh nào" description="Bấm '+ Thêm Học Sinh Vào Lớp' để tìm và thêm học sinh vào lớp học." />
                    </td>
                  </tr>
                ) : (
                  members.map(m => (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--color-background)', transition: '0.2s' }}>
                      <td style={{ padding: 'var(--spacing-4)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text)' }}>{m.full_name}</td>
                      <td style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)' }}>{m.phone || 'Chưa cập nhật'}</td>
                      <td style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)' }}>{m.school_name || '---'}</td>
                      <td style={{ padding: 'var(--spacing-4)', textAlign: 'right' }}>
                        <Button onClick={() => navigate(`/students/${m.id}`)} variant="outline" size="sm">Hồ sơ 360°</Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB CONTENT: SESSIONS & ATTENDANCE */}
      {activeTab === 'SESSIONS' && (
        <div style={{ display: 'flex', gap: 'var(--spacing-6)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          
          {/* Cột trái: Danh sách Buổi Học */}
          <Card style={{ flex: '0 0 320px', display: 'flex', flexDirection: 'column', height: '650px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)', paddingBottom: 'var(--spacing-3)', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ margin: 0, color: 'var(--color-text)' }}>Buổi học</h3>
              <Button onClick={handleCreateSession} variant="primary" size="sm">+ Tạo buổi</Button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)', overflowY: 'auto', flex: 1, paddingRight: 'var(--spacing-1)' }}>
              {sessions.length === 0 ? (
                <EmptyState title="Chưa có buổi học nào" description="Bấm '+ Tạo buổi' để lên lịch học mới." />
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ fontWeight: 'var(--font-weight-bold)', fontSize: '15px', color: activeSession?.id === sess.id ? 'var(--color-primary)' : '#334155' }}>
                      Ngày {new Date(sess.session_date).toLocaleDateString('vi-VN')}
                    </div>
                    <Badge variant={sess.is_published ? 'primary' : 'warning'}>
                      {sess.is_published ? '🔵 Đã công bố' : '🟡 Nháp'}
                    </Badge>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: '4px', fontWeight: 'var(--font-weight-medium)' }}>
                    🕒 {sess.start_time ? String(sess.start_time).substring(0,5) : '18:00'}
                  </div>
                  {sess.content && (
                    <div style={{ fontSize: '13px', color: 'var(--color-text)', marginTop: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      📖 {sess.content}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '4px', marginTop: '10px' }}>
                    <Button onClick={(e) => { e.stopPropagation(); handleEditSession(sess); }} variant="outline" size="sm" style={{ padding: '2px 8px', fontSize: '12px' }}>Sửa</Button>
                    <Button onClick={(e) => { e.stopPropagation(); handleDeleteSession(sess.id); }} variant="danger" size="sm" style={{ padding: '2px 8px', fontSize: '12px' }}>Xóa</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Cột phải: Chi tiết Điểm danh & Nhận xét */}
          <Card style={{ flex: 1, minWidth: '450px' }}>
            {!activeSession ? (
              <EmptyState title="Chọn một buổi học bên trái để xem và điểm danh" />
            ) : (
              <div>
                <div style={{ marginBottom: 'var(--spacing-6)', paddingBottom: 'var(--spacing-5)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
                      <h2 style={{ margin: '0', color: 'var(--color-text)', fontSize: 'var(--font-size-2xl)' }}>
                        Bảng Điểm Danh — {new Date(activeSession.session_date).toLocaleDateString('vi-VN')}
                      </h2>
                      {!activeSession.is_published && (
                        <Button onClick={handlePublishSession} variant="primary" size="sm">🚀 Công bố buổi học</Button>
                      )}
                      <Button onClick={handleSyncCalendar} variant="secondary" size="sm">🔄 Đồng bộ Calendar</Button>
                    </div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '6px' }}>
                      Nội dung: <strong>{activeSession.content || 'Chưa có nội dung cụ thể'}</strong>
                    </div>
                  </div>
                  <div style={{ padding: '8px 16px', backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-bold)' }}>
                    Sĩ số lớp: {attendanceList.length} học sinh
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--color-background)' }}>
                        <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)', width: '30%' }}>Học sinh</th>
                        <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)' }}>Trạng thái Điểm danh</th>
                        <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)', textAlign: 'center', width: '20%' }}>Nhận xét & BTVN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceList.length === 0 ? (
                        <tr><td colSpan={3} style={{ padding: 'var(--spacing-10)' }}><EmptyState title="Lớp chưa có học sinh nào để điểm danh." /></td></tr>
                      ) : attendanceList.map(a => {
                        const isRecorded = !!a.status;
                        return (
                          <tr key={a.student_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: 'var(--spacing-4)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text)', fontSize: 'var(--font-size-base)' }}>
                              {a.full_name} <br/>
                              {!isRecorded && (
                                <span style={{ color: 'var(--color-text-secondary)', fontSize: '12px', fontWeight: 'normal' }}>
                                  ⚪ Chưa điểm danh
                                </span>
                              )}
                            </td>
                            <td style={{ padding: 'var(--spacing-4)' }}>
                              <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
                                <Button 
                                  onClick={() => handleUpdateAttendance(a.student_id, 'PRESENT')}
                                  variant={a.status === 'PRESENT' ? 'primary' : 'outline'}
                                  size="sm"
                                >✅ Có mặt</Button>
                                
                                <Button 
                                  onClick={() => handleUpdateAttendance(a.student_id, 'LATE')}
                                  variant={a.status === 'LATE' ? 'secondary' : 'outline'}
                                  size="sm"
                                >⏰ Đi muộn</Button>
                                
                                <Button 
                                  onClick={() => setShowAbsentModal({ student_id: a.student_id, full_name: a.full_name || 'Học viên', notes: a.notes || a.absent_reason || '' })}
                                  variant={a.status === 'ABSENT_EXCUSED' ? 'danger' : 'outline'}
                                  size="sm"
                                >📝 Vắng phép</Button>
                                
                                <Button 
                                  onClick={() => handleUpdateAttendance(a.student_id, 'ABSENT_UNEXCUSED')}
                                  variant={a.status === 'ABSENT_UNEXCUSED' ? 'danger' : 'outline'}
                                  size="sm"
                                >❌ Vắng K/P</Button>
                              </div>
                              {a.status === 'ABSENT_EXCUSED' && (a.absent_reason || a.notes) && (
                                <div style={{ fontSize: '13px', color: 'var(--color-danger)', marginTop: '6px', fontWeight: '500' }}>
                                  📌 Lý do: {a.absent_reason || a.notes}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: 'var(--spacing-4)', textAlign: 'center' }}>
                              <Button onClick={() => handleOpenEval(a.student_id, a.full_name || 'Học viên')} variant="outline" size="sm">
                                💬 Nhận xét / BTVN
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB CONTENT: ASSIGNMENTS & DOCUMENTS */}
      {activeTab === 'ASSIGNMENTS' && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)', flexWrap: 'wrap', gap: 'var(--spacing-3)' }}>
            <div>
              <h2 style={{ margin: '0 0 4px 0', color: 'var(--color-text)' }}>Tài Liệu & Bài Tập Đã Giao ({assignments.length})</h2>
              <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '14px' }}>Tài liệu và bài tập được gán trực tiếp cho lớp {classInfo?.class_name}.</p>
            </div>
            <Button onClick={handleOpenAssignModal} variant="primary">+ Giao bài tập / Gán tài liệu</Button>
          </div>
          
          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-background)' }}>
                  <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)' }}>Tiêu đề giao bài</th>
                  <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)' }}>Loại</th>
                  <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)' }}>Gắn với buổi học</th>
                  <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)' }}>Hạn chót</th>
                  <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {assignments.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: 'var(--spacing-10)' }}><EmptyState title="Chưa có tài liệu hoặc bài tập nào được giao cho lớp này." description="Bấm '+ Giao bài tập / Gán tài liệu' để giao tài liệu từ kho của bạn cho lớp." /></td></tr>
                ) : assignments.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--color-border)', transition: '0.2s' }}>
                    <td style={{ padding: 'var(--spacing-4)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text)' }}>
                      📄 {a.title || a.doc_title || 'Tài liệu'}
                    </td>
                    <td style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)' }}>
                      <Badge variant={a.category === 'EXAM' ? 'primary' : 'info'}>
                        {a.category === 'EXAM' ? 'Đề thi' : 'Tài liệu học'}
                      </Badge>
                    </td>
                    <td style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)' }}>
                      {a.session_info || 'Tài liệu chung'}
                    </td>
                    <td style={{ padding: 'var(--spacing-4)' }}>
                      {a.due_at ? (
                        <Badge variant={new Date(a.due_at) < new Date() ? 'danger' : 'warning'}>
                          ⏰ {new Date(a.due_at).toLocaleDateString('vi-VN')} {new Date(a.due_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                        </Badge>
                      ) : (
                        <span style={{ color: 'var(--color-text-secondary)' }}>Không có hạn</span>
                      )}
                    </td>
                    <td style={{ padding: 'var(--spacing-4)', textAlign: 'right' }}>
                      {a.file_url ? (
                        <a href={a.file_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                          <Button variant="secondary" size="sm">Mở Tài Liệu</Button>
                        </a>
                      ) : (
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Đã gán</span>
                      )}
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
                let color = 'var(--color-success)';
                let icon = '✅';
                if (rate < 50) {
                  color = 'var(--color-danger)';
                  icon = '⚠️';
                } else if (rate < 80) {
                  color = 'var(--color-warning)';
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
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Modal Thêm Học Sinh Vào Lớp */}
      {showAddMember && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)', padding: 'var(--spacing-4)' }}>
          <Card style={{ width: '520px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ margin: '0 0 15px 0', color: 'var(--color-text)' }}>➕ Thêm Học Sinh Vào Lớp {classInfo?.class_name}</h2>
            
            <div style={{ marginBottom: '15px' }}>
              <Input 
                placeholder="🔍 Nhập họ tên hoặc số điện thoại học sinh..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', maxHeight: '350px', paddingRight: '5px' }}>
              {isSearching ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-primary)' }}>
                  ⏳ Đang tìm kiếm...
                </div>
              ) : searchResults.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-secondary)' }}>
                  {searchQuery.trim() ? 'Không tìm thấy học sinh phù hợp.' : 'Gõ tên hoặc số điện thoại để tìm kiếm học sinh.'}
                </div>
              ) : (
                searchResults.map(st => {
                  const isAlreadyMember = members.some(m => m.id === st.id);
                  return (
                    <div 
                      key={st.id} 
                      style={{ 
                        padding: '12px', 
                        borderRadius: '8px', 
                        border: '1px solid var(--color-border)',
                        backgroundColor: isAlreadyMember ? 'var(--color-background)' : 'var(--color-surface)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 'bold', color: 'var(--color-text)', marginBottom: '4px' }}>{st.full_name}</div>
                        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'flex', gap: '10px' }}>
                          <span>📱 {st.phone_number || 'Chưa có SĐT'}</span>
                          <span>🏫 {st.school_name || '---'}</span>
                        </div>
                      </div>
                      {isAlreadyMember ? (
                        <Badge variant="success">✓ Đã trong lớp</Badge>
                      ) : (
                        <Button 
                          onClick={() => handleAddMember(st.id)}
                          variant="primary" 
                          size="sm"
                        >
                          + Thêm vào lớp
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)', marginTop: 'auto', borderTop: '1px solid var(--color-border)', paddingTop: '15px' }}>
              <Button type="button" onClick={() => { setShowAddMember(false); setSearchQuery(''); setSearchResults([]); }} variant="ghost">Đóng</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Tạo / Sửa Buổi Học (Không còn bắt BTVN) */}
      {showSessionModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)', padding: 'var(--spacing-4)' }}>
          <Card style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
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
                    placeholder="VD: Ôn tập Hàm số bậc 2, chữa đề kiểm tra..."
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

      {/* Modal Nhận Xét Học Sinh & Giao BTVN Sau Buổi Học */}
      {showEvalModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)', padding: 'var(--spacing-4)' }}>
          <Card style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 15px 0', color: 'var(--color-text)' }}>
              💬 Nhận Xét & Giao Bài Tập
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
                  Bài tập về nhà giao riêng:
                </label>
                <textarea 
                  value={evalData.homework} 
                  onChange={e => setEvalData({ ...evalData, homework: e.target.value })} 
                  placeholder="VD: Làm thêm bài 4, 5 trang 30 SGK..."
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

              <Input 
                type="date"
                label="Hạn hoàn thành bài tập"
                value={evalData.due_date}
                onChange={e => setEvalData({ ...evalData, due_date: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)' }}>
              <Button type="button" onClick={() => setShowEvalModal(false)} variant="ghost">Hủy</Button>
              <Button type="button" onClick={handleSaveEval} variant="primary">Lưu Nhận Xét</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Nhập Lý Do Vắng Phép */}
      {showAbsentModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)', padding: 'var(--spacing-4)' }}>
          <Card style={{ width: '460px' }}>
            <h2 style={{ margin: '0 0 15px 0', color: 'var(--color-text)' }}>
              📝 Ghi Chú Lý Do Vắng Phép
            </h2>
            <div style={{ marginBottom: '15px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>
              Học sinh: <span style={{ color: 'var(--color-primary)' }}>{showAbsentModal.full_name}</span>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>Chọn nhanh lý do:</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['Ốm / Khám bệnh', 'Việc gia đình', 'Trùng lịch thi trường', 'Bận việc cá nhân'].map((reason, idx) => (
                  <Button 
                    key={idx} 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAbsentModal({ ...showAbsentModal, notes: reason })}
                  >
                    {reason}
                  </Button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <Input 
                label="Lý do chi tiết" 
                placeholder="Nhập lý do nghỉ của học sinh..." 
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

      {/* Modal Giao Bài Tập & Gán Tài Liệu Vào Lớp */}
      {showAssignModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)', padding: 'var(--spacing-4)' }}>
          <Card style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 10px 0', color: 'var(--color-text)' }}>📚 Gán Tài Liệu / Giao Bài Cho Lớp</h2>
            <p style={{ margin: '0 0 20px 0', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
              Lớp nhận: <strong>{classInfo?.class_name}</strong>
            </p>
            
            <form onSubmit={handleCreateAssignment}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-5)' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--spacing-1)', fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)' }}>
                    📅 Gắn với buổi học cụ thể:
                  </label>
                  <select 
                    value={assignForm.session_id} 
                    onChange={e => setAssignForm({ ...assignForm, session_id: e.target.value })}
                    style={{ width: '100%', padding: 'var(--spacing-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  >
                    <option value="">-- [Không gắn buổi học cụ thể / Tài liệu chung] --</option>
                    {sessions.map(s => (
                      <option key={s.id} value={s.id}>
                        {new Date(s.session_date).toLocaleDateString('vi-VN')} {s.content ? `— ${s.content}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
                  <Input 
                    type="datetime-local" 
                    label="Hạn chót hoàn thành (tùy chọn)" 
                    value={assignForm.due_at} 
                    onChange={e => setAssignForm({ ...assignForm, due_at: e.target.value })} 
                  />
                  <Input 
                    label="Tiêu đề giao bài (tùy chọn)" 
                    placeholder="Mặc định lấy tên file" 
                    value={assignForm.title} 
                    onChange={e => setAssignForm({ ...assignForm, title: e.target.value })} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--spacing-2)', fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)' }}>
                    📁 Chọn tài liệu từ kho của bạn:
                  </label>
                  <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-3)', backgroundColor: 'var(--color-background)' }}>
                    {Object.values(
                      allDocs.reduce((acc, doc) => {
                        const key = doc.folder_id ? `${doc.folder_id}_${doc.folder_name}` : 'null_Chưa phân loại';
                        if (!acc[key]) acc[key] = { folder_id: doc.folder_id, folder_name: doc.folder_name || 'Chưa phân loại', docs: [] };
                        acc[key].docs.push(doc);
                        return acc;
                      }, {} as Record<string, any>)
                    ).map((group: any) => (
                      <div key={group.folder_id || 'null'} style={{ marginBottom: 'var(--spacing-3)' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#334155', marginBottom: '4px' }}>
                          📁 {group.folder_name}
                        </div>
                        <div style={{ paddingLeft: '15px' }}>
                          {group.docs.map((doc: any) => (
                            <label key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', cursor: 'pointer', fontSize: '14px' }}>
                              <input 
                                type="checkbox" 
                                checked={selectedDocIds.includes(doc.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedDocIds([...selectedDocIds, doc.id]);
                                  } else {
                                    setSelectedDocIds(selectedDocIds.filter(dId => dId !== doc.id));
                                  }
                                }}
                              />
                              <span>📄 {doc.title}</span>
                              <Badge variant={doc.category === 'EXAM' ? 'primary' : 'info'} style={{ fontSize: '11px' }}>
                                {doc.category === 'EXAM' ? 'Đề thi' : 'Tài liệu'}
                              </Badge>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    {allDocs.length === 0 && <EmptyState title="Kho tài liệu của bạn đang trống" />}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                  Đã chọn: {selectedDocIds.length} tài liệu
                </span>
                <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                  <Button type="button" onClick={() => setShowAssignModal(false)} variant="ghost">Hủy</Button>
                  <Button type="submit" disabled={isAssigning || selectedDocIds.length === 0} variant="primary">
                    {isAssigning ? 'Đang gán...' : 'Gán vào lớp'}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ClassDetail;
