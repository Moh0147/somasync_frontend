import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'

import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Select } from '@/components/ui/Select'
import type { StatusBadgeStatus } from '@/components/ui/StatusBadge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getLessonByServerId } from '@/db/repositories/lessonsRepository'
import { getOfflineLessonStructure, getOfflineSectionContent, queueOfflineSectionQuizSubmission } from '@/db/offlineServices/offlineReaderService'
import { AIExplanationCard } from '@/features/ai/AIExplanationCard'
import { useAuth } from '@/features/auth/AuthContext'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { getApiErrorMessage } from '@/services/apiError'
import { resolveMediaUrl } from '@/services/mediaUrl'
import { getLesson, getLessonStructure, getSectionContent, submitSectionQuiz } from '@/services/lessonsService'
import { listMyAttempts } from '@/services/quizzesService'
import type { Lesson, LessonStructure, SectionContentBlock, SectionContentResponse } from '@/types/lesson'
import type { SectionQuizAnswerInput, SectionQuizResult } from '@/types/quiz'

function ContentBlockView({ block }: { block: SectionContentBlock }) {
  switch (block.block_type) {
    case 'HEADING':
      return <h3 className="text-lg font-semibold text-slate-900">{block.content}</h3>
    case 'KEY_POINT':
      return (
        <div className="rounded-md border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {block.content}
        </div>
      )
    case 'IMAGE':
      return block.image_reference ? (
        <img src={resolveMediaUrl(block.image_reference)} alt="" className="rounded-md border border-slate-200" />
      ) : null
    case 'TEXT':
    default:
      return <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-700">{block.content}</p>
  }
}

