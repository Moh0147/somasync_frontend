import { useState } from 'react'
import type { FormEvent } from 'react'

import { useToast } from '@/components/feedback/Toast'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
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
    setIsBusy(true)
    try {
      const nextOrder = question.pairs.length + 1
      await addPair(question.id, { left_text: pairLeft, right_text: pairRight, order: nextOrder })
      setPairLeft('')
      setPairRight('')
      onChanged()
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
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
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{question.question_type}</p>
          <p className="text-sm font-semibold text-slate-900">{question.text}</p>
        </div>
        <Button variant="danger" size="sm" onClick={handleDeleteQuestion}>
          Delete question
        </Button>
      </CardHeader>
      <CardBody className="flex flex-col gap-3">
        {question.question_type === 'MATCHING' ? (
          <>
            {question.pairs.length === 0 && <p className="text-sm text-slate-500">No pairs yet.</p>}
            {question.pairs.length > 0 && (
              <ul className="flex flex-col gap-1.5">
                {question.pairs.map((pair) => (
                  <li key={pair.id} className="flex items-center justify-between text-sm">
                    <span>
                      {pair.left_text} → {pair.right_text}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => handleRemovePair(pair.id)}>
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={handleAddPair} className="flex flex-wrap items-end gap-2">
              <Input
                label="Left"
                value={pairLeft}
                onChange={(event) => setPairLeft(event.target.value)}
                className="w-40"
              />
              <Input
                label="Right (correct match)"
                value={pairRight}
                onChange={(event) => setPairRight(event.target.value)}
                className="w-40"
              />
              <Button type="submit" size="sm" disabled={isBusy || !pairLeft || !pairRight}>
                Add pair
              </Button>
            </form>
          </>
        ) : (
          <>
            {question.options.length === 0 && <p className="text-sm text-slate-500">No options yet.</p>}
            {question.options.length > 0 && (
              <ul className="flex flex-col gap-1.5">
                {question.options.map((option) => (
                  <li key={option.id} className="flex items-center justify-between text-sm">
                    <span className={option.is_correct ? 'font-medium text-green-700' : 'text-slate-700'}>
                      {option.is_correct ? '✓ ' : ''}
                      {option.text}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveOption(option.id)}>
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
              <label className="flex items-center gap-1.5 pb-2.5 text-sm text-slate-700">
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
