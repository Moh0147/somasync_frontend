import type { PaginatedResult } from '@/types/api'
import type {
  Exam,
  ExamCandidate,
  ExamQuestion,
  ExamQuestionType,
  ExamResult,
  ExamScript,
  MarkingSchemeItem,
  StudentExamAnswer,
  StudentExamAttempt,
} from '@/types/exam'

import { apiClient } from './apiClient'

export interface ExamPayload {
  subject: number
  class_level: number
  title: string
  description?: string
  academic_year: number
  exam_date?: string | null
}

export async function listExams() {
  const response = await apiClient.get<{ data: PaginatedResult<Exam> }>('/exams/')
  return response.data.data.results
}

export async function getExam(id: number) {
  const response = await apiClient.get<{ data: Exam }>(`/exams/${id}/`)
  return response.data.data
}

export async function createExam(payload: ExamPayload) {
  const response = await apiClient.post<{ data: Exam }>('/exams/', payload)
  return response.data.data
}

export async function updateExam(id: number, payload: Partial<ExamPayload>) {
  const response = await apiClient.patch<{ data: Exam }>(`/exams/${id}/`, payload)
  return response.data.data
}

export async function deleteExam(id: number) {
  await apiClient.delete(`/exams/${id}/`)
}

export async function publishExam(id: number) {
  const response = await apiClient.post<{ data: Exam }>(`/exams/${id}/publish/`)
  return response.data.data
}

export async function closeExam(id: number) {
  const response = await apiClient.post<{ data: Exam }>(`/exams/${id}/close/`)
  return response.data.data
}

export async function startMarking(id: number) {
  const response = await apiClient.post<{ data: Exam }>(`/exams/${id}/start-marking/`)
  return response.data.data
}

export async function listAttempts(examId: number) {
  const response = await apiClient.get<{ data: StudentExamAttempt[] }>(`/exams/${examId}/attempts/`)
  return response.data.data
}

// --- candidates ---

export async function listCandidates(examId: number) {
  const response = await apiClient.get<{ data: ExamCandidate[] }>(`/exams/${examId}/candidates/`)
  return response.data.data
}

export async function addCandidate(examId: number, payload: { student: number; candidate_number: string }) {
  const response = await apiClient.post<{ data: ExamCandidate }>(`/exams/${examId}/candidates/`, payload)
  return response.data.data
}

export async function removeCandidate(examId: number, candidateNumber: string) {
  await apiClient.delete(`/exams/${examId}/candidates/`, { data: { candidate_number: candidateNumber } })
}

export async function uploadExamPaper(examId: number, file: File) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await apiClient.post<{ data: { id: number; file_name: string; extracted_text: string; created_question_ids: number[] } }>(`/exams/${examId}/exam-paper/upload/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
  return response.data.data
}

export async function uploadMarkingScheme(examId: number, file: File) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await apiClient.post<{ data: { id: number; file_name: string; extracted_text: string; created_item_ids: number[] } }>(`/exams/${examId}/marking-scheme/upload/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
  return response.data.data
}

// --- scripts ---

export async function listScripts(examId: number) {
  const response = await apiClient.get<{ data: ExamScript[] }>(`/exams/${examId}/scripts/`)
  return response.data.data
}

export async function uploadScript(examId: number, candidateNumber: string, file: File) {
  const formData = new FormData()
  formData.append('candidate_number', candidateNumber)
  formData.append('file', file)
  const response = await apiClient.post<{ data: ExamScript }>(`/exams/${examId}/scripts/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data.data
}

export async function getScript(scriptId: number) {
  const response = await apiClient.get<{ data: ExamScript }>(`/exams/scripts/${scriptId}/`)
  return response.data.data
}

export async function ocrScript(scriptId: number) {
  const response = await apiClient.post<{ data: ExamScript }>(`/exams/scripts/${scriptId}/ocr/`)
  return response.data.data
}

export async function aiMarkScript(scriptId: number) {
  const response = await apiClient.post<{ data: ExamScript }>(`/exams/scripts/${scriptId}/ai-mark/`)
  return response.data.data
}

export async function submitScriptForReview(scriptId: number) {
  const response = await apiClient.post<{ data: ExamScript }>(`/exams/scripts/${scriptId}/submit-for-review/`)
  return response.data.data
}

export async function finalizeScript(scriptId: number) {
  const response = await apiClient.post<{ data: ExamScript }>(`/exams/scripts/${scriptId}/finalize/`)
  return response.data.data
}

export async function publishExamResults(examId: number) {
  const response = await apiClient.post<{ data: { exam: Exam; published_count: number } }>(
    `/exams/${examId}/publish-results/`,
  )
  return response.data.data
}

// --- student-facing results ---

export async function listExamResults() {
  const response = await apiClient.get<{ data: PaginatedResult<ExamResult> }>('/exams/results/')
  return response.data.data.results
}

export async function getExamResult(id: number) {
  const response = await apiClient.get<{ data: ExamResult }>(`/exams/results/${id}/`)
  return response.data.data
}

// --- per-answer marking ---

export interface MarkAnswerPayload {
  recorded_answer?: string
  teacher_final_marks?: number
  teacher_comment?: string
}

export async function markAnswer(answerId: number, payload: MarkAnswerPayload) {
  const response = await apiClient.post<{ data: StudentExamAnswer }>(`/exams/answers/${answerId}/mark/`, payload)
  return response.data.data
}

export interface ExamQuestionPayload {
  exam: number
  section?: string
  question_number: string
  question_text: string
  question_type: ExamQuestionType
  max_marks: number
  correct_answer?: string
  learning_objective?: number | null
  order: number
}

export async function listExamQuestions(examId: number) {
  const response = await apiClient.get<{ data: PaginatedResult<ExamQuestion> }>('/exams/questions/', {
    params: { exam: examId },
  })
  return response.data.data.results
}

export async function createExamQuestion(payload: ExamQuestionPayload) {
  const response = await apiClient.post<{ data: ExamQuestion }>('/exams/questions/', payload)
  return response.data.data
}

export async function deleteExamQuestion(id: number) {
  await apiClient.delete(`/exams/questions/${id}/`)
}

export interface MarkingSchemeItemPayload {
  criterion: string
  description?: string
  marks: number
  order: number
}

export async function addMarkingSchemeItem(questionId: number, payload: MarkingSchemeItemPayload) {
  const response = await apiClient.post<{ data: MarkingSchemeItem }>(
    `/exams/questions/${questionId}/marking-scheme/`,
    payload,
  )
  return response.data.data
}

export async function removeMarkingSchemeItem(questionId: number, itemId: number) {
  await apiClient.delete(`/exams/questions/${questionId}/marking-scheme/`, { data: { item_id: itemId } })
}
