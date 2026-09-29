import type { HTMLAttributes } from 'react'

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  // shadow-sm only -- just enough to lift a card off the page background
  // without reading as decorative; the brief explicitly warns against
  // "excessive shadows". Dark mode drops the shadow (invisible on a dark
  // page anyway) and relies on the border for separation instead.
  return (
    <div
      className={`rounded-md border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none ${className}`}
      {...props}
    />
  )
}

export function CardHeader({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`border-b border-slate-200 px-4 py-3 dark:border-slate-800 ${className}`} {...props} />
}

export function CardBody({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`px-4 py-4 ${className}`} {...props} />
}

export function CardFooter({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`border-t border-slate-200 px-4 py-3 dark:border-slate-800 ${className}`} {...props} />
}
