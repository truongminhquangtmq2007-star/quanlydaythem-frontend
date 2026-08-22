export interface Student {
  id: number;
  student_code?: string;
  full_name: string;
  phone?: string;
  parent_phone?: string;
  school?: string;
  grade?: string;
  current_level?: string;
  status: string;
  created_at: string;
}

export interface ClassInfo {
  id: number;
  class_code?: string;
  name: string;
  class_name?: string; // Tương thích cũ
  subject?: string;
  grade?: string;
  teacher_id?: number;
  max_students?: number;
  status: string;
  created_at: string;
}

export interface ClassMember {
  id: number;
  class_id: number;
  student_id: number;
  enroll_date: string;
  status: string;
  // Bổ sung các cột JOIN từ students
  full_name?: string;
  student_code?: string;
  phone?: string;
}

export interface Session {
  id: number;
  class_id: number;
  session_date: string;
  start_time?: string;
  end_time?: string;
  content?: string;
  document_ids?: any;
  status: string;
  created_at: string;
}

export interface Attendance {
  id: number;
  session_id: number;
  student_id: number;
  status: 'PRESENT' | 'LATE' | 'ABSENT_EXCUSED' | 'ABSENT_UNEXCUSED';
  note?: string;
  created_at: string;
  // JOIN
  full_name?: string;
  student_code?: string;
}

export interface DocumentInfo {
  id: number;
  document_code?: string;
  title: string;
  description?: string;
  type: 'LECTURE' | 'EXERCISE' | 'EXAM' | 'REFERENCE';
  file_url: string;
  grade?: string;
  subject?: string;
  created_at?: string;
  uploaded_at?: string; // Tương thích cũ
}

export interface Assignment {
  id: number;
  title: string;
  class_id: number;
  document_id: number;
  due_at: string;
  created_at: string;
  // Bổ sung JOIN DocumentInfo
  document_title?: string;
  file_url?: string;
  document_type?: string;
}

