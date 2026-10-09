import { useState } from 'react'
import type { FormEvent } from 'react'

import { useToast } from '@/components/feedback/Toast'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { TrashIcon } from '@/components/ui/icons'
import { getApiErrorMessage } from '@/services/apiError'
import { addMarkingSchemeItem, deleteExamQuestion, removeMarkingSchemeItem, setQuestionCompulsory } from '@/services/examsService'
import type { ExamQuestion } from '@/types/exam'

export function ExamQuestionCard({
  question,
  canEdit,
  onChanged,
  onDeleted,
}: {
  question: ExamQuestion
  canEdit: boolean
  onChanged: () => void
  onDeleted: () => void
}) {
  const { showToast } = useToast()
  const [criterion, setCriterion] = useState('')
  const [marks, setMarks] = useState('1')
  const [isBusy, setIsBusy] = useState(false)
  const [isCompulsory, setIsCompulsory] = useState(question.is_compulsory)
  const [isTogglingCompulsory, setIsTogglingCompulsory] = useState(false)

  const maxMarks = Number(question.max_marks)
  const totalMarksCents = question.marking_scheme_items.reduce(
    (sum, item) => sum + Math.round(Number(item.marks) * 100),
    0,
  )
  const totalMarks = totalMarksCents / 100
  const isComplete = totalMarksCents === Math.round(maxMarks * 100)

  async function handleAddItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsBusy(true)
    try {
      const usedOrders = new Set(question.marking_scheme_items.map((item) => item.order))
      let nextOrder = 1
      while (usedOrders.has(nextOrder)) nextOrder += 1
      await addMarkingSchemeItem(question.id, { criterion, marks: Number(marks), order: nextOrder })
      setCriterion('')
      setMarks('1')
      onChanged()
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setIsBusy(false)
    }
  }

  async function handleRemoveItem(itemId: number) {
    try {
      await removeMarkingSchemeItem(question.id, itemId)
      onChanged()
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    }
  }

  async function handleDeleteQuestion() {
    try {
      await deleteExamQuestion(question.id)
      onDeleted()
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    }
  }

  async function handleToggleCompulsory() {
    setIsTogglingCompulsory(true)
    try {
      const updated = await setQuestionCompulsory(question.id, !isCompulsory)
      setIsCompulsory(updated.is_compulsory)
      showToast('success', updated.is_compulsory ? 'Marked as required.' : 'Marked as optional (choice question).')
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setIsTogglingCompulsory(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Q{question.question_number} · {question.question_type}
            {question.section ? ` · ${question.section}` : ''}
          </p>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{question.question_text}</p>
          {question.question_type === 'OBJECTIVE' && (
            <p className="text-xs text-slate-500 dark:text-slate-400">Correct answer: {question.correct_answer}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {!isCompulsory && (
            <StatusBadge status="pending" label="Optional" />
          )}
          <StatusBadge
            status={isComplete ? 'completed' : 'pending'}
            label={`${totalMarks.toFixed(2)} / ${maxMarks.toFixed(2)} marks`}
          />
          <Button
            variant="ghost"
            size="sm"
            disabled={isTogglingCompulsory}
            onClick={handleToggleCompulsory}
            title={isCompulsory ? 'Mark as optional (choice question)' : 'Mark as required'}
          >
            {isCompulsory ? 'Set optional' : 'Set required'}
          </Button>
          {canEdit && (
            <Button variant="danger" size="sm" onClick={handleDeleteQuestion}>
              <TrashIcon className="h-3.5 w-3.5" />
              Delete
            </Button>
          )}
        </div>
      </CardHeader>
      <CardBody className="flex flex-col gap-3">
        {question.marking_scheme_items.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">No marking scheme items yet.</p>
        )}
        {question.marking_scheme_items.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {question.marking_scheme_items.map((item) => (
              <li key={item.id} className="flex items-center justify-between text-sm">
                <span>
                  {item.criterion} <span className="text-slate-500 dark:text-slate-400">({Number(item.marks).toFixed(2)} marks)</span>
                </span>
                {canEdit && (
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(item.id)}>
                    <TrashIcon className="h-3.5 w-3.5" />
                    Remove
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
        {canEdit && !isComplete && (
          <form onSubmit={handleAddItem} className="flex flex-wrap items-end gap-2">
            <Input
              label="Criterion"
              value={criterion}
              onChange={(event) => setCriterion(event.target.value)}
              className="w-48"
            />
            <Input
              label="Marks"
              type="number"
              min={1}
              max={(Math.round(maxMarks * 100) - totalMarksCents) / 100}
              value={marks}
              onChange={(event) => setMarks(event.target.value)}
              className="w-24"
            />
            <Button type="submit" size="sm" disabled={isBusy || !criterion}>
              Add item
            </Button>
          </form>
        )}
      </CardBody>
    </Card>
  )
}
