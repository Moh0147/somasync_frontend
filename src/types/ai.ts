export type AIExplanationBackendStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface AIExplanationRequest {
  id: number
  school: number
  student: number
  student_answer: number
  context: string
  status: AIExplanationBackendStatus
  explanation: string
  correct_concept: string
  concise_feedback: string
  error: string
  attempts: number
  created_at: string
  updated_at: string
}
