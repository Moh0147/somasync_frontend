import { Route, Routes } from 'react-router-dom'

import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/AuthContext'
import { studentNavItems } from '@/features/student/studentNav'

import ExamResultDetailPage from './ExamResultDetailPage'
import ExamResultsPage from './ExamResultsPage'
import JoinClassPage from './JoinClassPage'
import LessonReaderPage from './LessonReaderPage'
import QuizDetailPage from './QuizDetailPage'
import QuizzesPage from './QuizzesPage'
import StorageManagementPage from './StorageManagementPage'
import StudentDashboardPage from './StudentDashboardPage'

export default function StudentAreaPage() {
  const { logout } = useAuth()

  return (
    <AppShell
      title="Student"
      navItems={studentNavItems}
      topBarActions={
        <Button variant="ghost" size="sm" onClick={() => logout()}>
          Sign out
        </Button>
      }
    >
      <Routes>
        <Route index element={<StudentDashboardPage />} />
        <Route path="lessons/:lessonId" element={<LessonReaderPage />} />
        <Route path="lessons/:lessonId/sections/:sectionId" element={<LessonReaderPage />} />
        <Route path="quizzes" element={<QuizzesPage />} />
        <Route path="quizzes/:quizId" element={<QuizDetailPage />} />
        <Route path="results" element={<ExamResultsPage />} />
        <Route path="results/:resultId" element={<ExamResultDetailPage />} />
        <Route path="storage" element={<StorageManagementPage />} />
        <Route path="join-class" element={<JoinClassPage />} />
      </Routes>
    </AppShell>
  )
}
