import { addToQueue, listByStatus, listForEntity, removeFromQueue, updateQueueEntry } from '@/db/repositories/syncQueueRepository'
import type { SyncOperation, SyncQueueEntry } from '@/types/offline'

export async function queueSync(entry: {
  entityType: string
  entityId: number
  operation: SyncOperation
  payload: unknown
}) {
  const queueEntry: SyncQueueEntry = {
    ...entry,
    status: 'PENDING',
    retryCount: 0,
    createdAt: new Date().toISOString(),
  }
  return addToQueue(queueEntry)
}

export async function getPendingSyncEntries() {
  return listByStatus('PENDING')
}

export async function getSyncEntriesByStatus(status: SyncQueueEntry['status']) {
  return listByStatus(status)
}

export async function getSyncEntriesForEntity(entityType: string, entityId: number) {
  return listForEntity(entityType, entityId)
}

export async function markSyncEntry(id: number, status: SyncQueueEntry['status'], error?: string) {
  return updateQueueEntry(id, { status, error, lastAttemptAt: new Date().toISOString() })
}

export async function incrementRetryCount(id: number, currentRetryCount: number) {
  return updateQueueEntry(id, { retryCount: currentRetryCount + 1, lastAttemptAt: new Date().toISOString() })
}

export async function clearSyncedEntry(id: number) {
  return removeFromQueue(id)
}
