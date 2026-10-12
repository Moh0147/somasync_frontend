import axios from 'axios'

import { updateAttemptResult } from '@/db/offlineServices/attemptOfflineService'
import {
  getPendingSyncEntries,
  getSyncEntriesByStatus,
  incrementRetryCount,
  markSyncEntry,
} from '@/db/offlineServices/syncQueueService'
import { db } from '@/db/db'
import { getSectionByServerId } from '@/db/repositories/lessonSectionsRepository'
import { getSectionProgress, upsertSectionProgress } from '@/db/repositories/progressRepository'
import { requestExplanation } from '@/services/aiService'
import { getApiErrorMessage } from '@/services/apiError'
import { submitSectionQuiz } from '@/services/lessonsService'
import type { SectionQuizAnswerInput, SectionQuizResult } from '@/types/quiz'

let isSyncing = false

export interface SyncSummary {
  synced: number
  failed: number
}

export interface SyncCounts {
  synced: number
  pending: number
  failed: number
}

export async function getSyncCounts(): Promise<SyncCounts> {
  const [synced, pending, failed] = await Promise.all([
    getSyncEntriesByStatus('SYNCED'),
    getSyncEntriesByStatus('PENDING'),
    getSyncEntriesByStatus('FAILED'),
  ])
  return { synced: synced.length, pending: pending.length, failed: failed.length }
}

async function reconcileAfterSync(studentId: number, sectionServerId: number, result: SectionQuizResult) {
  const section = await getSectionByServerId(sectionServerId)
  if (!section) return

  const existing = await getSectionProgress(studentId, section.id!)
  await upsertSectionProgress({
    studentId,
    sectionId: section.id!,
    status: result.passed ? 'COMPLETED' : 'AVAILABLE',
    bestScore: result.best_score ?? existing?.bestScore,
    attempts: result.attempts,
    completedAt: result.passed ? new Date().toISOString() : existing?.completedAt,
  })

  if (result.passed && result.next_section_unlocked && result.next_section_id) {
    const nextSection = await getSectionByServerId(result.next_section_id)
    if (nextSection) {
      const nextExisting = await getSectionProgress(studentId, nextSection.id!)
      if (!nextExisting) {
        await upsertSectionProgress({ studentId, sectionId: nextSection.id!, status: 'AVAILABLE', attempts: 0 })
      }
    }
  }
}

async function processSectionQuizAttempt(entityId: number, payload: unknown, studentId: number) {
  const { sectionServerId, answers } = payload as { sectionServerId: number; answers: SectionQuizAnswerInput[] }
  const result = await submitSectionQuiz(sectionServerId, answers)
  await updateAttemptResult(entityId, { score: result.score, percentage: result.score, passed: result.passed })
  await reconcileAfterSync(studentId, sectionServerId, result)
}

async function processAiExplanationRequest(payload: unknown) {
  const { studentAnswerId } = payload as { studentAnswerId: number }
  const result = await requestExplanation(studentAnswerId)
  if (result.status === 'FAILED') {
    throw new Error(result.error || 'AI explanation request failed.')
  }
  await db.metadata.put({ key: `ai.explanation.${studentAnswerId}`, value: result })
}

export async function runSync(studentId: number, includeFailedRetries = false): Promise<SyncSummary> {
  if (isSyncing) return { synced: 0, failed: 0 }
  isSyncing = true

  let synced = 0
  let failed = 0

  try {
    const entries = includeFailedRetries
      ? [...(await getPendingSyncEntries()), ...(await getSyncEntriesByStatus('FAILED'))]
      : await getPendingSyncEntries()

    for (const entry of entries) {
      await markSyncEntry(entry.id!, 'SYNCING')
      try {
        if (entry.entityType === 'sectionQuizAttempt') {
          await processSectionQuizAttempt(entry.entityId, entry.payload, studentId)
        } else if (entry.entityType === 'aiExplanationRequest') {
          await processAiExplanationRequest(entry.payload)
        } else {
          throw new Error(`Unknown sync entity type: ${entry.entityType}`)
        }
        await markSyncEntry(entry.id!, 'SYNCED')
        synced += 1
      } catch (err) {
        
        
        
        
        const isNetworkFailure = axios.isAxiosError(err) && !err.response
        if (isNetworkFailure) {
          await incrementRetryCount(entry.id!, entry.retryCount)
          await markSyncEntry(entry.id!, 'PENDING', 'Network error -- will retry')
        } else {
          await markSyncEntry(entry.id!, 'FAILED', getApiErrorMessage(err))
        }
        failed += 1
      }
    }
  } finally {
    isSyncing = false
  }

  return { synced, failed }
}
