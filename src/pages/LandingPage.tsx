import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Button } from '@/components/ui/Button'
import {
  AnalyticsIcon,
  CheckIcon,
  LightbulbIcon,
  OfflineIcon,
  SchoolsIcon,
  StudentsIcon,
  UsersIcon,
} from '@/components/ui/icons'

const features = [
  {
    icon: OfflineIcon,
    title: 'Offline-first learning',
    description: 'Students download lessons once and keep studying with no connection — progress syncs automatically the moment they reconnect.',
  },
  {
    icon: LightbulbIcon,
    title: 'AI-assisted, never authoritative',
    description: 'Wrong answers get an instant AI-generated explanation, and exam scripts get an AI-suggested mark — but a teacher always makes the final call.',
  },
  {
    icon: CheckIcon,
    title: 'Deterministic quiz marking',
    description: 'Every quiz is marked the same way, every time. No ambiguity, no guesswork — just a fair, consistent score.',
  },
  {
    icon: AnalyticsIcon,
    title: 'Real classroom insight',
    description: 'Teachers and school admins see live class performance, completion rates, and question-level breakdowns — not just raw grades.',
  },
]

const audiences = [
  {
    icon: StudentsIcon,
    title: 'For Students',
    description: 'Study your downloaded lessons anywhere, complete mini-quizzes to unlock the next section, and get help the moment you get stuck.',
  },
  {
    icon: UsersIcon,
    title: 'For Teachers',
    description: 'Author lessons and quizzes, mark exam scripts faster with AI-assisted suggestions, and track how every class is really doing.',
  },
  {
    icon: SchoolsIcon,
    title: 'For Schools',
    description: 'Manage classes, subjects, and staff accounts in one place, with school-wide analytics always up to date.',
  },
]

const bubbleConfigs = [
  { position: '-top-10 left-[8%] h-72 w-72', appearance: 'animate-float-a bg-blue-400/25 blur-3xl dark:bg-blue-500/20', depth: 24 },
  {
    position: 'top-1/3 right-[6%] h-56 w-56',
    appearance: 'animate-float-b bg-teal-400/25 blur-3xl dark:bg-teal-500/20',
    depth: 40,
    floatDelay: '-6s',
  },
  {
    position: 'bottom-0 left-[30%] h-64 w-64',
    appearance: 'animate-float-c bg-blue-300/25 blur-3xl dark:bg-blue-400/20',
    depth: 14,
    floatDelay: '-12s',
  },
]

function FloatingBubbles() {
  const containerRef = useRef<HTMLDivElement>(null)
  const wrapperRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    
    
    
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (window.matchMedia('(pointer: coarse)').matches) return

    function handleMouseMove(event: MouseEvent) {
      const rect = container!.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width - 0.5
      const y = (event.clientY - rect.top) / rect.height - 0.5
      wrapperRefs.current.forEach((el, index) => {
        if (!el) return
        const depth = bubbleConfigs[index].depth
        el.style.transform = `translate(${x * depth}px, ${y * depth}px)`
      })
    }

    function resetBubbles() {
      wrapperRefs.current.forEach((el) => {
        if (el) el.style.transform = 'translate(0, 0)'
      })
    }

    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseleave', resetBubbles)
    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseleave', resetBubbles)
    }
  }, [])

  return (
    <div ref={containerRef} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {bubbleConfigs.map((bubble, index) => (
        <div
          key={index}
          ref={(el) => {
            wrapperRefs.current[index] = el
          }}
          className={`absolute transition-transform duration-300 ease-out ${bubble.position}`}
        >
          <div
            className={`absolute inset-0 rounded-full ${bubble.appearance}`}
            style={bubble.floatDelay ? { animationDelay: bubble.floatDelay } : undefined}
          />
        </div>
      ))}
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950">
      {}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <img src="/soma-icon.png" alt="" className="h-7 w-7" />
            <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">SomaSync</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/login">
              <Button size="sm">Sign In</Button>
            </Link>
          </div>
        </div>
      </header>

      {

}
      <div
        aria-hidden="true"
        className="h-1.5 w-full"
        style={{
          backgroundImage:
            'linear-gradient(90deg, #1EB53A 0%, #1EB53A 35%, #FCD116 35%, #FCD116 42%, #000000 42%, #000000 58%, #FCD116 58%, #FCD116 65%, #00A3DD 65%, #00A3DD 100%)',
        }}
      />

      <main className="flex-1">
        {}
        <section className="relative isolate mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 overflow-hidden px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-2 lg:gap-16">
          {

}
          <FloatingBubbles />

          <div className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-left">
            <h1 className="text-4xl font-bold leading-tight text-slate-900 sm:text-5xl dark:text-slate-100">
              Learn anywhere.
              <br />
              Even without internet.
            </h1>
            <p className="max-w-md text-lg text-slate-600 dark:text-slate-400">
              SomaSync is an offline-first learning and assessment platform for secondary schools — built for real
              classrooms, real connectivity, and real low-end Android devices.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/login">
                <Button size="lg">Sign In</Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="ghost">
                  See how it works
                </Button>
              </a>
            </div>
          </div>

          {

}
          <div className="flex justify-center lg:justify-end">
            <img
              src="/soma-hero.jpeg"
              alt="SomaSync app preview"
              className="w-full max-w-lg rounded-2xl border border-slate-200 shadow-lg dark:border-slate-800"
            />
          </div>
        </section>

        {}
        <section id="features" className="border-t border-slate-200 bg-slate-50 px-4 py-16 sm:px-6 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Built for how real schools actually work
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {}
        <section className="px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-2xl font-semibold text-slate-900 dark:text-slate-100">One platform, every role</h2>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {audiences.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex flex-col items-center gap-3 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-md bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400">
                    <Icon aria-hidden="true" className="h-6 w-6" />
                  </span>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
                  <p className="max-w-xs text-sm text-slate-600 dark:text-slate-400">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {}
        <section className="border-t border-slate-200 bg-slate-900 px-4 py-14 text-center sm:px-6 dark:border-slate-800">
          <h2 className="text-2xl font-semibold text-white">Ready to get started?</h2>
          <p className="mt-2 text-sm text-slate-300">Sign in with the account provided by your school.</p>
          <Link to="/login" className="mt-6 inline-block">
            <Button size="lg">Sign In</Button>
          </Link>
        </section>
      </main>

      {}
      <footer className="border-t border-slate-200 px-4 py-8 sm:px-6 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-2">
            <img src="/soma-icon.png" alt="" className="h-5 w-5" />
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">SomaSync</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            &copy; {new Date().getFullYear()} SomaSync. Built for low-end Android devices and unreliable connections.
          </p>
        </div>
      </footer>
    </div>
  )
}
