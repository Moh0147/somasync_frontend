import { db } from '@/db/db'
import type { SyncQueueEntry, SyncQueueStatus } from '@/types/offline'

export function addToQueue(entry: SyncQueueEntry) {
  return db.syncQueue.add(entry) as Promise<number>
}

export function listByStatus(status: SyncQueueStatus) {
  return db.syncQueue.where('status').equals(status).sortBy('createdAt')
}

export function listForEntity(entityType: string, entityId: number) {
  return db.syncQueue.where({ entityType, entityId }).toArray()
}

export function updateQueueEntry(id: number, changes: Partial<SyncQueueEntry>) {
  return db.syncQueue.update(id, changes)
}

export function removeFromQueue(id: number) {
  return db.syncQueue.delete(id)
}
