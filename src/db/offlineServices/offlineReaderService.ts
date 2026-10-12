import { getAsset } from '@/db/repositories/assetsRepository'
import { listBlocksForSection } from '@/db/repositories/contentBlocksRepository'
import { getLessonByServerId } from '@/db/repositories/lessonsRepository'
import {
  getSectionByServerId,
  listSectionsForLesson,
} from '@/db/repositories/lessonSectionsRepository'
import { getSectionProgress } from '@/db/repositories/progressRepository'
import { listQuestionsForQuiz } from '@/db/repositories/questionsRepository'
import { addAttempt, saveAnswer } from '@/db/repositories/quizAttemptsRepository'
import { getQuizForSection } from '@/db/repositories/sectionQuizzesRepository'
import { addToQueue } from '@/db/repositories/syncQueueRepository'
import type { LessonStructure, SectionContentResponse, SectionStatus } from '@/types/lesson'
import type { SafeQuestion } from '@/types/quiz'

export async function getOfflineLessonStructure(
  lessonServerId: number,
  studentId: number,
): Promise<LessonStructure | null> {
  const lesson = await getLessonByServerId(lessonServerId)
  if (!lesson) return null

  const sections = await listSectionsForLesson(lesson.id!)
  const sorted = sections.slice().sort((a, b) => a.order - b.order)

  const rows = await Promise.all(
    sorted.map(async (section, index) => {
      const progress = await getSectionProgress(studentId, section.id!)
      const status: SectionStatus =
        progress?.status === 'IN_PROGRESS'
          ? 'AVAILABLE'
          : (progress?.status ?? (index === 0 ? 'AVAILABLE' : 'LOCKED'))
      const quiz = await getQuizForSection(section.id!)
      return {
        id: section.serverId,
        title: section.title,
        order: section.order,
        mini_quiz_id: section.miniQuizId ?? null,
        status,
        best_score: progress?.bestScore ?? null,
        attempts: progress?.attempts ?? 0,
        has_mini_quiz: Boolean(quiz),
      }
    }),
  )

  return { lesson_id: lesson.serverId, title: lesson.title, sections: rows }
}

export async function getOfflineSectionContent(sectionServerId: number): Promise<SectionContentResponse | null> {
  const section = await getSectionByServerId(sectionServerId)
  if (!section) return null

  const blocks = await listBlocksForSection(section.id!)
  const contentBlocks = await Promise.all(
    blocks
      .slice()
      .sort((a, b) => a.order - b.order)
      .map(async (block) => {
        let imageReference: string | null = null
        if (block.localAssetKey) {
          const asset = await getAsset(block.localAssetKey)
          if (asset) imageReference = URL.createObjectURL(asset.blob)
        }
        return {
          id: block.serverId,
          block_type: block.type,
          content: block.content,
          image: null,
          image_reference: imageReference,
          order: block.order,
        }
      }),
  )

  const quiz = await getQuizForSection(section.id!)
  if (!quiz) {
    return { content_blocks: contentBlocks, mini_quiz: null }
  }

  const questions = await listQuestionsForQuiz(quiz.id!)
  const safeQuestions: SafeQuestion[] = questions
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((question) => ({
      id: question.serverId,
      question_type: question.type,
      text: question.questionText,
      marks: 1,
      order: question.order,
      options: question.options.map((option) => ({ id: option.id, text: option.text, order: option.order })),
      pairs: (question.pairs ?? []).map((pair) => ({ id: pair.id, left_text: pair.leftText, order: pair.order })),
      right_options: question.rightOptions ?? [],
    }))

  return {
    content_blocks: contentBlocks,
    mini_quiz: { passing_score: quiz.passPercentage, questions: safeQuestions },
  }
}

export async function queueOfflineSectionQuizSubmission(
  sectionServerId: number,
  studentId: number,
  answers: { question: number; selected_option?: number; matching_response?: Record<string, string> }[],
) {
  const attemptLocalId = await addAttempt({
    quizId: sectionServerId,
    studentId,
    score: null,
    percentage: null,
    passed: null,
    startedAt: new Date().toISOString(),
    syncStatus: 'PENDING',
  })

  for (const answer of answers) {
    await saveAnswer({
      attemptId: attemptLocalId,
      questionId: answer.question,
      answer: { selected_option: answer.selected_option, matching_response: answer.matching_response },
    })
  }

  await addToQueue({
    entityType: 'sectionQuizAttempt',
    entityId: attemptLocalId,
    operation: 'CREATE',
    payload: { sectionServerId, answers },
    status: 'PENDING',
    retryCount: 0,
    createdAt: new Date().toISOString(),
  })

  return attemptLocalId
}
