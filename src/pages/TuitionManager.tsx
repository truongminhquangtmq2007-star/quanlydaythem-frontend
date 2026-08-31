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

// 12 Professional Color Themes
const COLOR_THEMES: Record<string, { primary: string; secondary: string; lightBg: string; text: string; name: string }> = {
  navy: { primary: '#1e3a8a', secondary: '#172554', lightBg: '#f0f4ff', text: '#172554', name: '01 Navy' },
  blue: { primary: '#2563eb', secondary: '#1d4ed8', lightBg: '#eff6ff', text: '#1e3a8a', name: '02 Blue' },
  sky: { primary: '#0284c7', secondary: '#0369a1', lightBg: '#f0f9ff', text: '#0c4a6e', name: '03 Sky' },
  purple: { primary: '#7c3aed', secondary: '#6d28d9', lightBg: '#f5f3ff', text: '#4c1d95', name: '04 Purple' },
  violet: { primary: '#8b5cf6', secondary: '#6b21a8', lightBg: '#faf5ff', text: '#581c87', name: '05 Violet' },
  emerald: { primary: '#059669', secondary: '#047857', lightBg: '#ecfdf5', text: '#064e3b', name: '06 Emerald' },
  teal: { primary: '#0d9488', secondary: '#0f766e', lightBg: '#f0fdfa', text: '#134e4a', name: '07 Teal' },
  green: { primary: '#16a34a', secondary: '#15803d', lightBg: '#f0fdf4', text: '#14532d', name: '08 Green' },
  amber: { primary: '#d97706', secondary: '#b45309', lightBg: '#fffbeb', text: '#78350f', name: '09 Amber' },
  orange: { primary: '#ea580c', secondary: '#c2410c', lightBg: '#fff7ed', text: '#7c2d12', name: '10 Orange' },
  rose: { primary: '#e11d48', secondary: '#be123c', lightBg: '#fff1f2', text: '#881337', name: '11 Rose' },
  monochrome: { primary: '#111827', secondary: '#374151', lightBg: '#f3f4f6', text: '#111827', name: '12 Monochrome' }
};

