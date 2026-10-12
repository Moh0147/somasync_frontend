import { Link } from 'react-router-dom'

import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getSchoolImage } from '@/utils/schoolImage'
import type { School } from '@/types/school'

interface SchoolCardProps {
  school: School
  counts?: { teacherCount: number; studentCount: number; classCount: number }
}

export function SchoolCard({ school, counts }: SchoolCardProps) {
  const imageSrc = getSchoolImage(school)

  return (
    <Link
      to={`/admin/schools/${school.id}`}
      className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <Card className="h-full overflow-hidden transition duration-150 group-hover:-translate-y-0.5 group-hover:border-blue-300 group-hover:shadow-md dark:group-hover:border-blue-700">
        {}
        <div className="relative h-32 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={school.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              draggable={false}
            />
          ) : (
            
            <div className="h-full w-full bg-gradient-to-br from-blue-500/20 via-indigo-400/20 to-purple-500/20 dark:from-blue-500/30 dark:via-indigo-400/20 dark:to-purple-500/30">
              <div className="flex h-full items-center justify-center">
                <span className="text-3xl font-bold tracking-tight text-slate-400/60 dark:text-slate-500/60 select-none">
                  {school.code}
                </span>
              </div>
            </div>
          )}
          {}
          <div className="absolute right-2.5 top-2.5">
            <StatusBadge
              status={school.is_active ? 'available' : 'locked'}
              label={school.is_active ? 'Active' : 'Inactive'}
            />
          </div>
        </div>

        {}
        <div className="flex flex-col gap-3 p-4">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{school.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{school.code}</p>
          </div>
          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Classes</p>
              <p className="font-medium text-slate-700 dark:text-slate-300">{counts ? counts.classCount : '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Teachers</p>
              <p className="font-medium text-slate-700 dark:text-slate-300">{counts ? counts.teacherCount : '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Students</p>
              <p className="font-medium text-slate-700 dark:text-slate-300">{counts ? counts.studentCount : '—'}</p>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}
