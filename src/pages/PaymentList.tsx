import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';

interface Payment {
  id: number;
  full_name: string;
  amount: string;
  payment_date: string;
  payment_method: string;
  notes: string;
}

interface Student { id: number; full_name: string; }
interface ClassItem { id: number; class_name: string; }

const PaymentList = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]); 
  
  const [studentId, setStudentId] = useState('');
  const [classId, setClassId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Chuyển khoản');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');

  const navigate = useNavigate();

  // 1. LẤY QUYỀN TỪ LOCALSTORAGE
  const userRole = localStorage.getItem('role');

  const fetchInitialData = async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    try {
      const payRes = await axiosClient.get(`/api/payments`);
      setPayments(payRes.data);
    } catch (error) {
      console.error('Lỗi tải lịch sử học phí', error);
    }

    try {
      const stuRes = await axiosClient.get(`/api/students`);
      setStudents(stuRes.data);
    } catch (error) {
      console.error('Lỗi tải danh sách học sinh', error);
    }
  };

  useEffect(() => { 
    fetchInitialData(); 
  }, [navigate]);

  useEffect(() => {
    const fetchClassesForStudent = async () => {
      if (!studentId) {
        setClasses([]);
        setClassId('');
        return;
      }

      const token = localStorage.getItem('token');
      try {
        const res = await axiosClient.get(`/api/enrollments/student/${studentId}`);
        setClasses(res.data);
        setClassId(''); 
      } catch (error) {
        console.error('Lỗi tải lớp học của học sinh:', error);
      }
    };

    fetchClassesForStudent();
  }, [studentId]); 

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      await axiosClient.post(`/api/payments`, {
        student_id: Number(studentId),
        class_id: Number(classId),
        amount: Number(amount),
        payment_method: paymentMethod,
        notes: notes
      });
      
      setMessage('✅ Thu học phí thành công!');
      setStudentId(''); setClassId(''); setAmount(''); setNotes('');
      fetchInitialData(); 
    } catch (error: any) {
      setMessage(`❌ Lỗi: ${error.response?.data?.message || 'Không thể lưu học phí'}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div style={{ padding: 'var(--spacing-8)', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-5)', paddingBottom: 'var(--spacing-5)', borderBottom: '1px solid var(--color-border)' }}>
        <Link to="/students" style={{ textDecoration: 'none', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-bold)' }}>🎓 Học sinh</Link>
        <Link to="/classes" style={{ textDecoration: 'none', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-bold)' }}>🏫 Lớp học</Link>
        <Link to="/payments" style={{ textDecoration: 'none', color: 'var(--color-success)', fontWeight: 'var(--font-weight-bold)' }}>💰 Học phí</Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-5)' }}>
        <h2>Quản Lý Học Phí</h2>
        <Button onClick={handleLogout} variant="danger">Đăng Xuất</Button>
      </div>

      {/* 2. KHÓA FORM THU TIỀN: CHỈ ADMIN MỚI ĐƯỢC THAO TÁC */}
   
      <Card style={{ backgroundColor: 'var(--color-success-light)', marginTop: 'var(--spacing-5)' }}>
        <div style={{ padding: 'var(--spacing-6)' }}>
          <h3 style={{ marginTop: 0 }}>💵 Ghi Nhận Thu Tiền</h3>
          <form onSubmit={handleAddPayment} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            <div style={{ display: 'flex', gap: 'var(--spacing-4)' }}>
              <select value={studentId} onChange={(e) => setStudentId(e.target.value)} style={{ padding: 'var(--spacing-2)', flex: 1, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} required>
                <option value="">-- Chọn Học Sinh --</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>

              <select 
                value={classId} 
                onChange={(e) => setClassId(e.target.value)} 
                style={{ padding: 'var(--spacing-2)', flex: 1, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} 
                required
                disabled={!studentId} 
              >
                <option value="">
                  {studentId ? '-- Chọn Lớp Học --' : 'Vui lòng chọn Học sinh trước'}
                </option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: 'var(--spacing-4)' }}>
              <input type="number" placeholder="Số tiền (VNĐ)" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ padding: 'var(--spacing-2)', flex: 1, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} required />
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ padding: 'var(--spacing-2)', flex: 1, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <option value="Chuyển khoản">Chuyển khoản</option>
                <option value="Tiền mặt">Tiền mặt</option>
              </select>
              <input type="text" placeholder="Ghi chú (Tháng mấy...)" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ padding: 'var(--spacing-2)', flex: 2, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} />
            </div>

            <Button type="submit" variant="primary">
              Lưu Giao Dịch
            </Button>
          </form>
          {message && <p style={{ marginTop: 'var(--spacing-4)', marginBottom: 0, fontWeight: 'var(--font-weight-bold)', color: message.includes('❌') ? 'var(--color-danger)' : 'var(--color-success)' }}>{message}</p>}
        </div>
      </Card>
      
      {/* 3. BẢNG LỊCH SỬ NẰM NGOÀI Ổ KHÓA -> AI CŨNG THẤY */}
      <div style={{ marginTop: 'var(--spacing-8)' }}>
        <Card>
          <div className="overflow-x-auto" style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-background)' }}>
                  <th style={{ padding: 'var(--spacing-4)', borderBottom: '1px solid var(--color-border)' }}>Mã GD</th>
                  <th style={{ padding: 'var(--spacing-4)', borderBottom: '1px solid var(--color-border)' }}>Tên Học Sinh</th>
                  <th style={{ padding: 'var(--spacing-4)', borderBottom: '1px solid var(--color-border)' }}>Số Tiền</th>
                  <th style={{ padding: 'var(--spacing-4)', borderBottom: '1px solid var(--color-border)' }}>Ngày Thu</th>
                  <th style={{ padding: 'var(--spacing-4)', borderBottom: '1px solid var(--color-border)' }}>Ghi Chú</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 'var(--spacing-8)' }}>
                      <EmptyState title="Chưa có giao dịch" description="Chưa có thông tin thu học phí." />
                    </td>
                  </tr>
                ) : (
                  payments.map((pay) => (
                    <tr key={pay.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--spacing-4)' }}>#{pay.id}</td>
                      <td style={{ padding: 'var(--spacing-4)', fontWeight: 'var(--font-weight-bold)' }}>{pay.full_name}</td>
                      <td style={{ padding: 'var(--spacing-4)', color: 'var(--color-success)', fontWeight: 'var(--font-weight-bold)' }}>
                        {Number(pay.amount).toLocaleString('vi-VN')} VNĐ
                      </td>
                      <td style={{ padding: 'var(--spacing-4)' }}>
                        {new Date(pay.payment_date).toLocaleDateString('vi-VN')}
                      </td>
                      <td style={{ padding: 'var(--spacing-4)' }}>{pay.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PaymentList;
