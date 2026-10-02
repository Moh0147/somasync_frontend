export interface ClassPerformance {
  class_id: number
  class_name: string
  academic_year: number
  student_count: number
  avg_quiz_percentage: number | null
  avg_exam_percentage: number | null
}

export interface StudentPerformance {
  student_id: number
  username: string
  avg_quiz_percentage: number | null
  avg_exam_percentage: number | null
  lesson_completion_rate: number | null
}

export interface QuizPerformance {
  quiz_id: number
  title: string
  status: string
  attempt_count: number
  avg_percentage: number | null
}

export interface QuestionPerformance {
  question_id: number
  text: string
  question_type: string
  answered_count: number
  correct_count: number
  percent_correct: number | null
}

export interface LessonCompletion {
  lesson_id: number
  title: string
  status: string
  started_count: number
  completed_count: number
  completion_rate: number | null
}

export interface ExamPerformance {
  exam_id: number
  title: string
  status: string
  candidate_count: number
  avg_percentage: number | null
}

export interface SchoolOverview {
  school_id: number
  school_name: string
  student_count: number
  teacher_count: number
  class_count: number
  subject_count: number
  avg_quiz_percentage: number | null
  avg_exam_percentage: number | null
  lesson_completion_rate: number | null
}

export interface SubjectPerformance {
  subject_id: number
  name: string
  avg_quiz_percentage: number | null
  avg_exam_percentage: number | null
}

export interface SystemSchoolRow {
  school_id: number
  name: string
  code: string
  is_active: boolean
  student_count: number
  teacher_count: number
  admin_count: number
  class_count: number
}

export interface SystemUsers {
  total_users: number
  active_users: number
  by_role: Record<string, number>
}

export interface SystemDirectoryUser {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  phone_number: string
  role: 'ADMIN' | 'TEACHER' | 'STUDENT'
  admin_scope: 'SYSTEM' | 'SCHOOL' | null
  school: number | null
  school_name: string
  is_active: boolean
  date_joined: string
}

export interface SystemUsage {
  school_count: number
  active_school_count: number
  lesson_count: number
  quiz_count: number
  quiz_attempt_count: number
  exam_count: number
  exam_candidate_count: number
  exam_script_count: number
  ai_explanation_request_count: number
  sync_record_count: number
}
