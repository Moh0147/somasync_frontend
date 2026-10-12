import {
  AnalyticsIcon,
  ClassesIcon,
  DashboardIcon,
  ExamsIcon,
  LessonsIcon,
  QuizzesIcon,
  SchoolsIcon,
  SettingsIcon,
  StudentsIcon,
  SubjectsIcon,
  UsersIcon,
} from '@/components/ui/icons'
import type { NavItem } from '@/components/layout/Sidebar'

export const systemAdminNavItems: NavItem[] = [
  { label: 'Dashboard', to: '/admin', icon: DashboardIcon },
  { label: 'Schools', to: '/admin/schools', icon: SchoolsIcon },
  { label: 'Users', to: '/admin/users', icon: UsersIcon },
  { label: 'Analytics', to: '/admin/analytics', icon: AnalyticsIcon },
  { label: 'Settings', to: '/admin/settings', icon: SettingsIcon },
]

export const schoolAdminNavItems: NavItem[] = [
  { label: 'Dashboard', to: '/admin', icon: DashboardIcon },
  { label: 'Classes', to: '/admin/classes', icon: ClassesIcon },
  { label: 'Teachers', to: '/admin/teachers', icon: UsersIcon },
  { label: 'Students', to: '/admin/students', icon: StudentsIcon },
  { label: 'Subjects', to: '/admin/subjects', icon: SubjectsIcon },
  { label: 'Lessons', to: '/admin/lessons', icon: LessonsIcon },
  { label: 'Quizzes', to: '/admin/quizzes', icon: QuizzesIcon },
  { label: 'Exams', to: '/admin/exams', icon: ExamsIcon },
  { label: 'Analytics', to: '/admin/analytics', icon: AnalyticsIcon },
  { label: 'Settings', to: '/admin/settings', icon: SettingsIcon },
]