export default function LessonReaderPage() {
  const { lessonId, sectionId } = useParams()
  const lessonIdNum = Number(lessonId)
  const sectionIdNum = sectionId ? Number(sectionId) : null
  const navigate = useNavigate()
  const { user } = useAuth()
  const isOnline = useOnlineStatus()

  const [structure, setStructure] = useState<LessonStructure | null>(null)
  const [flatLesson, setFlatLesson] = useState<Pick<Lesson, 'title' | 'content' | 'description'> | null>(null)
  const [content, setContent] = useState<SectionContentResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notDownloaded, setNotDownloaded] = useState(false)

  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({})
  const [matchingResponses, setMatchingResponses] = useState<Record<number, Record<string, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<SectionQuizResult | null>(null)
  const [wrongAnswerIds, setWrongAnswerIds] = useState<Record<number, number>>({})
  const [queuedOffline, setQueuedOffline] = useState(false)

  async function loadStructure() {
    setError(null)
    setNotDownloaded(false)
    setStructure(null)
    try {
      if (isOnline) {
        const structureData = await getLessonStructure(lessonIdNum)
        setStructure(structureData)
        if (structureData.sections.length === 0) {
          setFlatLesson(await getLesson(lessonIdNum))
        }
      } else if (user) {
        const structureData = await getOfflineLessonStructure(lessonIdNum, user.id)
        if (!structureData) {
          setNotDownloaded(true)
          return
        }
        setStructure(structureData)
        if (structureData.sections.length === 0) {
          const localLesson = await getLessonByServerId(lessonIdNum)
          if (localLesson) {
            setFlatLesson({ title: localLesson.title, content: localLesson.content, description: localLesson.description })
          }
        }
      }
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    loadStructure()
  }, [lessonIdNum, isOnline])

  async function loadContent() {
    if (!sectionIdNum) return
    setError(null)
    setContent(null)
    setResult(null)
    setQueuedOffline(false)
    setSelectedOptions({})
    setMatchingResponses({})
    try {
      const data = isOnline ? await getSectionContent(sectionIdNum) : await getOfflineSectionContent(sectionIdNum)
      setContent(data)
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    loadContent()
  }, [sectionIdNum, isOnline])

  if (notDownloaded) {
    return (
      <Card>
        <CardBody className="flex flex-col items-center gap-2 py-10 text-center">
          <p className="text-sm font-medium text-slate-700">This lesson hasn't been downloaded.</p>
          <p className="text-sm text-slate-500">Go back online and download it from your dashboard to study it offline.</p>
        </CardBody>
      </Card>
    )
  }

  if (error) return <ErrorState description={error} onRetry={sectionIdNum ? loadContent : loadStructure} />
  if (!structure) return <LoadingState message="Loading lesson…" />

  // Flat lesson: no sections, just the lesson's own content/description.
  if (structure.sections.length === 0) {
    if (!flatLesson) return <LoadingState message="Loading lesson…" />
    return (
      <Card>
        <CardBody className="flex flex-col gap-3">
          <h1 className="text-xl font-semibold text-slate-900">{flatLesson.title}</h1>
          <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-700">
            {flatLesson.content || flatLesson.description || 'This lesson has no content yet.'}
          </p>
        </CardBody>
      </Card>
    )
  }

  const sortedSections = [...structure.sections].sort((a, b) => a.order - b.order)

  // No section chosen yet -- land on the first non-completed one, or the
  // last one if everything is already done.
  if (!sectionIdNum) {
    const target = sortedSections.find((section) => section.status !== 'COMPLETED') ?? sortedSections[sortedSections.length - 1]
    return <Navigate to={`/student/lessons/${lessonIdNum}/sections/${target.id}`} replace />
  }

  const sectionIndex = sortedSections.findIndex((section) => section.id === sectionIdNum)
  const currentSection = sortedSections[sectionIndex]

  if (!currentSection) {
    return <ErrorState title="Section not found." />
  }

  // The backend has no IN_PROGRESS status (only LOCKED/AVAILABLE/COMPLETED) --
  // this is a purely client-side signal for "started answering, not submitted".
  const hasStartedAnswering = Object.keys(selectedOptions).length > 0 || Object.keys(matchingResponses).length > 0
  const completedCount = sortedSections.filter((section) => section.status === 'COMPLETED').length
  const progressPercentage = Math.round((completedCount / sortedSections.length) * 100)

  function statusFor(section: (typeof sortedSections)[number]): StatusBadgeStatus {
    if (section.status === 'COMPLETED') return 'completed'
    if (section.status === 'LOCKED') return 'locked'
    if (section.id === sectionIdNum && hasStartedAnswering && !result) return 'in-progress'
    return 'available'
  }

  const sectionNav = (
    <div className="flex flex-col gap-2">
      <ProgressBar value={progressPercentage} label="Lesson progress" />
      <div className="flex flex-wrap gap-2">
        {sortedSections.map((section, index) => (
          <button
            key={section.id}
            type="button"
            disabled={section.status === 'LOCKED'}
            onClick={() => navigate(`/student/lessons/${lessonIdNum}/sections/${section.id}`)}
            className={`flex flex-col items-center gap-1 rounded-md border px-3 py-2 disabled:cursor-not-allowed disabled:opacity-60 ${
              section.id === sectionIdNum ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <span className="text-xs text-slate-500">Section {index + 1}</span>
            <StatusBadge status={statusFor(section)} />
          </button>
        ))}
      </div>
    </div>
  )

  if (currentSection.status === 'LOCKED') {
    const firstAvailable = sortedSections.find((section) => section.status !== 'LOCKED')
    return (
      <div className="flex flex-col gap-4">
        {sectionNav}
        <Card>
          <CardBody className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm font-medium text-slate-700">This section is locked.</p>
            <p className="text-sm text-slate-500">Complete the previous section's Quick Check to unlock it.</p>
            {firstAvailable && (
              <Button size="sm" onClick={() => navigate(`/student/lessons/${lessonIdNum}/sections/${firstAvailable.id}`)}>
                Go to available section
              </Button>
            )}
          </CardBody>
        </Card>
      </div>
    )
  }

  if (!content) return <LoadingState message="Loading section…" />

  const miniQuiz = content.mini_quiz
  const allAnswered =
    miniQuiz?.questions.every((question) =>
      question.question_type === 'MATCHING'
        ? question.pairs.every((pair) => Boolean(matchingResponses[question.id]?.[String(pair.id)]))
        : selectedOptions[question.id] !== undefined,
    ) ?? false

  async function handleSubmit() {
    if (!miniQuiz) return
    setIsSubmitting(true)
    try {
      const answers: SectionQuizAnswerInput[] = miniQuiz.questions.map((question) =>
        question.question_type === 'MATCHING'
          ? { question: question.id, matching_response: matchingResponses[question.id] ?? {} }
          : { question: question.id, selected_option: selectedOptions[question.id] },
      )
      if (isOnline) {
        const apiResult = await submitSectionQuiz(sectionIdNum!, answers)
        setResult(apiResult)
        if (!apiResult.passed) {
          // submit-quiz's response doesn't include each StudentQuizAnswer's
          // own id (needed for "Explain My Mistake"), so resolve it via the
          // attempt we just created -- it's always the most recent one for
          // this student (StudentQuizAttempt's default ordering is
          // -started_at), since section mini-quiz attempts are real rows in
          // the same table normal quiz attempts use.
          try {
            const attempts = await listMyAttempts()
            const latest = attempts[0]
            const map: Record<number, number> = {}
            for (const answer of latest?.answers ?? []) {
              if (answer.is_correct === false) map[answer.question] = answer.id
            }
            setWrongAnswerIds(map)
          } catch {
            // Best-effort -- Explain My Mistake just won't be offered for
            // this attempt if this lookup fails.
          }
        }
      } else if (user) {
        // No answer key ever reaches the device (see Phase 9/12 notes), so
        // an offline submission can only be recorded and queued -- never
        // marked pass/fail locally, and the section can't unlock until a
        // real online sync resolves it.
        await queueOfflineSectionQuizSubmission(sectionIdNum!, user.id, answers)
        setQueuedOffline(true)
      }
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleRetry() {
    setResult(null)
    setQueuedOffline(false)
    setWrongAnswerIds({})
    setSelectedOptions({})
    setMatchingResponses({})
  }

  function handleContinue() {
    if (result?.next_section_id) {
      navigate(`/student/lessons/${lessonIdNum}/sections/${result.next_section_id}`)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {sectionNav}

      <div>
        <p className="text-sm text-slate-500">
          {structure.title} · Section {sectionIndex + 1} of {sortedSections.length}
        </p>
        <h1 className="text-xl font-semibold text-slate-900">{currentSection.title}</h1>
      </div>

      <Card>
        <CardBody className="flex flex-col gap-4">
          {content.content_blocks
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((block) => (
              <ContentBlockView key={block.id} block={block} />
            ))}
        </CardBody>
      </Card>

      {miniQuiz && !result && !queuedOffline && (
        <Card>
          <CardBody className="flex flex-col gap-6">
            <div className="border-t border-slate-200 pt-4">
              <p className="text-sm font-semibold text-slate-900">Quick Check</p>
              <p className="text-xs text-slate-500">Pass mark: {miniQuiz.passing_score}%</p>
            </div>

            {miniQuiz.questions
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((question) => (
                <div key={question.id} className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-slate-900">{question.text}</p>
                  {question.question_type === 'MATCHING' ? (
                    <div className="flex flex-col gap-2">
                      {question.pairs.map((pair) => (
                        <div key={pair.id} className="flex items-center gap-3">
                          <span className="w-40 shrink-0 text-sm text-slate-700">{pair.left_text}</span>
                          <Select
                            value={matchingResponses[question.id]?.[String(pair.id)] ?? ''}
                            onChange={(event) =>
                              setMatchingResponses((current) => ({
                                ...current,
                                [question.id]: { ...current[question.id], [String(pair.id)]: event.target.value },
                              }))
                            }
                            className="max-w-xs"
                          >
                            <option value="" disabled>
                              Select a match
                            </option>
                            {question.right_options.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </Select>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {question.options.map((option) => (
                        <label key={option.id} className="flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            checked={selectedOptions[question.id] === option.id}
                            onChange={() => setSelectedOptions((current) => ({ ...current, [question.id]: option.id }))}
                            className="h-4 w-4 accent-blue-600"
                          />
                          {option.text}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}

            <Button disabled={!allAnswered || isSubmitting} onClick={handleSubmit} className="self-start">
              {isSubmitting ? 'Submitting…' : 'Submit Answer'}
            </Button>
          </CardBody>
        </Card>
      )}

      {!miniQuiz && (
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">This section doesn't have a Quick Check yet.</p>
          </CardBody>
        </Card>
      )}

      {queuedOffline && (
        <Card>
          <CardBody className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-teal-700">⚡ Saved offline</p>
            <p className="text-sm text-slate-600">
              You're offline. Your answers have been saved and will be marked once you're back online.
            </p>
          </CardBody>
        </Card>
      )}

      {result && (
        <Card>
          <CardBody className="flex flex-col gap-3">
            {result.passed ? (
              <>
                <p className="text-sm font-semibold text-green-700">
                  ✓ Passed — {result.score}% (needed {result.passing_score}%)
                </p>
                {result.next_section_id ? (
                  <Button size="sm" onClick={handleContinue}>
                    Continue to next section
                  </Button>
                ) : (
                  <p className="text-sm text-slate-600">You've completed this lesson.</p>
                )}
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-red-700">
                  ✗ Not quite — {result.score}% (needed {result.passing_score}%)
                </p>
                {result.wrong_answers.length > 0 && (
                  <ul className="flex flex-col gap-2">
                    {result.wrong_answers.map((wrong) => {
                      const question = miniQuiz?.questions.find((q) => q.id === wrong.question_id)
                      const yourAnswerText =
                        question?.question_type !== 'MATCHING'
                          ? question?.options.find((option) => option.id === selectedOptions[wrong.question_id])?.text
                          : undefined
                      return (
                        <li key={wrong.question_id}>
                          <AIExplanationCard
                            studentAnswerId={wrongAnswerIds[wrong.question_id] ?? null}
                            questionText={wrong.question_text}
                            yourAnswerText={yourAnswerText}
                            staticExplanation={wrong.explanation || undefined}
                          />
                        </li>
                      )
                    })}
                  </ul>
                )}
                <Button size="sm" onClick={handleRetry} className="self-start">
                  Try Again
                </Button>
              </>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  )
}
