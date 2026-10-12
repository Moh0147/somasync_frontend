import { Navigate, Route, Routes } from 'react-router-dom'

import { ComingSoonPage } from '@/components/feedback/ComingSoonPage'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/AuthContext'
import { markingNavItems } from '@/features/marking/markingNav'

import MarkingAuditPage from './MarkingAuditPage'
import MarkingDashboardPage from './MarkingDashboardPage'
import MarkingExaminersPage from './MarkingExaminersPage'
import MarkingScriptPage from './MarkingScriptPage'
import MarkingScriptsPage from './MarkingScriptsPage'
import MarkingSessionDetailPage from './MarkingSessionDetailPage'
import MarkingSessionsPage from './MarkingSessionsPage'

export default function MarkingAreaPage() {
  const { logout } = useAuth()

  return (
    <AppShell
      title="Marking"
      navItems={markingNavItems}
      topBarActions={
        <Button variant="ghost" size="sm" onClick={() => logout()}>
          Sign out
        </Button>
      }
    >
      <Routes>
        <Route index element={<MarkingDashboardPage />} />
        <Route path="sessions" element={<MarkingSessionsPage />} />
        <Route path="sessions/:examId" element={<MarkingSessionDetailPage />} />
        <Route path="scripts" element={<MarkingScriptsPage />} />
        <Route path="scripts/:scriptId" element={<MarkingScriptPage />} />
        <Route path="examiners" element={<MarkingExaminersPage />} />
        <Route path="analytics" element={<ComingSoonPage title="Marking Analytics" />} />
        <Route path="audit" element={<MarkingAuditPage />} />
        <Route path="*" element={<Navigate to="/marking" replace />} />
      </Routes>
    </AppShell>
  )
}
