import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const TeacherSessionManager = () => {
  const [classes, setClasses] = useState<any[]>([]); // Chứa danh sách lớp
  const [selectedClassId, setSelectedClassId] = useState<string>(''); // Lớp đang được chọn
  const [sessions, setSessions] = useState<any[]>([]);

  // 1. Kéo danh sách lớp học về để đưa vào thẻ Select
  const fetchClasses = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get('https://quanlydaythem-api.onrender.com/api/auth/student/login/api/classes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClasses(res.data);
    } catch (error) {
      console.error("Lỗi tải danh sách lớp", error);
    }
  };

  // 2. Kéo danh sách buổi học THEO LỚP ĐƯỢC CHỌN
  const fetchSessions = useCallback(async () => {
    if (!selectedClassId) return; // Nếu chưa chọn lớp thì không tải
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`https://quanlydaythem-api.onrender.com/api/auth/student/login/api/sessions?class_id=${selectedClassId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessions(res.data.length > 0 ? res.data : [{}]); 
    } catch (error) {
      console.error("Lỗi tải dữ liệu buổi học", error);
    }
  }, [selectedClassId]);

  // Chạy khi vừa mở trang
  useEffect(() => {
    fetchClasses();
  }, []);

  // Chạy lại mỗi khi Giáo viên đổi lớp khác
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleInputChange = (index: number, field: string, value: string) => {
    const newSessions = [...sessions];
    newSessions[index][field] = value;
    setSessions(newSessions);
  };

  const handleDeleteRow = async (index: number, sessionId?: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa buổi học này không?")) return;
    if (sessionId) {
      const token = localStorage.getItem('token');
      try {
        await axios.delete(`https://quanlydaythem-api.onrender.com/api/auth/student/login/api/sessions/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (error) {
        alert("❌ Lỗi khi xóa!"); return;
      }
    }
    const newSessions = [...sessions];
    newSessions.splice(index, 1);
    setSessions(newSessions);
  };

  const handleSaveDraft = async () => {
    if (!selectedClassId) return alert("Vui lòng chọn lớp học trước khi lưu!");
    const token = localStorage.getItem('token');
    try {
      await Promise.all(sessions.map(session => {
        return axios.post('https://quanlydaythem-api.onrender.com/api/auth/student/login/api/sessions/upsert', {
          ...session,
          class_id: selectedClassId // Gắn đúng ID của lớp đang chọn
        }, { headers: { Authorization: `Bearer ${token}` } });
      }));
      alert("✅ Đã lưu nháp lịch học!");
      fetchSessions(); 
    } catch (error) {
      alert("❌ Lỗi khi lưu nháp!");
    }
  };

  const handlePublish = async () => {
    if (!selectedClassId) return alert("Vui lòng chọn lớp học cần công bố!");
    if (!window.confirm("Học sinh sẽ nhận được lịch học này. Xác nhận công bố?")) return;
    const token = localStorage.getItem('token');
    try {
      await axios.post('https://quanlydaythem-api.onrender.com/api/auth/student/login/api/sessions/publish', {
        class_id: selectedClassId
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert("🚀 Đã công bố lịch học cho Phụ huynh!");
      fetchSessions(); 
    } catch (error) {
      alert("❌ Lỗi khi công bố!");
    }
  };

  const handleAttendanceClick = (sessionId?: number) => {
    if (!sessionId) {
      alert("⚠️ Cần 'Lưu Nháp' buổi học này để hệ thống tạo mã ID trước khi điểm danh!");
      return;
    }
    // Lấy tên lớp để hiển thị cho thân thiện
    const className = classes.find(c => c.id.toString() === selectedClassId)?.class_name;
    alert(`Mở bảng điểm danh cho buổi học của lớp: ${className}`);
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Sổ Giáo Án & Tiến Độ Dạy</h2>

      {/* BỘ LỌC CHỌN LỚP HỌC */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px', alignItems: 'center', gap: '15px' }}>
        <h3 style={{ margin: 0 }}>Đang quản lý lớp:</h3>
        <select 
          value={selectedClassId} 
          onChange={(e) => {
            setSelectedClassId(e.target.value);
            setSessions([]); // Xóa trắng bảng tạm khi chuyển lớp
          }}
          style={{ padding: '10px', fontSize: '16px', borderRadius: '5px', border: '2px solid #007bff', minWidth: '250px' }}
        >
          <option value="">-- Vui lòng chọn lớp học --</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.class_name}</option>
          ))}
        </select>
      </div>
      
      {/* CHỈ HIỂN THỊ BẢNG KHI ĐÃ CHỌN LỚP */}
      {selectedClassId ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <button onClick={handleSaveDraft} style={{ padding: '10px 20px', marginRight: '10px', background: '#ffc107', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
              💾 Lưu Nháp Lịch Học
            </button>
            <button onClick={handlePublish} style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
              🚀 Công Bố Lịch Lên App Học Sinh
            </button>
          </div>

          <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', border: '1px solid #ddd' }}>
              <thead style={{ backgroundColor: '#f8f9fa' }}>
                <tr>
                  <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Trạng Thái</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Ngày Học</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Giờ Học</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Nội Dung (Dạy trước)</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>BTVN</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #ddd', textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '10px' }}>
                      {session.is_published ? (
                        <span style={{ color: 'green', fontWeight: 'bold' }}>Đã gửi Phụ huynh</span>
                      ) : (
                        <span style={{ color: '#ffc107', fontWeight: 'bold' }}>Bản nháp</span>
                      )}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <input type="date" value={session.session_date ? session.session_date.split('T')[0] : ''} 
                             onChange={(e) => handleInputChange(index, 'session_date', e.target.value)}
                             style={{ padding: '8px', width: '100%', boxSizing: 'border-box' }} />
                    </td>
                    <td style={{ padding: '10px' }}>
                      <input type="time" value={session.start_time || ''} 
                             onChange={(e) => handleInputChange(index, 'start_time', e.target.value)}
                             style={{ padding: '8px', width: '100%', boxSizing: 'border-box' }} />
                    </td>
                    <td style={{ padding: '10px' }}>
                      <input type="text" value={session.content || ''} placeholder="VD: Dạy Bài 8_1"
                             onChange={(e) => handleInputChange(index, 'content', e.target.value)}
                             style={{ padding: '8px', width: '100%', boxSizing: 'border-box' }} />
                    </td>
                    <td style={{ padding: '10px' }}>
                      <input type="text" value={session.homework || ''} placeholder="VD: Sửa test 2"
                             onChange={(e) => handleInputChange(index, 'homework', e.target.value)}
                             style={{ padding: '8px', width: '100%', boxSizing: 'border-box' }} />
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button onClick={() => handleAttendanceClick(session.id)} 
                              style={{ padding: '6px 12px', marginRight: '8px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        📝 Điểm danh & Nhận xét
                      </button>
                      <button onClick={() => handleDeleteRow(index, session.id)} 
                              style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
            <button 
              onClick={() => setSessions([...sessions, { is_published: false }])} 
              style={{ padding: '10px 30px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
              + Thêm dòng mới
            </button>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '50px', color: '#6c757d', fontStyle: 'italic' }}>
          Vui lòng chọn một lớp học ở trên để bắt đầu soạn giáo án.
        </div>
      )}
    </div>
  );
};

export default TeacherSessionManager;