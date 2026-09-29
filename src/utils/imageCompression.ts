const MAX_DIMENSION = 1280
const JPEG_QUALITY = 0.8

// Downloaded lesson images are re-encoded to a capped resolution/quality
// before being stored in IndexedDB, since a low-end Android device pays
// for every stored byte twice: once in disk quota, once in decode memory
// when the image is later rendered. SVGs and GIFs are left untouched --
// SVG is already vector/small, and re-encoding a GIF as JPEG would destroy
// any animation.
export async function compressImageBlob(blob: Blob): Promise<Blob> {
  if (!blob.type.startsWith('image/') || blob.type === 'image/svg+xml' || blob.type === 'image/gif') {
    return blob
  }

  try {
    const bitmap = await createImageBitmap(blob)
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    if (scale >= 1) {
      bitmap.close()
      return blob
    }

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close()
      return blob
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()

    const compressed = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
    )
    return compressed && compressed.size < blob.size ? compressed : blob
  } catch {
    // Decoding can fail for formats the browser doesn't support -- keep
    // the original rather than lose the image.
    return blob
  }
}
