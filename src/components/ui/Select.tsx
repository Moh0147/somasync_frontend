import { forwardRef, useId } from 'react'
import type { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, helperText, id, className = '', children, ...props },
  ref,
) {
  const generatedId = useId()
  const selectId = id ?? generatedId

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
        className={`h-10 rounded-md border bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:bg-slate-50 disabled:text-slate-400 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-offset-slate-900 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 ${
          error
            ? 'border-red-400 focus:ring-red-500 dark:border-red-500/60'
            : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-700'
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <p id={`${selectId}-error`} className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${selectId}-helper`} className="text-sm text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      ) : null}
    </div>
  )
})
