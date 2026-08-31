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

// 12 Distinct Templates Metadata
const TEMPLATES = [
  { id: 'classic', name: '🏛️ Classic', desc: 'Truyền thống, chỉn chu' },
  { id: 'modern', name: '✨ Modern', desc: 'Fintech SaaS, dải màu nổi' },
  { id: 'minimal', name: '🍃 Minimal', desc: 'Tối giản, typography' },
  { id: 'compact', name: '📄 Compact', desc: '2 cột tối ưu 1 trang A5/A4' },
  { id: 'receipt', name: '🧾 Receipt', desc: 'Biên lai kỹ thuật số POS' },
  { id: 'split', name: '🌗 Split', desc: 'Chia đôi Identity & Payment' },
  { id: 'timeline', name: '🛤️ Timeline', desc: 'Hành trình học tập timeline' },
  { id: 'dashboard', name: '📊 Dashboard', desc: 'Thẻ chỉ số & Analytics' },
  { id: 'soft', name: '🌸 Soft', desc: 'Tạp chí pastel mềm mại' },
  { id: 'education', name: '🎓 Education', desc: 'Báo cáo học vụ chuẩn mực' },
  { id: 'premium', name: '👑 Premium', desc: 'Hoàng gia, đối xứng sang trọng' },
  { id: 'friendly', name: '💛 Friendly', desc: 'Dễ hiểu, biểu tượng trực quan' }
];

