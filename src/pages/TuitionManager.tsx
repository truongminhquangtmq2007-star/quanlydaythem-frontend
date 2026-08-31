import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import moment from 'moment';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';

// Helper: Convert Vietnamese number to words
export function numberToVietnameseWords(num: number): string {
  if (!num || isNaN(num) || num === 0) return 'Không đồng';
  const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

  function readGroup(n: number): string {
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const u = n % 10;
    let res = '';

    if (h > 0 || n >= 100) {
      res += digits[h] + ' trăm ';
      if (t === 0 && u > 0) res += 'lẻ ';
    }

    if (t === 1) {
      res += 'mười ';
    } else if (t > 1) {
      res += digits[t] + ' mươi ';
    }

    if (t > 0 && u === 1) {
      res += (t === 1) ? 'một' : 'mốt';
    } else if (t > 0 && u === 5) {
      res += 'lăm';
    } else if (u > 0) {
      res += digits[u];
    }

    return res.trim();
  }

  let n = Math.abs(Math.floor(num));
  let groupIdx = 0;
  const groups: string[] = [];

  while (n > 0) {
    const groupVal = n % 1000;
    if (groupVal > 0) {
      const groupText = readGroup(groupVal);
      const unit = units[groupIdx];
      groups.unshift(groupText + (unit ? ' ' + unit : ''));
    }
    n = Math.floor(n / 1000);
    groupIdx++;
  }

  let result = groups.join(' ').trim();
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1) + ' đồng';
  } else {
    result = 'Không đồng';
  }
  return result;
}

// Color theme definitions
const COLOR_THEMES: Record<string, { primary: string; secondary: string; lightBg: string; text: string; name: string }> = {
  blue: { primary: '#1d4ed8', secondary: '#2563eb', lightBg: '#eff6ff', text: '#1e3a8a', name: 'Xanh dương' },
  purple: { primary: '#6d28d9', secondary: '#7c3aed', lightBg: '#f5f3ff', text: '#4c1d95', name: 'Tím quý tộc' },
  emerald: { primary: '#047857', secondary: '#059669', lightBg: '#ecfdf5', text: '#064e3b', name: 'Xanh ngọc' },
  amber: { primary: '#b45309', secondary: '#d97706', lightBg: '#fffbeb', text: '#78350f', name: 'Cam ấm' },
  monochrome: { primary: '#111827', secondary: '#374151', lightBg: '#f3f4f6', text: '#111827', name: 'Đen trắng' }
};

