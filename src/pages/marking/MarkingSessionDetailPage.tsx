import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useToast } from '@/components/feedback/Toast'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { ProgressBar } from '@/components/ui/ProgressBar'
import type { StatusBadgeStatus } from '@/components/ui/StatusBadge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Table } from '@/components/ui/Table'
import { useAuth } from '@/features/auth/AuthContext'
import { CameraScriptScanner } from '@/features/exams/CameraScriptScanner'
import { UsersIcon } from '@/components/ui/icons'
import { getApiErrorMessage } from '@/services/apiError'
import { getExam, listCandidates, uploadScript } from '@/services/examsService'
import { finalizeScript, getSessionScripts } from '@/services/markingService'
import type { Exam, ExamCandidate, ExamScript, ExamScriptStatus } from '@/types/exam'

const STATUS_BADGE: Record<ExamScriptStatus, StatusBadgeStatus> = {
  UPLOADED: 'pending',
  PROCESSING: 'syncing',
  MARKED: 'available',
  TEACHER_REVIEW: 'pending',
  FINALIZED: 'completed',
  PUBLISHED: 'completed',
  FAILED: 'failed',
}

const STATUS_LABEL: Record<ExamScriptStatus, string> = {
  UPLOADED: 'Uploaded',
  PROCESSING: 'Extracting',
  MARKED: 'Marked',
  TEACHER_REVIEW: 'Awaiting review',
  FINALIZED: 'Finalized',
  PUBLISHED: 'Published',
  FAILED: 'Failed',
}

export default function MarkingSessionDetailPage() {
  const { examId } = useParams()
  const id = Number(examId)
  const { user } = useAuth()
  const { showToast } = useToast()

  const activeRole = user?.active_role ?? user?.role
  const isManager = activeRole === 'EXAM_MARKING_MANAGER'
  const isExaminer = activeRole === 'EXAMINER'

  const [exam, setExam] = useState<Exam | null>(null)
  const [scripts, setScripts] = useState<ExamScript[] | null>(null)
  const [candidates, setCandidates] = useState<ExamCandidate[]>([])
  const [error, setError] = useState<string | null>(null)
  const [finalizing, setFinalizing] = useState<number | null>(null)
  const [showScanner, setShowScanner] = useState(false)

  // Upload form state (EXAMINER)
  const [candidateNumber, setCandidateNumber] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  async function load() {
    setError(null)
    try {
      const [examData, scriptsData, candidatesData] = await Promise.all([
        getExam(id),
        getSessionScripts(id),
        listCandidates(id),
      ])
      setExam(examData)
      setScripts(scriptsData)
      setCandidates(candidatesData)
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => { load() }, [id])

  async function handleFinalize(scriptId: number) {
    setFinalizing(scriptId)
    try {
      const updated = await finalizeScript(scriptId)
      setScripts((prev) => prev?.map((s) => s.id === scriptId ? updated : s) ?? null)
      showToast('success', 'Script finalized.')
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setFinalizing(null)
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    setUploadError(null)
    if (!candidateNumber.trim()) { setUploadError('Enter candidate number.'); return }
    if (!uploadFile) { setUploadError('Select a PDF file.'); return }
    setIsUploading(true)
    try {
      await uploadScript(id, candidateNumber.trim(), uploadFile)
      showToast('success', 'Script uploaded.')
      setCandidateNumber('')
      setUploadFile(null)
      const updated = await getSessionScripts(id)
      setScripts(updated)
    } catch (err) {
      setUploadError(getApiErrorMessage(err))
    } finally {
      setIsUploading(false)
    }
  }

  if (error) return <ErrorState description={error} onRetry={load} />
  if (!exam || !scripts) return <LoadingState message="Loading session…" />

  const finalized = scripts.filter((s) => s.status === 'FINALIZED' || s.status === 'PUBLISHED').length
  const pct = scripts.length > 0 ? Math.round((finalized / scripts.length) * 100) : 0

  const scriptColumns = [
    {
      key: 'candidate',
      header: 'Candidate',
      render: (s: ExamScript) => (
        <Link
          to={`/marking/scripts/${s.id}`}
          className="font-mono text-sm font-medium text-slate-900 hover:text-blue-600 dark:text-slate-100 dark:hover:text-blue-400"
        >
          {s.candidate_number || `#${s.candidate}`}
        </Link>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (s: ExamScript) => (
        <StatusBadge status={STATUS_BADGE[s.status]} label={STATUS_LABEL[s.status]} />
      ),
    },
    {
      key: 'version',
      header: 'Version',
      render: (s: ExamScript) => <span className="text-sm text-slate-500 dark:text-slate-400">v{s.version}</span>,
    },
    {
      key: 'uploaded',
      header: 'Uploaded',
      render: (s: ExamScript) => (
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {new Date(s.uploaded_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (s: ExamScript) => {
        if (s.status === 'FINALIZED' || s.status === 'PUBLISHED') return null
        if (s.status === 'TEACHER_REVIEW' && isManager) {
          return (
            <Button
              size="sm"
              variant="primary"
              disabled={finalizing === s.id}
              onClick={() => handleFinalize(s.id)}
            >
              {finalizing === s.id ? 'Finalizing…' : 'Finalize'}
            </Button>
          )
        }
        return null
      },
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={exam.title}
        description={`${scripts.length} scripts · ${exam.status}`}
      />

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Progress</span>
          <span>{finalized}/{scripts.length} finalized</span>
        </div>
        <ProgressBar value={pct} />
      </div>

      {isManager && (
        <Card>
          <CardBody>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <UsersIcon className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Usimamizi wa Wachunguzi</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Assign au ondoa role ya Examiner kwa walimu wako
                  </p>
                </div>
              </div>
              <Link to="/marking/examiners">
                <Button size="sm" variant="secondary">Wachunguzi →</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      )}

      {isExaminer && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Upload script</p>
              {candidates.length > 0 && (
                <Button size="sm" variant="secondary" onClick={() => setShowScanner(true)}>
                  📷 Scan na kamera
                </Button>
              )}
            </div>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleUpload} className="flex flex-wrap items-end gap-3">
              <Input
                label="Candidate number"
                placeholder="e.g. F4A-001"
                value={candidateNumber}
                onChange={(e) => setCandidateNumber(e.target.value)}
                className="w-44"
              />
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">PDF file</label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="text-sm text-slate-600 dark:text-slate-400"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <Button type="submit" size="sm" disabled={isUploading}>
                {isUploading ? 'Uploading…' : 'Upload'}
              </Button>
            </form>
            {uploadError && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{uploadError}</p>
            )}
          </CardBody>
        </Card>
      )}

      {showScanner && (
        <CameraScriptScanner
          examId={id}
          candidates={candidates}
          onDone={async () => {
            setShowScanner(false)
            const updated = await getSessionScripts(id)
            setScripts(updated)
          }}
        />
      )}

      <Card>
        <CardHeader className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Scripts</p>
          <div className="flex gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-900 dark:text-slate-100">{scripts.length}</span> total
          </div>
        </CardHeader>
        <CardBody>
          {scripts.length === 0 ? (
            <EmptyState title="No scripts uploaded yet." />
          ) : (
            <Table
              columns={scriptColumns}
              data={scripts}
              getRowKey={(s) => String(s.id)}
            />
          )}
        </CardBody>
      </Card>
    </div>
  )
}
