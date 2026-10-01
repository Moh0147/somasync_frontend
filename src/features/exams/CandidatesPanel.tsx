import { useState } from 'react'
import type { FormEvent } from 'react'

import { EmptyState } from '@/components/feedback/EmptyState'
import { useToast } from '@/components/feedback/Toast'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { getApiErrorMessage } from '@/services/apiError'
import { addCandidate, removeCandidate } from '@/services/examsService'
import type { ExamCandidate } from '@/types/exam'
import type { AuthUser } from '@/types/auth'
import type { SchoolClass } from '@/types/class'

export function CandidatesPanel({
  examId,
  candidates,
  classes,
  selectedClassId,
  onClassChange,
  students,
  isLoadingStudents,
  studentsError,
  onChanged,
}: {
  examId: number
  candidates: ExamCandidate[]
  classes: SchoolClass[]
  selectedClassId: number | null
  onClassChange: (classId: number | null) => void
  students: AuthUser[]
  isLoadingStudents: boolean
  studentsError: string | null
  onChanged: () => void
}) {
  const { showToast } = useToast()
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([])
  const [prefix, setPrefix] = useState('F2A-')
  const [startingNumber, setStartingNumber] = useState('1')
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (selectedClassId === null) { setError('Select the class sitting this exam.'); return }
    if (!selectedStudentIds.length) { setError('Select at least one student.'); return }
    const startNumber = Number(startingNumber)
    if (!Number.isInteger(startNumber) || startNumber < 1 || !prefix.trim()) { setError('Enter a valid prefix and starting number.'); return }
    setIsSubmitting(true)
    let registeredCount = 0
    try {
      const usedNumbers = new Set(candidates.map((candidate) => candidate.candidate_number))
      let numberValue = startNumber
      const selectedInRosterOrder = students.filter((student) => selectedStudentIds.includes(student.id))
      for (const student of selectedInRosterOrder) {
        let number = `${prefix.trim()}${String(numberValue).padStart(3, '0')}`
        while (usedNumbers.has(number)) {
          numberValue += 1
          number = `${prefix.trim()}${String(numberValue).padStart(3, '0')}`
        }
        await addCandidate(examId, { student: student.id, candidate_number: number })
        usedNumbers.add(number)
        registeredCount += 1
        numberValue += 1
      }
      setSelectedStudentIds([])
      showToast('success', `${registeredCount} candidate(s) registered.`)
      onChanged()
    } catch (err) {
      if (registeredCount > 0) {
        setSelectedStudentIds([])
        onChanged()
      }
      setError(registeredCount > 0
        ? `${registeredCount} candidate(s) registered before this error: ${getApiErrorMessage(err)}`
        : getApiErrorMessage(err))
    }
    finally { setIsSubmitting(false) }
  }

  function studentName(student: AuthUser) {
    return `${student.first_name} ${student.last_name}`.trim() || student.username
  }

  const registeredCandidates = new Map(candidates.map((candidate) => [candidate.student, candidate]))
  const availableStudentCount = students.filter((student) => !registeredCandidates.has(student.id)).length
  const filteredStudents = students.filter((student) =>
    `${studentName(student)} ${student.username}`.toLowerCase().includes(search.trim().toLowerCase()),
  )
  const selectableFilteredIds = filteredStudents
    .filter((student) => !registeredCandidates.has(student.id))
    .map((student) => student.id)
  const allFilteredSelected = selectableFilteredIds.length > 0
    && selectableFilteredIds.every((studentId) => selectedStudentIds.includes(studentId))

  async function handleRemove(candidateNumberToRemove: string) {
    try {
      await removeCandidate(examId, candidateNumberToRemove)
      showToast('success', 'Candidate removed.')
      onChanged()
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    }
  }

  return (
    <Card>
      <CardHeader>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Candidates</p>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        {candidates.length === 0 && (
          <EmptyState title="No candidates registered yet." description="Select the exam class below, then register its students." />
        )}
        {candidates.length > 0 && (
          <ul className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
            {candidates.map((candidate) => (
              <li key={candidate.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                    {candidate.candidate_number.slice(-2)}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{candidate.candidate_number}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{studentName(students.find((student) => student.id === candidate.student) ?? { id: candidate.student, username: `Student #${candidate.student}`, first_name: '', last_name: '', email: '', phone_number: '', role: 'STUDENT', admin_scope: null, school: null, is_active: true, date_joined: '' })}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleRemove(candidate.candidate_number)}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={handleAdd} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Register students</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Choose the class sitting this exam. Candidate numbers are generated automatically.</p>
          </div>
          {classes.length === 0 ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              No class matches this exam's class level and academic year. Ask a school admin to create the class and enroll its students.
            </p>
          ) : (
            <Select
              label="Exam class"
              value={selectedClassId ?? ''}
              onChange={(event) => {
                setSelectedStudentIds([])
                setSearch('')
                setError(null)
                onClassChange(event.target.value ? Number(event.target.value) : null)
              }}
            >
              <option value="">Select a class</option>
              {classes.map((schoolClass) => (
                <option key={schoolClass.id} value={schoolClass.id}>
                  {schoolClass.name} · {schoolClass.academic_year}{schoolClass.is_active ? '' : ' · Inactive'}
                </option>
              ))}
            </Select>
          )}
          {selectedClassId !== null && (
            <div className="flex flex-col gap-2">
              {isLoadingStudents ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Loading students in this class…</p>
              ) : studentsError ? (
                <p role="alert" className="text-sm text-red-600 dark:text-red-400">{studentsError}</p>
              ) : students.length === 0 ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                  No students are enrolled in this class yet. Ask a school admin to enroll them first.
                </p>
              ) : students.every((student) => registeredCandidates.has(student.id)) ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">All students in this class are already registered for this exam.</p>
              ) : (
                <>
                  <Input
                    label="Find a student"
                    type="search"
                    placeholder="Search by name or username"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {selectedStudentIds.length} selected · {availableStudentCount} available
                    </p>
                    <label className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-500/10">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        disabled={selectableFilteredIds.length === 0 || isSubmitting}
                        onChange={(event) => setSelectedStudentIds((current) => event.target.checked
                          ? [...new Set([...current, ...selectableFilteredIds])]
                          : current.filter((id) => !selectableFilteredIds.includes(id)))}
                        className="accent-blue-600"
                      />
                      Select all {search.trim() ? 'matching' : 'available'}
                    </label>
                  </div>
                  {filteredStudents.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No students match that search.</p>
                  ) : (
                    <div className="grid max-h-56 gap-1 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 sm:grid-cols-2 dark:border-slate-700 dark:bg-slate-900">
                      {filteredStudents.map((student) => {
                        const registered = registeredCandidates.get(student.id)
                        return (
                          <label
                            key={student.id}
                            className={`flex min-w-0 items-start gap-2 rounded-md px-2 py-2 text-sm ${registered ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(registered) || selectedStudentIds.includes(student.id)}
                              disabled={Boolean(registered) || isSubmitting}
                              onChange={(event) => setSelectedStudentIds((current) => event.target.checked
                                ? [...current, student.id]
                                : current.filter((id) => id !== student.id))}
                              className="mt-0.5 accent-blue-600"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-medium text-slate-800 dark:text-slate-200">{studentName(student)}</span>
                              <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                                {registered ? `Registered · ${registered.candidate_number}` : student.username}
                              </span>
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-end gap-2">
            <Input label="Candidate prefix" placeholder="F2A-" value={prefix} onChange={(event) => setPrefix(event.target.value)} className="w-28" />
            <Input label="Starting number" type="number" min="1" value={startingNumber} onChange={(event) => setStartingNumber(event.target.value)} className="w-28" />
            <Button type="submit" size="sm" disabled={isSubmitting || !selectedClassId || !selectedStudentIds.length}>{isSubmitting ? 'Registering…' : `Register ${selectedStudentIds.length || ''} selected`}</Button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Numbers are assigned in roster order. Existing numbers with this prefix are skipped automatically.</p>
        </form>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </CardBody>
    </Card>
  )
}
