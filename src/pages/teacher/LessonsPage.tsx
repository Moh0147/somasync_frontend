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
import {
  listClassLevels,
  listLearningObjectives,
  listSubjects,
  listTopics,
} from '@/services/academicsService'
import { getApiErrorMessage } from '@/services/apiError'
import { createLesson, listLessons } from '@/services/lessonsService'
import type { ClassLevel, LearningObjective, Subject, Topic } from '@/types/academics'
import type { Lesson } from '@/types/lesson'

const emptyForm = {
  title: '',
  subject: '',
  class_level: '',
  topic: '',
  learning_objective: '',
  description: '',
}

export default function LessonsPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [lessons, setLessons] = useState<Lesson[] | null>(null)
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
    setLessons(null)
    try {
      const [lessonsData, subjectsData, levelsData, topicsData, objectivesData] = await Promise.all([
        listLessons(),
        listSubjects(),
        listClassLevels(),
        listTopics(),
        listLearningObjectives(),
      ])
      setLessons(lessonsData)
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
      await createLesson({
        title: form.title,
        subject: Number(form.subject),
        class_level: Number(form.class_level),
        topic: form.topic ? Number(form.topic) : null,
        learning_objective: form.learning_objective ? Number(form.learning_objective) : null,
        description: form.description,
      })
      setModalOpen(false)
      setForm(emptyForm)
      showToast('success', 'Lesson created.')
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
        title="Lessons"
        actions={
          <Button size="sm" onClick={() => setModalOpen(true)}>
            Create lesson
          </Button>
        }
      />

      {error && <ErrorState description={error} onRetry={load} />}
      {!error && !lessons && <LoadingState message="Loading lessons…" />}
      {!error && lessons && lessons.length === 0 && (
        <EmptyState title="No lessons yet." description="Create your first lesson to get started." />
      )}
      {!error && lessons && lessons.length > 0 && (
        <Table
          columns={[
            { key: 'title', header: 'Lesson', render: (row: Lesson) => <span className="font-medium text-slate-900 dark:text-slate-100">{row.title}</span> },
            { key: 'subject', header: 'Subject', render: (row: Lesson) => subjectName(row.subject) },
            { key: 'level', header: 'Level', render: (row: Lesson) => levelName(row.class_level) },
            {
              key: 'status',
              header: 'Status',
              render: (row: Lesson) => {
                const status =
                  row.status === 'PUBLISHED' ? 'completed' : row.status === 'ARCHIVED' ? 'locked' : 'pending'
                return <StatusBadge status={status} label={row.status} />
              },
            },
          ]}
          data={lessons}
          getRowKey={(row) => String(row.id)}
          onRowClick={(row) => navigate(`/teacher/lessons/${row.id}`)}
        />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create lesson">
        <form onSubmit={handleCreate} className="flex flex-col gap-4" noValidate>
          <Input
            label="Title"
            placeholder="Photosynthesis"
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
            {isSubmitting ? 'Creating…' : 'Create lesson'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
