import { useEffect, useState } from 'react'
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
import { listClassLevels, listSubjects } from '@/services/academicsService'
import { getApiErrorMessage } from '@/services/apiError'
import { createExam, listExams } from '@/services/examsService'
import type { ClassLevel, Subject } from '@/types/academics'
import type { Exam } from '@/types/exam'

const currentYear = new Date().getFullYear()
const emptyForm = { title: '', subject: '', class_level: '', academic_year: String(currentYear), exam_date: '', description: '' }

export default function ExamsPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [exams, setExams] = useState<Exam[] | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([])
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function load() {
    setError(null)
    setExams(null)
    try {
      const [examsData, subjectsData, levelsData] = await Promise.all([listExams(), listSubjects(), listClassLevels()])
      setExams(examsData)
      setSubjects(subjectsData)
      setClassLevels(levelsData)
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

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    if (!form.subject || !form.class_level) {
      setFormError('Select a subject and class level.')
      return
    }

    setIsSubmitting(true)
    try {
      await createExam({
        title: form.title,
        subject: Number(form.subject),
        class_level: Number(form.class_level),
        academic_year: Number(form.academic_year),
        exam_date: form.exam_date || null,
        description: form.description,
      })
      setModalOpen(false)
      setForm(emptyForm)
      showToast('success', 'Exam created.')
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
        title="Exams"
        actions={
          <Button size="sm" onClick={() => setModalOpen(true)}>
            Create exam
          </Button>
        }
      />

      {error && <ErrorState description={error} onRetry={load} />}
      {!error && !exams && <LoadingState message="Loading exams…" />}
      {!error && exams && exams.length === 0 && (
        <EmptyState title="No exams yet." description="Create your first exam to get started." />
      )}
      {!error && exams && exams.length > 0 && (
        <Table
          columns={[
            {
              key: 'title',
              header: 'Exam',
              render: (row: Exam) => (
                <button
                  type="button"
                  onClick={() => navigate(`/teacher/exams/${row.id}`)}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {row.title}
                </button>
              ),
            },
            { key: 'subject', header: 'Subject', render: (row: Exam) => subjectName(row.subject) },
            { key: 'level', header: 'Level', render: (row: Exam) => levelName(row.class_level) },
            { key: 'year', header: 'Year', render: (row: Exam) => String(row.academic_year) },
            {
              key: 'status',
              header: 'Status',
              render: (row: Exam) => {
                const status =
                  row.status === 'DRAFT'
                    ? 'pending'
                    : row.status === 'RESULTS_PUBLISHED'
                      ? 'completed'
                      : row.status === 'PUBLISHED'
                        ? 'available'
                        : 'locked'
                return <StatusBadge status={status} label={row.status} />
              },
            },
          ]}
          data={exams}
          getRowKey={(row) => String(row.id)}
        />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create exam">
        <form onSubmit={handleCreate} className="flex flex-col gap-4" noValidate>
          <Input
            label="Title"
            placeholder="Mid-Term Examination"
            required
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />
          <Select
            label="Subject"
            required
            value={form.subject}
            onChange={(event) => setForm({ ...form, subject: event.target.value })}
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
          <Input
            label="Academic year"
            type="number"
            required
            value={form.academic_year}
            onChange={(event) => setForm({ ...form, academic_year: event.target.value })}
          />
          <Input
            label="Exam date"
            type="date"
            value={form.exam_date}
            onChange={(event) => setForm({ ...form, exam_date: event.target.value })}
          />
          <Input
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
            {isSubmitting ? 'Creating…' : 'Create exam'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
