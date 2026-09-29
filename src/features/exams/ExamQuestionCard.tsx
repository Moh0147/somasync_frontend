import { useState } from 'react'
import type { FormEvent } from 'react'

import { useToast } from '@/components/feedback/Toast'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getApiErrorMessage } from '@/services/apiError'
import { addMarkingSchemeItem, deleteExamQuestion, removeMarkingSchemeItem } from '@/services/examsService'
import type { ExamQuestion } from '@/types/exam'

export function ExamQuestionCard({
  question,
  onChanged,
  onDeleted,
}: {
  question: ExamQuestion
  onChanged: () => void
  onDeleted: () => void
}) {
  const { showToast } = useToast()
  const [criterion, setCriterion] = useState('')
  const [marks, setMarks] = useState('1')
  const [isBusy, setIsBusy] = useState(false)

  const totalMarks = question.marking_scheme_items.reduce((sum, item) => sum + item.marks, 0)
  const isComplete = totalMarks === question.max_marks

  async function handleAddItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsBusy(true)
    try {
      const nextOrder = question.marking_scheme_items.length + 1
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
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge
            status={isComplete ? 'completed' : 'pending'}
            label={`${totalMarks} / ${question.max_marks} marks`}
          />
          <Button variant="danger" size="sm" onClick={handleDeleteQuestion}>
            Delete
          </Button>
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
                  {item.criterion} <span className="text-slate-500 dark:text-slate-400">({item.marks} marks)</span>
                </span>
                <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(item.id)}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
        {!isComplete && (
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
              max={question.max_marks - totalMarks}
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
