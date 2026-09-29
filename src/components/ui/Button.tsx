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
    'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus-visible:ring-blue-500 disabled:bg-blue-300',
  secondary:
    'bg-teal-50 text-teal-700 hover:bg-teal-100 active:bg-teal-200 focus-visible:ring-teal-500 disabled:bg-teal-50 disabled:text-teal-300 dark:bg-teal-500/10 dark:text-teal-400 dark:hover:bg-teal-500/20 dark:active:bg-teal-500/30 dark:disabled:bg-teal-500/5 dark:disabled:text-teal-700',
  success:
    'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 focus-visible:ring-green-500 disabled:bg-green-300',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500 disabled:bg-red-300',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200 focus-visible:ring-slate-400 disabled:text-slate-300 dark:text-slate-300 dark:hover:bg-slate-800 dark:active:bg-slate-700 dark:disabled:text-slate-600',
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
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:active:scale-100 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  )
})
