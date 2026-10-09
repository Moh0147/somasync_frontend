import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useToast } from '@/components/feedback/Toast'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { DescriptionList } from '@/components/ui/DescriptionList'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PencilIcon, TrashIcon } from '@/components/ui/icons'
import { QuestionCard } from '@/features/quizzes/QuestionEditor'
import { QuickQuestionBuilder } from '@/features/quizzes/QuickQuestionBuilder'
import { useAuth } from '@/features/auth/AuthContext'
import { listClassLevels, listSubjects, listTopics } from '@/services/academicsService'
import { getApiErrorMessage } from '@/services/apiError'
import { listMyClasses } from '@/services/classesService'
import {
  archiveQuiz,
  assignQuizToClass,
  createQuestion,
  deleteQuiz,
  getQuiz,
  listQuestions,
  listQuizAssignments,
  publishQuiz,
  unassignQuizFromClass,
  updateQuiz,
} from '@/services/quizzesService'
import type { ClassLevel, Subject, Topic } from '@/types/academics'
import type { SchoolClass } from '@/types/class'
import type { AuthoredQuestion, QuestionType, Quiz, QuizAssignment } from '@/types/quiz'

const questionTypeOptions: { value: QuestionType; label: string }[] = [
  { value: 'MCQ', label: 'Multiple Choice' },
  { value: 'TRUE_FALSE', label: 'True / False' },
  { value: 'MATCHING', label: 'Matching' },
]

