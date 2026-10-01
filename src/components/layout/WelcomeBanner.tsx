import type { ReactNode } from 'react'

interface WelcomeBannerProps {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
}

export function WelcomeBanner({ eyebrow, title, description, action }: WelcomeBannerProps) {
  return (
    <section className="relative isolate flex flex-col justify-between gap-5 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-teal-600 px-6 py-7 text-white shadow-lg shadow-blue-900/10 sm:flex-row sm:items-center sm:px-8 sm:py-9">
      <div aria-hidden="true" className="absolute -right-12 -top-24 -z-10 h-64 w-64 rounded-full border-[36px] border-white/10" />
      <div aria-hidden="true" className="absolute -bottom-20 right-1/4 -z-10 h-40 w-40 rounded-full bg-teal-300/20 blur-2xl" />
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">{eyebrow}</p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-lg text-sm text-blue-50">{description}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </section>
  )
}
