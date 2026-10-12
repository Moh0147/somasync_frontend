import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useToast } from '@/components/feedback/Toast'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/features/auth/AuthContext'
import { getApiErrorMessage } from '@/services/apiError'
import type { TeacherPayload } from '@/services/schoolsService'
import type { AuthUser } from '@/types/auth'

const emptyForm: TeacherPayload = { username: '', email: '', first_name: '', last_name: '', phone_number: '', password: '' }

interface StaffAccountsPageProps {
  pageTitle: string
  roleLabelLower: string
  emptyTitle: string
  listFn: (schoolId: number) => Promise<AuthUser[]>
  createFn: (schoolId: number, payload: TeacherPayload) => Promise<AuthUser>
}

export function StaffAccountsPage({ pageTitle, roleLabelLower, emptyTitle, listFn, createFn }: StaffAccountsPageProps) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const schoolId = user?.school ?? null

  const [accounts, setAccounts] = useState<AuthUser[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<TeacherPayload>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function load() {
    if (schoolId === null) return
    setError(null)
    setAccounts(null)
    try {
      setAccounts(await listFn(schoolId))
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    load()
  }, [schoolId])

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (schoolId === null) return
    setFormError(null)
    setIsSubmitting(true)
    try {
      const created = await createFn(schoolId, form)
      setAccounts((current) => (current ? [...current, created] : [created]))
      setModalOpen(false)
      setForm(emptyForm)
      showToast('success', `${created.username} created.`)
    } catch (err) {
      setFormError(getApiErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (error) return <ErrorState description={error} onRetry={load} />
  if (!accounts) return <LoadingState message={`Loading ${roleLabelLower}s…`} />

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={pageTitle}
        actions={
          <Button size="sm" onClick={() => setModalOpen(true)}>
            Create {roleLabelLower}
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {accounts.length} account{accounts.length === 1 ? '' : 's'}
          </p>
        </CardHeader>
        <CardBody>
          {accounts.length === 0 ? (
            <EmptyState
              title={emptyTitle}
              description={`Create the first ${roleLabelLower} account to get started.`}
              action={
                <Button size="sm" onClick={() => setModalOpen(true)}>
                  Create {roleLabelLower}
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {accounts.map((account) => (
                <li key={account.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {account.first_name || account.last_name
                        ? `${account.first_name} ${account.last_name}`.trim()
                        : account.username}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{account.username}</p>
                  </div>
                  <span className="text-slate-500 dark:text-slate-400">{account.email || '—'}</span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`Create ${roleLabelLower}`}>
        <form onSubmit={handleCreate} className="flex flex-col gap-4" noValidate>
          <Input
            label="Username"
            required
            value={form.username}
            onChange={(event) => setForm({ ...form, username: event.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
          <Input
            label="First name"
            value={form.first_name}
            onChange={(event) => setForm({ ...form, first_name: event.target.value })}
          />
          <Input
            label="Last name"
            value={form.last_name}
            onChange={(event) => setForm({ ...form, last_name: event.target.value })}
          />
          <Input
            label="Phone number"
            value={form.phone_number}
            onChange={(event) => setForm({ ...form, phone_number: event.target.value })}
          />
          <Input
            label="Temporary password"
            type="password"
            required
            helperText="At least 8 characters. Share this with them directly -- there's no reset-by-email flow yet."
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
          />
          {formError && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {formError}
            </p>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : `Create ${roleLabelLower}`}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
