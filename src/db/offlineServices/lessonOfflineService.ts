import {
  deleteContentBlock,
  listBlocksForSection,
  upsertContentBlock,
} from '@/db/repositories/contentBlocksRepository'
import {
  deleteSection,
  getSectionByServerId,
  getSectionById,
  listSectionsForLesson,
  upsertSection,
} from '@/db/repositories/lessonSectionsRepository'
import { deleteLesson, getLessonByServerId, getLessonById, upsertLesson } from '@/db/repositories/lessonsRepository'
import type { OfflineContentBlock, OfflineLesson, OfflineLessonSection } from '@/types/offline'

export async function saveLesson(lesson: OfflineLesson) {
  return upsertLesson(lesson)
}

export async function getLesson(id: number) {
  return getLessonById(id)
}

export async function getLessonByServer(serverId: number) {
  return getLessonByServerId(serverId)
}

export async function removeLesson(id: number) {
  return deleteLesson(id)
}

export async function saveSection(section: OfflineLessonSection) {
  return upsertSection(section)
}

export async function getSection(id: number) {
  return getSectionById(id)
}

export async function getSectionByServer(serverId: number) {
  return getSectionByServerId(serverId)
}

export async function getLessonSections(lessonId: number) {
  return listSectionsForLesson(lessonId)
}

export async function removeSection(id: number) {
  return deleteSection(id)
}

export async function saveContentBlock(block: OfflineContentBlock) {
  return upsertContentBlock(block)
}

export async function getSectionContentBlocks(sectionId: number) {
  return listBlocksForSection(sectionId)
}

export async function removeContentBlock(id: number) {
  return deleteContentBlock(id)
}
