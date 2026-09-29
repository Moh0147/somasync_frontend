import { useEffect, useState } from 'react'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Pagination } from '@/components/ui/Pagination'
import { Table } from '@/components/ui/Table'
import { useAuth } from '@/features/auth/AuthContext'
import { getApiErrorMessage } from '@/services/apiError'
import { listMyClasses, listStudentsForClasses } from '@/services/classesService'
import type { StudentWithClass } from '@/services/classesService'

const PAGE_SIZE = 20

export default function StudentsPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState<StudentWithClass[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  async function load() {
    if (!user) return
    setError(null)
    setRows(null)
    try {
      const myClasses = await listMyClasses(user.id)
      setRows(await listStudentsForClasses(myClasses))
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    load()
  }, [user])

  useEffect(() => {
    if (rows) setPage((current) => Math.min(current, Math.max(1, Math.ceil(rows.length / PAGE_SIZE))))
  }, [rows])

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Students" description="Everyone enrolled across your classes" />
      {error && <ErrorState description={error} onRetry={load} />}
      {!error && !rows && <LoadingState message="Loading students…" />}
      {!error && rows && rows.length === 0 && (
        <EmptyState title="No students yet." description="Students will appear here once they're enrolled in your classes." />
      )}
      {!error && rows && rows.length > 0 && (
        <>
          <Table
            columns={[
              {
                key: 'name',
                header: 'Student',
                render: (row: StudentWithClass) =>
                  row.student.first_name || row.student.last_name
                    ? `${row.student.first_name} ${row.student.last_name}`.trim()
                    : row.student.username,
              },
              { key: 'username', header: 'Username', render: (row: StudentWithClass) => row.student.username },
              { key: 'class', header: 'Class', render: (row: StudentWithClass) => row.schoolClass.name },
            ]}
            data={rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)}
            getRowKey={(row) => `${row.schoolClass.id}-${row.student.id}`}
          />
          <Pagination currentPage={page} totalPages={Math.ceil(rows.length / PAGE_SIZE)} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
