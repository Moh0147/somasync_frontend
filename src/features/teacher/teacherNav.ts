import type { NavItem } from '@/components/layout/Sidebar'

export const teacherNavItems: NavItem[] = [
  { label: 'Dashboard', to: '/teacher' },
  { label: 'My Classes', to: '/teacher/classes' },
  { label: 'Lessons', to: '/teacher/lessons' },
  { label: 'Quizzes', to: '/teacher/quizzes' },
  { label: 'Exams', to: '/teacher/exams' },
  { label: 'Students', to: '/teacher/students' },
  { label: 'Analytics', to: '/teacher/analytics' },
]
