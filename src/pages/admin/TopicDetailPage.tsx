import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useParams } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useToast } from '@/components/feedback/Toast'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Textarea } from '@/components/ui/Textarea'
import {
  createLearningObjective,
  listClassLevels,
  listLearningObjectives,
  listTopics,
  updateLearningObjective,
  updateTopic,
} from '@/services/academicsService'
import { getApiErrorMessage } from '@/services/apiError'
import type { ClassLevel, LearningObjective, Topic } from '@/types/academics'

export default function TopicDetailPage() {
  const { topicId } = useParams()
  const id = Number(topicId)
  const { showToast } = useToast()

  const [topic, setTopic] = useState<Topic | null>(null)
  const [objectives, setObjectives] = useState<LearningObjective[]>([])
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([])
  const [error, setError] = useState<string | null>(null)

  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', description: '' })
  const [editError, setEditError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  const [loModalOpen, setLoModalOpen] = useState(false)
  const [loForm, setLoForm] = useState({ description: '', competency_code: '' })
  const [loError, setLoError] = useState<string | null>(null)
  const [isCreatingLo, setIsCreatingLo] = useState(false)

  async function load() {
    setError(null)
    try {
      const [topics, allObjectives, levels] = await Promise.all([
        listTopics(),
        listLearningObjectives(),
        listClassLevels(),
      ])
      const found = topics.find((t) => t.id === id)
      if (!found) {
        setError('Topic not found.')
        return
      }
      setTopic(found)
      setObjectives(allObjectives.filter((objective) => objective.topic === id))
      setClassLevels(levels)
      setEditForm({ title: found.title, description: found.description })
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    load()
  }, [id])

  function levelName(levelId: number) {
    return classLevels.find((level) => level.id === levelId)?.name ?? `#${levelId}`
  }

  async function handleEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setEditError(null)
    setIsSaving(true)
    try {
      const updated = await updateTopic(id, editForm)
      setTopic(updated)
      setEditOpen(false)
      showToast('success', 'Topic updated.')
    } catch (err) {
      setEditError(getApiErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleToggleActive() {
    if (!topic) return
    setIsToggling(true)
    try {
      const updated = await updateTopic(id, { is_active: !topic.is_active })
      setTopic(updated)
      showToast('success', updated.is_active ? 'Topic activated.' : 'Topic deactivated.')
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setIsToggling(false)
    }
  }

  async function handleCreateObjective(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoError(null)
    setIsCreatingLo(true)
    try {
      const created = await createLearningObjective({ topic: id, ...loForm })
      setObjectives((current) => [...current, created])
      setLoModalOpen(false)
      setLoForm({ description: '', competency_code: '' })
      showToast('success', 'Learning objective added.')
    } catch (err) {
      setLoError(getApiErrorMessage(err))
    } finally {
      setIsCreatingLo(false)
    }
  }

  async function handleToggleObjective(objective: LearningObjective) {
    try {
      const updated = await updateLearningObjective(objective.id, { is_active: !objective.is_active })
      setObjectives((current) => current.map((item) => (item.id === updated.id ? updated : item)))
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    }
  }

  if (error) return <ErrorState description={error} onRetry={load} />
  if (!topic) return <LoadingState message="Loading topic…" />

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={topic.title}
        description={levelName(topic.class_level)}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Button
              variant={topic.is_active ? 'danger' : 'success'}
              size="sm"
              disabled={isToggling}
              onClick={handleToggleActive}
            >
              {topic.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">Learning objectives</p>
          <Button size="sm" onClick={() => setLoModalOpen(true)}>
            Add objective
          </Button>
        </CardHeader>
        <CardBody>
          {objectives.length === 0 && <EmptyState title="No learning objectives yet." />}
          {objectives.length > 0 && (
            <ul className="divide-y divide-slate-100">
              {objectives.map((objective) => (
                <li key={objective.id} className="flex items-start justify-between gap-4 py-2.5 text-sm">
                  <div>
                    <p className="text-slate-900">{objective.description}</p>
                    {objective.competency_code && (
                      <p className="text-xs text-slate-500">{objective.competency_code}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge
                      status={objective.is_active ? 'available' : 'locked'}
                      label={objective.is_active ? 'Active' : 'Inactive'}
                    />
                    <Button variant="ghost" size="sm" onClick={() => handleToggleObjective(objective)}>
                      {objective.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit topic">
        <form onSubmit={handleEdit} className="flex flex-col gap-4" noValidate>
          <Input
            label="Topic title"
            required
            value={editForm.title}
            onChange={(event) => setEditForm({ ...editForm, title: event.target.value })}
          />
          <Textarea
            label="Description"
            value={editForm.description}
            onChange={(event) => setEditForm({ ...editForm, description: event.target.value })}
          />
          {editError && (
            <p role="alert" className="text-sm text-red-600">
              {editError}
            </p>
          )}
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </Modal>

      <Modal open={loModalOpen} onClose={() => setLoModalOpen(false)} title="Add learning objective">
        <form onSubmit={handleCreateObjective} className="flex flex-col gap-4" noValidate>
          <Textarea
            label="Description"
            required
            value={loForm.description}
            onChange={(event) => setLoForm({ ...loForm, description: event.target.value })}
          />
          <Input
            label="Competency code"
            value={loForm.competency_code}
            onChange={(event) => setLoForm({ ...loForm, competency_code: event.target.value })}
          />
          {loError && (
            <p role="alert" className="text-sm text-red-600">
              {loError}
            </p>
          )}
          <Button type="submit" disabled={isCreatingLo}>
            {isCreatingLo ? 'Adding…' : 'Add objective'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