const TuitionManager = () => {
  const [bills, setBills] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(moment().format('YYYY-MM'));
  const [stats, setStats] = useState({ totalExpected: 0, totalReceived: 0, totalPending: 0 });

  // Invoice Modal state (Ready for Assessments/Scores)
  const [invoiceModal, setInvoiceModal] = useState<any>({
    show: false,
    bill: null,
    sessions: [],
    availableAssessments: [],
    selectedAssessmentIds: [],
    showAssessmentPicker: false,
    assessmentSearch: '',
    teacher_note: '',
    template: 'classic',
    colorTheme: 'blue',
    customPrimaryColor: '',
    paperSize: 'A4'
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
        availableAssessments: res.data.available_assessments || [],
        selectedAssessmentIds: [],
        showAssessmentPicker: false,
        assessmentSearch: '',
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

  const handleToggleAssessment = (id: number) => {
    setInvoiceModal((prev: any) => {
      const current = prev.selectedAssessmentIds || [];
      const updated = current.includes(id) 
        ? current.filter((x: number) => x !== id)
        : [...current, id];
      return { ...prev, selectedAssessmentIds: updated };
    });
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

  // Session & Assessment Statistics for templates
  const sessions = invoiceModal.sessions || [];
  const totalSessions = sessions.length;
  const presentCount = sessions.filter((s: any) => s.status === 'PRESENT').length;
  const absentCount = sessions.filter((s: any) => s.status === 'ABSENT' || s.status === 'ABSENT_UNEXCUSED').length;
  const excusedCount = sessions.filter((s: any) => s.status === 'ABSENT_EXCUSED').length;
  const attRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

  // Selected assessments filtered
  const selectedAssessments = (invoiceModal.availableAssessments || []).filter((a: any) => 
    invoiceModal.selectedAssessmentIds?.includes(a.id)
  );
  const hasAssessments = selectedAssessments.length > 0;

  // QR Code URL (No fixed amount encoded, allowing banking apps to accept custom/free amount entry)
  const qrUrl = invoiceModal.bill 
    ? `https://img.vietqr.io/image/VCB-1034244823-compact2.png?addInfo=HP%20${encodeURIComponent(invoiceModal.bill.full_name || '')}%20T${moment(invoiceModal.bill.start_date).format('MM')}` 
    : '';

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
                        <Badge variant="success">🟢 ĐÃ THU</Badge>
                      ) : (
                        <Badge variant="warning">⏳ CHỜ THU</Badge>
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
              </div>

              {/* Ghi chú */}
              <Input 
                label="Ghi chú phiếu thu (Tùy chọn)" 
                placeholder="VD: Học phí tháng 9..." 
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
                    Học phí: {(Number(previewData.total_amount) || 0).toLocaleString('vi-VN')} đ
                  </div>
                  
                  <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontStyle: 'italic', marginBottom: '10px' }}>
                    Bằng chữ: {numberToVietnameseWords(Number(previewData.total_amount) || 0)}
                  </div>

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

      {/* Modal Preview & In Phiếu Học Phí Đầy Đủ (12 Templates + Assessment Integration Ready + QR No-Lock) */}
      {invoiceModal.show && invoiceModal.bill && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--spacing-4)', backdropFilter: 'blur(6px)' }}>
          <Card style={{ width: '100%', maxWidth: '1020px', maxHeight: '95vh', overflowY: 'auto', padding: 'var(--spacing-6)', display: 'flex', flexDirection: 'column' }}>
            
            {/* THANH ĐIỀU KHIỂN INVOICE (NO-PRINT) */}
            <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: 'var(--spacing-5)', paddingBottom: 'var(--spacing-4)', borderBottom: '1px solid var(--color-border)' }}>
              
              {/* Hàng 1: GALLERY 12 MẪU THIẾT KẾ ĐỘC ĐÁO */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    🎨 Chọn Phong Cách Thiết Kế (12 Templates):
                  </div>
                  <span style={{ fontSize: '12px', color: currentTheme.primary, fontWeight: 'bold' }}>
                    Mẫu đang chọn: {TEMPLATES.find(t => t.id === invoiceModal.template)?.name}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '8px' }}>
                  {TEMPLATES.map(tmpl => {
                    const isSelected = invoiceModal.template === tmpl.id;
                    return (
                      <button
                        key={tmpl.id}
                        onClick={() => setInvoiceModal((prev: any) => ({ ...prev, template: tmpl.id }))}
                        style={{
                          padding: '8px 8px',
                          borderRadius: '8px',
                          border: isSelected ? `2px solid ${currentTheme.primary}` : '1px solid var(--color-border)',
                          backgroundColor: isSelected ? currentTheme.lightBg : 'var(--color-surface)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ fontWeight: 'bold', fontSize: '13px', color: isSelected ? currentTheme.primary : 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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

              {/* Hàng 2: BỘ 12 MÀU + CUSTOM COLOR PICKER + ASSESSMENT PICKER TOGGLE + KHỔ GIẤY A4/A5 */}
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

                {/* Controls: Assessment Picker + Khổ giấy A4 / A5 + Thao tác */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  
                  {/* Toggle Assessment Picker */}
                  <Button 
                    variant={invoiceModal.showAssessmentPicker ? "primary" : "outline"} 
                    size="sm"
                    onClick={() => setInvoiceModal((prev: any) => ({ ...prev, showAssessmentPicker: !prev.showAssessmentPicker }))}
                  >
                    📊 Kết quả đánh giá ({invoiceModal.selectedAssessmentIds?.length || 0})
                  </Button>

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
                  <Button onClick={() => setInvoiceModal({ show: false, bill: null, sessions: [], availableAssessments: [], selectedAssessmentIds: [], showAssessmentPicker: false, teacher_note: '', template: 'classic', colorTheme: 'blue', customPrimaryColor: '', paperSize: 'A4' })} variant="ghost" size="sm">
                    Đóng
                  </Button>
                </div>
              </div>

              {/* DRAWER: CHỌN ĐIỂM/BÀI ĐÁNH GIÁ Muốn Hiển Thị (NO-PRINT) */}
              {invoiceModal.showAssessmentPicker && (
                <div style={{ backgroundColor: 'var(--color-background)', padding: '14px', borderRadius: '8px', border: '1px solid var(--color-border)', marginTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-text)' }}>
                      📊 Chọn bài kiểm tra/đánh giá muốn hiển thị trên phiếu (Chỉ trong kỳ: {new Date(invoiceModal.bill.start_date).toLocaleDateString('vi-VN')} — {new Date(invoiceModal.bill.end_date).toLocaleDateString('vi-VN')}):
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      Đã chọn: <strong>{invoiceModal.selectedAssessmentIds?.length || 0}</strong> bài
                    </span>
                  </div>

                  {(!invoiceModal.availableAssessments || invoiceModal.availableAssessments.length === 0) ? (
                    <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontStyle: 'italic', padding: '8px 0' }}>
                      ℹ️ Không có bài kiểm tra nào của học sinh được ghi nhận trong kỳ học này.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                      {invoiceModal.availableAssessments.map((item: any) => {
                        const isChecked = invoiceModal.selectedAssessmentIds?.includes(item.id);
                        return (
                          <label 
                            key={item.id}
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '8px', 
                              padding: '6px 10px', 
                              borderRadius: '6px', 
                              backgroundColor: isChecked ? currentTheme.lightBg : 'var(--color-surface)',
                              border: isChecked ? `1px solid ${currentTheme.primary}` : '1px solid var(--color-border)',
                              cursor: 'pointer',
                              fontSize: '13px'
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={isChecked} 
                              onChange={() => handleToggleAssessment(item.id)}
                            />
                            <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <span style={{ fontWeight: '500' }}>{moment(item.assessment_date).format('DD/MM')}</span> — <span>{item.title}</span>
                            </div>
                            <span style={{ fontWeight: 'bold', color: currentTheme.primary }}>
                              {item.score !== undefined ? `${item.score}đ` : '---'}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* ========================================================================= */}
            {/* KHU VỰC IN PHIẾU THỰC SỰ - 12 TEMPLATES CÓ LAYOUT KIẾN TRÚC HOÀN TOÀN KHÁC BIỆT */}
            {/* ========================================================================= */}
            <div 
              id="invoice-print-area" 
              className={`template-${invoiceModal.template} size-${invoiceModal.paperSize}`}
              style={{
                fontFamily: (invoiceModal.template === 'classic' || invoiceModal.template === 'education' || invoiceModal.template === 'premium') 
                  ? '"Times New Roman", Times, Georgia, serif' 
                  : (invoiceModal.template === 'receipt')
                  ? '"Courier New", Courier, monospace'
                  : 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                color: '#111827',
                backgroundColor: '#ffffff',
                padding: invoiceModal.paperSize === 'A5' ? '14px' : '26px',
                borderRadius: (invoiceModal.template === 'modern' || invoiceModal.template === 'dashboard' || invoiceModal.template === 'friendly') ? '12px' : invoiceModal.template === 'soft' ? '18px' : '0',
                border: invoiceModal.template === 'classic' 
                  ? `2px solid ${currentTheme.primary}` 
                  : invoiceModal.template === 'premium'
                  ? `2px double ${currentTheme.primary}`
                  : invoiceModal.template === 'receipt'
                  ? `1px dashed #9ca3af`
                  : 'none',
                boxShadow: (invoiceModal.template === 'modern' || invoiceModal.template === 'soft' || invoiceModal.template === 'dashboard') ? '0 4px 16px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              
              {/* ------------------------------------------------------------------------- */}
              {/* 01. TEMPLATE CLASSIC — Truyền thống, chỉn chu, bảng phân dòng */}
              {/* ------------------------------------------------------------------------- */}
              {invoiceModal.template === 'classic' && (
                <div>
                  <div style={{ textAlign: 'center', borderBottom: `2px solid ${currentTheme.primary}`, paddingBottom: '12px', marginBottom: '18px' }}>
                    <h1 style={{ margin: '0 0 4px 0', color: currentTheme.primary, fontSize: invoiceModal.paperSize === 'A5' ? '20px' : '24px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      PHIẾU HỌC PHÍ
                    </h1>
                    <p style={{ margin: 0, color: '#4b5563', fontSize: '13px' }}>
                      Kỳ thu: <strong>{new Date(invoiceModal.bill.start_date).toLocaleDateString('vi-VN')}</strong> đến <strong>{new Date(invoiceModal.bill.end_date).toLocaleDateString('vi-VN')}</strong> • Mã phiếu: #{invoiceModal.bill.id}
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: invoiceModal.paperSize === 'A5' ? '1fr 120px' : '1fr 160px', gap: '16px', marginBottom: '18px', backgroundColor: currentTheme.lightBg, padding: '12px 16px', borderRadius: '6px', border: `1px solid ${currentTheme.secondary}25`, alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ fontSize: '15px' }}>Học sinh: <strong style={{ color: currentTheme.text, fontSize: '17px' }}>{invoiceModal.bill.full_name}</strong></div>
                      <div style={{ fontSize: '13px', color: '#4b5563' }}>Lớp học: <strong>{invoiceModal.bill.class_name || 'Lớp học'}</strong></div>
                      <div style={{ fontSize: '13px', color: '#4b5563' }}>Số điện thoại: <strong>{invoiceModal.bill.phone_number || '---'}</strong></div>
                      {invoiceModal.bill.teacher_name && <div style={{ fontSize: '13px', color: '#4b5563' }}>Giáo viên: <strong>{invoiceModal.bill.teacher_name}</strong></div>}
                    </div>
                    <div style={{ textAlign: 'center', backgroundColor: '#ffffff', padding: '6px', borderRadius: '6px', border: `1px solid ${currentTheme.secondary}35` }}>
                      <img src={qrUrl} alt="QR VCB" style={{ width: '100%', maxWidth: invoiceModal.paperSize === 'A5' ? '108px' : '148px', aspectRatio: '1/1', objectFit: 'contain', display: 'block' }} />
                      <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '3px' }}>VCB • 1034244823</div>
                    </div>
                  </div>

                  {/* Table Buổi học */}
                  <div style={{ marginBottom: '18px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '6px', color: currentTheme.primary, textTransform: 'uppercase' }}>Danh sách các buổi học ({totalSessions} buổi):</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: invoiceModal.paperSize === 'A5' ? '12px' : '13px' }}>
                      <thead>
                        <tr style={{ backgroundColor: currentTheme.lightBg, borderBottom: `2px solid ${currentTheme.primary}` }}>
                          <th style={{ padding: '8px 10px', width: '85px' }}>Ngày</th>
                          <th style={{ padding: '8px 10px', width: '110px' }}>Trạng thái</th>
                          <th style={{ padding: '8px 10px' }}>Nội dung bài học / Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessions.map((s: any, idx: number) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                            <td style={{ padding: '8px 10px', fontWeight: '500' }}>{new Date(s.session_date).toLocaleDateString('vi-VN')}</td>
                            <td style={{ padding: '8px 10px' }}>
                              {s.status === 'PRESENT' && <span style={{ color: '#059669', fontWeight: 'bold' }}>🟢 Có mặt</span>}
                              {s.status === 'ABSENT_EXCUSED' && <span style={{ color: '#d97706', fontWeight: 'bold' }}>🟡 Vắng phép</span>}
                              {(s.status === 'ABSENT' || s.status === 'ABSENT_UNEXCUSED') && <span style={{ color: '#dc2626', fontWeight: 'bold' }}>🔴 Vắng K/P</span>}
                              {!s.status && <span style={{ color: '#6b7280' }}>⚪ Chưa điểm danh</span>}
                            </td>
                            <td style={{ padding: '8px 10px' }}>{s.status === 'PRESENT' ? (s.content || 'Buổi học theo lộ trình') : (s.absent_reason ? `Lý do: ${s.absent_reason}` : 'Nghỉ học')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Optional Assessment Section */}
                  {hasAssessments && (
                    <div style={{ marginBottom: '18px', backgroundColor: '#fcfcfc', padding: '12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '6px', color: currentTheme.primary, textTransform: 'uppercase' }}>📊 KẾT QUẢ ĐÁNH GIÁ:</div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                        <tbody>
                          {selectedAssessments.map((a: any, idx: number) => (
                            <tr key={idx} style={{ borderBottom: '1px dashed #e5e7eb' }}>
                              <td style={{ padding: '6px 8px', width: '85px', color: '#6b7280' }}>{moment(a.assessment_date).format('DD/MM/YYYY')}</td>
                              <td style={{ padding: '6px 8px', fontWeight: '500' }}>{a.title}</td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold', color: currentTheme.primary }}>{a.score} điểm</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Total */}
                  <div style={{ backgroundColor: currentTheme.lightBg, padding: '12px 16px', borderRadius: '6px', border: `1px solid ${currentTheme.secondary}35`, marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#4b5563', textTransform: 'uppercase' }}>Học phí:</div>
                      <div style={{ fontSize: '13px', color: currentTheme.text, fontStyle: 'italic' }}>Bằng chữ: <strong>{numberToVietnameseWords(Number(invoiceModal.bill.total_amount) || 0)}</strong></div>
                    </div>
                    <div style={{ fontSize: invoiceModal.paperSize === 'A5' ? '18px' : '22px', fontWeight: 'bold', color: currentTheme.primary }}>
                      {Number(invoiceModal.bill.total_amount).toLocaleString('vi-VN')} ₫
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------------------- */}
              {/* 02. TEMPLATE MODERN — Fintech SaaS, Hero Header, Cards & Badges */}
              {/* ------------------------------------------------------------------------- */}
              {invoiceModal.template === 'modern' && (
                <div>
                  <div style={{ backgroundColor: currentTheme.primary, color: '#ffffff', padding: '18px 22px', borderRadius: '10px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px' }}>THÔNG BÁO HỌC PHÍ</span>
                      <h1 style={{ margin: '6px 0 2px 0', fontSize: '24px', fontWeight: 'bold' }}>{invoiceModal.bill.full_name}</h1>
                      <div style={{ fontSize: '13px', opacity: 0.9 }}>Lớp: <strong>{invoiceModal.bill.class_name}</strong> • Kỳ: {new Date(invoiceModal.bill.start_date).toLocaleDateString('vi-VN')} — {new Date(invoiceModal.bill.end_date).toLocaleDateString('vi-VN')}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', opacity: 0.85 }}>Mã phiếu: #{invoiceModal.bill.id}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: invoiceModal.paperSize === 'A5' ? '1fr 130px' : '1fr 180px', gap: '16px', marginBottom: '20px' }}>
                    {/* Highlight Box */}
                    <div style={{ backgroundColor: currentTheme.lightBg, padding: '18px', borderRadius: '10px', border: `1px solid ${currentTheme.secondary}20`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', fontWeight: 'bold' }}>HỌC PHÍ</div>
                        <div style={{ fontSize: invoiceModal.paperSize === 'A5' ? '24px' : '30px', fontWeight: '800', color: currentTheme.primary, margin: '4px 0' }}>
                          {Number(invoiceModal.bill.total_amount).toLocaleString('vi-VN')} ₫
                        </div>
                        <div style={{ fontSize: '13px', color: '#4b5563', fontStyle: 'italic' }}>
                          Bằng chữ: {numberToVietnameseWords(Number(invoiceModal.bill.total_amount) || 0)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '12px', fontSize: '12px', color: '#4b5563' }}>
                        <span>📚 Tổng: <strong>{totalSessions} buổi</strong></span>
                        <span>✅ Có mặt: <strong style={{ color: '#059669' }}>{presentCount} buổi</strong></span>
                        {absentCount > 0 && <span>❌ Vắng: <strong style={{ color: '#dc2626' }}>{absentCount}</strong></span>}
                      </div>
                    </div>

                    {/* QR Payment Card */}
                    <div style={{ backgroundColor: '#ffffff', padding: '10px', borderRadius: '10px', border: `1px solid ${currentTheme.secondary}30`, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                      <img src={qrUrl} alt="QR VCB" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'contain', display: 'block' }} />
                      <div style={{ fontSize: '11px', fontWeight: 'bold', color: currentTheme.primary, marginTop: '4px' }}>VIETCOMBANK</div>
                      <div style={{ fontSize: '10px', color: '#6b7280' }}>1034244823</div>
                    </div>
                  </div>

                  {/* Modern Table */}
                  <div style={{ marginBottom: '20px' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 6px', fontSize: invoiceModal.paperSize === 'A5' ? '12px' : '13px' }}>
                      <thead>
                        <tr style={{ color: '#6b7280', fontSize: '11px', textTransform: 'uppercase' }}>
                          <th style={{ padding: '6px 12px', textAlign: 'left' }}>Ngày</th>
                          <th style={{ padding: '6px 12px', textAlign: 'left' }}>Trạng thái</th>
                          <th style={{ padding: '6px 12px', textAlign: 'left' }}>Nội dung bài học</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessions.map((s: any, idx: number) => (
                          <tr key={idx} style={{ backgroundColor: s.status === 'PRESENT' ? '#ffffff' : '#fef2f2', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                            <td style={{ padding: '10px 12px', borderTopLeftRadius: '6px', borderBottomLeftRadius: '6px', fontWeight: 'bold' }}>{new Date(s.session_date).toLocaleDateString('vi-VN')}</td>
                            <td style={{ padding: '10px 12px' }}>
                              <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', backgroundColor: s.status === 'PRESENT' ? '#dcfce7' : '#fee2e2', color: s.status === 'PRESENT' ? '#166534' : '#991b1b' }}>
                                {s.status === 'PRESENT' ? 'Có mặt' : (s.absent_reason ? `Vắng (${s.absent_reason})` : 'Vắng mặt')}
                              </span>
                            </td>
                            <td style={{ padding: '10px 12px', borderTopRightRadius: '6px', borderBottomRightRadius: '6px', color: s.status === 'PRESENT' ? '#111827' : '#b91c1c' }}>
                              {s.status === 'PRESENT' ? (s.content || 'Buổi học theo lộ trình') : (s.absent_reason ? `Lý do nghỉ: ${s.absent_reason}` : 'Nghỉ học')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Optional Assessment Modern */}
                  {hasAssessments && (
                    <div style={{ marginBottom: '20px', backgroundColor: '#ffffff', padding: '14px', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: currentTheme.primary, textTransform: 'uppercase', marginBottom: '8px' }}>📊 KẾT QUẢ ĐÁNH GIÁ:</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                        {selectedAssessments.map((a: any, idx: number) => (
                          <div key={idx} style={{ padding: '8px 12px', backgroundColor: currentTheme.lightBg, borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{a.title}</div>
                              <div style={{ fontSize: '10px', color: '#6b7280' }}>{moment(a.assessment_date).format('DD/MM/YYYY')}</div>
                            </div>
                            <span style={{ fontSize: '15px', fontWeight: '800', color: currentTheme.primary }}>{a.score}đ</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------------------------------------------------------- */}
              {/* 03. TEMPLATE MINIMAL — Editorial Clean, Không Viền Nặng, Typography */}
              {/* ------------------------------------------------------------------------- */}
              {invoiceModal.template === 'minimal' && (
                <div>
                  <div style={{ borderBottom: `1px solid #111827`, paddingBottom: '14px', marginBottom: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#6b7280', marginBottom: '4px' }}>STATEMENT OF TUITION</div>
                      <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '300', letterSpacing: '1px', color: '#111827' }}>THÔNG TIN HỌC PHÍ</h1>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '12px', color: '#6b7280' }}>
                      <div>Mã: #{invoiceModal.bill.id}</div>
                      <div>{new Date(invoiceModal.bill.start_date).toLocaleDateString('vi-VN')} — {new Date(invoiceModal.bill.end_date).toLocaleDateString('vi-VN')}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                    <div>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#9ca3af' }}>HỌC VIÊN</div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginTop: '2px' }}>{invoiceModal.bill.full_name}</div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>Lớp: {invoiceModal.bill.class_name} • SĐT: {invoiceModal.bill.phone_number || '---'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#9ca3af' }}>HỌC PHÍ</div>
                      <div style={{ fontSize: '26px', fontWeight: 'bold', color: currentTheme.primary, marginTop: '2px' }}>
                        {Number(invoiceModal.bill.total_amount).toLocaleString('vi-VN')} ₫
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>{numberToVietnameseWords(Number(invoiceModal.bill.total_amount) || 0)}</div>
                    </div>
                  </div>

                  {/* Minimal Table */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ borderBottom: '1px solid #111827', paddingBottom: '6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
                      <span style={{ width: '80px' }}>NGÀY</span>
                      <span style={{ width: '100px' }}>TRẠNG THÁI</span>
                      <span style={{ flex: 1 }}>NỘI DUNG BUỔI HỌC</span>
                    </div>
                    {sessions.map((s: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6', fontSize: '13px' }}>
                        <span style={{ width: '80px', fontWeight: '500' }}>{new Date(s.session_date).toLocaleDateString('vi-VN')}</span>
                        <span style={{ width: '100px', color: s.status === 'PRESENT' ? '#059669' : '#dc2626', fontWeight: '500' }}>
                          {s.status === 'PRESENT' ? 'Có mặt' : (s.absent_reason ? `Vắng (${s.absent_reason})` : 'Vắng mặt')}
                        </span>
                        <span style={{ flex: 1, color: '#4b5563' }}>{s.content || (s.status === 'PRESENT' ? 'Học theo chương trình' : 'Nghỉ học')}</span>
                      </div>
                    ))}
                  </div>

                  {/* Optional Assessment Minimal */}
                  {hasAssessments && (
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', marginBottom: '8px' }}>KẾT QUẢ ĐÁNH GIÁ</div>
                      {selectedAssessments.map((a: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
                          <span>{moment(a.assessment_date).format('DD/MM/YYYY')} — {a.title}</span>
                          <span style={{ fontWeight: 'bold', color: currentTheme.primary }}>{a.score} điểm</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Minimal QR Area */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #111827', paddingTop: '16px', marginBottom: '18px' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      <div>Ngân hàng: <strong>Vietcombank (VCB)</strong></div>
                      <div>Số tài khoản: <strong>1034244823</strong></div>
                    </div>
                    <img src={qrUrl} alt="QR VCB" style={{ width: '90px', height: '90px', objectFit: 'contain' }} />
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------------------- */}
              {/* 04. TEMPLATE COMPACT — 2 Cột Tiện Ích Tối Ưu Cho Khổ A5 / A4 Tiết Kiệm */}
              {/* ------------------------------------------------------------------------- */}
              {invoiceModal.template === 'compact' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${currentTheme.primary}`, paddingBottom: '8px', marginBottom: '14px' }}>
                    <div>
                      <h2 style={{ margin: 0, color: currentTheme.primary, fontSize: '18px', textTransform: 'uppercase' }}>PHIẾU HỌC PHÍ #{invoiceModal.bill.id}</h2>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Kỳ: {new Date(invoiceModal.bill.start_date).toLocaleDateString('vi-VN')} — {new Date(invoiceModal.bill.end_date).toLocaleDateString('vi-VN')}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 170px', gap: '14px', marginBottom: '14px' }}>
                    {/* Cột trái: Bảng buổi học */}
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: currentTheme.primary, marginBottom: '6px' }}>
                        📋 CHI TIẾT BUỔI HỌC ({totalSessions} buổi):
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                        <thead>
                          <tr style={{ backgroundColor: currentTheme.lightBg, borderBottom: `1px solid ${currentTheme.primary}` }}>
                            <th style={{ padding: '5px 6px', textAlign: 'left' }}>Ngày</th>
                            <th style={{ padding: '5px 6px', textAlign: 'left' }}>Đ/D</th>
                            <th style={{ padding: '5px 6px', textAlign: 'left' }}>Nội dung</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sessions.map((s: any, idx: number) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                              <td style={{ padding: '5px 6px', fontWeight: '500' }}>{new Date(s.session_date).toLocaleDateString('vi-VN')}</td>
                              <td style={{ padding: '5px 6px', color: s.status === 'PRESENT' ? '#059669' : '#dc2626', fontWeight: 'bold' }}>
                                {s.status === 'PRESENT' ? 'Có' : 'Vắng'}
                              </td>
                              <td style={{ padding: '5px 6px', color: '#4b5563', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
                                {s.content || (s.status === 'PRESENT' ? 'Học theo lộ trình' : (s.absent_reason || 'Nghỉ'))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Optional Assessment Compact */}
                      {hasAssessments && (
                        <div style={{ marginTop: '10px', fontSize: '11.5px', borderTop: '1px dashed #d1d5db', paddingTop: '6px' }}>
                          <div style={{ fontWeight: 'bold', color: currentTheme.primary, marginBottom: '4px' }}>📊 KẾT QUẢ ĐÁNH GIÁ:</div>
                          {selectedAssessments.map((a: any, idx: number) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                              <span>{moment(a.assessment_date).format('DD/MM')} - {a.title}</span>
                              <span style={{ fontWeight: 'bold', color: currentTheme.primary }}>{a.score}đ</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Cột phải: Thông tin & QR & Tổng tiền */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ backgroundColor: currentTheme.lightBg, padding: '10px', borderRadius: '6px', fontSize: '12px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '14px', color: currentTheme.text }}>{invoiceModal.bill.full_name}</div>
                        <div style={{ color: '#4b5563' }}>Lớp: {invoiceModal.bill.class_name}</div>
                        <div style={{ color: '#059669', fontWeight: 'bold', marginTop: '4px' }}>Có mặt: {presentCount}/{totalSessions} buổi</div>
                      </div>

                      <div style={{ backgroundColor: '#ffffff', padding: '6px', borderRadius: '6px', border: `1px solid ${currentTheme.secondary}30`, textAlign: 'center' }}>
                        <img src={qrUrl} alt="QR VCB" style={{ width: '100%', maxWidth: '140px', aspectRatio: '1/1', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
                        <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '3px' }}>VCB • 1034244823</div>
                      </div>

                      <div style={{ backgroundColor: currentTheme.primary, color: '#ffffff', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', opacity: 0.9 }}>HỌC PHÍ:</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{Number(invoiceModal.bill.total_amount).toLocaleString('vi-VN')} ₫</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------------------- */}
              {/* 05. TEMPLATE RECEIPT — Biên Lai Thanh Toán POS/Docket Dọc */}
              {/* ------------------------------------------------------------------------- */}
              {invoiceModal.template === 'receipt' && (
                <div style={{ maxWidth: '480px', margin: '0 auto', padding: '16px', border: '1px dashed #6b7280', backgroundColor: '#fffdfa' }}>
                  <div style={{ textAlign: 'center', borderBottom: '1px dashed #6b7280', paddingBottom: '12px', marginBottom: '14px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '2px' }}>*** BIÊN LAI HỌC PHÍ ***</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>Mã số: #{invoiceModal.bill.id} • Ngày lập: {moment(invoiceModal.bill.created_at).format('DD/MM/YYYY')}</div>
                  </div>

                  <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '14px', borderBottom: '1px dashed #6b7280', paddingBottom: '10px' }}>
                    <div>HỌC SINH: <strong>{invoiceModal.bill.full_name}</strong></div>
                    <div>LỚP HỌC: <strong>{invoiceModal.bill.class_name}</strong></div>
                    <div>KỲ THU: {new Date(invoiceModal.bill.start_date).toLocaleDateString('vi-VN')} — {new Date(invoiceModal.bill.end_date).toLocaleDateString('vi-VN')}</div>
                  </div>

                  <div style={{ marginBottom: '14px', borderBottom: '1px dashed #6b7280', paddingBottom: '10px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>CHI TIẾT CÁC BUỔI HỌC:</div>
                    {sessions.map((s: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '3px 0' }}>
                        <span>{new Date(s.session_date).toLocaleDateString('vi-VN')} - {s.status === 'PRESENT' ? 'Có mặt' : 'Vắng'}</span>
                        <span>{s.status === 'PRESENT' ? `${Number(invoiceModal.bill.tuition_fee || (invoiceModal.bill.total_amount / (presentCount || 1))).toLocaleString('vi-VN')} đ` : '0 đ'}</span>
                      </div>
                    ))}
                  </div>

                  {/* Optional Assessment Receipt */}
                  {hasAssessments && (
                    <div style={{ marginBottom: '14px', borderBottom: '1px dashed #6b7280', paddingBottom: '10px', fontSize: '12px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>KẾT QUẢ ĐÁNH GIÁ:</div>
                      {selectedAssessments.map((a: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                          <span>{moment(a.assessment_date).format('DD/MM')} {a.title}</span>
                          <span>{a.score}đ</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ marginBottom: '16px', borderBottom: '2px dashed #000', paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 'bold' }}>
                      <span>HỌC PHÍ:</span>
                      <span>{Number(invoiceModal.bill.total_amount).toLocaleString('vi-VN')} ₫</span>
                    </div>
                    <div style={{ fontSize: '12px', fontStyle: 'italic', marginTop: '4px', textAlign: 'right' }}>
                      ({numberToVietnameseWords(Number(invoiceModal.bill.total_amount) || 0)})
                    </div>
                  </div>

                  {/* QR in Receipt Center */}
                  <div style={{ textAlign: 'center', padding: '10px 0' }}>
                    <img src={qrUrl} alt="QR VCB" style={{ width: '130px', height: '130px', objectFit: 'contain', margin: '0 auto', display: 'block' }} />
                    <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '6px' }}>VIETCOMBANK: 1034244823</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>Quét mã để chuyển khoản học phí</div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------------------- */}
              {/* 06. TEMPLATE SPLIT — 50/50 Split Screen: Identity Left + Payment Right */}
              {/* ------------------------------------------------------------------------- */}
              {invoiceModal.template === 'split' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    {/* Left 50%: Identity & Student info */}
                    <div style={{ backgroundColor: currentTheme.lightBg, padding: '20px', borderRadius: '10px', border: `1px solid ${currentTheme.secondary}20`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ backgroundColor: currentTheme.primary, color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>THÔNG TIN HỌC PHÍ</span>
                        <h1 style={{ margin: '10px 0 4px 0', fontSize: '22px', color: currentTheme.text }}>{invoiceModal.bill.full_name}</h1>
                        <div style={{ fontSize: '14px', color: '#4b5563' }}>Lớp: <strong>{invoiceModal.bill.class_name}</strong></div>
                        <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>SĐT: {invoiceModal.bill.phone_number || '---'}</div>
                      </div>
                      <div style={{ marginTop: '16px', borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '10px', fontSize: '12px', color: '#6b7280' }}>
                        <div>Kỳ học: {new Date(invoiceModal.bill.start_date).toLocaleDateString('vi-VN')} — {new Date(invoiceModal.bill.end_date).toLocaleDateString('vi-VN')}</div>
                        <div>Chuyên cần: <strong style={{ color: '#059669' }}>{presentCount}/{totalSessions} buổi ({attRate}%)</strong></div>
                      </div>
                    </div>

                    {/* Right 50%: Payment & QR code */}
                    <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: `2px solid ${currentTheme.primary}`, display: 'flex', alignItems: 'center', gap: '14px', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#6b7280', fontWeight: 'bold' }}>HỌC PHÍ</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: currentTheme.primary, margin: '4px 0' }}>
                          {Number(invoiceModal.bill.total_amount).toLocaleString('vi-VN')} ₫
                        </div>
                        <div style={{ fontSize: '11px', color: '#4b5563', fontStyle: 'italic', marginBottom: '8px' }}>
                          {numberToVietnameseWords(Number(invoiceModal.bill.total_amount) || 0)}
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1f2937' }}>VCB • 1034244823</div>
                      </div>
                      <img src={qrUrl} alt="QR VCB" style={{ width: '110px', height: '110px', objectFit: 'contain' }} />
                    </div>
                  </div>

                  {/* Sessions table below */}
                  <div style={{ marginBottom: '18px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '13px', color: currentTheme.primary, marginBottom: '8px', textTransform: 'uppercase' }}>Danh sách các buổi học:</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: invoiceModal.paperSize === 'A5' ? '12px' : '13px' }}>
                      <thead>
                        <tr style={{ backgroundColor: currentTheme.lightBg, borderBottom: `2px solid ${currentTheme.primary}` }}>
                          <th style={{ padding: '8px 10px', width: '85px' }}>Ngày</th>
                          <th style={{ padding: '8px 10px', width: '110px' }}>Trạng thái</th>
                          <th style={{ padding: '8px 10px' }}>Nội dung bài học</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessions.map((s: any, idx: number) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '8px 10px', fontWeight: '500' }}>{new Date(s.session_date).toLocaleDateString('vi-VN')}</td>
                            <td style={{ padding: '8px 10px', color: s.status === 'PRESENT' ? '#059669' : '#dc2626', fontWeight: 'bold' }}>
                              {s.status === 'PRESENT' ? '🟢 Có mặt' : '🔴 Vắng mặt'}
                            </td>
                            <td style={{ padding: '8px 10px', color: '#4b5563' }}>{s.content || 'Buổi học theo lộ trình'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Optional Assessment Split */}
                  {hasAssessments && (
                    <div style={{ marginBottom: '18px', backgroundColor: '#f9fafb', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: currentTheme.primary, textTransform: 'uppercase', marginBottom: '6px' }}>📊 KẾT QUẢ ĐÁNH GIÁ:</div>
                      {selectedAssessments.map((a: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px' }}>
                          <span>{moment(a.assessment_date).format('DD/MM/YYYY')} — {a.title}</span>
                          <span style={{ fontWeight: 'bold', color: currentTheme.primary }}>{a.score}đ</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------------------------------------------------------- */}
              {/* 07. TEMPLATE TIMELINE — Hành Trình Học Tập (Learning Journey) */}
              {/* ------------------------------------------------------------------------- */}
              {invoiceModal.template === 'timeline' && (
                <div>
                  <div style={{ borderBottom: `2px solid ${currentTheme.primary}`, paddingBottom: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h1 style={{ margin: '0 0 2px 0', fontSize: '22px', color: currentTheme.primary }}>🛤️ HÀNH TRÌNH HỌC TẬP & HỌC PHÍ</h1>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>Học sinh: <strong>{invoiceModal.bill.full_name}</strong> • Lớp: <strong>{invoiceModal.bill.class_name}</strong></div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '12px' }}>
                      <div style={{ color: '#059669', fontWeight: 'bold' }}>{presentCount}/{totalSessions} buổi hoàn thành</div>
                      <div style={{ color: '#6b7280' }}>Kỳ: {new Date(invoiceModal.bill.start_date).toLocaleDateString('vi-VN')} — {new Date(invoiceModal.bill.end_date).toLocaleDateString('vi-VN')}</div>
                    </div>
                  </div>

                  {/* Vertical Timeline Nodes */}
                  <div style={{ position: 'relative', paddingLeft: '24px', marginBottom: '20px', borderLeft: `2px solid ${currentTheme.primary}40` }}>
                    {sessions.map((s: any, idx: number) => {
                      const isPresent = s.status === 'PRESENT';
                      return (
                        <div key={idx} style={{ position: 'relative', marginBottom: '14px', paddingBottom: '4px' }}>
                          {/* Dot milestone */}
                          <div style={{ position: 'absolute', left: '-31px', top: '2px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: isPresent ? '#059669' : '#dc2626', border: '2px solid #fff' }} />
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', fontSize: '13px' }}>
                            <strong style={{ width: '85px', color: '#1f2937' }}>{new Date(s.session_date).toLocaleDateString('vi-VN')}</strong>
                            <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', backgroundColor: isPresent ? '#dcfce7' : '#fee2e2', color: isPresent ? '#166534' : '#991b1b' }}>
                              {isPresent ? 'Có mặt' : 'Vắng'}
                            </span>
                            <span style={{ color: '#4b5563', flex: 1 }}>{s.content || (isPresent ? 'Buổi học theo chương trình' : (s.absent_reason ? `Lý do: ${s.absent_reason}` : 'Nghỉ học'))}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Optional Assessment Timeline */}
                  {hasAssessments && (
                    <div style={{ marginBottom: '20px', padding: '12px 16px', backgroundColor: '#fdfdfd', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: currentTheme.primary, textTransform: 'uppercase', marginBottom: '6px' }}>📊 KẾT QUẢ ĐÁNH GIÁ:</div>
                      {selectedAssessments.map((a: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '13px' }}>
                          <span>{moment(a.assessment_date).format('DD/MM/YYYY')} — {a.title}</span>
                          <span style={{ fontWeight: 'bold', color: currentTheme.primary }}>{a.score}đ</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Timeline Summary Box */}
                  <div style={{ backgroundColor: currentTheme.lightBg, padding: '16px 20px', borderRadius: '10px', border: `1px solid ${currentTheme.secondary}25`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280' }}>HỌC PHÍ KỲ NÀY:</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: currentTheme.primary }}>
                        {Number(invoiceModal.bill.total_amount).toLocaleString('vi-VN')} ₫
                      </div>
                      <div style={{ fontSize: '12px', color: '#4b5563', fontStyle: 'italic' }}>
                        Bằng chữ: {numberToVietnameseWords(Number(invoiceModal.bill.total_amount) || 0)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#fff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      <img src={qrUrl} alt="QR VCB" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
                      <div style={{ fontSize: '11px' }}>
                        <div style={{ fontWeight: 'bold', color: currentTheme.primary }}>VIETCOMBANK</div>
                        <div>1034244823</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------------------- */}
              {/* 08. TEMPLATE DASHBOARD — Analytics Mini Dashboard, Thẻ Chỉ Số */}
              {/* ------------------------------------------------------------------------- */}
              {invoiceModal.template === 'dashboard' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '20px', color: currentTheme.primary }}>📊 BẢNG TỔNG KẾT HỌC PHÍ & CHUYÊN CẦN</h2>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>Học viên: <strong>{invoiceModal.bill.full_name}</strong> • Lớp: <strong>{invoiceModal.bill.class_name}</strong></div>
                    </div>
                  </div>

                  {/* 4 Analytics Metric Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '18px' }}>
                    <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Tổng buổi</div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>{totalSessions}</div>
                    </div>
                    <div style={{ backgroundColor: '#ecfdf5', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px solid #a7f3d0' }}>
                      <div style={{ fontSize: '11px', color: '#047857', textTransform: 'uppercase' }}>Có mặt</div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#065f46' }}>{presentCount}</div>
                    </div>
                    <div style={{ backgroundColor: '#fef2f2', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px solid #fecaca' }}>
                      <div style={{ fontSize: '11px', color: '#b91c1c', textTransform: 'uppercase' }}>Vắng mặt</div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#991b1b' }}>{absentCount + excusedCount}</div>
                    </div>
                    <div style={{ backgroundColor: currentTheme.lightBg, padding: '10px', borderRadius: '8px', textAlign: 'center', border: `1px solid ${currentTheme.secondary}30` }}>
                      <div style={{ fontSize: '11px', color: currentTheme.primary, textTransform: 'uppercase' }}>Chuyên cần</div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: currentTheme.primary }}>{attRate}%</div>
                    </div>
                  </div>

                  {/* Dashboard Fee & QR Box */}
                  <div style={{ display: 'grid', gridTemplateColumns: invoiceModal.paperSize === 'A5' ? '1fr 120px' : '1fr 160px', gap: '14px', backgroundColor: currentTheme.lightBg, padding: '14px 18px', borderRadius: '8px', border: `1px solid ${currentTheme.secondary}25`, marginBottom: '18px', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280' }}>HỌC PHÍ KỲ NÀY:</div>
                      <div style={{ fontSize: invoiceModal.paperSize === 'A5' ? '22px' : '28px', fontWeight: 'bold', color: currentTheme.primary, margin: '4px 0' }}>
                        {Number(invoiceModal.bill.total_amount).toLocaleString('vi-VN')} ₫
                      </div>
                      <div style={{ fontSize: '12px', color: '#4b5563', fontStyle: 'italic' }}>
                        {numberToVietnameseWords(Number(invoiceModal.bill.total_amount) || 0)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', backgroundColor: '#ffffff', padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <img src={qrUrl} alt="QR VCB" style={{ width: '100%', maxWidth: '140px', aspectRatio: '1/1', objectFit: 'contain', display: 'block' }} />
                      <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '3px' }}>VCB • 1034244823</div>
                    </div>
                  </div>

                  {/* Optional Assessment Dashboard */}
                  {hasAssessments && (
                    <div style={{ marginBottom: '18px', backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: currentTheme.primary, textTransform: 'uppercase', marginBottom: '6px' }}>📊 KẾT QUẢ ĐÁNH GIÁ:</div>
                      {selectedAssessments.map((a: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px' }}>
                          <span>{moment(a.assessment_date).format('DD/MM/YYYY')} — {a.title}</span>
                          <span style={{ fontWeight: 'bold', color: currentTheme.primary }}>{a.score}đ</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------------------------------------------------------- */}
              {/* 09. TEMPLATE SOFT EDITORIAL — Tạp Chí Pastel, Bo Góc Mềm, Trực Quan */}
              {/* ------------------------------------------------------------------------- */}
              {invoiceModal.template === 'soft' && (
                <div>
                  <div style={{ backgroundColor: currentTheme.lightBg, padding: '18px 22px', borderRadius: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ backgroundColor: '#ffffff', color: currentTheme.primary, padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>PHIẾU HỌC PHÍ THÂN GỬI PHỤ HUYNH</span>
                      <h1 style={{ margin: '8px 0 2px 0', color: currentTheme.text, fontSize: '24px' }}>{invoiceModal.bill.full_name}</h1>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>Lớp: <strong>{invoiceModal.bill.class_name}</strong> • Kỳ: {new Date(invoiceModal.bill.start_date).toLocaleDateString('vi-VN')} — {new Date(invoiceModal.bill.end_date).toLocaleDateString('vi-VN')}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: invoiceModal.paperSize === 'A5' ? '1fr 125px' : '1fr 165px', gap: '16px', marginBottom: '20px', backgroundColor: '#fcfaf8', padding: '16px', borderRadius: '14px', border: '1px solid #f0eae4', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Học phí:</div>
                      <div style={{ fontSize: invoiceModal.paperSize === 'A5' ? '22px' : '26px', fontWeight: 'bold', color: currentTheme.primary, margin: '4px 0' }}>
                        {Number(invoiceModal.bill.total_amount).toLocaleString('vi-VN')} ₫
                      </div>
                      <div style={{ fontSize: '13px', color: '#4b5563', fontStyle: 'italic' }}>
                        Bằng chữ: <strong>{numberToVietnameseWords(Number(invoiceModal.bill.total_amount) || 0)}</strong>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', backgroundColor: '#ffffff', padding: '6px', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                      <img src={qrUrl} alt="QR VCB" style={{ width: '100%', maxWidth: '140px', aspectRatio: '1/1', objectFit: 'contain', display: 'block' }} />
                      <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '3px' }}>VCB • 1034244823</div>
                    </div>
                  </div>

                  {/* Sessions list */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '8px', color: currentTheme.primary, textTransform: 'uppercase' }}>Các buổi học trong kỳ:</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: invoiceModal.paperSize === 'A5' ? '12px' : '13px' }}>
                      <thead>
                        <tr style={{ backgroundColor: currentTheme.lightBg, borderBottom: `2px solid ${currentTheme.primary}` }}>
                          <th style={{ padding: '8px 10px', width: '85px' }}>Ngày</th>
                          <th style={{ padding: '8px 10px', width: '110px' }}>Trạng thái</th>
                          <th style={{ padding: '8px 10px' }}>Nội dung bài học</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessions.map((s: any, idx: number) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '8px 10px', fontWeight: '500' }}>{new Date(s.session_date).toLocaleDateString('vi-VN')}</td>
                            <td style={{ padding: '8px 10px', color: s.status === 'PRESENT' ? '#059669' : '#dc2626', fontWeight: 'bold' }}>
                              {s.status === 'PRESENT' ? '🟢 Có mặt' : '🔴 Vắng mặt'}
                            </td>
                            <td style={{ padding: '8px 10px', color: '#4b5563' }}>{s.content || 'Buổi học theo lộ trình'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Optional Assessment Soft */}
                  {hasAssessments && (
                    <div style={{ marginBottom: '20px', backgroundColor: '#fff', padding: '14px', borderRadius: '14px', border: '1px solid #f0eae4' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: currentTheme.primary, textTransform: 'uppercase', marginBottom: '8px' }}>🌸 KẾT QUẢ ĐÁNH GIÁ:</div>
                      {selectedAssessments.map((a: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px' }}>
                          <span>{moment(a.assessment_date).format('DD/MM/YYYY')} — {a.title}</span>
                          <span style={{ fontWeight: 'bold', color: currentTheme.primary }}>{a.score}đ</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------------------------------------------------------- */}
              {/* 10. TEMPLATE EDUCATION — Báo Cáo Học Vụ & Tiến Độ Chuẩn Mực */}
              {/* ------------------------------------------------------------------------- */}
              {invoiceModal.template === 'education' && (
                <div>
                  <div style={{ textAlign: 'center', borderBottom: `2px double ${currentTheme.primary}`, paddingBottom: '14px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: '#4b5563', fontWeight: 'bold' }}>TRUNG TÂM BỒI DƯỠNG KIẾN THỨC & LUYỆN THI</div>
                    <h1 style={{ margin: '6px 0', color: currentTheme.primary, fontSize: '24px' }}>PHIẾU THÔNG BÁO HỌC PHÍ ĐỊNH KỲ</h1>
                    <div style={{ fontSize: '13px', color: '#4b5563' }}>Kỳ thu: <strong>{new Date(invoiceModal.bill.start_date).toLocaleDateString('vi-VN')}</strong> đến <strong>{new Date(invoiceModal.bill.end_date).toLocaleDateString('vi-VN')}</strong> • Số hồ sơ: #{invoiceModal.bill.id}</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px', border: `1px solid ${currentTheme.secondary}30`, padding: '12px 16px', borderRadius: '4px' }}>
                    <div>
                      <div>Họ và tên học sinh: <strong>{invoiceModal.bill.full_name}</strong></div>
                      <div>Lớp học: <strong>{invoiceModal.bill.class_name}</strong></div>
                    </div>
                    <div>
                      <div>Số buổi đã học: <strong>{presentCount}/{totalSessions} buổi</strong></div>
                      <div>Tỷ lệ chuyên cần: <strong>{attRate}%</strong></div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: invoiceModal.paperSize === 'A5' ? '12px' : '13px', border: '1px solid #d1d5db' }}>
                      <thead>
                        <tr style={{ backgroundColor: currentTheme.lightBg, borderBottom: `1px solid #d1d5db` }}>
                          <th style={{ padding: '8px', border: '1px solid #d1d5db', width: '40px', textAlign: 'center' }}>STT</th>
                          <th style={{ padding: '8px', border: '1px solid #d1d5db', width: '85px' }}>Ngày học</th>
                          <th style={{ padding: '8px', border: '1px solid #d1d5db', width: '100px' }}>Chuyên cần</th>
                          <th style={{ padding: '8px', border: '1px solid #d1d5db' }}>Nội dung bài giảng / Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessions.map((s: any, idx: number) => (
                          <tr key={idx}>
                            <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center' }}>{idx + 1}</td>
                            <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>{new Date(s.session_date).toLocaleDateString('vi-VN')}</td>
                            <td style={{ padding: '8px', border: '1px solid #d1d5db', color: s.status === 'PRESENT' ? '#059669' : '#dc2626', fontWeight: 'bold' }}>
                              {s.status === 'PRESENT' ? 'Có mặt' : 'Vắng'}
                            </td>
                            <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>{s.content || (s.status === 'PRESENT' ? 'Hoàn thành bài học' : 'Nghỉ học')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Optional Assessment Education */}
                  {hasAssessments && (
                    <div style={{ marginBottom: '20px', border: '1px solid #d1d5db', padding: '12px 16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: currentTheme.primary, textTransform: 'uppercase', marginBottom: '8px' }}>🎓 KẾT QUẢ ĐÁNH GIÁ CHUYÊN MÔN:</div>
                      {selectedAssessments.map((a: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px' }}>
                          <span>{moment(a.assessment_date).format('DD/MM/YYYY')} — {a.title}</span>
                          <span style={{ fontWeight: 'bold', color: currentTheme.primary }}>{a.score} điểm</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: currentTheme.lightBg, padding: '14px 18px', border: `1px solid ${currentTheme.primary}40`, marginBottom: '18px' }}>
                    <div>
                      <div style={{ fontSize: '13px', textTransform: 'uppercase', color: '#374151' }}>Tổng học phí:</div>
                      <div style={{ fontSize: '22px', fontWeight: 'bold', color: currentTheme.primary }}>{Number(invoiceModal.bill.total_amount).toLocaleString('vi-VN')} ₫</div>
                      <div style={{ fontSize: '12px', fontStyle: 'italic' }}>({numberToVietnameseWords(Number(invoiceModal.bill.total_amount) || 0)})</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ fontSize: '11px', textAlign: 'right' }}>
                        <div>Vietcombank: <strong>1034244823</strong></div>
                      </div>
                      <img src={qrUrl} alt="QR VCB" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------------------- */}
              {/* 11. TEMPLATE PREMIUM — Hoàng Gia / Luxury, Đường Line Mạ Vàng Quý Phái */}
              {/* ------------------------------------------------------------------------- */}
              {invoiceModal.template === 'premium' && (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <div style={{ borderBottom: `1px solid ${currentTheme.primary}60`, paddingBottom: '16px', marginBottom: '22px' }}>
                    <div style={{ fontSize: '11px', letterSpacing: '4px', textTransform: 'uppercase', color: currentTheme.primary, fontWeight: 'bold', marginBottom: '6px' }}>LUXURY ACADEMY STATEMENT</div>
                    <h1 style={{ margin: '0 0 6px 0', color: currentTheme.primary, fontSize: '26px', fontWeight: 'normal', letterSpacing: '2px' }}>PHIẾU HỌC PHÍ</h1>
                    <div style={{ fontSize: '13px', color: '#6b7280', fontStyle: 'italic' }}>Kỳ thu: {new Date(invoiceModal.bill.start_date).toLocaleDateString('vi-VN')} — {new Date(invoiceModal.bill.end_date).toLocaleDateString('vi-VN')} • Mã phiếu: #{invoiceModal.bill.id}</div>
                  </div>

                  <div style={{ marginBottom: '22px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>{invoiceModal.bill.full_name}</div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '2px' }}>Lớp: <strong>{invoiceModal.bill.class_name}</strong></div>
                  </div>

                  {/* Centered Majestic Total */}
                  <div style={{ border: `1px solid ${currentTheme.primary}`, padding: '16px', maxWidth: '380px', margin: '0 auto 24px auto', borderRadius: '4px' }}>
                    <div style={{ fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', color: '#6b7280' }}>HỌC PHÍ</div>
                    <div style={{ fontSize: '30px', fontWeight: 'bold', color: currentTheme.primary, margin: '6px 0' }}>
                      {Number(invoiceModal.bill.total_amount).toLocaleString('vi-VN')} ₫
                    </div>
                    <div style={{ fontSize: '12px', color: '#4b5563', fontStyle: 'italic' }}>{numberToVietnameseWords(Number(invoiceModal.bill.total_amount) || 0)}</div>
                  </div>

                  {/* Sessions table */}
                  <div style={{ textAlign: 'left', marginBottom: '22px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${currentTheme.primary}`, color: currentTheme.primary }}>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>Ngày</th>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>Trạng thái</th>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>Nội dung bài học</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessions.map((s: any, idx: number) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '8px 10px', fontWeight: '500' }}>{new Date(s.session_date).toLocaleDateString('vi-VN')}</td>
                            <td style={{ padding: '8px 10px', color: s.status === 'PRESENT' ? '#059669' : '#dc2626' }}>{s.status === 'PRESENT' ? 'Có mặt' : 'Vắng mặt'}</td>
                            <td style={{ padding: '8px 10px', color: '#4b5563' }}>{s.content || 'Buổi học theo lộ trình'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Optional Assessment Premium */}
                  {hasAssessments && (
                    <div style={{ textAlign: 'left', marginBottom: '22px', border: `1px solid ${currentTheme.primary}40`, padding: '12px 16px', borderRadius: '4px' }}>
                      <div style={{ fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', color: currentTheme.primary, fontWeight: 'bold', marginBottom: '6px' }}>KẾT QUẢ ĐÁNH GIÁ:</div>
                      {selectedAssessments.map((a: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px' }}>
                          <span>{moment(a.assessment_date).format('DD/MM/YYYY')} — {a.title}</span>
                          <span style={{ fontWeight: 'bold', color: currentTheme.primary }}>{a.score}đ</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Centered QR */}
                  <div style={{ display: 'inline-block', padding: '10px', border: `1px solid ${currentTheme.primary}40`, borderRadius: '6px' }}>
                    <img src={qrUrl} alt="QR VCB" style={{ width: '100px', height: '100px', objectFit: 'contain', margin: '0 auto', display: 'block' }} />
                    <div style={{ fontSize: '10px', color: '#4b5563', marginTop: '4px' }}>VCB • 1034244823</div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------------------- */}
              {/* 12. TEMPLATE FRIENDLY — Gần Gũi Với Phụ Huynh, Biểu Tượng Lớn Dễ Hiểu */}
              {/* ------------------------------------------------------------------------- */}
              {invoiceModal.template === 'friendly' && (
                <div>
                  <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', padding: '18px 22px', borderRadius: '14px', marginBottom: '20px' }}>
                    <h1 style={{ margin: '0 0 10px 0', fontSize: '22px', color: '#92400e' }}>🌟 THÔNG BÁO HỌC PHÍ THÂN GỬI PHỤ HUYNH</h1>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px', color: '#78350f' }}>
                      <div>👤 Học sinh: <strong>{invoiceModal.bill.full_name}</strong></div>
                      <div>📚 Lớp học: <strong>{invoiceModal.bill.class_name}</strong></div>
                      <div>📅 Kỳ thu: <strong>Tháng {moment(invoiceModal.bill.start_date).format('MM/YYYY')}</strong></div>
                      <div>✨ Chuyên cần: <strong style={{ color: '#059669' }}>{presentCount}/{totalSessions} buổi có mặt</strong></div>
                    </div>
                  </div>

                  {/* Large Tuition Box & Big QR */}
                  <div style={{ display: 'grid', gridTemplateColumns: invoiceModal.paperSize === 'A5' ? '1fr 130px' : '1fr 170px', gap: '16px', marginBottom: '20px', alignItems: 'center' }}>
                    <div style={{ backgroundColor: currentTheme.lightBg, padding: '20px', borderRadius: '14px', border: `2px solid ${currentTheme.primary}` }}>
                      <div style={{ fontSize: '13px', textTransform: 'uppercase', color: '#4b5563', fontWeight: 'bold' }}>💰 HỌC PHÍ:</div>
                      <div style={{ fontSize: invoiceModal.paperSize === 'A5' ? '24px' : '32px', fontWeight: '900', color: currentTheme.primary, margin: '6px 0' }}>
                        {Number(invoiceModal.bill.total_amount).toLocaleString('vi-VN')} ₫
                      </div>
                      <div style={{ fontSize: '13px', color: currentTheme.text, fontStyle: 'italic' }}>
                        Bằng chữ: <strong>{numberToVietnameseWords(Number(invoiceModal.bill.total_amount) || 0)}</strong>
                      </div>
                    </div>

                    <div style={{ textAlign: 'center', backgroundColor: '#ffffff', padding: '10px', borderRadius: '14px', border: `1px solid ${currentTheme.secondary}35`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                      <img src={qrUrl} alt="QR VCB" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'contain', display: 'block' }} />
                      <div style={{ fontSize: '11px', fontWeight: 'bold', color: currentTheme.primary, marginTop: '4px' }}>VIETCOMBANK</div>
                      <div style={{ fontSize: '10px', color: '#6b7280' }}>1034244823</div>
                    </div>
                  </div>

                  {/* Session List */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '13px', color: currentTheme.primary, marginBottom: '8px', textTransform: 'uppercase' }}>Chi tiết các buổi học trong tháng:</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: invoiceModal.paperSize === 'A5' ? '12px' : '13px' }}>
                      <thead>
                        <tr style={{ backgroundColor: currentTheme.lightBg, borderBottom: `2px solid ${currentTheme.primary}` }}>
                          <th style={{ padding: '8px 10px', width: '90px' }}>Ngày</th>
                          <th style={{ padding: '8px 10px', width: '110px' }}>Điểm danh</th>
                          <th style={{ padding: '8px 10px' }}>Nội dung bài học</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessions.map((s: any, idx: number) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '8px 10px', fontWeight: '500' }}>{new Date(s.session_date).toLocaleDateString('vi-VN')}</td>
                            <td style={{ padding: '8px 10px', color: s.status === 'PRESENT' ? '#059669' : '#dc2626', fontWeight: 'bold' }}>
                              {s.status === 'PRESENT' ? '✓ Có mặt' : '✕ Vắng mặt'}
                            </td>
                            <td style={{ padding: '8px 10px', color: '#4b5563' }}>{s.content || 'Buổi học theo chương trình'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Optional Assessment Friendly */}
                  {hasAssessments && (
                    <div style={{ marginBottom: '20px', backgroundColor: '#fefce8', padding: '14px', borderRadius: '12px', border: '1px solid #fef08a' }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#854d0e', textTransform: 'uppercase', marginBottom: '8px' }}>📝 KẾT QUẢ ĐÁNH GIÁ CỦA CON:</div>
                      {selectedAssessments.map((a: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px' }}>
                          <span>📅 {moment(a.assessment_date).format('DD/MM')} — {a.title}</span>
                          <span style={{ fontWeight: 'bold', color: '#854d0e' }}>{a.score} điểm</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================================= */}
              {/* NHẬN XÉT CỦA GIÁO VIÊN (DÙNG CHUNG CHO CÁC MẪU) */}
              {/* ========================================================================= */}
              <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: currentTheme.primary, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  💬 Lời nhắn & Nhận xét của giáo viên:
                </div>
                <textarea 
                  value={invoiceModal.teacher_note}
                  onChange={e => setInvoiceModal((prev: any) => ({ ...prev, teacher_note: e.target.value }))}
                  placeholder="Nhập lời nhắn gửi phụ huynh..."
                  rows={invoiceModal.paperSize === 'A5' ? 2 : 3}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontFamily: 'inherit',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    boxSizing: 'border-box',
                    backgroundColor: '#ffffff',
                    color: '#111827'
                  }}
                />
              </div>

              {/* ========================================================================= */}
              {/* THÔNG ĐIỆP CẢM ƠN ONLINE THÂN THIỆN (KHÔNG CÓ CHỮ KÝ HÀNH CHÍNH) */}
              {/* ========================================================================= */}
              <div style={{ textAlign: 'center', paddingTop: '12px', borderTop: '1px dashed #d1d5db', color: '#6b7280', fontSize: '12px' }}>
                <div style={{ fontWeight: '500', color: currentTheme.primary, marginBottom: '2px' }}>
                  🌟 Cảm ơn Quý phụ huynh đã luôn đồng hành cùng các em trong suốt kỳ học!
                </div>
                <div>Phiếu học phí được tạo trực tuyến từ hệ thống quản lý học tập.</div>
              </div>

            </div>

          </Card>
        </div>
      )}

      {/* PRINT STYLES WITH EXACT COLOR FIDELITY */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #invoice-print-area, #invoice-print-area * {
              visibility: visible;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #invoice-print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100% !important;
              max-width: 100% !important;
              padding: 16px !important;
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
