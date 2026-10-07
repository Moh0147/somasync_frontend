import { useState } from 'react'
import type { FormEvent } from 'react'

import { useToast } from '@/components/feedback/Toast'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { CheckIcon, LightbulbIcon } from '@/components/ui/icons'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Textarea } from '@/components/ui/Textarea'
import { getApiErrorMessage } from '@/services/apiError'
import { markAnswer } from '@/services/examsService'
import type { ExamQuestion, StudentExamAnswer } from '@/types/exam'

export function ExamAnswerReviewCard({
  answer,
  question,
  sectionSettings = {},
  onChanged,
}: {
  answer: StudentExamAnswer
  question: ExamQuestion
  sectionSettings?: Record<string, number>
  onChanged: () => void
}) {
  const { showToast } = useToast()
  const [recordedAnswerInput, setRecordedAnswerInput] = useState(answer.recorded_answer)
  const [editingTranscription, setEditingTranscription] = useState(!answer.recorded_answer && !effectivelyOptional)
  const [isSavingTranscription, setIsSavingTranscription] = useState(false)

  const [editingMark, setEditingMark] = useState(false)
  const [markInput, setMarkInput] = useState('')
  const [feedbackInput, setFeedbackInput] = useState('')
  const [isSavingMark, setIsSavingMark] = useState(false)

  const isConfirmed = answer.teacher_final_marks !== null
  const inChoiceSection = Boolean(question.section && sectionSettings[question.section])
  const effectivelyOptional = inChoiceSection || !question.is_compulsory
  const isNotAttempted = !(answer.recorded_answer || '').trim() && effectivelyOptional
  // Needs attention: compulsory section question with no extracted answer, not yet marked.
  const needsAttention = !effectivelyOptional && !(answer.recorded_answer || '').trim() && !isConfirmed

  async function handleSaveTranscription(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSavingTranscription(true)
    try {
      await markAnswer(answer.id, { recorded_answer: recordedAnswerInput })
      setEditingTranscription(false)
      onChanged()
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setIsSavingTranscription(false)
    }
  }

  function openEdit(prefillMarks: string, prefillFeedback: string) {
    setMarkInput(prefillMarks)
    setFeedbackInput(prefillFeedback)
    setEditingMark(true)
  }

  async function confirmMark(marks: number, feedback: string) {
    setIsSavingMark(true)
    try {
      await markAnswer(answer.id, { teacher_final_marks: marks, teacher_comment: feedback })
      setEditingMark(false)
      showToast('success', 'Mark confirmed.')
      onChanged()
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setIsSavingMark(false)
    }
  }

  async function handleSubmitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const marks = Number(markInput)
    if (Number.isNaN(marks)) return
    await confirmMark(marks, feedbackInput)
  }

  return (
    <Card className={needsAttention ? 'border-red-400 dark:border-red-500/60' : undefined}>
      <CardHeader className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Question {question.question_number}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{question.max_marks} marks available</p>
        </div>
        {isConfirmed && (
          <StatusBadge
            status="completed"
            label={
              question.question_type === 'OBJECTIVE'
                ? answer.is_correct
                  ? `Correct — ${answer.teacher_final_marks}/${question.max_marks}`
                  : `Incorrect — ${answer.teacher_final_marks}/${question.max_marks}`
                : `${answer.teacher_final_marks}/${question.max_marks} confirmed`
            }
          />
        )}
        {needsAttention && (
          <StatusBadge status="failed" label="Needs transcription" />
        )}
      </CardHeader>
      <CardBody className="flex flex-col gap-3">
        <p className="text-sm text-slate-700 dark:text-slate-300">{question.question_text}</p>

        {question.marking_scheme_items.length > 0 && (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-800/50">
            <p className="mb-1 font-medium text-slate-700 dark:text-slate-300">Marking scheme</p>
            <ul className="flex flex-col gap-0.5">
              {question.marking_scheme_items.map((item) => (
                <li key={item.id} className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>{item.criterion}</span>
                  <span className="font-medium tabular-nums">{item.marks}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {isNotAttempted ? (
          <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Not attempted — optional question. Will be scored 0 automatically on finalize.
            </p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="shrink-0"
              onClick={() => setEditingTranscription(true)}
            >
              Add answer
            </Button>
          </div>
        ) : editingTranscription ? (
          <form onSubmit={handleSaveTranscription} className="flex flex-col gap-2">
            <Textarea
              label="Student answer (transcribe from the script)"
              value={recordedAnswerInput}
              onChange={(event) => setRecordedAnswerInput(event.target.value)}
              rows={4}
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={isSavingTranscription || !recordedAnswerInput.trim()}
              >
                Save transcription
              </Button>
              {answer.recorded_answer && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => { setRecordedAnswerInput(answer.recorded_answer); setEditingTranscription(false) }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Student answer: <span className="font-medium text-slate-900 dark:text-slate-100">{answer.recorded_answer}</span>
            </p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="shrink-0"
              onClick={() => setEditingTranscription(true)}
            >
              Edit
            </Button>
          </div>
        )}

        {question.question_type === 'SUBJECTIVE' && !isConfirmed && !editingMark && !isNotAttempted && (
          <>
            {answer.ai_marks_awarded !== null ? (
              <div className="flex flex-col gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                  <LightbulbIcon aria-hidden="true" className="h-3.5 w-3.5" /> AI-assisted suggestion
                </p>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                  Suggested mark: {answer.ai_marks_awarded} / {question.max_marks}
                </p>
                {answer.ai_feedback && <p className="text-sm text-amber-800 dark:text-amber-300">Reason: {answer.ai_feedback}</p>}
                <p className="text-xs text-amber-700/80 dark:text-amber-400/80">
                  This is a suggestion only — you decide the final mark.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    size="sm"
                    disabled={isSavingMark}
                    onClick={() => confirmMark(answer.ai_marks_awarded!, answer.ai_feedback)}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => openEdit(String(answer.ai_marks_awarded), answer.ai_feedback)}
                  >
                    Edit Mark
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => openEdit('0', '')}>
                    Reject
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {answer.recorded_answer ? 'Not yet AI-marked.' : 'No answer recorded — student may have left this blank.'}
                </p>
                <Button size="sm" variant="ghost" onClick={() => openEdit('0', '')}>
                  Mark manually
                </Button>
              </div>
            )}
          </>
        )}

        {editingMark && (
          <form onSubmit={handleSubmitEdit} className="flex flex-col gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
            <Input
              label="Marks"
              type="number"
              min={0}
              max={question.max_marks}
              value={markInput}
              onChange={(event) => setMarkInput(event.target.value)}
            />
            <Textarea label="Feedback" value={feedbackInput} onChange={(event) => setFeedbackInput(event.target.value)} />
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={isSavingMark}>
                Confirm final mark
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setEditingMark(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {isConfirmed && question.question_type === 'SUBJECTIVE' && !editingMark && (
          <div className="flex flex-col gap-1 rounded-md border border-green-200 bg-green-50 p-3 dark:border-green-500/20 dark:bg-green-500/10">
            <p className="flex items-center gap-1 text-sm font-medium text-green-800 dark:text-green-300">
              <CheckIcon aria-hidden="true" className="h-4 w-4" /> Confirmed: {answer.teacher_final_marks} /{' '}
              {question.max_marks}
            </p>
            {answer.teacher_comment && <p className="text-sm text-green-700 dark:text-green-400">{answer.teacher_comment}</p>}
            <Button
              size="sm"
              variant="ghost"
              className="self-start"
              onClick={() => openEdit(String(answer.teacher_final_marks), answer.teacher_comment)}
            >
              Edit
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
