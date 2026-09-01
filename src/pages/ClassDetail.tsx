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
  const [absentReasonInput, setAbsentReasonInput] = useState('');
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
  const [docSearch, setDocSearch] = useState('');

  // States for analytics
  const [weakTopics, setWeakTopics] = useState<any[]>([]);

  // Sync success modal
  const [syncSuccessModal, setSyncSuccessModal] = useState<{
    isOpen: boolean;
    eventId: string;
    htmlLink: string;
    googleAccount: string;
    sessionTitle: string;
  }>({
    isOpen: false,
    eventId: '',
    htmlLink: '',
    googleAccount: '',
    sessionTitle: ''
  });

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
      content: '',
      homework: ''
    });
    setShowSessionModal(true);
  };

  const handleEditSession = (sess: any) => {
    setEditingSession({ 
      ...sess, 
      class_id: sess.class_id || id,
      start_time: sess.start_time ? sess.start_time.substring(0,5) : '18:00',
      end_time: sess.end_time ? sess.end_time.substring(0,5) : '19:30',
      session_date: sess.session_date ? new Date(sess.session_date).toISOString().split('T')[0] : '',
      homework: sess.homework || ''
    });
    setShowSessionModal(true);
  };

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession.session_date) {
      alert('Vui lòng chọn ngày học');
      return;
    }
    setSavingSession(true);
    try {
      let savedSession: any = null;
      if (editingSession.id) {
        const res = await axiosClient.put(`/api/sessions/${editingSession.id}`, editingSession);
        savedSession = res.data?.session;
        alert('Cập nhật buổi học thành công!');
      } else {
        const res = await axiosClient.post(`/api/classes/${id}/sessions`, editingSession);
        savedSession = res.data?.session;
        alert('Tạo buổi học thành công!');
      }
      setShowSessionModal(false);
      const sessionsRes = await axiosClient.get(`/api/classes/${id}/sessions`);
      const updatedSessions: Session[] = sessionsRes.data || [];
      setSessions(updatedSessions);
      if (updatedSessions.length > 0) {
        if (editingSession.id) {
          const matched = updatedSessions.find(s => s.id === editingSession.id);
          if (matched) {
            setActiveSession(matched);
            fetchAttendance(matched.id);
          }
        } else if (savedSession?.id) {
          const matched = updatedSessions.find(s => s.id === savedSession.id);
          if (matched) {
            setActiveSession(matched);
            fetchAttendance(matched.id);
          } else {
            setActiveSession(updatedSessions[0]);
            fetchAttendance(updatedSessions[0].id);
          }
        } else {
          setActiveSession(updatedSessions[0]);
          fetchAttendance(updatedSessions[0].id);
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi lưu buổi học');
    } finally {
      setSavingSession(false);
    }
  };

  const handleDeleteSession = async (sessionId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa buổi học này không? Tất cả dữ liệu điểm danh sẽ bị xóa.')) return;
    try {
      await axiosClient.delete(`/api/sessions/${sessionId}`);
      alert('Đã xóa buổi học!');
      const sessionsRes = await axiosClient.get(`/api/classes/${id}/sessions`);
      setSessions(sessionsRes.data || []);
      if (activeSession?.id === sessionId) {
        setActiveSession(null);
        setAttendanceList([]);
      }
    } catch (err) {
      alert('Lỗi xóa buổi học');
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
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi tải danh sách tài liệu');
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
      alert('✓ Gán tài liệu / bài tập vào lớp thành công!');
      setShowAssignModal(false);
      const assignRes = await axiosClient.get(`/api/classes/${id}/assignments`);
      setAssignments(assignRes.data || []);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi giao tài liệu/bài tập vào lớp');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: number, title?: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bài tập / tài liệu "${title || 'này'}" khỏi lớp?`)) return;
    try {
      await axiosClient.delete(`/api/classes/${id}/assignments/${assignmentId}`);
      alert('✓ Đã xóa bài tập được giao thành công!');
      const assignRes = await axiosClient.get(`/api/classes/${id}/assignments`);
      setAssignments(assignRes.data || []);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi xóa bài tập');
    }
  };

  const handleRemoveMember = async (studentId: number, studentName?: string) => {
    const displayName = studentName || 'Học sinh';
    if (!window.confirm(`Bạn có chắc chắn muốn xóa học sinh "${displayName}" khỏi lớp học này? (Tài khoản học sinh và các lớp khác vẫn được giữ nguyên)`)) {
      return;
    }
    try {
      await axiosClient.delete(`/api/classes/${id}/members/${studentId}`);
      alert(`✓ Đã xóa học sinh "${displayName}" khỏi lớp.`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi xóa học sinh khỏi lớp');
    }
  };

  const handleDeleteClass = async () => {
    if (!window.confirm(`⚠️ BẠN CÓ CHẮC CHẮN MUỐN XÓA LỚP HỌC "${classInfo?.class_name || ''}"?\n\nLớp học sẽ bị gỡ khỏi danh sách quản lý. Dữ liệu lịch sử điểm danh và học phí sẽ được bảo lưu an toàn.`)) {
      return;
    }
    try {
      await axiosClient.delete(`/api/classes/${id}`);
      alert('✓ Đã xóa lớp học thành công!');
      navigate('/classes');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi xóa lớp học');
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
      const res = await axiosClient.post(`/api/sessions/${activeSession.id}/sync-calendar`);
      if (res.data?.success || res.data?.event_id) {
        setSyncSuccessModal({
          isOpen: true,
          eventId: res.data.event_id || '',
          htmlLink: res.data.html_link || (res.data.event_id ? `https://calendar.google.com/calendar/r/eventedit/${res.data.event_id}` : 'https://calendar.google.com'),
          googleAccount: res.data.calendar_account || 'Tài khoản Google của bạn',
          sessionTitle: classInfo?.class_name ? `[${classInfo.class_name}] ${activeSession.content || 'Lịch học'}` : 'Buổi học'
        });
      } else {
        alert(res.data?.message || '✓ Đồng bộ Google Calendar thành công!');
      }
      const sessionsRes = await axiosClient.get(`/api/classes/${id}/sessions`);
      setSessions(sessionsRes.data || []);
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
      // Optimistic local update
      setAttendanceList(prev => prev.map(a => a.student_id === studentId ? { ...a, status: status as any, notes: notes || undefined, absent_reason: notes || undefined } : a));

      await axiosClient.put(`/api/classes/sessions/${activeSession.id}/attendance`, {
        student_id: studentId,
        status,
        note: notes || null,
        absent_reason: notes || null
      });
      fetchAttendance(activeSession.id);
    } catch (err) {
      alert('Lỗi cập nhật điểm danh');
      if (activeSession) fetchAttendance(activeSession.id);
    }
  };

  const handleOpenAbsentModal = (student: any) => {
    setShowAbsentModal(student);
    setAbsentReasonInput(student.absent_reason || student.notes || '');
  };

  const handleSaveAbsentExcused = async () => {
    if (!showAbsentModal || !activeSession) return;
    const finalReason = absentReasonInput.trim() || 'Nghỉ học có phép';
    await handleUpdateAttendance(showAbsentModal.student_id, 'ABSENT_EXCUSED', finalReason);
    setShowAbsentModal(null);
    setAbsentReasonInput('');
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
    <div style={{ padding: 'var(--spacing-4)', maxWidth: '100%', boxSizing: 'border-box' }}>
      
      {/* HEADER LỚP HỌC */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-6)', paddingBottom: 'var(--spacing-4)', borderBottom: '1px solid var(--color-border)', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, color: 'var(--color-text)', fontSize: '24px' }}>{classInfo?.class_name || 'Đang tải...'}</h1>
            <Badge variant="primary">Mã: {id}</Badge>
            <Badge variant={classInfo?.is_active ? 'success' : 'danger'}>{classInfo?.is_active ? 'Đang hoạt động' : 'Tạm dừng'}</Badge>
          </div>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            Học phí: <strong>{classInfo?.tuition_fee ? classInfo.tuition_fee.toLocaleString('vi-VN') + ' đ/buổi' : 'Chưa thiết lập'}</strong> — Lịch: {classInfo?.schedule || 'Chưa thiết lập'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button onClick={() => navigate('/classes')} variant="outline" size="sm" style={{ minHeight: '44px' }}>
            Quay lại danh sách
          </Button>
          <Button onClick={handleDeleteClass} variant="danger" size="sm" style={{ minHeight: '44px' }}>
            🗑️ Xóa lớp
          </Button>
        </div>
      </div>

      {/* TABS NAVIGATION (SCROLLABLE ON MOBILE) */}
      <div className="class-tabs-container" style={{ display: 'flex', gap: '8px', marginBottom: 'var(--spacing-6)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <button 
          onClick={() => setActiveTab('MEMBERS')} 
          className={`tab-btn ${activeTab === 'MEMBERS' ? 'active' : ''}`}
        >
          👥 Học Sinh ({members.length})
        </button>
        <button 
          onClick={() => setActiveTab('SESSIONS')} 
          className={`tab-btn ${activeTab === 'SESSIONS' ? 'active' : ''}`}
        >
          📅 Buổi Học & Điểm Danh ({sessions.length})
        </button>
        <button 
          onClick={() => setActiveTab('ASSIGNMENTS')} 
          className={`tab-btn ${activeTab === 'ASSIGNMENTS' ? 'active' : ''}`}
        >
          📚 Tài Liệu ({assignments.length})
        </button>
        <button 
          onClick={() => setActiveTab('ANALYTICS')} 
          className={`tab-btn ${activeTab === 'ANALYTICS' ? 'active' : ''}`}
        >
          📊 Phân Tích
        </button>
      </div>

      {/* TAB CONTENT: MEMBERS */}
      {activeTab === 'MEMBERS' && (
        <Card style={{ padding: 'var(--spacing-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)', flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--color-text)' }}>Danh sách thành viên lớp</h2>
            <Button onClick={() => { setShowAddMember(true); setSearchQuery(''); setSearchResults([]); }} variant="primary" style={{ minHeight: '44px' }}>
              + Thêm Học Sinh Vào Lớp
            </Button>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-background)' }}>
                  <th style={{ padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)' }}>Họ và Tên</th>
                  <th style={{ padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)' }}>Số Điện Thoại</th>
                  <th style={{ padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)' }}>Trường</th>
                  <th style={{ padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)', textAlign: 'right' }}>Thao tác</th>
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
                      <td style={{ padding: 'var(--spacing-3)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text)' }}>{m.full_name}</td>
                      <td style={{ padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)' }}>{m.phone || 'Chưa cập nhật'}</td>
                      <td style={{ padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)' }}>{m.school_name || '---'}</td>
                      <td style={{ padding: 'var(--spacing-3)', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <Button onClick={() => navigate(`/students/${m.id}`)} variant="outline" size="sm" style={{ minHeight: '36px' }}>Hồ sơ 360°</Button>
                          <Button onClick={() => handleRemoveMember(m.id, m.full_name)} variant="danger" size="sm" style={{ minHeight: '36px' }}>Xóa khỏi lớp</Button>
                        </div>
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
        <div className="sessions-layout-container" style={{ display: 'flex', gap: 'var(--spacing-5)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          
          {/* Cột trái: Danh sách Buổi Học */}
          <Card className="sessions-list-panel" style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', maxHeight: '600px', padding: 'var(--spacing-4)', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)', paddingBottom: 'var(--spacing-2)', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--color-text)' }}>Buổi học ({sessions.length})</h3>
              <Button onClick={handleCreateSession} variant="primary" size="sm" style={{ minHeight: '40px' }}>+ Tạo buổi</Button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
              {sessions.length === 0 ? (
                <EmptyState title="Chưa có buổi học nào" description="Bấm '+ Tạo buổi' để lên lịch học mới." />
              ) : sessions.map(sess => (
                <div 
                  key={sess.id} 
                  onClick={() => selectSession(sess)}
                  style={{ 
                    padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', border: '2px solid', transition: '0.15s',
                    borderColor: activeSession?.id === sess.id ? 'var(--color-primary)' : 'var(--color-border)', 
                    backgroundColor: activeSession?.id === sess.id ? 'var(--color-primary-soft, #eff6ff)' : 'var(--color-surface)' 
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: activeSession?.id === sess.id ? 'var(--color-primary)' : 'var(--color-text)' }}>
                      Ngày {new Date(sess.session_date).toLocaleDateString('vi-VN')}
                    </div>
                    <Badge variant={sess.is_published ? 'primary' : 'warning'}>
                      {sess.is_published ? '🔵 Công bố' : '🟡 Nháp'}
                    </Badge>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    🕒 {sess.start_time ? String(sess.start_time).substring(0,5) : '18:00'}
                  </div>
                  {sess.content && (
                    <div style={{ fontSize: '12px', color: 'var(--color-text)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      📖 {sess.content}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                    <Button onClick={(e) => { e.stopPropagation(); handleEditSession(sess); }} variant="outline" size="sm" style={{ padding: '2px 8px', fontSize: '11px', minHeight: '32px' }}>Sửa</Button>
                    <Button onClick={(e) => { e.stopPropagation(); handleDeleteSession(sess.id); }} variant="danger" size="sm" style={{ padding: '2px 8px', fontSize: '11px', minHeight: '32px' }}>Xóa</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Cột phải: Bảng Điểm danh / Thẻ Điểm danh Mobile */}
          <Card className="attendance-main-panel" style={{ flex: 1, minWidth: '320px', padding: 'var(--spacing-4)', width: '100%', boxSizing: 'border-box' }}>
            {!activeSession ? (
              <EmptyState title="Chọn một buổi học để xem và điểm danh" />
            ) : (
              <div>
                <div style={{ marginBottom: 'var(--spacing-4)', paddingBottom: 'var(--spacing-3)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h2 style={{ margin: 0, color: 'var(--color-text)', fontSize: '18px' }}>
                        Điểm danh — {new Date(activeSession.session_date).toLocaleDateString('vi-VN')}
                      </h2>
                      {!activeSession.is_published && (
                        <Button onClick={handlePublishSession} variant="primary" size="sm" style={{ minHeight: '36px' }}>🚀 Công bố</Button>
                      )}
                      <Button onClick={handleSyncCalendar} variant="secondary" size="sm" style={{ minHeight: '36px' }}>🔄 Sync Calendar</Button>
                    </div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginTop: '4px' }}>
                      Nội dung: <strong>{activeSession.content || 'Buổi học theo chương trình'}</strong>
                    </div>
                  </div>
                  <div style={{ padding: '4px 10px', backgroundColor: 'var(--color-background)', borderRadius: '6px', color: 'var(--color-text-secondary)', fontSize: '12px', fontWeight: 'bold' }}>
                    Sĩ số: {attendanceList.length} học sinh
                  </div>
                </div>

                {/* DESKTOP ATTENDANCE TABLE */}
                <div className="desktop-attendance-table" style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--color-background)' }}>
                        <th style={{ padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)' }}>Học sinh</th>
                        <th style={{ padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)' }}>Trạng thái Điểm danh</th>
                        <th style={{ padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)', textAlign: 'center' }}>Nhận xét & BTVN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceList.length === 0 ? (
                        <tr><td colSpan={3} style={{ padding: 'var(--spacing-6)' }}><EmptyState title="Lớp chưa có học sinh nào." /></td></tr>
                      ) : attendanceList.map(a => {
                        const isRecorded = !!a.status;
                        return (
                          <tr key={a.student_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: 'var(--spacing-3)', fontWeight: 'bold', color: 'var(--color-text)' }}>
                              {a.full_name} <br/>
                              {!isRecorded && (
                                <span style={{ color: 'var(--color-text-secondary)', fontSize: '12px', fontWeight: 'normal' }}>
                                  ⚪ Chưa điểm danh
                                </span>
                              )}
                            </td>
                            <td style={{ padding: 'var(--spacing-3)' }}>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                <Button 
                                  onClick={() => handleUpdateAttendance(a.student_id, 'PRESENT')}
                                  variant={a.status === 'PRESENT' ? 'primary' : 'outline'}
                                  size="sm"
                                  style={{ minHeight: '36px' }}
                                >✅ Có mặt</Button>
                                
                                <Button 
                                  onClick={() => handleUpdateAttendance(a.student_id, 'LATE')}
                                  variant={a.status === 'LATE' ? 'secondary' : 'outline'}
                                  size="sm"
                                  style={{ minHeight: '36px' }}
                                >⏰ Đi muộn</Button>
                                
                                <Button 
                                  onClick={() => handleOpenAbsentModal(a)}
                                  variant={a.status === 'ABSENT_EXCUSED' ? 'danger' : 'outline'}
                                  size="sm"
                                  style={{ minHeight: '36px' }}
                                >🟡 Vắng phép</Button>
                                
                                <Button 
                                  onClick={() => handleUpdateAttendance(a.student_id, 'ABSENT_UNEXCUSED')}
                                  variant={a.status === 'ABSENT_UNEXCUSED' ? 'danger' : 'outline'}
                                  size="sm"
                                  style={{ minHeight: '36px' }}
                                >❌ Vắng K/P</Button>
                              </div>
                              {a.status === 'ABSENT_EXCUSED' && (a.absent_reason || a.notes) && (
                                <div style={{ fontSize: '12px', color: 'var(--color-danger)', marginTop: '4px', fontWeight: '500' }}>
                                  📌 Lý do: {a.absent_reason || a.notes}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: 'var(--spacing-3)', textAlign: 'center' }}>
                              <Button onClick={() => handleOpenEval(a.student_id, a.full_name || 'Học viên')} variant="outline" size="sm" style={{ minHeight: '36px' }}>
                                💬 Nhận xét / BTVN
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE ATTENDANCE CARDS (P0 — ONE-HAND THUMB FRIENDLY) */}
                <div className="mobile-attendance-cards" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {attendanceList.length === 0 ? (
                    <EmptyState title="Lớp chưa có học sinh nào." />
                  ) : attendanceList.map(a => {
                    const statusText = a.status === 'PRESENT' ? '✅ Có mặt' 
                                    : a.status === 'LATE' ? '⏰ Đi muộn'
                                    : a.status === 'ABSENT_EXCUSED' ? '🟡 Vắng có phép'
                                    : a.status === 'ABSENT_UNEXCUSED' ? '❌ Vắng không phép'
                                    : '⚪ Chưa điểm danh';
                    const statusVariant = a.status === 'PRESENT' ? 'success'
                                      : a.status === 'LATE' ? 'warning'
                                      : a.status === 'ABSENT_EXCUSED' ? 'warning'
                                      : a.status === 'ABSENT_UNEXCUSED' ? 'danger'
                                      : 'neutral';

                    return (
                      <div 
                        key={a.student_id}
                        style={{
                          padding: '12px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '15px', color: 'var(--color-text)' }}>{a.full_name}</strong>
                          <Badge variant={statusVariant}>{statusText}</Badge>
                        </div>

                        {/* Large Touch Targets for Quick Attendance */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                          <button
                            onClick={() => handleUpdateAttendance(a.student_id, 'PRESENT')}
                            style={{
                              padding: '10px',
                              borderRadius: '6px',
                              border: a.status === 'PRESENT' ? '2px solid #059669' : '1px solid var(--color-border)',
                              backgroundColor: a.status === 'PRESENT' ? '#ecfdf5' : 'var(--color-surface)',
                              color: a.status === 'PRESENT' ? '#047857' : 'var(--color-text)',
                              fontWeight: a.status === 'PRESENT' ? 'bold' : 'normal',
                              fontSize: '13px',
                              minHeight: '44px',
                              cursor: 'pointer'
                            }}
                          >
                            ✅ Có mặt
                          </button>
                          
                          <button
                            onClick={() => handleUpdateAttendance(a.student_id, 'LATE')}
                            style={{
                              padding: '10px',
                              borderRadius: '6px',
                              border: a.status === 'LATE' ? '2px solid #ea580c' : '1px solid var(--color-border)',
                              backgroundColor: a.status === 'LATE' ? '#fff7ed' : 'var(--color-surface)',
                              color: a.status === 'LATE' ? '#c2410c' : 'var(--color-text)',
                              fontWeight: a.status === 'LATE' ? 'bold' : 'normal',
                              fontSize: '13px',
                              minHeight: '44px',
                              cursor: 'pointer'
                            }}
                          >
                            ⏰ Đi muộn
                          </button>

                          <button
                            onClick={() => handleOpenAbsentModal(a)}
                            style={{
                              padding: '10px',
                              borderRadius: '6px',
                              border: a.status === 'ABSENT_EXCUSED' ? '2px solid #d97706' : '1px solid var(--color-border)',
                              backgroundColor: a.status === 'ABSENT_EXCUSED' ? '#fef3c7' : 'var(--color-surface)',
                              color: a.status === 'ABSENT_EXCUSED' ? '#b45309' : 'var(--color-text)',
                              fontWeight: a.status === 'ABSENT_EXCUSED' ? 'bold' : 'normal',
                              fontSize: '13px',
                              minHeight: '44px',
                              cursor: 'pointer'
                            }}
                          >
                            🟡 Vắng phép
                          </button>

                          <button
                            onClick={() => handleUpdateAttendance(a.student_id, 'ABSENT_UNEXCUSED')}
                            style={{
                              padding: '10px',
                              borderRadius: '6px',
                              border: a.status === 'ABSENT_UNEXCUSED' ? '2px solid #dc2626' : '1px solid var(--color-border)',
                              backgroundColor: a.status === 'ABSENT_UNEXCUSED' ? '#fee2e2' : 'var(--color-surface)',
                              color: a.status === 'ABSENT_UNEXCUSED' ? '#b91c1c' : 'var(--color-text)',
                              fontWeight: a.status === 'ABSENT_UNEXCUSED' ? 'bold' : 'normal',
                              fontSize: '13px',
                              minHeight: '44px',
                              cursor: 'pointer'
                            }}
                          >
                            ❌ Vắng K/P
                          </button>
                        </div>

                        {a.status === 'ABSENT_EXCUSED' && (a.absent_reason || a.notes) && (
                          <div style={{ fontSize: '12px', color: '#b45309', backgroundColor: '#fef3c7', padding: '6px 8px', borderRadius: '4px' }}>
                            📌 Lý do: <strong>{a.absent_reason || a.notes}</strong>
                          </div>
                        )}

                        <Button 
                          onClick={() => handleOpenEval(a.student_id, a.full_name || 'Học viên')} 
                          variant="outline" 
                          size="sm"
                          style={{ width: '100%', minHeight: '44px' }}
                        >
                          💬 Nhận xét / BTVN
                        </Button>
                      </div>
                    );
                  })}
                </div>

              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB CONTENT: ASSIGNMENTS */}
      {activeTab === 'ASSIGNMENTS' && (
        <Card style={{ padding: 'var(--spacing-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ margin: '0 0 2px 0', fontSize: '18px', color: 'var(--color-text)' }}>Tài Liệu & Bài Tập ({assignments.length})</h2>
              <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '13px' }}>Tài liệu và bài tập gán cho lớp {classInfo?.class_name}.</p>
            </div>
            <Button onClick={handleOpenAssignModal} variant="primary" style={{ minHeight: '44px' }}>+ Giao bài tập</Button>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-background)' }}>
                  <th style={{ padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)' }}>Tiêu đề giao bài</th>
                  <th style={{ padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)' }}>Loại</th>
                  <th style={{ padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)' }}>Gắn với buổi học</th>
                  <th style={{ padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)' }}>Hạn chót</th>
                  <th style={{ padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {assignments.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: 'var(--spacing-6)' }}><EmptyState title="Chưa có tài liệu nào được gán." /></td></tr>
                ) : assignments.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--spacing-3)', fontWeight: 'bold', color: 'var(--color-text)' }}>
                      📄 {a.title || a.doc_title || 'Tài liệu'}
                    </td>
                    <td style={{ padding: 'var(--spacing-3)' }}>
                      <Badge variant={a.category === 'EXAM' ? 'primary' : 'info'}>{a.category === 'EXAM' ? 'Đề thi' : 'Tài liệu'}</Badge>
                    </td>
                    <td style={{ padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)' }}>{a.session_info || 'Tài liệu chung'}</td>
                    <td style={{ padding: 'var(--spacing-3)' }}>
                      {a.due_at ? (
                        <Badge variant={new Date(a.due_at) < new Date() ? 'danger' : 'warning'}>
                          ⏰ {new Date(a.due_at).toLocaleDateString('vi-VN')}
                        </Badge>
                      ) : (
                        <span style={{ color: 'var(--color-text-secondary)' }}>Không có hạn</span>
                      )}
                    </td>
                    <td style={{ padding: 'var(--spacing-3)', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        {a.file_url && (
                          <a href={a.file_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                            <Button variant="secondary" size="sm" style={{ minHeight: '36px' }}>Mở file</Button>
                          </a>
                        )}
                        <Button 
                          variant="danger" 
                          size="sm" 
                          style={{ minHeight: '36px' }}
                          onClick={() => handleDeleteAssignment(a.id, a.title || a.doc_title)}
                        >
                          Xóa
                        </Button>
                      </div>
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
        <Card style={{ padding: 'var(--spacing-4)' }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', color: 'var(--color-text)' }}>📊 Phân Tích Chuyên Đề Yếu Nhất Lớp</h2>
          {weakTopics.length === 0 ? (
            <EmptyState title="Chưa có đủ dữ liệu bài làm để phân tích lớp." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {weakTopics.map((t, idx) => (
                <div key={idx} style={{ padding: '12px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '14px', color: 'var(--color-text)' }}>{t.topic_name}</strong>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Tỷ lệ làm đúng: {Math.round(t.avg_accuracy || 0)}%</div>
                  </div>
                  <Badge variant={t.avg_accuracy < 50 ? 'danger' : 'warning'}>{Math.round(t.avg_accuracy || 0)}%</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* MODAL TẠO / SỬA BUỔI HỌC (MOBILE OPTIMIZED VERTICAL FORM) */}
      {showSessionModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <Card style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '20px' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', color: 'var(--color-text)' }}>
              {editingSession?.id ? '✏️ Chỉnh Sửa Buổi Học' : '📅 Tạo Buổi Học Mới'}
            </h2>
            <form onSubmit={handleSaveSession} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Input 
                type="date"
                label="Ngày học"
                value={editingSession?.session_date || ''}
                onChange={e => setEditingSession({ ...editingSession, session_date: e.target.value })}
                required
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
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
              <Input 
                label="Nội dung bài học"
                placeholder="VD: Chuyên đề Phương trình bậc hai..."
                value={editingSession?.content || ''}
                onChange={e => setEditingSession({ ...editingSession, content: e.target.value })}
              />
              <Input 
                label="Bài tập về nhà (BTVN)"
                placeholder="VD: Làm bài 1-5 trang 42..."
                value={editingSession?.homework || ''}
                onChange={e => setEditingSession({ ...editingSession, homework: e.target.value })}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <Button type="button" variant="ghost" onClick={() => setShowSessionModal(false)} style={{ minHeight: '44px' }}>Hủy</Button>
                <Button type="submit" variant="primary" disabled={savingSession} style={{ minHeight: '44px' }}>
                  {savingSession ? 'Đang lưu...' : 'Lưu buổi học'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL VẮNG PHÉP (BOTTOM SHEET / QUICK MODAL) */}
      {showAbsentModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <Card style={{ width: '100%', maxWidth: '440px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: 'var(--color-text)' }}>
              🟡 Điểm danh Vắng Có Phép
            </h3>
            <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Học sinh: <strong>{showAbsentModal.full_name}</strong>
            </p>

            <div style={{ marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>Lý do thường gặp:</span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['🤒 Ốm / Nghỉ bệnh', '🏡 Việc gia đình', '⏳ Trùng lịch học trường', '🚗 Đi xa'].map(reason => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setAbsentReasonInput(reason)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: absentReasonInput === reason ? '#fef3c7' : 'var(--color-surface)',
                      color: absentReasonInput === reason ? '#b45309' : 'var(--color-text)',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <Input 
              label="Lý do chi tiết:"
              placeholder="Nhập lý do nghỉ học..."
              value={absentReasonInput}
              onChange={e => setAbsentReasonInput(e.target.value)}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <Button variant="ghost" onClick={() => setShowAbsentModal(null)} style={{ minHeight: '44px' }}>Đóng</Button>
              <Button variant="primary" onClick={handleSaveAbsentExcused} style={{ minHeight: '44px' }}>Xác nhận Vắng phép</Button>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL THÊM HỌC SINH VÀO LỚP */}
      {showAddMember && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <Card style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '20px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', color: 'var(--color-text)' }}>
              🔎 Thêm Học Sinh Vào Lớp
            </h3>
            
            <Input 
              placeholder="Tìm kiếm theo Tên hoặc Số Điện Thoại..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />

            <div style={{ marginTop: '12px', maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {isSearching ? (
                <div style={{ padding: '12px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Đang tìm...</div>
              ) : searchResults.length === 0 && searchQuery.trim() ? (
                <div style={{ padding: '12px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '13px' }}>Không tìm thấy học sinh phù hợp.</div>
              ) : (
                searchResults.map(st => (
                  <div key={st.id} style={{ padding: '10px 12px', backgroundColor: 'var(--color-background)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--color-border)' }}>
                    <div>
                      <strong style={{ fontSize: '14px', color: 'var(--color-text)' }}>{st.full_name}</strong>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>📞 {st.phone_number || st.phone || 'Chưa có SĐT'} {st.school_name ? `• ${st.school_name}` : ''}</div>
                    </div>
                    <Button onClick={() => handleAddMember(st.id)} variant="primary" size="sm" style={{ minHeight: '36px' }}>
                      + Thêm
                    </Button>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <Button variant="ghost" onClick={() => setShowAddMember(false)} style={{ minHeight: '44px' }}>Đóng</Button>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL NHẬN XÉT & BTVN */}
      {showEvalModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <Card style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '20px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', color: 'var(--color-text)' }}>
              💬 Nhận Xét & Giao BTVN Cho {evalData.student_name}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Mức độ tập trung:</label>
                <select 
                  value={evalData.focus_level}
                  onChange={e => setEvalData({ ...evalData, focus_level: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', minHeight: '44px' }}
                >
                  <option value="Rất tốt">🌟 Rất tốt</option>
                  <option value="Tốt">👍 Tốt</option>
                  <option value="Bình thường">👌 Bình thường</option>
                  <option value="Cần tập trung hơn">⚠️ Cần tập trung hơn</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Nhận xét giáo viên:</label>
                <textarea 
                  rows={3}
                  value={evalData.teacher_notes}
                  onChange={e => setEvalData({ ...evalData, teacher_notes: e.target.value })}
                  placeholder="Nhập nhận xét về buổi học hôm nay..."
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', boxSizing: 'border-box' }}
                />
              </div>

              <Input 
                label="Bài tập về nhà (BTVN):"
                placeholder="VD: Làm bài tập 1, 2, 3 trang 45..."
                value={evalData.homework}
                onChange={e => setEvalData({ ...evalData, homework: e.target.value })}
              />

              <Input 
                type="date"
                label="Hạn nộp BTVN:"
                value={evalData.due_date}
                onChange={e => setEvalData({ ...evalData, due_date: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <Button variant="ghost" onClick={() => setShowEvalModal(false)} style={{ minHeight: '44px' }}>Hủy</Button>
              <Button variant="primary" onClick={handleSaveEval} style={{ minHeight: '44px' }}>Lưu nhận xét</Button>
            </div>
          </Card>
        </div>
      )}

      {/* SYNC SUCCESS CELEBRATION MODAL */}
      {syncSuccessModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <Card style={{ width: '100%', maxWidth: '460px', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎉</div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#047857' }}>
              Đã Thêm Vào Google Calendar!
            </h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              Buổi học đã được tạo thành công và xác thực tồn tại trên tài khoản Google Calendar của bạn.
            </p>

            <div style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px 16px', textAlign: 'left', marginBottom: '20px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div>📖 Buổi học: <strong>{syncSuccessModal.sessionTitle}</strong></div>
              <div>📧 Tài khoản Google: <strong style={{ color: 'var(--color-primary)' }}>{syncSuccessModal.googleAccount}</strong></div>
              <div>🆔 Event ID: <code style={{ fontSize: '11px', color: '#6b7280' }}>{syncSuccessModal.eventId}</code> (200 OK)</div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <Button variant="ghost" onClick={() => setSyncSuccessModal({ ...syncSuccessModal, isOpen: false })} style={{ minHeight: '44px' }}>
                Đóng
              </Button>
              {syncSuccessModal.htmlLink && (
                <Button 
                  variant="primary" 
                  onClick={() => window.open(syncSuccessModal.htmlLink, '_blank')}
                  style={{ minHeight: '44px' }}
                >
                  ↗ Mở trên Google Calendar
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* MODAL GIAO TÀI LIỆU & BÀI TẬP (P0 FIX) */}
      {showAssignModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <Card style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '20px', color: 'var(--color-text)' }}>
              📚 Giao Tài Liệu & Bài Tập Cho Lớp
            </h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Chọn tài liệu / đề thi từ kho lưu trữ để học sinh và phụ huynh xem hoặc làm bài.
            </p>

            <form onSubmit={handleCreateAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Input 
                label="Tiêu đề giao bài (Tùy chọn)"
                placeholder="VD: BTVN Tuần 3 - Phương trình lượng giác..."
                value={assignForm.title}
                onChange={e => setAssignForm({ ...assignForm, title: e.target.value })}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Gắn với buổi học:
                  </label>
                  <select 
                    value={assignForm.session_id} 
                    onChange={e => setAssignForm({ ...assignForm, session_id: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', minHeight: '44px' }}
                  >
                    <option value="">-- Tài liệu chung cả lớp --</option>
                    {sessions.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.session_date ? new Date(s.session_date).toLocaleDateString('vi-VN') : ''} - {s.content || 'Buổi học'}
                      </option>
                    ))}
                  </select>
                </div>

                <Input 
                  type="date"
                  label="Hạn chót nộp bài (Nếu có)"
                  value={assignForm.due_at}
                  onChange={e => setAssignForm({ ...assignForm, due_at: e.target.value })}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-text)' }}>
                    Chọn tài liệu / đề thi ({selectedDocIds.length} đã chọn):
                  </label>
                  {allDocs.length > 0 && (
                    <button 
                      type="button" 
                      onClick={() => {
                        if (selectedDocIds.length === allDocs.length) setSelectedDocIds([]);
                        else setSelectedDocIds(allDocs.map(d => d.id));
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      {selectedDocIds.length === allDocs.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                    </button>
                  )}
                </div>

                <Input 
                  placeholder="🔍 Tìm kiếm tài liệu theo tên..."
                  value={docSearch}
                  onChange={e => setDocSearch(e.target.value)}
                />

                <div style={{ marginTop: '8px', maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: 'var(--color-background)' }}>
                  {allDocs.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                      Chưa có tài liệu nào trong kho. Hãy tải tài liệu lên Kho lưu trữ trước.
                    </div>
                  ) : allDocs
                      .filter(d => !docSearch.trim() || d.title.toLowerCase().includes(docSearch.toLowerCase()))
                      .map(doc => {
                        const isChecked = selectedDocIds.includes(doc.id);
                        return (
                          <label 
                            key={doc.id}
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '10px', 
                              padding: '8px 10px', 
                              borderRadius: '6px', 
                              backgroundColor: isChecked ? 'rgba(59, 130, 246, 0.08)' : 'var(--color-surface)',
                              border: isChecked ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                              cursor: 'pointer' 
                            }}
                          >
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedDocIds([...selectedDocIds, doc.id]);
                                } else {
                                  setSelectedDocIds(selectedDocIds.filter(did => did !== doc.id));
                                }
                              }}
                              style={{ width: '18px', height: '18px' }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {doc.title}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                                {doc.folder_name ? `📁 ${doc.folder_name} • ` : ''} {doc.category === 'EXAM' ? '📝 Đề thi' : '📄 Tài liệu'}
                              </div>
                            </div>
                            <Badge variant={doc.category === 'EXAM' ? 'primary' : 'info'}>
                              {doc.category === 'EXAM' ? 'Đề thi' : 'Tài liệu'}
                            </Badge>
                          </label>
                        );
                      })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <Button type="button" variant="ghost" onClick={() => setShowAssignModal(false)} style={{ minHeight: '44px' }}>
                  Hủy
                </Button>
                <Button type="submit" variant="primary" disabled={isAssigning || selectedDocIds.length === 0} style={{ minHeight: '44px' }}>
                  {isAssigning ? 'Đang giao bài...' : `✓ Giao ${selectedDocIds.length} bài tập`}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <style>{`
        .tab-btn {
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          color: var(--color-text-secondary);
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
          min-height: 40px;
          transition: all 0.15s;
        }
        .tab-btn.active {
          background: var(--color-primary);
          color: #ffffff;
          border-color: var(--color-primary);
          font-weight: bold;
        }

        @media (max-width: 768px) {
          .sessions-layout-container {
            flex-direction: column !important;
          }
          .sessions-list-panel {
            flex: 1 1 100% !important;
            max-height: 240px !important;
          }
          .desktop-attendance-table {
            display: none !important;
          }
          .mobile-attendance-cards {
            display: flex !important;
          }
        }
        @media (min-width: 769px) {
          .desktop-attendance-table {
            display: block !important;
          }
          .mobile-attendance-cards {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ClassDetail;
