/**
 * CameraScriptScanner — continuous batch-scan workflow for NECTA marking.
 *
 * New flow (replaces the old review-then-upload batch):
 *   1. Point camera at QR code on cover page → candidate auto-identified instantly.
 *   2. Capture pages for that candidate (camera or gallery).
 *   3. Press "Next Candidate" (or scan a new QR) → current candidate's pages are
 *      merged into a PDF and uploaded IMMEDIATELY in the background.
 *      The examiner never waits — they move straight to the next script.
 *   4. Repeat for all 50+ scripts. Each entry appears in ScriptsPanel as it uploads.
 *   5. When all candidates are done, a summary screen shows upload results.
 *
 * Upload state is tracked per-candidate so partial failures are visible without
 * blocking the rest of the session.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import jsQR from 'jsqr'

import { Button } from '@/components/ui/Button'
import { getApiErrorMessage } from '@/services/apiError'
import { uploadScript } from '@/services/examsService'
import type { ExamCandidate } from '@/types/exam'

// ─── types ────────────────────────────────────────────────────────────────────

interface CapturedPage {
  dataUrl: string
  blob: Blob
}

interface CandidateGroup {
  candidate: ExamCandidate
  pages: CapturedPage[]
}

type UploadState = 'idle' | 'uploading' | 'done' | 'failed'

interface UploadStatus {
  state: UploadState
  error?: string
}

// ─── PDF builder (unchanged from previous version) ───────────────────────────

async function mergeToPdf(pages: CapturedPage[]): Promise<Blob> {
  const jpegDataUrls: string[] = []
  const imgDims: Array<{ w: number; h: number }> = []
  for (const page of pages) {
    const img = await loadImage(page.dataUrl)
    imgDims.push({ w: img.naturalWidth, h: img.naturalHeight })
    if (page.dataUrl.startsWith('data:image/jpeg')) {
      jpegDataUrls.push(page.dataUrl)
    } else {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight
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
  const offsets: number[] = []
  const enc = new TextEncoder()
  function str(s: string) { const b = enc.encode(s); parts.push(b); byteOffset += b.length }
  function raw(b: Uint8Array) { parts.push(b); byteOffset += b.length }
  function recordObj(num: number) { offsets[num] = byteOffset }
  const n = images.length
  str('%PDF-1.4\n')
  const pageObjNums: number[] = []
  for (let i = 0; i < n; i++) {
    const imgNum = 3 + i * 3, contentNum = 3 + i * 3 + 1, pageNum = 3 + i * 3 + 2
    pageObjNums.push(pageNum)
    const { w: pageW, h: pageH } = imgDims[i]
    const imgBytes = images[i]
    const drawCmd = `q ${pageW} 0 0 ${pageH} 0 0 cm /Im${i} Do Q\n`
    const drawBytes = enc.encode(drawCmd)
    recordObj(imgNum)
    str(`${imgNum} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pageW} /Height ${pageH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgBytes.length} >>\nstream\n`)
    raw(imgBytes); str('\nendstream\nendobj\n')
    recordObj(contentNum)
    str(`${contentNum} 0 obj\n<< /Length ${drawBytes.length} >>\nstream\n`)
    raw(drawBytes); str('endstream\nendobj\n')
    recordObj(pageNum)
    str(`${pageNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im${i} ${imgNum} 0 R >> >> /Contents ${contentNum} 0 R >>\nendobj\n`)
  }
  recordObj(2)
  str(`2 0 obj\n<< /Type /Pages /Kids [${pageObjNums.map((n) => `${n} 0 R`).join(' ')}] /Count ${n} >>\nendobj\n`)
  recordObj(1)
  str('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n')
  const xrefAt = byteOffset
  const maxObj = Math.max(...Object.keys(offsets).map(Number))
  str(`xref\n0 ${maxObj + 1}\n0000000000 65535 f \n`)
  for (let obj = 1; obj <= maxObj; obj++) str(`${String(offsets[obj] ?? 0).padStart(10, '0')} 00000 n \n`)
  str(`trailer\n<< /Size ${maxObj + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF`)
  const total = parts.reduce((s, p) => s + p.length, 0)
  const out = new Uint8Array(total); let pos = 0
  for (const p of parts) { out.set(p, pos); pos += p.length }
  return new Blob([out], { type: 'application/pdf' })
}

function scanQRFromFrame(imageData: ImageData): string | null {
  const result = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' })
  return result ? result.data : null
}

// ─── component ────────────────────────────────────────────────────────────────

export function CameraScriptScanner({
  examId,
  candidates,
  onDone,
}: {
  examId: number
  candidates: ExamCandidate[]
  onDone: () => void
}) {
  const [groups, setGroups] = useState<CandidateGroup[]>([])
  const [activeCandidateId, setActiveCandidateId] = useState<number | null>(null)
  const [detectedQR, setDetectedQR] = useState<string | null>(null)
  const [qrConfirmed, setQrConfirmed] = useState(false)
  const [uploadStatuses, setUploadStatuses] = useState<Record<number, UploadStatus>>({})
  const [isDone, setIsDone] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const qrScanInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  // Keeps commitCandidate (called from effects) always reading fresh groups.
  const groupsRef = useRef<CandidateGroup[]>([])

  groupsRef.current = groups
  const scannedIds = new Set(groups.map((g) => g.candidate.id))
  const remainingCandidates = candidates.filter((c) => !scannedIds.has(c.id))
  const activeCandidate = candidates.find((c) => c.id === activeCandidateId) ?? null
  const activeGroup = groups.find((g) => g.candidate.id === activeCandidateId)
  const pagesCaptured = activeGroup?.pages.length ?? 0

  // ── camera ──────────────────────────────────────────────────────────────

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play() }
    } catch { /* fall back to gallery */ }
  }, [])

  const stopCamera = useCallback(() => {
    if (qrScanInterval.current) clearInterval(qrScanInterval.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  useEffect(() => {
    if (!isDone) startCamera()
    return () => stopCamera()
  }, [isDone, startCamera, stopCamera])

  // ── QR loop ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isDone || qrConfirmed) return
    qrScanInterval.current = setInterval(() => {
      const video = videoRef.current; const canvas = canvasRef.current
      if (!video || !canvas || video.readyState < 2) return
      canvas.width = video.videoWidth; canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d'); if (!ctx) return
      ctx.drawImage(video, 0, 0)
      const qrValue = scanQRFromFrame(ctx.getImageData(0, 0, canvas.width, canvas.height))
      if (qrValue && qrValue !== detectedQR) setDetectedQR(qrValue)
    }, 400)
    return () => { if (qrScanInterval.current) clearInterval(qrScanInterval.current) }
  }, [isDone, qrConfirmed, detectedQR])

  // ── auto-match QR ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!detectedQR || qrConfirmed) return
    const matched = candidates.find((c) => c.candidate_number === detectedQR)
    if (!matched) return
    // If there's an active candidate with pages not yet committed, commit them first
    if (activeCandidateId && activeCandidateId !== matched.id) {
      commitCandidate(activeCandidateId)
    }
    setActiveCandidateId(matched.id)
    setQrConfirmed(true)
    if (qrScanInterval.current) clearInterval(qrScanInterval.current)
  }, [detectedQR, candidates, qrConfirmed, activeCandidateId])

  // ── upload a candidate's pages immediately in background ─────────────────

  function commitCandidate(candidateId: number) {
    const group = groupsRef.current.find((g) => g.candidate.id === candidateId)
    if (!group || group.pages.length === 0) return

    setUploadStatuses((prev) => ({ ...prev, [candidateId]: { state: 'uploading' } }))

    mergeToPdf(group.pages).then((pdfBlob) => {
      const candidateNumber = group.candidate.candidate_number
      const file = new File([pdfBlob], `${candidateNumber}.pdf`, { type: 'application/pdf' })
      return uploadScript(examId, candidateNumber, file)
    }).then(() => {
      setUploadStatuses((prev) => ({ ...prev, [candidateId]: { state: 'done' } }))
      onDone() // refresh the scripts list in the parent
    }).catch((err) => {
      setUploadStatuses((prev) => ({ ...prev, [candidateId]: { state: 'failed', error: getApiErrorMessage(err) } }))
    })
  }

  // ── "Next Candidate" — commit current and clear for next QR ─────────────

  function handleNextCandidate() {
    if (!activeCandidateId) return
    commitCandidate(activeCandidateId)
    setDetectedQR(null)
    setQrConfirmed(false)
    setActiveCandidateId(null)
  }

  function handleFinishAll() {
    if (activeCandidateId) commitCandidate(activeCandidateId)
    setIsDone(true)
    stopCamera()
  }

  // ── page capture ─────────────────────────────────────────────────────────

  function capturePageFromVideo() {
    const video = videoRef.current; const canvas = canvasRef.current
    if (!video || !canvas || !activeCandidateId) return
    canvas.width = video.videoWidth; canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88)
    canvas.toBlob((blob) => {
      if (!blob) return
      addPage(activeCandidateId, { dataUrl, blob })
    }, 'image/jpeg', 0.88)
  }

  function handleFileCapture(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (!activeCandidateId) return
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => addPage(activeCandidateId, { dataUrl: e.target?.result as string, blob: file })
      reader.readAsDataURL(file)
    })
  }

  function addPage(candidateId: number, page: CapturedPage) {
    setGroups((prev) => {
      const existing = prev.find((g) => g.candidate.id === candidateId)
      const candidate = candidates.find((c) => c.id === candidateId)!
      if (existing) return prev.map((g) => g.candidate.id === candidateId ? { ...g, pages: [...g.pages, page] } : g)
      return [...prev, { candidate, pages: [page] }]
    })
  }

  function selectManually(candidateId: number) {
    if (activeCandidateId && activeCandidateId !== candidateId) commitCandidate(activeCandidateId)
    setActiveCandidateId(candidateId)
    setDetectedQR(null)
    setQrConfirmed(true)
  }

  // ── done summary ──────────────────────────────────────────────────────────

  if (isDone) {
    const uploading = Object.values(uploadStatuses).filter((s) => s.state === 'uploading').length
    const done = Object.values(uploadStatuses).filter((s) => s.state === 'done').length
    const failed = Object.values(uploadStatuses).filter((s) => s.state === 'failed').length
    return (
      <div className="flex flex-col gap-4 py-4">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {uploading > 0 ? `Uploading… (${uploading} remaining)` : failed > 0 ? 'Upload completed with errors' : 'All scripts uploaded'}
        </p>
        <ul className="flex flex-col gap-2">
          {groups.filter((g) => g.pages.length > 0).map((g) => {
            const st = uploadStatuses[g.candidate.id]
            const label = !st ? '⏳ Queued' : st.state === 'uploading' ? '↑ Uploading…' : st.state === 'done' ? '✓ Uploaded' : `✗ Failed: ${st.error ?? ''}`
            const color = !st || st.state === 'uploading' ? 'text-blue-500' : st.state === 'done' ? 'text-green-600 dark:text-green-400' : 'text-red-500'
            return (
              <li key={g.candidate.id} className="flex items-center justify-between text-sm">
                <span className="font-mono text-slate-700 dark:text-slate-300">{g.candidate.candidate_number} · {g.pages.length}pg</span>
                <span className={color}>{label}</span>
              </li>
            )
          })}
        </ul>
        <p className="text-xs text-slate-500 dark:text-slate-400">{done} uploaded · {uploading} uploading · {failed} failed</p>
        <Button size="sm" onClick={onDone}>View scripts list</Button>
      </div>
    )
  }

  // ── scan step (full-screen portal) ────────────────────────────────────────

  const uploadingCount = Object.values(uploadStatuses).filter((s) => s.state === 'uploading').length
  const doneCount = Object.values(uploadStatuses).filter((s) => s.state === 'done').length
  const failedCount = Object.values(uploadStatuses).filter((s) => s.state === 'failed').length

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-black" style={{ width: '100dvw', height: '100dvh' }}>
      <canvas ref={canvasRef} className="hidden" />
      <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-cover" />

      {/* QR target box */}
      {!qrConfirmed && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-56 w-56 rounded-xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
        </div>
      )}

      {/* Page thumbnails */}
      {qrConfirmed && pagesCaptured > 0 && (
        <div className="absolute bottom-36 left-3 flex gap-1.5">
          {activeGroup!.pages.map((p, i) => (
            <img key={i} src={p.dataUrl} alt={`pg ${i + 1}`} className="h-14 w-10 rounded border-2 border-white object-cover shadow-lg" />
          ))}
        </div>
      )}

      {/* ── Top bar ── */}
      <div className="absolute inset-x-0 top-0 flex flex-col gap-1 bg-gradient-to-b from-black/80 to-transparent px-4 pb-6 pt-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-white">
            {scannedIds.size}/{candidates.length} scanned
          </p>
          <button
            onClick={handleFinishAll}
            className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm"
          >
            Finish →
          </button>
        </div>
        {/* Upload status strip */}
        {(uploadingCount > 0 || doneCount > 0 || failedCount > 0) && (
          <div className="flex gap-3 text-xs">
            {doneCount > 0 && <span className="text-green-400">✓ {doneCount} uploaded</span>}
            {uploadingCount > 0 && <span className="text-blue-300">↑ {uploadingCount} uploading</span>}
            {failedCount > 0 && <span className="text-red-400">✗ {failedCount} failed</span>}
          </div>
        )}
      </div>

      {/* ── Bottom panel ── */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 bg-gradient-to-t from-black/90 via-black/70 to-transparent px-4 pb-8 pt-16">

        {!qrConfirmed ? (
          /* Waiting for QR */
          <>
            <p className="text-center text-sm font-medium text-white">
              {detectedQR
                ? `"${detectedQR}" — candidate not found`
                : 'Point camera at QR code on cover page'}
            </p>
            {remainingCandidates.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5">
                {remainingCandidates.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => selectManually(c.id)}
                    className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm"
                  >
                    {c.candidate_number}
                  </button>
                ))}
              </div>
            )}
            {remainingCandidates.length === 0 && (
              <p className="text-center text-xs text-green-400">
                All candidates scanned —{' '}
                <button className="underline" onClick={handleFinishAll}>Finish</button>
              </p>
            )}
          </>
        ) : (
          /* Candidate confirmed — capture controls */
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-400">✓ Candidate identified</p>
                <p className="text-lg font-bold font-mono text-white">{activeCandidate?.candidate_number}</p>
              </div>
              <p className="text-sm text-white/60">{pagesCaptured} page{pagesCaptured !== 1 ? 's' : ''}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={capturePageFromVideo}
                className="flex-1 rounded-xl bg-white py-3 text-sm font-bold text-slate-900 active:scale-95"
              >
                📷 Capture Page {pagesCaptured + 1}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl bg-white/20 px-4 py-3 text-sm font-semibold text-white backdrop-blur-sm"
              >
                Gallery
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={handleFileCapture} />

            {pagesCaptured > 0 ? (
              <button
                onClick={handleNextCandidate}
                className="w-full rounded-xl bg-green-500/90 py-3 text-sm font-bold text-white active:scale-95"
              >
                ✓ Done — Next Candidate
              </button>
            ) : (
              <button
                onClick={() => { setDetectedQR(null); setQrConfirmed(false); setActiveCandidateId(null) }}
                className="w-full rounded-xl bg-white/10 py-2 text-xs text-white/60"
              >
                Skip this candidate
              </button>
            )}
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
