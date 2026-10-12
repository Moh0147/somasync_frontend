import type { UserRole } from '@/types/analytics'

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Admin',
  TEACHER: 'Teacher',
  STUDENT: 'Student',
}

export function roleLabel(role: UserRole, adminScope?: string | null): string {
  if (role === 'ADMIN') return adminScope === 'SCHOOL' ? 'School Admin' : 'System Admin'
  return ROLE_LABELS[role] ?? role
}

// Roles that require a school FK (mirrors backend _SCHOOL_REQUIRED_ROLES).
export const SCHOOL_REQUIRED_ROLES: UserRole[] = ['TEACHER', 'STUDENT']

export const SCHOOL_OPTIONAL_ROLES: UserRole[] = []

export const ASSIGNABLE_ROLES: Array<{ value: UserRole; label: string }> = [
  { value: 'TEACHER', label: 'Teacher' },
  { value: 'STUDENT', label: 'Student' },
]
