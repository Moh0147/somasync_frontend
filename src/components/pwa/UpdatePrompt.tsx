import { useRegisterSW } from 'virtual:pwa-register/react'

import { Button } from '@/components/ui/Button'

// A waiting service worker never activates on its own (see src/sw.ts) --
// this is the only thing that ever calls updateServiceWorker(true), which
// posts SKIP_WAITING to it and reloads once it takes control. IndexedDB
// (all lesson/quiz/sync data) is untouched by any of this -- it's a
// separate storage system the service worker update never reaches.
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // The browser only checks for a new service worker on navigation by
      // default -- a tab left open for hours would otherwise never notice
      // a new deploy. Poll explicitly so the prompt actually appears.
      if (!registration) return
      setInterval(() => registration.update(), 60 * 60 * 1000)
    },
  })

  if (!needRefresh) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 shadow-lg sm:inset-x-auto sm:right-4 sm:bottom-4 sm:rounded-lg sm:border dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-700 dark:text-slate-300">A new version is available.</p>
      <Button size="sm" onClick={() => updateServiceWorker(true)}>
        Update
      </Button>
    </div>
  )
}
