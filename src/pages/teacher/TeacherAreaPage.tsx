import { Navigate, Route, Routes } from 'react-router-dom'

import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/AuthContext'
import { teacherNavItems } from '@/features/teacher/teacherNav'

import ExamEditorPage from './ExamEditorPage'
import ExamsPage from './ExamsPage'
import LessonEditorPage from './LessonEditorPage'
import LessonsPage from './LessonsPage'
import MiniQuizEditorPage from './MiniQuizEditorPage'
import MyClassesPage from './MyClassesPage'
import QuizEditorPage from './QuizEditorPage'
import QuizzesPage from './QuizzesPage'
import ResultsHubPage from './ResultsHubPage'
import ScriptReviewPage from './ScriptReviewPage'
import SectionContentPage from './SectionContentPage'
import StudentsPage from './StudentsPage'
import TeacherAnalyticsPage from './TeacherAnalyticsPage'
import TeacherClassDetailPage from './TeacherClassDetailPage'
import TeacherDashboardPage from './TeacherDashboardPage'

export default function TeacherAreaPage() {
  const { logout } = useAuth()

  return (
    <AppShell
      title="Teacher"
      navItems={teacherNavItems}
      topBarActions={
        <Button variant="ghost" size="sm" onClick={() => logout()}>
          Sign out
        </Button>
      }
    >
      <Routes>
        <Route index element={<TeacherDashboardPage />} />
        <Route path="classes" element={<MyClassesPage />} />
        <Route path="classes/:classId" element={<TeacherClassDetailPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="lessons" element={<LessonsPage />} />
        <Route path="lessons/:lessonId" element={<LessonEditorPage />} />
        <Route path="lessons/:lessonId/sections/:sectionId" element={<SectionContentPage />} />
        <Route path="lessons/:lessonId/sections/:sectionId/quiz" element={<MiniQuizEditorPage />} />
        <Route path="quizzes" element={<QuizzesPage />} />
        <Route path="quizzes/:quizId" element={<QuizEditorPage />} />
        <Route path="exams" element={<ExamsPage />} />
        <Route path="exams/:examId" element={<ExamEditorPage />} />
        <Route path="exams/:examId/scripts/:scriptId" element={<ScriptReviewPage />} />
        <Route path="results" element={<ResultsHubPage />} />
        <Route path="analytics" element={<TeacherAnalyticsPage />} />
        <Route path="*" element={<Navigate to="/teacher" replace />} />
      </Routes>
    </AppShell>
  )
}
