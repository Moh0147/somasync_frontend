import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useToast } from '@/components/feedback/Toast'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Table } from '@/components/ui/Table'
import { Textarea } from '@/components/ui/Textarea'
import { listClassLevels, listLearningObjectives, listSubjects, listTopics } from '@/services/academicsService'
import { getApiErrorMessage } from '@/services/apiError'
import { createQuiz, listQuizzes } from '@/services/quizzesService'
import type { ClassLevel, LearningObjective, Subject, Topic } from '@/types/academics'
import type { Quiz } from '@/types/quiz'

const emptyForm = {
  title: '',
  subject: '',
  class_level: '',
  topic: '',
  learning_objective: '',
  description: '',
}

export default function QuizzesPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [quizzes, setQuizzes] = useState<Quiz[] | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [objectives, setObjectives] = useState<LearningObjective[]>([])
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function load() {
    setError(null)
    setQuizzes(null)
    try {
      const [quizzesData, subjectsData, levelsData, topicsData, objectivesData] = await Promise.all([
        listQuizzes(),
        listSubjects(),
        listClassLevels(),
        listTopics(),
        listLearningObjectives(),
      ])
      setQuizzes(quizzesData)
      setSubjects(subjectsData)
      setClassLevels(levelsData)
      setTopics(topicsData)
      setObjectives(objectivesData)
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    load()
  }, [])

  function subjectName(subjectId: number) {
    return subjects.find((subject) => subject.id === subjectId)?.name ?? `#${subjectId}`
  }
  function levelName(levelId: number) {
    return classLevels.find((level) => level.id === levelId)?.name ?? `#${levelId}`
  }

  const topicsForSubject = useMemo(
    () => topics.filter((topic) => String(topic.subject) === form.subject),
    [topics, form.subject],
  )
  const objectivesForTopic = useMemo(
    () => objectives.filter((objective) => String(objective.topic) === form.topic),
    [objectives, form.topic],
  )

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    if (!form.subject || !form.class_level) {
      setFormError('Select a subject and class level.')
      return
    }

    setIsSubmitting(true)
    try {
      await createQuiz({
        title: form.title,
        subject: Number(form.subject),
        class_level: Number(form.class_level),
        topic: form.topic ? Number(form.topic) : null,
        learning_objective: form.learning_objective ? Number(form.learning_objective) : null,
        description: form.description,
      })
      setModalOpen(false)
      setForm(emptyForm)
      showToast('success', 'Quiz created.')
      await load()
    } catch (err) {
      setFormError(getApiErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Quizzes"
        actions={
          <Button size="sm" onClick={() => setModalOpen(true)}>
            Create quiz
          </Button>
        }
      />

      {error && <ErrorState description={error} onRetry={load} />}
      {!error && !quizzes && <LoadingState message="Loading quizzes…" />}
      {!error && quizzes && quizzes.length === 0 && (
        <EmptyState title="No quizzes yet." description="Create your first quiz to get started." />
      )}
      {!error && quizzes && quizzes.length > 0 && (
        <Table
          columns={[
            { key: 'title', header: 'Quiz', render: (row: Quiz) => (
              <div>
                <span className="font-medium text-slate-900 dark:text-slate-100">{row.title}</span>
                <p className="mt-0.5 text-xs text-slate-500 sm:hidden dark:text-slate-400">{subjectName(row.subject)} · {levelName(row.class_level)}</p>
              </div>
            )},
            { key: 'subject', header: 'Subject', render: (row: Quiz) => subjectName(row.subject), hideOnMobile: true },
            { key: 'level', header: 'Level', render: (row: Quiz) => levelName(row.class_level), hideOnMobile: true },
            {
              key: 'status',
              header: 'Status',
              render: (row: Quiz) => {
                const status = row.status === 'PUBLISHED' ? 'completed' : row.status === 'ARCHIVED' ? 'locked' : 'pending'
                return <StatusBadge status={status} label={row.status} />
              },
            },
          ]}
          data={quizzes}
          getRowKey={(row) => String(row.id)}
          onRowClick={(row) => navigate(`/teacher/quizzes/${row.id}`)}
        />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create quiz">
        <form onSubmit={handleCreate} className="flex flex-col gap-4" noValidate>
          <Input
            label="Title"
            placeholder="End of Term Quiz"
            required
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />
          <Select
            label="Subject"
            required
            value={form.subject}
            onChange={(event) => setForm({ ...form, subject: event.target.value, topic: '', learning_objective: '' })}
          >
            <option value="" disabled>
              Select a subject
            </option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </Select>
          <Select
            label="Class level (Form)"
            required
            value={form.class_level}
            onChange={(event) => setForm({ ...form, class_level: event.target.value })}
          >
            <option value="" disabled>
              Select a level
            </option>
            {classLevels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))}
          </Select>
          <Select
            label="Topic (optional)"
            value={form.topic}
            disabled={!form.subject}
            onChange={(event) => setForm({ ...form, topic: event.target.value, learning_objective: '' })}
          >
            <option value="">No topic</option>
            {topicsForSubject.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.title}
              </option>
            ))}
          </Select>
          <Select
            label="Learning objective (optional)"
            value={form.learning_objective}
            disabled={!form.topic}
            onChange={(event) => setForm({ ...form, learning_objective: event.target.value })}
          >
            <option value="">No learning objective</option>
            {objectivesForTopic.map((objective) => (
              <option key={objective.id} value={objective.id}>
                {objective.description.slice(0, 60)}
              </option>
            ))}
          </Select>
          <Textarea
            label="Description"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
          {formError && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {formError}
            </p>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create quiz'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
