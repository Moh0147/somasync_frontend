export interface OfflineLesson {
  id?: number
  serverId: number
  title: string
  subjectId: number
  formId: number
  topicId?: number
  description: string
  // A sectionless ("flat") lesson is read straight from this field --
  // must be captured at download time or offline reading of that lesson
  // type silently loses its body.
  content: string
  version: number
  downloadedAt: string
  updatedAt: string
}

export interface OfflineLessonSection {
  id?: number
  serverId: number
  lessonId: number
  title: string
  order: number
  version: number
}

export type OfflineContentBlockType = 'HEADING' | 'TEXT' | 'IMAGE' | 'KEY_POINT'

export interface OfflineContentBlock {
  id?: number
  serverId: number
  sectionId: number
  type: OfflineContentBlockType
  content: string
  order: number
  assetUrl?: string
  localAssetKey?: string
}

export interface OfflineSectionQuiz {
  id?: number
  serverId: number
  sectionId: number
  passPercentage: number
}

export type OfflineQuestionType = 'MCQ' | 'TRUE_FALSE' | 'MATCHING'

export interface OfflineQuestionOption {
  id: number
  text: string
  order: number
}

export interface OfflineMatchingPair {
  id: number
  leftText: string
  order: number
}

export interface OfflineQuestion {
  id?: number
  serverId: number
  quizId: number
  type: OfflineQuestionType
  questionText: string
  // MCQ/TRUE_FALSE: options. MATCHING: pairs (left side only) + the
  // shuffled pool of right-side texts to choose from -- mirrors the
  // backend's own SafeQuestionSerializer shape, since that's the only
  // shape ever legitimately downloadable (see correctAnswer below).
  options: OfflineQuestionOption[]
  pairs?: OfflineMatchingPair[]
  rightOptions?: string[]
  // Answer key -- there is currently no backend endpoint that gives a
  // student this data (see Phase 9's finding: SafeQuestionSerializer is
  // the only thing ever served to a student, and it has no answer key).
  // Always null until that changes; kept as a field so the schema is
  // ready the day it does, without implying local marking works today.
  correctAnswer: unknown
  order: number
}

export interface OfflineLessonProgress {
  id?: number
  studentId: number
  lessonId: number
  currentSectionId?: number
  completedSections: number
  totalSections: number
  progressPercentage: number
  completed: boolean
  updatedAt: string
}

export type OfflineSectionStatus = 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED'

export interface OfflineSectionProgress {
  id?: number
  studentId: number
  sectionId: number
  status: OfflineSectionStatus
  bestScore?: number
  attempts: number
  completedAt?: string
}

export type OfflineSyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED'

// Unlike the read-cache tables above (whose *Id fields are local Dexie ids,
// for internal relational queries), these two are sync-bound: they'll be
// replayed against the real API once online, so their *Id fields hold
// SERVER ids directly -- one less translation step for the sync engine
// (Phase 13). For a section mini-quiz attempt specifically, `quizId` holds
// the SECTION's server id, since POST /lessons/sections/{id}/submit-quiz/
// is keyed by section, not by a separately-addressable quiz id.
export interface OfflineQuizAttempt {
  id?: number
  serverId?: number
  quizId: number
  studentId: number
  // Null until the backend marks it -- an offline submission can only be
  // recorded, never locally scored (no answer key on the device).
  score: number | null
  percentage: number | null
  passed: boolean | null
  startedAt: string
  submittedAt?: string
  syncStatus: OfflineSyncStatus
}

export interface OfflineQuizAnswer {
  id?: number
  attemptId: number
  questionId: number
  answer: unknown
  isCorrect?: boolean
  marks?: number
}

// Referenced by contentBlocks.localAssetKey -- downloaded binary assets
// (currently just lesson images) live here, never in Cache Storage, since
// they're user-specific downloaded learning content, not static app shell.
export interface OfflineAsset {
  id?: number
  key: string
  blob: Blob
  mimeType: string
}

export type SyncOperation = 'CREATE' | 'UPDATE' | 'DELETE'
export type SyncQueueStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED'

export interface SyncQueueEntry {
  id?: number
  entityType: string
  entityId: number
  operation: SyncOperation
  payload: unknown
  status: SyncQueueStatus
  retryCount: number
  lastAttemptAt?: string
  error?: string
  createdAt: string
}
