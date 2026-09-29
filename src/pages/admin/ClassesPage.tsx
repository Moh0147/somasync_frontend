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
import { listClassLevels } from '@/services/academicsService'
import { getSchoolClassPerformance } from '@/services/analyticsService'
import { getApiErrorMessage } from '@/services/apiError'
import { createClass, listClasses } from '@/services/classesService'
import type { ClassLevel } from '@/types/academics'
import type { ClassPerformance } from '@/types/analytics'
import type { SchoolClass } from '@/types/class'

const currentYear = new Date().getFullYear()
const emptyForm = { name: '', class_level: '', academic_year: String(currentYear) }

export default function ClassesPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [classes, setClasses] = useState<SchoolClass[] | null>(null)
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([])
  const [performanceByClassId, setPerformanceByClassId] = useState<Map<number, ClassPerformance>>(new Map())
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function load() {
    setError(null)
    setClasses(null)
    try {
      const [classesData, levelsData] = await Promise.all([listClasses(), listClassLevels()])
      setClasses(classesData)
      setClassLevels(levelsData)
    } catch (err) {
      setError(getApiErrorMessage(err))
      return
    }
    try {
      const performance = await getSchoolClassPerformance()
      setPerformanceByClassId(new Map(performance.map((row) => [row.class_id, row])))
    } catch {
      // Best-effort enrichment -- the table still works with just the base
      // class list if the analytics endpoint has a hiccup.
    }
  }

  useEffect(() => {
    load()
  }, [])

  function levelName(levelId: number) {
    return classLevels.find((level) => level.id === levelId)?.name ?? `#${levelId}`
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    if (!form.class_level) {
      setFormError('Select a class level.')
      return
    }

    setIsSubmitting(true)
    try {
      await createClass({
        name: form.name,
        class_level: Number(form.class_level),
        academic_year: Number(form.academic_year),
      })
      setModalOpen(false)
      setForm(emptyForm)
      showToast('success', 'Class created.')
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
        title="Classes"
        actions={
          <Button size="sm" onClick={() => setModalOpen(true)}>
            Create class
          </Button>
        }
      />

      {error && <ErrorState description={error} onRetry={load} />}
      {!error && !classes && <LoadingState message="Loading classes…" />}
      {!error && classes && classes.length === 0 && (
        <EmptyState
          title="No classes yet."
          description="Create the first class for this school to start enrolling students."
          action={
            <Button size="sm" onClick={() => setModalOpen(true)}>
              Create class
            </Button>
          }
        />
      )}
      {!error && classes && classes.length > 0 && (
        <Table
          columns={[
            {
              key: 'name',
              header: 'Class',
              render: (row: SchoolClass) => (
                <button
                  type="button"
                  onClick={() => navigate(`/admin/classes/${row.id}`)}
                  className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  {row.name}
                </button>
              ),
            },
            { key: 'level', header: 'Level', render: (row: SchoolClass) => levelName(row.class_level) },
            { key: 'year', header: 'Year', render: (row: SchoolClass) => String(row.academic_year) },
            { key: 'code', header: 'Class code', render: (row: SchoolClass) => row.class_code },
            {
              key: 'students',
              header: 'Students',
              render: (row: SchoolClass) => String(performanceByClassId.get(row.id)?.student_count ?? '—'),
            },
            {
              key: 'avgQuiz',
              header: 'Avg quiz %',
              render: (row: SchoolClass) => {
                const value = performanceByClassId.get(row.id)?.avg_quiz_percentage
                return value === null || value === undefined ? '—' : `${value}%`
              },
            },
            {
              key: 'status',
              header: 'Status',
              render: (row: SchoolClass) => (
                <StatusBadge status={row.is_active ? 'available' : 'locked'} label={row.is_active ? 'Active' : 'Inactive'} />
              ),
            },
          ]}
          data={classes}
          getRowKey={(row) => String(row.id)}
        />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create class">
        <form onSubmit={handleCreate} className="flex flex-col gap-4" noValidate>
          <Input
            label="Class name"
            placeholder="Form II Blue"
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <Select
            label="Class level"
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
          {formError && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {formError}
            </p>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create class'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
