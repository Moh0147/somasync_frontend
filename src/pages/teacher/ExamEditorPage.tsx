import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useToast } from '@/components/feedback/Toast'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { DescriptionList } from '@/components/ui/DescriptionList'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PencilIcon, TrashIcon } from '@/components/ui/icons'
import { CandidatesPanel } from '@/features/exams/CandidatesPanel'
import { ExamQuestionCard } from '@/features/exams/ExamQuestionCard'
import { ScriptsPanel } from '@/features/exams/ScriptsPanel'
import { listSubjects } from '@/services/academicsService'
import { getApiErrorMessage } from '@/services/apiError'
import {
  closeExam,
  createExamQuestion,
  deleteExam,
  downloadCoverPages,
  downloadMarkSheet,
  getExam,
  listCandidates,
  listExamQuestions,
  listScripts,
  publishExam,
  publishExamResults,
  startMarking,
  updateExam,
  updateSectionSettings,
  uploadMarkingScheme,
  uploadExamPaper,
} from '@/services/examsService'
import type { Subject } from '@/types/academics'
import type { Exam, ExamCandidate, ExamQuestion, ExamQuestionType, ExamScript } from '@/types/exam'

const questionTypeOptions: { value: ExamQuestionType; label: string }[] = [
  { value: 'OBJECTIVE', label: 'Objective' },
  { value: 'SUBJECTIVE', label: 'Subjective' },
]

