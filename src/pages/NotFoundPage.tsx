import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/Button'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-4 text-center dark:bg-slate-950">
      <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Page not found.</h1>
      <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">The page you're looking for doesn't exist or may have moved.</p>
      <Link to="/">
        <Button variant="secondary">Go home</Button>
      </Link>
    </div>
  )
}
