import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';

moment.locale('vi');
const localizer = momentLocalizer(moment);

const TeacherCalendar = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [events, setEvents] = useState<any[]>([]);
  
  const [showModal, setShowModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showTuitionModal, setShowTuitionModal] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('sync') === 'primary') {
      alert('Đã liên kết Google Calendar thành công!');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('sync') === 'error') {
      alert('Liên kết Google Calendar thất bại!');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const [formData, setFormData] = useState<any>({ id: null, session_date: '', start_time: '', content: '', homework: '' });
  const [students, setStudents] = useState<any[]>([]);
  const [evalForm, setEvalForm] = useState({ student_id: '', is_present: true, focus_level: '🌟 Tốt', teacher_notes: '' });

  const [tuitionStudentId, setTuitionStudentId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pricePerSession, setPricePerSession] = useState(200000);
  const [billNote, setBillNote] = useState(''); 
  
  const [sessionList, setSessionList] = useState<any[]>([]);
  const [currentEvaluations, setCurrentEvaluations] = useState<any[]>([]);
  
  const bankInfo = {
    bankId: 'VCB', 
    accountNo: '1034244823',
    accountName: 'TRUONG MINH QUANG'
  };

  const fetchClasses = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axiosClient.get(`/api/classes`);
      setClasses(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchStudents = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axiosClient.get(`/api/students`);
      setStudents(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSessions = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const url = selectedClassId 
        ? `/api/sessions?class_id=${selectedClassId}`
        : `/api/sessions`;

      const res = await axiosClient.get(url);
      const calendarEvents = res.data.map((session: any) => {
        const localDateStr = moment(session.session_date).format('YYYY-MM-DD');
        const start = new Date(`${localDateStr}T${session.start_time || '00:00'}`);
        const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); 
        const title = session.class_name ? `[${session.class_name}] ${session.content || 'Chưa nhập'}` : (session.content || 'Chưa nhập');
        
        return { 
          id: session.id, 
          title: title, 
          start, 
          end, 
          is_published: session.is_published, 
          is_evaluated: parseInt(session.eval_count) > 0,
          raw_data: session 
        };
      });
      setEvents(calendarEvents);
    } catch (error) {
      console.error(error);
    }
  }, [selectedClassId]);

  const handleSelectEvent = (event: any) => {
    const data = event.raw_data;
    setFormData({ 
      id: data.id, 
      session_date: moment(data.session_date).format('YYYY-MM-DD'), 
      start_time: data.start_time || '', 
      content: data.content || '', 
      homework: data.homework || '', 
      is_published: data.is_published 
    });
    setShowModal(true);
  };

  const handleOpenAttendance = async () => {
    setShowModal(false); 
    setShowAttendanceModal(true);
    const token = localStorage.getItem('token');
    try {
      const res = await axiosClient.get(`/api/sessions/evaluations?session_id=${formData.id}`);
      setCurrentEvaluations(res.data);
    } catch (error) {
      console.log("Lỗi tải danh sách đã đánh giá");
    }
  };

  useEffect(() => { fetchClasses(); fetchStudents(); }, []);
  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const handleSelectSlot = ({ start }: any) => {
    if (!selectedClassId) return alert("Vui lòng chọn 1 lớp cụ thể ở góc trên để thêm lịch!");
    setFormData({ id: null, session_date: moment(start).format('YYYY-MM-DD'), start_time: '18:00', content: '', homework: '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    try {
      await axiosClient.post(`/api/sessions/upsert`, { ...formData, class_id: selectedClassId });
      setShowModal(false); fetchSessions(); 
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa buổi học này không?")) return;
    const token = localStorage.getItem('token');
    try {
      await axiosClient.delete(`/api/sessions/${formData.id}`);
      setShowModal(false); 
      fetchSessions(); 
    } catch (error) {
      alert("❌ Lỗi khi xóa lịch học!");
    }
  };

  const handlePublishClass = async () => {
    if (!selectedClassId || !window.confirm("Gửi lịch cho Phụ huynh?")) return;
    const token = localStorage.getItem('token');
    try {
      await axiosClient.post(`/api/sessions/publish`, { class_id: selectedClassId });
      alert("🚀 Đã gửi lịch học!"); fetchSessions(); 
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveEvaluation = async () => {
    if (!evalForm.student_id) return alert("Vui lòng chọn học sinh để đánh giá!");
    const token = localStorage.getItem('token');
    try {
      await axiosClient.post(`/api/sessions/evaluate`, {
        session_id: formData.id,
        student_id: evalForm.student_id, 
        is_present: evalForm.is_present,
        focus_level: evalForm.focus_level,
        teacher_notes: evalForm.teacher_notes
      });
      
      setShowAttendanceModal(false);
      alert('✅ Đã lưu đánh giá thành công!');
      fetchSessions();
    } catch (error) {
      alert('❌ Lỗi lưu đánh giá. Hãy kiểm tra lại file sessionRoutes.ts');
    }
  };

 useEffect(() => {
    const calculateTuition = async () => {
      if (!tuitionStudentId || !startDate || !endDate) {
        setSessionList([]); return;
      }
      const token = localStorage.getItem('token');
      try {
        const res = await axiosClient.get(`/api/sessions/published?student_id=${tuitionStudentId}`);
        const filtered = res.data.filter((s: any) => {
          if (!s.session_date || !s.is_present) return false;
          
          const sDate = moment(s.session_date).format('YYYY-MM-DD');
          
          return sDate >= startDate && sDate <= endDate;
        });
        setSessionList(filtered);
      } catch (error) {
      console.error(error);
    }
    };
    calculateTuition();
  }, [tuitionStudentId, startDate, endDate]);

  const unbilledSessions = sessionList.filter(s => !s.is_billed);
  const unpaidSessions = sessionList.filter(s => s.is_billed && !s.is_paid);
  
  const totalAmount = unbilledSessions.length * pricePerSession;
  const currentStudent = students.find(s => s.id.toString() === tuitionStudentId);
  const qrLink = `https://img.vietqr.io/image/${bankInfo.bankId}-${bankInfo.accountNo}-compact2.png?amount=${totalAmount}&addInfo=${encodeURIComponent(`Hoc phi ${currentStudent?.full_name || ''}`)}&accountName=${encodeURIComponent(bankInfo.accountName)}`;

  const handlePrintAndBill = async () => {
    if (unbilledSessions.length === 0) return alert("Không có buổi học mới nào để xuất phiếu!");
    const confirmBill = window.confirm("Hệ thống sẽ In phiếu, KHÓA các buổi học này và chuyển dữ liệu sang trang Quản lý Tài chính. Bạn có chắc chắn?");
    if (!confirmBill) return;

    window.print();
    const token = localStorage.getItem('token');
    try {
      await axiosClient.post(`/api/payments/create`, {
        student_id: tuitionStudentId, 
        start_date: startDate, 
        end_date: endDate,
        total_amount: totalAmount,
        bill_note: billNote
      });
      
      alert("✅ Đã tạo Phiếu thu! Hãy vào mục Quản lý Tài chính để theo dõi.");
      setShowTuitionModal(false);
      fetchSessions(); 
    } catch (error) {
      alert("❌ Lỗi khi xuất hóa đơn.");
    }
  };

  return (
    <div style={{ padding: 'var(--spacing-10)', width: '100%', boxSizing: 'border-box', position: 'relative' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-8)', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--color-text)', fontSize: '28px', fontWeight: '800' }}>Lịch Dạy & Điểm Danh</h1>
          <p style={{ margin: '8px 0 0 0', color: 'var(--color-text-secondary)', fontSize: '15px' }}>Quản lý tiến độ và đánh giá học viên.</p>
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--spacing-4)', alignItems: 'center' }}>
          <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', outline: 'none' }}>
            <option value="">🌍 Tất cả các lớp (Lịch Tổng)</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
          </select>
          {selectedClassId && (
            <Button onClick={handlePublishClass} variant="primary">🚀 Gửi Lịch Báo Bài</Button>
          )}
          <Button onClick={() => setShowTuitionModal(true)} variant="primary">💰 Quản Lý Thu Tiền</Button>
          <Button onClick={() => {
              const token = localStorage.getItem('token');
              const rawApiUrl = import.meta.env.VITE_API_URL || 'https://quanlydaythem-api.onrender.com';
              const apiUrl = rawApiUrl.replace(/\/+$/, '');
              window.location.href = `${apiUrl}/api/calendar/auth?token=${token}`;
            }} variant="outline">
            📅 Tích hợp Google Calendar
          </Button>
        </div>
      </div>

      {/* CHÚ THÍCH MÀU SẮC LỊCH DẠY */}
      <div style={{ display: 'flex', gap: 'var(--spacing-5)', marginBottom: 'var(--spacing-4)', padding: '0 5px' }}>
        <Badge variant="warning">Lịch Nháp</Badge>
        <Badge variant="primary">Đã gửi Phụ huynh</Badge>
        <Badge variant="primary">Đã dạy & Đánh giá</Badge>
      </div>

      <Card style={{ height: '70vh', padding: 'var(--spacing-5)' }}>
        <Calendar 
          localizer={localizer} 
          events={events} 
          startAccessor="start" 
          endAccessor="end" 
          selectable={true} 
          onSelectSlot={handleSelectSlot} 
          onSelectEvent={handleSelectEvent}
          views={['month', 'week', 'day', 'agenda']} 
          defaultView="month"
          eventPropGetter={(event) => {
            let bgColor = 'var(--color-warning)'; // Cam (Nháp)
            if (event.is_evaluated) bgColor = 'var(--color-success)'; 
            else if (event.is_published) bgColor = 'var(--color-primary)'; 
            return { style: { backgroundColor: bgColor, color: 'var(--color-surface)', borderRadius: '6px', border: 'none' }};
          }}
          messages={{ next: "Sau", previous: "Trước", today: "Hôm nay", month: "Tháng", week: "Tuần", day: "Ngày", agenda: "Lịch trình" }} 
          style={{ height: '100%' }} 
        />
      </Card>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <Card style={{ width: '500px' }}>
            <h3 style={{ marginTop: 0, color: 'var(--color-text)' }}>{formData.id ? '✏️ Chỉnh sửa buổi học' : '➕ Thêm buổi học mới'}</h3>
            <div style={{ display: 'flex', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-4)' }}>
              <Input type="date" value={formData.session_date} onChange={e => setFormData({...formData, session_date: e.target.value})} style={{ flex: 1 }} />
              <Input type="time" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} style={{ flex: 1 }} />
            </div>
            <textarea rows={2} value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} placeholder="Nội dung bài dạy..." style={{ width: '100%', padding: 'var(--spacing-2)', marginBottom: 'var(--spacing-4)', boxSizing: 'border-box', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} />
            
            {formData.id && (
              <Button onClick={handleOpenAttendance} variant="outline" style={{ width: '100%', marginBottom: 'var(--spacing-5)', borderStyle: 'dashed' }}>📝 Đánh giá học sinh</Button>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-2)' }}>
              {formData.id && (
                <Button onClick={handleDelete} variant="danger" style={{ marginRight: 'auto' }}>
                  🗑️ Xóa Lịch
                </Button>
              )}
              <Button onClick={() => setShowModal(false)} variant="ghost">Đóng</Button>
              <Button onClick={handleSave} variant="primary">💾 Lưu Lịch</Button>
            </div>
          </Card>
        </div>
      )}

      {showAttendanceModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1050 }}>
          <Card style={{ width: '500px' }}>
            <h3 style={{ marginTop: 0, color: 'var(--color-text)', borderBottom: '1px solid var(--color-background)', paddingBottom: 'var(--spacing-4)' }}>📝 Đánh giá buổi học</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)', marginTop: 'var(--spacing-5)' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-1)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Chọn Học Sinh:</label>
                <select value={evalForm.student_id} onChange={e => setEvalForm({...evalForm, student_id: e.target.value})} style={{ width: '100%', padding: 'var(--spacing-3)', border: '1px solid var(--color-border)', outline: 'none', backgroundColor: 'var(--color-background)' }}>
                  <option value="">-- Chọn học sinh --</option>
                  {students.map(s => {
                    const isEvaluated = currentEvaluations.some(e => e.student_id === s.id);
                    return (
                      <option key={s.id} value={s.id}>
                        {s.full_name || s.name} {isEvaluated ? '✅ (Đã đánh giá)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 'var(--spacing-4)' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: 'var(--spacing-1)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Điểm danh:</label>
                  <select 
                    value={evalForm.is_present ? 'true' : 'false'} 
                    onChange={e => {
                      const isPresent = e.target.value === 'true';
                      setEvalForm({ 
                        ...evalForm, 
                        is_present: isPresent, 
                        focus_level: isPresent ? '🌟 Tốt' : '-', 
                        teacher_notes: isPresent ? (evalForm.teacher_notes === 'Học sinh vắng mặt' ? '' : evalForm.teacher_notes) : 'Học sinh vắng mặt' 
                      });
                    }} 
                    style={{ width: '100%', padding: 'var(--spacing-3)', border: '1px solid var(--color-border)', outline: 'none', backgroundColor: 'var(--color-background)' }}
                  >
                    <option value="true">✅ Có mặt</option>
                    <option value="false">❌ Vắng mặt</option>
                  </select>
                </div>
                {evalForm.is_present && (
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: 'var(--spacing-1)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Thái độ học:</label>
                    <select value={evalForm.focus_level} onChange={e => setEvalForm({...evalForm, focus_level: e.target.value})} style={{ width: '100%', padding: 'var(--spacing-3)', border: '1px solid var(--color-border)', outline: 'none', backgroundColor: 'var(--color-background)' }}>
                      <option value="🌟 Tốt">🌟 Tốt</option>
                      <option value="👍 Khá">👍 Khá</option>
                      <option value="⚠️ Cần cố gắng">⚠️ Cần cố gắng</option>
                    </select>
                  </div>
                )}
              </div>
              {evalForm.is_present && (
                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--spacing-1)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Lời khuyên / Nhận xét:</label>
                  <textarea rows={3} value={evalForm.teacher_notes} onChange={e => setEvalForm({...evalForm, teacher_notes: e.target.value})} placeholder="Ghi chú về bài tập..." style={{ width: '100%', padding: 'var(--spacing-3)', border: '1px solid var(--color-border)', outline: 'none', boxSizing: 'border-box', backgroundColor: 'var(--color-background)' }} />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-2)', marginTop: '25px' }}>
              <Button onClick={() => setShowAttendanceModal(false)} variant="ghost">Hủy</Button>
              <Button onClick={handleSaveEvaluation} variant="primary">Lưu Đánh Giá</Button>
            </div>
          </Card>
        </div>
      )}

      {showTuitionModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
          <Card style={{ width: '900px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--color-background)', paddingBottom: 'var(--spacing-4)', marginBottom: '25px' }}>
              <h2 style={{ margin: 0, color: 'var(--color-success)' }}>💰 Bảng Kê Học Phí</h2>
              
              <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                {unbilledSessions.length > 0 && (
                  <Button onClick={handlePrintAndBill} variant="primary">
                    🖨️ In Phiếu & Chốt Sổ ({unbilledSessions.length} buổi)
                  </Button>
                )}
                <Button onClick={() => setShowTuitionModal(false)} variant="ghost">Đóng</Button>
              </div>
            </div>

            <div className="no-print" style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: 'var(--spacing-2)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-secondary)' }}>Nhận xét/Ghi chú cho Phụ huynh (Tùy chọn):</label>
              <textarea rows={2} value={billNote} onChange={e => setBillNote(e.target.value)} placeholder="Ví dụ: Quang tháng này học rất tiến bộ..." style={{ width: '100%', padding: 'var(--spacing-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div className="no-print" style={{ display: 'flex', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-8)', flexWrap: 'wrap' }}>
              <select value={tuitionStudentId} onChange={(e) => setTuitionStudentId(e.target.value)} style={{ flex: 1, padding: 'var(--spacing-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <option value="">-- Chọn Học Sinh --</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.full_name || s.name}</option>)}
              </select>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              <span style={{ display: 'flex', alignItems: 'center', color: 'var(--color-text-secondary)' }}>đến</span>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              <Input type="number" value={pricePerSession.toString()} onChange={e => setPricePerSession(Number(e.target.value))} placeholder="Đơn giá" style={{ width: '120px' }} />
            </div>

            {tuitionStudentId && unbilledSessions.length > 0 && (
              <div className="print-area" style={{ backgroundColor: '#f0fdf4', padding: 'var(--spacing-10)', borderRadius: '16px', border: '1px solid #bbf7d0', display: 'flex', gap: 'var(--spacing-8)' }}>
                <div style={{ flex: 2 }}>
                  <h1 style={{ color: '#047857', margin: '0 0 5px 0', fontSize: '26px', textTransform: 'uppercase' }}>Phiếu Báo Học Phí</h1>
                  <p style={{ margin: '0 0 20px 0', color: 'var(--color-text-secondary)' }}>Kỳ học: {startDate ? new Date(startDate).toLocaleDateString('vi-VN') : '...'} - {endDate ? new Date(endDate).toLocaleDateString('vi-VN') : '...'}</p>
                  
                  {billNote && (
                    <div style={{ padding: 'var(--spacing-4)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-5)', border: '2px dashed var(--color-success)', backgroundColor: '#f0fdf4' }}>
                      <p style={{ margin: 0, color: '#065f46', fontSize: 'var(--font-size-base)', lineHeight: '1.5' }}>
                        <strong style={{ fontSize: 'var(--font-size-lg)' }}>📝 Nhận xét tháng này:</strong><br/>
                        <span style={{ color: 'var(--color-text)', fontStyle: 'italic', marginTop: 'var(--spacing-2)', display: 'block' }}>
                          {billNote}
                        </span>
                      </p>
                    </div>
                  )}

                  <div style={{ backgroundColor: 'var(--color-surface)', padding: 'var(--spacing-5)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--spacing-5)', border: '1px solid var(--color-border)' }}>
                    <p style={{ margin: '0 0 10px 0' }}>Học viên: <strong style={{ color: 'var(--color-text)', fontSize: 'var(--font-size-lg)' }}>{currentStudent?.full_name}</strong></p>
                    <p style={{ margin: '0 0 10px 0' }}>Đơn giá: <strong>{pricePerSession.toLocaleString('vi-VN')} đ/buổi</strong></p>
                    <p style={{ margin: '0' }}>Số buổi: <strong style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-lg)' }}>{unbilledSessions.length}</strong> buổi</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#d1fae5', color: '#065f46' }}>
                          <th style={{ padding: 'var(--spacing-3)', textAlign: 'left' }}>Ngày học</th>
                          <th style={{ padding: 'var(--spacing-3)', textAlign: 'left' }}>Nội dung</th>
                        </tr>
                      </thead>
                      <tbody>
                        {unbilledSessions.map((s) => (
                          <tr key={s.id} style={{ borderBottom: '1px solid var(--color-background)' }}>
                            <td style={{ padding: 'var(--spacing-3)', fontWeight: 'var(--font-weight-bold)' }}>{new Date(s.session_date).toLocaleDateString('vi-VN')}</td>
                            <td style={{ padding: 'var(--spacing-3)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{s.content}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ flex: 1, backgroundColor: 'var(--color-surface)', padding: '25px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #6ee7b7' }}>
                  <p style={{ margin: '0 0 10px 0', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-bold)' }}>CẦN THANH TOÁN</p>
                  <h2 style={{ margin: '0 0 20px 0', color: 'var(--color-danger)', fontSize: 'var(--font-size-3xl)' }}>{totalAmount.toLocaleString('vi-VN')}đ</h2>
                  {totalAmount > 0 && <img src={qrLink} alt="QR" style={{ width: '100%', maxWidth: '200px', borderRadius: 'var(--radius-md)' }} />}
                </div>
              </div>
            )}
            
            {tuitionStudentId && unbilledSessions.length === 0 && unpaidSessions.length > 0 && (
              <div className="no-print" style={{ backgroundColor: '#eff6ff', padding: 'var(--spacing-10)', borderRadius: '16px', border: '1px solid #bfdbfe', textAlign: 'center' }}>
                <h2 style={{ color: 'var(--color-primary)' }}>⏳ Hóa đơn đã xuất</h2>
                <p style={{ color: 'var(--color-primary)', fontSize: 'var(--font-size-base)' }}>Học sinh này có <strong>{unpaidSessions.length} buổi học</strong> đã xuất phiếu thu.<br/>Hãy vào mục <strong>Quản lý Tài chính</strong> để xác nhận thu tiền hoặc xem lại phiếu.</p>
              </div>
            )}
            
            {tuitionStudentId && sessionList.length > 0 && unbilledSessions.length === 0 && unpaidSessions.length === 0 && (
              <div className="no-print" style={{ backgroundColor: '#f0fdf4', padding: 'var(--spacing-10)', borderRadius: '16px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                <h2 style={{ color: '#15803d' }}>✅ Đã thanh toán đầy đủ</h2>
                <p style={{ color: '#166534', fontSize: 'var(--font-size-base)' }}>Tất cả các buổi học trong khoảng thời gian này đều đã được thu tiền.</p>
              </div>
            )}

          </Card>
        </div>
      )}

      <style>{`
        @media print { 
          body * { visibility: hidden; } 
          .print-area, .print-area * { visibility: visible; } 
          .print-area { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            padding: 20px !important; 
            border: 2px solid var(--color-border) !important; 
            border-radius: 20px !important; 
            box-shadow: none !important; 
          } 
          .no-print { display: none !important; } 
          * { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
          table { border-radius: 12px !important; overflow: hidden !important; border: 1px solid var(--color-border) !important; }
          th { background-color: #d1fae5 !important; color: #065f46 !important; }
        }
      `}</style> 
    </div>
  );
};

export default TeacherCalendar;
