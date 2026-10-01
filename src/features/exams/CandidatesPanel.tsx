import { useState } from 'react'
import type { FormEvent } from 'react'

import { EmptyState } from '@/components/feedback/EmptyState'
import { useToast } from '@/components/feedback/Toast'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { getApiErrorMessage } from '@/services/apiError'
import { addCandidate, removeCandidate } from '@/services/examsService'
import type { ExamCandidate } from '@/types/exam'
import type { AuthUser } from '@/types/auth'

export function CandidatesPanel({
  examId,
  candidates,
  students,
  onChanged,
}: {
  examId: number
  candidates: ExamCandidate[]
  students: AuthUser[]
  onChanged: () => void
}) {
  const { showToast } = useToast()
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([])
  const [prefix, setPrefix] = useState('F2A-')
  const [startingNumber, setStartingNumber] = useState('1')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!selectedStudentIds.length) { setError('Select at least one student.'); return }
    const startNumber = Number(startingNumber)
    if (!Number.isInteger(startNumber) || startNumber < 1 || !prefix.trim()) { setError('Enter a valid prefix and starting number.'); return }
    setIsSubmitting(true)
    try {
      for (const [index, studentId] of selectedStudentIds.entries()) {
        const number = `${prefix.trim()}${String(startNumber + index).padStart(3, '0')}`
        await addCandidate(examId, { student: studentId, candidate_number: number })
      }
      setSelectedStudentIds([])
      showToast('success', `${selectedStudentIds.length} candidate(s) registered.`)
      onChanged()
    } catch (err) { setError(getApiErrorMessage(err)) }
    finally { setIsSubmitting(false) }
  }

  function studentName(student: AuthUser) {
    return `${student.first_name} ${student.last_name}`.trim() || student.username
  }

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
          <EmptyState title="No candidates registered yet." description="Register each student sitting this exam with a candidate number." />
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
        <form onSubmit={handleAdd} className="flex flex-col gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Register class students</p>
          {students.length === 0 ? <p className="text-sm text-slate-500">No students found in the exam class.</p> : <div className="grid max-h-48 gap-2 overflow-y-auto sm:grid-cols-2">{students.map((student) => <label key={student.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selectedStudentIds.includes(student.id)} onChange={(event) => setSelectedStudentIds((current) => event.target.checked ? [...current, student.id] : current.filter((id) => id !== student.id))} /><span>{studentName(student)}</span><span className="text-xs text-slate-400">({student.username})</span></label>)}</div>}
          <div className="flex flex-wrap items-end gap-2">
            <Input label="Candidate prefix" placeholder="F2A-" value={prefix} onChange={(event) => setPrefix(event.target.value)} className="w-28" />
            <Input label="Starting number" type="number" min="1" value={startingNumber} onChange={(event) => setStartingNumber(event.target.value)} className="w-28" />
            <Button type="submit" size="sm" disabled={isSubmitting || !selectedStudentIds.length}>{isSubmitting ? 'Registering…' : `Register ${selectedStudentIds.length || ''} selected`}</Button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Candidate numbers will be generated automatically, e.g. {prefix || 'F2A-'}{String(Number(startingNumber) || 1).padStart(3, '0')}.</p>
        </form>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </CardBody>
    </Card>
  )
}
