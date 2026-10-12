export type QuestionType = 'MCQ' | 'TRUE_FALSE' | 'MATCHING'

export interface SafeQuestionOption {
  id: number
  text: string
  order: number
}

export interface SafeMatchingPair {
  id: number
  left_text: string
  order: number
}

export interface SafeQuestion {
  id: number
  question_type: QuestionType
  text: string
  marks: number
  order: number
  options: SafeQuestionOption[]
  pairs: SafeMatchingPair[]
  right_options: string[]
}

export interface MiniQuizData {
  passing_score: number
  questions: SafeQuestion[]
}

export interface SectionQuizAnswerInput {
  question: number
  selected_option?: number
  matching_response?: Record<string, string>
}

export interface WrongAnswer {
  question_id: number
  question_text: string
  explanation: string
}

export interface SectionQuizResult {
  passed: boolean
  score: number
  passing_score: number
  attempts: number
  best_score: number | null
  next_section_unlocked: boolean
  next_section_id: number | null
  wrong_answers: WrongAnswer[]
}

export type QuizStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export interface Quiz {
  id: number
  school: number
  subject: number
  class_level: number
  topic: number | null
  learning_objective: number | null
  title: string
  description: string
  status: QuizStatus
  created_by: number
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface QuestionOption {
  id: number
  text: string
  is_correct: boolean
  order: number
}

export interface MatchingPair {
  id: number
  left_text: string
  right_text: string
  order: number
}

export interface AuthoredQuestion {
  id: number
  school: number
  quiz: number
  question_type: QuestionType
  text: string
  marks: number
  order: number
  explanation: string
  created_by: number
  options: QuestionOption[]
  pairs: MatchingPair[]
  created_at: string
  updated_at: string
}

export interface QuizAssignment {
  id: number
  quiz: number
  school_class: number
  assigned_by: number
  assigned_at: string
}
