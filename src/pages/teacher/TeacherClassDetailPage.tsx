import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { DescriptionList } from '@/components/ui/DescriptionList'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getApiErrorMessage } from '@/services/apiError'
import { listClassLevels } from '@/services/academicsService'
import { getClass, listClassStudents } from '@/services/classesService'
import type { ClassLevel } from '@/types/academics'
import type { AuthUser } from '@/types/auth'
import type { SchoolClass } from '@/types/class'

export default function TeacherClassDetailPage() {
  const { classId } = useParams()
  const id = Number(classId)

  const [schoolClass, setSchoolClass] = useState<SchoolClass | null>(null)
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([])
  const [students, setStudents] = useState<AuthUser[]>([])
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setError(null)
    try {
      const [classData, levels, studentsData] = await Promise.all([
        getClass(id),
        listClassLevels(),
        listClassStudents(id),
      ])
      setSchoolClass(classData)
      setClassLevels(levels)
      setStudents(studentsData)
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    load()
  }, [id])

  function levelName(levelId: number) {
    return classLevels.find((level) => level.id === levelId)?.name ?? `#${levelId}`
  }

  if (error) return <ErrorState description={error} onRetry={load} />
  if (!schoolClass) return <LoadingState message="Loading class…" />

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={schoolClass.name}
        description={`${levelName(schoolClass.class_level)} · ${schoolClass.academic_year}`}
      />

      <Card>
        <CardHeader className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">Class details</p>
          <StatusBadge
            status={schoolClass.is_active ? 'available' : 'locked'}
            label={schoolClass.is_active ? 'Active' : 'Inactive'}
          />
        </CardHeader>
        <CardBody>
          <DescriptionList
            items={[
              { label: 'Level', value: levelName(schoolClass.class_level) },
              { label: 'Academic year', value: String(schoolClass.academic_year) },
              { label: 'Class code', value: schoolClass.class_code },
            ]}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <p className="text-sm font-semibold text-slate-900">Students</p>
        </CardHeader>
        <CardBody>
          {students.length === 0 && <EmptyState title="No students enrolled yet." />}
          {students.length > 0 && (
            <ul className="divide-y divide-slate-100">
              {students.map((student) => (
                <li key={student.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="font-medium text-slate-900">
                    {student.first_name || student.last_name
                      ? `${student.first_name} ${student.last_name}`.trim()
                      : student.username}
                  </span>
                  <span className="text-slate-500">{student.username}</span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
