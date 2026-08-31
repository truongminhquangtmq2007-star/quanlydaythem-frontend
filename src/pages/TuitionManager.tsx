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

// 6 Truly Distinct Premium Templates with distinct art directions & layout architectures
const TEMPLATES = [
  { id: 'editorial', name: '01 Editorial Luxe', desc: 'Tạp chí cao cấp, serif tinh tế' },
  { id: 'swiss', name: '02 Swiss Grid', desc: 'Lưới 3 cột chuẩn quốc tế' },
  { id: 'vintage', name: '03 Vintage Stationery', desc: 'Giấy ivory, khung viền cổ điển' },
  { id: 'midnight', name: '04 Midnight Luxury', desc: 'Nền tối obsidian, timeline phát sáng' },
  { id: 'organic', name: '05 Organic Lifestyle', desc: 'Đường cong mềm, bố cục pastel ấm' },
  { id: 'statement', name: '06 Statement Contemporary', desc: 'Hero số tiền khổng lồ, type-first' }
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
    template: 'editorial', // 6 distinct templates
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

  // RENDERER 01: EDITORIAL LUXE (Magazine / Editorial Stationery)
  const renderEditorialInvoice = () => (
    <div style={{ padding: invoiceModal.paperSize === 'A5' ? '12px' : '24px', fontFamily: '"Times New Roman", Times, Georgia, serif', color: '#111827' }}>
      <div style={{ textAlign: 'center', borderBottom: `1px solid ${currentTheme.primary}40`, paddingBottom: '16px', marginBottom: '22px' }}>
        <div style={{ fontSize: '11px', letterSpacing: '4px', textTransform: 'uppercase', color: currentTheme.primary, fontWeight: 'bold' }}>
          ACADEMIC TUITION STATEMENT
        </div>
        <h1 style={{ margin: '8px 0 4px 0', fontSize: '32px', fontWeight: 'normal', letterSpacing: '1px' }}>
          PHIẾU HỌC PHÍ
        </h1>
        <div style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic', fontFamily: 'system-ui, sans-serif' }}>
          Kỳ học: {moment(invoiceModal.bill.start_date).format('DD/MM/YYYY')} — {moment(invoiceModal.bill.end_date).format('DD/MM/YYYY')} • Mã hồ sơ: #{invoiceModal.bill.id}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #e5e7eb', paddingBottom: '14px', marginBottom: '22px', fontFamily: 'system-ui, sans-serif' }}>
        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '1px' }}>HỌC VIÊN</div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#111827', marginTop: '2px', fontFamily: 'Georgia, serif' }}>
            {invoiceModal.bill.full_name}
          </div>
          <div style={{ fontSize: '13px', color: '#4b5563', marginTop: '2px' }}>
            Lớp: <strong>{invoiceModal.bill.class_name}</strong> {invoiceModal.bill.teacher_name && `• GV: ${invoiceModal.bill.teacher_name}`}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '1px' }}>HỌC PHÍ KỲ NÀY</div>
          <div style={{ fontSize: '30px', fontWeight: 'bold', color: currentTheme.primary, fontFamily: 'Georgia, serif' }}>
            {Number(invoiceModal.bill.total_amount).toLocaleString('vi-VN')} ₫
          </div>
          <div style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic' }}>
            {numberToVietnameseWords(Number(invoiceModal.bill.total_amount) || 0)}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: currentTheme.primary, fontWeight: 'bold', marginBottom: '12px', fontFamily: 'system-ui, sans-serif' }}>
          CHI TIẾT CÁC BUỔI HỌC ({totalSessions} BUỔI)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sessions.map((s: any, idx: number) => {
            const { statusLabel, statusColor, contentText } = getSessionRowData(s);
            return (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: '13px', fontFamily: 'system-ui, sans-serif' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontWeight: 'bold', width: '90px', color: '#111827' }}>{moment(s.session_date).format('DD/MM/YYYY')}</span>
                  <span style={{ color: '#4b5563' }}>{contentText}</span>
                </div>
                <span style={{ fontWeight: 'bold', color: statusColor, fontSize: '12px' }}>{statusLabel}</span>
              </div>
            );
          })}
        </div>
      </div>

      {hasAssessments && (
        <div style={{ marginBottom: '24px', backgroundColor: '#fafafa', padding: '14px 18px', border: '1px solid #eaeaea', borderRadius: '4px', fontFamily: 'system-ui, sans-serif' }}>
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

      <div style={{ borderTop: `1px solid ${currentTheme.primary}40`, paddingTop: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', fontFamily: 'system-ui, sans-serif' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: currentTheme.primary, textTransform: 'uppercase', letterSpacing: '1px' }}>THÔNG TIN CHUYỂN KHOẢN:</div>
          {isBankConfigured ? (
            <div style={{ fontSize: '13px', color: '#4b5563', marginTop: '4px', lineHeight: '1.5' }}>
              <div>Ngân hàng: <strong>{teacherBank.bank_name || teacherBank.bank_code}</strong></div>
              <div>Số tài khoản: <strong style={{ letterSpacing: '0.5px' }}>{teacherBank.account_number}</strong></div>
              <div>Chủ tài khoản: <strong>{teacherBank.account_name}</strong></div>
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: '#d97706', fontStyle: 'italic', marginTop: '4px' }}>
              Chưa cấu hình tài khoản nhận học phí. Vui lòng cập nhật trong Cài đặt tài khoản.
            </div>
          )}
        </div>
        {isBankConfigured && (
          <div style={{ textAlign: 'center', backgroundColor: '#ffffff', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
            <img src={qrUrl} alt="QR Chuyển khoản" style={{ width: '115px', height: '115px', objectFit: 'contain', display: 'block' }} />
            <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>{teacherBank.bank_code} • {teacherBank.account_number}</div>
          </div>
        )}
      </div>
    </div>
  );

  // RENDERER 02: SWISS GRID (Strict 3-Column Asymmetric International Style)
  const renderSwissInvoice = () => (
    <div style={{ padding: invoiceModal.paperSize === 'A5' ? '12px' : '20px', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#000000', backgroundColor: '#ffffff' }}>
      <div style={{ borderBottom: '3px solid #000000', paddingBottom: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase' }}>SWISS TUITION STATEMENT</div>
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '900', letterSpacing: '-1px' }}>HỌC PHÍ</h1>
        </div>
        <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>
          #{invoiceModal.bill.id} / {moment(invoiceModal.bill.start_date).format('MM.YYYY')}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: invoiceModal.paperSize === 'A5' ? '130px 1fr 140px' : '170px 1fr 180px', gap: '20px', marginBottom: '20px' }}>
        {/* Left Column: Metadata Rail */}
        <div style={{ borderRight: '1px solid #000000', paddingRight: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <div style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', color: '#6b7280' }}>HỌC VIÊN</div>
            <div style={{ fontSize: '16px', fontWeight: '900', marginTop: '2px' }}>{invoiceModal.bill.full_name}</div>
          </div>
          <div>
            <div style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', color: '#6b7280' }}>LỚP HỌC</div>
            <div style={{ fontSize: '13px', fontWeight: '700' }}>{invoiceModal.bill.class_name}</div>
          </div>
          <div>
            <div style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', color: '#6b7280' }}>KỲ THU</div>
            <div style={{ fontSize: '11px', fontWeight: '600' }}>{moment(invoiceModal.bill.start_date).format('DD.MM')} — {moment(invoiceModal.bill.end_date).format('DD.MM.YY')}</div>
          </div>
          <div>
            <div style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', color: '#6b7280' }}>GIÁO VIÊN</div>
            <div style={{ fontSize: '12px', fontWeight: '600' }}>{invoiceModal.bill.teacher_name || 'Giáo viên'}</div>
          </div>
        </div>

        {/* Center Column: Session Rows with Big Sequence Numbers */}
        <div>
          <div style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', borderBottom: '2px solid #000000', paddingBottom: '6px', marginBottom: '10px' }}>
            DANH MỤC BUỔI HỌC ({totalSessions})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sessions.map((s: any, idx: number) => {
              const { statusLabel, statusColor, contentText } = getSessionRowData(s);
              const seq = String(idx + 1).padStart(2, '0');
              return (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '24px 75px 1fr 65px', gap: '8px', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px', fontSize: '12px' }}>
                  <span style={{ fontWeight: '900', color: '#9ca3af' }}>{seq}</span>
                  <span style={{ fontWeight: '700' }}>{moment(s.session_date).format('DD.MM.YY')}</span>
                  <span style={{ color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{contentText}</span>
                  <span style={{ fontWeight: '800', color: statusColor, textAlign: 'right', fontSize: '11px' }}>{statusLabel}</span>
                </div>
              );
            })}
          </div>

          {hasAssessments && (
            <div style={{ marginTop: '16px', borderTop: '2px solid #000000', paddingTop: '8px' }}>
              <div style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '6px' }}>ĐÁNH GIÁ & ĐIỂM:</div>
              {selectedAssessments.map((a: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '2px 0' }}>
                  <span>{moment(a.assessment_date).format('DD.MM')} {a.title}</span>
                  <span style={{ fontWeight: '900' }}>{a.score}đ</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Payment & QR Rail */}
        <div style={{ borderLeft: '1px solid #000000', paddingLeft: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', color: '#6b7280' }}>TỔNG HỌC PHÍ</div>
            <div style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-0.5px', marginTop: '2px', color: currentTheme.primary }}>
              {Number(invoiceModal.bill.total_amount).toLocaleString('vi-VN')} ₫
            </div>
            <div style={{ fontSize: '10px', color: '#6b7280', fontStyle: 'italic', marginTop: '4px', lineHeight: '1.3' }}>
              {numberToVietnameseWords(Number(invoiceModal.bill.total_amount) || 0)}
            </div>
          </div>

          {isBankConfigured ? (
            <div style={{ marginTop: '16px' }}>
              <div style={{ backgroundColor: '#ffffff', border: '2px solid #000000', padding: '6px', textAlign: 'center' }}>
                <img src={qrUrl} alt="QR" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'contain', display: 'block' }} />
                <div style={{ fontSize: '9px', fontWeight: '900', marginTop: '4px' }}>{teacherBank.bank_code} • {teacherBank.account_number}</div>
              </div>
              <div style={{ fontSize: '9px', color: '#4b5563', marginTop: '6px', lineHeight: '1.3' }}>
                {teacherBank.account_name}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '10px', color: '#9ca3af', fontStyle: 'italic' }}>Chưa cấu hình tài khoản</div>
          )}
        </div>
      </div>
    </div>
  );

  // RENDERER 03: VINTAGE STATIONERY (Engraved Border & Classical Ledger)
  const renderVintageInvoice = () => (
    <div style={{ padding: invoiceModal.paperSize === 'A5' ? '14px' : '22px', backgroundColor: '#fdfbf7', border: '2px solid #d4cbbd', outline: '1px solid #d4cbbd', outlineOffset: '-6px', fontFamily: '"Times New Roman", Times, Georgia, serif', color: '#2d251e' }}>
      <div style={{ textAlign: 'center', borderBottom: '1px double #b8ada0', paddingBottom: '14px', marginBottom: '20px' }}>
        <div style={{ fontSize: '10px', letterSpacing: '4px', textTransform: 'uppercase', color: '#786c5f' }}>✦ PHIẾU BÁO HỌC PHÍ ĐỊNH KỲ ✦</div>
        <h1 style={{ margin: '6px 0 2px 0', fontSize: '26px', fontWeight: 'normal', letterSpacing: '1px', color: '#2d251e' }}>GIẤY BÁO HỌC PHÍ</h1>
        <div style={{ fontSize: '12px', color: '#786c5f', fontStyle: 'italic' }}>
          Số hồ sơ: #{invoiceModal.bill.id} • Kỳ thu: {moment(invoiceModal.bill.start_date).format('DD/MM/YYYY')} đến {moment(invoiceModal.bill.end_date).format('DD/MM/YYYY')}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', borderBottom: '1px dashed #dcd5c9', paddingBottom: '14px' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#786c5f' }}>Kính gửi Quý phụ huynh học sinh:</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a130e', marginTop: '2px' }}>{invoiceModal.bill.full_name}</div>
          <div style={{ fontSize: '12.5px', color: '#594d40', marginTop: '2px' }}>Lớp: <strong>{invoiceModal.bill.class_name}</strong></div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: '#786c5f' }}>Số tiền học phí:</div>
          <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#1a130e' }}>
            {Number(invoiceModal.bill.total_amount).toLocaleString('vi-VN')} ₫
          </div>
          <div style={{ fontSize: '11px', color: '#786c5f', fontStyle: 'italic' }}>
            ({numberToVietnameseWords(Number(invoiceModal.bill.total_amount) || 0)})
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '20px', border: '1px solid #d4cbbd', backgroundColor: '#fcfaf6' }}>
        <div style={{ backgroundColor: '#f4ede2', padding: '6px 10px', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', color: '#594d40', borderBottom: '1px solid #d4cbbd' }}>
          BẢNG GHI NHẬN HỌC TẬP & ĐIỂM DANH ({totalSessions} BUỔI)
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #d4cbbd', color: '#786c5f', fontSize: '11px', textTransform: 'uppercase' }}>
              <th style={{ padding: '6px 10px', textAlign: 'left', width: '90px' }}>Ngày</th>
              <th style={{ padding: '6px 10px', textAlign: 'left', width: '100px' }}>Điểm danh</th>
              <th style={{ padding: '6px 10px', textAlign: 'left' }}>Nội dung bài học</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s: any, idx: number) => {
              const { statusLabel, statusColor, contentText } = getSessionRowData(s);
              return (
                <tr key={idx} style={{ borderBottom: '1px solid #ede5d8' }}>
                  <td style={{ padding: '7px 10px', fontWeight: 'bold' }}>{moment(s.session_date).format('DD/MM/YYYY')}</td>
                  <td style={{ padding: '7px 10px', color: statusColor, fontWeight: 'bold' }}>{statusLabel}</td>
                  <td style={{ padding: '7px 10px', color: '#4a3f35' }}>{contentText}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hasAssessments && (
        <div style={{ marginBottom: '20px', border: '1px solid #d4cbbd', padding: '10px 14px', backgroundColor: '#f9f6f0' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#594d40', fontWeight: 'bold', marginBottom: '6px' }}>
            KẾT QUẢ ĐÁNH GIÁ ĐỊNH KỲ:
          </div>
          {selectedAssessments.map((a: any, idx: number) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '12px' }}>
              <span>{moment(a.assessment_date).format('DD/MM/YYYY')} — {a.title}</span>
              <span style={{ fontWeight: 'bold' }}>{a.score} điểm</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ borderTop: '1px double #b8ada0', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '12px', color: '#594d40', lineHeight: '1.5' }}>
          {isBankConfigured ? (
            <>
              <div>Ngân hàng: <strong>{teacherBank.bank_name || teacherBank.bank_code}</strong></div>
              <div>Số tài khoản: <strong>{teacherBank.account_number}</strong></div>
              <div>Chủ tài khoản: <strong>{teacherBank.account_name}</strong></div>
            </>
          ) : (
            <div style={{ fontStyle: 'italic', color: '#8c7d6e' }}>Chưa cấu hình tài khoản nhận chuyển khoản.</div>
          )}
        </div>
        {isBankConfigured && (
          <div style={{ textAlign: 'center', backgroundColor: '#ffffff', padding: '6px', border: '1px solid #d4cbbd' }}>
            <img src={qrUrl} alt="QR" style={{ width: '105px', height: '105px', objectFit: 'contain', display: 'block' }} />
            <div style={{ fontSize: '9px', color: '#786c5f', marginTop: '3px' }}>{teacherBank.bank_code} • {teacherBank.account_number}</div>
          </div>
        )}
      </div>
    </div>
  );

  // RENDERER 04: MIDNIGHT LUXURY (Obsidian Canvas with Vertical Glowing Timeline & Pure White QR Quiet Zone)
  const renderMidnightInvoice = () => (
    <div style={{ padding: invoiceModal.paperSize === 'A5' ? '14px' : '24px', backgroundColor: '#0b0f19', color: '#f8fafc', borderRadius: '12px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #1e293b', paddingBottom: '16px', marginBottom: '20px' }}>
        <div>
          <span style={{ fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: currentTheme.primary, fontWeight: 'bold' }}>OBSIDIAN STATEMENT</span>
          <h1 style={{ margin: '4px 0', fontSize: '26px', fontWeight: '800', color: '#ffffff' }}>{invoiceModal.bill.full_name}</h1>
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>Lớp: <strong style={{ color: '#f8fafc' }}>{invoiceModal.bill.class_name}</strong> • Kỳ: {moment(invoiceModal.bill.start_date).format('DD/MM')} — {moment(invoiceModal.bill.end_date).format('DD/MM/YYYY')}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: '#64748b' }}>#{invoiceModal.bill.id}</div>
          <div style={{ fontSize: '26px', fontWeight: '900', color: currentTheme.primary, marginTop: '2px' }}>
            {Number(invoiceModal.bill.total_amount).toLocaleString('vi-VN')} ₫
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: invoiceModal.paperSize === 'A5' ? '1fr 140px' : '1fr 170px', gap: '20px', marginBottom: '20px' }}>
        {/* Connected Vertical Timeline */}
        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', fontWeight: 'bold', marginBottom: '14px' }}>
            HÀNH TRÌNH HỌC TẬP ({totalSessions} BUỔI):
          </div>
          <div style={{ position: 'relative', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '14px', borderLeft: `2px solid ${currentTheme.primary}40` }}>
            {sessions.map((s: any, idx: number) => {
              const { statusLabel, statusColor, contentText } = getSessionRowData(s);
              return (
                <div key={idx} style={{ position: 'relative' }}>
                  {/* Glowing timeline node */}
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
            <div style={{ marginTop: '18px', backgroundColor: '#1e293b', padding: '12px 14px', borderRadius: '8px' }}>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: currentTheme.primary, fontWeight: 'bold', marginBottom: '6px' }}>ĐÁNH GIÁ & ĐIỂM:</div>
              {selectedAssessments.map((a: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '12px' }}>
                  <span style={{ color: '#cbd5e1' }}>{moment(a.assessment_date).format('DD/MM')} — {a.title}</span>
                  <span style={{ fontWeight: 'bold', color: currentTheme.primary }}>{a.score}đ</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Rail: QR with Pure High-Contrast White Container Quiet Zone */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {isBankConfigured ? (
            <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
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

  // RENDERER 05: ORGANIC LIFESTYLE (Scandinavian Curves & Pastel Pods)
  const renderOrganicInvoice = () => (
    <div style={{ padding: invoiceModal.paperSize === 'A5' ? '14px' : '24px', backgroundColor: '#faf8f5', borderRadius: '24px', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#2d3748', border: '1px solid #ede8e1' }}>
      {/* Curved Hero Pod */}
      <div style={{ backgroundColor: currentTheme.lightBg, padding: '20px 24px', borderRadius: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${currentTheme.primary}25` }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: currentTheme.primary, textTransform: 'uppercase', letterSpacing: '1px' }}>🌱 THÔNG BÁO HỌC PHÍ</span>
          <h1 style={{ margin: '4px 0 2px 0', fontSize: '24px', fontWeight: '800', color: '#1a202c' }}>{invoiceModal.bill.full_name}</h1>
          <div style={{ fontSize: '13px', color: '#4a5568' }}>Lớp: <strong>{invoiceModal.bill.class_name}</strong> • Kỳ: {moment(invoiceModal.bill.start_date).format('DD/MM')} — {moment(invoiceModal.bill.end_date).format('DD/MM/YYYY')}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: '#718096' }}>#{invoiceModal.bill.id}</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: currentTheme.primary, marginTop: '2px' }}>
            {Number(invoiceModal.bill.total_amount).toLocaleString('vi-VN')} ₫
          </div>
        </div>
      </div>

      {/* Floating Organic Session Chips */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#4a5568', textTransform: 'uppercase', marginBottom: '10px' }}>
          DANH SÁCH BUỔI HỌC TRONG KỲ:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
          {sessions.map((s: any, idx: number) => {
            const { statusLabel, statusColor, contentText } = getSessionRowData(s);
            return (
              <div key={idx} style={{ backgroundColor: '#ffffff', padding: '12px 14px', borderRadius: '16px', border: '1px solid #ede8e1', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '13px', color: '#1a202c' }}>{moment(s.session_date).format('DD/MM/YYYY')}</strong>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px', backgroundColor: `${statusColor}18`, color: statusColor }}>{statusLabel}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#718096', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{contentText}</div>
              </div>
            );
          })}
        </div>
      </div>

      {hasAssessments && (
        <div style={{ marginBottom: '20px', backgroundColor: '#ffffff', padding: '14px 18px', borderRadius: '18px', border: '1px solid #ede8e1' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', color: currentTheme.primary, marginBottom: '8px' }}>KẾT QUẢ ĐÁNH GIÁ:</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {selectedAssessments.map((a: any, idx: number) => (
              <span key={idx} style={{ padding: '4px 10px', backgroundColor: currentTheme.lightBg, borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
                {a.title}: <strong>{a.score}đ</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Dual Rounded Pods */}
      <div style={{ display: 'grid', gridTemplateColumns: invoiceModal.paperSize === 'A5' ? '1fr 130px' : '1fr 160px', gap: '14px', alignItems: 'center' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: '18px', border: '1px solid #ede8e1' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#718096', textTransform: 'uppercase' }}>THÔNG TIN CHUYỂN KHOẢN</div>
          {isBankConfigured ? (
            <div style={{ fontSize: '13px', color: '#2d3748', marginTop: '4px', lineHeight: '1.4' }}>
              <div>Ngân hàng: <strong>{teacherBank.bank_name || teacherBank.bank_code}</strong></div>
              <div>STK: <strong>{teacherBank.account_number}</strong></div>
              <div>Chủ TK: <strong>{teacherBank.account_name}</strong></div>
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: '#d97706', fontStyle: 'italic' }}>Chưa cấu hình tài khoản</div>
          )}
        </div>
        {isBankConfigured && (
          <div style={{ backgroundColor: '#ffffff', padding: '10px', borderRadius: '18px', border: '1px solid #ede8e1', textAlign: 'center' }}>
            <img src={qrUrl} alt="QR" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'contain', display: 'block' }} />
            <div style={{ fontSize: '9px', color: '#718096', marginTop: '4px' }}>{teacherBank.bank_code} • {teacherBank.account_number}</div>
          </div>
        )}
      </div>
    </div>
  );

  // RENDERER 06: STATEMENT CONTEMPORARY (Big Type-First / Brutalist Hero Amount)
  const renderStatementInvoice = () => (
    <div style={{ padding: invoiceModal.paperSize === 'A5' ? '14px' : '24px', backgroundColor: '#ffffff', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#111827' }}>
      {/* Massive Hero Amount Header */}
      <div style={{ borderBottom: '4px solid #111827', paddingBottom: '16px', marginBottom: '22px' }}>
        <div style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', color: currentTheme.primary }}>
          OFFICIAL TUITION STATEMENT
        </div>
        <div style={{ fontSize: invoiceModal.paperSize === 'A5' ? '34px' : '44px', fontWeight: '900', letterSpacing: '-1.5px', margin: '4px 0', color: '#111827' }}>
          {Number(invoiceModal.bill.total_amount).toLocaleString('vi-VN')} ₫
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '800' }}>{invoiceModal.bill.full_name}</div>
            <div style={{ fontSize: '13px', color: '#4b5563', marginTop: '2px' }}>Lớp: <strong>{invoiceModal.bill.class_name}</strong></div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '12px', fontWeight: '700' }}>
            THÁNG {moment(invoiceModal.bill.start_date).format('MM / YYYY')} • #{invoiceModal.bill.id}
          </div>
        </div>
      </div>

      {/* Heavy Statement Numbered Blocks */}
      <div style={{ marginBottom: '22px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {sessions.map((s: any, idx: number) => {
            const { statusLabel, statusColor, contentText } = getSessionRowData(s);
            const seq = String(idx + 1).padStart(2, '0');
            return (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '40px 90px 1fr 100px', alignItems: 'center', borderBottom: '2px solid #111827', paddingBottom: '8px', fontSize: '13px' }}>
                <span style={{ fontSize: '16px', fontWeight: '900' }}>{seq}</span>
                <span style={{ fontWeight: '700' }}>{moment(s.session_date).format('DD/MM/YYYY')}</span>
                <span style={{ fontWeight: '500', color: '#374151' }}>{contentText}</span>
                <span style={{ fontWeight: '900', color: statusColor, textAlign: 'right', textTransform: 'uppercase', fontSize: '11px' }}>{statusLabel}</span>
              </div>
            );
          })}
        </div>
      </div>

      {hasAssessments && (
        <div style={{ marginBottom: '22px', border: '2px solid #111827', padding: '12px 16px' }}>
          <div style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>KẾT QUẢ ĐÁNH GIÁ:</div>
          {selectedAssessments.map((a: any, idx: number) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '700', padding: '3px 0' }}>
              <span>{moment(a.assessment_date).format('DD/MM')} — {a.title}</span>
              <span style={{ color: currentTheme.primary }}>{a.score} / 10</span>
            </div>
          ))}
        </div>
      )}

      {/* Bottom High-Impact QR Block */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #111827', paddingTop: '16px' }}>
        <div>
          <div style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', color: '#6b7280' }}>THÔNG TIN CHUYỂN KHOẢN:</div>
          {isBankConfigured ? (
            <div style={{ fontSize: '13px', fontWeight: '700', marginTop: '4px', lineHeight: '1.4' }}>
              <div>{teacherBank.bank_name || teacherBank.bank_code}</div>
              <div style={{ fontSize: '15px' }}>{teacherBank.account_number}</div>
              <div style={{ color: '#4b5563' }}>{teacherBank.account_name}</div>
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: '#d97706', fontStyle: 'italic' }}>Chưa cấu hình tài khoản</div>
          )}
        </div>
        {isBankConfigured && (
          <div style={{ border: '2px solid #111827', padding: '6px', textAlign: 'center' }}>
            <img src={qrUrl} alt="QR" style={{ width: '110px', height: '110px', objectFit: 'contain', display: 'block' }} />
            <div style={{ fontSize: '9px', fontWeight: '900', marginTop: '2px' }}>{teacherBank.bank_code} • {teacherBank.account_number}</div>
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
                  <Button onClick={() => setInvoiceModal({ show: false, bill: null, sessions: [], availableAssessments: [], selectedAssessmentIds: [], showAssessmentPicker: false, teacherBank: null, teacher_note: '', template: 'editorial', colorTheme: 'blue', customPrimaryColor: '', paperSize: 'A4' })} variant="ghost" size="sm">
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
                backgroundColor: invoiceModal.template === 'midnight' ? '#0b0f19' : invoiceModal.template === 'vintage' ? '#fdfbf7' : invoiceModal.template === 'organic' ? '#faf8f5' : '#ffffff'
              }}
            >
              {invoiceModal.template === 'editorial' && renderEditorialInvoice()}
              {invoiceModal.template === 'swiss' && renderSwissInvoice()}
              {invoiceModal.template === 'vintage' && renderVintageInvoice()}
              {invoiceModal.template === 'midnight' && renderMidnightInvoice()}
              {invoiceModal.template === 'organic' && renderOrganicInvoice()}
              {invoiceModal.template === 'statement' && renderStatementInvoice()}

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
