import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useToast } from '@/components/feedback/Toast'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { AIIcon, AssignUserIcon, ChevronLeftIcon, OCRIcon, ResetIcon, SendIcon } from '@/components/ui/icons'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAuth } from '@/features/auth/AuthContext'
import { getApiErrorMessage } from '@/services/apiError'
import {
  assignScript,
  finalizeScript,
  getAssignableUsers,
  getScript,
  getScriptAnswers,
  getScriptAssignments,
  markAnswer,
  resetScript,
  runAIMark,
  runOCR,
  submitForReview,
  unassignScript,
} from '@/services/markingService'
import type { AssignableUser, ScriptAssignment } from '@/services/markingService'
import type { ExamScript, StudentExamAnswer } from '@/types/exam'
import type { StatusBadgeStatus } from '@/components/ui/StatusBadge'

const STATUS_BADGE: Record<string, StatusBadgeStatus> = {
  UPLOADED: 'pending', PROCESSING: 'syncing', MARKED: 'available',
  TEACHER_REVIEW: 'pending', FINALIZED: 'completed', PUBLISHED: 'completed', FAILED: 'failed',
}
const STATUS_LABEL: Record<string, string> = {
  UPLOADED: 'Uploaded', PROCESSING: 'Extracting', MARKED: 'Marked',
  TEACHER_REVIEW: 'In Review', FINALIZED: 'Finalized', PUBLISHED: 'Published', FAILED: 'Failed',
}

function canManageScript(role?: string) {
  return ['EXAM_MARKING_MANAGER', 'EXAMINER', 'TEACHER', 'ADMIN'].includes(role ?? '')
}

interface AnswerRowProps {
  answer: StudentExamAnswer
  canEdit: boolean
  onSaved: (updated: StudentExamAnswer) => void
}

