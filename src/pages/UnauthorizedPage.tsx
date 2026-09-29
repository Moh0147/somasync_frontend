import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/Button'

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-4 text-center dark:bg-slate-950">
      <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">You don't have access to this page.</h1>
      <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
        Your account role doesn't permit this section. Contact your school administrator if you think this is a
        mistake.
      </p>
      <Link to="/">
        <Button variant="secondary">Go back</Button>
      </Link>
    </div>
  )
}
