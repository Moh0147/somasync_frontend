import { useState } from 'react'
import type { FormEvent } from 'react'

import { useToast } from '@/components/feedback/Toast'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { getApiErrorMessage } from '@/services/apiError'
import { addOption, addPair, createQuestion } from '@/services/quizzesService'
import type { QuestionType } from '@/types/quiz'

const emptyRows = ['', '', '', '']

export function QuickQuestionBuilder({ quizId, nextOrder, onCreated }: { quizId: number; nextOrder: number; onCreated: () => void }) {
  const { showToast } = useToast()
  const [type, setType] = useState<QuestionType>('MCQ')
  const [text, setText] = useState('')
  const [marks, setMarks] = useState('1')
  const [options, setOptions] = useState(emptyRows)
  const [correct, setCorrect] = useState(0)
  const [pairs, setPairs] = useState(() => [['', ''], ['', '']])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setText(''); setMarks('1'); setOptions(emptyRows); setCorrect(0); setPairs([['', ''], ['', '']])
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null)
    if (!text.trim()) return setError('Write the question first.')
    setBusy(true)
    try {
      const question = await createQuestion({ quiz: quizId, question_type: type, text: text.trim(), marks: Number(marks) || 1, order: nextOrder })
      if (type === 'TRUE_FALSE') {
        await addOption(question.id, { text: 'True', is_correct: correct === 0, order: 1 })
        await addOption(question.id, { text: 'False', is_correct: correct === 1, order: 2 })
      } else if (type === 'MCQ') {
        const filled = options.map((value, index) => ({ value: value.trim(), index })).filter((item) => item.value)
        if (filled.length < 2) throw new Error('Add at least two answer options.')
        if (correct >= filled.length) throw new Error('Choose the correct answer.')
        for (const [order, item] of filled.entries()) await addOption(question.id, { text: item.value, is_correct: order === correct, order: order + 1 })
      } else {
        const filled = pairs.filter(([left, right]) => left.trim() && right.trim())
        if (filled.length < 2) throw new Error('Add at least two matching pairs.')
        for (const [order, [left, right]] of filled.entries()) await addPair(question.id, { left_text: left.trim(), right_text: right.trim(), order: order + 1 })
      }
      reset(); onCreated(); showToast('success', 'Question added.')
    } catch (err) { setError(getApiErrorMessage(err)); }
    finally { setBusy(false) }
  }

  return <Card className="border-blue-200 dark:border-blue-500/30">
    <CardHeader><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Add a question</p><p className="text-xs text-slate-500 dark:text-slate-400">Create the question and its answers together.</p></CardHeader>
    <CardBody><form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-3 sm:grid-cols-[1fr_10rem_7rem]">
        <Input label="Question" required placeholder="What is photosynthesis?" value={text} onChange={(e) => setText(e.target.value)} />
        <Select label="Type" value={type} onChange={(e) => setType(e.target.value as QuestionType)}><option value="MCQ">Multiple choice</option><option value="TRUE_FALSE">True / False</option><option value="MATCHING">Matching</option></Select>
        <Input label="Marks" type="number" min={1} value={marks} onChange={(e) => setMarks(e.target.value)} />
      </div>
      {type === 'MCQ' && <div className="flex flex-col gap-2"><p className="text-sm font-medium text-slate-700 dark:text-slate-300">Answers <span className="font-normal text-slate-500">(select the correct one)</span></p>{options.map((value, index) => <div key={index} className="flex items-center gap-2"><input type="radio" name={`correct-${quizId}-${nextOrder}`} checked={correct === index} onChange={() => setCorrect(index)} className="h-4 w-4 accent-blue-600" aria-label={`Answer ${index + 1} is correct`} /><Input aria-label={`Answer ${index + 1}`} placeholder={`Answer ${index + 1}`} value={value} onChange={(e) => setOptions((current) => current.map((item, i) => i === index ? e.target.value : item))} /></div>)}</div>}
      {type === 'TRUE_FALSE' && <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300"><p className="mb-2 font-medium">Correct answer</p><label className="mr-5"><input type="radio" checked={correct === 0} onChange={() => setCorrect(0)} className="mr-2 accent-blue-600" />True</label><label><input type="radio" checked={correct === 1} onChange={() => setCorrect(1)} className="mr-2 accent-blue-600" />False</label></div>}
      {type === 'MATCHING' && <div className="flex flex-col gap-2"><p className="text-sm font-medium text-slate-700 dark:text-slate-300">Matching pairs</p>{pairs.map(([left, right], index) => <div key={index} className="grid gap-2 sm:grid-cols-2"><Input aria-label={`Item ${index + 1}`} placeholder={`Item ${index + 1}`} value={left} onChange={(e) => setPairs((current) => current.map((pair, i) => i === index ? [e.target.value, pair[1]] : pair))} /><Input aria-label={`Correct answer ${index + 1}`} placeholder="Correct answer" value={right} onChange={(e) => setPairs((current) => current.map((pair, i) => i === index ? [pair[0], e.target.value] : pair))} /></div>)}<Button type="button" variant="ghost" size="sm" onClick={() => setPairs((current) => [...current, ['', '']])} className="self-start">+ Add another pair</Button></div>}
      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <Button type="submit" disabled={busy} className="self-start">{busy ? 'Saving question…' : 'Add question'}</Button>
    </form></CardBody>
  </Card>
}
