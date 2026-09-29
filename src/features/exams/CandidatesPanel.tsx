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

// Suggests the next sequential number from the last candidate's own
// number (e.g. "F2A-002" after "F2A-001") -- a real convenience, not just
// a manual free-text field, matching the spec's "Generate Candidate IDs"
// framing. Falls back to blank (manual entry) if no clean pattern exists.
function suggestNextCandidateNumber(candidates: ExamCandidate[]) {
  if (candidates.length === 0) return ''
  const last = candidates[candidates.length - 1].candidate_number
  const match = last.match(/^(.*?)(\d+)$/)
  if (!match) return ''
  const [, prefix, numStr] = match
  const nextNum = Number(numStr) + 1
  return `${prefix}${String(nextNum).padStart(numStr.length, '0')}`
}

export function CandidatesPanel({
  examId,
  candidates,
  onChanged,
}: {
  examId: number
  candidates: ExamCandidate[]
  onChanged: () => void
}) {
  const { showToast } = useToast()
  const [studentId, setStudentId] = useState('')
  const [candidateNumber, setCandidateNumber] = useState(() => suggestNextCandidateNumber(candidates))
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const parsedStudentId = Number(studentId)
    if (!parsedStudentId || !candidateNumber.trim()) {
      setError('Enter a student ID and candidate number.')
      return
    }
    setIsSubmitting(true)
    try {
      await addCandidate(examId, { student: parsedStudentId, candidate_number: candidateNumber })
      setStudentId('')
      showToast('success', 'Candidate registered.')
      onChanged()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
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
                    <p className="text-xs text-slate-500 dark:text-slate-400">Student #{candidate.student}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleRemove(candidate.candidate_number)}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2">
          <Input
            label="Student ID"
            placeholder="e.g. 42"
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            className="w-32"
          />
          <Input
            label="Candidate number"
            placeholder="F2A-001"
            value={candidateNumber}
            onChange={(event) => setCandidateNumber(event.target.value)}
            className="w-40"
          />
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? 'Adding…' : 'Register candidate'}
          </Button>
        </form>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </CardBody>
    </Card>
  )
}
