import { db } from '@/db/db'
import type { OfflineContentBlock } from '@/types/offline'

export async function upsertContentBlock(block: OfflineContentBlock): Promise<number> {
  const existing = await db.contentBlocks.where('serverId').equals(block.serverId).first()
  if (existing) {
    await db.contentBlocks.put({ ...block, id: existing.id })
    return existing.id!
  }
  return db.contentBlocks.add(block) as Promise<number>
}

export function listBlocksForSection(sectionId: number) {
  return db.contentBlocks.where('sectionId').equals(sectionId).sortBy('order')
}

export function deleteContentBlock(id: number) {
  return db.contentBlocks.delete(id)
}
