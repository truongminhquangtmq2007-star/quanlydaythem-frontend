import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';

interface Student {
  id: number;
  full_name: string;
  phone_number: string;
}

// Thêm interface cho Giáo viên
interface Teacher {
  id: number;
  full_name: string;
  username: string;
}

const ClassDetails = () => {
  const { id: classId } = useParams(); 
  const navigate = useNavigate();

  // State cho Học sinh
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [message, setMessage] = useState('');

  // State cho Giáo viên
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [teacherMessage, setTeacherMessage] = useState('');

  const fetchClassDetails = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    // 1. Tải danh sách TẤT CẢ học sinh
    try {
      const allStudentsRes = await axios.get('http://localhost:5000/api/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllStudents(allStudentsRes.data);
    } catch (error) {
      console.error('Lỗi tải danh sách tất cả học sinh:', error);
    }

    // 2. Tải danh sách học sinh ĐÃ GHI DANH
    try {
      const enrolledRes = await axios.get(`http://localhost:5000/api/enrollments/${classId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEnrolledStudents(enrolledRes.data);
    } catch (error) {
      console.error('Lỗi tải danh sách học sinh trong lớp:', error);
    }

    // 3. Tải danh sách GIÁO VIÊN (Thêm mới)
    try {
      const teachersRes = await axios.get('http://localhost:5000/api/teachers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeachers(teachersRes.data);
    } catch (error) {
      console.error('Lỗi tải danh sách giáo viên:', error);
    }
  };

  useEffect(() => {
    fetchClassDetails();
  }, [classId, navigate]);

  // Hàm xử lý Ghép Học Sinh (Giữ nguyên)
  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    const token = localStorage.getItem('token');
    try {
      await axios.post('http://localhost:5000/api/enrollments', {
        student_id: Number(selectedStudentId),
        class_id: Number(classId)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage('✅ Đã thêm học sinh vào lớp!');
      setSelectedStudentId('');
      fetchClassDetails(); 
    } catch (error: any) {
      setMessage(`❌ Lỗi: ${error.response?.data?.message || 'Không thể thêm học sinh này'}`);
    }
  };

  // Hàm xử lý Phân công Giáo viên (Thêm mới)
  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId) return;

    const token = localStorage.getItem('token');
    try {
      await axios.put(`http://localhost:5000/api/classes/${classId}/assign-teacher`, {
        teacher_id: Number(selectedTeacherId)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setTeacherMessage('✅ Đã phân công giáo viên thành công!');
      setSelectedTeacherId('');
      // Không cần load lại trang, chỉ cần hiện thông báo thành công là đủ
    } catch (error: any) {
      setTeacherMessage(`❌ Lỗi: ${error.response?.data?.message || 'Không thể phân công giáo viên'}`);
    }
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <Link to="/classes" style={{ textDecoration: 'none', color: '#6c757d', marginBottom: '20px', display: 'inline-block' }}>
        ⬅ Quay lại danh sách lớp
      </Link>

      <h2>Chi Tiết Lớp Học (ID: {classId})</h2>

      {/* THÊM MỚI: Form phân công Giáo viên */}
      <div style={{ backgroundColor: '#fff7ed', padding: '20px', borderRadius: '8px', marginTop: '20px', border: '1px solid #ffedd5' }}>
        <h3 style={{ color: '#ea580c', marginTop: 0 }}>👨‍🏫 Phân công Giáo viên phụ trách</h3>
        <form onSubmit={handleAssignTeacher} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select 
            value={selectedTeacherId} 
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            style={{ padding: '8px', flex: 1, borderRadius: '5px', border: '1px solid #fdba74' }}
            required
          >
            <option value="">-- Chọn Giáo viên từ danh sách --</option>
            {teachers.map(teacher => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.full_name || teacher.username}
              </option>
            ))}
          </select>
          <button type="submit" style={{ padding: '8px 20px', backgroundColor: '#f97316', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
            Lưu phân công
          </button>
        </form>
        {teacherMessage && <p style={{ marginTop: '10px', fontWeight: 'bold', color: teacherMessage.includes('❌') ? 'red' : 'green' }}>{teacherMessage}</p>}
      </div>

      {/* Form thêm học sinh vào lớp (Giữ nguyên của bạn) */}
      <div style={{ backgroundColor: '#f0f8ff', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
        <h3 style={{ marginTop: 0 }}>➕ Ghép Học Sinh Vào Lớp</h3>
        <form onSubmit={handleEnroll} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select 
            value={selectedStudentId} 
            onChange={(e) => setSelectedStudentId(e.target.value)}
            style={{ padding: '8px', flex: 1, borderRadius: '5px', border: '1px solid #ccc' }}
            required
          >
            <option value="">-- Chọn học sinh từ danh sách --</option>
            {allStudents.map(student => (
              <option key={student.id} value={student.id}>
                {student.full_name} (SĐT: {student.phone_number})
              </option>
            ))}
          </select>
          <button type="submit" style={{ padding: '8px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
            Thêm vào lớp
          </button>
        </form>
        {message && <p style={{ marginTop: '10px', fontWeight: 'bold', color: message.includes('❌') ? 'red' : 'green' }}>{message}</p>}
      </div>

      {/* Bảng danh sách học sinh của lớp (Giữ nguyên của bạn) */}
      <h3 style={{ marginTop: '30px' }}>Danh sách học sinh đang học</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <thead>
          <tr style={{ backgroundColor: '#e9ecef', textAlign: 'left' }}>
            <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>ID Học Sinh</th>
            <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Họ và Tên</th>
            <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Số điện thoại</th>
          </tr>
        </thead>
        <tbody>
          {enrolledStudents.length === 0 ? (
            <tr><td colSpan={3} style={{ padding: '12px', textAlign: 'center' }}>Chưa có học sinh nào trong lớp này.</td></tr>
          ) : (
            enrolledStudents.map((student) => (
              <tr key={student.id}>
                <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>#{student.id}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>{student.full_name}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{student.phone_number}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ClassDetails;