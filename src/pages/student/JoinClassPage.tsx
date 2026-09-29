import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { useToast } from '@/components/feedback/Toast'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { JoinClassIcon } from '@/components/ui/icons'
import { getApiErrorMessage } from '@/services/apiError'
import { joinClass } from '@/services/classesService'

export default function JoinClassPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const joined = await joinClass(code.trim())
      showToast('success', `You've joined ${joined.name}.`)
      navigate('/student')
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Join a class</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Ask your teacher for your class code, then enter it below to join.
        </p>
      </div>

      <Card>
        <CardBody>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex items-center justify-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <JoinClassIcon aria-hidden="true" className="h-6 w-6" />
              </span>
            </div>
            <Input
              label="Class code"
              placeholder="e.g. FIBIQRRU"
              required
              autoFocus
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              error={error ?? undefined}
              className="text-center text-base font-semibold tracking-widest uppercase"
            />
            <Button type="submit" disabled={isSubmitting || !code.trim()}>
              {isSubmitting ? 'Joining…' : 'Join class'}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
