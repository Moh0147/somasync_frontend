import { useEffect, useState } from 'react'

import { Link } from 'react-router-dom'

import { ErrorState } from '@/components/feedback/ErrorState'
import { PageHeader } from '@/components/layout/PageHeader'
import { AlertIcon, CheckIcon } from '@/components/ui/icons'
import { StatTileSkeleton } from '@/components/ui/Skeleton'
import { StatTile } from '@/components/ui/StatTile'
import { useAuth } from '@/features/auth/AuthContext'
import { getApiErrorMessage } from '@/services/apiError'
import { listClasses } from '@/services/classesService'
import type { SchoolClass } from '@/types/class'
import { displayName } from '@/utils/displayName'

const quickLinks = [
  { to: '/admin/classes', label: 'Classes', description: 'Manage classes and enrollment' },
  { to: '/admin/subjects', label: 'Subjects', description: 'Manage subjects and topics' },
  { to: '/admin/analytics', label: 'Analytics', description: "See the school's performance" },
  { to: '/admin/settings', label: 'Settings', description: 'School details and preferences' },
]

export default function SchoolAdminDashboardPage() {
  const { user } = useAuth()
  const [classes, setClasses] = useState<SchoolClass[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setError(null)
    setClasses(null)
    try {
      setClasses(await listClasses())
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={user ? `Welcome back, ${displayName(user)}` : 'Dashboard'} description="School overview" />
      {error && <ErrorState description={error} onRetry={load} />}
      {!error && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {!classes ? (
            <>
              <StatTileSkeleton />
              <StatTileSkeleton />
              <StatTileSkeleton />
            </>
          ) : (
            <>
              <StatTile
                icon={<CheckIcon className="h-5 w-5" />}
                label="Total Classes"
                value={String(classes.length)}
                tone="primary"
              />
              <StatTile
                icon={<CheckIcon className="h-5 w-5" />}
                label="Active Classes"
                value={String(classes.filter((schoolClass) => schoolClass.is_active).length)}
                tone="success"
              />
              <StatTile
                icon={<AlertIcon className="h-5 w-5" />}
                label="Inactive Classes"
                value={String(classes.filter((schoolClass) => !schoolClass.is_active).length)}
                tone="error"
              />
            </>
          )}
        </div>
      )}

      {!error && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Quick links</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex flex-col gap-1 rounded-md border border-slate-200 bg-white p-4 transition-colors duration-150 hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700 dark:hover:bg-blue-500/10"
              >
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{link.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{link.description}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
