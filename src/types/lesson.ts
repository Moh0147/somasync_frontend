import type { MiniQuizData } from './quiz'

export type LessonStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export interface Lesson {
  id: number
  school: number
  subject: number
  class_level: number
  topic: number | null
  learning_objective: number | null
  title: string
  description: string
  content: string
  status: LessonStatus
  created_by: number
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface LessonSection {
  id: number
  school: number
  lesson: number
  title: string
  order: number
  created_at: string
  updated_at: string
}

export type ContentBlockType = 'HEADING' | 'TEXT' | 'IMAGE' | 'KEY_POINT'

export interface SectionContentBlock {
  id: number
  block_type: ContentBlockType
  content: string
  image: number | null
  image_reference: string | null
  order: number
}

export interface LessonAttachment {
  id: number
  file_reference: string
  file_name: string
  mime_type: string
  file_size: number
  checksum: string
  version: number
  created_at: string
}

export type SectionStatus = 'LOCKED' | 'AVAILABLE' | 'COMPLETED'

export interface SectionStatusRow {
  id: number
  title: string
  order: number
  status: SectionStatus
  best_score: number | null
  attempts: number
  has_mini_quiz: boolean
}

export interface LessonStructure {
  lesson_id: number
  title: string
  sections: SectionStatusRow[]
}

export interface SectionContentResponse {
  content_blocks: SectionContentBlock[]
  mini_quiz: MiniQuizData | null
}

export interface SectionMiniQuiz {
  id: number
  section: number
  quiz: number
  passing_score: number
  created_at: string
  updated_at: string
}
