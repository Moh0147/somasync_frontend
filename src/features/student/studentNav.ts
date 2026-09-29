import { DashboardIcon, DownloadIcon, ExamsIcon, QuizzesIcon } from '@/components/ui/icons'
import type { NavItem } from '@/components/layout/Sidebar'

export const studentNavItems: NavItem[] = [
  { label: 'Dashboard', to: '/student', icon: DashboardIcon },
  { label: 'Quizzes', to: '/student/quizzes', icon: QuizzesIcon },
  { label: 'Exam Results', to: '/student/results', icon: ExamsIcon },
  { label: 'Storage', to: '/student/storage', icon: DownloadIcon },
]
