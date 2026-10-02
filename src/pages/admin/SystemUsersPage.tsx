import { useEffect, useMemo, useState } from 'react'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Table } from '@/components/ui/Table'
import { getApiErrorMessage } from '@/services/apiError'
import { getSystemUserDirectory } from '@/services/analyticsService'
import { listSchools } from '@/services/schoolsService'
import type { SystemDirectoryUser } from '@/types/analytics'
import type { School } from '@/types/school'

type RoleFilter = 'ALL' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT'

function roleLabel(user: SystemDirectoryUser) {
  if (user.role === 'ADMIN' && user.admin_scope === 'SCHOOL') return 'School Admin'
  if (user.role === 'TEACHER') return 'Teacher'
  return 'Student'
}

export default function SystemUsersPage() {
  const [users, setUsers] = useState<SystemDirectoryUser[] | null>(null)
  const [schools, setSchools] = useState<School[] | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL')
  const [schoolFilter, setSchoolFilter] = useState('ALL')
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setError(null)
    setUsers(null)
    setSchools(null)
    try {
      const [directory, schoolList] = await Promise.all([getSystemUserDirectory(), listSchools()])
      setUsers(directory)
      setSchools(schoolList)
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filteredUsers = useMemo(() => {
    if (!users) return []
    const query = search.trim().toLowerCase()
    return users.filter((user) => {
      const matchesRole = roleFilter === 'ALL'
        || (roleFilter === 'SCHOOL_ADMIN' && user.role === 'ADMIN' && user.admin_scope === 'SCHOOL')
        || user.role === roleFilter
      const matchesSchool = schoolFilter === 'ALL' || String(user.school) === schoolFilter
      const matchesSearch = !query || [
        user.first_name,
        user.last_name,
        `${user.first_name} ${user.last_name}`,
        user.username,
        user.email,
        user.phone_number,
      ].some((value) => value.toLowerCase().includes(query))
      return matchesRole && matchesSchool && matchesSearch
    })
  }, [users, roleFilter, schoolFilter, search])

  if (error) return <ErrorState description={error} onRetry={load} />
  if (!users || !schools) return <LoadingState message="Loading users…" />

  const columns = [
    {
      key: 'user',
      header: 'User',
      render: (user: SystemDirectoryUser) => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-100">
            {[user.first_name, user.last_name].filter(Boolean).join(' ') || user.username}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">@{user.username}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (user: SystemDirectoryUser) => <span className="font-medium">{roleLabel(user)}</span>,
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
          {user.phone_number && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{user.phone_number}</p>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (user: SystemDirectoryUser) => (
        <StatusBadge status={user.is_active ? 'available' : 'locked'} label={user.is_active ? 'Active' : 'Inactive'} />
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
        description="School admins, teachers, and students across all schools."
      />

      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">User directory</p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Showing {filteredUsers.length} of {users.length} accounts
          </p>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(16rem,1fr)_12rem_16rem]">
            <Input
              label="Search users"
              type="search"
              placeholder="Name, username, email, or phone"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select label="Role" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}>
              <option value="ALL">All roles</option>
              <option value="SCHOOL_ADMIN">School Admin</option>
              <option value="TEACHER">Teacher</option>
              <option value="STUDENT">Student</option>
            </Select>
            <Select label="School" value={schoolFilter} onChange={(event) => setSchoolFilter(event.target.value)}>
              <option value="ALL">All schools</option>
              {schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}
            </Select>
          </div>

          {filteredUsers.length === 0 ? (
            <EmptyState
              title={users.length === 0 ? 'No school users yet.' : 'No users match these filters.'}
              description={users.length === 0 ? 'School admins, teachers, and students will appear here.' : 'Try another role, school, or search term.'}
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
    </div>
  )
}
