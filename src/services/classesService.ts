import type { AuthUser } from '@/types/auth'
import type { PaginatedResult } from '@/types/api'
import type { SchoolClass } from '@/types/class'

import { apiClient } from './apiClient'

export interface ClassPayload {
  name: string
  class_level: number
  academic_year: number
}

export async function listClasses() {
  const response = await apiClient.get<{ data: PaginatedResult<SchoolClass> }>('/classes/')
  return response.data.data.results
}

export async function getClass(id: number) {
  const response = await apiClient.get<{ data: SchoolClass }>(`/classes/${id}/`)
  return response.data.data
}

export async function createClass(payload: ClassPayload) {
  const response = await apiClient.post<{ data: SchoolClass }>('/classes/', payload)
  return response.data.data
}

export async function updateClass(id: number, payload: Partial<ClassPayload> & { is_active?: boolean }) {
  const response = await apiClient.patch<{ data: SchoolClass }>(`/classes/${id}/`, payload)
  return response.data.data
}

export async function listClassTeachers(classId: number) {
  const response = await apiClient.get<{ data: AuthUser[] }>(`/classes/${classId}/teachers/`)
  return response.data.data
}

export async function assignClassTeacher(classId: number, userId: number) {
  const response = await apiClient.post<{ data: AuthUser }>(`/classes/${classId}/teachers/`, { user_id: userId })
  return response.data.data
}

export async function removeClassTeacher(classId: number, userId: number) {
  await apiClient.delete(`/classes/${classId}/teachers/`, { data: { user_id: userId } })
}

export async function listClassStudents(classId: number) {
  const response = await apiClient.get<{ data: AuthUser[] }>(`/classes/${classId}/students/`)
  return response.data.data
}

export async function enrollClassStudent(classId: number, userId: number) {
  const response = await apiClient.post<{ data: AuthUser }>(`/classes/${classId}/students/`, { user_id: userId })
  return response.data.data
}

export async function removeClassStudent(classId: number, userId: number) {
  await apiClient.delete(`/classes/${classId}/students/`, { data: { user_id: userId } })
}

// The backend has no "classes I teach" filter -- /api/classes/ only scopes by
// school. Cross-referencing each class's teacher roster client-side is the
// only way to derive "my classes" until that endpoint exists.
export async function listMyClasses(teacherId: number): Promise<SchoolClass[]> {
  const allClasses = await listClasses()
  const withTeachers = await Promise.all(
    allClasses.map(async (schoolClass) => ({
      schoolClass,
      teachers: await listClassTeachers(schoolClass.id),
    })),
  )
  return withTeachers
    .filter(({ teachers }) => teachers.some((teacher) => teacher.id === teacherId))
    .map(({ schoolClass }) => schoolClass)
}

export interface StudentWithClass {
  student: AuthUser
  schoolClass: SchoolClass
}

export async function listStudentsForClasses(classes: SchoolClass[]): Promise<StudentWithClass[]> {
  const perClass = await Promise.all(
    classes.map(async (schoolClass) => {
      const students = await listClassStudents(schoolClass.id)
      return students.map((student) => ({ student, schoolClass }))
    }),
  )
  return perClass.flat()
}
