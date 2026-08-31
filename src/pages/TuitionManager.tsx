import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const [invoiceTemplate, setInvoiceTemplate] = useState('Classic');
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
  }, [showCreateModal]);
  
  const handlePreview = async () => {
    if (!createData.student_id || !createData.start_date || !createData.end_date) return alert("Nhập đủ thông tin");
    try {
      const res = await axiosClient.get(`/api/payments/preview?student_id=${createData.student_id}&start_date=${createData.start_date}&end_date=${createData.end_date}`);
      setPreviewData(res.data);
    } catch(e) { alert("Lỗi preview"); }
  };
  
  const handleCreateBill = async () => {
    try {
      await axiosClient.post('/api/payments/create', createData);
      setShowCreateModal(false);
      setPreviewData(null);
      fetchBills();
    } catch(e) { alert("Lỗi tạo phiếu"); }
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
    } catch (error) { console.error("Lỗi tải hóa đơn"); }
  }, [selectedMonth]);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  const handleConfirmPayment = async (id: number) => {
    const confirm = window.confirm('💰 Xác nhận phụ huynh đã chuyển khoản cho phiếu này?');
    if (!confirm) return;
    try {
      await axiosClient.put(`/api/payments/${id}/pay`, {});
      alert('✅ Đã ghi nhận doanh thu thành công! Học sinh đã được cấp tem.');
      fetchBills(); 
    } catch (error) { alert('❌ Lỗi hệ thống.'); }
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
      const res = await axiosClient.post('/api/ai/generate-remark', { student_id: studentId, month: selectedMonth,
        bill_id: billId || aiRemarkModal.billId });
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
      setInvoiceModal({ ...invoiceModal, teacher_note: res.data.remark });
    } catch(e) {
      alert("Lỗi tạo nhận xét");
    }
    setAiLoading(false);
  };
  
  const handleSaveInvoiceNote = async () => {
    // Actually just update the bill_note in DB (if needed) or just print it.
    // We will just keep it in state for printing.
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
      setInvoiceModal({ show: true, bill: res.data.bill, sessions: res.data.sessions, teacher_note: res.data.bill.bill_note || '' });
    } catch(e) { alert("Lỗi tải phiếu thu"); }
  };
  
  const handlePrint = () => {
    const printContent = document.getElementById('print-area');
    if (!printContent) return;
    
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  return (
    <div style={{ padding: 'var(--spacing-10)', maxWidth: '100%', boxSizing: 'border-box' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--spacing-8)', paddingBottom: 'var(--spacing-4)' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', color: 'var(--color-text)', fontSize: '30px' }}>Quản lý Tài chính & Phiếu học phí</h1>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '15px' }}>Lưu trữ phiếu học phí, xác nhận thanh toán và gửi báo cáo hàng tháng.</p>
        </div>
        
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
                <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)' }}>Điểm thi gần đây</th>
                <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)' }}>Tổng tiền</th>
                <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)', textAlign: 'center' }}>Trạng thái</th>
                <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {(!Array.isArray(bills) || bills.length === 0) ? (
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
                          onClick={() => loadExistingRemark(b.student_id, b.full_name, b.id)}
                          variant="secondary" size="sm" style={{ borderColor: 'var(--color-primary-light)', color: 'var(--color-primary-dark)' }}>
                          ✨ Nhận xét Tháng
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
                .only-print { display: none !important; }
            @media print {
              .no-print { display: none !important; }
              .only-print { display: block !important; }
                    display: none !important;
                }
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
