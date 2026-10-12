import type { AuthUser } from '@/types/auth'
import type { PaginatedResult } from '@/types/api'
import type { School } from '@/types/school'

import { apiClient } from './apiClient'

export interface SchoolPayload {
  name: string
  code: string
  address?: string
  phone_number?: string
  email?: string
}

export interface SchoolAdminPayload {
  username: string
  email: string
  first_name: string
  last_name: string
  phone_number: string
  password: string
}

export type TeacherPayload = SchoolAdminPayload
export type StudentPayload = SchoolAdminPayload

export async function listSchools() {
  const response = await apiClient.get<{ data: PaginatedResult<School> }>('/schools/')
  return response.data.data.results
}

export async function getSchool(id: number) {
  const response = await apiClient.get<{ data: School }>(`/schools/${id}/`)
  return response.data.data
}

export async function createSchool(payload: SchoolPayload) {
  const response = await apiClient.post<{ data: School }>('/schools/', payload)
  return response.data.data
}

export async function updateSchool(id: number, payload: Partial<SchoolPayload>) {
  const response = await apiClient.patch<{ data: School }>(`/schools/${id}/`, payload)
  return response.data.data
}

export async function activateSchool(id: number) {
  const response = await apiClient.post<{ data: School }>(`/schools/${id}/activate/`)
  return response.data.data
}

export async function deactivateSchool(id: number) {
  const response = await apiClient.post<{ data: School }>(`/schools/${id}/deactivate/`)
  return response.data.data
}

export async function listSchoolAdmins(schoolId: number) {
  const response = await apiClient.get<{ data: AuthUser[] }>(`/schools/${schoolId}/admins/`)
  return response.data.data
}

export async function createSchoolAdmin(schoolId: number, payload: SchoolAdminPayload) {
  const response = await apiClient.post<{ data: AuthUser }>(`/schools/${schoolId}/admins/`, payload)
  return response.data.data
}

export async function listSchoolTeachers(schoolId: number) {
  const response = await apiClient.get<{ data: AuthUser[] }>(`/schools/${schoolId}/teachers/`)
  return response.data.data
}

export async function createTeacher(schoolId: number, payload: TeacherPayload) {
  const response = await apiClient.post<{ data: AuthUser }>(`/schools/${schoolId}/teachers/`, payload)
  return response.data.data
}

export async function listSchoolStudents(schoolId: number) {
  const response = await apiClient.get<{ data: AuthUser[] }>(`/schools/${schoolId}/students/`)
  return response.data.data
}

export async function createStudent(schoolId: number, payload: StudentPayload) {
  const response = await apiClient.post<{ data: AuthUser }>(`/schools/${schoolId}/students/`, payload)
  return response.data.data
}
