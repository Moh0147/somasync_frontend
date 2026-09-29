import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from '@/app/router/ProtectedRoute'
import { RootRedirect } from '@/app/router/RootRedirect'
import { LoadingState } from '@/components/feedback/LoadingState'
import LoginPage from '@/pages/LoginPage'
import NotFoundPage from '@/pages/NotFoundPage'
import UnauthorizedPage from '@/pages/UnauthorizedPage'

// Each role's area is its own chunk -- a student's bundle never pulls in
// the teacher's quiz/exam editors or the admin console, and vice versa.
const AdminAreaPage = lazy(() => import('@/pages/admin/AdminAreaPage'))
const TeacherAreaPage = lazy(() => import('@/pages/teacher/TeacherAreaPage'))
const StudentAreaPage = lazy(() => import('@/pages/student/StudentAreaPage'))
const DesignSystemPreviewPage = lazy(() => import('@/pages/DesignSystemPreviewPage'))

function AreaFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingState message="Loading…" />
    </div>
  )
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Suspense fallback={<AreaFallback />}>
              <AdminAreaPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/*"
        element={
          <ProtectedRoute allowedRoles={['TEACHER']}>
            <Suspense fallback={<AreaFallback />}>
              <TeacherAreaPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/*"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <Suspense fallback={<AreaFallback />}>
              <StudentAreaPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      {import.meta.env.DEV && (
        <Route
          path="/design-system"
          element={
            <Suspense fallback={null}>
              <DesignSystemPreviewPage />
            </Suspense>
          }
        />
      )}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
