import React, { useState, useEffect, useMemo } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate, useLocation } from 'react-router-dom';
import moment from 'moment';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { toast } from 'react-toastify';

type ViewMode = 'month' | 'week' | 'day' | 'agenda';

const TeacherCalendar = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return window.innerWidth < 768 ? 'agenda' : 'month';
  });
  const [agendaFilter, setAgendaFilter] = useState<'all' | 'upcoming' | 'past' | 'draft' | 'unattended'>('all');
  const [googleConnected, setGoogleConnected] = useState<boolean>(false);
  const [googleEmail, setGoogleEmail] = useState<string>('');
  const [selectedSessionForModal, setSelectedSessionForModal] = useState<any>(null);
  const [syncingSessionId, setSyncingSessionId] = useState<number | null>(null);
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

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchSessions();
    checkGoogleCalendarStatus();
  }, []);

  // Check URL params for sync success or error from Google OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('sync') === 'success') {
      const email = params.get('email');
      if (email) setGoogleEmail(email);
      toast.success(`Kết nối Google Calendar thành công! ${email ? `Tài khoản: ${email}` : ''}`);
      setGoogleConnected(true);
      checkGoogleCalendarStatus();
      navigate('/quan-ly-tien-do', { replace: true });
    } else if (params.get('sync') === 'error') {
      toast.warn('Không thể kết nối Google Calendar hoặc bạn đã hủy xác thực.');
      navigate('/quan-ly-tien-do', { replace: true });
    }
  }, [location.search, navigate]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/api/sessions');
      setSessions(res.data || []);
    } catch (err) {
      console.error("Lỗi lấy danh sách buổi học:", err);
    } finally {
      setLoading(false);
    }
  };

  const checkGoogleCalendarStatus = async () => {
    try {
      const res = await axiosClient.get('/api/calendar/status');
      setGoogleConnected(Boolean(res.data?.connected));
      if (res.data?.email) {
        setGoogleEmail(res.data.email);
      }
    } catch (e) {
      setGoogleConnected(false);
      setGoogleEmail('');
    }
  };

  const handleConnectCalendar = async () => {
    try {
      const res = await axiosClient.get('/api/calendar/auth-url');
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        toast.error('Không tìm thấy đường dẫn liên kết Google Calendar.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Chức năng Google Calendar chưa được cấu hình Client ID trên hệ thống.');
    }
  };

  const handleSyncSession = async (session: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!session.is_published) {
      toast.warn('Buổi học đang ở trạng thái Nháp. Vui lòng vào chi tiết lớp để Công bố buổi học trước khi đồng bộ.');
      return;
    }
    setSyncingSessionId(session.id);
    try {
      const res = await axiosClient.post(`/api/sessions/${session.id}/sync-calendar`);
      if (res.data?.success || res.data?.event_id) {
        setSyncSuccessModal({
          isOpen: true,
          eventId: res.data.event_id || '',
          htmlLink: res.data.html_link || (res.data.event_id ? `https://calendar.google.com/calendar/r/eventedit/${res.data.event_id}` : 'https://calendar.google.com'),
          googleAccount: res.data.calendar_account || googleEmail || 'Tài khoản Google của bạn',
          sessionTitle: session.class_name ? `[${session.class_name}] ${session.content || 'Lịch học'}` : 'Buổi học'
        });
      } else {
        toast.success(res.data?.message || 'Đồng bộ buổi học lên Google Calendar thành công!');
      }
      fetchSessions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi đồng bộ lên Google Calendar.');
    } finally {
      setSyncingSessionId(null);
    }
  };

  const todayStr = moment().format('YYYY-MM-DD');

  // Business status calculation
  const getSessionStatus = (session: any) => {
    const sessDateStr = moment(session.session_date).format('YYYY-MM-DD');
    const isPast = sessDateStr < todayStr;
    const isDraft = !session.is_published;
    const hasAttendance = (Number(session.eval_count) > 0) || (Number(session.attendance_count) > 0);

    if (isDraft) {
      return { label: '🟡 Nháp', variant: 'warning' as const, color: '#d97706', bg: '#fef3c7', type: 'DRAFT' };
    }
    if (!isPast) {
      return { label: '🔵 Sắp diễn ra', variant: 'primary' as const, color: '#2563eb', bg: '#eff6ff', type: 'UPCOMING' };
    }
    if (hasAttendance) {
      return { label: '🟢 Đã điểm danh', variant: 'success' as const, color: '#059669', bg: '#ecfdf5', type: 'ATTENDED' };
    }
    return { label: '⚠️ Chưa điểm danh', variant: 'danger' as const, color: '#dc2626', bg: '#fee2e2', type: 'MISSED' };
  };

  // Grouped sessions by date
  const sessionsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    (Array.isArray(sessions) ? sessions : []).forEach(s => {
      const dateKey = moment(s.session_date).format('YYYY-MM-DD');
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(s);
    });
    return map;
  }, [sessions]);

  // Upcoming sessions (today and future)
  const upcomingSessions = useMemo(() => {
    return (Array.isArray(sessions) ? sessions : [])
      .filter(s => moment(s.session_date).format('YYYY-MM-DD') >= todayStr)
      .sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime())
      .slice(0, 4);
  }, [sessions, todayStr]);

  // Recent taught sessions (past + attended or past)
  const recentSessions = useMemo(() => {
    return (Array.isArray(sessions) ? sessions : [])
      .filter(s => moment(s.session_date).format('YYYY-MM-DD') < todayStr)
      .sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime())
      .slice(0, 4);
  }, [sessions, todayStr]);

  // Filtered sessions for Selected Date
  const selectedDateStr = moment(selectedDate).format('YYYY-MM-DD');
  const selectedDateSessions = sessionsByDate[selectedDateStr] || [];

  // Filtered sessions for Agenda View
  const agendaSessions = useMemo(() => {
    let list = Array.isArray(sessions) ? [...sessions] : [];
    
    if (agendaFilter === 'upcoming') {
      list = list.filter(s => moment(s.session_date).format('YYYY-MM-DD') >= todayStr);
    } else if (agendaFilter === 'past') {
      list = list.filter(s => moment(s.session_date).format('YYYY-MM-DD') < todayStr);
    } else if (agendaFilter === 'draft') {
      list = list.filter(s => !s.is_published);
    } else if (agendaFilter === 'unattended') {
      list = list.filter(s => {
        const isPast = moment(s.session_date).format('YYYY-MM-DD') < todayStr;
        const noAtt = (Number(s.eval_count) === 0) && (Number(s.attendance_count) === 0);
        return isPast && noAtt;
      });
    }

    return list.sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime());
  }, [sessions, agendaFilter, todayStr]);

  // Calendar Day Grid Generator for Month View (Starts on Monday)
  const generateMonthDays = () => {
    const startOfMonth = moment(currentDate).startOf('month');
    const endOfMonth = moment(currentDate).endOf('month');
    
    // Start from the Monday of the first week
    const startOfCalendar = moment(startOfMonth).startOf('isoWeek');
    const endOfCalendar = moment(endOfMonth).endOf('isoWeek');
    
    const days = [];
    const day = moment(startOfCalendar);
    
    while (day.isSameOrBefore(endOfCalendar, 'day')) {
      days.push(day.clone());
      day.add(1, 'day');
    }
    return days;
  };

  // Week View Days (Monday to Sunday)
  const generateWeekDays = () => {
    const startOfWeek = moment(currentDate).startOf('isoWeek');
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(moment(startOfWeek).add(i, 'day'));
    }
    return days;
  };

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(moment(currentDate).subtract(1, 'month').toDate());
    } else if (viewMode === 'week') {
      setCurrentDate(moment(currentDate).subtract(1, 'week').toDate());
    } else if (viewMode === 'day') {
      const prevDay = moment(selectedDate).subtract(1, 'day').toDate();
      setSelectedDate(prevDay);
      setCurrentDate(prevDay);
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(moment(currentDate).add(1, 'month').toDate());
    } else if (viewMode === 'week') {
      setCurrentDate(moment(currentDate).add(1, 'week').toDate());
    } else if (viewMode === 'day') {
      const nextDay = moment(selectedDate).add(1, 'day').toDate();
      setSelectedDate(nextDay);
      setCurrentDate(nextDay);
    }
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  return (
    <div style={{ padding: 'var(--spacing-8)', maxWidth: '100%', boxSizing: 'border-box' }}>
      
      {/* HEADER WITH OUTSIDE GOOGLE CALENDAR INTEGRATION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
        <div>
          <h1 style={{ margin: '0 0 6px 0', color: 'var(--color-text)', fontSize: '28px', fontWeight: '800' }}>📅 Thời Khóa Biểu & Lịch Dạy</h1>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '14px' }}>Theo dõi lịch giảng dạy trực quan, quản lý trạng thái buổi học và đồng bộ Google Calendar.</p>
        </div>

        {/* Integration Button located strictly outside the timetable grid */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {googleConnected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: '#ecfdf5', border: '1px solid #10b981', borderRadius: '8px', color: '#047857', fontSize: '13px', fontWeight: 'bold' }}>
                <span>✓ Google Calendar: {googleEmail ? googleEmail : 'Đã kết nối'}</span>
              </div>
              <Button onClick={handleConnectCalendar} variant="outline" size="sm" style={{ minHeight: '36px' }}>
                Đổi tài khoản / Kết nối lại
              </Button>
            </div>
          ) : (
            <Button onClick={handleConnectCalendar} variant="primary" style={{ minHeight: '40px' }}>
              🔗 Tích hợp Google Calendar
            </Button>
          )}
        </div>
      </div>

      {/* TOP SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-5)', marginBottom: 'var(--spacing-6)' }}>
        
        {/* Card: Sắp tới */}
        <Card style={{ borderLeft: '4px solid var(--color-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--color-text)' }}>📌 Buổi Học Sắp Tới</h3>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>{upcomingSessions.length} buổi</span>
          </div>
          {upcomingSessions.length === 0 ? (
            <div style={{ padding: '10px 0', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
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
                    style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--color-background)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', border: '1px solid var(--color-border)' }}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '13.5px', color: 'var(--color-text)' }}>
                        {s.class_name || 'Lớp học'} — {moment(s.session_date).format('DD/MM')}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--color-text)' }}>🕒 Đã Dạy Gần Đây</h3>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>{recentSessions.length} buổi</span>
          </div>
          {recentSessions.length === 0 ? (
            <div style={{ padding: '10px 0', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
              Chưa có buổi học nào trong lịch sử.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentSessions.map(s => {
                const status = getSessionStatus(s);
                return (
                  <div 
                    key={s.id} 
                    onClick={() => navigate(`/classes/${s.class_id}`)}
                    style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--color-background)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', border: '1px solid var(--color-border)' }}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '13.5px', color: 'var(--color-text)' }}>
                        {s.class_name || 'Lớp học'} — {moment(s.session_date).format('DD/MM')}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
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
      </div>

      {/* MAIN TIMETABLE CONTAINER */}
      <Card style={{ padding: 'var(--spacing-6)' }}>
        
        {/* TIMETABLE TOOLBAR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)', flexWrap: 'wrap', gap: '14px' }}>
          
          {/* Navigation Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Hôm nay
            </Button>
            <div style={{ display: 'flex', border: '1px solid var(--color-border)', borderRadius: '6px', overflow: 'hidden' }}>
              <button onClick={handlePrev} style={{ padding: '6px 12px', border: 'none', background: 'var(--color-surface)', cursor: 'pointer', color: 'var(--color-text)' }}>◀</button>
              <button onClick={handleNext} style={{ padding: '6px 12px', border: 'none', borderLeft: '1px solid var(--color-border)', background: 'var(--color-surface)', cursor: 'pointer', color: 'var(--color-text)' }}>▶</button>
            </div>
            <h2 style={{ margin: '0 0 0 8px', fontSize: '18px', fontWeight: 'bold', color: 'var(--color-text)' }}>
              {viewMode === 'month' && moment(currentDate).format('[Tháng] MM, YYYY')}
              {viewMode === 'week' && `Tuần ${moment(currentDate).startOf('isoWeek').format('DD/MM')} — ${moment(currentDate).endOf('isoWeek').format('DD/MM/YYYY')}`}
              {viewMode === 'day' && moment(selectedDate).format('dddd, [ngày] DD/MM/YYYY')}
              {viewMode === 'agenda' && 'Danh sách lịch dạy'}
            </h2>
          </div>

          {/* 4 View Modes: Month / Week / Day / Agenda */}
          <div style={{ display: 'flex', border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--color-surface)' }}>
            {[
              { id: 'month', label: '📅 Tháng' },
              { id: 'week', label: '🗓️ Tuần' },
              { id: 'day', label: '📆 Ngày' },
              { id: 'agenda', label: '📋 Danh sách' }
            ].map(tab => {
              const isActive = viewMode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id as ViewMode)}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: isActive ? 'bold' : 'normal',
                    backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--color-text)',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: MONTH VIEW (Tháng) */}
        {/* ========================================================================= */}
        {viewMode === 'month' && (
          <div>
            {/* Weekday headers starting from Monday */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-secondary)', paddingBottom: '10px', borderBottom: '1px solid var(--color-border)' }}>
              <div>Thứ 2</div>
              <div>Thứ 3</div>
              <div>Thứ 4</div>
              <div>Thứ 5</div>
              <div>Thứ 6</div>
              <div>Thứ 7</div>
              <div>Chủ Nhật</div>
            </div>

            {/* Month Day Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', backgroundColor: 'var(--color-border)', border: '1px solid var(--color-border)', borderRadius: '6px', overflow: 'hidden', marginTop: '1px' }}>
              {generateMonthDays().map((dayMoment, idx) => {
                const dateKey = dayMoment.format('YYYY-MM-DD');
                const isCurrentMonth = dayMoment.month() === currentDate.getMonth();
                const isToday = dateKey === todayStr;
                const isSelected = dateKey === selectedDateStr;
                const daySessions = sessionsByDate[dateKey] || [];

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedDate(dayMoment.toDate());
                      if (daySessions.length > 0) {
                        // Open day drawer or switch to day view
                      }
                    }}
                    style={{
                      minHeight: '100px',
                      backgroundColor: isSelected 
                        ? 'var(--color-primary-light, #eff6ff)' 
                        : isToday 
                        ? 'var(--color-surface)' 
                        : isCurrentMonth 
                        ? 'var(--color-surface)' 
                        : 'var(--color-background)',
                      padding: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      opacity: isCurrentMonth ? 1 : 0.45,
                      border: isToday ? '2px solid var(--color-primary)' : isSelected ? '2px solid var(--color-primary)' : 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    {/* Day number & Today marker */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: (isToday || isSelected) ? 'bold' : 'normal', color: isToday ? 'var(--color-primary)' : 'var(--color-text)' }}>
                        {dayMoment.date()}
                      </span>
                      {isToday && (
                        <span style={{ fontSize: '10px', backgroundColor: 'var(--color-primary)', color: '#fff', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                          Hôm nay
                        </span>
                      )}
                    </div>

                    {/* Session Badges / Pills */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, overflowY: 'auto' }}>
                      {daySessions.slice(0, 3).map((sess) => {
                        const status = getSessionStatus(sess);
                        return (
                          <div
                            key={sess.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSessionForModal(sess);
                            }}
                            title={`${sess.class_name || 'Lớp'}: ${sess.content || ''} (${status.label})`}
                            style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '600',
                              backgroundColor: status.bg,
                              color: status.color,
                              border: `1px solid ${status.color}30`,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            <span>{sess.start_time ? String(sess.start_time).substring(0, 5) : '18:00'}</span> {sess.class_name || 'Lớp'}
                          </div>
                        );
                      })}

                      {daySessions.length > 3 && (
                        <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: 'bold', padding: '1px 4px' }}>
                          +{daySessions.length - 3} buổi khác
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Day Overview underneath Month View */}
            {selectedDateSessions.length > 0 && (
              <div style={{ marginTop: '20px', padding: '16px', backgroundColor: 'var(--color-background)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--color-text)' }}>
                  📌 Chi tiết lịch ngày <strong>{moment(selectedDate).format('DD/MM/YYYY')}</strong> ({selectedDateSessions.length} buổi học):
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
                  {selectedDateSessions.map(sess => {
                    const status = getSessionStatus(sess);
                    return (
                      <div 
                        key={sess.id}
                        style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                          <strong style={{ fontSize: '14px', color: 'var(--color-text)' }}>{sess.class_name || 'Lớp học'}</strong>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                          🕒 {sess.start_time ? String(sess.start_time).substring(0,5) : '18:00'} {sess.content ? `• ${sess.content}` : ''}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <Button size="sm" variant="outline" onClick={() => navigate(`/classes/${sess.class_id}`)}>
                            Vào lớp
                          </Button>
                          {sess.is_published && googleConnected && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              disabled={syncingSessionId === sess.id}
                              onClick={(e) => handleSyncSession(sess, e)}
                            >
                              {syncingSessionId === sess.id ? 'Đang sync...' : '🔄 Sync Google'}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: WEEK VIEW (Tuần) */}
        {/* ========================================================================= */}
        {viewMode === 'week' && (
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: '700px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                {generateWeekDays().map((dayMoment, idx) => {
                  const dateKey = dayMoment.format('YYYY-MM-DD');
                  const isToday = dateKey === todayStr;
                  const daySessions = sessionsByDate[dateKey] || [];

                  return (
                    <div 
                      key={idx}
                      style={{
                        backgroundColor: isToday ? 'var(--color-primary-light, #eff6ff)' : 'var(--color-background)',
                        borderRadius: '8px',
                        border: isToday ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        padding: '10px',
                        minHeight: '260px',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <div style={{ textAlign: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px', marginBottom: '8px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>{dayMoment.format('ddd')}</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: isToday ? 'var(--color-primary)' : 'var(--color-text)' }}>{dayMoment.format('DD/MM')}</div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                        {daySessions.length === 0 ? (
                          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: '20px' }}>Trống lịch</div>
                        ) : (
                          daySessions.map(sess => {
                            const status = getSessionStatus(sess);
                            return (
                              <div
                                key={sess.id}
                                onClick={() => setSelectedSessionForModal(sess)}
                                style={{
                                  padding: '8px',
                                  borderRadius: '6px',
                                  backgroundColor: 'var(--color-surface)',
                                  border: `1px solid ${status.color}40`,
                                  borderLeft: `4px solid ${status.color}`,
                                  cursor: 'pointer',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                                }}
                              >
                                <div style={{ fontWeight: 'bold', fontSize: '12px', color: 'var(--color-text)' }}>{sess.class_name}</div>
                                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>🕒 {sess.start_time ? String(sess.start_time).substring(0,5) : '18:00'}</div>
                                <div style={{ marginTop: '4px' }}>
                                  <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '4px', backgroundColor: status.bg, color: status.color, fontWeight: 'bold' }}>
                                    {status.label}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: DAY VIEW (Ngày) */}
        {/* ========================================================================= */}
        {viewMode === 'day' && (
          <div>
            <div style={{ marginBottom: '16px', padding: '12px 16px', backgroundColor: 'var(--color-background)', borderRadius: '8px', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Ngày được chọn:</span>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--color-text)' }}>
                  {moment(selectedDate).format('dddd, [ngày] DD/MM/YYYY')}
                </div>
              </div>
              <Badge variant={selectedDateSessions.length > 0 ? "primary" : "neutral"}>
                {selectedDateSessions.length} buổi học
              </Badge>
            </div>

            {selectedDateSessions.length === 0 ? (
              <EmptyState title="Không có lịch dạy" description="Không có buổi học nào được xếp vào ngày này." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedDateSessions.map(sess => {
                  const status = getSessionStatus(sess);
                  return (
                    <div 
                      key={sess.id}
                      style={{
                        padding: '16px',
                        borderRadius: '10px',
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderLeft: `5px solid ${status.color}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <h3 style={{ margin: 0, fontSize: '17px', color: 'var(--color-text)' }}>
                            🏫 {sess.class_name || 'Lớp học'}
                          </h3>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                          🕒 Thời gian: <strong>{sess.start_time ? String(sess.start_time).substring(0,5) : '18:00'}</strong>
                          {sess.content && ` • Bài học: ${sess.content}`}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button variant="primary" size="sm" onClick={() => navigate(`/classes/${sess.class_id}`)}>
                          📝 Điểm danh / Quản lý lớp
                        </Button>
                        {sess.is_published && googleConnected && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={syncingSessionId === sess.id}
                            onClick={(e) => handleSyncSession(sess, e)}
                          >
                            {syncingSessionId === sess.id ? 'Đang sync...' : '🔄 Sync Google'}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: AGENDA (Danh Sách) */}
        {/* ========================================================================= */}
        {viewMode === 'agenda' && (
          <div>
            {/* Filter Chips */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'upcoming', label: '📌 Sắp diễn ra' },
                { id: 'past', label: '🕒 Đã qua' },
                { id: 'draft', label: '🟡 Nháp' },
                { id: 'unattended', label: '⚠️ Chưa điểm danh' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setAgendaFilter(f.id as any)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: agendaFilter === f.id ? 'bold' : 'normal',
                    border: '1px solid var(--color-border)',
                    backgroundColor: agendaFilter === f.id ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: agendaFilter === f.id ? '#ffffff' : 'var(--color-text)',
                    cursor: 'pointer'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {agendaSessions.length === 0 ? (
              <EmptyState title="Không tìm thấy buổi học" description="Không có buổi học nào phù hợp với bộ lọc hiện tại." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {agendaSessions.map(sess => {
                  const status = getSessionStatus(sess);
                  return (
                    <div
                      key={sess.id}
                      style={{
                        padding: '14px 18px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderLeft: `4px solid ${status.color}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '15px', color: 'var(--color-text)' }}>
                            {moment(sess.session_date).format('DD/MM/YYYY')}
                          </span>
                          <span style={{ color: 'var(--color-text-secondary)' }}>•</span>
                          <span style={{ fontWeight: '600', color: 'var(--color-text)' }}>{sess.class_name}</span>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                          🕒 {sess.start_time ? String(sess.start_time).substring(0,5) : '18:00'} {sess.content ? `— ${sess.content}` : ''}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/classes/${sess.class_id}`)}>
                          Chi tiết lớp
                        </Button>
                        {sess.is_published && googleConnected && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            disabled={syncingSessionId === sess.id}
                            onClick={(e) => handleSyncSession(sess, e)}
                          >
                            {syncingSessionId === sess.id ? 'Đang sync...' : '🔄 Sync Google'}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </Card>

      {/* SESSION DETAIL MODAL */}
      {selectedSessionForModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <Card style={{ width: '100%', maxWidth: '480px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Chi tiết buổi học</span>
                <h2 style={{ margin: '4px 0 0 0', fontSize: '20px', color: 'var(--color-text)' }}>{selectedSessionForModal.class_name}</h2>
              </div>
              <Badge variant={getSessionStatus(selectedSessionForModal).variant}>
                {getSessionStatus(selectedSessionForModal).label}
              </Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: 'var(--color-text)', marginBottom: '24px' }}>
              <div>📅 Ngày học: <strong>{moment(selectedSessionForModal.session_date).format('DD/MM/YYYY')}</strong></div>
              <div>🕒 Giờ bắt đầu: <strong>{selectedSessionForModal.start_time ? String(selectedSessionForModal.start_time).substring(0,5) : '18:00'}</strong></div>
              <div>📖 Nội dung: <strong>{selectedSessionForModal.content || 'Chưa cập nhật'}</strong></div>
              {selectedSessionForModal.google_event_id && (
                <div style={{ color: '#059669', fontSize: '12px' }}>✓ Đã đồng bộ với Google Calendar</div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap' }}>
              <Button variant="ghost" onClick={() => setSelectedSessionForModal(null)}>
                Đóng
              </Button>
              {selectedSessionForModal.google_event_id && (
                <Button 
                  variant="secondary"
                  onClick={() => window.open(`https://calendar.google.com/calendar/r/eventedit/${selectedSessionForModal.google_event_id}`, '_blank')}
                >
                  ↗ Mở trên Google Calendar
                </Button>
              )}
              {selectedSessionForModal.is_published && googleConnected && (
                <Button 
                  variant="outline"
                  disabled={syncingSessionId === selectedSessionForModal.id}
                  onClick={() => handleSyncSession(selectedSessionForModal)}
                >
                  {syncingSessionId === selectedSessionForModal.id ? 'Đang sync...' : '🔄 Sync Google'}
                </Button>
              )}
              <Button variant="primary" onClick={() => navigate(`/classes/${selectedSessionForModal.class_id}`)}>
                Đến lớp học
              </Button>
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

    </div>
  );
};

export default TeacherCalendar;
