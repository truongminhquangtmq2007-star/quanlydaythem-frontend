export interface Student {
  id: number;
  student_code?: string;
  full_name: string;
  phone_number?: string;
  school_name?: string;
  phone?: string;
  parent_phone?: string;
  school?: string;
  grade?: string;
  current_level?: string;
  status: string;
  learning_goals?: string;
  ai_evaluation?: any;
  created_at: string;
}

export interface ClassInfo {
  id: number;
  class_name: string;
  description?: string;
  teacher_id?: number;
  class_type?: string;
  meet_link?: string;
  schedule?: string;
  tuition_fee?: number;
  is_active?: boolean;
  created_at: string;
  current_students?: number;
}

export interface ClassMember {
  id: number;
  class_id: number;
  student_id: number;
  enroll_date?: string;
  status?: string;
  // Bổ sung các cột JOIN từ students
  full_name?: string;
  student_code?: string;
  phone?: string;
  school_name?: string;
}

export interface Session {
  id: number;
  class_id: number;
  session_date: string;
  start_time?: string;
  end_time?: string;
  content?: string;
  document_ids?: any;
  status?: string;
  is_published?: boolean;
  created_at?: string;
}

export interface Attendance {
  id: number;
  session_id: number;
  student_id: number;
  status: 'PRESENT' | 'LATE' | 'ABSENT_EXCUSED' | 'ABSENT_UNEXCUSED';
  notes?: string;
  absent_reason?: string;
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

