import { useEffect, useRef, useState } from 'react'

import { resolveMediaUrl } from '@/services/mediaUrl'
import type { ExamScriptPage } from '@/types/exam'

const MIN_ZOOM = 0.5
const MAX_ZOOM = 4
const ZOOM_STEP = 0.5

export function ScriptPagesViewer({ pages }: { pages: ExamScriptPage[] }) {
  const [selected, setSelected] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [zoom, setZoom] = useState(0.5)
  const scrollRef = useRef<HTMLDivElement>(null)

  
  useEffect(() => {
    setZoom(0.5)
  }, [selected, lightboxOpen])

  
  useEffect(() => {
    if (!lightboxOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightboxOpen(false)
      if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(z + ZOOM_STEP, MAX_ZOOM))
      if (e.key === '-') setZoom((z) => Math.max(z - ZOOM_STEP, MIN_ZOOM))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxOpen])

  if (pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 py-10 dark:border-slate-700">
        <p className="text-sm text-slate-500 dark:text-slate-400">Script pages not yet extracted.</p>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Run "Extract answers" to generate page images.</p>
      </div>
    )
  }

  const current = pages[selected]

  function openPage(i: number) {
    setSelected(i)
    setLightboxOpen(true)
  }

  function zoomIn() { setZoom((z) => Math.min(+(z + ZOOM_STEP).toFixed(1), MAX_ZOOM)) }
  function zoomOut() { setZoom((z) => Math.max(+(z - ZOOM_STEP).toFixed(1), MIN_ZOOM)) }
  function zoomReset() { setZoom(0.5) }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Script pages ({pages.length})
      </p>

      {}
      <div className="flex flex-wrap gap-2">
        {pages.map((page, i) => (
          <button
            key={page.id}
            type="button"
            onClick={() => openPage(i)}
            className="group relative shrink-0 overflow-hidden rounded-lg border-2 border-slate-200 shadow-sm transition hover:border-blue-400 hover:shadow-md dark:border-slate-700 dark:hover:border-blue-500"
            aria-label={`View page ${page.page_number}`}
          >
            <img
              src={resolveMediaUrl(page.image_url)}
              alt={`Page ${page.page_number}`}
              className="h-32 w-24 object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-slate-800">View</span>
            </div>
            <span className="absolute left-1.5 top-1.5 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white">
              p{page.page_number}
            </span>
          </button>
        ))}
      </div>

      {}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/90"
          role="dialog"
          aria-modal="true"
        >
          {}
          <div className="flex shrink-0 items-center justify-between gap-3 bg-black/60 px-4 py-2" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-medium text-white/80">
              Page {current.page_number} of {pages.length}
            </p>

            {}
            <div className="flex items-center gap-1 rounded-lg bg-white/10 p-1">
              <button
                type="button"
                onClick={zoomOut}
                disabled={zoom <= MIN_ZOOM}
                className="flex h-7 w-7 items-center justify-center rounded-md text-lg font-bold text-white transition hover:bg-white/20 disabled:opacity-30"
                aria-label="Zoom out"
              >
                −
              </button>
              <button
                type="button"
                onClick={zoomReset}
                className="min-w-[3.5rem] rounded-md px-2 py-0.5 text-xs font-semibold text-white transition hover:bg-white/20"
                aria-label="Reset zoom"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={zoomIn}
                disabled={zoom >= MAX_ZOOM}
                className="flex h-7 w-7 items-center justify-center rounded-md text-lg font-bold text-white transition hover:bg-white/20 disabled:opacity-30"
                aria-label="Zoom in"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="rounded-lg bg-white/10 px-3 py-1 text-sm font-medium text-white transition hover:bg-white/20"
            >
              Close ✕
            </button>
          </div>

          {}
          <div
            ref={scrollRef}
            className="flex flex-1 items-start justify-center overflow-auto p-4"
            onClick={() => setLightboxOpen(false)}
          >
            <img
              src={resolveMediaUrl(current.image_url)}
              alt={`Script page ${current.page_number} full size`}
              onClick={(e) => e.stopPropagation()}
              style={{ width: `${zoom * 100}%`, maxWidth: `${zoom * 100}%`, transition: 'width 0.2s, max-width 0.2s' }}
              className="cursor-zoom-in rounded object-contain shadow-2xl"
            />
          </div>

          {}
          {pages.length > 1 && (
            <div className="flex shrink-0 justify-center gap-2 pb-4 pt-2" onClick={(e) => e.stopPropagation()}>
              {pages.map((page, i) => (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => setSelected(i)}
                  className={[
                    'h-2 w-2 rounded-full transition',
                    i === selected ? 'bg-white' : 'bg-white/40 hover:bg-white/70',
                  ].join(' ')}
                  aria-label={`Page ${page.page_number}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
