import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useToast } from '@/components/feedback/Toast'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Table } from '@/components/ui/Table'
import { getApiErrorMessage } from '@/services/apiError'
import { createAdminUser, listAdminUsers } from '@/services/adminUsersService'
import { listSchools } from '@/services/schoolsService'
import type { SystemDirectoryUser, UserRole } from '@/types/analytics'
import type { School } from '@/types/school'
import { ASSIGNABLE_ROLES, SCHOOL_OPTIONAL_ROLES, SCHOOL_REQUIRED_ROLES, roleLabel } from '@/utils/roleLabel'

type RoleFilter = 'ALL' | UserRole

const emptyForm = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  phone_number: '',
  password: '',
  role: 'TEACHER' as UserRole,
  school: '' as string | number,
}

export default function SystemUsersPage() {
  const { showToast } = useToast()

  const [users, setUsers] = useState<SystemDirectoryUser[] | null>(null)
  const [schools, setSchools] = useState<School[] | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL')
  const [schoolFilter, setSchoolFilter] = useState('ALL')
  const [error, setError] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  async function load() {
    setError(null)
    try {
      const [userList, schoolList] = await Promise.all([listAdminUsers(), listSchools()])
      setUsers(userList)
      setSchools(schoolList)
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => { load() }, [])

  const filteredUsers = useMemo(() => {
    if (!users) return []
    const query = search.trim().toLowerCase()
    return users.filter((user) => {
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter
      const matchesSchool = schoolFilter === 'ALL' || String(user.school) === schoolFilter
      const matchesSearch = !query || [
        user.first_name, user.last_name,
        `${user.first_name} ${user.last_name}`,
        user.username, user.email, user.phone_number,
      ].some((v) => v.toLowerCase().includes(query))
      return matchesRole && matchesSchool && matchesSearch
    })
  }, [users, roleFilter, schoolFilter, search])

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setIsCreating(true)
    try {
      const newUser = await createAdminUser({
        username: form.username,
        email: form.email || undefined,
        first_name: form.first_name || undefined,
        last_name: form.last_name || undefined,
        phone_number: form.phone_number || undefined,
        password: form.password,
        role: form.role,
        school: form.school !== '' ? Number(form.school) : null,
      })
      setUsers((prev) => prev ? [newUser, ...prev] : [newUser])
      setCreateOpen(false)
      setForm(emptyForm)
      showToast('success', 'User created.')
    } catch (err) {
      setFormError(getApiErrorMessage(err))
    } finally {
      setIsCreating(false)
    }
  }

  const needsSchool = SCHOOL_REQUIRED_ROLES.includes(form.role)
  const schoolOptional = SCHOOL_OPTIONAL_ROLES.includes(form.role)

  if (error) return <ErrorState description={error} onRetry={load} />
  if (!users || !schools) return <LoadingState message="Loading users…" />

  const columns = [
    {
      key: 'user',
      header: 'User',
      render: (user: SystemDirectoryUser) => (
        <div>
          <Link
            to={`/admin/users/${user.id}`}
            className="font-semibold text-slate-900 hover:text-blue-600 dark:text-slate-100 dark:hover:text-blue-400"
          >
            {[user.first_name, user.last_name].filter(Boolean).join(' ') || user.username}
          </Link>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">@{user.username}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (user: SystemDirectoryUser) => (
        <span className="font-medium">{roleLabel(user.role, user.admin_scope)}</span>
      ),
    },
    {
      key: 'school',
      header: 'School',
      render: (user: SystemDirectoryUser) => user.school_name || '—',
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (user: SystemDirectoryUser) => (
        <div>
          <p>{user.email || '—'}</p>
          {user.phone_number && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{user.phone_number}</p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (user: SystemDirectoryUser) => (
        <StatusBadge
          status={user.is_active ? 'available' : 'locked'}
          label={user.is_active ? 'Active' : 'Inactive'}
        />
      ),
    },
    {
      key: 'joined',
      header: 'Joined',
      render: (user: SystemDirectoryUser) => new Date(user.date_joined).toLocaleDateString(),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Users"
        description="All platform accounts across every school."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            Create user
          </Button>
        }
      />

      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">User directory</p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Showing {filteredUsers.length} of {users.length} accounts
          </p>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(16rem,1fr)_14rem_16rem]">
            <Input
              label="Search users"
              type="search"
              placeholder="Name, username, email, or phone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              label="Role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
            >
              <option value="ALL">All roles</option>
              <option value="ADMIN">School Admin</option>
              <option value="TEACHER">Teacher</option>
              <option value="STUDENT">Student</option>
            </Select>
            <Select
              label="School"
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
            >
              <option value="ALL">All schools</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>{school.name}</option>
              ))}
            </Select>
          </div>

          {filteredUsers.length === 0 ? (
            <EmptyState
              title={users.length === 0 ? 'No users yet.' : 'No users match these filters.'}
              description={
                users.length === 0
                  ? 'Create the first user with the button above.'
                  : 'Try another role, school, or search term.'
              }
            />
          ) : (
            <Table
              columns={columns}
              data={filteredUsers}
              getRowKey={(user) => String(user.id)}
            />
          )}
        </CardBody>
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create user">
        <form onSubmit={handleCreate} className="flex flex-col gap-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First name"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            />
            <Input
              label="Last name"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            />
          </div>
          <Input
            label="Username"
            required
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Phone number"
            value={form.phone_number}
            onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
          />
          <Input
            label="Password"
            type="password"
            required
            helperText="At least 8 characters."
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Select
            label="Role"
            required
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as UserRole, school: '' })}
          >
            {ASSIGNABLE_ROLES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
          {(needsSchool || schoolOptional) && (
            <Select
              label={schoolOptional ? 'School (optional)' : 'School'}
              required={needsSchool}
              value={String(form.school)}
              onChange={(e) => setForm({ ...form, school: e.target.value })}
            >
              <option value="">{schoolOptional ? 'No school (cross-school oversight)' : 'Select a school…'}</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>{school.name}</option>
              ))}
            </Select>
          )}
          {formError && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">{formError}</p>
          )}
          <Button type="submit" disabled={isCreating}>
            {isCreating ? 'Creating…' : 'Create user'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
