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
import { PencilIcon, TrashIcon } from '@/components/ui/icons'
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
import { listSchoolStudents, listSchoolTeachers } from '@/services/schoolsService'
import type { ClassLevel } from '@/types/academics'
import type { AuthUser } from '@/types/auth'
import type { SchoolClass } from '@/types/class'

function memberLabel(member: AuthUser) {
  const fullName = `${member.first_name} ${member.last_name}`.trim()
  return fullName ? `${fullName} (${member.username})` : member.username
}

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
    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
      {members.map((member) => (
        <li key={member.id} className="flex items-center justify-between py-2.5 text-sm">
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100">
              {member.first_name || member.last_name ? `${member.first_name} ${member.last_name}`.trim() : member.username}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{member.username}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onRemove(member.id)}>
            <TrashIcon className="h-3.5 w-3.5" />
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
  
  
  
  const [schoolTeachers, setSchoolTeachers] = useState<AuthUser[]>([])
  const [schoolStudents, setSchoolStudents] = useState<AuthUser[]>([])
  const [error, setError] = useState<string | null>(null)

  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', class_level: '', academic_year: '' })
  const [editError, setEditError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [confirmToggleOpen, setConfirmToggleOpen] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [teacherError, setTeacherError] = useState<string | null>(null)
  const [isAssigningTeacher, setIsAssigningTeacher] = useState(false)

  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [studentError, setStudentError] = useState<string | null>(null)
  const [isEnrollingStudent, setIsEnrollingStudent] = useState(false)

  async function load() {
    setError(null)
    try {
      
      
      const classData = await getClass(id)
      const [levelsData, teachersData, studentsData, schoolTeachersData, schoolStudentsData] = await Promise.all([
        listClassLevels(),
        listClassTeachers(id),
        listClassStudents(id),
        listSchoolTeachers(classData.school),
        listSchoolStudents(classData.school),
      ])
      setSchoolClass(classData)
      setClassLevels(levelsData)
      setTeachers(teachersData)
      setStudents(studentsData)
      setSchoolTeachers(schoolTeachersData)
      setSchoolStudents(schoolStudentsData)
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
    const userId = Number(selectedTeacherId)
    if (!userId) {
      setTeacherError('Choose a teacher first.')
      return
    }
    setIsAssigningTeacher(true)
    try {
      const teacher = await assignClassTeacher(id, userId)
      setTeachers((current) => [...current, teacher])
      setSelectedTeacherId('')
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
    const userId = Number(selectedStudentId)
    if (!userId) {
      setStudentError('Choose a student first.')
      return
    }
    setIsEnrollingStudent(true)
    try {
      const student = await enrollClassStudent(id, userId)
      setStudents((current) => [...current, student])
      setSelectedStudentId('')
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

  const assignedTeacherIds = new Set(teachers.map((teacher) => teacher.id))
  const assignedStudentIds = new Set(students.map((student) => student.id))
  const availableTeachers = schoolTeachers.filter((teacher) => !assignedTeacherIds.has(teacher.id))
  const availableStudents = schoolStudents.filter((student) => !assignedStudentIds.has(student.id))

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={schoolClass.name}
        description={`${levelName(schoolClass.class_level)} · ${schoolClass.academic_year}`}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
              <PencilIcon className="h-3.5 w-3.5" />
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
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Class details</p>
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
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Teachers</p>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            <MemberList members={teachers} emptyLabel="No teachers assigned yet." onRemove={handleRemoveTeacher} />
            {schoolTeachers.length === 0 ? (
              <EmptyState
                title="This school has no teacher accounts yet."
                description="Create a teacher account first, then come back here to assign them."
              />
            ) : availableTeachers.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Every teacher in this school is already assigned to this class.
              </p>
            ) : (
              <form onSubmit={handleAssignTeacher} className="flex items-end gap-2" noValidate>
                <Select
                  label="Assign a teacher"
                  value={selectedTeacherId}
                  onChange={(event) => setSelectedTeacherId(event.target.value)}
                  className="flex-1"
                >
                  <option value="" disabled>
                    Select a teacher
                  </option>
                  {availableTeachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {memberLabel(teacher)}
                    </option>
                  ))}
                </Select>
                <Button type="submit" size="sm" disabled={isAssigningTeacher}>
                  {isAssigningTeacher ? 'Assigning…' : 'Assign'}
                </Button>
              </form>
            )}
            {teacherError && <p className="text-sm text-red-600 dark:text-red-400">{teacherError}</p>}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Students</p>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            <MemberList members={students} emptyLabel="No students enrolled yet." onRemove={handleRemoveStudent} />
            {schoolStudents.length === 0 ? (
              <EmptyState
                title="This school has no student accounts yet."
                description="Create a student account first, then come back here to enroll them -- or have them join with the class code themselves."
              />
            ) : availableStudents.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Every student in this school is already enrolled in this class.
              </p>
            ) : (
              <form onSubmit={handleEnrollStudent} className="flex items-end gap-2" noValidate>
                <Select
                  label="Enroll a student"
                  value={selectedStudentId}
                  onChange={(event) => setSelectedStudentId(event.target.value)}
                  className="flex-1"
                >
                  <option value="" disabled>
                    Select a student
                  </option>
                  {availableStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {memberLabel(student)}
                    </option>
                  ))}
                </Select>
                <Button type="submit" size="sm" disabled={isEnrollingStudent}>
                  {isEnrollingStudent ? 'Enrolling…' : 'Enroll'}
                </Button>
              </form>
            )}
            {studentError && <p className="text-sm text-red-600 dark:text-red-400">{studentError}</p>}
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
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
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