const TuitionManager = () => {
  const [bills, setBills] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(moment().format('YYYY-MM'));
  const [stats, setStats] = useState({ totalExpected: 0, totalReceived: 0, totalPending: 0 });

  // Invoice Modal state
  const [invoiceModal, setInvoiceModal] = useState<any>({
    show: false,
    bill: null,
    sessions: [],
    teacher_note: '',
    template: 'classic', // 'classic' | 'modern' | 'compact'
    colorTheme: 'blue',
    paperSize: 'A4' // 'A4' | 'A5'
  });
  
  const [aiLoading, setAiLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState({ student_id: '', start_date: '', end_date: '', bill_note: '' });
  const [previewData, setPreviewData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [creatingBill, setCreatingBill] = useState(false);

  useEffect(() => {
    if (showCreateModal && students.length === 0) {
      axiosClient.get('/api/students').then(res => setStudents(res.data || [])).catch(() => {});
    }
  }, [showCreateModal, students.length]);
  
  const handlePreview = async () => {
    if (!createData.student_id || !createData.start_date || !createData.end_date) {
      alert("Vui lòng chọn học sinh và khoảng thời gian");
      return;
    }
    setLoadingPreview(true);
    try {
      const res = await axiosClient.get(`/api/payments/preview?student_id=${createData.student_id}&start_date=${createData.start_date}&end_date=${createData.end_date}`);
      setPreviewData(res.data);
    } catch(e: any) { 
      alert(e.response?.data?.error || "Lỗi xem trước học phí"); 
    } finally {
      setLoadingPreview(false);
    }
  };
  
  const handleCreateBill = async () => {
    if (!createData.student_id || !createData.start_date || !createData.end_date) {
      alert("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    setCreatingBill(true);
    try {
      await axiosClient.post('/api/payments/create', createData);
      setShowCreateModal(false);
      setPreviewData(null);
      setCreateData({ student_id: '', start_date: '', end_date: '', bill_note: '' });
      fetchBills();
      alert("Đã tạo phiếu thu thành công!");
    } catch(e: any) { 
      alert(e.response?.data?.error || "Lỗi tạo phiếu thu"); 
    } finally {
      setCreatingBill(false);
    }
  };
  
  const fetchBills = useCallback(async () => {
    try {
      const res = await axiosClient.get(`/api/payments`);
      const allBills = res.data || [];
      
      const filteredBills = allBills.filter((b: any) => moment(b.created_at).format('YYYY-MM') === selectedMonth);
      setBills(filteredBills);
      
      let expected = 0; let received = 0; let pending = 0;
      filteredBills.forEach((b: any) => {
        const amt = Number(b.total_amount) || 0;
        expected += amt;
        if (b.is_paid) received += amt;
        else pending += amt;
      });
      setStats({ totalExpected: expected, totalReceived: received, totalPending: pending });
    } catch (error) { 
      console.error("Lỗi tải hóa đơn:", error); 
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

  const handleOpenInvoice = async (billId: number) => {
    try {
      const res = await axiosClient.get(`/api/payments/bill/${billId}/invoice`);
      setInvoiceModal({
        show: true,
        bill: res.data.bill,
        sessions: res.data.sessions || [],
        teacher_note: res.data.bill.bill_note || '',
        template: 'classic',
        colorTheme: 'blue',
        paperSize: 'A4'
      });
    } catch(e: any) { 
      alert(e.response?.data?.message || "Lỗi tải phiếu thu"); 
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
      if (res.data?.remark) {
        setInvoiceModal((prev: any) => ({ ...prev, teacher_note: res.data.remark }));
      }
    } catch(e: any) {
      alert("Không thể tạo nhận xét bằng AI lúc này. Bạn vẫn có thể nhập nhận xét thủ công.");
    } finally {
      setAiLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const currentTheme = COLOR_THEMES[invoiceModal.colorTheme] || COLOR_THEMES.blue;

  return (
    <div style={{ padding: 'var(--spacing-10)', maxWidth: '100%', boxSizing: 'border-box' }}>
      
      {/* HEADER QUẢN LÝ TÀI CHÍNH */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--spacing-8)', paddingBottom: 'var(--spacing-4)', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', color: 'var(--color-text)', fontSize: '30px' }}>💰 Quản Lý Tài Chính & Phiếu Học Phí</h1>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '15px' }}>Lập phiếu học phí, gửi phụ huynh, in phiếu và xác nhận thanh toán.</p>
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--spacing-3)', alignItems: 'center' }}>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            + Tạo Phiếu Thu Mới
          </Button>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', padding: 'var(--spacing-2) var(--spacing-3)' }}>
              <span style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-secondary)', fontSize: '14px' }}>📅 Kỳ kế toán:</span>
              <input 
                type="month" 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)} 
                style={{ padding: '6px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', outline: 'none', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary)', cursor: 'pointer' }}
              />
            </div>
          </Card>
        </div>
      </div>

      {/* STATS CARDS */}
      <div style={{ display: 'flex', gap: 'var(--spacing-5)', marginBottom: 'var(--spacing-8)', flexWrap: 'wrap' }}>
        <Card style={{ flex: 1, minWidth: '220px' }}>
          <div style={{ padding: 'var(--spacing-6)' }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontSize: 'var(--font-size-sm)' }}>Tổng học phí kỳ này</h4>
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

      {/* TABLE DANH SÁCH HÓA ĐƠN */}
      <Card style={{ overflow: 'hidden' }}>
        <div style={{ padding: 'var(--spacing-6)', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ margin: 0, color: 'var(--color-text)', fontSize: 'var(--font-size-xl)' }}>Danh sách phiếu học phí {moment(selectedMonth).format('[Tháng] MM/YYYY')}</h3>
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
                <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {(!Array.isArray(bills) || bills.length === 0) ? (
                <tr><td colSpan={6} style={{ padding: 'var(--spacing-10)' }}>
                  <EmptyState title="Không có phiếu học phí" description="Bấm '+ Tạo Phiếu Thu Mới' để lập phiếu học phí cho học sinh." />
                </td></tr>
              ) : (
                bills.map((b) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid var(--color-border)', transition: '0.2s', backgroundColor: b.is_paid ? 'var(--color-surface)' : 'var(--color-danger-light)' }}>
                    <td style={{ padding: 'var(--spacing-4)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-secondary)' }}>#{b.id}</td>
                    <td style={{ padding: 'var(--spacing-4)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text)' }}>{b.full_name}</td>
                    <td style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)' }}>
                      {new Date(b.start_date).toLocaleDateString('vi-VN')} — {new Date(b.end_date).toLocaleDateString('vi-VN')}
                    </td>
                    <td style={{ padding: 'var(--spacing-4)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text)' }}>
                      {Number(b.total_amount).toLocaleString('vi-VN')} đ
                    </td>
                    <td style={{ padding: 'var(--spacing-4)', textAlign: 'center' }}>
                      {b.is_paid ? (
                        <Badge variant="success">🟢 ĐÃ THANH TOÁN</Badge>
                      ) : (
                        <Badge variant="warning">🟠 CHƯA THANH TOÁN</Badge>
                      )}
                    </td>
                    <td style={{ padding: 'var(--spacing-4)', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 'var(--spacing-2)', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <Button 
                          onClick={() => handleOpenInvoice(b.id)}
                          variant="outline" size="sm">
                          📄 Xem / In Phiếu
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
                ))
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

              <Button onClick={handlePreview} variant="outline" disabled={loadingPreview}>
                {loadingPreview ? 'Đang tính toán...' : '🔍 Xem trước buổi học & Số tiền'}
              </Button>

              {previewData && (
                <div style={{ backgroundColor: 'var(--color-background)', padding: 'var(--spacing-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: 'var(--spacing-2)', color: 'var(--color-primary)' }}>
                    Tổng tiền dự kiến: {previewData.total_amount?.toLocaleString('vi-VN')} đ ({previewData.present_count || previewData.sessions?.length || 0} buổi có mặt)
                  </div>
                  {previewData.tuition_fee === 0 && (
                    <div style={{ color: '#b91c1c', fontSize: '13px', marginBottom: '8px' }}>
                      ⚠️ Lưu ý: Đơn giá buổi học của lớp đang là 0đ.
                    </div>
                  )}
                  <div style={{ maxHeight: '150px', overflowY: 'auto', fontSize: 'var(--font-size-sm)' }}>
                    {previewData.sessions?.map((s: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--color-border)' }}>
                        <span>📅 {new Date(s.attendance_date).toLocaleDateString('vi-VN')} - {s.class_name} {s.status === 'PRESENT' ? '✅ Có mặt' : '❌ Vắng'}</span>
                        <span style={{ fontWeight: 'bold' }}>{s.tuition_fee?.toLocaleString('vi-VN')} đ</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)' }}>
              <Button onClick={() => { setShowCreateModal(false); setPreviewData(null); }} variant="ghost">Hủy</Button>
              <Button onClick={handleCreateBill} variant="primary" disabled={creatingBill}>
                {creatingBill ? 'Đang tạo...' : 'Tạo Phiếu Thu'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Preview & In Phiếu Học Phí Đầy Đủ (Templates + Colors + A4/A5 + AI Remark) */}
      {invoiceModal.show && invoiceModal.bill && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--spacing-4)', backdropFilter: 'blur(5px)' }}>
          <Card style={{ width: '100%', maxWidth: '900px', maxHeight: '92vh', overflowY: 'auto', padding: 'var(--spacing-6)', display: 'flex', flexDirection: 'column' }}>
            
            {/* THANH ĐIỀU KHIỂN INVOICE (NO-PRINT) */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-5)', paddingBottom: 'var(--spacing-4)', borderBottom: '1px solid var(--color-border)', flexWrap: 'wrap', gap: '10px' }}>
              
              {/* Chọn Mẫu (Template) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>Mẫu:</span>
                <select 
                  value={invoiceModal.template} 
                  onChange={e => setInvoiceModal((prev: any) => ({ ...prev, template: e.target.value }))}
                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '13px', fontWeight: 'bold' }}
                >
                  <option value="classic">🏛️ Cổ điển (Classic)</option>
                  <option value="modern">✨ Hiện đại (Modern)</option>
                  <option value="compact">📄 Thu gọn (Compact)</option>
                </select>
              </div>

              {/* Chọn Màu (Color Theme) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>Màu:</span>
                {Object.keys(COLOR_THEMES).map(key => (
                  <button 
                    key={key} 
                    onClick={() => setInvoiceModal((prev: any) => ({ ...prev, colorTheme: key }))}
                    title={COLOR_THEMES[key].name}
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      backgroundColor: COLOR_THEMES[key].primary,
                      border: invoiceModal.colorTheme === key ? '2px solid #000' : '2px solid transparent',
                      cursor: 'pointer',
                      transform: invoiceModal.colorTheme === key ? 'scale(1.2)' : 'none',
                      transition: '0.15s'
                    }}
                  />
                ))}
              </div>

              {/* Chọn Khổ Giấy (Paper Size) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>Khổ giấy:</span>
                <div style={{ display: 'flex', border: '1px solid var(--color-border)', borderRadius: '6px', overflow: 'hidden' }}>
                  <button 
                    onClick={() => setInvoiceModal((prev: any) => ({ ...prev, paperSize: 'A4' }))}
                    style={{ padding: '5px 10px', fontSize: '12px', fontWeight: 'bold', border: 'none', backgroundColor: invoiceModal.paperSize === 'A4' ? currentTheme.primary : '#fff', color: invoiceModal.paperSize === 'A4' ? '#fff' : '#333', cursor: 'pointer' }}
                  >
                    A4
                  </button>
                  <button 
                    onClick={() => setInvoiceModal((prev: any) => ({ ...prev, paperSize: 'A5' }))}
                    style={{ padding: '5px 10px', fontSize: '12px', fontWeight: 'bold', border: 'none', backgroundColor: invoiceModal.paperSize === 'A5' ? currentTheme.primary : '#fff', color: invoiceModal.paperSize === 'A5' ? '#fff' : '#333', cursor: 'pointer' }}
                  >
                    A5
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button onClick={handleGenerateInvoiceRemark} variant="outline" size="sm" disabled={aiLoading}>
                  {aiLoading ? '⏳ Đang viết...' : '✨ Tạo nhận xét AI'}
                </Button>
                <Button onClick={handlePrint} variant="primary" size="sm">
                  🖨️ In Phiếu
                </Button>
                <Button onClick={() => setInvoiceModal({ show: false, bill: null, sessions: [], teacher_note: '', template: 'classic', colorTheme: 'blue', paperSize: 'A4' })} variant="ghost" size="sm">
                  Đóng
                </Button>
              </div>
            </div>

            {/* KHU VỰC IN PHIẾU THỰC SỰ (PRINTABLE AREA) */}
            <div 
              id="invoice-print-area" 
              className={`template-${invoiceModal.template} size-${invoiceModal.paperSize}`}
              style={{
                fontFamily: invoiceModal.template === 'classic' ? '"Times New Roman", Times, serif' : 'system-ui, -apple-system, sans-serif',
                color: '#111827',
                backgroundColor: '#ffffff',
                padding: invoiceModal.paperSize === 'A5' ? '12px' : '24px',
                border: invoiceModal.template === 'classic' ? `2px solid ${currentTheme.primary}` : 'none',
                borderRadius: invoiceModal.template === 'modern' ? '12px' : '0',
                boxShadow: invoiceModal.template === 'modern' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              
              {/* HEADER PHIẾU HỌC PHÍ */}
              {invoiceModal.template === 'modern' ? (
                <div style={{ backgroundColor: currentTheme.primary, color: '#ffffff', padding: '16px 20px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h1 style={{ margin: '0 0 4px 0', fontSize: '24px', letterSpacing: '1px' }}>PHIẾU HỌC PHÍ</h1>
                    <div style={{ fontSize: '13px', opacity: 0.9 }}>
                      Lớp: <strong>{invoiceModal.bill.class_name || 'Lớp học'}</strong> • Kỳ thu: {new Date(invoiceModal.bill.start_date).toLocaleDateString('vi-VN')} — {new Date(invoiceModal.bill.end_date).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '13px' }}>
                    <div>Mã phiếu: <strong>#{invoiceModal.bill.id}</strong></div>
                    <div style={{ marginTop: '2px', fontWeight: 'bold' }}>{invoiceModal.bill.is_paid ? '🟢 ĐÃ THANH TOÁN' : '🟠 CHƯA THANH TOÁN'}</div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', borderBottom: `2px solid ${currentTheme.primary}`, paddingBottom: '12px', marginBottom: '20px', position: 'relative' }}>
                  <h1 style={{ margin: '0 0 4px 0', color: currentTheme.primary, fontSize: invoiceModal.paperSize === 'A5' ? '20px' : '26px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    PHIẾU HỌC PHÍ
                  </h1>
                  <p style={{ margin: 0, color: '#4b5563', fontSize: '14px' }}>
                    Kỳ thu: <strong>{new Date(invoiceModal.bill.start_date).toLocaleDateString('vi-VN')}</strong> đến <strong>{new Date(invoiceModal.bill.end_date).toLocaleDateString('vi-VN')}</strong>
                  </p>
                </div>
              )}

              {/* THÔNG TIN HỌC SINH + THÔNG TIN NGÂN HÀNG & QR (BÊN PHẢI) */}
              <div style={{ display: 'grid', gridTemplateColumns: invoiceModal.paperSize === 'A5' ? '1fr 140px' : '1fr 180px', gap: '16px', marginBottom: '20px', backgroundColor: currentTheme.lightBg, padding: '14px 18px', borderRadius: '8px', border: `1px solid ${currentTheme.secondary}30` }}>
                
                {/* Cột trái: Thông tin học sinh */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center' }}>
                  <div style={{ fontSize: '15px' }}>
                    Học sinh: <strong style={{ color: currentTheme.text, fontSize: '17px' }}>{invoiceModal.bill.full_name}</strong>
                  </div>
                  <div style={{ fontSize: '13px', color: '#4b5563' }}>
                    Lớp học: <strong>{invoiceModal.bill.class_name || 'Lớp học'}</strong>
                  </div>
                  <div style={{ fontSize: '13px', color: '#4b5563' }}>
                    Số điện thoại: <strong>{invoiceModal.bill.phone_number || '---'}</strong>
                  </div>
                  {invoiceModal.bill.teacher_name && (
                    <div style={{ fontSize: '13px', color: '#4b5563' }}>
                      Giáo viên phụ trách: <strong>{invoiceModal.bill.teacher_name}</strong>
                    </div>
                  )}
                  <div style={{ marginTop: '4px', fontSize: '13px' }}>
                    Trạng thái: <strong>{invoiceModal.bill.is_paid ? '🟢 ĐÃ THANH TOÁN' : '🟠 CHƯA THANH TOÁN'}</strong>
                  </div>
                </div>

                {/* Cột phải: QR VIETCOMBANK CHUẨN */}
                <div style={{ textAlign: 'center', backgroundColor: '#ffffff', padding: '8px', borderRadius: '8px', border: `1px solid ${currentTheme.secondary}40`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <img 
                    src={`https://img.vietqr.io/image/VCB-1034244823-compact2.png?amount=${Number(invoiceModal.bill.total_amount) || 0}&addInfo=HP%20${encodeURIComponent(invoiceModal.bill.full_name || '')}%20T${moment(invoiceModal.bill.start_date).format('MM')}`}
                    alt="Mã QR Chuyển khoản VCB"
                    style={{ width: invoiceModal.paperSize === 'A5' ? '90px' : '120px', height: invoiceModal.paperSize === 'A5' ? '90px' : '120px', objectFit: 'contain' }}
                  />
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: currentTheme.primary, marginTop: '4px' }}>
                    VIETCOMBANK (VCB)
                  </div>
                  <div style={{ fontSize: '11px', color: '#374151', fontFamily: 'monospace', fontWeight: 'bold' }}>
                    1034244823
                  </div>
                </div>
              </div>

              {/* BẢNG CHI TIẾT CÁC BUỔI HỌC TRONG KỲ */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '8px', color: currentTheme.primary, textTransform: 'uppercase' }}>
                  📋 Danh sách các buổi học trong kỳ ({invoiceModal.sessions?.length || 0} buổi):
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: invoiceModal.paperSize === 'A5' ? '12px' : '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: currentTheme.lightBg, borderBottom: `2px solid ${currentTheme.primary}` }}>
                      <th style={{ padding: '8px 10px', width: '90px' }}>Ngày</th>
                      <th style={{ padding: '8px 10px', width: '120px' }}>Trạng thái</th>
                      <th style={{ padding: '8px 10px' }}>Nội dung buổi học / Lý do nghỉ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!invoiceModal.sessions || invoiceModal.sessions.length === 0) ? (
                      <tr><td colSpan={3} style={{ padding: '12px', textAlign: 'center', color: '#6b7280' }}>Không có buổi học nào trong kỳ này.</td></tr>
                    ) : invoiceModal.sessions.map((s: any, idx: number) => {
                      const isPresent = s.status === 'PRESENT';
                      const isExcused = s.status === 'ABSENT_EXCUSED';
                      const isAbsent = s.status === 'ABSENT' || s.status === 'ABSENT_UNEXCUSED';
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                          <td style={{ padding: '8px 10px', fontWeight: '500' }}>{new Date(s.session_date).toLocaleDateString('vi-VN')}</td>
                          <td style={{ padding: '8px 10px' }}>
                            {isPresent && <span style={{ color: '#059669', fontWeight: 'bold' }}>🟢 Có mặt</span>}
                            {isExcused && <span style={{ color: '#d97706', fontWeight: 'bold' }}>🟡 Vắng phép</span>}
                            {isAbsent && <span style={{ color: '#dc2626', fontWeight: 'bold' }}>🔴 Vắng K/P</span>}
                            {!isPresent && !isExcused && !isAbsent && <span style={{ color: '#6b7280' }}>⚪ Chưa điểm danh</span>}
                          </td>
                          <td style={{ padding: '8px 10px', color: isPresent ? '#111827' : '#b91c1c' }}>
                            {isPresent ? (s.content || 'Buổi học theo lộ trình') : (s.absent_reason ? `Lý do: ${s.absent_reason}` : 'Nghỉ học')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* TỔNG TIỀN HỌC PHÍ & BẰNG CHỮ */}
              <div style={{ backgroundColor: currentTheme.lightBg, padding: '14px 18px', borderRadius: '8px', border: `1px solid ${currentTheme.secondary}40`, marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '13px', color: '#4b5563' }}>Số tiền học phí cần thanh toán:</div>
                  <div style={{ fontSize: '14px', color: currentTheme.text, fontStyle: 'italic', marginTop: '2px' }}>
                    Bằng chữ: <strong>{numberToVietnameseWords(Number(invoiceModal.bill.total_amount) || 0)}</strong>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: invoiceModal.paperSize === 'A5' ? '18px' : '22px', fontWeight: 'bold', color: currentTheme.primary }}>
                    HỌC PHÍ: {Number(invoiceModal.bill.total_amount).toLocaleString('vi-VN')} đ
                  </div>
                </div>
              </div>

              {/* NHẬN XÉT CỦA GIÁO VIÊN */}
              <div style={{ marginBottom: '25px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: currentTheme.primary, marginBottom: '6px', textTransform: 'uppercase' }}>
                  💬 Nhận xét của giáo viên:
                </div>
                <textarea 
                  value={invoiceModal.teacher_note}
                  onChange={e => setInvoiceModal((prev: any) => ({ ...prev, teacher_note: e.target.value }))}
                  placeholder="Nhập nhận xét gửi phụ huynh học sinh..."
                  rows={invoiceModal.paperSize === 'A5' ? 2 : 4}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontFamily: 'inherit',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    boxSizing: 'border-box',
                    backgroundColor: '#ffffff',
                    color: '#111827'
                  }}
                />
              </div>

              {/* CHỮ KÝ */}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '15px', borderTop: '1px dashed #d1d5db' }}>
                <div style={{ textAlign: 'center', width: '180px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '45px' }}>Phụ huynh học sinh</div>
                  <div style={{ color: '#6b7280', fontSize: '11px' }}>(Ký và ghi rõ họ tên)</div>
                </div>
                <div style={{ textAlign: 'center', width: '180px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '45px' }}>Giáo viên phụ trách</div>
                  <div style={{ color: '#6b7280', fontSize: '11px' }}>{invoiceModal.bill.teacher_name || '(Ký và ghi rõ họ tên)'}</div>
                </div>
              </div>

            </div>

          </Card>
        </div>
      )}

      {/* PRINT STYLES */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #invoice-print-area, #invoice-print-area * {
              visibility: visible;
            }
            #invoice-print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100% !important;
              max-width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
              border: none !important;
              box-shadow: none !important;
            }
            .no-print {
              display: none !important;
            }
            textarea {
              border: none !important;
              height: auto !important;
              overflow: visible !important;
              background: transparent !important;
              box-shadow: none !important;
              resize: none !important;
              padding: 0 !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default TuitionManager;
