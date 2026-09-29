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
  canUpload,
  onChanged,
}: {
  examId: number
  candidates: ExamCandidate[]
  scripts: ExamScript[]
  canUpload: boolean
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
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Scripts</p>
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

        {scripts.length === 0 && <EmptyState title="No scripts uploaded yet." />}
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

        {canUpload ? (
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
          <p className="text-sm text-slate-500 dark:text-slate-400">Close the exam to start uploading scripts.</p>
        )}
      </CardBody>
    </Card>
  )
}
