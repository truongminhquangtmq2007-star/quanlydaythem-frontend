import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import moment from 'moment';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';

const TuitionManager = () => {
  const [bills, setBills] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(moment().format('YYYY-MM'));
  const [stats, setStats] = useState({ totalExpected: 0, totalReceived: 0, totalPending: 0 });

  const [invoiceModal, setInvoiceModal] = useState<any>({ show: false, bill: null, sessions: [], teacher_note: '' });
  const [aiLoading, setAiLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState({ student_id: '', start_date: '', end_date: '', bill_note: '' });
  const [previewData, setPreviewData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [aiRemarkModal, setAiRemarkModal] = useState<{ show: boolean, studentId: number | null, studentName: string, text: string, dataSummary: any, loading: boolean, billId?: number }>({
    show: false, studentId: null, studentName: '', text: '', dataSummary: null, loading: false
  });

  useEffect(() => {
    if (showCreateModal && students.length === 0) {
      axiosClient.get('/api/students').then(res => setStudents(res.data)).catch(()=>{});
    }
  }, [showCreateModal, students.length]);
  
  const handlePreview = async () => {
    if (!createData.student_id || !createData.start_date || !createData.end_date) {
      alert("Vui lòng chọn học sinh và khoảng thời gian");
      return;
    }
    try {
      const res = await axiosClient.get(`/api/payments/preview?student_id=${createData.student_id}&start_date=${createData.start_date}&end_date=${createData.end_date}`);
      setPreviewData(res.data);
    } catch(e) { 
      alert("Lỗi xem trước học phí"); 
    }
  };
  
  const handleCreateBill = async () => {
    if (!createData.student_id || !createData.start_date || !createData.end_date) {
      alert("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    try {
      await axiosClient.post('/api/payments/create', createData);
      setShowCreateModal(false);
      setPreviewData(null);
      setCreateData({ student_id: '', start_date: '', end_date: '', bill_note: '' });
      fetchBills();
      alert("Đã tạo phiếu thu thành công!");
    } catch(e: any) { 
      alert(e.response?.data?.error || "Lỗi tạo phiếu thu"); 
    }
  };
  
  const fetchBills = useCallback(async () => {
    try {
      const res = await axiosClient.get(`/api/payments`);
      const allBills = res.data;
      
      const filteredBills = allBills.filter((b: any) => moment(b.created_at).format('YYYY-MM') === selectedMonth);
      setBills(filteredBills);
      
      let expected = 0; let received = 0; let pending = 0;
      filteredBills.forEach((b: any) => {
        expected += b.total_amount;
        if (b.is_paid) received += b.total_amount;
        else pending += b.total_amount;
      });
      setStats({ totalExpected: expected, totalReceived: received, totalPending: pending });
    } catch (error) { 
      console.error("Lỗi tải hóa đơn"); 
    }
  }, [selectedMonth]);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  const handleConfirmPayment = async (id: number) => {
    const confirm = window.confirm('💰 Xác nhận phụ huynh đã thanh toán cho phiếu này?');
    if (!confirm) return;
    try {
      await axiosClient.put(`/api/payments/${id}/pay`, {});
      alert('✅ Đã xác nhận thanh toán thành công!');
      fetchBills(); 
    } catch (error) { 
      alert('❌ Lỗi hệ thống.'); 
    }
  };

  const loadExistingRemark = async (studentId: number, studentName: string, billId: number) => {
    setAiRemarkModal({ show: true, studentId, studentName, billId, text: '', dataSummary: null, loading: true });
    try {
      const res = await axiosClient.get(`/api/ai/remark/${studentId}/${selectedMonth}`);
      if (res.data.remark) {
        setAiRemarkModal(prev => ({ ...prev, text: res.data.remark, loading: false }));
      } else {
        generateRemark(studentId, studentName, billId);
      }
    } catch (err) {
      generateRemark(studentId, studentName, billId);
    }
  };

  const generateRemark = async (studentId: number, studentName: string, billId?: number) => {
    setAiRemarkModal(prev => ({ ...prev, loading: true, text: '' }));
    try {
      const res = await axiosClient.post('/api/ai/generate-remark', { 
        student_id: studentId, 
        month: selectedMonth,
        bill_id: billId || aiRemarkModal.billId 
      });
      setAiRemarkModal(prev => ({ ...prev, text: res.data.remark, dataSummary: res.data.data_summary, loading: false }));
    } catch (err) {
      setAiRemarkModal(prev => ({ ...prev, text: 'Lỗi: Không thể sinh nhận xét lúc này.', loading: false }));
    }
  };

  const handleGenerateInvoiceRemark = async () => {
    if (!invoiceModal.bill) return;
    setAiLoading(true);
    try {
      const res = await axiosClient.post('/api/ai/generate-remark', {
        student_id: invoiceModal.bill.student_id,
        month: moment(invoiceModal.bill.start_date).format('YYYY-MM'),
        bill_id: invoiceModal.bill.id
      });
      setInvoiceModal((prev: any) => ({ ...prev, teacher_note: res.data.remark }));
    } catch(e) {
      alert("Lỗi tạo nhận xét");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveRemark = async () => {
    if (!aiRemarkModal.studentId) return;
    try {
      await axiosClient.post('/api/ai/save-remark', {
        student_id: aiRemarkModal.studentId,
        month: selectedMonth,
        remark_text: aiRemarkModal.text,
        data_summary: aiRemarkModal.dataSummary
      });
      alert('✅ Đã lưu nhận xét thành công!');
    } catch (err) {
      alert('❌ Lỗi khi lưu nhận xét.');
    }
  };

  const handlePrintInvoice = async (billId: number) => {
    try {
      const res = await axiosClient.get(`/api/payments/bill/${billId}/invoice`);
      setInvoiceModal({ show: true, bill: res.data.bill, sessions: res.data.sessions || [], teacher_note: res.data.bill.bill_note || '' });
    } catch(e) { 
      alert("Lỗi tải phiếu thu"); 
    }
  };
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ padding: 'var(--spacing-10)', maxWidth: '100%', boxSizing: 'border-box' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--spacing-8)', paddingBottom: 'var(--spacing-4)', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', color: 'var(--color-text)', fontSize: '30px' }}>Quản lý Tài chính & Phiếu học phí</h1>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '15px' }}>Lưu trữ phiếu học phí, xác nhận thanh toán và gửi báo cáo hàng tháng.</p>
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--spacing-3)', alignItems: 'center' }}>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            + Tạo Phiếu Thu Mới
          </Button>

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
      </div>

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
                <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)' }}>Kỳ học phí</th>
                <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)' }}>Tổng tiền</th>
                <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)', textAlign: 'center' }}>Trạng thái</th>
                <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {(!Array.isArray(bills) || bills.length === 0) ? (
                <tr><td colSpan={6} style={{ padding: 'var(--spacing-10)' }}>
                  <EmptyState title="Không có hóa đơn" description="Không có hóa đơn nào trong tháng này." />
                </td></tr>
              ) : (
                bills.map((b) => {
                  return (
                  <tr key={b.id} style={{ borderBottom: '1px solid var(--color-border)', transition: '0.2s', backgroundColor: b.is_paid ? 'var(--color-surface)' : 'var(--color-danger-light)' }}>
                    <td style={{ padding: 'var(--spacing-4)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-secondary)' }}>#{b.id}</td>
                    <td style={{ padding: 'var(--spacing-4)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text)' }}>{b.full_name}</td>
                    <td style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)' }}>
                      {new Date(b.start_date).toLocaleDateString('vi-VN')} - {new Date(b.end_date).toLocaleDateString('vi-VN')}
                    </td>
                    <td style={{ padding: 'var(--spacing-4)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text)' }}>
                      {b.total_amount.toLocaleString('vi-VN')}đ
                    </td>
                    <td style={{ padding: 'var(--spacing-4)', textAlign: 'center' }}>
                      {b.is_paid ? (
                        <Badge variant="success">🟢 Đã thanh toán</Badge>
                      ) : (
                        <Badge variant="warning">🟠 Chưa thanh toán</Badge>
                      )}
                    </td>
                    <td style={{ padding: 'var(--spacing-4)', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 'var(--spacing-2)', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Button 
                          onClick={() => handlePrintInvoice(b.id)}
                          variant="outline" size="sm">
                          📄 In Phiếu
                        </Button>
                        <Button 
                          onClick={() => loadExistingRemark(b.student_id, b.full_name, b.id)}
                          variant="secondary" size="sm">
                          ✨ Nhận xét
                        </Button>
                        {!b.is_paid && (
                          <Button 
                            onClick={() => handleConfirmPayment(b.id)}
                            variant="primary" size="sm">
                            ✓ Đã thu
                          </Button>
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

      {/* Modal Tạo Phiếu Thu Mới */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--spacing-4)', backdropFilter: 'blur(4px)' }}>
          <Card style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 20px 0', color: 'var(--color-text)' }}>💰 Tạo Phiếu Thu Học Phí</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-1)', fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)' }}>Học sinh:</label>
                <select 
                  value={createData.student_id} 
                  onChange={e => setCreateData({ ...createData, student_id: e.target.value })}
                  style={{ width: '100%', padding: 'var(--spacing-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                >
                  <option value="">-- Chọn học sinh --</option>
                  {students.map(st => (
                    <option key={st.id} value={st.id}>{st.full_name} ({st.phone_number || 'Chưa có SĐT'})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
                <Input 
                  type="date" 
                  label="Từ ngày" 
                  value={createData.start_date} 
                  onChange={e => setCreateData({ ...createData, start_date: e.target.value })} 
                />
                <Input 
                  type="date" 
                  label="Đến ngày" 
                  value={createData.end_date} 
                  onChange={e => setCreateData({ ...createData, end_date: e.target.value })} 
                />
              </div>

              <Input 
                label="Ghi chú hóa đơn" 
                placeholder="VD: Học phí tháng 9, đã trừ 1 buổi nghỉ có phép..." 
                value={createData.bill_note} 
                onChange={e => setCreateData({ ...createData, bill_note: e.target.value })} 
              />

              <Button onClick={handlePreview} variant="outline">🔍 Xem trước buổi học & Số tiền</Button>

              {previewData && (
                <div style={{ backgroundColor: 'var(--color-background)', padding: 'var(--spacing-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: 'var(--spacing-2)', color: 'var(--color-primary)' }}>
                    Tổng tiền dự kiến: {previewData.total_amount?.toLocaleString('vi-VN')} đ ({previewData.sessions?.length || 0} buổi có mặt)
                  </div>
                  <div style={{ maxHeight: '150px', overflowY: 'auto', fontSize: 'var(--font-size-sm)' }}>
                    {previewData.sessions?.map((s: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--color-border)' }}>
                        <span>📅 {new Date(s.attendance_date).toLocaleDateString('vi-VN')} - {s.class_name}</span>
                        <span style={{ fontWeight: 'bold' }}>{s.tuition_fee?.toLocaleString('vi-VN')} đ</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)' }}>
              <Button onClick={() => { setShowCreateModal(false); setPreviewData(null); }} variant="ghost">Hủy</Button>
              <Button onClick={handleCreateBill} variant="primary">Tạo Phiếu Thu</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal In Phiếu Thu / Invoice */}
      {invoiceModal.show && invoiceModal.bill && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--spacing-4)', backdropFilter: 'blur(4px)' }}>
          <Card style={{ width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', padding: 'var(--spacing-8)' }}>
            <div id="invoice-print-area">
              <div style={{ textAlign: 'center', borderBottom: '2px solid var(--color-border)', paddingBottom: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)' }}>
                <h2 style={{ margin: '0 0 6px 0', color: 'var(--color-primary)', fontSize: '26px' }}>PHIẾU THU HỌC PHÍ</h2>
                <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                  Kỳ thu: {new Date(invoiceModal.bill.start_date).toLocaleDateString('vi-VN')} — {new Date(invoiceModal.bill.end_date).toLocaleDateString('vi-VN')}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)', backgroundColor: 'var(--color-background)', padding: 'var(--spacing-4)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Học viên:</div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px', color: 'var(--color-text)' }}>{invoiceModal.bill.full_name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>SĐT: {invoiceModal.bill.phone_number || invoiceModal.bill.parent_phone || '---'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Trạng thái thanh toán:</div>
                  <div style={{ marginTop: '4px' }}>
                    {invoiceModal.bill.is_paid ? (
                      <Badge variant="success">🟢 ĐÃ THANH TOÁN</Badge>
                    ) : (
                      <Badge variant="warning">🟠 CHƯA THANH TOÁN</Badge>
                    )}
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '18px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                    Tổng: {invoiceModal.bill.total_amount?.toLocaleString('vi-VN')} đ
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 'var(--spacing-6)' }}>
                <h4 style={{ margin: '0 0 var(--spacing-3) 0', color: 'var(--color-text)' }}>📋 Chi tiết các buổi học trong kỳ:</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--color-background)', borderBottom: '2px solid var(--color-border)' }}>
                      <th style={{ padding: '8px', width: '100px' }}>Ngày</th>
                      <th style={{ padding: '8px', width: '130px' }}>Lớp học</th>
                      <th style={{ padding: '8px', width: '110px' }}>Trạng thái</th>
                      <th style={{ padding: '8px' }}>Nội dung bài học / Lý do vắng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceModal.sessions.length === 0 ? (
                      <tr><td colSpan={4} style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Không có buổi học nào trong kỳ này.</td></tr>
                    ) : invoiceModal.sessions.map((s: any, idx: number) => {
                      const isPresent = s.status === 'PRESENT';
                      const isExcused = s.status === 'ABSENT_EXCUSED';
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '8px', fontWeight: '500' }}>{new Date(s.session_date).toLocaleDateString('vi-VN')}</td>
                          <td style={{ padding: '8px' }}>{s.class_name}</td>
                          <td style={{ padding: '8px' }}>
                            {isPresent && <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>✅ Có mặt</span>}
                            {isExcused && <span style={{ color: 'var(--color-warning)', fontWeight: 'bold' }}>📝 Vắng phép</span>}
                            {!isPresent && !isExcused && <span style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>❌ Vắng K/P</span>}
                          </td>
                          <td style={{ padding: '8px', color: isPresent ? 'var(--color-text)' : 'var(--color-danger)' }}>
                            {isPresent ? (s.content || 'Buổi học định kỳ') : (s.absent_reason ? `Lý do: ${s.absent_reason}` : 'Không có lý do')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ marginBottom: 'var(--spacing-6)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-2)' }}>
                  <label style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--color-text)' }}>💬 Nhận xét của giáo viên:</label>
                  <Button 
                    onClick={handleGenerateInvoiceRemark} 
                    variant="outline" 
                    size="sm" 
                    className="no-print"
                    disabled={aiLoading}
                  >
                    {aiLoading ? '⏳ AI đang viết...' : '✨ Tạo nhận xét bằng AI'}
                  </Button>
                </div>
                <textarea 
                  value={invoiceModal.teacher_note}
                  onChange={e => setInvoiceModal((prev: any) => ({ ...prev, teacher_note: e.target.value }))}
                  placeholder="Nhập lời nhận xét gửi phụ huynh..."
                  rows={3}
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontFamily: 'inherit', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', paddingTop: '20px', borderTop: '1px dashed var(--color-border)' }}>
                <div style={{ textAlign: 'center', width: '200px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '50px' }}>Phụ huynh học sinh</div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>(Ký và ghi rõ họ tên)</div>
                </div>
                <div style={{ textAlign: 'center', width: '200px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '50px' }}>Giáo viên phụ trách</div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>(Ký và ghi rõ họ tên)</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-6)' }} className="no-print">
              <Button onClick={() => setInvoiceModal({ show: false, bill: null, sessions: [], teacher_note: '' })} variant="ghost">Đóng</Button>
              <Button onClick={handlePrint} variant="primary">🖨️ In Phiếu Thu (A4)</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal AI Nhận xét Riêng */}
      {aiRemarkModal.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--spacing-4)' }}>
          <Card style={{ width: '100%', maxWidth: '800px', padding: 'var(--spacing-8)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
                <h2 style={{ margin: 0, color: 'var(--color-text)' }}>✨ Báo cáo Tháng {moment(selectedMonth).format('MM/YYYY')} - {aiRemarkModal.studentName}</h2>
                <Badge variant="info">AI Hỗ trợ giáo viên</Badge>
            </div>
            
            {aiRemarkModal.loading ? (
              <div style={{ textAlign: 'center', padding: 'var(--spacing-10)', color: 'var(--color-primary)', fontWeight: 'var(--font-weight-bold)' }}>
                 <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
                 Gemini đang phân tích dữ liệu...
              </div>
            ) : (
              <div id="print-area">
                <div style={{ padding: 'var(--spacing-4)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--spacing-6)' }}>
                    <h4 style={{ margin: '0 0 var(--spacing-2) 0', color: 'var(--color-text-secondary)' }}>Bản nháp AI (Giáo viên có thể chỉnh sửa)</h4>
                    <textarea 
                      value={aiRemarkModal.text}
                      onChange={(e) => setAiRemarkModal(prev => ({...prev, text: e.target.value}))}
                      style={{ width: '100%', height: '300px', padding: 'var(--spacing-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', fontSize: '15px', outline: 'none', resize: 'vertical', lineHeight: '1.6', fontFamily: 'inherit' }}
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--spacing-5)' }} className="no-print">
                  <div>
                    <Button onClick={() => generateRemark(aiRemarkModal.studentId!, aiRemarkModal.studentName, aiRemarkModal.billId)} variant="outline">Tạo lại với AI</Button>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                    <Button onClick={() => setAiRemarkModal({ show: false, studentId: null, studentName: '', text: '', dataSummary: null, loading: false })} variant="ghost">Đóng</Button>
                    <Button onClick={handleSaveRemark} variant="secondary">Lưu báo cáo</Button>
                    <Button onClick={handlePrint} variant="primary">In báo cáo (A4)</Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
      
      <style>
          {`
            @media print {
                body * {
                    visibility: hidden;
                }
                #print-area, #print-area *, #invoice-print-area, #invoice-print-area * {
                    visibility: visible;
                }
                #print-area, #invoice-print-area {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                }
                .no-print { display: none !important; }
                textarea {
                    border: none !important;
                    height: auto !important;
                    overflow: visible !important;
                    background: transparent !important;
                    box-shadow: none !important;
                }
            }
          `}
      </style>
    </div>
  );
};

export default TuitionManager;
