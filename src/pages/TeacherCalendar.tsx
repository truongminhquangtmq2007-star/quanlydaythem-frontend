import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';

const TeacherCalendar = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axiosClient.get('/api/sessions');
      setSessions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Lọc buổi học theo ngày đã chọn
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

  return (
    <div style={{ padding: 'var(--spacing-10)', maxWidth: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--spacing-8)' }}>
        <div>
          <h1 style={{ margin: '0 0 var(--spacing-2) 0', color: 'var(--color-text)', fontSize: '30px' }}>Lịch Giảng Dạy</h1>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Quản lý thời khóa biểu và các buổi học sắp tới.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--spacing-6)', flexWrap: 'wrap' }}>
        
        {/* Lịch Tháng (Grid) */}
        <Card style={{ flex: 2, minWidth: '350px' }}>
          <div style={{ padding: 'var(--spacing-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)' }}>
             <Button variant="ghost" onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}>&lt; Tháng trước</Button>
             <h3 style={{ margin: 0 }}>Tháng {selectedDate.getMonth() + 1}, {selectedDate.getFullYear()}</h3>
             <Button variant="ghost" onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}>Tháng sau &gt;</Button>
          </div>
          
          <div style={{ padding: 'var(--spacing-6)' }}>
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
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-primary-dark)' }} />
                            )}
                        </div>
                    );
                })}
            </div>
          </div>
        </Card>

        {/* Agenda View */}
        <Card style={{ flex: 1, minWidth: '300px', backgroundColor: 'var(--color-surface-interactive)' }}>
            <div style={{ padding: 'var(--spacing-6)', borderBottom: '1px solid var(--color-border)' }}>
                <h3 style={{ margin: 0, color: 'var(--color-text)' }}>Lịch trình ngày {selectedDate.toLocaleDateString('vi-VN')}</h3>
            </div>
            <div style={{ padding: 'var(--spacing-6)' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>Đang tải...</div>
                ) : filteredSessions.length === 0 ? (
                    <EmptyState title="Trống lịch" description="Không có lớp học nào được xếp vào ngày này." />
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                        {filteredSessions.map(session => (
                            <div onClick={() => window.location.href = `/classes/${session.class_id}?tab=SESSIONS`} key={session.id} style={{ padding: 'var(--spacing-4)', backgroundColor: session.is_paid ? '#dcfce7' : 'var(--color-surface-elevated)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--color-primary)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <strong style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text)' }}>{session.title || 'Buổi học'} {session.is_paid && <Badge variant="success">Đã thanh toán</Badge>}</strong>
                                    <Badge variant={session.status === 'COMPLETED' ? 'success' : 'primary'}>{session.status}</Badge>
                                </div>
                                <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span>⏰ {new Date(session.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(session.end_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                    {session.class_name && <span>🏫 Lớp: {session.class_name}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Card>

      </div>
    </div>
  );
};

export default TeacherCalendar;
