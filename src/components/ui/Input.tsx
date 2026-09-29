import { forwardRef, useId, useState } from 'react'
import type { InputHTMLAttributes } from 'react'

import { EyeIcon, EyeOffIcon } from './icons'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helperText, id, className = '', type, ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={isPassword && showPassword ? 'text' : type}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          className={`h-10 w-full rounded-md border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:bg-slate-50 disabled:text-slate-400 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-offset-slate-900 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 ${
            isPassword ? 'pr-10' : ''
          } ${
            error
              ? 'border-red-400 focus:ring-red-500 dark:border-red-500/60'
              : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-700'
          } ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-500 dark:hover:text-slate-300"
          >
            {showPassword ? <EyeOffIcon aria-hidden="true" className="h-4 w-4" /> : <EyeIcon aria-hidden="true" className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${inputId}-helper`} className="text-sm text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      ) : null}
    </div>
  )
})
