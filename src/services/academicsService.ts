import type { PaginatedResult } from '@/types/api'
import type { ClassLevel, LearningObjective, Subject, Topic } from '@/types/academics'

import { apiClient } from './apiClient'

export async function listClassLevels() {
  const response = await apiClient.get<{ data: PaginatedResult<ClassLevel> }>('/academics/class-levels/')
  return response.data.data.results
}

export interface SubjectPayload {
  name: string
  code?: string
  curriculum_code?: string
}

export async function listSubjects() {
  const response = await apiClient.get<{ data: PaginatedResult<Subject> }>('/academics/subjects/')
  return response.data.data.results
}

export async function getSubject(id: number) {
  const response = await apiClient.get<{ data: Subject }>(`/academics/subjects/${id}/`)
  return response.data.data
}

export async function createSubject(payload: SubjectPayload) {
  const response = await apiClient.post<{ data: Subject }>('/academics/subjects/', payload)
  return response.data.data
}

export async function updateSubject(id: number, payload: Partial<SubjectPayload> & { is_active?: boolean }) {
  const response = await apiClient.patch<{ data: Subject }>(`/academics/subjects/${id}/`, payload)
  return response.data.data
}

export interface TopicPayload {
  subject: number
  class_level: number
  title: string
  description?: string
  curriculum_code?: string
  order?: number
}

export async function listTopics() {
  const response = await apiClient.get<{ data: PaginatedResult<Topic> }>('/academics/topics/')
  return response.data.data.results
}

export async function createTopic(payload: TopicPayload) {
  const response = await apiClient.post<{ data: Topic }>('/academics/topics/', payload)
  return response.data.data
}

export async function updateTopic(id: number, payload: Partial<TopicPayload> & { is_active?: boolean }) {
  const response = await apiClient.patch<{ data: Topic }>(`/academics/topics/${id}/`, payload)
  return response.data.data
}

export interface LearningObjectivePayload {
  topic: number
  description: string
  competency_code?: string
  assessment_reference?: string
  order?: number
}

export async function listLearningObjectives() {
  const response = await apiClient.get<{ data: PaginatedResult<LearningObjective> }>('/academics/learning-objectives/')
  return response.data.data.results
}

export async function createLearningObjective(payload: LearningObjectivePayload) {
  const response = await apiClient.post<{ data: LearningObjective }>('/academics/learning-objectives/', payload)
  return response.data.data
}

export async function updateLearningObjective(
  id: number,
  payload: Partial<LearningObjectivePayload> & { is_active?: boolean },
) {
  const response = await apiClient.patch<{ data: LearningObjective }>(`/academics/learning-objectives/${id}/`, payload)
  return response.data.data
}
