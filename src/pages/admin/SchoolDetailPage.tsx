import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useParams } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useToast } from '@/components/feedback/Toast'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DescriptionList } from '@/components/ui/DescriptionList'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getApiErrorMessage } from '@/services/apiError'
import {
  activateSchool,
  createSchoolAdmin,
  deactivateSchool,
  getSchool,
  listSchoolAdmins,
  updateSchool,
} from '@/services/schoolsService'
import type { AuthUser } from '@/types/auth'
import type { School } from '@/types/school'

const emptySchoolForm = { name: '', code: '', address: '', phone_number: '', email: '' }
const emptyAdminForm = { username: '', email: '', first_name: '', last_name: '', phone_number: '', password: '' }

export default function SchoolDetailPage() {
  const { schoolId } = useParams()
  const id = Number(schoolId)
  const { showToast } = useToast()

  const [school, setSchool] = useState<School | null>(null)
  const [admins, setAdmins] = useState<AuthUser[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState(emptySchoolForm)
  const [editError, setEditError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [confirmToggleOpen, setConfirmToggleOpen] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  const [adminModalOpen, setAdminModalOpen] = useState(false)
  const [adminForm, setAdminForm] = useState(emptyAdminForm)
  const [adminError, setAdminError] = useState<string | null>(null)
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false)

  async function load() {
    setError(null)
    try {
      const [schoolData, adminsData] = await Promise.all([getSchool(id), listSchoolAdmins(id)])
      setSchool(schoolData)
      setAdmins(adminsData)
      setEditForm({
        name: schoolData.name,
        code: schoolData.code,
        address: schoolData.address,
        phone_number: schoolData.phone_number,
        email: schoolData.email,
      })
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    load()
  }, [id])

  async function handleEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setEditError(null)
    setIsSaving(true)
    try {
      const updated = await updateSchool(id, editForm)
      setSchool(updated)
      setEditOpen(false)
      showToast('success', 'School updated.')
    } catch (err) {
      setEditError(getApiErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleToggleActive() {
    if (!school) return
    setIsToggling(true)
    try {
      const updated = school.is_active ? await deactivateSchool(id) : await activateSchool(id)
      setSchool(updated)
      showToast('success', updated.is_active ? 'School activated.' : 'School deactivated.')
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setIsToggling(false)
      setConfirmToggleOpen(false)
    }
  }

  async function handleCreateAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAdminError(null)
    setIsCreatingAdmin(true)
    try {
      const newAdmin = await createSchoolAdmin(id, adminForm)
      setAdmins((current) => (current ? [...current, newAdmin] : [newAdmin]))
      setAdminModalOpen(false)
      setAdminForm(emptyAdminForm)
      showToast('success', 'School admin created.')
    } catch (err) {
      setAdminError(getApiErrorMessage(err))
    } finally {
      setIsCreatingAdmin(false)
    }
  }

  if (error) return <ErrorState description={error} onRetry={load} />
  if (!school) return <LoadingState message="Loading school…" />

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={school.name}
        description={school.code}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Button
              variant={school.is_active ? 'danger' : 'success'}
              size="sm"
              onClick={() => setConfirmToggleOpen(true)}
            >
              {school.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">School details</p>
          <StatusBadge status={school.is_active ? 'available' : 'locked'} label={school.is_active ? 'Active' : 'Inactive'} />
        </CardHeader>
        <CardBody>
          <DescriptionList
            items={[
              { label: 'Address', value: school.address || '—' },
              { label: 'Phone', value: school.phone_number || '—' },
              { label: 'Email', value: school.email || '—' },
            ]}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">School admins</p>
          <Button size="sm" onClick={() => setAdminModalOpen(true)}>
            Create school admin
          </Button>
        </CardHeader>
        <CardBody>
          {admins && admins.length === 0 && <EmptyState title="No school admins yet." />}
          {admins && admins.length > 0 && (
            <ul className="divide-y divide-slate-100">
              {admins.map((admin) => (
                <li key={admin.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="font-medium text-slate-900">
                    {admin.first_name || admin.last_name
                      ? `${admin.first_name} ${admin.last_name}`.trim()
                      : admin.username}
                  </span>
                  <span className="text-slate-500">{admin.email}</span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit school">
        <form onSubmit={handleEdit} className="flex flex-col gap-4" noValidate>
          <Input
            label="School name"
            required
            value={editForm.name}
            onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
          />
          <Input
            label="School code"
            required
            value={editForm.code}
            onChange={(event) => setEditForm({ ...editForm, code: event.target.value })}
          />
          <Input
            label="Address"
            value={editForm.address}
            onChange={(event) => setEditForm({ ...editForm, address: event.target.value })}
          />
          <Input
            label="Phone number"
            value={editForm.phone_number}
            onChange={(event) => setEditForm({ ...editForm, phone_number: event.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={editForm.email}
            onChange={(event) => setEditForm({ ...editForm, email: event.target.value })}
          />
          {editError && (
            <p role="alert" className="text-sm text-red-600">
              {editError}
            </p>
          )}
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmToggleOpen}
        title={school.is_active ? 'Deactivate school' : 'Activate school'}
        message={
          school.is_active
            ? 'Deactivating this school hides it from active use across the platform. You can reactivate it anytime.'
            : 'This will reactivate the school across the platform.'
        }
        confirmLabel={school.is_active ? 'Deactivate' : 'Activate'}
        variant={school.is_active ? 'danger' : 'primary'}
        isLoading={isToggling}
        onCancel={() => setConfirmToggleOpen(false)}
        onConfirm={handleToggleActive}
      />

      <Modal open={adminModalOpen} onClose={() => setAdminModalOpen(false)} title="Create school admin">
        <form onSubmit={handleCreateAdmin} className="flex flex-col gap-4" noValidate>
          <Input
            label="Username"
            required
            value={adminForm.username}
            onChange={(event) => setAdminForm({ ...adminForm, username: event.target.value })}
          />
          <Input
            label="Email"
            type="email"
            required
            value={adminForm.email}
            onChange={(event) => setAdminForm({ ...adminForm, email: event.target.value })}
          />
          <Input
            label="First name"
            value={adminForm.first_name}
            onChange={(event) => setAdminForm({ ...adminForm, first_name: event.target.value })}
          />
          <Input
            label="Last name"
            value={adminForm.last_name}
            onChange={(event) => setAdminForm({ ...adminForm, last_name: event.target.value })}
          />
          <Input
            label="Phone number"
            value={adminForm.phone_number}
            onChange={(event) => setAdminForm({ ...adminForm, phone_number: event.target.value })}
          />
          <Input
            label="Password"
            type="password"
            required
            helperText="At least 8 characters."
            value={adminForm.password}
            onChange={(event) => setAdminForm({ ...adminForm, password: event.target.value })}
          />
          {adminError && (
            <p role="alert" className="text-sm text-red-600">
              {adminError}
            </p>
          )}
          <Button type="submit" disabled={isCreatingAdmin}>
            {isCreatingAdmin ? 'Creating…' : 'Create school admin'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
