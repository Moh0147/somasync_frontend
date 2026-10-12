import { useRegisterSW } from 'virtual:pwa-register/react'

import { Button } from '@/components/ui/Button'

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      
      
      
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
