/**
 * CameraScriptScanner — multi-page camera scan workflow for exam scripts.
 *
 * Flow:
 *   1. Teacher points camera at QR code on cover page → candidate auto-detected.
 *   2. Teacher photographs remaining pages of that candidate's script.
 *   3. "Next Candidate" → advances to the next unscanned candidate.
 *   4. Review screen shows all grouped pages before upload.
 *   5. Each group is merged into one PDF (browser canvas) then uploaded.
 *
 * QR code format: the candidate_number string, e.g. "F2A-003".
 * Encoded by the backend's cover_page_service.py.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import jsQR from 'jsqr'

import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { getApiErrorMessage } from '@/services/apiError'
import { uploadScript } from '@/services/examsService'
import type { ExamCandidate } from '@/types/exam'

// ─── types ───────────────────────────────────────────────────────────────────

interface CapturedPage {
  dataUrl: string   // base64 PNG from canvas
  blob: Blob
}

interface CandidateGroup {
  candidate: ExamCandidate
  pages: CapturedPage[]
}

type ScanStep = 'scan' | 'review' | 'uploading' | 'done'

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Merge an array of image blobs into a single multi-page PDF using canvas + fitz-less approach.
 *  We embed each image as a JPEG page in a minimal hand-built PDF. */
async function mergeToPdf(pages: CapturedPage[]): Promise<Blob> {
  const jpegDataUrls: string[] = []
  const imgDims: Array<{ w: number; h: number }> = []

  for (const page of pages) {
    const img = await loadImage(page.dataUrl)
    const iw = img.naturalWidth
    const ih = img.naturalHeight
    imgDims.push({ w: iw, h: ih })

    if (page.dataUrl.startsWith('data:image/jpeg')) {
      // Already JPEG at native camera resolution — embed directly, no re-encode.
      jpegDataUrls.push(page.dataUrl)
    } else {
      // Convert PNG/other to JPEG at native resolution (no downscale).
      const canvas = document.createElement('canvas')
      canvas.width = iw
      canvas.height = ih
      canvas.getContext('2d')!.drawImage(img, 0, 0)
      jpegDataUrls.push(canvas.toDataURL('image/jpeg', 0.92))
    }
  }

  return buildPdfFromJpegs(jpegDataUrls, imgDims)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** Build a valid multi-page PDF from an array of JPEG data URLs.
 *
 * Each page's MediaBox matches the image's actual pixel dimensions so the
 * embedded JPEG is stored at full camera resolution — this gives pytesseract
 * enough detail to read the text accurately.
 *
 * Object layout per page i (0-based):
 *   imgObj     = 3 + i*3      — Image XObject (JPEG bytes, DCTDecode)
 *   contentObj = 3 + i*3 + 1  — Content stream (drawing commands)
 *   pageObj    = 3 + i*3 + 2  — Page dictionary (references imgObj + contentObj)
 *
 * Fixed objects:
 *   1 = Catalog, 2 = Pages parent
 */
function buildPdfFromJpegs(
  jpegDataUrls: string[],
  imgDims: Array<{ w: number; h: number }>,
): Blob {
  const images = jpegDataUrls.map((url) => {
    const b64 = url.split(',')[1]
    const binary = atob(b64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return bytes
  })

  const parts: Uint8Array[] = []
  let byteOffset = 0
  // offsets[objNum] = byte offset of that object in the file (1-based obj numbers)
  const offsets: number[] = []

  const enc = new TextEncoder()
  function str(s: string) { const b = enc.encode(s); parts.push(b); byteOffset += b.length }
  function raw(b: Uint8Array) { parts.push(b); byteOffset += b.length }
  function recordObj(num: number) { offsets[num] = byteOffset }

  const n = images.length
  const catalogNum = 1
  const pagesNum   = 2

  str('%PDF-1.4\n')

  const pageObjNums: number[] = []

  for (let i = 0; i < n; i++) {
    const imgNum     = 3 + i * 3
    const contentNum = 3 + i * 3 + 1
    const pageNum    = 3 + i * 3 + 2
    pageObjNums.push(pageNum)

    // Use actual image pixel dimensions as the page size.
    // This preserves full camera resolution so OCR (pytesseract) can read text.
    const { w: pageW, h: pageH } = imgDims[i]

    const imgBytes = images[i]
    const drawCmd  = `q ${pageW} 0 0 ${pageH} 0 0 cm /Im${i} Do Q\n`
    const drawBytes = enc.encode(drawCmd)

    // — Image XObject —
    recordObj(imgNum)
    str(`${imgNum} 0 obj\n`)
    str(`<< /Type /XObject /Subtype /Image`)
    str(` /Width ${pageW} /Height ${pageH}`)
    str(` /ColorSpace /DeviceRGB /BitsPerComponent 8`)
    str(` /Filter /DCTDecode /Length ${imgBytes.length} >>\n`)
    str('stream\n')
    raw(imgBytes)
    str('\nendstream\nendobj\n')

    // — Content stream —
    recordObj(contentNum)
    str(`${contentNum} 0 obj\n`)
    str(`<< /Length ${drawBytes.length} >>\n`)
    str('stream\n')
    raw(drawBytes)
    str('endstream\nendobj\n')

    // — Page dictionary —
    recordObj(pageNum)
    str(`${pageNum} 0 obj\n`)
    str(`<< /Type /Page /Parent ${pagesNum} 0 R`)
    str(` /MediaBox [0 0 ${pageW} ${pageH}]`)
    str(` /Resources << /XObject << /Im${i} ${imgNum} 0 R >> >>`)
    str(` /Contents ${contentNum} 0 R >>\n`)
    str('endobj\n')
  }

  // — Pages —
  recordObj(pagesNum)
  str(`${pagesNum} 0 obj\n`)
  str(`<< /Type /Pages /Kids [${pageObjNums.map((num) => `${num} 0 R`).join(' ')}] /Count ${n} >>\n`)
  str('endobj\n')

  // — Catalog —
  recordObj(catalogNum)
  str(`${catalogNum} 0 obj\n`)
  str(`<< /Type /Catalog /Pages ${pagesNum} 0 R >>\n`)
  str('endobj\n')

  // — xref table —
  const xrefAt = byteOffset
  const maxObj = Math.max(...Object.keys(offsets).map(Number))
  str(`xref\n0 ${maxObj + 1}\n`)
  str('0000000000 65535 f \n')
  for (let obj = 1; obj <= maxObj; obj++) {
    str(`${String(offsets[obj] ?? 0).padStart(10, '0')} 00000 n \n`)
  }
  str(`trailer\n<< /Size ${maxObj + 1} /Root ${catalogNum} 0 R >>\n`)
  str(`startxref\n${xrefAt}\n%%EOF`)

  const total = parts.reduce((sum, p) => sum + p.length, 0)
  const out = new Uint8Array(total)
  let pos = 0
  for (const p of parts) { out.set(p, pos); pos += p.length }
  return new Blob([out], { type: 'application/pdf' })
}

/** Attempt to read a QR code from an ImageData frame via jsQR. */
function scanQRFromFrame(imageData: ImageData): string | null {
  const result = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'dontInvert',
  })
  return result ? result.data : null
}

