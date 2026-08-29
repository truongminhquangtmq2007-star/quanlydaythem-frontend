import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import moment from 'moment';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';

const TuitionManager = () => {
  const [bills, setBills] = useState<any[]>([]);
  // Mặc định chọn tháng hiện tại (Ví dụ: '2026-08')
  const [selectedMonth, setSelectedMonth] = useState(moment().format('YYYY-MM'));
  const [stats, setStats] = useState({ totalExpected: 0, totalReceived: 0, totalPending: 0 });

  const [aiRemarkModal, setAiRemarkModal] = useState<{ show: boolean, studentId: number | null, studentName: string, text: string, loading: boolean }>({
    show: false, studentId: null, studentName: '', text: '', loading: false
  });

  const fetchBills = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axiosClient.get(`/api/payments`);
      const allBills = res.data;
      
      // LỌC HÓA ĐƠN THEO THÁNG ĐƯỢC CHỌN
      const filteredBills = allBills.filter((b: any) => moment(b.created_at).format('YYYY-MM') === selectedMonth);
      setBills(filteredBills);
      
      // TÍNH TOÁN THỐNG KÊ CHO THÁNG ĐÓ
      let expected = 0; let received = 0; let pending = 0;
      filteredBills.forEach((b: any) => {
        expected += b.total_amount;
        if (b.is_paid) received += b.total_amount;
        else pending += b.total_amount;
      });
      setStats({ totalExpected: expected, totalReceived: received, totalPending: pending });
    } catch (error) { console.error("Lỗi tải hóa đơn"); }
  }, [selectedMonth]);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  const handleConfirmPayment = async (id: number) => {
    const confirm = window.confirm('💰 Xác nhận phụ huynh đã chuyển khoản cho phiếu này?');
    if (!confirm) return;
    const token = localStorage.getItem('token');
    try {
      await axiosClient.put(`/api/payments/${id}/pay`, {});
      alert('✅ Đã ghi nhận doanh thu thành công! Học sinh đã được cấp tem.');
      fetchBills(); 
    } catch (error) { alert('❌ Lỗi hệ thống.'); }
  };

  const handleOpenAiRemark = async (studentId: number, studentName: string) => {
    setAiRemarkModal({ show: true, studentId, studentName, text: '', loading: true });
    const token = localStorage.getItem('token');
    try {
      const res = await axiosClient.post('/api/ai/generate-remark', { student_id: studentId });
      setAiRemarkModal(prev => ({ ...prev, text: res.data.remark, loading: false }));
    } catch (err) {
      setAiRemarkModal(prev => ({ ...prev, text: 'Lỗi: Không thể sinh nhận xét lúc này.', loading: false }));
    }
  };

  return (
    <div style={{ padding: 'var(--spacing-10)', maxWidth: '100%', boxSizing: 'border-box' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--spacing-8)', paddingBottom: 'var(--spacing-4)' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', color: 'var(--color-text)', fontSize: '30px' }}>Quản lý Tài chính</h1>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '15px' }}>Lưu trữ phiếu học phí, xác nhận thanh toán và theo dõi doanh thu.</p>
        </div>
        
        {/* BỘ LỌC THÁNG DOANH THU */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', padding: 'var(--spacing-3)' }}>
            <span style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-secondary)' }}>📅 Kỳ kế toán:</span>
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)} 
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', outline: 'none', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary)', cursor: 'pointer' }}
            />
          </div>
        </Card>
      </div>

      {/* DASHBOARD THỐNG KÊ (Thay đổi theo tháng) */}
      <div style={{ display: 'flex', gap: 'var(--spacing-5)', marginBottom: 'var(--spacing-8)', flexWrap: 'wrap' }}>
        <Card style={{ flex: 1, minWidth: '220px' }}>
          <div style={{ padding: 'var(--spacing-6)' }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontSize: 'var(--font-size-sm)' }}>Tổng hóa đơn tháng này</h4>
            <h2 style={{ margin: 0, color: 'var(--color-text)', fontSize: 'var(--font-size-3xl)' }}>{stats.totalExpected.toLocaleString('vi-VN')} <span style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)' }}>đ</span></h2>
          </div>
        </Card>
        <Card style={{ flex: 1, minWidth: '220px', borderBottom: '4px solid var(--color-success)' }}>
          <div style={{ padding: 'var(--spacing-6)' }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontSize: 'var(--font-size-sm)' }}>✅ Đã thu (Thực tế)</h4>
            <h2 style={{ margin: 0, color: 'var(--color-success)', fontSize: 'var(--font-size-3xl)' }}>{stats.totalReceived.toLocaleString('vi-VN')} <span style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)' }}>đ</span></h2>
          </div>
        </Card>
        <Card style={{ flex: 1, minWidth: '220px', borderBottom: '4px solid var(--color-danger)' }}>
          <div style={{ padding: 'var(--spacing-6)' }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontSize: 'var(--font-size-sm)' }}>⏳ Đang chờ phụ huynh nộp</h4>
            <h2 style={{ margin: 0, color: 'var(--color-danger)', fontSize: 'var(--font-size-3xl)' }}>{stats.totalPending.toLocaleString('vi-VN')} <span style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)' }}>đ</span></h2>
          </div>
        </Card>
      </div>

      {/* DANH SÁCH PHIẾU THU */}
      <Card style={{ overflow: 'hidden' }}>
        <div style={{ padding: 'var(--spacing-6)', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ margin: 0, color: 'var(--color-text)', fontSize: 'var(--font-size-xl)' }}>Chi tiết giao dịch {moment(selectedMonth).format('[Tháng] MM/YYYY')}</h3>
        </div>
        
        <div className="overflow-x-auto" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-background)' }}>
                <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)' }}>Mã phiếu</th>
                <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)' }}>Học viên</th>
                <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)' }}>Giai đoạn tính tiền</th>
                <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)' }}>Thành tích (Điểm thi)</th>
                <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)' }}>Tổng tiền</th>
                <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)', textAlign: 'center' }}>Trạng thái</th>
                <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {bills.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 'var(--spacing-10)' }}>
                  <EmptyState title="Không có hóa đơn" description="Không có hóa đơn nào trong tháng này." />
                </td></tr>
              ) : (
                bills.map((b) => {
                  let parsedScores: any[] = [];
                  if (b.exam_scores) {
                    parsedScores = typeof b.exam_scores === 'string' ? JSON.parse(b.exam_scores) : b.exam_scores;
                  }

                  return (
                  <tr key={b.id} style={{ borderBottom: '1px solid var(--color-border)', transition: '0.2s', backgroundColor: b.is_paid ? 'var(--color-surface)' : 'var(--color-danger-light)' }}>
                    <td style={{ padding: 'var(--spacing-4)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-secondary)' }}>#{b.id}</td>
                    <td style={{ padding: 'var(--spacing-4)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text)' }}>{b.full_name}</td>
                    <td style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)' }}>
                      {new Date(b.start_date).toLocaleDateString('vi-VN')} - {new Date(b.end_date).toLocaleDateString('vi-VN')}
                    </td>
                    <td style={{ padding: 'var(--spacing-4)' }}>
                      {parsedScores.length === 0 ? <span style={{ color: 'var(--color-text-secondary)' }}>-</span> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {parsedScores.map((s: any, idx: number) => {
                            const scoreNum = Number(s.score);
                            let variant: 'primary' | 'danger' | 'info' = 'info';
                            if (scoreNum >= 8) { variant = 'primary'; }
                            else if (scoreNum < 5) { variant = 'danger'; }
                            
                            return (
                              <Badge key={idx} variant={variant}>
                                {s.exam_title}: {s.score}đ
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: 'var(--spacing-4)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text)' }}>
                      {b.total_amount.toLocaleString('vi-VN')}đ
                    </td>
                    <td style={{ padding: 'var(--spacing-4)', textAlign: 'center' }}>
                      {b.is_paid ? (
                        <Badge variant="success">Đã thu</Badge>
                      ) : (
                        <Badge variant="danger">Chờ thanh toán</Badge>
                      )}
                    </td>
                    <td style={{ padding: 'var(--spacing-4)', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                        <Button 
                          onClick={() => handleOpenAiRemark(b.student_id, b.full_name)}
                          variant="primary" size="sm" style={{ backgroundColor: '#8b5cf6' }}>
                          ✨ AI Nhận xét
                        </Button>
                        {!b.is_paid ? (
                          <Button 
                            onClick={() => handleConfirmPayment(b.id)}
                            variant="primary" size="sm">
                            Xác nhận Đã Thu
                          </Button>
                        ) : (
                          <span style={{ color: 'var(--color-border)', fontWeight: 'var(--font-weight-bold)', fontSize: 'var(--font-size-sm)' }}>Hoàn tất</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal AI Nhận xét */}
      {aiRemarkModal.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <Card style={{ width: '500px', padding: 'var(--spacing-8)' }}>
            <h2 style={{ marginTop: 0, color: 'var(--color-text)' }}>✨ Nhận xét cho {aiRemarkModal.studentName}</h2>
            {aiRemarkModal.loading ? (
              <div style={{ textAlign: 'center', padding: 'var(--spacing-10)', color: '#8b5cf6', fontWeight: 'var(--font-weight-bold)' }}>⏳ AI đang viết nhận xét...</div>
            ) : (
              <div>
                <textarea 
                  value={aiRemarkModal.text}
                  onChange={(e) => setAiRemarkModal(prev => ({...prev, text: e.target.value}))}
                  style={{ width: '100%', height: '150px', padding: 'var(--spacing-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', fontSize: '15px', outline: 'none', resize: 'vertical' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-5)' }}>
                  <Button onClick={() => setAiRemarkModal({ show: false, studentId: null, studentName: '', text: '', loading: false })} variant="ghost">Hủy</Button>
                  <Button onClick={() => {
                    alert('Đã copy nhận xét vào Clipboard!');
                    navigator.clipboard.writeText(aiRemarkModal.text);
                    setAiRemarkModal({ show: false, studentId: null, studentName: '', text: '', loading: false });
                  }} variant="primary">Copy & Đóng</Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default TuitionManager;
