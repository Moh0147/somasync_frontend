import type { UserRole, SystemDirectoryUser } from '@/types/analytics'
import { apiClient } from './apiClient'

export interface CreateUserPayload {
  username: string
  email?: string
  first_name?: string
  last_name?: string
  phone_number?: string
  password: string
  role: UserRole
  school?: number | null
}

export interface UpdateUserPayload {
  role?: UserRole
  school?: number | null
  is_active?: boolean
  first_name?: string
  last_name?: string
  email?: string
  phone_number?: string
}

export async function listAdminUsers(): Promise<SystemDirectoryUser[]> {
  const res = await apiClient.get<{ data: SystemDirectoryUser[] }>('/admin/users/')
  return res.data.data
}

export async function createAdminUser(payload: CreateUserPayload): Promise<SystemDirectoryUser> {
  const res = await apiClient.post<{ data: SystemDirectoryUser }>('/admin/users/', payload)
  return res.data.data
}

export async function getAdminUser(id: number): Promise<SystemDirectoryUser> {
  const res = await apiClient.get<{ data: SystemDirectoryUser }>(`/admin/users/${id}/`)
  return res.data.data
}

export async function updateAdminUser(id: number, payload: UpdateUserPayload): Promise<SystemDirectoryUser> {
  const res = await apiClient.patch<{ data: SystemDirectoryUser }>(`/admin/users/${id}/`, payload)
  return res.data.data
}
