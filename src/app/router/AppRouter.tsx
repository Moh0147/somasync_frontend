import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from '@/app/router/ProtectedRoute'
import { RootRedirect } from '@/app/router/RootRedirect'
import AdminAreaPage from '@/pages/admin/AdminAreaPage'
import LoginPage from '@/pages/LoginPage'
import NotFoundPage from '@/pages/NotFoundPage'
import StudentAreaPage from '@/pages/student/StudentAreaPage'
import TeacherAreaPage from '@/pages/teacher/TeacherAreaPage'
import UnauthorizedPage from '@/pages/UnauthorizedPage'

const DesignSystemPreviewPage = lazy(() => import('@/pages/DesignSystemPreviewPage'))

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
            <AdminAreaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/*"
        element={
          <ProtectedRoute allowedRoles={['TEACHER']}>
            <TeacherAreaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/*"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentAreaPage />
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
