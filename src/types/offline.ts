export interface OfflineLesson {
  id?: number
  serverId: number
  title: string
  subjectId: number
  formId: number
  topicId?: number
  description: string
  
  
  
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
  miniQuizId?: number | null
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
  
  
  
  
  options: OfflineQuestionOption[]
  pairs?: OfflineMatchingPair[]
  rightOptions?: string[]
  
  
  
  
  
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

export interface OfflineQuizAttempt {
  id?: number
  serverId?: number
  quizId: number
  studentId: number
  
  
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
