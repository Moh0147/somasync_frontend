import { Navigate, Route, Routes } from 'react-router-dom'

import { ComingSoonPage } from '@/components/feedback/ComingSoonPage'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { schoolAdminNavItems, systemAdminNavItems } from '@/features/admin/adminNav'
import { useAuth } from '@/features/auth/AuthContext'

import ClassDetailPage from './ClassDetailPage'
import ClassesPage from './ClassesPage'
import SchoolAdminDashboardPage from './SchoolAdminDashboardPage'
import SchoolDetailPage from './SchoolDetailPage'
import SchoolSettingsPage from './SchoolSettingsPage'
import SchoolsPage from './SchoolsPage'
import SubjectDetailPage from './SubjectDetailPage'
import SubjectsPage from './SubjectsPage'
import SystemAdminDashboardPage from './SystemAdminDashboardPage'
import TopicDetailPage from './TopicDetailPage'

export default function AdminAreaPage() {
  const { user, logout } = useAuth()

  if (!user) return null

  const isSystemAdmin = user.admin_scope === 'SYSTEM'

  return (
    <AppShell
      title={isSystemAdmin ? 'System Admin' : 'School Admin'}
      navItems={isSystemAdmin ? systemAdminNavItems : schoolAdminNavItems}
      topBarActions={
        <Button variant="ghost" size="sm" onClick={() => logout()}>
          Sign out
        </Button>
      }
    >
      {isSystemAdmin ? (
        <Routes>
          <Route index element={<SystemAdminDashboardPage />} />
          <Route path="schools" element={<SchoolsPage />} />
          <Route path="schools/:schoolId" element={<SchoolDetailPage />} />
          <Route
            path="users"
            element={
              <ComingSoonPage
                title="Users"
                description="A cross-school user directory isn't wired up on the backend yet."
              />
            }
          />
          <Route
            path="analytics"
            element={<ComingSoonPage title="Analytics" description="Platform analytics arrive in a later phase." />}
          />
          <Route
            path="settings"
            element={<ComingSoonPage title="Settings" description="Platform settings arrive in a later phase." />}
          />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      ) : (
        <Routes>
          <Route index element={<SchoolAdminDashboardPage />} />
          <Route path="classes" element={<ClassesPage />} />
          <Route path="classes/:classId" element={<ClassDetailPage />} />
          <Route
            path="teachers"
            element={
              <ComingSoonPage
                title="Teachers"
                description="Teacher accounts are provisioned by your system administrator for now."
              />
            }
          />
          <Route
            path="students"
            element={
              <ComingSoonPage
                title="Students"
                description="Student accounts are provisioned by your system administrator for now."
              />
            }
          />
          <Route path="subjects" element={<SubjectsPage />} />
          <Route path="subjects/:subjectId" element={<SubjectDetailPage />} />
          <Route path="subjects/:subjectId/topics/:topicId" element={<TopicDetailPage />} />
          <Route
            path="lessons"
            element={<ComingSoonPage title="Lessons" description="Lesson authoring arrives in a later phase." />}
          />
          <Route
            path="quizzes"
            element={<ComingSoonPage title="Quizzes" description="Quiz management arrives in a later phase." />}
          />
          <Route
            path="exams"
            element={<ComingSoonPage title="Exams" description="Exam management arrives in a later phase." />}
          />
          <Route
            path="analytics"
            element={<ComingSoonPage title="Analytics" description="School analytics arrive in a later phase." />}
          />
          <Route path="settings" element={<SchoolSettingsPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      )}
    </AppShell>
  )
}
