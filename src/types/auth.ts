export const ROLES = ['ADMIN', 'TEACHER', 'STUDENT'] as const
export type Role = (typeof ROLES)[number]

export const ADMIN_SCOPES = ['SYSTEM', 'SCHOOL'] as const
export type AdminScope = (typeof ADMIN_SCOPES)[number]

export interface AuthUser {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  phone_number: string
  role: Role
  admin_scope: AdminScope | null
  school: number | null
  is_active: boolean
  date_joined: string
}
