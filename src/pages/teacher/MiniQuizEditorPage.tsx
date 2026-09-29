import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useParams } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useToast } from '@/components/feedback/Toast'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { QuestionCard } from '@/features/quizzes/QuestionEditor'
import { QuickQuestionBuilder } from '@/features/quizzes/QuickQuestionBuilder'
import { getApiErrorMessage } from '@/services/apiError'
import { createMiniQuiz, getMiniQuiz } from '@/services/lessonsService'
import { createQuestion, getQuiz, listQuestions, publishQuiz } from '@/services/quizzesService'
import type { SectionMiniQuiz } from '@/types/lesson'
import type { AuthoredQuestion, Quiz, QuestionType } from '@/types/quiz'

const questionTypeOptions: { value: QuestionType; label: string }[] = [
  { value: 'MCQ', label: 'Multiple Choice' },
  { value: 'TRUE_FALSE', label: 'True / False' },
  { value: 'MATCHING', label: 'Matching' },
]

export default function MiniQuizEditorPage() {
  const { lessonId, sectionId } = useParams()
  const lessonIdNum = Number(lessonId)
  const sectionIdNum = Number(sectionId)
  const { showToast } = useToast()

  const [miniQuiz, setMiniQuiz] = useState<SectionMiniQuiz | null>(null)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<AuthoredQuestion[]>([])
  const [hasMiniQuiz, setHasMiniQuiz] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [passingScoreInput, setPassingScoreInput] = useState('70')
  const [isCreating, setIsCreating] = useState(false)

  const [questionForm, setQuestionForm] = useState({ question_type: 'MCQ' as QuestionType, text: '', marks: '1' })
  const [questionError, setQuestionError] = useState<string | null>(null)
  const [isAddingQuestion, setIsAddingQuestion] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  async function load() {
    setError(null)
    try {
      const existing = await getMiniQuiz(sectionIdNum).catch(() => null)
      if (!existing) {
        setHasMiniQuiz(false)
        return
      }
      setHasMiniQuiz(true)
      setMiniQuiz(existing)
      const [quizData, questionsData] = await Promise.all([getQuiz(existing.quiz), listQuestions(existing.quiz)])
      setQuiz(quizData)
      setQuestions(questionsData)
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    load()
  }, [sectionIdNum])

  async function refreshQuestions() {
    if (!miniQuiz) return
    setQuestions(await listQuestions(miniQuiz.quiz))
  }

  async function handleCreateMiniQuiz(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsCreating(true)
    try {
      await createMiniQuiz(sectionIdNum, Number(passingScoreInput))
      showToast('success', 'Mini-quiz created.')
      await load()
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setIsCreating(false)
    }
  }

  async function handleAddQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setQuestionError(null)
    if (!miniQuiz || !questionForm.text.trim()) {
      setQuestionError('Enter the question text.')
      return
    }
    setIsAddingQuestion(true)
    try {
      await createQuestion({
        quiz: miniQuiz.quiz,
        question_type: questionForm.question_type,
        text: questionForm.text,
        marks: Number(questionForm.marks) || 1,
        order: questions.length + 1,
      })
      setQuestionForm({ question_type: 'MCQ', text: '', marks: '1' })
      await refreshQuestions()
      showToast('success', 'Question added.')
    } catch (err) {
      setQuestionError(getApiErrorMessage(err))
    } finally {
      setIsAddingQuestion(false)
    }
  }

  async function handleDeleteQuestion() {
    await refreshQuestions()
  }

  async function handlePublish() {
    if (!miniQuiz) return
    setIsPublishing(true)
    try {
      const updated = await publishQuiz(miniQuiz.quiz)
      setQuiz(updated)
      showToast('success', 'Mini-quiz published.')
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setIsPublishing(false)
    }
  }

  if (error) return <ErrorState description={error} onRetry={load} />
  if (hasMiniQuiz === null) return <LoadingState message="Loading mini-quiz…" />

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb
        items={[
          { label: 'Lessons', href: '/teacher/lessons' },
          { label: 'Lesson', href: `/teacher/lessons/${lessonIdNum}` },
          { label: 'Mini-Quiz' },
        ]}
      />
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Mini-Quiz</h1>

      {!hasMiniQuiz && (
        <Card>
          <CardHeader>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Create a mini-quiz for this section</p>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleCreateMiniQuiz} className="flex flex-col gap-4" noValidate>
              <Input
                label="Pass percentage"
                type="number"
                min={0}
                max={100}
                helperText="The student must score at least this percentage to unlock the next section."
                value={passingScoreInput}
                onChange={(event) => setPassingScoreInput(event.target.value)}
              />
              <Button type="submit" disabled={isCreating} className="self-start">
                {isCreating ? 'Creating…' : 'Create mini-quiz'}
              </Button>
            </form>
          </CardBody>
        </Card>
      )}

      {hasMiniQuiz && miniQuiz && quiz && (
        <>
          <Card>
            <CardHeader className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Pass mark: {miniQuiz.passing_score}%</p>
              <div className="flex items-center gap-2">
                <StatusBadge status={quiz.status === 'PUBLISHED' ? 'completed' : 'pending'} label={quiz.status} />
                {quiz.status === 'DRAFT' && (
                  <Button size="sm" disabled={isPublishing} onClick={handlePublish}>
                    Publish quiz
                  </Button>
                )}
              </div>
            </CardHeader>
          </Card>

          {questions.length === 0 && <EmptyState title="No questions yet." />}
          {questions
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                onChanged={refreshQuestions}
                onDeleted={handleDeleteQuestion}
              />
            ))}

          {quiz.status === 'DRAFT' && <QuickQuestionBuilder quizId={miniQuiz.quiz} nextOrder={questions.length + 1} onCreated={refreshQuestions} />}

      {false && quiz!.status === 'DRAFT' && (
            <Card>
              <CardHeader>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Add question</p>
              </CardHeader>
              <CardBody>
                <form onSubmit={handleAddQuestion} className="flex flex-col gap-4" noValidate>
                  <Select
                    label="Question type"
                    value={questionForm.question_type}
                    onChange={(event) =>
                      setQuestionForm({ ...questionForm, question_type: event.target.value as QuestionType })
                    }
                  >
                    {questionTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                  <Input
                    label="Question text"
                    required
                    value={questionForm.text}
                    onChange={(event) => setQuestionForm({ ...questionForm, text: event.target.value })}
                  />
                  <Input
                    label="Marks"
                    type="number"
                    min={1}
                    step={1}
                    helperText={questionForm.question_type === 'MATCHING' ? 'For matching, this is the total mark for the whole question. It is shared equally across all matches.' : 'Total marks awarded for a correct answer.'}
                    value={questionForm.marks}
                    onChange={(event) => setQuestionForm({ ...questionForm, marks: event.target.value })}
                  />
                  {questionError && (
                    <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                      {questionError}
                    </p>
                  )}
                  <Button type="submit" disabled={isAddingQuestion} className="self-start">
                    {isAddingQuestion ? 'Adding…' : 'Add question'}
                  </Button>
                </form>
              </CardBody>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
