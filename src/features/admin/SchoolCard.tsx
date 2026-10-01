import { Link } from 'react-router-dom'

import { Card, CardBody } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { School } from '@/types/school'

interface SchoolCardProps {
  school: School
  counts?: { teacherCount: number; studentCount: number; classCount: number }
}

export function SchoolCard({ school, counts }: SchoolCardProps) {
  return (
    <Link
      to={`/admin/schools/${school.id}`}
      className="group block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <Card className="h-full transition duration-150 group-hover:-translate-y-0.5 group-hover:border-blue-300 group-hover:shadow-md dark:group-hover:border-blue-700">
        <CardBody className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{school.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{school.code}</p>
            </div>
            <StatusBadge status={school.is_active ? 'available' : 'locked'} label={school.is_active ? 'Active' : 'Inactive'} />
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
        </CardBody>
      </Card>
    </Link>
  )
}
