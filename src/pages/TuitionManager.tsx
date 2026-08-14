import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import moment from 'moment';

const TuitionManager = () => {
  const [bills, setBills] = useState<any[]>([]);
  // Mặc định chọn tháng hiện tại (Ví dụ: '2026-08')
  const [selectedMonth, setSelectedMonth] = useState(moment().format('YYYY-MM'));
  const [stats, setStats] = useState({ totalExpected: 0, totalReceived: 0, totalPending: 0 });

  const fetchBills = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get('[https://quanlydaythem-api.onrender.com](https://quanlydaythem-api.onrender.com)/api/bills', { headers: { Authorization: `Bearer ${token}` } });
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
      await axios.put(`[https://quanlydaythem-api.onrender.com](https://quanlydaythem-api.onrender.com)/api/bills/${id}/pay`, {}, { headers: { Authorization: `Bearer ${token}` } });
      alert('✅ Đã ghi nhận doanh thu thành công! Học sinh đã được cấp tem.');
      fetchBills(); 
    } catch (error) { alert('❌ Lỗi hệ thống.'); }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '100%', boxSizing: 'border-box' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '35px', paddingBottom: '15px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '30px' }}>Quản lý Tài chính</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>Lưu trữ phiếu học phí, xác nhận thanh toán và theo dõi doanh thu.</p>
        </div>
        
        {/* BỘ LỌC THÁNG DOANH THU */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: 'white', padding: '10px 20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}>
          <span style={{ fontWeight: 'bold', color: '#475569' }}>📅 Kỳ kế toán:</span>
          <input 
            type="month" 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)} 
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontWeight: 'bold', color: '#1d4ed8', cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* DASHBOARD THỐNG KÊ (Thay đổi theo tháng) */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '35px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '220px', backgroundColor: 'white', padding: '25px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#64748b', textTransform: 'uppercase', fontSize: '13px' }}>Tổng hóa đơn tháng này</h4>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: '32px' }}>{stats.totalExpected.toLocaleString('vi-VN')} <span style={{ fontSize: '16px', color: '#94a3b8' }}>đ</span></h2>
        </div>
        <div style={{ flex: 1, minWidth: '220px', backgroundColor: 'white', padding: '25px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)', borderBottom: '4px solid #10b981' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#64748b', textTransform: 'uppercase', fontSize: '13px' }}>✅ Đã thu (Thực tế)</h4>
          <h2 style={{ margin: 0, color: '#10b981', fontSize: '32px' }}>{stats.totalReceived.toLocaleString('vi-VN')} <span style={{ fontSize: '16px', color: '#94a3b8' }}>đ</span></h2>
        </div>
        <div style={{ flex: 1, minWidth: '220px', backgroundColor: 'white', padding: '25px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)', borderBottom: '4px solid #ef4444' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#64748b', textTransform: 'uppercase', fontSize: '13px' }}>⏳ Đang chờ phụ huynh nộp</h4>
          <h2 style={{ margin: 0, color: '#ef4444', fontSize: '32px' }}>{stats.totalPending.toLocaleString('vi-VN')} <span style={{ fontSize: '16px', color: '#94a3b8' }}>đ</span></h2>
        </div>
      </div>

      {/* DANH SÁCH PHIẾU THU */}
      <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        <div style={{ padding: '25px', borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ margin: 0, color: '#0f172a', fontSize: '20px' }}>Chi tiết giao dịch {moment(selectedMonth).format('[Tháng] MM/YYYY')}</h3>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '18px 25px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>Mã phiếu</th>
                <th style={{ padding: '18px 25px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>Học viên</th>
                <th style={{ padding: '18px 25px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>Giai đoạn tính tiền</th>
                <th style={{ padding: '18px 25px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>Tổng tiền</th>
                <th style={{ padding: '18px 25px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>Trạng thái</th>
                <th style={{ padding: '18px 25px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {bills.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Không có hóa đơn nào trong tháng này.</td></tr>
              ) : (
                bills.map((b) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9', transition: '0.2s', backgroundColor: b.is_paid ? 'white' : '#fef2f2' }}>
                    <td style={{ padding: '20px 25px', fontWeight: 'bold', color: '#64748b' }}>#{b.id}</td>
                    <td style={{ padding: '20px 25px', fontWeight: 'bold', color: '#0f172a' }}>{b.full_name}</td>
                    <td style={{ padding: '20px 25px', color: '#475569' }}>
                      {new Date(b.start_date).toLocaleDateString('vi-VN')} - {new Date(b.end_date).toLocaleDateString('vi-VN')}
                    </td>
                    <td style={{ padding: '20px 25px', fontWeight: 'bold', color: '#1e293b' }}>
                      {b.total_amount.toLocaleString('vi-VN')}đ
                    </td>
                    <td style={{ padding: '20px 25px', textAlign: 'center' }}>
                      {b.is_paid ? (
                        <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}>Đã thu</span>
                      ) : (
                        <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}>Chờ thanh toán</span>
                      )}
                    </td>
                    <td style={{ padding: '20px 25px', textAlign: 'center' }}>
                      {!b.is_paid ? (
                        <button onClick={() => handleConfirmPayment(b.id)} style={{ padding: '8px 15px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)' }}>
                          ✅ Xác nhận thu
                        </button>
                      ) : (
                        <span style={{ color: '#cbd5e1', fontWeight: 'bold' }}>Hoàn tất</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TuitionManager;