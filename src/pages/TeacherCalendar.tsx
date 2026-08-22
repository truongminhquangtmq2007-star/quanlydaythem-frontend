import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

moment.locale('vi');
const localizer = momentLocalizer(moment);

const TeacherCalendar = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [events, setEvents] = useState<any[]>([]);
  
  const [showModal, setShowModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showTuitionModal, setShowTuitionModal] = useState(false);
  
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
      const res = await axios.get('https://quanlydaythem-api.onrender.com/api/classes', { headers: { Authorization: `Bearer ${token}` } });
      setClasses(res.data);
    } catch (error) {}
  };

  const fetchStudents = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get('https://quanlydaythem-api.onrender.com/api/students', { headers: { Authorization: `Bearer ${token}` } });
      setStudents(res.data);
    } catch (error) {}
  };

  const fetchSessions = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      // Đã sửa: Nếu không có selectedClassId, lấy Lịch Tổng của mọi lớp
      const url = selectedClassId 
        ? `https://quanlydaythem-api.onrender.com/api/sessions?class_id=${selectedClassId}`
        : `https://quanlydaythem-api.onrender.com/api/sessions`;

      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
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
          is_evaluated: parseInt(session.eval_count) > 0, // <-- THÊM DÒNG NÀY ĐỂ NHẬN DIỆN MÀU
          raw_data: session 
        };
      });
      setEvents(calendarEvents);
    } catch (error) {}
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
      const res = await axios.get(`https://quanlydaythem-api.onrender.com/api/sessions/evaluations?session_id=${formData.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentEvaluations(res.data);
    } catch (error) {
      console.log("Lỗi tải danh sách đã đánh giá");
    }
  };

  useEffect(() => { fetchClasses(); fetchStudents(); }, []);
  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const handleSelectSlot = ({ start }: any) => {
    // Đã sửa: Chặn không cho thêm lịch nếu đang ở Lịch Tổng
    if (!selectedClassId) return alert("Vui lòng chọn 1 lớp cụ thể ở góc trên để thêm lịch!");
    setFormData({ id: null, session_date: moment(start).format('YYYY-MM-DD'), start_time: '18:00', content: '', homework: '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.post('https://quanlydaythem-api.onrender.com/api/sessions/upsert', { ...formData, class_id: selectedClassId }, { headers: { Authorization: `Bearer ${token}` } });
      setShowModal(false); fetchSessions(); 
    } catch (error) {}
  };

  const handleDelete = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa buổi học này không?")) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`https://quanlydaythem-api.onrender.com/api/sessions/${formData.id}`, { headers: { Authorization: `Bearer ${token}` } });
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
      await axios.post('https://quanlydaythem-api.onrender.com/api/sessions/publish', { class_id: selectedClassId }, { headers: { Authorization: `Bearer ${token}` } });
      alert("🚀 Đã gửi lịch học!"); fetchSessions(); 
    } catch (error) {}
  };

  const handleSaveEvaluation = async () => {
    if (!evalForm.student_id) return alert("Vui lòng chọn học sinh để đánh giá!");
    const token = localStorage.getItem('token');
    try {
      await axios.post('https://quanlydaythem-api.onrender.com/api/sessions/evaluate', {
        session_id: formData.id,
        student_id: evalForm.student_id, 
        is_present: evalForm.is_present,
        focus_level: evalForm.focus_level,
        teacher_notes: evalForm.teacher_notes
      }, { headers: { Authorization: `Bearer ${token}` } });
      
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
        const res = await axios.get(`https://quanlydaythem-api.onrender.com/api/sessions/published?student_id=${tuitionStudentId}`, { headers: { Authorization: `Bearer ${token}` } });
        const filtered = res.data.filter((s: any) => {
          if (!s.session_date || !s.is_present) return false;
          
          // [ĐÃ SỬA LỖI MÚI GIỜ]: Dùng moment để định dạng ngày chuẩn xác 100%
          const sDate = moment(s.session_date).format('YYYY-MM-DD');
          
          return sDate >= startDate && sDate <= endDate;
        });
        setSessionList(filtered);
      } catch (error) {}
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
      await axios.post('https://quanlydaythem-api.onrender.com/api/bills/create', {
        student_id: tuitionStudentId, 
        start_date: startDate, 
        end_date: endDate,
        total_amount: totalAmount,
        bill_note: billNote
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      alert("✅ Đã tạo Phiếu thu! Hãy vào mục Quản lý Tài chính để theo dõi.");
      setShowTuitionModal(false);
      fetchSessions(); 
    } catch (error) {
      alert("❌ Lỗi khi xuất hóa đơn.");
    }
  };

  return (
    <div style={{ padding: '40px', width: '100%', boxSizing: 'border-box', position: 'relative' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ margin: 0, color: '#1e293b', fontSize: '28px', fontWeight: '800' }}>Lịch Dạy & Điểm Danh</h1>
          <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: '15px' }}>Quản lý tiến độ và đánh giá học viên.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none' }}>
            <option value="">🌍 Tất cả các lớp (Lịch Tổng)</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
          </select>
          {selectedClassId && (
            <button onClick={handlePublishClass} style={{ padding: '12px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>🚀 Gửi Lịch Báo Bài</button>
          )}
          <button onClick={() => setShowTuitionModal(true)} style={{ padding: '12px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>💰 Quản Lý Thu Tiền</button>
        </div>
      </div>

      {/* CHÚ THÍCH MÀU SẮC LỊCH DẠY */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '15px', padding: '0 5px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748b' }}>
          <span style={{ width: '16px', height: '16px', backgroundColor: '#f59e0b', borderRadius: '4px' }}></span> Lịch Nháp
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748b' }}>
          <span style={{ width: '16px', height: '16px', backgroundColor: '#3b82f6', borderRadius: '4px' }}></span> Đã gửi Phụ huynh
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748b' }}>
          <span style={{ width: '16px', height: '16px', backgroundColor: '#10b981', borderRadius: '4px' }}></span> Đã dạy & Đánh giá
        </div>
      </div>

      <div style={{ height: '70vh', backgroundColor: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
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
          /* LOGIC ĐỔI MÀU THÔNG MINH */
          eventPropGetter={(event) => {
            let bgColor = '#f59e0b'; // Cam (Nháp)
            if (event.is_evaluated) bgColor = '#10b981'; // Xanh lá (Đã đánh giá xong)
            else if (event.is_published) bgColor = '#3b82f6'; // Xanh dương (Đã chốt gửi phụ huynh)
            return { style: { backgroundColor: bgColor, color: 'white', borderRadius: '6px', border: 'none' }};
          }}
          messages={{ next: "Sau", previous: "Trước", today: "Hôm nay", month: "Tháng", week: "Tuần", day: "Ngày", agenda: "Lịch trình" }} 
          style={{ height: '100%' }} 
        />
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '500px' }}>
            <h3 style={{ marginTop: 0, color: '#1e293b' }}>{formData.id ? '✏️ Chỉnh sửa buổi học' : '➕ Thêm buổi học mới'}</h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <input type="date" value={formData.session_date} onChange={e => setFormData({...formData, session_date: e.target.value})} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              <input type="time" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            </div>
            <textarea rows={2} value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} placeholder="Nội dung bài dạy..." style={{ width: '100%', padding: '10px', marginBottom: '15px', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            
            {formData.id && (
              <button onClick={handleOpenAttendance} style={{ width: '100%', padding: '12px', background: '#f1f5f9', color: '#3b82f6', border: '1px dashed #3b82f6', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '20px' }}>📝 Đánh giá học sinh</button>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              {formData.id && (
                <button onClick={handleDelete} style={{ padding: '10px 15px', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginRight: 'auto' }}>
                  🗑️ Xóa Lịch
                </button>
              )}
              <button onClick={() => setShowModal(false)} style={{ padding: '10px 15px', backgroundColor: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Đóng</button>
              <button onClick={handleSave} style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>💾 Lưu Lịch</button>
            </div>
          </div>
        </div>
      )}

      {showAttendanceModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1050 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', width: '500px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' }}>📝 Đánh giá buổi học</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569', fontSize: '14px' }}>Chọn Học Sinh:</label>
                <select value={evalForm.student_id} onChange={e => setEvalForm({...evalForm, student_id: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#f8fafc' }}>
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

              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569', fontSize: '14px' }}>Điểm danh:</label>
                  <select 
                    value={evalForm.is_present ? 'true' : 'false'} 
                    onChange={e => {
                      const isPresent = e.target.value === 'true';
                      setEvalForm({ 
                        ...evalForm, 
                        is_present: isPresent, 
                        focus_level: isPresent ? '🌟 Tốt' : '-', 
                        // Sửa lỗi: Tự động xóa chữ "Học sinh vắng mặt" nếu đổi lại thành Có mặt
                        teacher_notes: isPresent ? (evalForm.teacher_notes === 'Học sinh vắng mặt' ? '' : evalForm.teacher_notes) : 'Học sinh vắng mặt' 
                      });
                    }} 
                    style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#f8fafc' }}
                  >
                    <option value="true">✅ Có mặt</option>
                    <option value="false">❌ Vắng mặt</option>
                  </select>
                </div>
                {evalForm.is_present && (
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569', fontSize: '14px' }}>Thái độ học:</label>
                    <select value={evalForm.focus_level} onChange={e => setEvalForm({...evalForm, focus_level: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#f8fafc' }}>
                      <option value="🌟 Tốt">🌟 Tốt</option>
                      <option value="👍 Khá">👍 Khá</option>
                      <option value="⚠️ Cần cố gắng">⚠️ Cần cố gắng</option>
                    </select>
                  </div>
                )}
              </div>
              {evalForm.is_present && (
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569', fontSize: '14px' }}>Lời khuyên / Nhận xét:</label>
                  <textarea rows={3} value={evalForm.teacher_notes} onChange={e => setEvalForm({...evalForm, teacher_notes: e.target.value})} placeholder="Ghi chú về bài tập..." style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', backgroundColor: '#f8fafc' }} />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '25px' }}>
              <button onClick={() => setShowAttendanceModal(false)} style={{ padding: '12px 20px', backgroundColor: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: 'bold' }}>Hủy</button>
              <button onClick={handleSaveEvaluation} style={{ padding: '12px 25px', backgroundColor: '#0f172a', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Lưu Đánh Giá</button>
            </div>
          </div>
        </div>
      )}

      {showTuitionModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '20px', width: '900px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px', marginBottom: '25px' }}>
              <h2 style={{ margin: 0, color: '#10b981' }}>💰 Bảng Kê Học Phí</h2>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                {unbilledSessions.length > 0 && (
                  <button onClick={handlePrintAndBill} style={{ padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    🖨️ In Phiếu & Chốt Sổ ({unbilledSessions.length} buổi)
                  </button>
                )}
                <button onClick={() => setShowTuitionModal(false)} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Đóng</button>
              </div>
            </div>

            <div className="no-print" style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#475569' }}>Nhận xét/Ghi chú cho Phụ huynh (Tùy chọn):</label>
              <textarea rows={2} value={billNote} onChange={e => setBillNote(e.target.value)} placeholder="Ví dụ: Quang tháng này học rất tiến bộ..." style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div className="no-print" style={{ display: 'flex', gap: '15px', marginBottom: '30px', flexWrap: 'wrap' }}>
              <select value={tuitionStudentId} onChange={(e) => setTuitionStudentId(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <option value="">-- Chọn Học Sinh --</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.full_name || s.name}</option>)}
              </select>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              <span style={{ display: 'flex', alignItems: 'center', color: '#64748b' }}>đến</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              <input type="number" value={pricePerSession} onChange={e => setPricePerSession(Number(e.target.value))} placeholder="Đơn giá" style={{ width: '120px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            </div>

            {tuitionStudentId && unbilledSessions.length > 0 && (
              <div className="print-area" style={{ backgroundColor: '#f0fdf4', padding: '40px', borderRadius: '16px', border: '1px solid #bbf7d0', display: 'flex', gap: '30px' }}>
                <div style={{ flex: 2 }}>
                  <h1 style={{ color: '#047857', margin: '0 0 5px 0', fontSize: '26px', textTransform: 'uppercase' }}>Phiếu Báo Học Phí</h1>
                  <p style={{ margin: '0 0 20px 0', color: '#64748b' }}>Kỳ học: {startDate ? new Date(startDate).toLocaleDateString('vi-VN') : '...'} - {endDate ? new Date(endDate).toLocaleDateString('vi-VN') : '...'}</p>
                  
                  {billNote && (
                    <div style={{ padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '2px dashed #10b981', backgroundColor: '#f0fdf4' }}>
                      <p style={{ margin: 0, color: '#065f46', fontSize: '16px', lineHeight: '1.5' }}>
                        <strong style={{ fontSize: '18px' }}>📝 Nhận xét tháng này:</strong><br/>
                        <span style={{ color: '#1e293b', fontStyle: 'italic', marginTop: '8px', display: 'block' }}>
                          {billNote}
                        </span>
                      </p>
                    </div>
                  )}

                  <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                    <p style={{ margin: '0 0 10px 0' }}>Học viên: <strong style={{ color: '#1e293b', fontSize: '18px' }}>{currentStudent?.full_name}</strong></p>
                    <p style={{ margin: '0 0 10px 0' }}>Đơn giá: <strong>{pricePerSession.toLocaleString('vi-VN')} đ/buổi</strong></p>
                    <p style={{ margin: '0' }}>Số buổi: <strong style={{ color: '#ef4444', fontSize: '18px' }}>{unbilledSessions.length}</strong> buổi</p>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#d1fae5', color: '#065f46' }}>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Ngày học</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Nội dung</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unbilledSessions.map((s) => (
                        <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px', fontWeight: 'bold' }}>{new Date(s.session_date).toLocaleDateString('vi-VN')}</td>
                          <td style={{ padding: '12px', fontSize: '14px', color: '#475569' }}>{s.content}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ flex: 1, backgroundColor: 'white', padding: '25px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #6ee7b7' }}>
                  <p style={{ margin: '0 0 10px 0', color: '#64748b', fontWeight: 'bold' }}>CẦN THANH TOÁN</p>
                  <h2 style={{ margin: '0 0 20px 0', color: '#ef4444', fontSize: '32px' }}>{totalAmount.toLocaleString('vi-VN')}đ</h2>
                  {totalAmount > 0 && <img src={qrLink} alt="QR" style={{ width: '100%', maxWidth: '200px', borderRadius: '8px' }} />}
                </div>
              </div>
            )}
            
            {tuitionStudentId && unbilledSessions.length === 0 && unpaidSessions.length > 0 && (
              <div className="no-print" style={{ backgroundColor: '#eff6ff', padding: '40px', borderRadius: '16px', border: '1px solid #bfdbfe', textAlign: 'center' }}>
                <h2 style={{ color: '#1d4ed8' }}>⏳ Hóa đơn đã xuất</h2>
                <p style={{ color: '#3b82f6', fontSize: '16px' }}>Học sinh này có <strong>{unpaidSessions.length} buổi học</strong> đã xuất phiếu thu.<br/>Hãy vào mục <strong>Quản lý Tài chính</strong> để xác nhận thu tiền hoặc xem lại phiếu.</p>
              </div>
            )}
            
            {tuitionStudentId && sessionList.length > 0 && unbilledSessions.length === 0 && unpaidSessions.length === 0 && (
              <div className="no-print" style={{ backgroundColor: '#f0fdf4', padding: '40px', borderRadius: '16px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                <h2 style={{ color: '#15803d' }}>✅ Đã thanh toán đầy đủ</h2>
                <p style={{ color: '#166534', fontSize: '16px' }}>Tất cả các buổi học trong khoảng thời gian này đều đã được thu tiền.</p>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Đã sửa CSS cho in ấn đẹp và bo góc */}
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
            border: 2px solid #cbd5e1 !important; 
            border-radius: 20px !important; 
            box-shadow: none !important; 
          } 
          .no-print { display: none !important; } 
          * { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
          table { border-radius: 12px !important; overflow: hidden !important; border: 1px solid #e2e8f0 !important; }
          th { background-color: #d1fae5 !important; color: #065f46 !important; }
        }
      `}</style> 
    </div>
  );
};

export default TeacherCalendar;
