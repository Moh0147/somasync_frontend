import { StaffAccountsPage } from '@/features/admin/StaffAccountsPage'
import { createTeacher, listSchoolTeachers } from '@/services/schoolsService'

export default function TeachersPage() {
  return (
    <StaffAccountsPage
      pageTitle="Teachers"
      roleLabelLower="teacher"
      emptyTitle="No teachers yet."
      listFn={listSchoolTeachers}
      createFn={createTeacher}
    />
  )
}
