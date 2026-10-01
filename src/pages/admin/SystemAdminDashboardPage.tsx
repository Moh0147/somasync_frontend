import { useEffect, useState } from 'react'

import { Link } from 'react-router-dom'

import { ErrorState } from '@/components/feedback/ErrorState'
import { WelcomeBanner } from '@/components/layout/WelcomeBanner'
import { AlertIcon, CheckIcon } from '@/components/ui/icons'
import { StatTileSkeleton } from '@/components/ui/Skeleton'
import { StatTile } from '@/components/ui/StatTile'
import { useAuth } from '@/features/auth/AuthContext'
import { getApiErrorMessage } from '@/services/apiError'
import { listSchools } from '@/services/schoolsService'
import type { School } from '@/types/school'
import { displayName } from '@/utils/displayName'

const quickLinks = [
  { to: '/admin/schools', label: 'Schools', description: 'Create and manage schools' },
  { to: '/admin/analytics', label: 'Analytics', description: 'Platform-wide usage and activity' },
  { to: '/admin/settings', label: 'Settings', description: 'Platform-level preferences' },
]

export default function SystemAdminDashboardPage() {
  const { user } = useAuth()
  const [schools, setSchools] = useState<School[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setError(null)
    setSchools(null)
    try {
      setSchools(await listSchools())
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <WelcomeBanner eyebrow="System admin dashboard" title={user ? `Welcome back, ${displayName(user)} 👋` : 'Welcome back 👋'} description="Here's your platform-wide overview." />
      {error && <ErrorState description={error} onRetry={load} />}
      {!error && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {!schools ? (
            <>
              <StatTileSkeleton />
              <StatTileSkeleton />
              <StatTileSkeleton />
            </>
          ) : (
            <>
              <StatTile
                icon={<CheckIcon className="h-5 w-5" />}
                label="Total Schools"
                value={String(schools.length)}
                tone="primary"
              />
              <StatTile
                icon={<CheckIcon className="h-5 w-5" />}
                label="Active Schools"
                value={String(schools.filter((school) => school.is_active).length)}
                tone="success"
              />
              <StatTile
                icon={<AlertIcon className="h-5 w-5" />}
                label="Inactive Schools"
                value={String(schools.filter((school) => !school.is_active).length)}
                tone="error"
              />
            </>
          )}
        </div>
      )}

      {!error && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Quick links</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
