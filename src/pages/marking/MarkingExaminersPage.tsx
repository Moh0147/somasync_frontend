import { useEffect, useState } from 'react'

import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useToast } from '@/components/feedback/Toast'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { getApiErrorMessage } from '@/services/apiError'
import {
  assignExaminerRole,
  listSchoolTeachers,
  unassignExaminerRole,
} from '@/services/examsService'
import type { SchoolTeacher } from '@/services/examsService'

export default function MarkingExaminersPage() {
  const { showToast } = useToast()

  const [teachers, setTeachers] = useState<SchoolTeacher[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<number | null>(null)

  async function load() {
    setError(null)
    try {
      setTeachers(await listSchoolTeachers())
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => { load() }, [])

  async function handleAssign(teacher: SchoolTeacher) {
    setLoadingId(teacher.id)
    try {
      const updated = await assignExaminerRole(teacher.id)
      setTeachers((prev) => prev?.map((t) => t.id === teacher.id ? { ...t, ...updated } : t) ?? null)
      showToast('success', `${teacher.full_name} amepewa role ya Examiner.`)
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setLoadingId(null)
    }
  }

  async function handleUnassign(teacher: SchoolTeacher) {
    setLoadingId(teacher.id)
    try {
      const updated = await unassignExaminerRole(teacher.id)
      setTeachers((prev) => prev?.map((t) => t.id === teacher.id ? { ...t, ...updated } : t) ?? null)
      showToast('success', `${teacher.full_name} ameondolewa role ya Examiner.`)
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setLoadingId(null)
    }
  }

  if (error) return <ErrorState description={error} onRetry={load} />
  if (!teachers) return <LoadingState message="Loading teachers…" />

  const examiners = teachers.filter((t) => t.is_examiner)
  const nonExaminers = teachers.filter((t) => !t.is_examiner)

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Examiners"
        description="Assign or remove Examiner role for teachers at your school."
      />

      <Card>
        <CardHeader>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Walimu wenye role ya Examiner ({examiners.length})
          </p>
        </CardHeader>
        <CardBody>
          {examiners.length === 0 ? (
            <p className="py-2 text-sm text-slate-500 dark:text-slate-400">
              Hakuna mwalimu aliyepewa role ya Examiner bado.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {examiners.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{t.full_name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">@{t.username} · Mwalimu/Examiner</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={loadingId === t.id}
                    onClick={() => handleUnassign(t)}
                  >
                    {loadingId === t.id ? '…' : 'Ondoa'}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Walimu wengine ({nonExaminers.length})
          </p>
        </CardHeader>
        <CardBody>
          {nonExaminers.length === 0 ? (
            <p className="py-2 text-sm text-slate-500 dark:text-slate-400">
              Walimu wote wana role ya Examiner.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {nonExaminers.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{t.full_name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">@{t.username} · Mwalimu</p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={loadingId === t.id}
                    onClick={() => handleAssign(t)}
                  >
                    {loadingId === t.id ? '…' : 'Fanya Examiner'}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
