import { deleteAsset, getAsset, saveAsset } from '@/db/repositories/assetsRepository'
import { deleteContentBlock, listBlocksForSection } from '@/db/repositories/contentBlocksRepository'
import { deleteLesson, getLessonByServerId } from '@/db/repositories/lessonsRepository'
import { deleteSection, listSectionsForLesson } from '@/db/repositories/lessonSectionsRepository'
import { deleteQuestion, listQuestionsForQuiz } from '@/db/repositories/questionsRepository'
import { deleteSectionQuiz, getQuizForSection } from '@/db/repositories/sectionQuizzesRepository'
import { getLesson, getLessonStructure, getSectionContent } from '@/services/lessonsService'
import { resolveMediaUrl } from '@/services/mediaUrl'
import type { OfflineContentBlockType } from '@/types/offline'
import { compressImageBlob } from '@/utils/imageCompression'

import { saveContentBlock, saveLesson, saveSection } from './lessonOfflineService'
import { saveQuestion, saveQuiz } from './quizOfflineService'

export async function isLessonDownloaded(lessonServerId: number) {
  return Boolean(await getLessonByServerId(lessonServerId))
}

export interface DownloadProgressUpdate {
  completed: number
  total: number
}

// Downloads everything currently accessible to this student for a lesson --
// content, images, and mini-quiz *questions* (never the answer key: there
// is no backend endpoint that legitimately gives a student one -- see
// Phase 9's finding). A LOCKED section's content is never revealed by the
// backend in the first place, so it's simply skipped here; re-downloading
// after unlocking more of the lesson picks up the rest.
export async function downloadLessonForOffline(
  lessonServerId: number,
  onProgress?: (update: DownloadProgressUpdate) => void,
) {
  const lesson = await getLesson(lessonServerId)
  const structure = await getLessonStructure(lessonServerId)

  const localLessonId = await saveLesson({
    serverId: lesson.id,
    title: lesson.title,
    subjectId: lesson.subject,
    formId: lesson.class_level,
    topicId: lesson.topic ?? undefined,
    description: lesson.description,
    content: lesson.content,
    version: 1,
    downloadedAt: new Date().toISOString(),
    updatedAt: lesson.updated_at,
  })

  const accessibleSections = structure.sections.filter((section) => section.status !== 'LOCKED')
  let completed = 0

  for (const sectionRow of accessibleSections) {
    const localSectionId = await saveSection({
      serverId: sectionRow.id,
      lessonId: localLessonId,
      title: sectionRow.title,
      order: sectionRow.order,
      version: 1,
    })

    const content = await getSectionContent(sectionRow.id)

    for (const block of content.content_blocks) {
      let localAssetKey: string | undefined
      if (block.block_type === 'IMAGE' && block.image_reference) {
        localAssetKey = `content-block-${block.id}`
        const response = await fetch(resolveMediaUrl(block.image_reference)!)
        const blob = await compressImageBlob(await response.blob())
        await saveAsset(localAssetKey, blob, blob.type)
      }
      await saveContentBlock({
        serverId: block.id,
        sectionId: localSectionId,
        type: block.block_type as OfflineContentBlockType,
        content: block.content,
        order: block.order,
        assetUrl: block.image_reference ?? undefined,
        localAssetKey,
      })
    }

    if (content.mini_quiz) {
      const localQuizId = await saveQuiz({
        serverId: sectionRow.id,
        sectionId: localSectionId,
        passPercentage: content.mini_quiz.passing_score,
      })
      for (const question of content.mini_quiz.questions) {
        await saveQuestion({
          serverId: question.id,
          quizId: localQuizId,
          type: question.question_type,
          questionText: question.text,
          options: question.question_type === 'MATCHING' ? [] : question.options,
          pairs:
            question.question_type === 'MATCHING'
              ? question.pairs.map((pair) => ({ id: pair.id, leftText: pair.left_text, order: pair.order }))
              : undefined,
          rightOptions: question.question_type === 'MATCHING' ? question.right_options : undefined,
          correctAnswer: null,
          order: question.order,
        })
      }
    }

    completed += 1
    onProgress?.({ completed, total: accessibleSections.length })
  }

  return localLessonId
}

export async function removeLessonOffline(localLessonId: number) {
  const sections = await listSectionsForLesson(localLessonId)
  for (const section of sections) {
    const blocks = await listBlocksForSection(section.id!)
    for (const block of blocks) {
      if (block.localAssetKey) await deleteAsset(block.localAssetKey)
    }
    const quiz = await getQuizForSection(section.id!)
    if (quiz) {
      const questions = await listQuestionsForQuiz(quiz.id!)
      for (const question of questions) {
        await deleteQuestion(question.id!)
      }
      await deleteSectionQuiz(quiz.id!)
    }
    for (const block of blocks) {
      await deleteContentBlock(block.id!)
    }
    await deleteSection(section.id!)
  }
  await deleteLesson(localLessonId)
}

export async function getLessonStorageBytes(localLessonId: number) {
  const sections = await listSectionsForLesson(localLessonId)
  let totalBytes = 0
  for (const section of sections) {
    const blocks = await listBlocksForSection(section.id!)
    for (const block of blocks) {
      totalBytes += new Blob([block.content]).size
      if (block.localAssetKey) {
        const asset = await getAsset(block.localAssetKey)
        if (asset) totalBytes += asset.blob.size
      }
    }
  }
  return totalBytes
}
