export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'SYNC_PENDING' | 'SYNCED' | 'FAILED'

export interface StudentQuizAnswerRecord {
  id: number
  question: number
  client_answer_id: string
  selected_option: number | null
  matching_response: Record<string, string>
  is_correct: boolean | null
  marks_awarded: number | null
  answered_at: string
}

export interface StudentQuizAttempt {
  id: number
  school: number
  quiz: number
  student: number
  client_attempt_id: string
  status: AttemptStatus
  score: number | null
  total_marks: number | null
  percentage: number | null
  started_at: string
  submitted_at: string | null
  sync_error: string
  answers: StudentQuizAnswerRecord[]
  updated_at: string
}
