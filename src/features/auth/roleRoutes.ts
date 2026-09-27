import type { Role } from '@/types/auth'

export const roleHomeRoute: Record<Role, string> = {
  ADMIN: '/admin',
  TEACHER: '/teacher',
  STUDENT: '/student',
}
