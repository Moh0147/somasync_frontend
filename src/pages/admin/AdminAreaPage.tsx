import { Navigate, Route, Routes } from 'react-router-dom'

import { ComingSoonPage } from '@/components/feedback/ComingSoonPage'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { schoolAdminNavItems, systemAdminNavItems } from '@/features/admin/adminNav'
import { RequireSchoolAdmin, RequireSystemAdmin } from '@/features/admin/AdminScopeGuard'
import { useAuth } from '@/features/auth/AuthContext'

import ClassDetailPage from './ClassDetailPage'
import ClassesPage from './ClassesPage'
import SchoolAdminDashboardPage from './SchoolAdminDashboardPage'
import SchoolAnalyticsPage from './SchoolAnalyticsPage'
import SchoolDetailPage from './SchoolDetailPage'
import SchoolSettingsPage from './SchoolSettingsPage'
import SchoolsPage from './SchoolsPage'
import StudentsPage from './StudentsPage'
import SubjectDetailPage from './SubjectDetailPage'
import SubjectsPage from './SubjectsPage'
import SystemAdminDashboardPage from './SystemAdminDashboardPage'
import SystemAnalyticsPage from './SystemAnalyticsPage'
import TeachersPage from './TeachersPage'
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
      {/* One merged route tree for both admin scopes -- see AdminScopeGuard
          for why a scope-mismatched path is guarded per-route instead of
          the whole tree being duplicated behind an isSystemAdmin branch. */}
      <Routes>
        <Route index element={isSystemAdmin ? <SystemAdminDashboardPage /> : <SchoolAdminDashboardPage />} />

        {/* System admin only */}
        <Route
          path="schools"
          element={
            <RequireSystemAdmin>
              <SchoolsPage />
            </RequireSystemAdmin>
          }
        />
        <Route
          path="schools/:schoolId"
          element={
            <RequireSystemAdmin>
              <SchoolDetailPage />
            </RequireSystemAdmin>
          }
        />
        <Route
          path="users"
          element={
            <RequireSystemAdmin>
              <ComingSoonPage
                title="Users"
                description="A cross-school user directory isn't wired up on the backend yet."
              />
            </RequireSystemAdmin>
          }
        />

        {/* School admin only */}
        <Route
          path="classes"
          element={
            <RequireSchoolAdmin>
              <ClassesPage />
            </RequireSchoolAdmin>
          }
        />
        <Route
          path="classes/:classId"
          element={
            <RequireSchoolAdmin>
              <ClassDetailPage />
            </RequireSchoolAdmin>
          }
        />
        <Route
          path="teachers"
          element={
            <RequireSchoolAdmin>
              <TeachersPage />
            </RequireSchoolAdmin>
          }
        />
        <Route
          path="students"
          element={
            <RequireSchoolAdmin>
              <StudentsPage />
            </RequireSchoolAdmin>
          }
        />
        <Route
          path="subjects"
          element={
            <RequireSchoolAdmin>
              <SubjectsPage />
            </RequireSchoolAdmin>
          }
        />
        <Route
          path="subjects/:subjectId"
          element={
            <RequireSchoolAdmin>
              <SubjectDetailPage />
            </RequireSchoolAdmin>
          }
        />
        <Route
          path="subjects/:subjectId/topics/:topicId"
          element={
            <RequireSchoolAdmin>
              <TopicDetailPage />
            </RequireSchoolAdmin>
          }
        />
        <Route
          path="lessons"
          element={
            <RequireSchoolAdmin>
              <ComingSoonPage title="Lessons" description="Lesson authoring arrives in a later phase." />
            </RequireSchoolAdmin>
          }
        />
        <Route
          path="quizzes"
          element={
            <RequireSchoolAdmin>
              <ComingSoonPage title="Quizzes" description="Quiz management arrives in a later phase." />
            </RequireSchoolAdmin>
          }
        />
        <Route
          path="exams"
          element={
            <RequireSchoolAdmin>
              <ComingSoonPage title="Exams" description="Exam management arrives in a later phase." />
            </RequireSchoolAdmin>
          }
        />

        {/* Same path, different content per scope -- no guard needed, each
            scope only ever sees its own component. */}
        <Route path="analytics" element={isSystemAdmin ? <SystemAnalyticsPage /> : <SchoolAnalyticsPage />} />
        <Route
          path="settings"
          element={
            isSystemAdmin ? (
              <ComingSoonPage title="Settings" description="Platform settings arrive in a later phase." />
            ) : (
              <SchoolSettingsPage />
            )
          }
        />

        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AppShell>
  )
}
