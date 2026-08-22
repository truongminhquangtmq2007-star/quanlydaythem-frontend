import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

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
      const payRes = await axios.get('https://quanlydaythem-api.onrender.com/api/payments', { headers: { Authorization: `Bearer ${token}` } });
      setPayments(payRes.data);
    } catch (error) {
      console.error('Lỗi tải lịch sử học phí', error);
    }

    try {
      const stuRes = await axios.get('https://quanlydaythem-api.onrender.com/api/students', { headers: { Authorization: `Bearer ${token}` } });
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
        const res = await axios.get(`https://quanlydaythem-api.onrender.com/api/enrollments/student/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
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
      await axios.post('https://quanlydaythem-api.onrender.com/api/payments', {
        student_id: Number(studentId),
        class_id: Number(classId),
        amount: Number(amount),
        payment_method: paymentMethod,
        notes: notes
      }, { headers: { Authorization: `Bearer ${token}` } });
      
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
    <div style={{ padding: '30px', fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '2px solid #ddd' }}>
        <Link to="/students" style={{ textDecoration: 'none', color: '#6c757d', fontWeight: 'bold' }}>🎓 Học sinh</Link>
        <Link to="/classes" style={{ textDecoration: 'none', color: '#6c757d', fontWeight: 'bold' }}>🏫 Lớp học</Link>
        <Link to="/payments" style={{ textDecoration: 'none', color: '#28a745', fontWeight: 'bold' }}>💰 Học phí</Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Quản Lý Học Phí</h2>
        <button onClick={handleLogout} style={{ padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Đăng Xuất</button>
      </div>

      {/* 2. KHÓA FORM THU TIỀN: CHỈ ADMIN MỚI ĐƯỢC THAO TÁC */}
   
        <div style={{ backgroundColor: '#e8f5e9', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
          <h3>💵 Ghi Nhận Thu Tiền</h3>
          <form onSubmit={handleAddPayment} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select value={studentId} onChange={(e) => setStudentId(e.target.value)} style={{ padding: '8px', flex: 1 }} required>
                <option value="">-- Chọn Học Sinh --</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>

              <select 
                value={classId} 
                onChange={(e) => setClassId(e.target.value)} 
                style={{ padding: '8px', flex: 1 }} 
                required
                disabled={!studentId} 
              >
                <option value="">
                  {studentId ? '-- Chọn Lớp Học --' : 'Vui lòng chọn Học sinh trước'}
                </option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <input type="number" placeholder="Số tiền (VNĐ)" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ padding: '8px', flex: 1 }} required />
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ padding: '8px', flex: 1 }}>
                <option value="Chuyển khoản">Chuyển khoản</option>
                <option value="Tiền mặt">Tiền mặt</option>
              </select>
              <input type="text" placeholder="Ghi chú (Tháng mấy...)" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ padding: '8px', flex: 2 }} />
            </div>

            <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
              Lưu Giao Dịch
            </button>
          </form>
          {message && <p style={{ marginTop: '10px', fontWeight: 'bold', color: message.includes('❌') ? 'red' : 'green' }}>{message}</p>}
        </div>
     

      {/* 3. BẢNG LỊCH SỬ NẰM NGOÀI Ổ KHÓA -> AI CŨNG THẤY */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '30px' }}>
        <thead>
          <tr style={{ backgroundColor: '#e9ecef', textAlign: 'left' }}>
            <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Mã GD</th>
            <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Tên Học Sinh</th>
            <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Số Tiền</th>
            <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Ngày Thu</th>
            <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Ghi Chú</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((pay) => (
            <tr key={pay.id}>
              <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>#{pay.id}</td>
              <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>{pay.full_name}</td>
              <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6', color: '#28a745', fontWeight: 'bold' }}>
                {Number(pay.amount).toLocaleString('vi-VN')} VNĐ
              </td>
              <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                {new Date(pay.payment_date).toLocaleDateString('vi-VN')}
              </td>
              <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{pay.notes || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentList;
