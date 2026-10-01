import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { useToast } from '@/components/feedback/Toast'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Select } from '@/components/ui/Select'
import type { StatusBadgeStatus } from '@/components/ui/StatusBadge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getApiErrorMessage } from '@/services/apiError'
import { resolveMediaUrl } from '@/services/mediaUrl'
import { uploadScript } from '@/services/examsService'
import { formatBytes } from '@/utils/formatBytes'
import type { ExamCandidate, ExamScript, ExamScriptStatus } from '@/types/exam'

const scriptStatusMap: Record<ExamScriptStatus, StatusBadgeStatus> = {
  UPLOADED: 'pending',
  PROCESSING: 'syncing',
  MARKED: 'available',
  TEACHER_REVIEW: 'pending',
  FINALIZED: 'completed',
  PUBLISHED: 'completed',
  FAILED: 'failed',
}

const scriptStatusLabel: Record<ExamScriptStatus, string> = {
  UPLOADED: 'Uploaded',
  PROCESSING: 'Processing',
  MARKED: 'AI-marked',
  TEACHER_REVIEW: 'Awaiting review',
  FINALIZED: 'Finalized',
  PUBLISHED: 'Published',
  FAILED: 'Failed',
}

export function ScriptsPanel({
  examId,
  candidates,
  scripts,
  examStatus,
  onChanged,
}: {
  examId: number
  candidates: ExamCandidate[]
  scripts: ExamScript[]
  examStatus: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'MARKING' | 'REVIEW' | 'FINALIZED' | 'RESULTS_PUBLISHED'
  onChanged: () => void
}) {
  const { showToast } = useToast()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [candidateNumber, setCandidateNumber] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  function candidateLabel(candidateId: number) {
    return candidates.find((candidate) => candidate.id === candidateId)?.candidate_number ?? `#${candidateId}`
  }

  const markedCount = scripts.filter((s) => s.status === 'MARKED' || s.status === 'TEACHER_REVIEW' || s.status === 'FINALIZED' || s.status === 'PUBLISHED').length
  const awaitingReviewCount = scripts.filter((s) => s.status === 'TEACHER_REVIEW').length
  const finalizedCount = scripts.filter((s) => s.status === 'FINALIZED' || s.status === 'PUBLISHED').length
  const progressPercentage = scripts.length > 0 ? Math.round((finalizedCount / scripts.length) * 100) : 0
  const canUpload = examStatus === 'CLOSED'

  async function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !candidateNumber) return

    setIsUploading(true)
    try {
      await uploadScript(examId, candidateNumber, file)
      showToast('success', 'Script uploaded.')
      onChanged()
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Upload student scripts</p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {candidates.length} registered {candidates.length === 1 ? 'candidate' : 'candidates'} · {scripts.length} {scripts.length === 1 ? 'script' : 'scripts'} uploaded
          </p>
        </div>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        {scripts.length > 0 && (
          <div className="flex flex-col gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
            <div className="flex items-center justify-between text-sm">
              <p className="font-medium text-slate-700 dark:text-slate-300">Marking progress</p>
              <p className="text-slate-500 dark:text-slate-400">{finalizedCount} of {scripts.length} finalized</p>
            </div>
            <ProgressBar value={progressPercentage} showPercentage={false} />
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span>{scripts.length} scripts</span>
              <span>{markedCount} AI-marked</span>
              <span>{awaitingReviewCount} awaiting your review</span>
            </div>
          </div>
        )}

        {scripts.length === 0 && <EmptyState title="No scripts uploaded yet." description="Once the exam is closed, choose each candidate and upload their scanned answer script (PDF or image)." />}
        {scripts.length > 0 && (
          <ul className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
            {scripts.map((script) => (
              <li key={script.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 dark:text-slate-100">{candidateLabel(script.candidate)}</p>
                  <a
                    href={resolveMediaUrl(script.file_reference)}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-xs text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {script.file_name}
                  </a>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatBytes(script.file_size)} · v{script.version}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={scriptStatusMap[script.status]} label={scriptStatusLabel[script.status]} />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/teacher/exams/${examId}/scripts/${script.id}`)}
                  >
                    Review
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {candidates.length === 0 ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            Register students as candidates first. Their generated candidate numbers will be used to match each script.
          </p>
        ) : canUpload ? (
          <div className="flex flex-wrap items-end gap-2">
            <Select
              label="Candidate"
              value={candidateNumber}
              onChange={(event) => setCandidateNumber(event.target.value)}
              className="w-48"
            >
              <option value="" disabled>
                Select a candidate
              </option>
              {candidates.map((candidate) => (
                <option key={candidate.id} value={candidate.candidate_number}>
                  {candidate.candidate_number}
                </option>
              ))}
            </Select>
            <Button
              size="sm"
              disabled={!candidateNumber || isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? 'Uploading…' : 'Upload script'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              onChange={handleFileSelected}
            />
          </div>
        ) : (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">
            <p className="font-medium">Next: publish, then close the exam</p>
            <p className="mt-0.5 text-xs text-blue-700 dark:text-blue-300">
              {examStatus === 'DRAFT'
                ? 'Use Publish at the top of this page. After publishing, choose Close Exam to enable script uploads.'
                : 'Use Close Exam at the top of this page. Script uploads become available once the exam is closed.'}
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
