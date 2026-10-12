import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useParams } from 'react-router-dom'

import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useToast } from '@/components/feedback/Toast'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DescriptionList } from '@/components/ui/DescriptionList'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getApiErrorMessage } from '@/services/apiError'
import { getAdminUser, updateAdminUser } from '@/services/adminUsersService'
import { listSchools } from '@/services/schoolsService'
import type { SystemDirectoryUser, UserRole } from '@/types/analytics'
import type { School } from '@/types/school'
import { ASSIGNABLE_ROLES, SCHOOL_OPTIONAL_ROLES, SCHOOL_REQUIRED_ROLES, roleLabel } from '@/utils/roleLabel'

export default function UserDetailPage() {
  const { userId } = useParams()
  const id = Number(userId)
  const { showToast } = useToast()

  const [user, setUser] = useState<SystemDirectoryUser | null>(null)
  const [schools, setSchools] = useState<School[]>([])
  const [error, setError] = useState<string | null>(null)

  // Role form state
  const [newRole, setNewRole] = useState<UserRole>('TEACHER')
  const [newSchool, setNewSchool] = useState<string>('')
  const [roleError, setRoleError] = useState<string | null>(null)
  const [isSavingRole, setIsSavingRole] = useState(false)

  // Deactivate/activate
  const [confirmToggle, setConfirmToggle] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  async function load() {
    setError(null)
    try {
      const [userData, schoolList] = await Promise.all([getAdminUser(id), listSchools()])
      setUser(userData)
      setSchools(schoolList)
      setNewRole(userData.role as UserRole)
      setNewSchool(userData.school ? String(userData.school) : '')
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => { load() }, [id])

  async function handleRoleChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setRoleError(null)
    setIsSavingRole(true)
    try {
      const updated = await updateAdminUser(id, {
        role: newRole,
        school: newSchool !== '' ? Number(newSchool) : null,
      })
      setUser(updated)
      showToast('success', 'Role updated.')
    } catch (err) {
      setRoleError(getApiErrorMessage(err))
    } finally {
      setIsSavingRole(false)
    }
  }

  async function handleToggleActive() {
    if (!user) return
    setIsToggling(true)
    try {
      const updated = await updateAdminUser(id, { is_active: !user.is_active })
      setUser(updated)
      showToast('success', updated.is_active ? 'Account activated.' : 'Account deactivated.')
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setIsToggling(false)
      setConfirmToggle(false)
    }
  }

  if (error) return <ErrorState description={error} onRetry={load} />
  if (!user) return <LoadingState message="Loading user…" />

  const displayName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username
  const needsSchool = SCHOOL_REQUIRED_ROLES.includes(newRole)
  const schoolOptional = SCHOOL_OPTIONAL_ROLES.includes(newRole)

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={displayName}
        description={`@${user.username} · ${roleLabel(user.role, user.admin_scope)}`}
        actions={
          <Button
            variant={user.is_active ? 'danger' : 'success'}
            size="sm"
            onClick={() => setConfirmToggle(true)}
          >
            {user.is_active ? 'Deactivate' : 'Activate'}
          </Button>
        }
      />

      {/* Account info */}
      <Card>
        <CardHeader>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Account details</p>
        </CardHeader>
        <CardBody>
          <DescriptionList
            items={[
              { label: 'Status', value: (
                <StatusBadge
                  status={user.is_active ? 'available' : 'locked'}
                  label={user.is_active ? 'Active' : 'Inactive'}
                />
              )},
              { label: 'Role', value: roleLabel(user.role, user.admin_scope) },
              { label: 'School', value: user.school_name || '—' },
              { label: 'Email', value: user.email || '—' },
              { label: 'Phone', value: user.phone_number || '—' },
              { label: 'Joined', value: new Date(user.date_joined).toLocaleDateString() },
            ]}
          />
        </CardBody>
      </Card>

      {/* Role management */}
      <Card>
        <CardHeader>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Change role</p>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleRoleChange} className="flex flex-col gap-4">
            <Select
              label="Role"
              value={newRole}
              onChange={(e) => {
                const r = e.target.value as UserRole
                setNewRole(r)
                if (!SCHOOL_REQUIRED_ROLES.includes(r)) setNewSchool('')
              }}
            >
              {ASSIGNABLE_ROLES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
            {(needsSchool || schoolOptional) && (
              <Select
                label={schoolOptional ? 'School (optional)' : 'School'}
                required={needsSchool}
                value={newSchool}
                onChange={(e) => setNewSchool(e.target.value)}
              >
                <option value="">{schoolOptional ? 'No school (cross-school oversight)' : 'Select a school…'}</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            )}
            {roleError && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">{roleError}</p>
            )}
            <div>
              <Button type="submit" disabled={isSavingRole}>
                {isSavingRole ? 'Saving…' : 'Save role'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <ConfirmDialog
        open={confirmToggle}
        title={user.is_active ? 'Deactivate account' : 'Activate account'}
        message={
          user.is_active
            ? `This will prevent ${displayName} from logging in. You can reactivate at any time.`
            : `This will allow ${displayName} to log in again.`
        }
        confirmLabel={user.is_active ? 'Deactivate' : 'Activate'}
        variant={user.is_active ? 'danger' : 'primary'}
        isLoading={isToggling}
        onCancel={() => setConfirmToggle(false)}
        onConfirm={handleToggleActive}
      />
    </div>
  )
}
