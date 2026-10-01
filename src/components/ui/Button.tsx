import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

// Hierarchy is deliberate: primary is the one loud, solid-fill action per
// screen; secondary is a soft tint, one step down; ghost is text-only, the
// quietest. Never make two actions on the same screen equally loud.
const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border border-blue-700 bg-blue-600 text-white shadow-sm shadow-blue-900/10 hover:border-blue-800 hover:bg-blue-700 hover:shadow active:bg-blue-800 focus-visible:ring-blue-500 disabled:border-blue-300 disabled:bg-blue-300 disabled:shadow-none dark:border-blue-500 dark:bg-blue-600 dark:hover:border-blue-400 dark:hover:bg-blue-500',
  secondary:
    'border border-teal-300 bg-teal-50 text-teal-800 shadow-sm hover:border-teal-400 hover:bg-teal-100 active:bg-teal-200 focus-visible:ring-teal-500 disabled:border-teal-100 disabled:bg-teal-50 disabled:text-teal-300 dark:border-teal-700 dark:bg-teal-500/10 dark:text-teal-300 dark:hover:border-teal-600 dark:hover:bg-teal-500/20 dark:active:bg-teal-500/30 dark:disabled:border-teal-900 dark:disabled:bg-teal-500/5 dark:disabled:text-teal-700',
  success:
    'border border-green-700 bg-green-600 text-white shadow-sm shadow-green-900/10 hover:border-green-800 hover:bg-green-700 hover:shadow active:bg-green-800 focus-visible:ring-green-500 disabled:border-green-300 disabled:bg-green-300 disabled:shadow-none dark:border-green-500 dark:bg-green-600 dark:hover:border-green-400',
  danger:
    'border border-red-700 bg-red-600 text-white shadow-sm shadow-red-900/10 hover:border-red-800 hover:bg-red-700 hover:shadow active:bg-red-800 focus-visible:ring-red-500 disabled:border-red-300 disabled:bg-red-300 disabled:shadow-none dark:border-red-500 dark:bg-red-600 dark:hover:border-red-400',
  ghost:
    'border border-slate-300 bg-white text-slate-700 shadow-sm hover:border-blue-400 hover:bg-blue-50 hover:text-blue-800 active:bg-blue-100 focus-visible:ring-blue-500 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-300 disabled:shadow-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-700 dark:hover:bg-blue-500/10 dark:hover:text-blue-300 dark:active:bg-blue-500/20 dark:disabled:border-slate-800 dark:disabled:bg-slate-900 dark:disabled:text-slate-600',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className = '', disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:active:scale-100 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  )
})
