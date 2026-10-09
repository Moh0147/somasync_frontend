import { useState } from 'react'
import type { FormEvent } from 'react'

import { useToast } from '@/components/feedback/Toast'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { CheckIcon, TrashIcon } from '@/components/ui/icons'
import { Input } from '@/components/ui/Input'
import { getApiErrorMessage } from '@/services/apiError'
import { addOption, addPair, deleteQuestion, removeOption, removePair } from '@/services/quizzesService'
import type { AuthoredQuestion } from '@/types/quiz'

export function QuestionCard({
  question,
  onChanged,
  onDeleted,
}: {
  question: AuthoredQuestion
  onChanged: () => void
  onDeleted: () => void
}) {
  const { showToast } = useToast()
  const [optionText, setOptionText] = useState('')
  const [optionCorrect, setOptionCorrect] = useState(false)
  const [pairLeft, setPairLeft] = useState('')
  const [pairRight, setPairRight] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const [pairError, setPairError] = useState<string | null>(null)

  async function handleAddOption(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsBusy(true)
    try {
      const nextOrder = question.options.length + 1
      await addOption(question.id, { text: optionText, is_correct: optionCorrect, order: nextOrder })
      setOptionText('')
      setOptionCorrect(false)
      onChanged()
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setIsBusy(false)
    }
  }

  async function handleRemoveOption(optionId: number) {
    try {
      await removeOption(question.id, optionId)
      onChanged()
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    }
  }

  async function handleAddPair(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const left = pairLeft.trim()
    const right = pairRight.trim()
    setPairError(null)
    if (!left || !right) {
      setPairError('Fill in both sides before adding the match.')
      return
    }
    if (question.pairs.some((pair) => pair.left_text.toLowerCase() === left.toLowerCase())) {
      setPairError('This left item has already been added.')
      return
    }
    if (question.pairs.some((pair) => pair.right_text.toLowerCase() === right.toLowerCase())) {
      setPairError('This answer has already been used. Each answer should match one item.')
      return
    }
    setIsBusy(true)
    try {
      const nextOrder = question.pairs.length + 1
      await addPair(question.id, { left_text: left, right_text: right, order: nextOrder })
      setPairLeft('')
      setPairRight('')
      onChanged()
    } catch (err) {
      setPairError(getApiErrorMessage(err))
    } finally {
      setIsBusy(false)
    }
  }

  async function handleRemovePair(pairId: number) {
    try {
      await removePair(question.id, pairId)
      onChanged()
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    }
  }

  async function handleDeleteQuestion() {
    try {
      await deleteQuestion(question.id)
      onDeleted()
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    }
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{question.question_type}</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{question.text}</p>
        </div>
        <Button variant="danger" size="sm" onClick={handleDeleteQuestion}>
          <TrashIcon className="h-3.5 w-3.5" />
          Delete question
        </Button>
      </CardHeader>
      <CardBody className="flex flex-col gap-3">
        {question.question_type === 'MATCHING' ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-3 dark:border-blue-500/20 dark:bg-blue-500/10">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">Marks distribution</p>
              <p className="text-sm text-blue-900 dark:text-blue-200">
                This question is worth <strong>{question.marks} mark{question.marks === 1 ? '' : 's'}</strong> in total.
                {question.pairs.length > 0 && <> Each correct match is worth <strong>{(question.marks / question.pairs.length).toFixed(2)}</strong> mark{question.marks / question.pairs.length === 1 ? '' : 's'}.</>}
              </p>
              <p className="mt-1 text-xs text-blue-800 dark:text-blue-300">Students receive partial credit for correct matches; all matches must be correct to receive the full mark.</p>
            </div>
            {question.pairs.length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-3 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <span>Item</span><span /> <span>Correct answer</span><span />
                </div>
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {question.pairs.map((pair, index) => (
                    <li key={pair.id} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-3 px-3 py-2.5 text-sm">
                      <span className="min-w-0 break-words font-medium text-slate-800 dark:text-slate-200"><span className="mr-2 text-xs text-slate-400">{index + 1}.</span>{pair.left_text}</span>
                      <span className="text-slate-400">→</span>
                      <span className="min-w-0 break-words text-slate-700 dark:text-slate-300">{pair.right_text}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleRemovePair(pair.id)}>
                        <TrashIcon className="h-3.5 w-3.5" />
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 px-4 py-5 text-center dark:border-slate-700">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No matches added yet</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Start with the first item and its correct answer below.</p>
              </div>
            )}

            <form onSubmit={handleAddPair} className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
              <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-200">Add a match</p>
              <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto] md:items-end">
                <Input label="Item" placeholder="e.g. Heart" value={pairLeft} onChange={(event) => { setPairLeft(event.target.value); setPairError(null) }} />
                <span className="hidden pb-2 text-slate-400 md:block">matches</span>
                <Input label="Correct answer" placeholder="e.g. Pumps blood" value={pairRight} onChange={(event) => { setPairRight(event.target.value); setPairError(null) }} />
                <Button type="submit" disabled={isBusy} className="w-full md:w-auto">{isBusy ? 'Adding…' : 'Add match'}</Button>
              </div>
              {pairError && <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">{pairError}</p>}
            </form>
          </div>
        ) : (
          <>
            {question.options.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No options yet.</p>}
            {question.options.length > 0 && (
              <ul className="flex flex-col gap-1.5">
                {question.options.map((option) => (
                  <li key={option.id} className="flex items-center justify-between text-sm">
                    <span
                      className={`flex items-center gap-1 ${option.is_correct ? 'font-medium text-green-700 dark:text-green-400' : 'text-slate-700 dark:text-slate-300'}`}
                    >
                      {option.is_correct && <CheckIcon aria-hidden="true" className="h-3.5 w-3.5" />}
                      {option.text}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveOption(option.id)}>
                      <TrashIcon className="h-3.5 w-3.5" />
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={handleAddOption} className="flex flex-wrap items-end gap-2">
              <Input
                label="Option text"
                value={optionText}
                onChange={(event) => setOptionText(event.target.value)}
                className="w-48"
              />
              <label className="flex items-center gap-1.5 pb-2.5 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={optionCorrect}
                  onChange={(event) => setOptionCorrect(event.target.checked)}
                  className="h-4 w-4 accent-blue-600"
                />
                Correct
              </label>
              <Button type="submit" size="sm" disabled={isBusy || !optionText}>
                Add option
              </Button>
            </form>
          </>
        )}
      </CardBody>
    </Card>
  )
}
