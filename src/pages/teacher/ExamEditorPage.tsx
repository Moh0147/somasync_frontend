import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

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
import { CandidatesPanel } from '@/features/exams/CandidatesPanel'
import { ExamQuestionCard } from '@/features/exams/ExamQuestionCard'
import { ScriptsPanel } from '@/features/exams/ScriptsPanel'
import { listSubjects } from '@/services/academicsService'
import { listClasses, listClassStudents } from '@/services/classesService'
import { getApiErrorMessage } from '@/services/apiError'
import {
  closeExam,
  createExamQuestion,
  deleteExam,
  getExam,
  listCandidates,
  listExamQuestions,
  listScripts,
  publishExam,
  publishExamResults,
  startMarking,
  updateExam,
  uploadMarkingScheme,
  uploadExamPaper,
} from '@/services/examsService'
import type { Subject } from '@/types/academics'
import type { AuthUser } from '@/types/auth'
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
  const [classStudents, setClassStudents] = useState<AuthUser[]>([])
  const [error, setError] = useState<string | null>(null)

  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', description: '', exam_date: '' })
  const [editError, setEditError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const schemeInputRef = useRef<HTMLInputElement>(null)
  const paperInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingScheme, setIsUploadingScheme] = useState(false)
  const [isUploadingPaper, setIsUploadingPaper] = useState(false)

  const [questionForm, setQuestionForm] = useState({
    section: '',
    question_number: '',
    question_text: '',
    question_type: 'OBJECTIVE' as ExamQuestionType,
    max_marks: '5',
    correct_answer: '',
  })
  const [questionError, setQuestionError] = useState<string | null>(null)
  const [isAddingQuestion, setIsAddingQuestion] = useState(false)

  async function load() {
    setError(null)
    try {
      const [examData, questionsData, candidatesData, scriptsData, subjectsData, classesData] = await Promise.all([
        getExam(id),
        listExamQuestions(id),
        listCandidates(id),
        listScripts(id),
        listSubjects(),
        listClasses(),
      ])
      setExam(examData)
      setQuestions(questionsData)
      setCandidates(candidatesData)
      setScripts(scriptsData)
      setSubjects(subjectsData)
      const matchingClass = classesData.find((schoolClass) => schoolClass.class_level === examData.class_level && schoolClass.academic_year === examData.academic_year)
      setClassStudents(matchingClass ? await listClassStudents(matchingClass.id) : [])
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
        order: questions.length + 1,
      })
      setQuestionForm({
        section: '',
        question_number: '',
        question_text: '',
        question_type: 'OBJECTIVE',
        max_marks: '5',
        correct_answer: '',
      })
      await refreshQuestions()
      showToast('success', 'Question added.')
    } catch (err) {
      setQuestionError(getApiErrorMessage(err))
    } finally {
      setIsAddingQuestion(false)
    }
  }

  if (error) return <ErrorState description={error} onRetry={load} />
  if (!exam) return <LoadingState message="Loading exam…" />

  const totalMarks = questions.reduce((sum, question) => sum + question.max_marks, 0)
  const configuredTotal = exam.total_marks ?? totalMarks
  const distributionOk = totalMarks === configuredTotal
  const isDraft = exam.status === 'DRAFT'
  const isPublished = exam.status === 'PUBLISHED'
  const isClosed = exam.status === 'CLOSED'
  const isMarking = exam.status === 'MARKING'

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={exam.title}
        description={subjectName(exam.subject)}
        actions={
          <>
            {isDraft && (
              <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
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
            {isMarking && (
              <Button size="sm" disabled={isPublishing} onClick={handlePublishResults}>
                Publish Results
              </Button>
            )}
            {isDraft && (
              <Button variant="danger" size="sm" disabled={isDeleting} onClick={handleDelete}>
                Delete
              </Button>
            )}
          </>
        }
      />

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex min-w-[720px] items-center justify-between text-xs font-medium">
          {['Exam Setup', 'Questions', 'Marking Scheme', 'Review & Publish', 'Marking', 'Results'].map((label, index) => (
            <div key={label} className={`flex items-center gap-2 ${index <= (isDraft ? 2 : isMarking ? 4 : 3) ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}><span className="flex h-7 w-7 items-center justify-center rounded-full border">{index + 1}</span>{label}</div>
          ))}
        </div>
      </div>

      <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Marking scheme & distribution</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{!isDraft ? 'Locked after publishing — create a new draft version to change it.' : distributionOk ? '✓ Distribution complete' : `⚠ Questions total ${totalMarks} / ${configuredTotal} marks`}</p>
            </div>
            <div className="flex flex-wrap gap-2"><Button size="sm" variant="ghost" disabled={isUploadingPaper || !isDraft} onClick={() => paperInputRef.current?.click()}>{isUploadingPaper ? 'Extracting…' : 'Upload exam paper'}</Button><input ref={paperInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={handlePaperUpload} /><Button size="sm" variant="secondary" disabled={isUploadingScheme || !isDraft} onClick={() => schemeInputRef.current?.click()}>{isUploadingScheme ? 'Extracting…' : isDraft ? 'Upload marking scheme' : 'Marking scheme locked'}</Button><input ref={schemeInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={handleSchemeUpload} /></div>
          </CardHeader>
          <CardBody>
            <div className="flex flex-wrap gap-3 text-sm">{questions.map(q => <span key={q.id} className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-800">Q{q.question_number}: {q.max_marks}</span>)}</div>
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

      {questions.length === 0 && isDraft && <EmptyState title="No questions imported yet." description="Upload an exam paper or marking scheme above. SomaSync will build the question structure for you." />}
      {questions
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((question) => (
          <ExamQuestionCard
            key={question.id}
            question={question}
            onChanged={refreshQuestions}
            onDeleted={refreshQuestions}
          />
        ))}

      <CandidatesPanel examId={id} candidates={candidates} students={classStudents} onChanged={refreshCandidates} />
      <ScriptsPanel
        examId={id}
        candidates={candidates}
        scripts={scripts}
        canUpload={isClosed}
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
