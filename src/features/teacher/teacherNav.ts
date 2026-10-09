import {
  AnalyticsIcon,
  DashboardIcon,
  ExamsIcon,
  LessonsIcon,
  QuizzesIcon,
  ResultsHubIcon,
  StudentsIcon,
  UsersIcon,
} from '@/components/ui/icons'
import type { NavItem } from '@/components/layout/Sidebar'

// Order matters beyond the first 4 -- BottomNav shows those as tabs and
// folds the rest into "More" on small screens.
export const teacherNavItems: NavItem[] = [
  { label: 'Dashboard', to: '/teacher', icon: DashboardIcon },
  { label: 'My Classes', to: '/teacher/classes', icon: UsersIcon },
  { label: 'Lessons', to: '/teacher/lessons', icon: LessonsIcon },
  { label: 'Quizzes', to: '/teacher/quizzes', icon: QuizzesIcon },
  { label: 'Exams', to: '/teacher/exams', icon: ExamsIcon },
  { label: 'Results Hub', to: '/teacher/results', icon: ResultsHubIcon },
  { label: 'Students', to: '/teacher/students', icon: StudentsIcon },
  { label: 'Analytics', to: '/teacher/analytics', icon: AnalyticsIcon },
]
