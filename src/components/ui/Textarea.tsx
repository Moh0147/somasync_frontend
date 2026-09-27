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
        <label htmlFor={textareaId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
        className={`rounded-md border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:bg-slate-50 disabled:text-slate-400 ${
          error ? 'border-red-400 focus:ring-red-500' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500'
        } ${className}`}
        {...props}
      />
      {error ? (
        <p id={`${textareaId}-error`} className="text-sm text-red-600">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${textareaId}-helper`} className="text-sm text-slate-500">
          {helperText}
        </p>
      ) : null}
    </div>
  )
})
