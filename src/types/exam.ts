// =====================================================
// FRONTEND TYPE DEFINITIONS — Đồng bộ với Backend
// =====================================================

// Phần I: Trắc nghiệm 4 lựa chọn (A, B, C, D)
export interface MultipleChoiceQuestion {
  id: number;
  questionText: string;
  image_url?: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  context_id?: number;
}

// Phần II: Trắc nghiệm Đúng / Sai (Mỗi câu gồm 4 ý a, b, c, d)
export interface TrueFalseQuestion {
  id: number;
  questionText: string;
  image_url?: string;
  statements: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  correctAnswer: {
    a: 'Đ' | 'S';
    b: 'Đ' | 'S';
    c: 'Đ' | 'S';
    d: 'Đ' | 'S';
  };
  context_id?: number;
}

// Phần III: Trắc nghiệm Trả lời ngắn (Điền số / kết quả)
export interface ShortAnswerQuestion {
  id: number;
  questionText: string;
  image_url?: string;
  correctAnswer: string;
  context_id?: number;
}

// Ngữ cảnh chung / Câu hỏi chùm (Shared Context)
export interface SharedContext {
  id: number;
  content: string;
  image_url?: string;
  questionIds: number[];
  part?: string;
  questions?: (MultipleChoiceQuestion | TrueFalseQuestion | ShortAnswerQuestion | any)[];
  context_id?: number;
}

// Tổng thể bài thi
export interface FullExamData {
  part1: MultipleChoiceQuestion[];
  part2: TrueFalseQuestion[];
  part3: ShortAnswerQuestion[];
  shared_context?: SharedContext[];
  sharedContexts?: SharedContext[];
}

// Câu trả lời đơn lẻ của học sinh
export interface StudentAnswerItem {
  question_id: number | string;
  student_answer: string | { [statementKey: string]: 'Đ' | 'S' | string };
  part?: string;
}

// Cấu trúc payload khi học sinh nộp bài
export interface ExamSubmissionPayload {
  document_id?: number;
  exam_id?: number;
  student_answers?: {
    part1?: { [questionId: string]: string };
    part2?: { [questionId: string]: { [statement: string]: 'Đ' | 'S' } };
    part3?: { [questionId: string]: string };
    [key: string]: any;
  } | StudentAnswerItem[];
  answers?: StudentAnswerItem[];
  cheat_count?: number;
  time_taken_seconds?: number;
}

// Chi tiết kết quả từng ý Đ/S (Part 2)
export interface StatementResult {
  statement: string;
  student: string | null;
  correct: string | null;
  is_correct: boolean;
}

// Chi tiết đối chiếu từng câu (học sinh vs đáp án chuẩn)
export interface QuestionGradingDetail {
  question_id: number;
  part: string;
  student_answer: any;
  correct_answer: any;
  is_correct: boolean;
  score_earned: number;
  max_score: number;
  correct_statements_count?: number;
  statement_results?: StatementResult[];
}

// Thống kê từng phần
export interface PartSummary {
  correct: number;
  total: number;
  score: number;
}

// Kết quả chấm điểm bài thi — khớp với response từ Backend submitExam
export interface ExamGradingResult {
  message: string;
  submissionId: number;
  score: {
    totalScore: number;
    p1Score: number;
    p2Score: number;
    p3Score: number;
    allow_view_answers: boolean;
  };
  summary: {
    total_score: number;
    total_correct: number;
    total_questions: number;
    cheat_count: number;
    time_taken_seconds: number;
    part1: PartSummary;
    part2: PartSummary;
    part3: PartSummary;
  };
  cheat_count: number;
  details: QuestionGradingDetail[];
}

