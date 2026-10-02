import type {
  ClassPerformance,
  ExamPerformance,
  LessonCompletion,
  QuestionPerformance,
  QuizPerformance,
  SchoolOverview,
  StudentPerformance,
  SubjectPerformance,
  SystemSchoolRow,
  SystemDirectoryUser,
  SystemUsage,
  SystemUsers,
} from '@/types/analytics'

import { apiClient } from './apiClient'

// --- teacher ---

export async function getTeacherClassPerformance() {
  const response = await apiClient.get<{ data: ClassPerformance[] }>('/analytics/teacher/classes/')
  return response.data.data
}

export async function getTeacherStudentPerformance(classId?: number) {
  const response = await apiClient.get<{ data: StudentPerformance[] }>('/analytics/teacher/students/', {
    params: classId ? { class_id: classId } : undefined,
  })
  return response.data.data
}

export async function getTeacherQuizPerformance() {
  const response = await apiClient.get<{ data: QuizPerformance[] }>('/analytics/teacher/quizzes/')
  return response.data.data
}

export async function getTeacherQuestionPerformance(quizId: number) {
  const response = await apiClient.get<{ data: QuestionPerformance[] }>(
    `/analytics/teacher/quizzes/${quizId}/questions/`,
  )
  return response.data.data
}

export async function getTeacherLessonCompletion() {
  const response = await apiClient.get<{ data: LessonCompletion[] }>('/analytics/teacher/lessons/')
  return response.data.data
}

export async function getTeacherExamPerformance() {
  const response = await apiClient.get<{ data: ExamPerformance[] }>('/analytics/teacher/exams/')
  return response.data.data
}

// --- school admin ---

export async function getSchoolOverview() {
  const response = await apiClient.get<{ data: SchoolOverview }>('/analytics/school/overview/')
  return response.data.data
}

export async function getSchoolClassPerformance() {
  const response = await apiClient.get<{ data: ClassPerformance[] }>('/analytics/school/classes/')
  return response.data.data
}

export async function getSchoolSubjectPerformance() {
  const response = await apiClient.get<{ data: SubjectPerformance[] }>('/analytics/school/subjects/')
  return response.data.data
}

// --- system admin ---

export async function getSystemSchools() {
  const response = await apiClient.get<{ data: SystemSchoolRow[] }>('/analytics/system/schools/')
  return response.data.data
}

export async function getSystemUsers() {
  const response = await apiClient.get<{ data: SystemUsers }>('/analytics/system/users/')
  return response.data.data
}

export async function getSystemUserDirectory() {
  const response = await apiClient.get<{ data: SystemDirectoryUser[] }>('/analytics/system/user-directory/')
  return response.data.data
}

export async function getSystemUsage() {
  const response = await apiClient.get<{ data: SystemUsage }>('/analytics/system/usage/')
  return response.data.data
}
