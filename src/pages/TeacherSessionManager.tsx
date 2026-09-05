import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Select } from '../components/ui/Select';
import { TableContainer, Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import { toast } from 'react-toastify';

const TeacherSessionManager = () => {
  const [classes, setClasses] = useState<any[]>([]); // Chứa danh sách lớp
  const [selectedClassId, setSelectedClassId] = useState<string>(''); // Lớp đang được chọn
  const [sessions, setSessions] = useState<any[]>([]);

  // 1. Kéo danh sách lớp học về để đưa vào thẻ Select
  const fetchClasses = async () => {
    try {
      const res = await axiosClient.get(`/api/classes`);
      setClasses(res.data || []);
    } catch (error) {
      console.error("Lỗi tải danh sách lớp", error);
    }
  };

  // 2. Kéo danh sách buổi học THEO LỚP ĐƯỢC CHỌN
  const fetchSessions = useCallback(async () => {
    if (!selectedClassId) return; // Nếu chưa chọn lớp thì không tải
    try {
      const res = await axiosClient.get(`/api/sessions?class_id=${selectedClassId}`);
      setSessions(res.data && res.data.length > 0 ? res.data : [{}]); 
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
      try {
        await axiosClient.delete(`/api/sessions/${sessionId}`);
        toast.success("Đã xóa buổi học thành công!");
      } catch (error) {
        toast.error("Lỗi khi xóa buổi học!");
        return;
      }
    }
    const newSessions = [...sessions];
    newSessions.splice(index, 1);
    setSessions(newSessions);
  };

  const handleSaveDraft = async () => {
    if (!selectedClassId) {
      toast.warn("Vui lòng chọn lớp học trước khi lưu!");
      return;
    }
    try {
      await Promise.all(sessions.map(session => {
        return axiosClient.post(`/api/sessions/upsert`, {
          ...session,
          class_id: selectedClassId // Gắn đúng ID của lớp đang chọn
        });
      }));
      toast.success("Đã lưu nháp lịch học thành công!");
      fetchSessions(); 
    } catch (error) {
      toast.error("Lỗi khi lưu nháp lịch học!");
    }
  };

  const handlePublish = async () => {
    if (!selectedClassId) {
      toast.warn("Vui lòng chọn lớp học cần công bố!");
      return;
    }
    if (!window.confirm("Học sinh sẽ nhận được lịch học này. Xác nhận công bố?")) return;
    try {
      await axiosClient.post(`/api/sessions/publish`, {
        class_id: selectedClassId
      });
      toast.success("Đã công bố lịch học cho Học sinh & Phụ huynh!");
      fetchSessions(); 
    } catch (error) {
      toast.error("Lỗi khi công bố lịch học!");
    }
  };

  const handleAttendanceClick = (sessionId?: number) => {
    if (!sessionId) {
      toast.warn("Cần 'Lưu Nháp' buổi học này để hệ thống tạo mã ID trước khi điểm danh!");
      return;
    }
    // Lấy tên lớp để hiển thị cho thân thiện
    const className = classes.find(c => c.id.toString() === selectedClassId)?.class_name;
    toast.info(`Mở bảng điểm danh cho buổi học của lớp: ${className}`);
  };

  return (
    <div style={{ padding: 'var(--spacing-8)', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 'var(--spacing-5)' }}>Sổ Giáo Án & Tiến Độ Dạy</h2>

      {/* BỘ LỌC CHỌN LỚP HỌC */}
      <Card style={{ marginBottom: 'var(--spacing-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--spacing-4)', padding: 'var(--spacing-4)', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text)' }}>Đang quản lý lớp:</span>
          <div style={{ minWidth: '280px' }}>
            <Select 
              value={selectedClassId} 
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSessions([]); // Xóa trắng bảng tạm khi chuyển lớp
              }}
              options={[
                { value: '', label: '-- Vui lòng chọn lớp học --' },
                ...classes.map(c => ({ value: String(c.id), label: c.class_name }))
              ]}
            />
          </div>
        </div>
      </Card>
      
      {/* CHỈ HIỂN THỊ BẢNG KHI ĐÃ CHỌN LỚP */}
      {selectedClassId ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--spacing-5)', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
            <Button onClick={handleSaveDraft} variant="secondary" style={{ minHeight: '44px' }}>
              💾 Lưu Nháp Lịch Học
            </Button>
            <Button onClick={handlePublish} variant="primary" style={{ minHeight: '44px' }}>
              🚀 Công Bố Lịch Lên App Học Sinh
            </Button>
          </div>

          <Card>
            <TableContainer>
              <Table>
                <Thead>
                  <Tr>
                    <Th>Trạng Thái</Th>
                    <Th>Ngày Học</Th>
                    <Th>Giờ Học</Th>
                    <Th>Nội Dung (Dạy trước)</Th>
                    <Th>BTVN</Th>
                    <Th style={{ textAlign: 'center' }}>Thao tác</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {sessions.map((session, index) => (
                    <Tr key={index}>
                      <Td>
                        {session.is_published ? (
                          <Badge variant="success">Đã gửi Phụ huynh</Badge>
                        ) : (
                          <Badge variant="warning">Bản nháp</Badge>
                        )}
                      </Td>
                      <Td>
                        <input 
                          type="date" 
                          value={session.session_date ? session.session_date.split('T')[0] : ''} 
                          onChange={(e) => handleInputChange(index, 'session_date', e.target.value)}
                          style={{ padding: '8px 10px', width: '100%', boxSizing: 'border-box', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }} 
                        />
                      </Td>
                      <Td>
                        <input 
                          type="time" 
                          value={session.start_time || ''} 
                          onChange={(e) => handleInputChange(index, 'start_time', e.target.value)}
                          style={{ padding: '8px 10px', width: '100%', boxSizing: 'border-box', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }} 
                        />
                      </Td>
                      <Td>
                        <input 
                          type="text" 
                          value={session.content || ''} 
                          placeholder="VD: Dạy Bài 8_1"
                          onChange={(e) => handleInputChange(index, 'content', e.target.value)}
                          style={{ padding: '8px 10px', width: '100%', boxSizing: 'border-box', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }} 
                        />
                      </Td>
                      <Td>
                        <input 
                          type="text" 
                          value={session.homework || ''} 
                          placeholder="VD: Sửa test 2"
                          onChange={(e) => handleInputChange(index, 'homework', e.target.value)}
                          style={{ padding: '8px 10px', width: '100%', boxSizing: 'border-box', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }} 
                        />
                      </Td>
                      <Td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: 'var(--spacing-2)', justifyContent: 'center' }}>
                          <Button onClick={() => handleAttendanceClick(session.id)} variant="secondary" size="sm" style={{ minHeight: '36px' }}>
                            📝 Điểm danh
                          </Button>
                          <Button onClick={() => handleDeleteRow(index, session.id)} variant="danger" size="sm" style={{ minHeight: '36px' }}>
                            Xóa
                          </Button>
                        </div>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </Card>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--spacing-5)' }}>
            <Button onClick={() => setSessions([...sessions, { is_published: false }])} variant="primary" style={{ minHeight: '44px' }}>
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
