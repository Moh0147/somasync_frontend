import type { AuthUser } from '@/types/auth'

export function displayName(user: Pick<AuthUser, 'first_name' | 'last_name' | 'username'>) {
  const fullName = `${user.first_name} ${user.last_name}`.trim()
  return fullName || user.username
}