// ─── component ───────────────────────────────────────────────────────────────

export function CameraScriptScanner({
  examId,
  candidates,
  onDone,
}: {
  examId: number
  candidates: ExamCandidate[]
  onDone: () => void
}) {
  const [step, setStep] = useState<ScanStep>('scan')
  const [groups, setGroups] = useState<CandidateGroup[]>([])
  const [activeCandidateId, setActiveCandidateId] = useState<number | null>(null)
  const [detectedQR, setDetectedQR] = useState<string | null>(null)
  const [qrConfirmed, setQrConfirmed] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<number, 'pending' | 'uploading' | 'done' | 'failed'>>({})
  const [uploadError, setUploadError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const qrScanInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Candidates that have not yet been assigned a group
  const scannedIds = new Set(groups.map((g) => g.candidate.id))
  const remainingCandidates = candidates.filter((c) => !scannedIds.has(c.id))
  const activeCandidate = candidates.find((c) => c.id === activeCandidateId) ?? null
  const activeGroup = groups.find((g) => g.candidate.id === activeCandidateId)

  // ── camera lifecycle ────────────────────────────────────────────────────

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch {
      // Camera unavailable — fall back to file input
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (qrScanInterval.current) clearInterval(qrScanInterval.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  useEffect(() => {
    if (step === 'scan') startCamera()
    return () => stopCamera()
  }, [step, startCamera, stopCamera])

  // ── QR scanning loop ────────────────────────────────────────────────────

  useEffect(() => {
    if (step !== 'scan' || qrConfirmed) return
    qrScanInterval.current = setInterval(() => {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || video.readyState < 2) return
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(video, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const qrValue = scanQRFromFrame(imageData)
      if (qrValue && qrValue !== detectedQR) {
        setDetectedQR(qrValue)
      }
    }, 400)
    return () => { if (qrScanInterval.current) clearInterval(qrScanInterval.current) }
  }, [step, qrConfirmed, detectedQR])

  // ── auto-match QR to candidate ──────────────────────────────────────────

  useEffect(() => {
    if (!detectedQR || qrConfirmed) return
    const matched = candidates.find((c) => c.candidate_number === detectedQR)
    if (matched) {
      setActiveCandidateId(matched.id)
      setQrConfirmed(true)
      if (qrScanInterval.current) clearInterval(qrScanInterval.current)
    }
  }, [detectedQR, candidates, qrConfirmed])

  // ── page capture ────────────────────────────────────────────────────────

  function capturePageFromVideo() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88)
    canvas.toBlob((blob) => {
      if (!blob || !activeCandidateId) return
      addPageToGroup(activeCandidateId, { dataUrl, blob })
    }, 'image/jpeg', 0.88)
  }

  function handleFileCapture(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (!activeCandidateId) return
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        addPageToGroup(activeCandidateId, { dataUrl, blob: file })
      }
      reader.readAsDataURL(file)
    })
  }

  function addPageToGroup(candidateId: number, page: CapturedPage) {
    setGroups((prev) => {
      const existing = prev.find((g) => g.candidate.id === candidateId)
      const candidate = candidates.find((c) => c.id === candidateId)!
      if (existing) {
        return prev.map((g) =>
          g.candidate.id === candidateId ? { ...g, pages: [...g.pages, page] } : g,
        )
      }
      return [...prev, { candidate, pages: [page] }]
    })
  }

  function removePageFromGroup(candidateId: number, pageIndex: number) {
    setGroups((prev) =>
      prev.map((g) =>
        g.candidate.id === candidateId
          ? { ...g, pages: g.pages.filter((_, i) => i !== pageIndex) }
          : g,
      ),
    )
  }

  function handleNextCandidate() {
    if (!activeGroup || activeGroup.pages.length === 0) return
    setDetectedQR(null)
    setQrConfirmed(false)
    setActiveCandidateId(null)
    // Reset QR scan loop
    if (qrScanInterval.current) clearInterval(qrScanInterval.current)
  }

  function handleSkipCandidate() {
    setDetectedQR(null)
    setQrConfirmed(false)
    setActiveCandidateId(null)
  }

  function selectCandidateManually(candidateId: number) {
    setActiveCandidateId(candidateId)
    setDetectedQR(null)
    setQrConfirmed(true)
  }

  // ── upload ──────────────────────────────────────────────────────────────

  async function handleUpload() {
    setStep('uploading')
    stopCamera()
    setUploadError(null)

    const initialProgress: Record<number, 'pending' | 'uploading' | 'done' | 'failed'> = {}
    groups.forEach((g) => { initialProgress[g.candidate.id] = 'pending' })
    setUploadProgress(initialProgress)

    for (const group of groups) {
      if (group.pages.length === 0) continue
      setUploadProgress((prev) => ({ ...prev, [group.candidate.id]: 'uploading' }))
      try {
        const pdf = await mergeToPdf(group.pages)
        const file = new File([pdf], `${group.candidate.candidate_number}.pdf`, { type: 'application/pdf' })
        await uploadScript(examId, group.candidate.candidate_number, file)
        setUploadProgress((prev) => ({ ...prev, [group.candidate.id]: 'done' }))
      } catch (err) {
        setUploadProgress((prev) => ({ ...prev, [group.candidate.id]: 'failed' }))
        setUploadError(getApiErrorMessage(err))
      }
    }

    setStep('done')
  }

  // ── render helpers ──────────────────────────────────────────────────────

  const readyCandidates = groups.filter((g) => g.pages.length > 0)
  const totalPages = groups.reduce((sum, g) => sum + g.pages.length, 0)

  // ── render ──────────────────────────────────────────────────────────────

  if (step === 'done') {
    const doneCount = Object.values(uploadProgress).filter((s) => s === 'done').length
    const failedCount = Object.values(uploadProgress).filter((s) => s === 'failed').length
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="text-4xl">{failedCount === 0 ? '✅' : '⚠️'}</div>
        <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {failedCount === 0 ? 'All scripts uploaded' : 'Upload completed with errors'}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {doneCount} uploaded · {failedCount} failed · {totalPages} pages total
        </p>
        {uploadError && <p className="text-sm text-red-600 dark:text-red-400">{uploadError}</p>}
        <Button onClick={onDone}>View Scripts</Button>
      </div>
    )
  }

  if (step === 'uploading') {
    return (
      <div className="flex flex-col gap-4 py-4">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Uploading scripts…</p>
        <ul className="flex flex-col gap-2">
          {groups.filter((g) => g.pages.length > 0).map((g) => {
            const s = uploadProgress[g.candidate.id]
            return (
              <li key={g.candidate.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-700 dark:text-slate-300">
                  {g.candidate.candidate_number} · {g.pages.length} page{g.pages.length !== 1 ? 's' : ''}
                </span>
                <span className={
                  s === 'done' ? 'text-green-600 dark:text-green-400' :
                  s === 'failed' ? 'text-red-500' :
                  s === 'uploading' ? 'text-blue-600 dark:text-blue-400' :
                  'text-slate-400'
                }>
                  {s === 'done' ? '✓ Uploaded' : s === 'failed' ? '✗ Failed' : s === 'uploading' ? '↑ Uploading…' : '⏳ Queued'}
                </span>
              </li>
            )
          })}
        </ul>
        <ProgressBar
          value={Math.round(
            (Object.values(uploadProgress).filter((s) => s === 'done' || s === 'failed').length /
              Math.max(readyCandidates.length, 1)) * 100,
          )}
        />
      </div>
    )
  }

  if (step === 'review') {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Review before upload
          </p>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {readyCandidates.length} candidates · {totalPages} pages
          </span>
        </div>

        <ul className="flex flex-col gap-3">
          {candidates.map((candidate) => {
            const group = groups.find((g) => g.candidate.id === candidate.id)
            const pageCount = group?.pages.length ?? 0
            return (
              <li key={candidate.id} className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {candidate.candidate_number}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {pageCount === 0 ? '⚠ No pages captured' : `${pageCount} page${pageCount !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      selectCandidateManually(candidate.id)
                      setStep('scan')
                    }}
                  >
                    {pageCount === 0 ? 'Scan' : 'Edit'}
                  </Button>
                </div>
                {group && group.pages.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {group.pages.map((page, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={page.dataUrl}
                          alt={`Page ${idx + 1}`}
                          className="h-16 w-12 rounded object-cover border border-slate-200 dark:border-slate-700"
                        />
                        <button
                          onClick={() => removePageFromGroup(candidate.id, idx)}
                          className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] text-white"
                          aria-label={`Remove page ${idx + 1}`}
                        >
                          ×
                        </button>
                        <p className="mt-0.5 text-center text-[9px] text-slate-400">pg {idx + 1}</p>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            )
          })}
        </ul>

        <div className="flex gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
          <Button variant="ghost" size="sm" onClick={() => setStep('scan')}>
            ← Back to scan
          </Button>
          <Button
            size="sm"
            disabled={readyCandidates.length === 0}
            onClick={handleUpload}
            className="ml-auto"
          >
            Upload {readyCandidates.length} script{readyCandidates.length !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    )
  }

  // ── scan step — full-screen overlay via portal ────────────────────────

  const pagesCaptured = activeGroup?.pages.length ?? 0

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-black" style={{ width: '100dvw', height: '100dvh' }}>
      {/* Hidden canvas for QR scanning and capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera feed — fills entire screen */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* QR target box — shown while waiting to identify candidate */}
      {!qrConfirmed && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-56 w-56 rounded-xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
        </div>
      )}

      {/* Captured page thumbnails — bottom-left corner */}
      {qrConfirmed && pagesCaptured > 0 && (
        <div className="absolute bottom-36 left-3 flex gap-1.5">
          {activeGroup!.pages.map((p, i) => (
            <img
              key={i}
              src={p.dataUrl}
              alt={`pg ${i + 1}`}
              className="h-14 w-10 rounded border-2 border-white object-cover shadow-lg"
            />
          ))}
        </div>
      )}

      {/* ── Top bar ── */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent px-4 pb-6 pt-safe-top pt-4">
        <p className="text-xs font-medium text-white/80">
          {scannedIds.size} / {candidates.length} scanned
        </p>
        {scannedIds.size > 0 && (
          <button
            onClick={() => setStep('review')}
            className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm"
          >
            Review & Upload →
          </button>
        )}
      </div>

      {/* ── Bottom panel ── */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 bg-gradient-to-t from-black/90 via-black/70 to-transparent px-4 pb-safe-bottom pb-8 pt-16">

        {!qrConfirmed ? (
          /* Waiting for QR */
          <>
            <p className="text-center text-sm font-medium text-white">
              {detectedQR
                ? `QR detected: "${detectedQR}" — no matching candidate`
                : 'Point camera at QR code on cover page'}
            </p>
            {remainingCandidates.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-1.5">
                {remainingCandidates.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => selectCandidateManually(c.id)}
                    className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm"
                  >
                    {c.candidate_number}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-center text-xs text-green-400">
                All candidates scanned —{' '}
                <button className="underline" onClick={() => setStep('review')}>
                  review & upload
                </button>
              </p>
            )}
          </>
        ) : (
          /* Candidate confirmed — page capture controls */
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-400">✓ Candidate identified</p>
                <p className="text-lg font-bold text-white">{activeCandidate?.candidate_number}</p>
              </div>
              <p className="text-sm text-white/60">
                {pagesCaptured} page{pagesCaptured !== 1 ? 's' : ''} captured
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={capturePageFromVideo}
                className="flex-1 rounded-xl bg-white py-3 text-sm font-bold text-slate-900 active:scale-95"
              >
                📷 Capture Page {pagesCaptured + 1}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="hidden"
                onChange={handleFileCapture}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl bg-white/20 px-4 py-3 text-sm font-semibold text-white backdrop-blur-sm"
              >
                Gallery
              </button>
            </div>

            {pagesCaptured > 0 ? (
              <button
                onClick={handleNextCandidate}
                className="w-full rounded-xl bg-green-500/90 py-3 text-sm font-bold text-white active:scale-95"
              >
                ✓ Done — Next Candidate
              </button>
            ) : (
              <button
                onClick={handleSkipCandidate}
                className="w-full rounded-xl bg-white/10 py-2 text-xs text-white/60"
              >
                Skip this candidate
              </button>
            )}
          </>
        )}

        {/* Camera fallback */}
        {!streamRef.current && (
          <p className="text-center text-xs text-amber-400">
            Camera unavailable — use Gallery to select images.
          </p>
        )}
      </div>
    </div>,
    document.body,
  )
}
