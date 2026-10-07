export type ExamStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'MARKING' | 'REVIEW' | 'FINALIZED' | 'RESULTS_PUBLISHED'

export interface Exam {
  id: number
  school: number
  subject: number
  class_level: number
  title: string
  description: string
  academic_year: number
  exam_date: string | null
  total_marks: number | null
  duration_minutes: number | null
  status: ExamStatus
  section_settings: Record<string, number>
  created_by: number
  published_at: string | null
  created_at: string
  updated_at: string
}

export type ExamQuestionType = 'OBJECTIVE' | 'SUBJECTIVE'

export interface MarkingSchemeItem {
  id: number
  criterion: string
  description: string
  marks: number | string
  order: number
}

export interface ExamCandidate {
  id: number
  exam: number
  student: number
  candidate_number: string
  created_at: string
}

export interface StudentCandidateNumber {
  id: number
  candidate_number: string
  exam_title: string
  exam_date: string | null
  academic_year: number
  created_at: string
}

export type ExamScriptStatus =
  | 'UPLOADED'
  | 'PROCESSING'
  | 'MARKED'
  | 'TEACHER_REVIEW'
  | 'FINALIZED'
  | 'PUBLISHED'
  | 'FAILED'

export interface ExamScript {
  id: number
  exam: number
  candidate: number
  student: number
  file_reference: string
  file_name: string
  mime_type: string
  file_size: number
  checksum: string
  version: number
  status: ExamScriptStatus
  marking_error: string
  ocr_status: 'NOT_STARTED' | 'PROCESSING' | 'READY' | 'FAILED'
  extracted_text: string
  ocr_error: string
  uploaded_by: number
  uploaded_at: string
  updated_at: string
}

export interface ExamResultAnswer {
  id: number
  question_number: string
  question_text: string
  max_marks: number
  teacher_final_marks: number | null
  teacher_comment: string
}

export interface ExamResult {
  id: number
  exam: number
  exam_title: string
  candidate_number: string
  score: number | null
  total_marks: number | null
  percentage: number | null
  answers: ExamResultAnswer[]
  updated_at: string
}

export interface StudentExamAnswer {
  id: number
  attempt: number
  exam_question: number
  recorded_answer: string
  is_correct: boolean | null
  ai_marks_awarded: number | null
  ai_feedback: string
  ocr_confidence: string
  teacher_final_marks: number | null
  teacher_comment: string
  marked_at: string | null
  created_at: string
}

export interface StudentExamAttempt {
  id: number
  school: number
  exam: number
  candidate: number
  student: number
  current_script: number | null
  score: number | null
  total_marks: number | null
  percentage: number | null
  answers: StudentExamAnswer[]
  created_at: string
  updated_at: string
}

export interface ExamQuestion {
  id: number
  school: number
  exam: number
  created_by: number
  section: string
  question_number: string
  question_text: string
  question_type: ExamQuestionType
  max_marks: number | string
  correct_answer: string
  is_compulsory: boolean
  learning_objective: number | null
  order: number
  marking_scheme_items: MarkingSchemeItem[]
  created_at: string
  updated_at: string
}
