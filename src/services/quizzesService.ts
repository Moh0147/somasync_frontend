import type { PaginatedResult } from '@/types/api'
import type { AuthoredQuestion, MatchingPair, QuestionOption, QuestionType, Quiz, QuizAssignment, SafeQuestion } from '@/types/quiz'
import type { StudentQuizAttempt } from '@/types/quizAttempt'

import { apiClient } from './apiClient'

export interface QuizPayload {
  subject: number
  class_level: number
  topic?: number | null
  learning_objective?: number | null
  title: string
  description?: string
}

export async function listQuizzes() {
  const response = await apiClient.get<{ data: PaginatedResult<Quiz> }>('/quizzes/')
  return response.data.data.results
}

export async function getQuiz(id: number) {
  const response = await apiClient.get<{ data: Quiz }>(`/quizzes/${id}/`)
  return response.data.data
}

export async function getStudentQuizQuestions(id: number) {
  const response = await apiClient.get<{ data: SafeQuestion[] }>(`/quizzes/${id}/student-questions/`)
  return response.data.data
}

export async function createQuiz(payload: QuizPayload) {
  const response = await apiClient.post<{ data: Quiz }>('/quizzes/', payload)
  return response.data.data
}

export async function updateQuiz(id: number, payload: Partial<QuizPayload>) {
  const response = await apiClient.patch<{ data: Quiz }>(`/quizzes/${id}/`, payload)
  return response.data.data
}

export async function deleteQuiz(id: number) {
  await apiClient.delete(`/quizzes/${id}/`)
}

export async function publishQuiz(id: number) {
  const response = await apiClient.post<{ data: Quiz }>(`/quizzes/${id}/publish/`)
  return response.data.data
}

export async function archiveQuiz(id: number) {
  const response = await apiClient.post<{ data: Quiz }>(`/quizzes/${id}/archive/`)
  return response.data.data
}

// --- class assignment ---

export async function listQuizAssignments(quizId: number) {
  const response = await apiClient.get<{ data: QuizAssignment[] }>(`/quizzes/${quizId}/assign/`)
  return response.data.data
}

export async function assignQuizToClass(quizId: number, schoolClassId: number) {
  await apiClient.post(`/quizzes/${quizId}/assign/`, { school_class: schoolClassId })
}

export async function unassignQuizFromClass(quizId: number, schoolClassId: number) {
  await apiClient.delete(`/quizzes/${quizId}/assign/`, { data: { school_class: schoolClassId } })
}

export async function listQuestions(quizId: number) {
  const response = await apiClient.get<{ data: PaginatedResult<AuthoredQuestion> }>('/quizzes/questions/', {
    params: { quiz: quizId },
  })
  return response.data.data.results
}

export interface QuestionPayload {
  quiz: number
  question_type: QuestionType
  text: string
  marks: number
  order: number
  explanation?: string
}

export async function createQuestion(payload: QuestionPayload) {
  const response = await apiClient.post<{ data: AuthoredQuestion }>('/quizzes/questions/', payload)
  return response.data.data
}

export async function deleteQuestion(id: number) {
  await apiClient.delete(`/quizzes/questions/${id}/`)
}

export interface OptionPayload {
  text: string
  is_correct: boolean
  order: number
}

export async function addOption(questionId: number, payload: OptionPayload) {
  const response = await apiClient.post<{ data: QuestionOption }>(`/quizzes/questions/${questionId}/options/`, payload)
  return response.data.data
}

export async function removeOption(questionId: number, optionId: number) {
  await apiClient.delete(`/quizzes/questions/${questionId}/options/`, { data: { option_id: optionId } })
}

export interface PairPayload {
  left_text: string
  right_text: string
  order: number
}

export async function addPair(questionId: number, payload: PairPayload) {
  const response = await apiClient.post<{ data: MatchingPair }>(`/quizzes/questions/${questionId}/pairs/`, payload)
  return response.data.data
}

export async function removePair(questionId: number, pairId: number) {
  await apiClient.delete(`/quizzes/questions/${questionId}/pairs/`, { data: { pair_id: pairId } })
}

// --- student-facing: attempts ---
// No endpoint exists yet for a student to safely fetch a normal quiz's
// questions (unlike the lesson mini-quiz's `content` action) -- see
// apps/quizzes/serializers.py's own SafeQuestionSerializer docstring:
// "nothing else in the base quiz system serves questions to a student
// before they've answered." start() below is real; there is nothing after
// it a student can call to actually take the quiz today.

export async function listMyAttempts() {
  const response = await apiClient.get<{ data: PaginatedResult<StudentQuizAttempt> }>('/quizzes/attempts/')
  return response.data.data.results
}

export async function startAttempt(quizId: number) {
  const response = await apiClient.post<{ data: StudentQuizAttempt }>('/quizzes/attempts/start/', {
    quiz: quizId,
    client_attempt_id: crypto.randomUUID(),
  })
  return response.data.data
}

export async function startQuizAttempt(quizId: number) {
  const clientAttemptId = `quiz-${quizId}-${crypto.randomUUID()}`
  const response = await apiClient.post<{ data: StudentQuizAttempt }>('/quizzes/attempts/start/', {
    quiz: quizId,
    client_attempt_id: clientAttemptId,
  })
  return response.data.data
}

export async function answerQuizQuestion(clientAttemptId: string, question: number, selectedOption?: number, matchingResponse?: Record<string, string>) {
  const response = await apiClient.post<{ data: StudentQuizAttempt }>(`/quizzes/attempts/${encodeURIComponent(clientAttemptId)}/answer/`, {
    client_answer_id: crypto.randomUUID(), question, selected_option: selectedOption, matching_response: matchingResponse,
  })
  return response.data.data
}

export async function submitQuizAttempt(clientAttemptId: string) {
  const response = await apiClient.post<{ data: StudentQuizAttempt }>(`/quizzes/attempts/${encodeURIComponent(clientAttemptId)}/submit/`)
  return response.data.data
}
