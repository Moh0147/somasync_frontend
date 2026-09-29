import { StaffAccountsPage } from '@/features/admin/StaffAccountsPage'
import { createStudent, listSchoolStudents } from '@/services/schoolsService'

export default function StudentsPage() {
  return (
    <StaffAccountsPage
      pageTitle="Students"
      roleLabelLower="student"
      emptyTitle="No students yet."
      listFn={listSchoolStudents}
      createFn={createStudent}
    />
  )
}
