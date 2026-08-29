import './index.css'; 
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import StudentManagement from './pages/StudentManagement';
import StudentProfile360 from './pages/StudentProfile360';
import ClassManagement from './pages/ClassManagement';
import ClassDetail from './pages/ClassDetail';
import StudentLogin from './pages/StudentLogin';
import StudentDashboard from './pages/StudentDashboard';
import StudentSchedule from './pages/StudentSchedule';
import TeacherCalendar from './pages/TeacherCalendar';
import AdminLayout from './components/AdminLayout'; 
import StudentLayout from './components/StudentLayout';
import TuitionManager from './pages/TuitionManager'; 
import DocumentLibrary from './pages/DocumentLibrary';
import ExamRoom from './pages/ExamRoom';
import ExamManagement from './pages/ExamManagement'; 
import StudentDocuments from './pages/StudentDocuments'; 
import ViewAnswers from './pages/ViewAnswers'; 
import TeacherManager from './pages/TeacherManager';
import axiosClient from './api/axiosClient';
import CreateExamAI from './pages/CreateExamAI';
import ExamEditor from './pages/ExamEditor';
import ParentReport from './pages/ParentReport';
import TeacherProfile from './pages/TeacherProfile';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';



function App() {
  return (
    <AuthProvider>
      <ToastContainer />
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
          <Route path="/student/schedule" element={<StudentSchedule />} />
          <Route path="/student/documents" element={<StudentDocuments />} /> 
        </Route>

        {/* NHÓM: Dành cho Giáo viên (Có Menu Giáo viên) */}
        <Route element={<AdminLayout />}>
          <Route path="/students" element={<StudentManagement />} />
          <Route path="/students/:id" element={<StudentProfile360 />} />
          <Route path="/students/:id/report" element={<ParentReport />} />
          <Route path="/classes" element={<ClassManagement />} /> 
          <Route path="/classes/:id" element={<ClassDetail />} /> 
          <Route path="/quan-ly-tien-do" element={<TeacherCalendar />} />
          <Route path="/quan-ly-tai-chinh" element={<TuitionManager />} />
          <Route path="/quan-ly-hoc-phi" element={<TuitionManager />} />
          <Route path="/tai-lieu" element={<DocumentLibrary />} />
          <Route path="/exam-editor" element={<ExamEditor />} />
          <Route path="/quan-ly-thi" element={<ExamManagement />} />
          <Route path="/quan-ly-giao-vien" element={<TeacherManager />} />
          <Route path="/admin/create-exam" element={<CreateExamAI />} />
          <Route path="/ho-so" element={<TeacherProfile />} />
        </Route>

      </Routes>
    </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
