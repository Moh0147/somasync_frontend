import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useToast } from '@/components/feedback/Toast'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { SchoolCard } from '@/features/admin/SchoolCard'
import { getApiErrorMessage } from '@/services/apiError'
import { getSystemSchools } from '@/services/analyticsService'
import { createSchool, listSchools } from '@/services/schoolsService'
import type { SystemSchoolRow } from '@/types/analytics'
import type { School } from '@/types/school'

const emptyForm = { name: '', code: '', address: '', phone_number: '', email: '' }
const PAGE_SIZE = 12

export default function SchoolsPage() {
  const { showToast } = useToast()
  const [schools, setSchools] = useState<School[] | null>(null)
  const [countsBySchoolId, setCountsBySchoolId] = useState<Map<number, SystemSchoolRow>>(new Map())
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function load() {
    setError(null)
    setSchools(null)
    try {
      setSchools(await listSchools())
    } catch (err) {
      setError(getApiErrorMessage(err))
      return
    }
    try {
      const rows = await getSystemSchools()
      setCountsBySchoolId(new Map(rows.map((row) => [row.school_id, row])))
    } catch {
      
      
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (schools) setPage((current) => Math.min(current, Math.max(1, Math.ceil(schools.length / PAGE_SIZE))))
  }, [schools])

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setIsSubmitting(true)
    try {
      await createSchool(form)
      setModalOpen(false)
      setForm(emptyForm)
      showToast('success', 'School created.')
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
        title="Schools"
        actions={
          <Button size="sm" onClick={() => setModalOpen(true)}>
            Create school
          </Button>
        }
      />

      {error && <ErrorState description={error} onRetry={load} />}
      {!error && !schools && <LoadingState message="Loading schools…" />}
      {!error && schools && schools.length === 0 && (
        <EmptyState
          title="No schools yet."
          description="Create the first school to start onboarding teachers and students."
          action={
            <Button size="sm" onClick={() => setModalOpen(true)}>
              Create school
            </Button>
          }
        />
      )}
      {!error && schools && schools.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {schools.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((school) => {
              const row = countsBySchoolId.get(school.id)
              return (
                <SchoolCard
                  key={school.id}
                  school={school}
                  counts={
                    row
                      ? { teacherCount: row.teacher_count, studentCount: row.student_count, classCount: row.class_count }
                      : undefined
                  }
                />
              )
            })}
          </div>
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(schools.length / PAGE_SIZE)}
            onPageChange={setPage}
          />
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create school">
        <form onSubmit={handleCreate} className="flex flex-col gap-4" noValidate>
          <Input
            label="School name"
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <Input
            label="School code"
            required
            value={form.code}
            onChange={(event) => setForm({ ...form, code: event.target.value })}
          />
          <Input
            label="Address"
            value={form.address}
            onChange={(event) => setForm({ ...form, address: event.target.value })}
          />
          <Input
            label="Phone number"
            value={form.phone_number}
            onChange={(event) => setForm({ ...form, phone_number: event.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
          {formError && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {formError}
            </p>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create school'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