// 8 Distinct Templates Metadata
const TEMPLATES = [
  { id: 'classic', name: '🏛️ Classic', desc: 'Khung viền truyền thống, chỉn chu' },
  { id: 'modern', name: '✨ Modern', desc: 'Dải banner màu nổi bật, bo góc mượt' },
  { id: 'minimal', name: '🍃 Minimal', desc: 'Thiết kế phẳng tối giản, thanh thoát' },
  { id: 'elegant', name: '👑 Elegant', desc: 'Sang trọng, đường line mảnh tinh tế' },
  { id: 'soft', name: '🌸 Soft', desc: 'Thẻ pastel mềm mại, bo tròn ấm áp' },
  { id: 'card', name: '🗂️ Card', desc: 'Chia các khối thông tin độc lập' },
  { id: 'academic', name: '🎓 Academic', desc: 'Chuẩn học thuật giáo dục' },
  { id: 'compact', name: '📄 Compact', desc: 'Thu gọn 2 cột tối ưu 1 trang in' }
];

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
    template: 'classic', // classic | modern | minimal | elegant | soft | card | academic | compact
    colorTheme: 'blue',
    customPrimaryColor: '',
    paperSize: 'A4' // A4 | A5
  });
  
  const [aiLoading, setAiLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState({ 
    student_id: '', 
    start_date: '', 
    end_date: '', 
    bill_note: '',
    unit_price: ''
  });
  const [previewData, setPreviewData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [creatingBill, setCreatingBill] = useState(false);

  useEffect(() => {
    if (showCreateModal && students.length === 0) {
      axiosClient.get('/api/students').then(res => setStudents(res.data || [])).catch(() => {});
    }
  }, [showCreateModal, students.length]);

  // When student changes in create modal, try pre-filling preview & default fee
  const handleStudentChange = async (studentId: string) => {
    setCreateData(prev => ({ ...prev, student_id: studentId, unit_price: '' }));
    setPreviewData(null);
    if (!studentId || !createData.start_date || !createData.end_date) return;
    fetchPreview(studentId, createData.start_date, createData.end_date, '');
  };

  const fetchPreview = async (studentId: string, startDate: string, endDate: string, unitPrice: string) => {
    if (!studentId || !startDate || !endDate) return;
    setLoadingPreview(true);
    try {
      let url = `/api/payments/preview?student_id=${studentId}&start_date=${startDate}&end_date=${endDate}`;
      if (unitPrice !== '') url += `&unit_price=${unitPrice}`;
      const res = await axiosClient.get(url);
      setPreviewData(res.data);
      if (unitPrice === '' && res.data.tuition_fee > 0) {
        setCreateData(prev => ({ ...prev, unit_price: String(res.data.tuition_fee) }));
      }
    } catch(e: any) { 
      console.error("Lỗi xem trước học phí:", e);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handlePreviewBtnClick = () => {
    if (!createData.student_id || !createData.start_date || !createData.end_date) {
      alert("Vui lòng chọn học sinh và khoảng thời gian (Từ ngày - Đến ngày)");
      return;
    }
    fetchPreview(createData.student_id, createData.start_date, createData.end_date, createData.unit_price);
  };
  
  const handleCreateBill = async () => {
    if (!createData.student_id || !createData.start_date || !createData.end_date) {
      alert("Vui lòng nhập đầy đủ thông tin học sinh và kỳ thu");
      return;
    }
    const unitPriceNum = parseInt(createData.unit_price, 10);
    if (isNaN(unitPriceNum) || unitPriceNum < 0) {
      alert("Vui lòng nhập đơn giá hợp lệ (≥ 0 VNĐ)");
      return;
    }
    setCreatingBill(true);
    try {
      await axiosClient.post('/api/payments/create', createData);
      setShowCreateModal(false);
      setPreviewData(null);
      setCreateData({ student_id: '', start_date: '', end_date: '', bill_note: '', unit_price: '' });
      fetchBills();
      alert("✅ Đã tạo phiếu thu thành công!");
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
        customPrimaryColor: '',
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

  // Active theme calculation
  const baseTheme = COLOR_THEMES[invoiceModal.colorTheme] || COLOR_THEMES.blue;
  const currentTheme = invoiceModal.customPrimaryColor ? {
    primary: invoiceModal.customPrimaryColor,
    secondary: invoiceModal.customPrimaryColor,
    lightBg: `${invoiceModal.customPrimaryColor}12`,
    text: '#111827',
    name: 'Tùy chỉnh'
  } : baseTheme;

  return (
    <div style={{ padding: 'var(--spacing-10)', maxWidth: '100%', boxSizing: 'border-box' }}>
      
      {/* HEADER QUẢN LÝ TÀI CHÍNH */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--spacing-8)', paddingBottom: 'var(--spacing-4)', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', color: 'var(--color-text)', fontSize: '30px' }}>💰 Quản Lý Tài Chính & Phiếu Học Phí</h1>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '15px' }}>Lập phiếu học phí, xem trước số tiền, in phiếu online hiện đại và quản lý trạng thái thanh toán.</p>
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

      {/* Modal Tạo Phiếu Thu Mới (Có nhập & hiển thị Đơn giá) */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--spacing-4)', backdropFilter: 'blur(4px)' }}>
          <Card style={{ width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 20px 0', color: 'var(--color-text)', fontSize: '22px' }}>💰 Lập Phiếu Học Phí Học Sinh</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)' }}>
              
              {/* Chọn học sinh */}
              <div>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-1)', fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)' }}>
                  Học sinh: <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select 
                  value={createData.student_id} 
                  onChange={e => handleStudentChange(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '14px' }}
                >
                  <option value="">-- Chọn học sinh nhận phiếu --</option>
                  {students.map(st => (
                    <option key={st.id} value={st.id}>{st.full_name} ({st.phone_number || st.school_name || 'Chưa có SĐT'})</option>
                  ))}
                </select>
              </div>

              {/* Kỳ thu */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
                <Input 
                  type="date" 
                  label="Từ ngày" 
                  value={createData.start_date} 
                  onChange={e => setCreateData(prev => ({ ...prev, start_date: e.target.value }))} 
                />
                <Input 
                  type="date" 
                  label="Đến ngày" 
                  value={createData.end_date} 
                  onChange={e => setCreateData(prev => ({ ...prev, end_date: e.target.value }))} 
                />
              </div>

              {/* Nhập đơn giá */}
              <div>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-1)', fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)' }}>
                  Đơn giá học phí / buổi (VNĐ): <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <Input 
                  type="number"
                  placeholder="Ví dụ: 200000"
                  min="0"
                  step="10000"
                  value={createData.unit_price}
                  onChange={e => setCreateData(prev => ({ ...prev, unit_price: e.target.value }))}
                />
                {createData.student_id && createData.unit_price === '0' && (
                  <div style={{ color: '#d97706', fontSize: '13px', marginTop: '4px' }}>
                    ⚠️ Lớp chưa có đơn giá mặc định. Vui lòng nhập mức học phí / buổi cho phiếu này.
                  </div>
                )}
              </div>

              {/* Ghi chú */}
              <Input 
                label="Ghi chú phiếu thu (Tùy chọn)" 
                placeholder="VD: Học phí tháng 9, đã trừ 1 buổi nghỉ có phép..." 
                value={createData.bill_note} 
                onChange={e => setCreateData(prev => ({ ...prev, bill_note: e.target.value }))} 
              />

              <Button onClick={handlePreviewBtnClick} variant="outline" disabled={loadingPreview}>
                {loadingPreview ? '⏳ Đang tính toán...' : '🔍 Xem trước số buổi có mặt & Số tiền'}
              </Button>

              {/* Khu vực Xem Trước */}
              {previewData && (
                <div style={{ backgroundColor: 'var(--color-background)', padding: 'var(--spacing-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                      Lớp: <strong>{previewData.class_name}</strong>
                    </span>
                    <span style={{ fontSize: '14px', color: '#059669', fontWeight: 'bold' }}>
                      Số buổi có mặt: {previewData.present_count || 0} buổi
                    </span>
                  </div>

                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '8px' }}>
                    Dự kiến học phí: {(Number(previewData.total_amount) || 0).toLocaleString('vi-VN')} đ
                  </div>
                  
                  <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontStyle: 'italic', marginBottom: '10px' }}>
                    Bằng chữ: {numberToVietnameseWords(Number(previewData.total_amount) || 0)}
                  </div>

                  {previewData.present_count === 0 && (
                    <div style={{ color: '#dc2626', fontSize: '13px', marginBottom: '6px' }}>
                      ⚠️ Không tìm thấy buổi học nào có mặt (PRESENT) của học sinh trong khoảng thời gian này.
                    </div>
                  )}

                  {/* Danh sách buổi tóm tắt */}
                  <div style={{ maxHeight: '140px', overflowY: 'auto', fontSize: '13px', borderTop: '1px solid var(--color-border)', paddingTop: '6px' }}>
                    {previewData.sessions?.map((s: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px dashed var(--color-border)' }}>
                        <span>📅 {new Date(s.attendance_date).toLocaleDateString('vi-VN')} - {s.content || 'Buổi học'}</span>
                        <span style={{ fontWeight: 'bold', color: s.status === 'PRESENT' ? '#059669' : '#dc2626' }}>
                          {s.status === 'PRESENT' ? '✅ Có mặt' : (s.absent_reason ? `Vắng (${s.absent_reason})` : '❌ Vắng')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)' }}>
              <Button onClick={() => { setShowCreateModal(false); setPreviewData(null); }} variant="ghost">Hủy</Button>
              <Button 
                onClick={handleCreateBill} 
                variant="primary" 
                disabled={creatingBill || !createData.student_id || !createData.start_date || !createData.end_date || (previewData && previewData.total_amount <= 0)}
              >
                {creatingBill ? 'Đang tạo...' : 'Tạo Phiếu Thu'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Preview & In Phiếu Học Phí Đầy Đủ (8 Templates + 12 Themes + Color Picker + A4/A5 - KHÔNG CHỮ KÝ) */}
      {invoiceModal.show && invoiceModal.bill && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--spacing-4)', backdropFilter: 'blur(6px)' }}>
          <Card style={{ width: '100%', maxWidth: '960px', maxHeight: '94vh', overflowY: 'auto', padding: 'var(--spacing-6)', display: 'flex', flexDirection: 'column' }}>
            
            {/* THANH ĐIỀU KHIỂN INVOICE (NO-PRINT) */}
            <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: 'var(--spacing-5)', paddingBottom: 'var(--spacing-4)', borderBottom: '1px solid var(--color-border)' }}>
              
              {/* Hàng 1: GALLERY 8 MẪU THIẾT KẾ */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  🎨 Chọn Mẫu Phiếu (8 Templates):
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: '8px' }}>
                  {TEMPLATES.map(tmpl => {
                    const isSelected = invoiceModal.template === tmpl.id;
                    return (
                      <button
                        key={tmpl.id}
                        onClick={() => setInvoiceModal((prev: any) => ({ ...prev, template: tmpl.id }))}
                        style={{
                          padding: '8px 6px',
                          borderRadius: '8px',
                          border: isSelected ? `2px solid ${currentTheme.primary}` : '1px solid var(--color-border)',
                          backgroundColor: isSelected ? currentTheme.lightBg : 'var(--color-surface)',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ fontWeight: 'bold', fontSize: '13px', color: isSelected ? currentTheme.primary : 'var(--color-text)' }}>
                          {tmpl.name}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {tmpl.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hàng 2: BỘ 12 MÀU + CUSTOM COLOR PICKER + KHỔ GIẤY A4/A5 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                
                {/* 12 Color Themes */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>Màu:</span>
                  {Object.keys(COLOR_THEMES).map(key => (
                    <button 
                      key={key} 
                      onClick={() => setInvoiceModal((prev: any) => ({ ...prev, colorTheme: key, customPrimaryColor: '' }))}
                      title={COLOR_THEMES[key].name}
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: COLOR_THEMES[key].primary,
                        border: (invoiceModal.colorTheme === key && !invoiceModal.customPrimaryColor) ? '2px solid #000' : '2px solid transparent',
                        cursor: 'pointer',
                        transform: (invoiceModal.colorTheme === key && !invoiceModal.customPrimaryColor) ? 'scale(1.2)' : 'none',
                        transition: '0.15s'
                      }}
                    />
                  ))}

                  {/* Custom color picker */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
                    <input 
                      type="color" 
                      value={invoiceModal.customPrimaryColor || currentTheme.primary}
                      onChange={e => setInvoiceModal((prev: any) => ({ ...prev, customPrimaryColor: e.target.value }))}
                      title="Chọn màu chủ đạo tùy chỉnh"
                      style={{ width: '24px', height: '24px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    />
                  </div>
                </div>

                {/* Khổ giấy A4 / A5 & Thao tác */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', border: '1px solid var(--color-border)', borderRadius: '6px', overflow: 'hidden' }}>
                    <button 
                      onClick={() => setInvoiceModal((prev: any) => ({ ...prev, paperSize: 'A4' }))}
                      style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 'bold', border: 'none', backgroundColor: invoiceModal.paperSize === 'A4' ? currentTheme.primary : '#fff', color: invoiceModal.paperSize === 'A4' ? '#fff' : '#333', cursor: 'pointer' }}
                    >
                      A4
                    </button>
                    <button 
                      onClick={() => setInvoiceModal((prev: any) => ({ ...prev, paperSize: 'A5' }))}
                      style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 'bold', border: 'none', backgroundColor: invoiceModal.paperSize === 'A5' ? currentTheme.primary : '#fff', color: invoiceModal.paperSize === 'A5' ? '#fff' : '#333', cursor: 'pointer' }}
                    >
                      A5
                    </button>
                  </div>

                  <Button onClick={handleGenerateInvoiceRemark} variant="outline" size="sm" disabled={aiLoading}>
                    {aiLoading ? '⏳ Đang viết...' : '✨ Tạo nhận xét AI'}
                  </Button>
                  <Button onClick={handlePrint} variant="primary" size="sm">
                    🖨️ In Phiếu
                  </Button>
                  <Button onClick={() => setInvoiceModal({ show: false, bill: null, sessions: [], teacher_note: '', template: 'classic', colorTheme: 'blue', customPrimaryColor: '', paperSize: 'A4' })} variant="ghost" size="sm">
                    Đóng
                  </Button>
                </div>
              </div>

            </div>

            {/* KHU VỰC IN PHIẾU THỰC SỰ (PRINTABLE AREA - KHÔNG Ô KÝ TÊN) */}
            <div 
              id="invoice-print-area" 
              className={`template-${invoiceModal.template} size-${invoiceModal.paperSize}`}
              style={{
                fontFamily: (invoiceModal.template === 'classic' || invoiceModal.template === 'academic') 
                  ? '"Times New Roman", Times, serif' 
                  : (invoiceModal.template === 'elegant')
                  ? 'Georgia, serif'
                  : 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                color: '#111827',
                backgroundColor: '#ffffff',
                padding: invoiceModal.paperSize === 'A5' ? '16px' : '28px',
                border: invoiceModal.template === 'classic' 
                  ? `2px solid ${currentTheme.primary}` 
                  : invoiceModal.template === 'elegant'
                  ? `1px solid ${currentTheme.primary}`
                  : 'none',
                borderRadius: invoiceModal.template === 'modern' ? '12px' : invoiceModal.template === 'soft' ? '18px' : '0',
                boxShadow: (invoiceModal.template === 'modern' || invoiceModal.template === 'soft') ? '0 4px 16px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              
              {/* ========================================================================= */}
              {/* 1. HEADER SECTION THEO TỪNG TEMPLATE */}
              {/* ========================================================================= */}
              {invoiceModal.template === 'modern' && (
                <div style={{ backgroundColor: currentTheme.primary, color: '#ffffff', padding: '16px 20px', borderRadius: '10px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h1 style={{ margin: '0 0 4px 0', fontSize: '22px', letterSpacing: '1px' }}>PHIẾU HỌC PHÍ ONLINE</h1>
                    <div style={{ fontSize: '13px', opacity: 0.95 }}>
                      Lớp: <strong>{invoiceModal.bill.class_name || 'Lớp học'}</strong> • Kỳ: {new Date(invoiceModal.bill.start_date).toLocaleDateString('vi-VN')} — {new Date(invoiceModal.bill.end_date).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '13px' }}>
                    <div>Mã phiếu: <strong>#{invoiceModal.bill.id}</strong></div>
                    <div style={{ marginTop: '2px', fontWeight: 'bold' }}>{invoiceModal.bill.is_paid ? '🟢 ĐÃ THANH TOÁN' : '🟠 CHƯA THANH TOÁN'}</div>
                  </div>
                </div>
              )}

              {invoiceModal.template === 'minimal' && (
                <div style={{ borderBottom: `1px solid #e5e7eb`, paddingBottom: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '300', letterSpacing: '2px', color: currentTheme.primary }}>PHIẾU HỌC PHÍ</h1>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      Kỳ thu: {new Date(invoiceModal.bill.start_date).toLocaleDateString('vi-VN')} — {new Date(invoiceModal.bill.end_date).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '12px', color: '#6b7280' }}>
                    Mã phiếu: #{invoiceModal.bill.id}
                  </div>
                </div>
              )}

              {invoiceModal.template === 'elegant' && (
                <div style={{ textAlign: 'center', borderBottom: `1px solid ${currentTheme.primary}40`, paddingBottom: '16px', marginBottom: '22px' }}>
                  <div style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: currentTheme.primary, fontWeight: 'bold', marginBottom: '4px' }}>HỆ THỐNG GIÁO DỤC</div>
                  <h1 style={{ margin: '0 0 6px 0', color: currentTheme.primary, fontSize: '24px', fontWeight: 'normal', letterSpacing: '1px' }}>PHIẾU HỌC PHÍ</h1>
                  <div style={{ fontSize: '13px', color: '#4b5563', fontStyle: 'italic' }}>
                    Kỳ thu: {new Date(invoiceModal.bill.start_date).toLocaleDateString('vi-VN')} đến {new Date(invoiceModal.bill.end_date).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              )}

              {invoiceModal.template === 'soft' && (
                <div style={{ backgroundColor: currentTheme.lightBg, padding: '16px 20px', borderRadius: '14px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ backgroundColor: '#ffffff', color: currentTheme.primary, padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>THÔNG BÁO HỌC PHÍ</span>
                    <h1 style={{ margin: '6px 0 2px 0', color: currentTheme.text, fontSize: '22px' }}>{invoiceModal.bill.full_name}</h1>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>Lớp: {invoiceModal.bill.class_name} • Kỳ: {new Date(invoiceModal.bill.start_date).toLocaleDateString('vi-VN')} — {new Date(invoiceModal.bill.end_date).toLocaleDateString('vi-VN')}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: invoiceModal.bill.is_paid ? '#059669' : '#d97706' }}>
                      {invoiceModal.bill.is_paid ? '🟢 ĐÃ THANH TOÁN' : '🟠 CHƯA THANH TOÁN'}
                    </span>
                  </div>
                </div>
              )}

              {invoiceModal.template === 'academic' && (
                <div style={{ textAlign: 'center', borderBottom: `2px double ${currentTheme.primary}`, paddingBottom: '14px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: '#4b5563', fontWeight: 'bold' }}>PHIẾU BÁO KẾT QUẢ & HỌC PHÍ ĐỊNH KỲ</div>
                  <h1 style={{ margin: '4px 0', color: currentTheme.primary, fontSize: '24px' }}>PHIẾU HỌC PHÍ</h1>
                  <div style={{ fontSize: '13px', color: '#4b5563' }}>Kỳ thu: {new Date(invoiceModal.bill.start_date).toLocaleDateString('vi-VN')} — {new Date(invoiceModal.bill.end_date).toLocaleDateString('vi-VN')} • Mã phiếu: #{invoiceModal.bill.id}</div>
                </div>
              )}

              {(invoiceModal.template === 'classic' || invoiceModal.template === 'card' || invoiceModal.template === 'compact') && (
                <div style={{ textAlign: 'center', borderBottom: `2px solid ${currentTheme.primary}`, paddingBottom: '12px', marginBottom: '20px' }}>
                  <h1 style={{ margin: '0 0 4px 0', color: currentTheme.primary, fontSize: invoiceModal.paperSize === 'A5' ? '20px' : '24px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    PHIẾU HỌC PHÍ
                  </h1>
                  <p style={{ margin: 0, color: '#4b5563', fontSize: '13px' }}>
                    Kỳ thu: <strong>{new Date(invoiceModal.bill.start_date).toLocaleDateString('vi-VN')}</strong> đến <strong>{new Date(invoiceModal.bill.end_date).toLocaleDateString('vi-VN')}</strong> • Mã phiếu: #{invoiceModal.bill.id}
                  </p>
                </div>
              )}

              {/* ========================================================================= */}
              {/* 2. THÔNG TIN HỌC SINH + KHU VỰC THANH TOÁN & QR VIETCOMBANK */}
              {/* ========================================================================= */}
              <div 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: invoiceModal.template === 'compact' 
                    ? '1fr 140px' 
                    : invoiceModal.paperSize === 'A5' ? '1fr 125px' : '1fr 170px', 
                  gap: '16px', 
                  marginBottom: '20px', 
                  backgroundColor: currentTheme.lightBg, 
                  padding: invoiceModal.paperSize === 'A5' ? '10px 14px' : '14px 18px', 
                  borderRadius: invoiceModal.template === 'soft' ? '14px' : '8px', 
                  border: `1px solid ${currentTheme.secondary}25`,
                  alignItems: 'center'
                }}
              >
                
                {/* Cột trái: Thông tin học sinh */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', justifyContent: 'center' }}>
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
                  <div style={{ marginTop: '2px', fontSize: '13px' }}>
                    Trạng thái: <strong style={{ color: invoiceModal.bill.is_paid ? '#059669' : '#d97706' }}>{invoiceModal.bill.is_paid ? '🟢 ĐÃ THANH TOÁN' : '🟠 CHƯA THANH TOÁN'}</strong>
                  </div>
                </div>

                {/* Cột phải: QR VIETCOMBANK PHÓNG LỚN TỐI ĐA (KHÔNG CHỮ TO) */}
                <div style={{ textAlign: 'center', backgroundColor: '#ffffff', padding: '6px', borderRadius: '8px', border: `1px solid ${currentTheme.secondary}35`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <img 
                    src={`https://img.vietqr.io/image/VCB-1034244823-compact2.png?amount=${Number(invoiceModal.bill.total_amount) || 0}&addInfo=HP%20${encodeURIComponent(invoiceModal.bill.full_name || '')}%20T${moment(invoiceModal.bill.start_date).format('MM')}`}
                    alt="Mã QR Chuyển khoản VCB"
                    style={{ 
                      width: '100%', 
                      maxWidth: invoiceModal.paperSize === 'A5' ? '112px' : '156px', 
                      aspectRatio: '1/1', 
                      objectFit: 'contain',
                      display: 'block'
                    }}
                  />
                  <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px', whiteSpace: 'nowrap' }}>
                    VCB • 1034244823
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* 3. BẢNG CHI TIẾT CÁC BUỔI HỌC TRONG KỲ */}
              {/* ========================================================================= */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '8px', color: currentTheme.primary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  📋 Danh sách các buổi học trong kỳ ({invoiceModal.sessions?.length || 0} buổi):
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: invoiceModal.paperSize === 'A5' ? '12px' : '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: currentTheme.lightBg, borderBottom: `2px solid ${currentTheme.primary}` }}>
                      <th style={{ padding: '8px 10px', width: '85px' }}>Ngày</th>
                      <th style={{ padding: '8px 10px', width: '115px' }}>Trạng thái</th>
                      <th style={{ padding: '8px 10px' }}>Nội dung bài học / Lý do nghỉ</th>
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

              {/* ========================================================================= */}
              {/* 4. TỔNG TIỀN HỌC PHÍ & BẰNG CHỮ (NỔI BẬT) */}
              {/* ========================================================================= */}
              <div 
                style={{ 
                  backgroundColor: currentTheme.lightBg, 
                  padding: '14px 18px', 
                  borderRadius: invoiceModal.template === 'soft' ? '14px' : '8px', 
                  border: `1px solid ${currentTheme.secondary}35`, 
                  marginBottom: '20px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  flexWrap: 'wrap', 
                  gap: '10px' 
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Số tiền học phí:</div>
                  <div style={{ fontSize: '13px', color: currentTheme.text, fontStyle: 'italic', marginTop: '2px' }}>
                    Bằng chữ: <strong>{numberToVietnameseWords(Number(invoiceModal.bill.total_amount) || 0)}</strong>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: invoiceModal.paperSize === 'A5' ? '18px' : '22px', fontWeight: 'bold', color: currentTheme.primary }}>
                    HỌC PHÍ: {Number(invoiceModal.bill.total_amount).toLocaleString('vi-VN')} ₫
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* 5. NHẬN XÉT CỦA GIÁO VIÊN */}
              {/* ========================================================================= */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: currentTheme.primary, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  💬 Nhận xét của giáo viên:
                </div>
                <textarea 
                  value={invoiceModal.teacher_note}
                  onChange={e => setInvoiceModal((prev: any) => ({ ...prev, teacher_note: e.target.value }))}
                  placeholder="Nhập lời nhắn gửi phụ huynh..."
                  rows={invoiceModal.paperSize === 'A5' ? 2 : 3}
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

              {/* ========================================================================= */}
              {/* 6. THÔNG ĐIỆP CẢM ƠN ONLINE (HOÀN TOÀN BỎ CHỮ KÝ HÀNH CHÍNH) */}
              {/* ========================================================================= */}
              <div style={{ textAlign: 'center', paddingTop: '14px', borderTop: '1px dashed #d1d5db', color: '#6b7280', fontSize: '12px' }}>
                <div style={{ fontWeight: '500', color: currentTheme.primary, marginBottom: '2px' }}>
                  🌟 Cảm ơn Quý phụ huynh đã luôn đồng hành cùng các em trong suốt kỳ học!
                </div>
                <div>Phiếu học phí được tạo trực tuyến từ hệ thống quản lý học tập.</div>
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
