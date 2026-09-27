import { db } from '@/db/db'

export async function saveAsset(key: string, blob: Blob, mimeType: string): Promise<number> {
  const existing = await db.assets.where('key').equals(key).first()
  if (existing) {
    await db.assets.put({ ...existing, blob, mimeType })
    return existing.id!
  }
  return db.assets.add({ key, blob, mimeType }) as Promise<number>
}

export function getAsset(key: string) {
  return db.assets.where('key').equals(key).first()
}

export function deleteAsset(key: string) {
  return db.assets.where('key').equals(key).delete()
}
