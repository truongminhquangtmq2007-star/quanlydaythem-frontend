import './index.css'; 
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import StudentList from './pages/StudentList';
import ClassList from './pages/ClassList';
import ClassDetails from './pages/ClassDetails';
import StudentLogin from './pages/StudentLogin';
import StudentDashboard from './pages/StudentDashboard';
import TeacherCalendar from './pages/TeacherCalendar';
import AdminLayout from './components/AdminLayout'; 
import StudentLayout from './components/StudentLayout';
import TuitionManager from './pages/TuitionManager'; 
import DocumentManager from './pages/DocumentManager'; 
import ExamRoom from './pages/ExamRoom';
import ExamManagement from './pages/ExamManagement'; 
import StudentDocuments from './pages/StudentDocuments'; 
import ViewAnswers from './pages/ViewAnswers'; 
import TeacherManager from './pages/TeacherManager';
import axios from 'axios';

axios.defaults.baseURL = 'https://quanlydaythem-api.onrender.com';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ĐÃ SỬA Ở ĐÂY: Đặt trang Học sinh làm trang chủ mặc định (Public) */}
        <Route path="/" element={<Navigate to="/student/login" replace />} />
        
        {/* ĐƯỜNG DẪN ĐĂNG NHẬP */}
        <Route path="/login" element={<Login />} />  {/* <-- Đây là đường dẫn Giáo viên */}
        <Route path="/student/login" element={<StudentLogin />} /> {/* <-- Đây là đường dẫn Học sinh */}
        <Route path="/students/login" element={<Navigate to="/student/login" replace />} />
        
        {/* ================================================== */}
        {/* PHÒNG THI CÁCH LY (Nằm ngoài mọi Layout để Full màn hình) */}
        <Route path="/student/exams" element={<ExamRoom />} /> 
        <Route path="/student/view-answers/:docId" element={<ViewAnswers />} />
        {/* ================================================== */}

        {/* NHÓM: Dành cho Học sinh (Có Menu Học sinh) */}
        <Route element={<StudentLayout />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/documents" element={<StudentDocuments />} /> 
        </Route>

        {/* NHÓM: Dành cho Giáo viên (Có Menu Giáo viên) */}
        <Route element={<AdminLayout />}>
          <Route path="/students" element={<StudentList />} />
          <Route path="/classes" element={<ClassList />} /> 
          <Route path="/classes/:id" element={<ClassDetails />} /> 
          <Route path="/quan-ly-tien-do" element={<TeacherCalendar />} />
          <Route path="/quan-ly-tai-chinh" element={<TuitionManager />} />
          <Route path="/tai-lieu" element={<DocumentManager />} />
          <Route path="/quan-ly-thi" element={<ExamManagement />} />
          <Route path="/quan-ly-giao-vien" element={<TeacherManager />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;