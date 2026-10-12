import type { ExamScript, ExamScriptStatus, StudentExamAnswer } from '@/types/exam'
import { apiClient } from './apiClient'

export interface MarkingSessionSummary {
  exam_id: number
  title: string
  subject_name: string
  academic_year: number
  exam_status: string
  total_scripts: number
  counts: Record<ExamScriptStatus, number>
}

export async function getMarkingSummary(): Promise<MarkingSessionSummary[]> {
  const res = await apiClient.get<{ data: MarkingSessionSummary[] }>('/exams/marking-summary/')
  return res.data.data
}

export async function getSessionScripts(examId: number): Promise<ExamScript[]> {
  const res = await apiClient.get<{ data: ExamScript[] }>(`/exams/${examId}/scripts/`)
  return res.data.data
}

export async function finalizeScript(scriptId: number): Promise<ExamScript> {
  const res = await apiClient.post<{ data: ExamScript }>(`/exams/scripts/${scriptId}/finalize/`)
  return res.data.data
}

export async function submitForReview(scriptId: number): Promise<ExamScript> {
  const res = await apiClient.post<{ data: ExamScript }>(`/exams/scripts/${scriptId}/submit-for-review/`)
  return res.data.data
}

export async function listScripts(params?: {
  exam?: number
  status?: ExamScriptStatus
}): Promise<ExamScript[]> {
  const res = await apiClient.get<{ data: ExamScript[] }>('/exams/scripts/', { params })
  return res.data.data
}

export async function getScript(scriptId: number): Promise<ExamScript> {
  const res = await apiClient.get<{ data: ExamScript }>(`/exams/scripts/${scriptId}/`)
  return res.data.data
}

export async function getScriptAnswers(scriptId: number): Promise<StudentExamAnswer[]> {
  const res = await apiClient.get<{ data: StudentExamAnswer[] }>(`/exams/scripts/${scriptId}/answers/`)
  return res.data.data
}

export interface MarkAnswerPayload {
  teacher_final_marks?: string
  teacher_comment?: string
  recorded_answer?: string
}

export async function markAnswer(answerId: number, payload: MarkAnswerPayload): Promise<StudentExamAnswer> {
  const res = await apiClient.post<{ data: StudentExamAnswer }>(`/exams/answers/${answerId}/mark/`, payload)
  return res.data.data
}

export async function runAIMark(scriptId: number): Promise<ExamScript> {
  const res = await apiClient.post<{ data: ExamScript }>(`/exams/scripts/${scriptId}/ai-mark/`)
  return res.data.data
}

export async function runOCR(scriptId: number): Promise<ExamScript> {
  const res = await apiClient.post<{ data: ExamScript }>(`/exams/scripts/${scriptId}/ocr/`)
  return res.data.data
}

export async function resetScript(scriptId: number): Promise<ExamScript> {
  const res = await apiClient.post<{ data: ExamScript }>(`/exams/scripts/${scriptId}/reset/`)
  return res.data.data
}

export interface ScriptAssignment {
  id: number
  script: number
  assignee: number
  assignee_username: string
  assignee_full_name: string
  role: 'EXAMINER' | 'CHECKER'
  assigned_by: number
  assigned_by_username: string
  assigned_at: string
}

export interface AssignableUser {
  id: number
  username: string
  full_name: string
  role: 'EXAMINER' | 'TEACHER'
  secondary_role: 'EXAMINER' | null
}

export async function getAssignableUsers(scriptId: number): Promise<AssignableUser[]> {
  const res = await apiClient.get<{ data: AssignableUser[] }>(`/exams/scripts/${scriptId}/assignable-users/`)
  return res.data.data
}

export async function getScriptAssignments(scriptId: number): Promise<ScriptAssignment[]> {
  const res = await apiClient.get<{ data: ScriptAssignment[] }>(`/exams/scripts/${scriptId}/assign/`)
  return res.data.data
}

export async function assignScript(
  scriptId: number,
  assigneeId: number,
  role: 'EXAMINER',
): Promise<ScriptAssignment> {
  const res = await apiClient.post<{ data: ScriptAssignment }>(`/exams/scripts/${scriptId}/assign/`, {
    assignee_id: assigneeId,
    role,
  })
  return res.data.data
}

export async function unassignScript(
  scriptId: number,
  assigneeId: number,
  role: 'EXAMINER',
): Promise<void> {
  await apiClient.delete(`/exams/scripts/${scriptId}/assign/`, {
    data: { assignee_id: assigneeId, role },
  })
}

export interface AuditEntry {
  id: number
  exam: number | null
  exam_title: string
  script: number | null
  candidate_number: string
  actor: number | null
  actor_username: string
  actor_role: string
  action: string
  action_label: string
  detail: Record<string, unknown>
  ip_address: string | null
  created_at: string
}

export async function listAuditLog(params?: {
  exam?: number
  action?: string
  date_from?: string
  date_to?: string
  actor?: string
  page?: number
}): Promise<{ results: AuditEntry[]; count: number; next: string | null; previous: string | null }> {
  const res = await apiClient.get<{
    data: AuditEntry[]
    count: number
    next: string | null
    previous: string | null
  }>('/exams/audit/', { params })
  // DRF pagination wraps results; handle both paginated and list responses
  const raw = res.data as unknown as {
    results?: AuditEntry[]
    data?: AuditEntry[]
    count?: number
    next?: string | null
    previous?: string | null
  }
  if (raw.results) {
    return { results: raw.results, count: raw.count ?? 0, next: raw.next ?? null, previous: raw.previous ?? null }
  }
  const data = (raw as { data: AuditEntry[] }).data ?? []
  return { results: data, count: data.length, next: null, previous: null }
}
