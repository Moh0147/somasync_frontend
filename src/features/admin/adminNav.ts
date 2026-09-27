import type { NavItem } from '@/components/layout/Sidebar'

export const systemAdminNavItems: NavItem[] = [
  { label: 'Dashboard', to: '/admin' },
  { label: 'Schools', to: '/admin/schools' },
  { label: 'Users', to: '/admin/users' },
  { label: 'Analytics', to: '/admin/analytics' },
  { label: 'Settings', to: '/admin/settings' },
]

export const schoolAdminNavItems: NavItem[] = [
  { label: 'Dashboard', to: '/admin' },
  { label: 'Teachers', to: '/admin/teachers' },
  { label: 'Students', to: '/admin/students' },
  { label: 'Classes', to: '/admin/classes' },
  { label: 'Subjects', to: '/admin/subjects' },
  { label: 'Lessons', to: '/admin/lessons' },
  { label: 'Quizzes', to: '/admin/quizzes' },
  { label: 'Exams', to: '/admin/exams' },
  { label: 'Analytics', to: '/admin/analytics' },
  { label: 'Settings', to: '/admin/settings' },
]
