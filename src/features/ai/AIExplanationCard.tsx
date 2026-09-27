import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/Button'
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
    <div className="flex flex-col gap-2 rounded-md border border-amber-200 bg-amber-50 p-3">
      <div>
        <p className="text-sm font-medium text-red-800">✗ Incorrect</p>
        <p className="mt-1 text-sm text-slate-700">{questionText}</p>
        {yourAnswerText && (
          <p className="mt-1 text-sm text-slate-600">
            Your answer: <span className="font-medium">{yourAnswerText}</span>
          </p>
        )}
        {staticExplanation && <p className="mt-1 text-sm text-slate-600">{staticExplanation}</p>}
      </div>

      {state === 'idle' && studentAnswerId !== null && (
        <Button size="sm" variant="secondary" onClick={handleExplain} className="self-start">
          💡 Explain My Mistake
        </Button>
      )}

      {state === 'generating' && <p className="text-sm text-amber-800">Generating an explanation…</p>}

      {state === 'offline' && (
        <p className="text-sm text-teal-800">
          ⚡ You're offline. Your explanation request has been saved and will be processed when you're online.
        </p>
      )}

      {state === 'failed' && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-red-700">{error}</p>
          <Button size="sm" variant="ghost" onClick={handleExplain} className="self-start">
            Try again
          </Button>
        </div>
      )}

      {state === 'ready' && explanation && (
        <div className="flex flex-col gap-1.5 border-t border-amber-200 pt-2">
          {explanation.correct_concept && (
            <p className="text-sm text-slate-700">
              Correct answer: <span className="font-medium">{explanation.correct_concept}</span>
            </p>
          )}
          <p className="text-sm text-slate-700">{explanation.explanation}</p>
          {explanation.concise_feedback && (
            <p className="text-sm font-medium text-amber-900">{explanation.concise_feedback}</p>
          )}
        </div>
      )}
    </div>
  )
}
