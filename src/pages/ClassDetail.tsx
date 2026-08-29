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
              <h1 style={{ margin: 0, fontSize: 'var(--font-size-3xl)', color: 'var(--color-text)' }}>{classInfo.name || classInfo.class_name}</h1>
              {classInfo.class_type === 'ONLINE' ? (
                <Badge variant="info">📡 LỚP ONLINE</Badge>
              ) : (
                <Badge variant="warning">🏫 LỚP OFFLINE</Badge>
              )}
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-8)', color: 'var(--color-text-secondary)', fontSize: '15px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>Mã lớp: <strong style={{ color: '#334155', backgroundColor: 'var(--color-background)', padding: '4px 10px', borderRadius: '6px' }}>{classInfo.class_code || '---'}</strong></span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>Môn học: <strong style={{ color: '#334155' }}>{classInfo.subject || '---'}</strong></span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>Sĩ số: <strong style={{ color: 'var(--color-primary)' }}>{members.length}/{classInfo.max_students || 20}</strong></span>
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
                    🕒 {sess.start_time ? sess.start_time.substring(0,5) : '18:00'} - {sess.end_time ? sess.end_time.substring(0,5) : '19:30'}
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
                                onClick={() => handleUpdateAttendance(a.student_id, 'ABSENT_EXCUSED')}
                                variant={a.status === 'ABSENT_EXCUSED' ? 'danger' : 'outline'}
                              >📝 Vắng phép</Button>
                              
                              <Button 
                                onClick={() => handleUpdateAttendance(a.student_id, 'ABSENT_UNEXCUSED')}
                                variant={a.status === 'ABSENT_UNEXCUSED' ? 'danger' : 'outline'}
                              >❌ Vắng K/P</Button>
                            </div>
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
          <Card style={{ width: '450px' }}>
            <h2 style={{ margin: '0 0 25px 0', color: 'var(--color-text)' }}>Thêm Học Sinh Vào Lớp</h2>
            <form onSubmit={handleAddMember}>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-2)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>ID Học sinh</label>
                <Input required value={newStudentId} onChange={(e: any) => setNewStudentId(e.target.value)} type="number" placeholder="Nhập ID học sinh (Ví dụ: 1, 2, 3...)" />
                <p style={{ margin: '8px 0 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>*Bạn có thể xem ID học sinh ở menu Học viên.</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)' }}>
                <Button type="button" onClick={() => setShowAddMember(false)} variant="ghost">Hủy</Button>
                <Button type="submit" variant="primary">Thêm Học Sinh</Button>
              </div>
            </form>
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
