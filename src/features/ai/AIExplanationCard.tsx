import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { LightbulbIcon, OfflineIcon, WrongIcon } from '@/components/ui/icons'
import { db } from '@/db/db'
import { queueSync } from '@/db/offlineServices/syncQueueService'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { getApiErrorMessage } from '@/services/apiError'
import { requestExplanation } from '@/services/aiService'
import type { AIExplanationRequest } from '@/types/ai'

type CardState = 'idle' | 'generating' | 'ready' | 'queued' | 'offline' | 'failed'

function cacheKey(studentAnswerId: number) {
  return `ai.explanation.${studentAnswerId}`
}

interface AIExplanationCardProps {
  studentAnswerId: number | null
  questionText: string
  yourAnswerText?: string
  staticExplanation?: string
}

export function AIExplanationCard({
  studentAnswerId,
  questionText,
  yourAnswerText,
  staticExplanation,
}: AIExplanationCardProps) {
  const isOnline = useOnlineStatus()
  const [state, setState] = useState<CardState>('idle')
  const [explanation, setExplanation] = useState<AIExplanationRequest | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (studentAnswerId === null) return
    db.metadata.get(cacheKey(studentAnswerId)).then((cached) => {
      if (cached) {
        setExplanation(cached.value as AIExplanationRequest)
        setState('ready')
      }
    })
  }, [studentAnswerId])

  async function handleExplain() {
    if (studentAnswerId === null) return

    if (!isOnline) {
      await queueSync({
        entityType: 'aiExplanationRequest',
        entityId: studentAnswerId,
        operation: 'CREATE',
        payload: { studentAnswerId },
      })
      setState('offline')
      return
    }

    setState('generating')
    setError(null)
    try {
      const result = await requestExplanation(studentAnswerId)
      if (result.status === 'FAILED') {
        setError(result.error || 'Could not generate an explanation.')
        setState('failed')
        return
      }
      await db.metadata.put({ key: cacheKey(studentAnswerId), value: result })
      setExplanation(result)
      setState('ready')
    } catch (err) {
      setError(getApiErrorMessage(err))
      setState('failed')
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400">
          <WrongIcon aria-hidden="true" className="h-3.5 w-3.5" />
        </span>
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{questionText}</p>
          {yourAnswerText && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Your answer: <span className="font-medium text-slate-700 dark:text-slate-300">{yourAnswerText}</span>
            </p>
          )}
          {staticExplanation && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{staticExplanation}</p>}
        </div>
      </div>

      {state === 'idle' && studentAnswerId !== null && (
        <Button size="sm" variant="secondary" onClick={handleExplain} className="self-start">
          <LightbulbIcon aria-hidden="true" className="h-4 w-4" /> Explain My Mistake
        </Button>
      )}

      {state === 'generating' && (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-500/20 dark:bg-amber-500/10">
          <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-amber-300 border-t-amber-600 dark:border-amber-500/30 dark:border-t-amber-400" />
          <p className="text-sm text-amber-800 dark:text-amber-300">Generating an explanation…</p>
        </div>
      )}

      {state === 'offline' && (
        <p className="flex items-start gap-1.5 rounded-md border border-teal-200 bg-teal-50 px-3 py-2.5 text-sm text-teal-800 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300">
          <OfflineIcon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          You're offline. Your explanation request has been saved and will be processed when you're online.
        </p>
      )}

      {state === 'failed' && (
        <div className="flex flex-col gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 dark:border-red-500/20 dark:bg-red-500/10">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <Button size="sm" variant="ghost" onClick={handleExplain} className="self-start">
            Try again
          </Button>
        </div>
      )}

      {state === 'ready' && explanation && (
        <div className="flex flex-col gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
            <LightbulbIcon aria-hidden="true" className="h-3.5 w-3.5" /> Why your answer was incorrect
          </p>
          {explanation.correct_concept && (
            <p className="text-sm text-amber-900 dark:text-amber-200">
              Correct answer: <span className="font-semibold">{explanation.correct_concept}</span>
            </p>
          )}
          <p className="text-sm leading-relaxed text-amber-900 dark:text-amber-200">{explanation.explanation}</p>
          {explanation.concise_feedback && (
            <p className="border-t border-amber-200 pt-2 text-sm font-medium text-amber-900 dark:border-amber-500/20 dark:text-amber-200">
              Remember: {explanation.concise_feedback}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
