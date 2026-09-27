import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useParams } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useToast } from '@/components/feedback/Toast'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DescriptionList } from '@/components/ui/DescriptionList'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { listClassLevels } from '@/services/academicsService'
import { getApiErrorMessage } from '@/services/apiError'
import {
  assignClassTeacher,
  enrollClassStudent,
  getClass,
  listClassStudents,
  listClassTeachers,
  removeClassStudent,
  removeClassTeacher,
  updateClass,
} from '@/services/classesService'
import type { ClassLevel } from '@/types/academics'
import type { AuthUser } from '@/types/auth'
import type { SchoolClass } from '@/types/class'

function MemberList({
  members,
  emptyLabel,
  onRemove,
}: {
  members: AuthUser[]
  emptyLabel: string
  onRemove: (userId: number) => void
}) {
  if (members.length === 0) return <EmptyState title={emptyLabel} />

  return (
    <ul className="divide-y divide-slate-100">
      {members.map((member) => (
        <li key={member.id} className="flex items-center justify-between py-2.5 text-sm">
          <div>
            <p className="font-medium text-slate-900">
              {member.first_name || member.last_name ? `${member.first_name} ${member.last_name}`.trim() : member.username}
            </p>
            <p className="text-xs text-slate-500">
              {member.username} · #{member.id}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onRemove(member.id)}>
            Remove
          </Button>
        </li>
      ))}
    </ul>
  )
}