export default function ExamEditorPage() {
  const { examId } = useParams()
  const id = Number(examId)
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [exam, setExam] = useState<Exam | null>(null)
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [candidates, setCandidates] = useState<ExamCandidate[]>([])
  const [scripts, setScripts] = useState<ExamScript[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [error, setError] = useState<string | null>(null)

  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', description: '', exam_date: '' })
  const [editError, setEditError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDownloadingMarkSheet, setIsDownloadingMarkSheet] = useState(false)
  const [isDownloadingCoverPages, setIsDownloadingCoverPages] = useState(false)
  const schemeInputRef = useRef<HTMLInputElement>(null)
  const paperInputRef = useRef<HTMLInputElement>(null)
  const headerSentinelRef = useRef<HTMLDivElement>(null)
  const [headerVisible, setHeaderVisible] = useState(true)
  const [isUploadingScheme, setIsUploadingScheme] = useState(false)
  const [isUploadingPaper, setIsUploadingPaper] = useState(false)

  const [sectionRuleForm, setSectionRuleForm] = useState({ section: '', required: '2' })
  const [isSavingSectionRule, setIsSavingSectionRule] = useState(false)

  const [questionForm, setQuestionForm] = useState({
    section: '',
    question_number: '',
    question_text: '',
    question_type: 'OBJECTIVE' as ExamQuestionType,
    max_marks: '5',
    correct_answer: '',
    is_compulsory: true,
  })
  const [questionError, setQuestionError] = useState<string | null>(null)
  const [isAddingQuestion, setIsAddingQuestion] = useState(false)

  async function load() {
    setError(null)
    try {
      const [examData, questionsData, candidatesData, scriptsData, subjectsData] = await Promise.all([
        getExam(id),
        listExamQuestions(id),
        listCandidates(id),
        listScripts(id),
        listSubjects(),
      ])
      setExam(examData)
      setQuestions(questionsData)
      setCandidates(candidatesData)
      setScripts(scriptsData)
      setSubjects(subjectsData)
      setEditForm({ title: examData.title, description: examData.description, exam_date: examData.exam_date ?? '' })
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  async function refreshCandidates() {
    setCandidates(await listCandidates(id))
  }

  async function refreshScripts() {
    setScripts(await listScripts(id))
  }

  useEffect(() => {
    load()
  }, [id])

  function subjectName(subjectId: number) {
    return subjects.find((subject) => subject.id === subjectId)?.name ?? `#${subjectId}`
  }

  useEffect(() => {
    const el = headerSentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setHeaderVisible(entry.isIntersecting),
      { threshold: 0 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [exam])

  async function refreshQuestions() {
    setQuestions(await listExamQuestions(id))
  }

  async function handleEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setEditError(null)
    setIsSaving(true)
    try {
      const updated = await updateExam(id, { ...editForm, exam_date: editForm.exam_date || null })
      setExam(updated)
      setEditOpen(false)
      showToast('success', 'Exam updated.')
    } catch (err) {
      setEditError(getApiErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  async function handlePublish() {
    setIsPublishing(true)
    try {
      const updated = await publishExam(id)
      setExam(updated)
      showToast('success', 'Exam published.')
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setIsPublishing(false)
    }
  }

  async function handleClose() {
    setIsPublishing(true)
    try {
      const updated = await closeExam(id)
      setExam(updated)
      showToast('success', 'Exam closed. Scripts can now be uploaded.')
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setIsPublishing(false)
    }
  }

  async function handleStartMarking() {
    setIsPublishing(true)
    try {
      const updated = await startMarking(id)
      setExam(updated)
      showToast('success', 'Marking started.')
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setIsPublishing(false)
    }
  }

  async function handlePublishResults() {
    setIsPublishing(true)
    try {
      const result = await publishExamResults(id)
      setExam(result.exam)
      showToast('success', `Published ${result.published_count} result(s).`)
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setIsPublishing(false)
    }
  }

  async function handleDownloadMarkSheet() {
    setIsDownloadingMarkSheet(true)
    try {
      await downloadMarkSheet(id, exam?.title)
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setIsDownloadingMarkSheet(false)
    }
  }

  async function handleDownloadCoverPages() {
    setIsDownloadingCoverPages(true)
    try {
      await downloadCoverPages(id, exam?.title)
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setIsDownloadingCoverPages(false)
    }
  }

  async function handlePaperUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = ''
    if (!file) return
    setIsUploadingPaper(true)
    try { await uploadExamPaper(id, file); showToast('success', 'Exam paper extracted. Review imported questions below.'); await refreshQuestions() }
    catch (err) { showToast('error', getApiErrorMessage(err)) }
    finally { setIsUploadingPaper(false) }
  }

  async function handleSchemeUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = ''
    if (!file) return
    setIsUploadingScheme(true)
    try { await uploadMarkingScheme(id, file); showToast('success', 'Marking scheme extracted. Review the generated points below.'); await refreshQuestions() }
    catch (err) { showToast('error', getApiErrorMessage(err)) }
    finally { setIsUploadingScheme(false) }
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await deleteExam(id)
      showToast('success', 'Exam deleted.')
      navigate('/teacher/exams', { replace: true })
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
      setIsDeleting(false)
    }
  }

  async function handleAddQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setQuestionError(null)
    if (!questionForm.question_number.trim() || !questionForm.question_text.trim()) {
      setQuestionError('Enter a question number and text.')
      return
    }
    if (questionForm.question_type === 'OBJECTIVE' && !questionForm.correct_answer.trim()) {
      setQuestionError('An objective question needs a correct answer.')
      return
    }
    setIsAddingQuestion(true)
    try {
      await createExamQuestion({
        exam: id,
        section: questionForm.section,
        question_number: questionForm.question_number,
        question_text: questionForm.question_text,
        question_type: questionForm.question_type,
        max_marks: Number(questionForm.max_marks) || 1,
        correct_answer: questionForm.question_type === 'OBJECTIVE' ? questionForm.correct_answer : undefined,
        is_compulsory: questionForm.is_compulsory,
        order: questions.length + 1,
      })
      setQuestionForm({
        section: '',
        question_number: '',
        question_text: '',
        question_type: 'OBJECTIVE',
        max_marks: '5',
        correct_answer: '',
        is_compulsory: true,
      })
      await refreshQuestions()
      showToast('success', 'Question added.')
    } catch (err) {
      setQuestionError(getApiErrorMessage(err))
    } finally {
      setIsAddingQuestion(false)
    }
  }

  async function handleSaveSectionRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!exam || !sectionRuleForm.section.trim()) return
    const requiredCount = Number(sectionRuleForm.required)
    if (!requiredCount || requiredCount < 1) return
    setIsSavingSectionRule(true)
    try {
      const updated = await updateSectionSettings(id, {
        ...exam.section_settings,
        [sectionRuleForm.section.trim()]: requiredCount,
      })
      setExam(updated)
      setSectionRuleForm({ section: '', required: '2' })
      showToast('success', `Rule saved: ${sectionRuleForm.section.trim()} — answer ${requiredCount}.`)
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setIsSavingSectionRule(false)
    }
  }

  async function handleRemoveSectionRule(sectionName: string) {
    if (!exam) return
    const updated_settings = { ...exam.section_settings }
    delete updated_settings[sectionName]
    try {
      const updated = await updateSectionSettings(id, updated_settings)
      setExam(updated)
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    }
  }

  if (error) return <ErrorState description={error} onRetry={load} />
  if (!exam) return <LoadingState message="Loading exam…" />

  const totalMarksCents = questions.reduce((sum, question) => sum + Math.round(Number(question.max_marks) * 100), 0)
  const totalMarks = totalMarksCents / 100
  const configuredTotal = exam.total_marks ?? totalMarks
  const distributionOk = totalMarksCents === Math.round(configuredTotal * 100)
  const isDraft = exam.status === 'DRAFT'
  const isPublished = exam.status === 'PUBLISHED'
  const isClosed = exam.status === 'CLOSED'
  const isMarking = exam.status === 'MARKING'
  const isResultsPublished = exam.status === 'RESULTS_PUBLISHED'

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={exam.title}
        description={subjectName(exam.subject)}
        actions={
          <>
            {isDraft && (
              <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
                <PencilIcon className="h-3.5 w-3.5" />
                Edit
              </Button>
            )}
            {isDraft && (
              <Button size="sm" disabled={isPublishing} onClick={handlePublish}>
                Publish
              </Button>
            )}
            {isPublished && (
              <Button size="sm" disabled={isPublishing} onClick={handleClose}>
                Close Exam
              </Button>
            )}
            {isClosed && (
              <Button size="sm" disabled={isPublishing} onClick={handleStartMarking}>
                Start Marking
              </Button>
            )}
            {(isMarking || isResultsPublished) && (
              <Link to="/teacher/results">
                <Button size="sm">Results Hub →</Button>
              </Link>
            )}
            {candidates.length > 0 && (isPublished || isClosed || isMarking || isResultsPublished || exam.status === 'FINALIZED' || exam.status === 'REVIEW') && (
              <Button variant="ghost" size="sm" disabled={isDownloadingCoverPages} onClick={handleDownloadCoverPages}>
                {isDownloadingCoverPages ? 'Generating…' : 'Cover Pages PDF'}
              </Button>
            )}
            {(isMarking || isResultsPublished || exam.status === 'FINALIZED' || exam.status === 'REVIEW') && (
              <Button variant="ghost" size="sm" disabled={isDownloadingMarkSheet} onClick={handleDownloadMarkSheet}>
                {isDownloadingMarkSheet ? 'Generating…' : 'Mark Sheet PDF'}
              </Button>
            )}
            {isDraft && (
              <Button variant="danger" size="sm" disabled={isDeleting} onClick={handleDelete}>
                <TrashIcon className="h-3.5 w-3.5" />
                Delete
              </Button>
            )}
          </>
        }
      />
      {}
      <div ref={headerSentinelRef} aria-hidden="true" className="h-px" />

      {(() => {
        const steps = ['Setup', 'Questions', 'Scheme', 'Publish', 'Marking', 'Results']
        const doneUpTo = isDraft ? 2 : isResultsPublished ? 5 : isMarking ? 4 : 3
        const nextIdx = Math.min(doneUpTo + 1, steps.length - 1)
        return (
          <>
            {}
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5 sm:hidden dark:border-slate-800 dark:bg-slate-900">
              <div className="flex gap-1">
                {steps.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i <= doneUpTo ? 'w-4 bg-blue-500' : 'w-1.5 bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                Step {doneUpTo + 1} of {steps.length} — {steps[doneUpTo]}
              </p>
              {doneUpTo < steps.length - 1 && (
                <p className="ml-auto text-xs text-slate-400 dark:text-slate-500">
                  Next: {steps[nextIdx]}
                </p>
              )}
            </div>
            {}
            <div className="hidden rounded-lg border border-slate-200 bg-white p-3 sm:block dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between text-xs font-medium">
                {steps.map((label, index) => (
                  <div
                    key={label}
                    className={`flex items-center gap-1.5 ${index <= doneUpTo ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px]">
                      {index + 1}
                    </span>
                    <span className="whitespace-nowrap">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )
      })()}

      <Card>
        <CardHeader className="flex flex-col gap-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Marking scheme &amp; distribution</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {!isDraft
                  ? 'Locked after publishing — create a new draft version to change it.'
                  : distributionOk
                    ? '✓ Distribution complete'
                    : `⚠ Questions total ${totalMarks} / ${configuredTotal} marks`}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2">
              <Button size="sm" variant="ghost" disabled={isUploadingPaper || !isDraft} onClick={() => paperInputRef.current?.click()}>
                {isUploadingPaper ? 'Extracting…' : 'Exam paper'}
              </Button>
              <input ref={paperInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={handlePaperUpload} />
              <Button size="sm" variant="secondary" disabled={isUploadingScheme || !isDraft} onClick={() => schemeInputRef.current?.click()}>
                {isUploadingScheme ? 'Extracting…' : isDraft ? 'Marking scheme' : 'Scheme locked'}
              </Button>
              <input ref={schemeInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={handleSchemeUpload} />
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-3 text-sm">
            {questions.map((q) => (
              <span key={q.id} className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-800">
                Q{q.question_number}: {Number(q.max_marks).toFixed(2)}
              </span>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Exam details</p>
          <StatusBadge status={isDraft ? 'pending' : 'available'} label={exam.status} />
        </CardHeader>
        <CardBody>
          <DescriptionList
            items={[
              { label: 'Academic year', value: String(exam.academic_year) },
              { label: 'Exam date', value: exam.exam_date ?? '—' },
              { label: 'Total marks', value: String(totalMarks) },
              { label: 'Description', value: exam.description || '—' },
            ]}
          />
        </CardBody>
      </Card>

      {}
      {questions.some((q) => q.section) && (
        <Card>
          <CardHeader>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Choice sections (optional answers)</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              For sections where students answer only some questions (e.g. Section C: answer 2 of 3), set the required count here. Unanswered questions in these sections will be scored 0 automatically — no error.
            </p>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            {Object.keys(exam.section_settings).length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">No choice sections configured. All sections are treated as compulsory.</p>
            )}
            {Object.entries(exam.section_settings).map(([section, required]) => {
              const total = questions.filter((q) => q.section === section).length
              return (
                <div key={section} className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/50">
                  <p className="text-sm text-slate-900 dark:text-slate-100">
                    <span className="font-medium">{section}</span>
                    <span className="ml-2 text-slate-500 dark:text-slate-400">— answer {required} of {total} question{total !== 1 ? 's' : ''}</span>
                  </p>
                  <Button size="sm" variant="ghost" onClick={() => handleRemoveSectionRule(section)}>
                    <TrashIcon className="h-3.5 w-3.5" />
                    Remove
                  </Button>
                </div>
              )
            })}
            <form onSubmit={handleSaveSectionRule} className="flex flex-wrap items-end gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
              <Select
                label="Section"
                value={sectionRuleForm.section}
                onChange={(e) => setSectionRuleForm({ ...sectionRuleForm, section: e.target.value })}
                className="w-40"
              >
                <option value="">Select section…</option>
                {[...new Set(questions.map((q) => q.section).filter(Boolean))].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
              <Input
                label="Questions to answer"
                type="number"
                min={1}
                value={sectionRuleForm.required}
                onChange={(e) => setSectionRuleForm({ ...sectionRuleForm, required: e.target.value })}
                className="w-32"
              />
              <Button type="submit" size="sm" disabled={isSavingSectionRule || !sectionRuleForm.section}>
                {isSavingSectionRule ? 'Saving…' : 'Save rule'}
              </Button>
            </form>
          </CardBody>
        </Card>
      )}

      {questions.length === 0 && isDraft && <EmptyState title="No questions imported yet." description="Upload an exam paper or marking scheme above. SomaSync will build the question structure for you." />}
      {questions
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((question) => (
          <ExamQuestionCard
            key={question.id}
            question={question}
            canEdit={isDraft || isMarking}
            onChanged={refreshQuestions}
            onDeleted={refreshQuestions}
          />
        ))}

      <CandidatesPanel
        examId={id}
        examClassLevel={exam.class_level}
        candidates={candidates}
        onChanged={refreshCandidates}
      />

      <ScriptsPanel
        examId={id}
        candidates={candidates}
        scripts={scripts}
        examStatus={exam.status}
        onChanged={refreshScripts}
      />

      {isDraft && (
        <Card>
          <CardHeader>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Manual question entry (optional)</p>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleAddQuestion} className="flex flex-col gap-4" noValidate>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Question number"
                  placeholder="1"
                  required
                  value={questionForm.question_number}
                  onChange={(event) => setQuestionForm({ ...questionForm, question_number: event.target.value })}
                />
                <Input
                  label="Section (optional)"
                  placeholder="Section A"
                  value={questionForm.section}
                  onChange={(event) => setQuestionForm({ ...questionForm, section: event.target.value })}
                />
              </div>
              <Input
                label="Question text"
                required
                value={questionForm.question_text}
                onChange={(event) => setQuestionForm({ ...questionForm, question_text: event.target.value })}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select
                  label="Question type"
                  value={questionForm.question_type}
                  onChange={(event) =>
                    setQuestionForm({ ...questionForm, question_type: event.target.value as ExamQuestionType })
                  }
                >
                  {questionTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                <Input
                  label="Maximum marks"
                  type="number"
                  min={1}
                  value={questionForm.max_marks}
                  onChange={(event) => setQuestionForm({ ...questionForm, max_marks: event.target.value })}
                />
              </div>
              {questionForm.question_type === 'OBJECTIVE' && (
                <Input
                  label="Correct answer"
                  required
                  helperText="Used for deterministic marking once scripts are uploaded."
                  value={questionForm.correct_answer}
                  onChange={(event) => setQuestionForm({ ...questionForm, correct_answer: event.target.value })}
                />
              )}
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={questionForm.is_compulsory}
                  onChange={(event) => setQuestionForm({ ...questionForm, is_compulsory: event.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Required (uncheck for choice questions, e.g. "answer 2 of 3")
              </label>
              {questionError && (
                <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                  {questionError}
                </p>
              )}
              <Button type="submit" disabled={isAddingQuestion} className="self-start">
                {isAddingQuestion ? 'Adding…' : 'Add question'}
              </Button>
            </form>
          </CardBody>
        </Card>
      )}

      {}
      {!headerVisible && (isDraft || isPublished || isClosed || isMarking || isResultsPublished) && (
        <div className="sticky bottom-4 z-20 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-lg shadow-slate-900/10 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {isDraft && 'Draft — not visible to students yet'}
                {isPublished && 'Live — students can see and sit the exam'}
                {isClosed && 'Closed — ready to begin marking'}
                {isMarking && 'Marking in progress'}
                {isResultsPublished && 'Results published to students'}
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {isDraft && 'Publish when ready to share with students'}
                {isPublished && 'Close exam once all students have finished'}
                {isClosed && 'Start marking to begin reviewing scripts'}
                {isMarking && 'Go to Results Hub to publish when all scripts are reviewed'}
                {isResultsPublished && 'Go to Results Hub to re-publish updated results'}
              </p>
            </div>
            <div className="shrink-0">
              {isDraft && (
                <Button size="sm" disabled={isPublishing} onClick={handlePublish}>
                  {isPublishing ? 'Publishing…' : 'Publish →'}
                </Button>
              )}
              {isPublished && (
                <Button size="sm" disabled={isPublishing} onClick={handleClose}>
                  {isPublishing ? 'Closing…' : 'Close Exam →'}
                </Button>
              )}
              {isClosed && (
                <Button size="sm" disabled={isPublishing} onClick={handleStartMarking}>
                  {isPublishing ? 'Starting…' : 'Start Marking →'}
                </Button>
              )}
              {(isMarking || isResultsPublished) && (
                <Link to="/teacher/results">
                  <Button size="sm">Results Hub →</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit exam">
        <form onSubmit={handleEdit} className="flex flex-col gap-4" noValidate>
          <Input
            label="Title"
            required
            value={editForm.title}
            onChange={(event) => setEditForm({ ...editForm, title: event.target.value })}
          />
          <Input
            label="Exam date"
            type="date"
            value={editForm.exam_date}
            onChange={(event) => setEditForm({ ...editForm, exam_date: event.target.value })}
          />
          <Input
            label="Description"
            value={editForm.description}
            onChange={(event) => setEditForm({ ...editForm, description: event.target.value })}
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
    </div>
  )
}
