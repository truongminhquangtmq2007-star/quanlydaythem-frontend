import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';

const TeacherCalendar = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await axiosClient.get('/api/sessions');
      setSessions(res.data || []);
    } catch (err) {
      console.error("Lỗi lấy danh sách buổi học:", err);
    } finally {
      setLoading(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to determine session status
  const getSessionStatus = (session: any) => {
    const sessDateStr = new Date(session.session_date).toISOString().split('T')[0];
    const isPast = sessDateStr < todayStr;
    const isDraft = !session.is_published;
    const hasAttendance = (Number(session.eval_count) > 0) || (Number(session.attendance_count) > 0);

    if (isDraft) {
      return { label: '🟡 Nháp', variant: 'warning' as const, type: 'DRAFT' };
    }
    if (!isPast) {
      return { label: '🔵 Sắp diễn ra', variant: 'primary' as const, type: 'UPCOMING' };
    }
    if (hasAttendance) {
      return { label: '🟢 Đã điểm danh', variant: 'success' as const, type: 'ATTENDED' };
    }
    return { label: '⚠️ Chưa điểm danh', variant: 'danger' as const, type: 'MISSED' };
  };

  // Upcoming sessions (today and future)
  const upcomingSessions = (Array.isArray(sessions) ? sessions : [])
    .filter(s => {
      const sDate = new Date(s.session_date).toISOString().split('T')[0];
      return sDate >= todayStr;
    })
    .sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime())
    .slice(0, 4);

  // Recent sessions (past)
  const recentSessions = (Array.isArray(sessions) ? sessions : [])
    .filter(s => {
      const sDate = new Date(s.session_date).toISOString().split('T')[0];
      return sDate < todayStr;
    })
    .sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime())
    .slice(0, 4);

  // Filtered by selected date
  const filteredSessions = (Array.isArray(sessions) ? sessions : []).filter(s => {
    const sessionDate = new Date(s.session_date);
    return sessionDate.toDateString() === selectedDate.toDateString();
  });

  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    // Fill empty days for padding
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    // Fill actual days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getEventCount = (date: Date) => {
    return (Array.isArray(sessions) ? sessions : []).filter(s => {
      const sd = new Date(s.session_date);
      return sd.toDateString() === date.toDateString();
    }).length;
  };

  const handleConnectCalendar = async () => {
    try {
      const res = await axiosClient.get('/api/calendar/auth-url');
      if (res.data?.url) {
        window.open(res.data.url, '_blank');
      } else {
        alert('Không tìm thấy đường dẫn liên kết Google Calendar.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Chức năng Google Calendar chưa được cấu hình Client ID trên hệ thống.');
    }
  };

  return (
    <div style={{ padding: 'var(--spacing-10)', maxWidth: '100%', boxSizing: 'border-box' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-6)', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
        <div>
          <h1 style={{ margin: '0 0 var(--spacing-2) 0', color: 'var(--color-text)', fontSize: '30px' }}>📅 Thời Khóa Biểu & Lịch Dạy</h1>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Theo dõi lịch giảng dạy, buổi học sắp tới và trạng thái điểm danh.</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
          <Button onClick={handleConnectCalendar} variant="secondary">
            🔗 Tích hợp Google Calendar
          </Button>
        </div>
      </div>

      {/* UPCOMING & RECENT SUMMARY SECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--spacing-6)', marginBottom: 'var(--spacing-8)' }}>
        
        {/* Card: Sắp tới */}
        <Card style={{ borderLeft: '4px solid var(--color-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--color-text)' }}>📌 Buổi Học Sắp Tới</h3>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{upcomingSessions.length} buổi</span>
          </div>
          {upcomingSessions.length === 0 ? (
            <div style={{ padding: '15px 0', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
              Không có buổi học nào sắp tới.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {upcomingSessions.map(s => {
                const status = getSessionStatus(s);
                return (
                  <div 
                    key={s.id} 
                    onClick={() => navigate(`/classes/${s.class_id}`)}
                    style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: 'var(--color-background)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--color-text)' }}>
                        {s.class_name || 'Lớp học'} — {new Date(s.session_date).toLocaleDateString('vi-VN')}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        🕒 {s.start_time ? String(s.start_time).substring(0,5) : '18:00'} {s.content ? `• ${s.content}` : ''}
                      </div>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Card: Đã dạy gần đây */}
        <Card style={{ borderLeft: '4px solid var(--color-success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--color-text)' }}>🕒 Đã Dạy Gần Đây</h3>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{recentSessions.length} buổi</span>
          </div>
          {recentSessions.length === 0 ? (
            <div style={{ padding: '15px 0', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
              Chưa có buổi học nào đã diễn ra.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentSessions.map(s => {
                const status = getSessionStatus(s);
                return (
                  <div 
                    key={s.id} 
                    onClick={() => navigate(`/classes/${s.class_id}`)}
                    style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: 'var(--color-background)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--color-text)' }}>
                        {s.class_name || 'Lớp học'} — {new Date(s.session_date).toLocaleDateString('vi-VN')}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        🕒 {s.start_time ? String(s.start_time).substring(0,5) : '18:00'}
                      </div>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* CALENDAR & AGENDA GRID */}
      <div style={{ display: 'flex', gap: 'var(--spacing-6)', flexWrap: 'wrap' }}>
        
        {/* Lịch Tháng (Grid) */}
        <Card style={{ flex: 2, minWidth: '350px' }}>
          <div style={{ padding: 'var(--spacing-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)' }}>
            <Button variant="ghost" onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}>&lt; Tháng trước</Button>
            <h3 style={{ margin: 0, color: 'var(--color-text)' }}>Tháng {selectedDate.getMonth() + 1}, {selectedDate.getFullYear()}</h3>
            <Button variant="ghost" onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}>Tháng sau &gt;</Button>
          </div>
          
          <div style={{ padding: 'var(--spacing-4)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 'var(--spacing-2)', textAlign: 'center', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-4)', color: 'var(--color-text-secondary)' }}>
              <div>CN</div><div>T2</div><div>T3</div><div>T4</div><div>T5</div><div>T6</div><div>T7</div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 'var(--spacing-2)' }}>
              {generateCalendarDays().map((date, idx) => {
                if (!date) return <div key={idx} style={{ padding: '15px' }} />;
                
                const isSelected = date.toDateString() === selectedDate.toDateString();
                const isToday = date.toDateString() === new Date().toDateString();
                const eventCount = getEventCount(date);

                let bg = 'transparent';
                let color = 'var(--color-text)';
                
                if (isSelected) {
                  bg = 'var(--color-primary)';
                  color = 'white';
                } else if (isToday) {
                  bg = 'var(--color-primary-light)';
                } else if (eventCount > 0) {
                  bg = 'var(--color-surface)';
                }

                return (
                  <div 
                    key={idx} 
                    onClick={() => setSelectedDate(date)}
                    style={{ 
                      padding: '15px 5px', 
                      textAlign: 'center', 
                      backgroundColor: bg,
                      color: color,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span style={{ fontWeight: (isSelected || isToday) ? 'var(--font-weight-bold)' : 'normal' }}>{date.getDate()}</span>
                    {eventCount > 0 && !isSelected && (
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Agenda View */}
        <Card style={{ flex: 1, minWidth: '320px' }}>
          <div style={{ padding: 'var(--spacing-4)', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ margin: 0, color: 'var(--color-text)' }}>Lịch ngày {selectedDate.toLocaleDateString('vi-VN')}</h3>
          </div>
          <div style={{ padding: 'var(--spacing-4)' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>Đang tải...</div>
            ) : filteredSessions.length === 0 ? (
              <EmptyState title="Trống lịch" description="Không có buổi học nào được xếp vào ngày này." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                {filteredSessions.map(session => {
                  const status = getSessionStatus(session);
                  return (
                    <div 
                      key={session.id} 
                      onClick={() => navigate(`/classes/${session.class_id}`)}
                      style={{ 
                        padding: 'var(--spacing-4)', 
                        backgroundColor: 'var(--color-background)', 
                        borderRadius: 'var(--radius-md)', 
                        borderLeft: '4px solid var(--color-primary)', 
                        cursor: 'pointer' 
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <strong style={{ fontSize: '15px', color: 'var(--color-text)' }}>
                          🏫 {session.class_name || 'Lớp học'}
                        </strong>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span>🕒 Giờ: {session.start_time ? String(session.start_time).substring(0,5) : '18:00'}</span>
                        {session.content && <span>📖 Nội dung: {session.content}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

      </div>
    </div>
  );
};

export default TeacherCalendar;
