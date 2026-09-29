import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { ClockIcon, CheckIcon } from '@/components/ui/icons'
import { getApiErrorMessage } from '@/services/apiError'
import { getQuiz, getStudentQuizQuestions, listMyAttempts, startQuizAttempt, submitQuizAttempt, answerQuizQuestion } from '@/services/quizzesService'
import type { SafeQuestion, Quiz } from '@/types/quiz'
import type { StudentQuizAttempt } from '@/types/quizAttempt'

export default function QuizDetailPage() {
  const { quizId } = useParams(); const id = Number(quizId)
  const [quiz, setQuiz] = useState<Quiz | null>(null); const [questions, setQuestions] = useState<SafeQuestion[]>([])
  const [attempts, setAttempts] = useState<StudentQuizAttempt[]>([]); const [attempt, setAttempt] = useState<StudentQuizAttempt | null>(null)
  const [answers, setAnswers] = useState<Record<number, number | Record<string, string>>>({}); const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [submitted, setSubmitted] = useState(false)

  async function load() { setError(null); setLoading(true); try { const [quizData, qs, allAttempts] = await Promise.all([getQuiz(id), getStudentQuizQuestions(id), listMyAttempts()]); setQuiz(quizData); setQuestions(qs); setAttempts(allAttempts.filter((item) => item.quiz === id)) } catch (err) { setError(getApiErrorMessage(err)) } finally { setLoading(false) } }
  useEffect(() => { load() }, [id])
  if (error) return <ErrorState description={error} onRetry={load} />
  if (loading || !quiz) return <LoadingState message="Loading quiz…" />
  const answered = questions.filter((q) => q.question_type === 'MATCHING' ? Object.keys((answers[q.id] as Record<string, string>) ?? {}).length === q.pairs.length : answers[q.id] !== undefined).length
  async function begin() { setBusy(true); try { const started = await startQuizAttempt(id); setAttempt(started) } catch (err) { setError(getApiErrorMessage(err)) } finally { setBusy(false) } }
  async function finish() { if (!attempt || answered !== questions.length) return; setBusy(true); try { for (const q of questions) { const value = answers[q.id]; await answerQuizQuestion(attempt.client_attempt_id, q.id, q.question_type === 'MATCHING' ? undefined : value as number, q.question_type === 'MATCHING' ? value as Record<string, string> : undefined) } const result = await submitQuizAttempt(attempt.client_attempt_id); setAttempt(result); setSubmitted(true) } catch (err) { setError(getApiErrorMessage(err)) } finally { setBusy(false) } }
  return <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
    <div><h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{quiz.title}</h1>{quiz.description && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{quiz.description}</p>}</div>
    {!attempt && <Card><CardBody className="flex items-center justify-between gap-3"><div><p className="font-semibold text-slate-900 dark:text-slate-100">Ready to begin?</p><p className="text-sm text-slate-500">{questions.length} questions · Answer all questions before submitting.</p></div><Button onClick={begin} disabled={busy}>{busy ? 'Starting…' : 'Start quiz'}</Button></CardBody></Card>}
    {attempt && !submitted && <Card><CardHeader className="flex items-center justify-between"><p className="font-semibold text-slate-900 dark:text-slate-100">Quiz questions</p><span className="text-sm text-slate-500">{answered}/{questions.length} answered</span></CardHeader><CardBody className="flex flex-col gap-6">{questions.map((q, i) => <div key={q.id} className="flex flex-col gap-2"><p className="font-medium text-slate-900 dark:text-slate-100">{i + 1}. {q.text} <span className="text-xs text-slate-500">({q.marks} mark{q.marks === 1 ? '' : 's'})</span></p>{q.question_type === 'MATCHING' ? <div className="flex flex-col gap-2">{q.pairs.map((pair) => <div key={pair.id} className="flex items-center gap-3"><span className="w-40 text-sm">{pair.left_text}</span><Select value={(answers[q.id] as Record<string, string> | undefined)?.[String(pair.id)] ?? ''} onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: { ...(a[q.id] as Record<string, string> | undefined), [String(pair.id)]: e.target.value } }))}><option value="">Choose answer</option>{q.right_options.map((option) => <option key={option} value={option}>{option}</option>)}</Select></div>)}</div> : <div className="flex flex-col gap-2">{q.options.map((option) => <label key={option.id} className="rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"><input type="radio" name={`q-${q.id}`} checked={answers[q.id] === option.id} onChange={() => setAnswers((a) => ({ ...a, [q.id]: option.id }))} className="mr-2 accent-blue-600" />{option.text}</label>)}</div>}</div>)}<Button onClick={finish} disabled={busy || answered !== questions.length}>{busy ? 'Submitting…' : 'Submit quiz'}</Button></CardBody></Card>}
    {submitted && attempt && <Card><CardBody className="flex flex-col items-center gap-2 py-8 text-center"><CheckIcon className="h-8 w-8 text-green-600" /><p className="font-semibold">Quiz submitted</p><p className="text-2xl font-bold">{attempt.percentage}%</p><p className="text-sm text-slate-500">{attempt.score} / {attempt.total_marks} marks</p></CardBody></Card>}
    <Card><CardHeader><p className="font-semibold text-slate-900 dark:text-slate-100">Your previous attempts</p></CardHeader><CardBody>{attempts.length === 0 ? <EmptyState title="No previous attempts." /> : <ul className="divide-y divide-slate-100 dark:divide-slate-800">{attempts.map((item) => <li key={item.id} className="flex justify-between py-2 text-sm"><span className="flex gap-1.5 text-slate-500"><ClockIcon className="h-3.5 w-3.5" />{new Date(item.started_at).toLocaleString()}</span><strong>{item.percentage !== null ? `${item.percentage}%` : item.status}</strong></li>)}</ul>}</CardBody></Card>
  </div>
}