function AnswerRow({ answer, canEdit, onSaved }: AnswerRowProps) {
  const { showToast } = useToast()
  const [marks, setMarks] = useState(answer.teacher_final_marks ?? '')
  const [comment, setComment] = useState(answer.teacher_comment ?? '')
  const [saving, setSaving] = useState(false)
  const maxMarks = parseFloat(answer.max_marks)
  const isDirty =
    String(marks) !== String(answer.teacher_final_marks ?? '') ||
    comment !== (answer.teacher_comment ?? '')

  async function handleSave() {
    setSaving(true)
    try {
      const updated = await markAnswer(answer.id, {
        teacher_final_marks: String(marks),
        teacher_comment: comment,
      })
      onSaved(updated)
      showToast('success', `Q${answer.question_number} saved.`)
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Q{answer.question_number}
            <span className="ml-1.5 font-normal normal-case text-slate-400 dark:text-slate-500">
              ({answer.question_type === 'SUBJECTIVE' ? 'subjective' : 'objective'} · max {answer.max_marks} marks)
            </span>
          </p>
          <p className="mt-0.5 text-sm text-slate-800 dark:text-slate-200">{answer.question_text}</p>
        </div>
        {answer.teacher_final_marks !== null && (
          <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
            {answer.teacher_final_marks}/{answer.max_marks}
          </span>
        )}
      </div>

      {answer.recorded_answer && (
        <div className="mb-2 rounded bg-slate-50 p-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <span className="font-medium">Extracted answer: </span>
          {answer.recorded_answer}
        </div>
      )}

      {answer.ai_marks_awarded !== null && (
        <div className="mb-2 flex items-center gap-1.5 text-xs text-violet-700 dark:text-violet-400">
          <AIIcon className="h-3.5 w-3.5" />
          AI suggestion: {answer.ai_marks_awarded}/{answer.max_marks}
          {answer.ai_feedback && <span className="text-slate-500 dark:text-slate-400">— {answer.ai_feedback}</span>}
        </div>
      )}

      {canEdit && (
        <div className="mt-2 flex items-end gap-2">
          <div className="flex flex-col gap-0.5">
            <label className="text-xs text-slate-500 dark:text-slate-400">Marks (0–{answer.max_marks})</label>
            <input
              type="number"
              min={0}
              max={maxMarks}
              step="0.5"
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              className="w-20 rounded border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="flex flex-1 flex-col gap-0.5">
            <label className="text-xs text-slate-500 dark:text-slate-400">Comment (optional)</label>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a note…"
              className="rounded border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <Button
            size="sm"
            variant="primary"
            disabled={saving || !isDirty || marks === ''}
            onClick={handleSave}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      )}
    </div>
  )
}

export default function MarkingScriptPage() {
  const { scriptId } = useParams()
  const id = Number(scriptId)
  const { user } = useAuth()
  const { showToast } = useToast()

  const [script, setScript] = useState<ExamScript | null>(null)
  const [answers, setAnswers] = useState<StudentExamAnswer[] | null>(null)
  const [assignments, setAssignments] = useState<ScriptAssignment[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actioning, setActioning] = useState<string | null>(null)
  const [showAssignPanel, setShowAssignPanel] = useState(false)
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[] | null>(null)
  const [assigneeId, setAssigneeId] = useState('')
  const [assignRole, setAssignRole] = useState<'EXAMINER'>('EXAMINER')
  const [assigning, setAssigning] = useState(false)
  const pageViewerRef = useRef<HTMLDivElement>(null)

  async function load() {
    setError(null)
    try {
      const [s, a] = await Promise.all([getScript(id), getScriptAnswers(id)])
      setScript(s)
      setAnswers(a)
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  async function loadAssignments() {
    try {
      setAssignments(await getScriptAssignments(id))
    } catch {
      // non-critical
    }
  }

  async function loadAssignableUsers() {
    try {
      setAssignableUsers(await getAssignableUsers(id))
    } catch {
      setAssignableUsers([])
    }
  }

  useEffect(() => { load() }, [id])

  async function handleAction(action: string, fn: () => Promise<ExamScript>) {
    setActioning(action)
    try {
      const updated = await fn()
      setScript(updated)
      showToast('success', {
        'submit': 'Submitted for review.',
        'finalize': 'Script finalized.',
        'ai': 'AI marking started.',
        'ocr': 'OCR extraction complete.',
      }[action] ?? 'Done.')
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setActioning(null)
    }
  }

  async function handleAssign() {
    const numId = parseInt(assigneeId, 10)
    if (!numId) return
    setAssigning(true)
    try {
      const a = await assignScript(id, numId, assignRole)
      setAssignments((prev) => [...(prev ?? []), a])
      setAssigneeId('')
      showToast('success', `Assigned ${a.assignee_username} as ${assignRole}.`)
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setAssigning(false)
    }
  }

  async function handleUnassign(a: ScriptAssignment) {
    try {
      await unassignScript(id, a.assignee, a.role)
      setAssignments((prev) => prev?.filter((x) => x.id !== a.id) ?? null)
      showToast('success', 'Assignment removed.')
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    }
  }

  if (error) return <ErrorState description={error} onRetry={load} />
  if (!script || !answers) return <LoadingState message="Loading script…" />

  const role = user?.active_role ?? user?.role
  const canEdit = canManageScript(role)
  const canSubmit = canEdit && ['UPLOADED', 'MARKED', 'FAILED'].includes(script.status)
  const canFinalize = ['EXAM_MARKING_MANAGER', 'ADMIN'].includes(role ?? '') && script.status === 'TEACHER_REVIEW'
  const canAIMark = ['EXAM_MARKING_MANAGER', 'EXAMINER', 'TEACHER', 'ADMIN'].includes(role ?? '')
    && ['UPLOADED', 'FAILED'].includes(script.status)
  const canOCR = ['EXAM_MARKING_MANAGER', 'EXAMINER', 'TEACHER', 'ADMIN'].includes(role ?? '')
  const canAssign = ['EXAM_MARKING_MANAGER', 'ADMIN'].includes(role ?? '')
  const canReset = role === 'EXAM_MARKING_MANAGER' && ['FAILED', 'PROCESSING'].includes(script.status)

  const allAnswersMarked = answers.length > 0 && answers.every((a) => a.teacher_final_marks !== null)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link
          to="/marking/scripts"
          className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Scripts
        </Link>
      </div>

      <PageHeader
        title={`Candidate ${script.candidate_number || `#${script.candidate}`}`}
        description={`v${script.version} · ${script.file_name}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={STATUS_BADGE[script.status]} label={STATUS_LABEL[script.status]} />

            {canOCR && (
              <Button
                size="sm"
                variant="ghost"
                disabled={actioning !== null}
                onClick={() => handleAction('ocr', () => runOCR(id))}
              >
                <OCRIcon className="mr-1 h-3.5 w-3.5" />
                {actioning === 'ocr' ? 'Extracting…' : 'Run OCR'}
              </Button>
            )}
            {canAIMark && (
              <Button
                size="sm"
                variant="ghost"
                disabled={actioning !== null}
                onClick={() => handleAction('ai', () => runAIMark(id))}
              >
                <AIIcon className="mr-1 h-3.5 w-3.5" />
                {actioning === 'ai' ? 'Marking…' : 'AI Mark'}
              </Button>
            )}
            {canSubmit && (
              <Button
                size="sm"
                variant="secondary"
                disabled={actioning !== null || !allAnswersMarked}
                onClick={() => handleAction('submit', () => submitForReview(id))}
                title={!allAnswersMarked ? 'Mark all answers before submitting' : undefined}
              >
                <SendIcon className="mr-1 h-3.5 w-3.5" />
                {actioning === 'submit' ? 'Submitting…' : 'Submit for review'}
              </Button>
            )}
            {canFinalize && (
              <Button
                size="sm"
                variant="primary"
                disabled={actioning !== null}
                onClick={() => handleAction('finalize', () => finalizeScript(id))}
              >
                {actioning === 'finalize' ? 'Finalizing…' : 'Finalize'}
              </Button>
            )}
            {canReset && (
              <Button
                size="sm"
                variant="ghost"
                disabled={actioning !== null}
                onClick={() => handleAction('reset', () => resetScript(id))}
              >
                <ResetIcon className="mr-1 h-3.5 w-3.5" />
                {actioning === 'reset' ? 'Resetting…' : 'Emergency reset'}
              </Button>
            )}
            {canAssign && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowAssignPanel((v) => !v)
                  if (!assignments) loadAssignments()
                  if (!assignableUsers) loadAssignableUsers()
                }}
              >
                <AssignUserIcon className="mr-1 h-3.5 w-3.5" />
                Assign
              </Button>
            )}
          </div>
        }
      />

      {/* Assignment panel */}
      {canAssign && showAssignPanel && (
        <Card>
          <CardHeader>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Assignments</p>
          </CardHeader>
          <CardBody>
            {assignments === null ? (
              <p className="text-xs text-slate-400">Loading…</p>
            ) : (
              <>
                {assignments.length === 0 && (
                  <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">No assignees yet.</p>
                )}
                {assignments.length > 0 && (
                  <ul className="mb-3 flex flex-col gap-1.5">
                    {assignments.map((a) => (
                      <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
                        <span>
                          <span className="font-medium">{a.assignee_full_name || a.assignee_username}</span>
                          <span className="ml-1.5 text-xs text-slate-500 dark:text-slate-400">({a.role})</span>
                        </span>
                        <button
                          onClick={() => handleUnassign(a)}
                          className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex items-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <label className="text-xs text-slate-500 dark:text-slate-400">Person</label>
                    {assignableUsers === null ? (
                      <p className="text-xs text-slate-400 py-1">Loading…</p>
                    ) : assignableUsers.length === 0 ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400 py-1">Hakuna walimu walio na secondary role ya Examiner shuleni.</p>
                    ) : (
                      <select
                        value={assigneeId}
                        onChange={(e) => setAssigneeId(e.target.value)}
                        className="rounded border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                      >
                        <option value="">— chagua mtu —</option>
                        {assignableUsers.map((u) => (
                          <option key={u.id} value={String(u.id)}>
                            {u.full_name} {u.role === 'TEACHER' ? '(Mwalimu/Examiner)' : '(Examiner)'}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-xs text-slate-500 dark:text-slate-400">Role</label>
                    <select
                      value={assignRole}
                      onChange={(e) => setAssignRole(e.target.value as 'EXAMINER')}
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <option value="EXAMINER">EXAMINER</option>
                    </select>
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={assigning || !assigneeId}
                    onClick={handleAssign}
                  >
                    {assigning ? 'Assigning…' : 'Assign'}
                  </Button>
                </div>
              </>
            )}
          </CardBody>
        </Card>
      )}

      {/* Script page images */}
      {script.pages.length > 0 && (
        <Card>
          <CardHeader>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Script pages ({script.pages.length})
            </p>
          </CardHeader>
          <CardBody>
            <div ref={pageViewerRef} className="flex flex-col gap-3">
              {script.pages.map((page) => (
                <div key={page.id} className="overflow-hidden rounded border border-slate-200 dark:border-slate-700">
                  <img
                    src={page.image_url}
                    alt={`Page ${page.page_number}`}
                    className="w-full object-contain"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* OCR text */}
      {script.extracted_text && (
        <Card>
          <CardHeader>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Extracted text</p>
          </CardHeader>
          <CardBody>
            <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap font-mono text-xs text-slate-600 dark:text-slate-300">
              {script.extracted_text}
            </pre>
          </CardBody>
        </Card>
      )}

      {/* Answer marking */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Answers ({answers.length})
          </p>
          {answers.length > 0 && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {answers.filter((a) => a.teacher_final_marks !== null).length}/{answers.length} marked
            </span>
          )}
        </CardHeader>
        <CardBody>
          {answers.length === 0 ? (
            <EmptyState title="No answers found for this script." />
          ) : (
            <div className="flex flex-col gap-3">
              {answers.map((answer) => (
                <AnswerRow
                  key={answer.id}
                  answer={answer}
                  canEdit={canEdit}
                  onSaved={(updated) =>
                    setAnswers((prev) => prev?.map((a) => (a.id === updated.id ? updated : a)) ?? null)
                  }
                />
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {script.status === 'FAILED' && script.marking_error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <span className="font-medium">Marking error: </span>
          {script.marking_error}
        </div>
      )}
    </div>
  )
}
