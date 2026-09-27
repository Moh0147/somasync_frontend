import Dexie, { type EntityTable } from 'dexie'

import type {
  OfflineAsset,
  OfflineContentBlock,
  OfflineLesson,
  OfflineLessonProgress,
  OfflineLessonSection,
  OfflineQuestion,
  OfflineQuizAnswer,
  OfflineQuizAttempt,
  OfflineSectionProgress,
  OfflineSectionQuiz,
  SyncQueueEntry,
} from '@/types/offline'

interface MetadataRecord {
  key: string
  value: unknown
}

class SomaSyncDB extends Dexie {
  metadata!: EntityTable<MetadataRecord, 'key'>
  lessons!: EntityTable<OfflineLesson, 'id'>
  lessonSections!: EntityTable<OfflineLessonSection, 'id'>
  contentBlocks!: EntityTable<OfflineContentBlock, 'id'>
  sectionQuizzes!: EntityTable<OfflineSectionQuiz, 'id'>
  questions!: EntityTable<OfflineQuestion, 'id'>
  lessonProgress!: EntityTable<OfflineLessonProgress, 'id'>
  sectionProgress!: EntityTable<OfflineSectionProgress, 'id'>
  quizAttempts!: EntityTable<OfflineQuizAttempt, 'id'>
  quizAnswers!: EntityTable<OfflineQuizAnswer, 'id'>
  syncQueue!: EntityTable<SyncQueueEntry, 'id'>
  assets!: EntityTable<OfflineAsset, 'id'>

  constructor() {
    super('SomaSyncDB')

    this.version(1).stores({
      metadata: 'key',
    })

    // Additive only -- existing installs already have `metadata` (it holds
    // the active login session), and Dexie carries version-1 stores forward
    // automatically. Never recreate `metadata` here or a schema upgrade
    // would silently log everyone out.
    this.version(2).stores({
      lessons: '++id, serverId',
      lessonSections: '++id, serverId, lessonId',
      contentBlocks: '++id, serverId, sectionId',
      sectionQuizzes: '++id, serverId, sectionId',
      questions: '++id, serverId, quizId',
      lessonProgress: '++id, studentId, lessonId, &[studentId+lessonId]',
      sectionProgress: '++id, studentId, sectionId, &[studentId+sectionId]',
      quizAttempts: '++id, serverId, quizId, studentId, syncStatus',
      quizAnswers: '++id, attemptId, questionId, &[attemptId+questionId]',
      syncQueue: '++id, status, entityType, entityId',
    })

    this.version(3).stores({
      assets: '++id, &key',
    })
  }
}

export const db = new SomaSyncDB()