export default function ClassDetailPage() {
  const { classId } = useParams()
  const id = Number(classId)
  const { showToast } = useToast()

  const [schoolClass, setSchoolClass] = useState<SchoolClass | null>(null)
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([])
  const [teachers, setTeachers] = useState<AuthUser[]>([])
  const [students, setStudents] = useState<AuthUser[]>([])
  const [error, setError] = useState<string | null>(null)

  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', class_level: '', academic_year: '' })
  const [editError, setEditError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [confirmToggleOpen, setConfirmToggleOpen] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  const [teacherIdInput, setTeacherIdInput] = useState('')
  const [teacherError, setTeacherError] = useState<string | null>(null)
  const [isAssigningTeacher, setIsAssigningTeacher] = useState(false)

  const [studentIdInput, setStudentIdInput] = useState('')
  const [studentError, setStudentError] = useState<string | null>(null)
  const [isEnrollingStudent, setIsEnrollingStudent] = useState(false)

  async function load() {
    setError(null)
    try {
      const [classData, levelsData, teachersData, studentsData] = await Promise.all([
        getClass(id),
        listClassLevels(),
        listClassTeachers(id),
        listClassStudents(id),
      ])
      setSchoolClass(classData)
      setClassLevels(levelsData)
      setTeachers(teachersData)
      setStudents(studentsData)
      setEditForm({
        name: classData.name,
        class_level: String(classData.class_level),
        academic_year: String(classData.academic_year),
      })
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    load()
  }, [id])

  function levelName(levelId: number) {
    return classLevels.find((level) => level.id === levelId)?.name ?? `#${levelId}`
  }

  async function handleEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setEditError(null)
    setIsSaving(true)
    try {
      const updated = await updateClass(id, {
        name: editForm.name,
        class_level: Number(editForm.class_level),
        academic_year: Number(editForm.academic_year),
      })
      setSchoolClass(updated)
      setEditOpen(false)
      showToast('success', 'Class updated.')
    } catch (err) {
      setEditError(getApiErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleToggleActive() {
    if (!schoolClass) return
    setIsToggling(true)
    try {
      const updated = await updateClass(id, { is_active: !schoolClass.is_active })
      setSchoolClass(updated)
      showToast('success', updated.is_active ? 'Class activated.' : 'Class deactivated.')
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setIsToggling(false)
      setConfirmToggleOpen(false)
    }
  }

  async function handleAssignTeacher(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTeacherError(null)
    const userId = Number(teacherIdInput)
    if (!userId) {
      setTeacherError('Enter a valid user ID.')
      return
    }
    setIsAssigningTeacher(true)
    try {
      const teacher = await assignClassTeacher(id, userId)
      setTeachers((current) => [...current, teacher])
      setTeacherIdInput('')
      showToast('success', 'Teacher assigned.')
    } catch (err) {
      setTeacherError(getApiErrorMessage(err))
    } finally {
      setIsAssigningTeacher(false)
    }
  }

  async function handleRemoveTeacher(userId: number) {
    try {
      await removeClassTeacher(id, userId)
      setTeachers((current) => current.filter((teacher) => teacher.id !== userId))
      showToast('success', 'Teacher unassigned.')
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    }
  }

  async function handleEnrollStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStudentError(null)
    const userId = Number(studentIdInput)
    if (!userId) {
      setStudentError('Enter a valid user ID.')
      return
    }
    setIsEnrollingStudent(true)
    try {
      const student = await enrollClassStudent(id, userId)
      setStudents((current) => [...current, student])
      setStudentIdInput('')
      showToast('success', 'Student enrolled.')
    } catch (err) {
      setStudentError(getApiErrorMessage(err))
    } finally {
      setIsEnrollingStudent(false)
    }
  }

  async function handleRemoveStudent(userId: number) {
    try {
      await removeClassStudent(id, userId)
      setStudents((current) => current.filter((student) => student.id !== userId))
      showToast('success', 'Student unenrolled.')
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    }
  }

  if (error) return <ErrorState description={error} onRetry={load} />
  if (!schoolClass) return <LoadingState message="Loading class…" />

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={schoolClass.name}
        description={`${levelName(schoolClass.class_level)} · ${schoolClass.academic_year}`}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Button
              variant={schoolClass.is_active ? 'danger' : 'success'}
              size="sm"
              onClick={() => setConfirmToggleOpen(true)}
            >
              {schoolClass.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">Class details</p>
          <StatusBadge
            status={schoolClass.is_active ? 'available' : 'locked'}
            label={schoolClass.is_active ? 'Active' : 'Inactive'}
          />
        </CardHeader>
        <CardBody>
          <DescriptionList
            items={[
              { label: 'Level', value: levelName(schoolClass.class_level) },
              { label: 'Academic year', value: String(schoolClass.academic_year) },
              { label: 'Class code', value: schoolClass.class_code },
            ]}
          />
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <p className="text-sm font-semibold text-slate-900">Teachers</p>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            <MemberList members={teachers} emptyLabel="No teachers assigned yet." onRemove={handleRemoveTeacher} />
            <form onSubmit={handleAssignTeacher} className="flex items-end gap-2" noValidate>
              <Input
                label="Assign by user ID"
                placeholder="e.g. 42"
                value={teacherIdInput}
                onChange={(event) => setTeacherIdInput(event.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="sm" disabled={isAssigningTeacher}>
                {isAssigningTeacher ? 'Assigning…' : 'Assign'}
              </Button>
            </form>
            {teacherError && <p className="text-sm text-red-600">{teacherError}</p>}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <p className="text-sm font-semibold text-slate-900">Students</p>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            <MemberList members={students} emptyLabel="No students enrolled yet." onRemove={handleRemoveStudent} />
            <form onSubmit={handleEnrollStudent} className="flex items-end gap-2" noValidate>
              <Input
                label="Enroll by user ID"
                placeholder="e.g. 108"
                value={studentIdInput}
                onChange={(event) => setStudentIdInput(event.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="sm" disabled={isEnrollingStudent}>
                {isEnrollingStudent ? 'Enrolling…' : 'Enroll'}
              </Button>
            </form>
            {studentError && <p className="text-sm text-red-600">{studentError}</p>}
          </CardBody>
        </Card>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit class">
        <form onSubmit={handleEdit} className="flex flex-col gap-4" noValidate>
          <Input
            label="Class name"
            required
            value={editForm.name}
            onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
          />
          <Select
            label="Class level"
            required
            value={editForm.class_level}
            onChange={(event) => setEditForm({ ...editForm, class_level: event.target.value })}
          >
            {classLevels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))}
          </Select>
          <Input
            label="Academic year"
            type="number"
            required
            value={editForm.academic_year}
            onChange={(event) => setEditForm({ ...editForm, academic_year: event.target.value })}
          />
          {editError && (
            <p role="alert" className="text-sm text-red-600">
              {editError}
            </p>
          )}
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmToggleOpen}
        title={schoolClass.is_active ? 'Deactivate class' : 'Activate class'}
        message={
          schoolClass.is_active
            ? 'Deactivating this class hides it from active use. You can reactivate it anytime.'
            : 'This will reactivate the class.'
        }
        confirmLabel={schoolClass.is_active ? 'Deactivate' : 'Activate'}
        variant={schoolClass.is_active ? 'danger' : 'primary'}
        isLoading={isToggling}
        onCancel={() => setConfirmToggleOpen(false)}
        onConfirm={handleToggleActive}
      />
    </div>
  )
}
