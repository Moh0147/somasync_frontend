import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode } from 'react'

import { AlertIcon, CheckIcon, CloseIcon } from '@/components/ui/icons'

type ToastVariant = 'success' | 'error' | 'info'

interface ToastMessage {
  id: string
  variant: ToastVariant
  message: string
}

interface ToastContextValue {
  showToast: (variant: ToastVariant, message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const variantClasses: Record<ToastVariant, string> = {
  success: 'border-green-200 bg-green-50 text-green-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (variant: ToastVariant, message: string) => {
      const id = crypto.randomUUID()
      setToasts((current) => [...current, { id, variant, message }])
      setTimeout(() => dismiss(id), 4000)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm shadow-md ${variantClasses[toast.variant]}`}
          >
            {toast.variant === 'success' && <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />}
            {toast.variant === 'error' && <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />}
            <p className="flex-1">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="shrink-0 opacity-70 hover:opacity-100"
            >
              <CloseIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
