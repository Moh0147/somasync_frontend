import { forwardRef, useId } from 'react'
import type { TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, helperText, id, className = '', rows = 4, ...props },
  ref,
) {
  const generatedId = useId()
  const textareaId = id ?? generatedId

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={textareaId} className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
        className={`rounded-md border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:bg-slate-50 disabled:text-slate-400 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-offset-slate-900 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 ${
          error
            ? 'border-red-400 focus:ring-red-500 dark:border-red-500/60'
            : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-700'
        } ${className}`}
        {...props}
      />
      {error ? (
        <p id={`${textareaId}-error`} className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${textareaId}-helper`} className="text-sm text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      ) : null}
    </div>
  )
})
