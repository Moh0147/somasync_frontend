import { useEffect, useRef, useState } from 'react'

import { EmptyState } from '@/components/feedback/EmptyState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useToast } from '@/components/feedback/Toast'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { TrashIcon } from '@/components/ui/icons'
import { listStudentsForClasses, listClasses } from '@/services/classesService'
import type { StudentWithClass } from '@/services/classesService'
import { getApiErrorMessage } from '@/services/apiError'
import { bulkAddCandidates, removeCandidate } from '@/services/examsService'
import type { ExamCandidate } from '@/types/exam'

export function CandidatesPanel({
  examId,
  examClassLevel,
  candidates,
  onChanged,
}: {
  examId: number
  examClassLevel?: number
  candidates: ExamCandidate[]
  onChanged: () => void
}) {
  const { showToast } = useToast()

  const [students, setStudents] = useState<StudentWithClass[] | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [prefix, setPrefix] = useState('F4A')
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [enrollResult, setEnrollResult] = useState<{ enrolled: string[]; skipped: string[]; errors: string[] } | null>(null)

  const selectAllRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    listClasses()
      .then((classes) => listStudentsForClasses(classes))
      .then(setStudents)
      .catch(() => setStudents([]))
  }, [])

  const enrolledStudentIds = new Set(candidates.map((c) => c.student))
  const available = (students ?? []).filter(
    (s) =>
      !enrolledStudentIds.has(s.student.id) &&
      (examClassLevel == null || s.schoolClass.class_level === examClassLevel),
  )

  useEffect(() => {
    const el = selectAllRef.current
    if (!el) return
    el.indeterminate = selectedIds.size > 0 && selectedIds.size < available.length
  }, [selectedIds.size, available.length])

  function toggleAll() {
    if (selectedIds.size === available.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(available.map((s) => s.student.id)))
    }
  }

  function toggleOne(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function buildEntries() {
    const selected = available.filter((s) => selectedIds.has(s.student.id))
    const startIndex = candidates.length + 1
    const pre = prefix.trim() ? `${prefix.trim()}-` : ''
    return selected.map((s, i) => ({
      student: s.student.id,
      candidate_number: `${pre}${String(startIndex + i).padStart(3, '0')}`,
    }))
  }

  async function handleEnroll() {
    const entries = buildEntries()
    if (!entries.length) return
    setIsEnrolling(true)
    setEnrollResult(null)
    try {
      const result = await bulkAddCandidates(examId, entries)
      setEnrollResult(result)
      if (result.enrolled.length > 0) {
        setSelectedIds(new Set())
        onChanged()
        showToast('success', `Wagombea ${result.enrolled.length} wamesajiliwa.`)
      }
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setIsEnrolling(false)
    }
  }

  async function handleRemove(candidateNumber: string) {
    try {
      await removeCandidate(examId, candidateNumber)
      showToast('success', 'Mgombea ameondolewa.')
      onChanged()
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    }
  }

  const preview = buildEntries()

  return (
    <Card>
      <CardHeader>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Wagombea (Candidates)
          {candidates.length > 0 && (
            <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
              {candidates.length}
            </span>
          )}
        </p>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">

        {/* Enrolled list */}
        {candidates.length === 0 ? (
          <EmptyState title="Hakuna wagombea bado." description="Chagua wanafunzi hapa chini." />
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
            {candidates.map((candidate) => (
              <li key={candidate.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                    {candidate.candidate_number.slice(-2)}
                  </span>
                  <p className="font-mono text-sm font-medium text-slate-900 dark:text-slate-100">
                    {candidate.candidate_number}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleRemove(candidate.candidate_number)}>
                  <TrashIcon className="h-3.5 w-3.5" />
                  Ondoa
                </Button>
              </li>
            ))}
          </ul>
        )}

        {/* Enroll section */}
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex flex-wrap items-end gap-3">
            <Input
              label="Prefix ya namba"
              placeholder="e.g. F4A"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              className="w-28"
            />
            <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">
              Namba zitaonekana kama: <span className="font-mono">{prefix.trim() ? `${prefix.trim()}-` : ''}{String(candidates.length + 1).padStart(3, '0')}</span>, <span className="font-mono">{prefix.trim() ? `${prefix.trim()}-` : ''}{String(candidates.length + 2).padStart(3, '0')}</span>, …
            </p>
          </div>

          {students === null && <LoadingState message="Inapakia wanafunzi…" />}

          {students !== null && available.length === 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {students.length === 0
                ? 'Hakuna wanafunzi kwenye shule hii.'
                : 'Wanafunzi wote wamesajiliwa tayari.'}
            </p>
          )}

          {students !== null && available.length > 0 && (
            <>
              <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                {/* Select-all row */}
                <label className="flex cursor-pointer items-center gap-3 border-b border-slate-200 px-3 py-2 dark:border-slate-700">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={available.length > 0 && selectedIds.size === available.length}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Chagua wote ({available.length})
                  </span>
                  {selectedIds.size > 0 && (
                    <span className="ml-auto text-xs text-slate-400">{selectedIds.size} waliochaguliwa</span>
                  )}
                </label>

                <ul className="max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {available.map((s) => {
                    const sid = s.student.id
                    const isSelected = selectedIds.has(sid)
                    const idx = preview.findIndex((e) => e.student === sid)
                    const genNumber = isSelected && idx >= 0 ? preview[idx].candidate_number : null
                    return (
                      <li key={sid}>
                        <label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleOne(sid)}
                            className="h-4 w-4 rounded border-slate-300"
                          />
                          {genNumber ? (
                            <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 w-20 shrink-0">
                              {genNumber}
                            </span>
                          ) : (
                            <span className="w-20 shrink-0" />
                          )}
                          <span className="truncate text-sm text-slate-800 dark:text-slate-200">
                            {s.student.first_name} {s.student.last_name}
                          </span>
                          <span className="ml-auto shrink-0 text-xs text-slate-400">{s.schoolClass.name}</span>
                        </label>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {enrollResult && (
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900">
                  {enrollResult.enrolled.length > 0 && (
                    <p className="text-green-700 dark:text-green-400">
                      Walisajiliwa ({enrollResult.enrolled.length}): {enrollResult.enrolled.join(', ')}
                    </p>
                  )}
                  {enrollResult.skipped.length > 0 && (
                    <p className="mt-1 text-slate-500">
                      Walikuwepo tayari ({enrollResult.skipped.length}): {enrollResult.skipped.join(', ')}
                    </p>
                  )}
                  {enrollResult.errors.length > 0 && (
                    <p className="mt-1 text-red-600 dark:text-red-400">
                      Makosa: {enrollResult.errors.join('; ')}
                    </p>
                  )}
                </div>
              )}

              <Button
                size="sm"
                disabled={selectedIds.size === 0 || isEnrolling}
                onClick={handleEnroll}
              >
                {isEnrolling ? 'Inasajili…' : `Sajili waliochaguliwa (${selectedIds.size})`}
              </Button>
            </>
          )}
        </div>

      </CardBody>
    </Card>
  )
}
