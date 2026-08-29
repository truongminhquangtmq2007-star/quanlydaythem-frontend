import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';

const TeacherSessionManager = () => {
  const [classes, setClasses] = useState<any[]>([]); // Chứa danh sách lớp
  const [selectedClassId, setSelectedClassId] = useState<string>(''); // Lớp đang được chọn
  const [sessions, setSessions] = useState<any[]>([]);

  // 1. Kéo danh sách lớp học về để đưa vào thẻ Select
  const fetchClasses = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axiosClient.get(`/api/classes`);
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
      const res = await axiosClient.get(`/api/sessions?class_id=${selectedClassId}`);
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
        await axiosClient.delete(`/api/sessions/${sessionId}`);
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
        return axiosClient.post(`/api/sessions/upsert`, {
          ...session,
          class_id: selectedClassId // Gắn đúng ID của lớp đang chọn
        });
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
      await axiosClient.post(`/api/sessions/publish`, {
        class_id: selectedClassId
      });
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
    <div style={{ padding: 'var(--spacing-8)', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 'var(--spacing-5)' }}>Sổ Giáo Án & Tiến Độ Dạy</h2>

      {/* BỘ LỌC CHỌN LỚP HỌC */}
      <Card style={{ marginBottom: 'var(--spacing-8)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--spacing-4)', padding: 'var(--spacing-6)' }}>
          <h3 style={{ margin: 0 }}>Đang quản lý lớp:</h3>
          <select 
            value={selectedClassId} 
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              setSessions([]); // Xóa trắng bảng tạm khi chuyển lớp
            }}
            style={{ padding: 'var(--spacing-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', minWidth: '250px' }}
          >
            <option value="">-- Vui lòng chọn lớp học --</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.class_name}</option>
            ))}
          </select>
        </div>
      </Card>
      
      {/* CHỈ HIỂN THỊ BẢNG KHI ĐÃ CHỌN LỚP */}
      {selectedClassId ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--spacing-5)', gap: 'var(--spacing-2)' }}>
            <Button onClick={handleSaveDraft} variant="secondary">
              💾 Lưu Nháp Lịch Học
            </Button>
            <Button onClick={handlePublish} variant="primary">
              🚀 Công Bố Lịch Lên App Học Sinh
            </Button>
          </div>

          <Card>
            <div className="overflow-x-auto" style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: 'var(--color-background)' }}>
                  <tr>
                    <th style={{ padding: 'var(--spacing-3)', borderBottom: '1px solid var(--color-border)' }}>Trạng Thái</th>
                    <th style={{ padding: 'var(--spacing-3)', borderBottom: '1px solid var(--color-border)' }}>Ngày Học</th>
                    <th style={{ padding: 'var(--spacing-3)', borderBottom: '1px solid var(--color-border)' }}>Giờ Học</th>
                    <th style={{ padding: 'var(--spacing-3)', borderBottom: '1px solid var(--color-border)' }}>Nội Dung (Dạy trước)</th>
                    <th style={{ padding: 'var(--spacing-3)', borderBottom: '1px solid var(--color-border)' }}>BTVN</th>
                    <th style={{ padding: 'var(--spacing-3)', borderBottom: '1px solid var(--color-border)', textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--spacing-2)' }}>
                        {session.is_published ? (
                          <Badge variant="success">Đã gửi Phụ huynh</Badge>
                        ) : (
                          <Badge variant="warning">Bản nháp</Badge>
                        )}
                      </td>
                      <td style={{ padding: 'var(--spacing-2)' }}>
                        <input type="date" value={session.session_date ? session.session_date.split('T')[0] : ''} 
                               onChange={(e) => handleInputChange(index, 'session_date', e.target.value)}
                               style={{ padding: 'var(--spacing-2)', width: '100%', boxSizing: 'border-box' }} />
                      </td>
                      <td style={{ padding: 'var(--spacing-2)' }}>
                        <input type="time" value={session.start_time || ''} 
                               onChange={(e) => handleInputChange(index, 'start_time', e.target.value)}
                               style={{ padding: 'var(--spacing-2)', width: '100%', boxSizing: 'border-box' }} />
                      </td>
                      <td style={{ padding: 'var(--spacing-2)' }}>
                        <input type="text" value={session.content || ''} placeholder="VD: Dạy Bài 8_1"
                               onChange={(e) => handleInputChange(index, 'content', e.target.value)}
                               style={{ padding: 'var(--spacing-2)', width: '100%', boxSizing: 'border-box' }} />
                      </td>
                      <td style={{ padding: 'var(--spacing-2)' }}>
                        <input type="text" value={session.homework || ''} placeholder="VD: Sửa test 2"
                               onChange={(e) => handleInputChange(index, 'homework', e.target.value)}
                               style={{ padding: 'var(--spacing-2)', width: '100%', boxSizing: 'border-box' }} />
                      </td>
                      <td style={{ padding: 'var(--spacing-2)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: 'var(--spacing-2)', justifyContent: 'center' }}>
                          <Button onClick={() => handleAttendanceClick(session.id)} variant="secondary" size="sm">
                            📝 Điểm danh & Nhận xét
                          </Button>
                          <Button onClick={() => handleDeleteRow(index, session.id)} variant="danger" size="sm">
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
          
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--spacing-5)' }}>
            <Button onClick={() => setSessions([...sessions, { is_published: false }])} variant="primary">
              + Thêm dòng mới
            </Button>
          </div>
        </>
      ) : (
        <EmptyState title="Chưa chọn lớp học" description="Vui lòng chọn một lớp học ở trên để bắt đầu soạn giáo án." />
      )}
    </div>
  );
};

export default TeacherSessionManager;