export default function QuizEditorPage() {
  const { quizId } = useParams()
  const id = Number(quizId)
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<AuthoredQuestion[]>([])
  const [assignments, setAssignments] = useState<QuizAssignment[]>([])
  const [myClasses, setMyClasses] = useState<SchoolClass[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [error, setError] = useState<string | null>(null)

  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', description: '' })
  const [editError, setEditError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [questionForm, setQuestionForm] = useState({ question_type: 'MCQ' as QuestionType, text: '', marks: '1' })
  const [questionError, setQuestionError] = useState<string | null>(null)
  const [isAddingQuestion, setIsAddingQuestion] = useState(false)

  const [assignClassId, setAssignClassId] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)

  async function load() {
    setError(null)
    try {
      const [quizData, subjectsData, levelsData, topicsData] = await Promise.all([
        getQuiz(id),
        listSubjects(),
        listClassLevels(),
        listTopics(),
      ])
      setQuiz(quizData)
      setSubjects(subjectsData)
      setClassLevels(levelsData)
      setTopics(topicsData)
      setEditForm({ title: quizData.title, description: quizData.description })

      const [questionsData, assignmentsData, classesData] = await Promise.all([
        listQuestions(id),
        listQuizAssignments(id),
        user ? listMyClasses(user.id) : Promise.resolve([]),
      ])
      setQuestions(questionsData)
      setAssignments(assignmentsData)
      setMyClasses(classesData)
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    load()
  }, [id, user])

  function subjectName(subjectId: number) {
    return subjects.find((subject) => subject.id === subjectId)?.name ?? `#${subjectId}`
  }
  function levelName(levelId: number) {
    return classLevels.find((level) => level.id === levelId)?.name ?? `#${levelId}`
  }
  function topicTitle(topicId: number | null) {
    if (!topicId) return '—'
    return topics.find((topic) => topic.id === topicId)?.title ?? `#${topicId}`
  }
  function className(classId: number) {
    return myClasses.find((schoolClass) => schoolClass.id === classId)?.name ?? `#${classId}`
  }

  async function refreshQuestions() {
    setQuestions(await listQuestions(id))
  }

  async function handleEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setEditError(null)
    setIsSaving(true)
    try {
      const updated = await updateQuiz(id, editForm)
      setQuiz(updated)
      setEditOpen(false)
      showToast('success', 'Quiz updated.')
    } catch (err) {
      setEditError(getApiErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  async function handlePublish() {
    setIsPublishing(true)
    try {
      const updated = await publishQuiz(id)
      setQuiz(updated)
      showToast('success', 'Quiz published.')
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setIsPublishing(false)
    }
  }

  async function handleArchive() {
    setIsPublishing(true)
    try {
      const updated = await archiveQuiz(id)
      setQuiz(updated)
      showToast('success', 'Quiz archived.')
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setIsPublishing(false)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await deleteQuiz(id)
      showToast('success', 'Quiz deleted.')
      navigate('/teacher/quizzes', { replace: true })
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
      setIsDeleting(false)
    }
  }

  async function handleAddQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setQuestionError(null)
    if (!questionForm.text.trim()) {
      setQuestionError('Enter the question text.')
      return
    }
    setIsAddingQuestion(true)
    try {
      await createQuestion({
        quiz: id,
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

  async function handleAssign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!assignClassId) return
    setIsAssigning(true)
    try {
      await assignQuizToClass(id, Number(assignClassId))
      setAssignments(await listQuizAssignments(id))
      setAssignClassId('')
      showToast('success', 'Quiz assigned to class.')
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setIsAssigning(false)
    }
  }

  async function handleUnassign(schoolClassId: number) {
    try {
      await unassignQuizFromClass(id, schoolClassId)
      setAssignments((current) => current.filter((assignment) => assignment.school_class !== schoolClassId))
      showToast('success', 'Quiz unassigned.')
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    }
  }

  if (error) return <ErrorState description={error} onRetry={load} />
  if (!quiz) return <LoadingState message="Loading quiz…" />

  const unassignedClasses = myClasses.filter(
    (schoolClass) => !assignments.some((assignment) => assignment.school_class === schoolClass.id),
  )

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={quiz.title}
        description={subjectName(quiz.subject)}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
              <PencilIcon className="h-3.5 w-3.5" />
              Edit
            </Button>
            {quiz.status === 'DRAFT' && (
              <Button size="sm" disabled={isPublishing} onClick={handlePublish}>
                Publish
              </Button>
            )}
            {quiz.status === 'PUBLISHED' && (
              <Button variant="danger" size="sm" disabled={isPublishing} onClick={handleArchive}>
                Archive
              </Button>
            )}
            {quiz.status === 'DRAFT' && (
              <Button variant="danger" size="sm" disabled={isDeleting} onClick={handleDelete}>
                <TrashIcon className="h-3.5 w-3.5" />
                Delete
              </Button>
            )}
          </>
        }
      />

      <Card>
        <CardHeader className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Quiz details</p>
          <StatusBadge
            status={quiz.status === 'PUBLISHED' ? 'completed' : quiz.status === 'ARCHIVED' ? 'locked' : 'pending'}
            label={quiz.status}
          />
        </CardHeader>
        <CardBody>
          <DescriptionList
            items={[
              { label: 'Subject', value: subjectName(quiz.subject) },
              { label: 'Class level (Form)', value: levelName(quiz.class_level) },
              { label: 'Topic', value: topicTitle(quiz.topic) },
              { label: 'Description', value: quiz.description || '—' },
            ]}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Assigned classes</p>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          {assignments.length === 0 && (
            <EmptyState title="Not assigned to any class yet." description="A student can only attempt this quiz once it's assigned to their class." />
          )}
          {assignments.length > 0 && (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {assignments.map((assignment) => (
                <li key={assignment.id} className="flex items-center justify-between py-2 text-sm">
                  <span>{className(assignment.school_class)}</span>
                  <Button variant="ghost" size="sm" onClick={() => handleUnassign(assignment.school_class)}>
                    Unassign
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {quiz.status === 'PUBLISHED' && unassignedClasses.length > 0 && (
            <form onSubmit={handleAssign} className="flex items-end gap-2">
              <Select
                label="Assign to class"
                value={assignClassId}
                onChange={(event) => setAssignClassId(event.target.value)}
                className="max-w-xs"
              >
                <option value="" disabled>
                  Select a class
                </option>
                {unassignedClasses.map((schoolClass) => (
                  <option key={schoolClass.id} value={schoolClass.id}>
                    {schoolClass.name}
                  </option>
                ))}
              </Select>
              <Button type="submit" size="sm" disabled={isAssigning || !assignClassId}>
                Assign
              </Button>
            </form>
          )}
          {quiz.status === 'DRAFT' && (
            <p className="text-sm text-slate-500 dark:text-slate-400">Publish this quiz before assigning it to a class.</p>
          )}
        </CardBody>
      </Card>

      {questions.length === 0 && <EmptyState title="No questions yet." />}
      {questions
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((question) => (
          <QuestionCard key={question.id} question={question} onChanged={refreshQuestions} onDeleted={refreshQuestions} />
        ))}

      {quiz.status === 'DRAFT' && <QuickQuestionBuilder quizId={id} nextOrder={questions.length + 1} onCreated={refreshQuestions} />}

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

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit quiz">
        <form onSubmit={handleEdit} className="flex flex-col gap-4" noValidate>
          <Input
            label="Title"
            required
            value={editForm.title}
            onChange={(event) => setEditForm({ ...editForm, title: event.target.value })}
          />
          <Input
            label="Description"
            value={editForm.description}
            onChange={(event) => setEditForm({ ...editForm, description: event.target.value })}
          />
          {editError && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {editError}
            </p>
          )}
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
