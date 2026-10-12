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
  StudentCandidateNumber,
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

export async function downloadMarkSheet(examId: number, title?: string): Promise<void> {
  const response = await apiClient.get(`/exams/${examId}/mark-sheet/`, { responseType: 'blob' })
  const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
  const a = document.createElement('a')
  a.href = url
  a.download = title ? `${title}_mark_sheet.pdf` : `exam_${examId}_mark_sheet.pdf`
  a.click()
  URL.revokeObjectURL(url)
}

export async function downloadCoverPages(examId: number, title?: string): Promise<void> {
  const response = await apiClient.get(`/exams/${examId}/cover-pages/`, { responseType: 'blob' })
  const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
  const a = document.createElement('a')
  a.href = url
  a.download = title ? `${title}_cover_pages.pdf` : `exam_${examId}_cover_pages.pdf`
  a.click()
  URL.revokeObjectURL(url)
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

export async function updateSectionSettings(id: number, sectionSettings: Record<string, number>) {
  const response = await apiClient.patch<{ data: Exam }>(`/exams/${id}/section-settings/`, { section_settings: sectionSettings })
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

export interface SchoolTeacher {
  id: number
  username: string
  full_name: string
}

export async function listSchoolTeachers(): Promise<SchoolTeacher[]> {
  const res = await apiClient.get<{ data: SchoolTeacher[] }>('/auth/school-teachers/')
  return res.data.data
}

export async function assignExaminerRole(userId: number): Promise<SchoolTeacher> {
  const res = await apiClient.post<{ data: SchoolTeacher }>(`/auth/school-teachers/${userId}/examiner/`)
  return res.data.data
}

export async function unassignExaminerRole(userId: number): Promise<SchoolTeacher> {
  const res = await apiClient.delete<{ data: SchoolTeacher }>(`/auth/school-teachers/${userId}/examiner/`)
  return res.data.data
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

export async function bulkAddCandidates(
  examId: number,
  candidates: { student: number; candidate_number: string }[],
): Promise<{ enrolled: string[]; skipped: string[]; errors: string[] }> {
  const res = await apiClient.post<{ data: { enrolled: string[]; skipped: string[]; errors: string[] } }>(
    `/exams/${examId}/bulk-candidates/`,
    { candidates },
  )
  return res.data.data
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
  const response = await apiClient.post<{ data: { id: number; file_name: string; extracted_text: string; created_item_ids: number[] } }>(`/exams/${examId}/marking-scheme/upload/`, formData)
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

export async function bulkPublishExamResults(examIds: number[]) {
  const response = await apiClient.post<{
    data: { published_exams: { exam_id: number; title: string; published_count: number }[]; total_published: number }
  }>('/exams/bulk-publish-results/', { exam_ids: examIds })
  return response.data.data
}

// --- student-facing results ---

export async function listMyCandidateNumbers() {
  const response = await apiClient.get<{ data: StudentCandidateNumber[] }>('/exams/results/candidate-numbers/')
  return response.data.data
}

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
  is_compulsory?: boolean
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

export async function setQuestionCompulsory(id: number, isCompulsory: boolean) {
  const response = await apiClient.patch<{ data: ExamQuestion }>(`/exams/questions/${id}/compulsory/`, { is_compulsory: isCompulsory })
  return response.data.data
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

export async function updateMarkingSchemeItemCriterion(
  questionId: number,
  itemId: number,
  newCriterion: string,
  marks: number,
  order: number,
) {
  await removeMarkingSchemeItem(questionId, itemId)
  return addMarkingSchemeItem(questionId, { criterion: newCriterion, marks, order })
}
