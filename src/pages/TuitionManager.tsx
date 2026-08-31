import React, { useState, useEffect, useCallback, useContext } from 'react';
import axiosClient from '../api/axiosClient';
import moment from 'moment';
import { AuthContext } from '../context/AuthContext';
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

// Attendance Mapping Rule strictly adhering to requirements
export function getSessionRowData(s: any) {
  const status = s.status;
  let statusLabel = 'Chưa điểm danh';
  let statusColor = '#6b7280';
  let contentText = 'Chưa điểm danh';

  if (status === 'PRESENT') {
    statusLabel = 'Có mặt';
    statusColor = '#059669';
    contentText = s.content || 'Buổi học theo chương trình';
  } else if (status === 'ABSENT_EXCUSED') {
    statusLabel = 'Vắng phép';
    statusColor = '#d97706';
    contentText = s.absent_reason || s.notes || 'Nghỉ học có phép';
  } else if (status === 'ABSENT' || status === 'ABSENT_UNEXCUSED') {
    statusLabel = 'Vắng K/P';
    statusColor = '#dc2626';
    contentText = 'Vắng không phép';
  } else if (status === 'LATE') {
    statusLabel = 'Đi muộn';
    statusColor = '#ea580c';
    contentText = s.content || 'Buổi học theo chương trình';
  } else {
    statusLabel = 'Chưa điểm danh';
    statusColor = '#6b7280';
    contentText = 'Chưa điểm danh';
  }

  return { statusLabel, statusColor, contentText };
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

// 6 Truly Distinct Color-First Premium Templates with distinct art directions & layout architectures
const TEMPLATES = [
  { id: 'aurora', name: '01 Aurora Editorial', desc: 'Tạp chí thời trang, gradient lavender pastel' },
  { id: 'mediterranean', name: '02 Mediterranean Paper', desc: 'Giấy ấm thủ công, terracotta & olive ledger' },
  { id: 'vintage', name: '03 Vintage Bloom', desc: 'Boutique stationery, dusty rose & sage' },
  { id: 'geometric', name: '04 Neo Geometric', desc: 'Thiết kế đương đại, khối màu graphic & mono' },
  { id: 'midnight', name: '05 Midnight Garden', desc: 'Nền tối obsidian, timeline phát sáng & QR trắng' },
  { id: 'magazine', name: '06 Soft Magazine', desc: 'Pastel lifestyle, góc bo mềm mại & thân thiện' }
];

const TuitionManager = () => {
  const { user } = useContext(AuthContext);
  const [bills, setBills] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(moment().format('YYYY-MM'));
  const [stats, setStats] = useState({ totalExpected: 0, totalReceived: 0, totalPending: 0 });

  // Invoice Modal state
  const [invoiceModal, setInvoiceModal] = useState<any>({
    show: false,
    bill: null,
    sessions: [],
    availableAssessments: [],
    selectedAssessmentIds: [],
    showAssessmentPicker: false,
    teacherBank: null, // Dynamic Teacher Bank Account
    teacher_note: '',
    template: 'aurora', // 6 distinct color-first templates
    colorTheme: 'purple',
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
      
      // Dynamic teacher bank resolution
      const teacherBankData = res.data.teacher_bank || (user ? {
        bank_code: (user as any).bank_code,
        bank_name: (user as any).bank_name,
        account_number: (user as any).account_number,
        account_name: (user as any).account_name || user.full_name
      } : null);

      setInvoiceModal({
        show: true,
        bill: res.data.bill,
        sessions: res.data.sessions || [],
        availableAssessments: res.data.available_assessments || [],
        selectedAssessmentIds: [],
        showAssessmentPicker: false,
        teacherBank: (teacherBankData?.account_number && teacherBankData?.bank_code) ? teacherBankData : null,
        teacher_note: res.data.bill.bill_note || '',
        template: 'editorial',
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

  // Selected assessments filtered
  const selectedAssessments = (invoiceModal.availableAssessments || []).filter((a: any) => 
    invoiceModal.selectedAssessmentIds?.includes(a.id)
  );
  const hasAssessments = selectedAssessments.length > 0;

  // Dynamic QR Code Generation strictly based on teacher bank account (NO fixed amount)
  const teacherBank = invoiceModal.teacherBank;
  const isBankConfigured = Boolean(teacherBank && teacherBank.account_number && teacherBank.bank_code);
  
  const qrUrl = (isBankConfigured && invoiceModal.bill) 
    ? `https://img.vietqr.io/image/${teacherBank.bank_code}-${teacherBank.account_number}-compact2.png?addInfo=HP%20${encodeURIComponent(invoiceModal.bill.full_name || '')}%20T${moment(invoiceModal.bill.start_date).format('MM')}` 
    : '';

  // =========================================================================
  // 6 TRULY DISTINCT LAYOUT RENDERERS
  // =========================================================================

  // =========================================================================
  // 6 TRULY DISTINCT COLOR-FIRST LAYOUT RENDERERS (DESIGN 6.0)
  // =========================================================================

  // RENDERER 01: AURORA EDITORIAL (Fashion Magazine + Modern Gradient Pastel)
  const renderAuroraInvoice = () => (
    <div style={{ 
      padding: invoiceModal.paperSize === 'A5' ? '14px' : '26px', 
      background: 'linear-gradient(135deg, #f7f3fd 0%, #fdf2f8 50%, #fffbf0 100%)', 
      borderRadius: '16px',
      fontFamily: '"Playfair Display", Georgia, "Times New Roman", serif', 
      color: '#1e1b4b',
      boxShadow: '0 4px 20px rgba(124, 58, 237, 0.05)'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', borderBottom: '1px solid rgba(124, 58, 237, 0.2)', paddingBottom: '16px', marginBottom: '22px' }}>
        <div style={{ display: 'inline-block', padding: '3px 12px', borderRadius: '20px', backgroundColor: 'rgba(124, 58, 237, 0.1)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: currentTheme.primary, fontWeight: 'bold' }}>
          ✦ TUITION NOTE ✦
        </div>
        <h1 style={{ margin: '8px 0 4px 0', fontSize: invoiceModal.paperSize === 'A5' ? '26px' : '34px', fontWeight: 'normal', letterSpacing: '1px', color: '#1e1b4b' }}>
          THÔNG BÁO HỌC PHÍ
        </h1>
        <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', fontFamily: 'system-ui, sans-serif' }}>
          Kỳ học: <strong>{moment(invoiceModal.bill.start_date).format('DD/MM/YYYY')}</strong> — <strong>{moment(invoiceModal.bill.end_date).format('DD/MM/YYYY')}</strong> • Mã hồ sơ: #{invoiceModal.bill.id}
        </div>
      </div>

      {/* Hero Student & Floating Amount Card */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(8px)', padding: '16px 20px', borderRadius: '14px', border: '1px solid rgba(124, 58, 237, 0.15)', marginBottom: '22px', fontFamily: 'system-ui, sans-serif' }}>
        <div>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: currentTheme.primary, letterSpacing: '1.5px', fontWeight: 'bold' }}>HỌC VIÊN</div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e1b4b', marginTop: '2px', fontFamily: 'Georgia, serif' }}>
            {invoiceModal.bill.full_name}
          </div>
          <div style={{ fontSize: '13px', color: '#475569', marginTop: '3px' }}>
            Lớp: <strong>{invoiceModal.bill.class_name}</strong> {invoiceModal.bill.teacher_name && `• GV: ${invoiceModal.bill.teacher_name}`}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: currentTheme.primary, letterSpacing: '1.5px', fontWeight: 'bold' }}>HỌC PHÍ KỲ NÀY</div>
          <div style={{ fontSize: invoiceModal.paperSize === 'A5' ? '26px' : '32px', fontWeight: 'bold', color: currentTheme.primary, fontFamily: 'Georgia, serif', letterSpacing: '-0.5px' }}>
            {Number(invoiceModal.bill.total_amount).toLocaleString('vi-VN')} ₫
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', marginTop: '2px' }}>
            {numberToVietnameseWords(Number(invoiceModal.bill.total_amount) || 0)}
          </div>
        </div>
      </div>

      {/* Session Flow List */}
      <div style={{ marginBottom: '22px' }}>
        <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: currentTheme.primary, fontWeight: 'bold', marginBottom: '10px', fontFamily: 'system-ui, sans-serif' }}>
          NHẬT KÝ BUỔI HỌC ({totalSessions} BUỔI)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontFamily: 'system-ui, sans-serif' }}>
          {sessions.map((s: any, idx: number) => {
            const { statusLabel, statusColor, contentText } = getSessionRowData(s);
            return (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: 'rgba(255, 255, 255, 0.7)', borderRadius: '10px', border: '1px solid rgba(226, 232, 240, 0.8)', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontWeight: 'bold', width: '90px', color: '#1e1b4b' }}>{moment(s.session_date).format('DD/MM/YYYY')}</span>
                  <span style={{ color: '#475569' }}>{contentText}</span>
                </div>
                <span style={{ fontWeight: 'bold', color: statusColor, fontSize: '11px', padding: '2px 8px', borderRadius: '12px', backgroundColor: `${statusColor}15` }}>{statusLabel}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assessment Section */}
      {hasAssessments && (
        <div style={{ marginBottom: '22px', backgroundColor: 'rgba(255, 255, 255, 0.8)', padding: '14px 18px', border: '1px solid rgba(124, 58, 237, 0.15)', borderRadius: '12px', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: currentTheme.primary, fontWeight: 'bold', marginBottom: '8px' }}>
            KẾT QUẢ ĐÁNH GIÁ ĐỊNH KỲ
          </div>
          {selectedAssessments.map((a: any, idx: number) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px' }}>
              <span>{moment(a.assessment_date).format('DD/MM/YYYY')} — {a.title}</span>
              <span style={{ fontWeight: 'bold', color: currentTheme.primary }}>{a.score} điểm</span>
            </div>
          ))}
        </div>
      )}

      {/* Bank & High-Contrast White QR */}
      <div style={{ borderTop: '1px solid rgba(124, 58, 237, 0.2)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', fontFamily: 'system-ui, sans-serif' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: currentTheme.primary, textTransform: 'uppercase', letterSpacing: '1px' }}>THÔNG TIN CHUYỂN KHOẢN:</div>
          {isBankConfigured ? (
            <div style={{ fontSize: '13px', color: '#334155', marginTop: '4px', lineHeight: '1.5' }}>
              <div>Ngân hàng: <strong>{teacherBank.bank_name || teacherBank.bank_code}</strong></div>
              <div>Số tài khoản: <strong style={{ letterSpacing: '0.5px' }}>{teacherBank.account_number}</strong></div>
              <div>Chủ tài khoản: <strong>{teacherBank.account_name}</strong></div>
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: '#d97706', fontStyle: 'italic', marginTop: '4px' }}>
              Chưa cấu hình tài khoản nhận học phí.
            </div>
          )}
        </div>
        {isBankConfigured && (
          <div style={{ textAlign: 'center', backgroundColor: '#ffffff', padding: '8px', border: '1px solid rgba(124, 58, 237, 0.2)', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
            <img src={qrUrl} alt="QR Chuyển khoản" style={{ width: '115px', height: '115px', objectFit: 'contain', display: 'block' }} />
            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px', fontWeight: 'bold' }}>{teacherBank.bank_code} • {teacherBank.account_number}</div>
          </div>
        )}
      </div>
    </div>
  );

  // RENDERER 02: MEDITERRANEAN PAPER (Warm Sand / Terracotta & Olive Travel Ledger)
  const renderMediterraneanInvoice = () => (
    <div style={{ 
      padding: invoiceModal.paperSize === 'A5' ? '14px' : '24px', 
      backgroundColor: '#fffaf2', 
      border: '2px solid #e7dac7', 
      outline: '1px solid #d4c3ab', 
      outlineOffset: '-6px', 
      fontFamily: '"Times New Roman", Times, Georgia, serif', 
      color: '#382314' 
    }}>
      {/* Header with Mediterranean motif */}
      <div style={{ textAlign: 'center', borderBottom: '2px solid #c2410c', paddingBottom: '14px', marginBottom: '20px' }}>
        <div style={{ fontSize: '10px', letterSpacing: '4px', textTransform: 'uppercase', color: '#c2410c', fontWeight: 'bold' }}>
          ◈ SỔ THU HỌC PHÍ ĐỊNH KỲ ◈
        </div>
        <h1 style={{ margin: '6px 0 2px 0', fontSize: invoiceModal.paperSize === 'A5' ? '24px' : '30px', fontWeight: 'normal', letterSpacing: '1px', color: '#382314' }}>
          PHIẾU BÁO HỌC PHÍ
        </h1>
        <div style={{ fontSize: '12px', color: '#7c6f5e', fontStyle: 'italic' }}>
          Số hồ sơ: #{invoiceModal.bill.id} • Kỳ thu: {moment(invoiceModal.bill.start_date).format('DD/MM/YYYY')} đến {moment(invoiceModal.bill.end_date).format('DD/MM/YYYY')}
        </div>
      </div>

      {/* Student & Amount Ledger Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', backgroundColor: '#f9f2e4', padding: '12px 16px', border: '1px solid #e2d2be' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#7c6f5e', textTransform: 'uppercase', letterSpacing: '1px' }}>Kính gửi Quý phụ huynh học sinh:</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#382314', marginTop: '2px' }}>{invoiceModal.bill.full_name}</div>
          <div style={{ fontSize: '12.5px', color: '#65a30d', fontWeight: 'bold', marginTop: '2px' }}>Lớp: {invoiceModal.bill.class_name}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: '#c2410c', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Số tiền học phí:</div>
          <div style={{ fontSize: invoiceModal.paperSize === 'A5' ? '24px' : '28px', fontWeight: 'bold', color: '#c2410c' }}>
            {Number(invoiceModal.bill.total_amount).toLocaleString('vi-VN')} ₫
          </div>
          <div style={{ fontSize: '11px', color: '#7c6f5e', fontStyle: 'italic' }}>
            ({numberToVietnameseWords(Number(invoiceModal.bill.total_amount) || 0)})
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div style={{ marginBottom: '20px', border: '1px solid #e7dac7', backgroundColor: '#fffdf7' }}>
        <div style={{ backgroundColor: '#f2e6d3', padding: '8px 12px', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', color: '#543b23', borderBottom: '1px solid #e7dac7' }}>
          BẢNG THEO DÕI HỌC TẬP & ĐIỂM DANH ({totalSessions} BUỔI)
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e7dac7', color: '#7c6f5e', fontSize: '11px', textTransform: 'uppercase', backgroundColor: '#faf4e8' }}>
              <th style={{ padding: '7px 10px', textAlign: 'left', width: '90px' }}>Ngày</th>
              <th style={{ padding: '7px 10px', textAlign: 'left', width: '100px' }}>Điểm danh</th>
              <th style={{ padding: '7px 10px', textAlign: 'left' }}>Nội dung bài học</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s: any, idx: number) => {
              const { statusLabel, statusColor, contentText } = getSessionRowData(s);
              return (
                <tr key={idx} style={{ borderBottom: '1px solid #f3e9da', backgroundColor: idx % 2 === 0 ? '#fffdf7' : '#faf4e8' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 'bold' }}>{moment(s.session_date).format('DD/MM/YYYY')}</td>
                  <td style={{ padding: '8px 10px', color: statusColor, fontWeight: 'bold' }}>{statusLabel}</td>
                  <td style={{ padding: '8px 10px', color: '#4a3828' }}>{contentText}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Assessment */}
      {hasAssessments && (
        <div style={{ marginBottom: '20px', border: '1px solid #e7dac7', padding: '10px 14px', backgroundColor: '#f9f2e4' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#c2410c', fontWeight: 'bold', marginBottom: '6px' }}>
            KẾT QUẢ ĐÁNH GIÁ ĐỊNH KỲ:
          </div>
          {selectedAssessments.map((a: any, idx: number) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '12px' }}>
              <span>{moment(a.assessment_date).format('DD/MM/YYYY')} — {a.title}</span>
              <span style={{ fontWeight: 'bold', color: '#c2410c' }}>{a.score} điểm</span>
            </div>
          ))}
        </div>
      )}

      {/* Bank & White Quiet Zone QR */}
      <div style={{ borderTop: '2px solid #c2410c', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '12px', color: '#543b23', lineHeight: '1.5' }}>
          {isBankConfigured ? (
            <>
              <div>Ngân hàng: <strong>{teacherBank.bank_name || teacherBank.bank_code}</strong></div>
              <div>Số tài khoản: <strong style={{ color: '#c2410c', fontSize: '14px' }}>{teacherBank.account_number}</strong></div>
              <div>Chủ tài khoản: <strong>{teacherBank.account_name}</strong></div>
            </>
          ) : (
            <div style={{ fontStyle: 'italic', color: '#8c7d6e' }}>Chưa cấu hình tài khoản nhận chuyển khoản.</div>
          )}
        </div>
        {isBankConfigured && (
          <div style={{ textAlign: 'center', backgroundColor: '#ffffff', padding: '6px', border: '1px solid #e7dac7', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
            <img src={qrUrl} alt="QR" style={{ width: '105px', height: '105px', objectFit: 'contain', display: 'block' }} />
            <div style={{ fontSize: '9px', color: '#7c6f5e', marginTop: '3px' }}>{teacherBank.bank_code} • {teacherBank.account_number}</div>
          </div>
        )}
      </div>
    </div>
  );

  // RENDERER 03: VINTAGE BLOOM (Boutique Stationery, Dusty Rose & Burgundy)
  const renderVintageBloomInvoice = () => (
    <div style={{ 
      padding: invoiceModal.paperSize === 'A5' ? '14px' : '24px', 
      backgroundColor: '#fdf8f9', 
      border: '2px solid #f2d6dc', 
      outline: '1px solid #e8b8c2', 
      outlineOffset: '-6px', 
      fontFamily: '"Georgia", "Times New Roman", serif', 
      color: '#35111d' 
    }}>
      <div style={{ textAlign: 'center', borderBottom: '1px solid #e8b8c2', paddingBottom: '14px', marginBottom: '20px' }}>
        <div style={{ fontSize: '10px', letterSpacing: '4px', textTransform: 'uppercase', color: '#be185d', fontWeight: 'bold' }}>
          ❀ BOUTIQUE ACADEMIC STATEMENT ❀
        </div>
        <h1 style={{ margin: '6px 0 2px 0', fontSize: invoiceModal.paperSize === 'A5' ? '24px' : '30px', fontWeight: 'normal', letterSpacing: '1px', color: '#9f1239' }}>
          PHIẾU BÁO HỌC PHÍ
        </h1>
        <div style={{ fontSize: '12px', color: '#886976', fontStyle: 'italic' }}>
          Kỳ học: {moment(invoiceModal.bill.start_date).format('DD/MM/YYYY')} — {moment(invoiceModal.bill.end_date).format('DD/MM/YYYY')} • #{invoiceModal.bill.id}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', borderBottom: '1px dashed #e8b8c2', paddingBottom: '14px' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#886976', textTransform: 'uppercase' }}>Học viên:</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#9f1239', marginTop: '2px' }}>{invoiceModal.bill.full_name}</div>
          <div style={{ fontSize: '13px', color: '#4a2835', marginTop: '2px' }}>Lớp: <strong>{invoiceModal.bill.class_name}</strong></div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: '#886976', textTransform: 'uppercase' }}>Học phí:</div>
          <div style={{ fontSize: invoiceModal.paperSize === 'A5' ? '24px' : '28px', fontWeight: 'bold', color: '#9f1239' }}>
            {Number(invoiceModal.bill.total_amount).toLocaleString('vi-VN')} ₫
          </div>
          <div style={{ fontSize: '11px', color: '#886976', fontStyle: 'italic' }}>
            ({numberToVietnameseWords(Number(invoiceModal.bill.total_amount) || 0)})
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '20px', border: '1px solid #f2d6dc', backgroundColor: '#ffffff' }}>
        <div style={{ backgroundColor: '#faeaf0', padding: '6px 12px', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', color: '#9f1239', borderBottom: '1px solid #f2d6dc' }}>
          DANH SÁCH BUỔI HỌC ({totalSessions} BUỔI)
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #f2d6dc', color: '#886976', fontSize: '11px', textTransform: 'uppercase' }}>
              <th style={{ padding: '6px 10px', textAlign: 'left', width: '90px' }}>Ngày</th>
              <th style={{ padding: '6px 10px', textAlign: 'left', width: '100px' }}>Điểm danh</th>
              <th style={{ padding: '6px 10px', textAlign: 'left' }}>Nội dung</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s: any, idx: number) => {
              const { statusLabel, statusColor, contentText } = getSessionRowData(s);
              return (
                <tr key={idx} style={{ borderBottom: '1px solid #fceef2' }}>
                  <td style={{ padding: '7px 10px', fontWeight: 'bold' }}>{moment(s.session_date).format('DD/MM/YYYY')}</td>
                  <td style={{ padding: '7px 10px', color: statusColor, fontWeight: 'bold' }}>{statusLabel}</td>
                  <td style={{ padding: '7px 10px', color: '#4a2835' }}>{contentText}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hasAssessments && (
        <div style={{ marginBottom: '20px', border: '1px solid #f2d6dc', padding: '10px 14px', backgroundColor: '#faeaf0' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#9f1239', fontWeight: 'bold', marginBottom: '6px' }}>
            KẾT QUẢ ĐÁNH GIÁ:
          </div>
          {selectedAssessments.map((a: any, idx: number) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '12px' }}>
              <span>{moment(a.assessment_date).format('DD/MM/YYYY')} — {a.title}</span>
              <span style={{ fontWeight: 'bold', color: '#047857' }}>{a.score} điểm</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ borderTop: '1px solid #e8b8c2', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '12px', color: '#4a2835', lineHeight: '1.5' }}>
          {isBankConfigured ? (
            <>
              <div>Ngân hàng: <strong>{teacherBank.bank_name || teacherBank.bank_code}</strong></div>
              <div>Số tài khoản: <strong>{teacherBank.account_number}</strong></div>
              <div>Chủ tài khoản: <strong>{teacherBank.account_name}</strong></div>
            </>
          ) : (
            <div style={{ fontStyle: 'italic', color: '#886976' }}>Chưa cấu hình tài khoản.</div>
          )}
        </div>
        {isBankConfigured && (
          <div style={{ textAlign: 'center', backgroundColor: '#ffffff', padding: '6px', border: '1px solid #f2d6dc' }}>
            <img src={qrUrl} alt="QR" style={{ width: '105px', height: '105px', objectFit: 'contain', display: 'block' }} />
            <div style={{ fontSize: '9px', color: '#886976', marginTop: '3px' }}>{teacherBank.bank_code} • {teacherBank.account_number}</div>
          </div>
        )}
      </div>
    </div>
  );

  // RENDERER 04: NEO GEOMETRIC (Contemporary Graphic Design / Asymmetric Color-Blocks)
  const renderNeoGeometricInvoice = () => (
    <div style={{ 
      padding: invoiceModal.paperSize === 'A5' ? '14px' : '24px', 
      backgroundColor: '#f0f7ff', 
      borderRadius: '16px',
      fontFamily: 'system-ui, -apple-system, sans-serif', 
      color: '#0f172a',
      border: '2px solid #bae6fd'
    }}>
      {/* 2-Column Asymmetric Geometric Hero */}
      <div style={{ display: 'grid', gridTemplateColumns: invoiceModal.paperSize === 'A5' ? '1fr 140px' : '1fr 200px', gap: '14px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '18px 20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', color: '#0284c7' }}>
            NEO GEOMETRIC STATEMENT
          </div>
          <h1 style={{ margin: '4px 0', fontSize: invoiceModal.paperSize === 'A5' ? '20px' : '26px', fontWeight: '900', color: '#0f172a' }}>
            {invoiceModal.bill.full_name}
          </h1>
          <div style={{ fontSize: '13px', color: '#475569' }}>
            Lớp: <strong>{invoiceModal.bill.class_name}</strong> • #{invoiceModal.bill.id}
          </div>
          <div style={{ fontSize: '12px', color: '#0284c7', fontWeight: 'bold', marginTop: '4px' }}>
            📅 {moment(invoiceModal.bill.start_date).format('DD/MM/YYYY')} — {moment(invoiceModal.bill.end_date).format('DD/MM/YYYY')}
          </div>
        </div>

        <div style={{ backgroundColor: '#0284c7', color: '#ffffff', padding: '18px 16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>HỌC PHÍ</div>
          <div style={{ fontSize: invoiceModal.paperSize === 'A5' ? '20px' : '26px', fontWeight: '900', letterSpacing: '-0.5px', marginTop: '2px' }}>
            {Number(invoiceModal.bill.total_amount).toLocaleString('vi-VN')} ₫
          </div>
        </div>
      </div>

      {/* Numbered Session Grid Blocks */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#0284c7', marginBottom: '10px' }}>
          LỘ TRÌNH BUỔI HỌC ({totalSessions} BUỔI)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {sessions.map((s: any, idx: number) => {
            const { statusLabel, statusColor, contentText } = getSessionRowData(s);
            const seq = String(idx + 1).padStart(2, '0');
            return (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '32px 85px 1fr 90px', alignItems: 'center', backgroundColor: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12.5px' }}>
                <span style={{ fontWeight: '900', color: '#0284c7', fontFamily: 'monospace', fontSize: '13px' }}>{seq}</span>
                <span style={{ fontWeight: '700', color: '#0f172a' }}>{moment(s.session_date).format('DD/MM/YYYY')}</span>
                <span style={{ color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{contentText}</span>
                <span style={{ fontWeight: '800', color: statusColor, textAlign: 'right', fontSize: '11px', textTransform: 'uppercase' }}>{statusLabel}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assessments */}
      {hasAssessments && (
        <div style={{ marginBottom: '20px', backgroundColor: '#ffffff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', color: '#0284c7', marginBottom: '6px' }}>ĐÁNH GIÁ & ĐIỂM SỐ:</div>
          {selectedAssessments.map((a: any, idx: number) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', padding: '3px 0' }}>
              <span>{moment(a.assessment_date).format('DD/MM')} — {a.title}</span>
              <span style={{ fontWeight: '900', color: '#0284c7' }}>{a.score} điểm</span>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Payment Station */}
      <div style={{ display: 'grid', gridTemplateColumns: invoiceModal.paperSize === 'A5' ? '1fr 120px' : '1fr 140px', gap: '14px', alignItems: 'center', backgroundColor: '#ffffff', padding: '14px 18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div>
          <div style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', color: '#64748b' }}>THÔNG TIN THANH TOÁN</div>
          {isBankConfigured ? (
            <div style={{ fontSize: '13px', marginTop: '4px', lineHeight: '1.4' }}>
              <div>Ngân hàng: <strong>{teacherBank.bank_name || teacherBank.bank_code}</strong></div>
              <div>STK: <strong style={{ color: '#0284c7', fontSize: '14px' }}>{teacherBank.account_number}</strong></div>
              <div>Chủ TK: <strong>{teacherBank.account_name}</strong></div>
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: '#d97706', fontStyle: 'italic' }}>Chưa cấu hình tài khoản</div>
          )}
        </div>
        {isBankConfigured && (
          <div style={{ textAlign: 'center', padding: '4px' }}>
            <img src={qrUrl} alt="QR" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'contain', display: 'block', border: '1px solid #bae6fd', borderRadius: '8px' }} />
            <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#64748b', marginTop: '3px' }}>{teacherBank.bank_code}</div>
          </div>
        )}
      </div>
    </div>
  );

  // RENDERER 05: MIDNIGHT GARDEN (Dark Obsidian Canvas + Glowing Neon Timeline + Pure White QR)
  const renderMidnightGardenInvoice = () => (
    <div style={{ 
      padding: invoiceModal.paperSize === 'A5' ? '14px' : '24px', 
      backgroundColor: '#090d16', 
      color: '#f8fafc', 
      borderRadius: '16px', 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      border: '1px solid #1e293b',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
    }}>
      {/* Dark Hero Card */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #1e293b', paddingBottom: '16px', marginBottom: '20px' }}>
        <div>
          <span style={{ fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: '#38bdf8', fontWeight: 'bold' }}>✦ MIDNIGHT STATEMENT</span>
          <h1 style={{ margin: '4px 0', fontSize: invoiceModal.paperSize === 'A5' ? '22px' : '28px', fontWeight: '800', color: '#ffffff' }}>{invoiceModal.bill.full_name}</h1>
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>Lớp: <strong style={{ color: '#f8fafc' }}>{invoiceModal.bill.class_name}</strong> • Kỳ: {moment(invoiceModal.bill.start_date).format('DD/MM')} — {moment(invoiceModal.bill.end_date).format('DD/MM/YYYY')}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: '#64748b' }}>#{invoiceModal.bill.id}</div>
          <div style={{ fontSize: invoiceModal.paperSize === 'A5' ? '24px' : '28px', fontWeight: '900', color: '#38bdf8', marginTop: '2px', textShadow: '0 0 12px rgba(56, 189, 248, 0.3)' }}>
            {Number(invoiceModal.bill.total_amount).toLocaleString('vi-VN')} ₫
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: invoiceModal.paperSize === 'A5' ? '1fr 130px' : '1fr 160px', gap: '20px', marginBottom: '20px' }}>
        {/* Connected Vertical Timeline */}
        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', fontWeight: 'bold', marginBottom: '14px' }}>
            HÀNH TRÌNH HỌC TẬP ({totalSessions} BUỔI):
          </div>
          <div style={{ position: 'relative', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '14px', borderLeft: '2px solid rgba(56, 189, 248, 0.3)' }}>
            {sessions.map((s: any, idx: number) => {
              const { statusLabel, statusColor, contentText } = getSessionRowData(s);
              return (
                <div key={idx} style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-24px', top: '3px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: statusColor, boxShadow: `0 0 8px ${statusColor}` }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#f1f5f9' }}>{moment(s.session_date).format('DD/MM/YYYY')}</span>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: statusColor, padding: '1px 6px', borderRadius: '10px', backgroundColor: `${statusColor}20` }}>{statusLabel}</span>
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '2px' }}>{contentText}</div>
                </div>
              );
            })}
          </div>

          {hasAssessments && (
            <div style={{ marginTop: '18px', backgroundColor: '#131b2e', padding: '12px 14px', borderRadius: '8px', border: '1px solid #1e293b' }}>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#38bdf8', fontWeight: 'bold', marginBottom: '6px' }}>ĐÁNH GIÁ & ĐIỂM:</div>
              {selectedAssessments.map((a: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '12px' }}>
                  <span style={{ color: '#cbd5e1' }}>{moment(a.assessment_date).format('DD/MM')} — {a.title}</span>
                  <span style={{ fontWeight: 'bold', color: '#34d399' }}>{a.score}đ</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Rail: QR with Pure High-Contrast White Quiet Zone */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {isBankConfigured ? (
            <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
              <img src={qrUrl} alt="QR" style={{ width: '100%', maxWidth: '135px', aspectRatio: '1/1', objectFit: 'contain', display: 'block' }} />
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#0f172a', marginTop: '6px' }}>{teacherBank.bank_code} • {teacherBank.account_number}</div>
              <div style={{ fontSize: '9px', color: '#475569', marginTop: '2px' }}>{teacherBank.account_name}</div>
            </div>
          ) : (
            <div style={{ fontSize: '11px', color: '#64748b' }}>Chưa cấu hình tài khoản</div>
          )}
        </div>
      </div>
    </div>
  );

  // RENDERER 06: SOFT MAGAZINE (Pastel Lifestyle Magazine / Parent-Friendly Curves)
  const renderSoftMagazineInvoice = () => (
    <div style={{ 
      padding: invoiceModal.paperSize === 'A5' ? '14px' : '24px', 
      background: 'linear-gradient(135deg, #fff1f2 0%, #fff7ed 50%, #fdf4ff 100%)', 
      borderRadius: '24px', 
      fontFamily: 'system-ui, -apple-system, sans-serif', 
      color: '#1f2937', 
      border: '1px solid #ffe4e6',
      boxShadow: '0 4px 20px rgba(225, 29, 72, 0.04)'
    }}>
      {/* Curved Hero Bubble */}
      <div style={{ backgroundColor: '#ffffff', padding: '18px 22px', borderRadius: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #ffe4e6', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#e11d48', textTransform: 'uppercase', letterSpacing: '1px' }}>🌸 THÔNG BÁO HỌC PHÍ</span>
          <h1 style={{ margin: '4px 0 2px 0', fontSize: invoiceModal.paperSize === 'A5' ? '22px' : '26px', fontWeight: '800', color: '#111827' }}>{invoiceModal.bill.full_name}</h1>
          <div style={{ fontSize: '13px', color: '#4b5563' }}>Lớp: <strong>{invoiceModal.bill.class_name}</strong> • Kỳ: {moment(invoiceModal.bill.start_date).format('DD/MM')} — {moment(invoiceModal.bill.end_date).format('DD/MM/YYYY')}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: '#9ca3af' }}>#{invoiceModal.bill.id}</div>
          <div style={{ fontSize: invoiceModal.paperSize === 'A5' ? '24px' : '28px', fontWeight: '800', color: '#e11d48', marginTop: '2px' }}>
            {Number(invoiceModal.bill.total_amount).toLocaleString('vi-VN')} ₫
          </div>
        </div>
      </div>

      {/* Floating Session Chips */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#4b5563', textTransform: 'uppercase', marginBottom: '10px' }}>
          DANH SÁCH BUỔI HỌC TRONG KỲ:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
          {sessions.map((s: any, idx: number) => {
            const { statusLabel, statusColor, contentText } = getSessionRowData(s);
            return (
              <div key={idx} style={{ backgroundColor: '#ffffff', padding: '12px 14px', borderRadius: '16px', border: '1px solid #ffe4e6', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '13px', color: '#111827' }}>{moment(s.session_date).format('DD/MM/YYYY')}</strong>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px', backgroundColor: `${statusColor}15`, color: statusColor }}>{statusLabel}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{contentText}</div>
              </div>
            );
          })}
        </div>
      </div>

      {hasAssessments && (
        <div style={{ marginBottom: '20px', backgroundColor: '#ffffff', padding: '14px 18px', borderRadius: '18px', border: '1px solid #ffe4e6' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', color: '#e11d48', marginBottom: '8px' }}>KẾT QUẢ ĐÁNH GIÁ:</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {selectedAssessments.map((a: any, idx: number) => (
              <span key={idx} style={{ padding: '4px 10px', backgroundColor: '#fff1f2', borderRadius: '12px', fontSize: '12px', fontWeight: '600', color: '#e11d48' }}>
                {a.title}: <strong>{a.score}đ</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Dual Rounded Pods */}
      <div style={{ display: 'grid', gridTemplateColumns: invoiceModal.paperSize === 'A5' ? '1fr 130px' : '1fr 160px', gap: '14px', alignItems: 'center' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: '18px', border: '1px solid #ffe4e6' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' }}>THÔNG TIN CHUYỂN KHOẢN</div>
          {isBankConfigured ? (
            <div style={{ fontSize: '13px', color: '#1f2937', marginTop: '4px', lineHeight: '1.4' }}>
              <div>Ngân hàng: <strong>{teacherBank.bank_name || teacherBank.bank_code}</strong></div>
              <div>STK: <strong style={{ color: '#e11d48' }}>{teacherBank.account_number}</strong></div>
              <div>Chủ TK: <strong>{teacherBank.account_name}</strong></div>
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: '#d97706', fontStyle: 'italic' }}>Chưa cấu hình tài khoản</div>
          )}
        </div>
        {isBankConfigured && (
          <div style={{ backgroundColor: '#ffffff', padding: '10px', borderRadius: '18px', border: '1px solid #ffe4e6', textAlign: 'center' }}>
            <img src={qrUrl} alt="QR" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'contain', display: 'block' }} />
            <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '4px' }}>{teacherBank.bank_code} • {teacherBank.account_number}</div>
          </div>
        )}
      </div>
    </div>
  );

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
        
        {/* DESKTOP TABLE */}
        <div className="desktop-bills-table" style={{ overflowX: 'auto' }}>
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

        {/* MOBILE CARDS LIST */}
        <div className="mobile-bills-cards" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px' }}>
          {(!Array.isArray(bills) || bills.length === 0) ? (
            <EmptyState title="Không có phiếu học phí" description="Bấm '+ Tạo Phiếu Thu Mới' để lập phiếu." />
          ) : (
            bills.map(b => (
              <div 
                key={b.id} 
                style={{ 
                  padding: '14px', 
                  borderRadius: '8px', 
                  backgroundColor: b.is_paid ? 'var(--color-surface)' : 'var(--color-danger-light)', 
                  border: '1px solid var(--color-border)', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '8px' 
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '16px', color: 'var(--color-text)' }}>{b.full_name}</strong>
                  <Badge variant={b.is_paid ? 'success' : 'warning'}>
                    {b.is_paid ? '🟢 ĐÃ THU' : '⏳ CHỜ THU'}
                  </Badge>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  📅 Kỳ: {new Date(b.start_date).toLocaleDateString('vi-VN')} — {new Date(b.end_date).toLocaleDateString('vi-VN')} • #{b.id}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                  {Number(b.total_amount).toLocaleString('vi-VN')} đ
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <Button 
                    onClick={() => handleOpenInvoice(b.id)} 
                    variant="outline" 
                    size="sm" 
                    style={{ flex: 1, minHeight: '44px' }}
                  >
                    📄 Xem / In Phiếu
                  </Button>
                  {!b.is_paid && (
                    <Button 
                      onClick={() => handleConfirmPayment(b.id)} 
                      variant="primary" 
                      size="sm" 
                      style={{ minHeight: '44px' }}
                    >
                      ✓ Đã thu
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
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
                    {previewData.sessions?.map((s: any, idx: number) => {
                      const { statusLabel, contentText } = getSessionRowData(s);
                      return (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px dashed var(--color-border)' }}>
                          <span>📅 {new Date(s.attendance_date).toLocaleDateString('vi-VN')} - {contentText}</span>
                          <span style={{ fontWeight: 'bold', color: s.status === 'PRESENT' ? '#059669' : '#dc2626' }}>
                            {statusLabel}
                          </span>
                        </div>
                      );
                    })}
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

      {/* Modal Preview & In Phiếu Học Phí Đầy Đủ (6 Distinct Layout Architectures + Dynamic Teacher Bank + No Fixed Amount QR) */}
      {invoiceModal.show && invoiceModal.bill && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--spacing-4)', backdropFilter: 'blur(6px)' }}>
          <Card style={{ width: '100%', maxWidth: '1020px', maxHeight: '95vh', overflowY: 'auto', padding: 'var(--spacing-6)', display: 'flex', flexDirection: 'column' }}>
            
            {/* THANH ĐIỀU KHIỂN INVOICE (NO-PRINT) */}
            <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: 'var(--spacing-5)', paddingBottom: 'var(--spacing-4)', borderBottom: '1px solid var(--color-border)' }}>
              
              {/* Hàng 1: GALLERY 6 MẪU THIẾT KẾ PREMIUM */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    🎨 6 Mẫu Thiết Kế Riêng Biệt (6 Distinct Layout Systems):
                  </div>
                  <span style={{ fontSize: '12px', color: currentTheme.primary, fontWeight: 'bold' }}>
                    Đang chọn: {TEMPLATES.find(t => t.id === invoiceModal.template)?.name}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' }}>
                  {TEMPLATES.map(tmpl => {
                    const isSelected = invoiceModal.template === tmpl.id;
                    return (
                      <button
                        key={tmpl.id}
                        onClick={() => setInvoiceModal((prev: any) => ({ ...prev, template: tmpl.id }))}
                        style={{
                          padding: '10px 12px',
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
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                  <Button onClick={() => setInvoiceModal({ show: false, bill: null, sessions: [], availableAssessments: [], selectedAssessmentIds: [], showAssessmentPicker: false, teacherBank: null, teacher_note: '', template: 'aurora', colorTheme: 'purple', customPrimaryColor: '', paperSize: 'A4' })} variant="ghost" size="sm">
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
            {/* KHU VỰC IN PHIẾU THỰC SỰ - 6 TRULY DISTINCT LAYOUTS */}
            {/* ========================================================================= */}
            <div 
              id="invoice-print-area" 
              className={`template-${invoiceModal.template} size-${invoiceModal.paperSize}`}
              style={{
                boxSizing: 'border-box',
                width: '100%',
                backgroundColor: invoiceModal.template === 'midnight' ? '#090d16' : invoiceModal.template === 'vintage' ? '#fdf8f9' : invoiceModal.template === 'mediterranean' ? '#fffaf2' : invoiceModal.template === 'geometric' ? '#f0f7ff' : '#ffffff'
              }}
            >
              {invoiceModal.template === 'aurora' && renderAuroraInvoice()}
              {invoiceModal.template === 'mediterranean' && renderMediterraneanInvoice()}
              {invoiceModal.template === 'vintage' && renderVintageBloomInvoice()}
              {invoiceModal.template === 'geometric' && renderNeoGeometricInvoice()}
              {invoiceModal.template === 'midnight' && renderMidnightGardenInvoice()}
              {invoiceModal.template === 'magazine' && renderSoftMagazineInvoice()}

              {/* ========================================================================= */}
              {/* NHẬN XÉT CỦA GIÁO VIÊN */}
              {/* ========================================================================= */}
              <div style={{ marginTop: '16px', marginBottom: '16px', padding: '0 20px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '12px', color: currentTheme.primary, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
                    backgroundColor: invoiceModal.template === 'midnight' ? '#1e293b' : '#ffffff',
                    color: invoiceModal.template === 'midnight' ? '#f8fafc' : '#111827'
                  }}
                />
              </div>

              {/* ========================================================================= */}
              {/* THÔNG ĐIỆP CẢM ƠN ONLINE THÂN THIỆN (KHÔNG CÓ CHỮ KÝ HÀNH CHÍNH) */}
              {/* ========================================================================= */}
              <div style={{ textAlign: 'center', padding: '12px 20px 20px 20px', borderTop: '1px dashed #d1d5db', color: invoiceModal.template === 'midnight' ? '#94a3b8' : '#6b7280', fontSize: '12px' }}>
                <div style={{ fontWeight: '500', color: currentTheme.primary, marginBottom: '2px' }}>
                  🌟 Cảm ơn Quý phụ huynh đã luôn đồng hành cùng các em trong suốt kỳ học!
                </div>
                <div>Phiếu học phí được tạo trực tuyến từ hệ thống quản lý học tập.</div>
              </div>

            </div>

          </Card>
        </div>
      )}

      {/* PRINT & RESPONSIVE STYLES */}
      <style>
        {`
          @media (max-width: 768px) {
            .desktop-bills-table {
              display: none !important;
            }
            .mobile-bills-cards {
              display: flex !important;
            }
          }
          @media (min-width: 769px) {
            .desktop-bills-table {
              display: block !important;
            }
            .mobile-bills-cards {
              display: none !important;
            }
          }

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
