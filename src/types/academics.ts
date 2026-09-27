export interface ClassLevel {
  id: number
  name: string
  code: string
  order: number
  is_active: boolean
}

export interface Subject {
  id: number
  school: number
  name: string
  code: string
  curriculum_code: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Topic {
  id: number
  school: number
  subject: number
  class_level: number
  title: string
  description: string
  curriculum_code: string
  order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LearningObjective {
  id: number
  school: number
  topic: number
  description: string
  competency_code: string
  assessment_reference: string
  order: number
  is_active: boolean
  created_at: string
  updated_at: string
}
