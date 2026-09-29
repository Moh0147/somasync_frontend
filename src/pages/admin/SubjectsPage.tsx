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
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Table } from '@/components/ui/Table'
import { createSubject, listSubjects } from '@/services/academicsService'
import { getApiErrorMessage } from '@/services/apiError'
import type { Subject } from '@/types/academics'

const emptyForm = { name: '', code: '', curriculum_code: '' }

export default function SubjectsPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [subjects, setSubjects] = useState<Subject[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function load() {
    setError(null)
    setSubjects(null)
    try {
      setSubjects(await listSubjects())
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setIsSubmitting(true)
    try {
      await createSubject(form)
      setModalOpen(false)
      setForm(emptyForm)
      showToast('success', 'Subject created.')
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
        title="Subjects"
        actions={
          <Button size="sm" onClick={() => setModalOpen(true)}>
            Create subject
          </Button>
        }
      />

      {error && <ErrorState description={error} onRetry={load} />}
      {!error && !subjects && <LoadingState message="Loading subjects…" />}
      {!error && subjects && subjects.length === 0 && (
        <EmptyState title="No subjects yet." description="Create the first subject for this school." />
      )}
      {!error && subjects && subjects.length > 0 && (
        <Table
          columns={[
            {
              key: 'name',
              header: 'Subject',
              render: (row: Subject) => (
                <button
                  type="button"
                  onClick={() => navigate(`/admin/subjects/${row.id}`)}
                  className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  {row.name}
                </button>
              ),
            },
            { key: 'code', header: 'Code', render: (row: Subject) => row.code || '—' },
            {
              key: 'status',
              header: 'Status',
              render: (row: Subject) => (
                <StatusBadge status={row.is_active ? 'available' : 'locked'} label={row.is_active ? 'Active' : 'Inactive'} />
              ),
            },
          ]}
          data={subjects}
          getRowKey={(row) => String(row.id)}
        />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create subject">
        <form onSubmit={handleCreate} className="flex flex-col gap-4" noValidate>
          <Input
            label="Subject name"
            placeholder="Biology"
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <Input
            label="Code"
            placeholder="BIO"
            value={form.code}
            onChange={(event) => setForm({ ...form, code: event.target.value })}
          />
          <Input
            label="Curriculum code"
            helperText="Optional reference code for future curriculum mapping."
            value={form.curriculum_code}
            onChange={(event) => setForm({ ...form, curriculum_code: event.target.value })}
          />
          {formError && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {formError}
            </p>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create subject'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
