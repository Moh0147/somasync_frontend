import type { PaginatedResult } from '@/types/api'
import type {
  ContentBlockType,
  Lesson,
  LessonAttachment,
  LessonSection,
  LessonStructure,
  SectionContentBlock,
  SectionContentResponse,
  SectionMiniQuiz,
} from '@/types/lesson'
import type { SectionQuizAnswerInput, SectionQuizResult } from '@/types/quiz'

import { apiClient } from './apiClient'

export interface LessonPayload {
  subject: number
  class_level: number
  topic?: number | null
  learning_objective?: number | null
  title: string
  description?: string
  content?: string
}

export async function listLessons() {
  const response = await apiClient.get<{ data: PaginatedResult<Lesson> }>('/lessons/')
  return response.data.data.results
}

export async function getLesson(id: number) {
  const response = await apiClient.get<{ data: Lesson }>(`/lessons/${id}/`)
  return response.data.data
}

export async function createLesson(payload: LessonPayload) {
  const response = await apiClient.post<{ data: Lesson }>('/lessons/', payload)
  return response.data.data
}

export async function updateLesson(id: number, payload: Partial<LessonPayload>) {
  const response = await apiClient.patch<{ data: Lesson }>(`/lessons/${id}/`, payload)
  return response.data.data
}

export async function publishLesson(id: number) {
  const response = await apiClient.post<{ data: Lesson }>(`/lessons/${id}/publish/`)
  return response.data.data
}

export async function archiveLesson(id: number) {
  const response = await apiClient.post<{ data: Lesson }>(`/lessons/${id}/archive/`)
  return response.data.data
}

export async function deleteLesson(id: number) {
  await apiClient.delete(`/lessons/${id}/`)
}

export interface SectionPayload {
  lesson: number
  title: string
  order: number
}

export async function listLessonSections(lessonId: number) {
  const response = await apiClient.get<{ data: PaginatedResult<LessonSection> }>('/lessons/sections/', {
    params: { lesson: lessonId },
  })
  return response.data.data.results
}

export async function createSection(payload: SectionPayload) {
  const response = await apiClient.post<{ data: LessonSection }>('/lessons/sections/', payload)
  return response.data.data
}

export async function updateSection(id: number, payload: Partial<Pick<SectionPayload, 'title' | 'order'>>) {
  const response = await apiClient.patch<{ data: LessonSection }>(`/lessons/sections/${id}/`, payload)
  return response.data.data
}

export async function deleteSection(id: number) {
  await apiClient.delete(`/lessons/sections/${id}/`)
}

export async function swapSectionOrder(sectionA: LessonSection, sectionB: LessonSection) {
  const parkingOrder = 100000 + sectionB.order
  await updateSection(sectionB.id, { order: parkingOrder })
  await updateSection(sectionA.id, { order: sectionB.order })
  await updateSection(sectionB.id, { order: sectionA.order })
}

export interface ContentBlockPayload {
  block_type: ContentBlockType
  content?: string
  image?: number | null
  order: number
}

export async function listContentBlocks(sectionId: number) {
  const response = await apiClient.get<{ data: SectionContentBlock[] }>(`/lessons/sections/${sectionId}/content-blocks/`)
  return response.data.data
}

export async function createContentBlock(sectionId: number, payload: ContentBlockPayload) {
  const response = await apiClient.post<{ data: SectionContentBlock }>(
    `/lessons/sections/${sectionId}/content-blocks/`,
    payload,
  )
  return response.data.data
}

export async function deleteContentBlock(sectionId: number, blockId: number) {
  await apiClient.delete(`/lessons/sections/${sectionId}/content-blocks/`, { data: { block_id: blockId } })
}

export async function listAttachments(lessonId: number) {
  const response = await apiClient.get<{ data: LessonAttachment[] }>(`/lessons/${lessonId}/attachments/`)
  return response.data.data
}

export async function uploadAttachment(lessonId: number, file: File) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await apiClient.post<{ data: LessonAttachment }>(`/lessons/${lessonId}/attachments/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data.data
}

export async function deleteAttachment(lessonId: number, attachmentId: number) {
  await apiClient.delete(`/lessons/${lessonId}/attachments/`, { data: { attachment_id: attachmentId } })
}

export async function getLessonStructure(lessonId: number) {
  const response = await apiClient.get<{ data: LessonStructure }>(`/lessons/${lessonId}/structure/`)
  return response.data.data
}

export async function getSectionContent(sectionId: number) {
  const response = await apiClient.get<{ data: SectionContentResponse }>(`/lessons/sections/${sectionId}/content/`)
  return response.data.data
}

export async function submitSectionQuiz(sectionId: number, answers: SectionQuizAnswerInput[]) {
  const response = await apiClient.post<{ data: SectionQuizResult }>(
    `/lessons/sections/${sectionId}/submit-quiz/`,
    { answers },
  )
  return response.data.data
}

export async function getMiniQuiz(sectionId: number) {
  const response = await apiClient.get<{ data: SectionMiniQuiz }>(`/lessons/sections/${sectionId}/mini-quiz/`)
  return response.data.data
}

export async function createMiniQuiz(sectionId: number, passingScore: number) {
  const response = await apiClient.post<{ data: SectionMiniQuiz }>(`/lessons/sections/${sectionId}/mini-quiz/`, {
    passing_score: passingScore,
  })
  return response.data.data
}
