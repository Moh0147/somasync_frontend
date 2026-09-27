import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useToast } from '@/components/feedback/Toast'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Table } from '@/components/ui/Table'
import { createTopic, getSubject, listClassLevels, listTopics, updateSubject } from '@/services/academicsService'
import { getApiErrorMessage } from '@/services/apiError'
import type { ClassLevel, Subject, Topic } from '@/types/academics'

export default function SubjectDetailPage() {
  const { subjectId } = useParams()
  const id = Number(subjectId)
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [subject, setSubject] = useState<Subject | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([])
  const [error, setError] = useState<string | null>(null)

  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', code: '', curriculum_code: '' })
  const [editError, setEditError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  const [topicModalOpen, setTopicModalOpen] = useState(false)
  const [topicForm, setTopicForm] = useState({ title: '', class_level: '', description: '' })
  const [topicError, setTopicError] = useState<string | null>(null)
  const [isCreatingTopic, setIsCreatingTopic] = useState(false)

  async function load() {
    setError(null)
    try {
      const [subjectData, allTopics, levels] = await Promise.all([getSubject(id), listTopics(), listClassLevels()])
      setSubject(subjectData)
      setTopics(allTopics.filter((topic) => topic.subject === id))
      setClassLevels(levels)
      setEditForm({ name: subjectData.name, code: subjectData.code, curriculum_code: subjectData.curriculum_code })
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
      const updated = await updateSubject(id, editForm)
      setSubject(updated)
      setEditOpen(false)
      showToast('success', 'Subject updated.')
    } catch (err) {
      setEditError(getApiErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleToggleActive() {
    if (!subject) return
    setIsToggling(true)
    try {
      const updated = await updateSubject(id, { is_active: !subject.is_active })
      setSubject(updated)
      showToast('success', updated.is_active ? 'Subject activated.' : 'Subject deactivated.')
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setIsToggling(false)
    }
  }

  async function handleCreateTopic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTopicError(null)
    if (!topicForm.class_level) {
      setTopicError('Select a class level.')
      return
    }
    setIsCreatingTopic(true)
    try {
      const created = await createTopic({
        subject: id,
        class_level: Number(topicForm.class_level),
        title: topicForm.title,
        description: topicForm.description,
      })
      setTopics((current) => [...current, created])
      setTopicModalOpen(false)
      setTopicForm({ title: '', class_level: '', description: '' })
      showToast('success', 'Topic created.')
    } catch (err) {
      setTopicError(getApiErrorMessage(err))
    } finally {
      setIsCreatingTopic(false)
    }
  }

  if (error) return <ErrorState description={error} onRetry={load} />
  if (!subject) return <LoadingState message="Loading subject…" />

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={subject.name}
        description={subject.code}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Button
              variant={subject.is_active ? 'danger' : 'success'}
              size="sm"
              disabled={isToggling}
              onClick={handleToggleActive}
            >
              {subject.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">Topics</p>
          <Button size="sm" onClick={() => setTopicModalOpen(true)}>
            Add topic
          </Button>
        </CardHeader>
        <CardBody>
          {topics.length === 0 && <EmptyState title="No topics yet." />}
          {topics.length > 0 && (
            <Table
              columns={[
                {
                  key: 'title',
                  header: 'Topic',
                  render: (row: Topic) => (
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/subjects/${id}/topics/${row.id}`)}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {row.title}
                    </button>
                  ),
                },
                { key: 'level', header: 'Level', render: (row: Topic) => levelName(row.class_level) },
                {
                  key: 'status',
                  header: 'Status',
                  render: (row: Topic) => (
                    <StatusBadge status={row.is_active ? 'available' : 'locked'} label={row.is_active ? 'Active' : 'Inactive'} />
                  ),
                },
              ]}
              data={topics}
              getRowKey={(row) => String(row.id)}
            />
          )}
        </CardBody>
      </Card>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit subject">
        <form onSubmit={handleEdit} className="flex flex-col gap-4" noValidate>
          <Input
            label="Subject name"
            required
            value={editForm.name}
            onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
          />
          <Input
            label="Code"
            value={editForm.code}
            onChange={(event) => setEditForm({ ...editForm, code: event.target.value })}
          />
          <Input
            label="Curriculum code"
            value={editForm.curriculum_code}
            onChange={(event) => setEditForm({ ...editForm, curriculum_code: event.target.value })}
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

      <Modal open={topicModalOpen} onClose={() => setTopicModalOpen(false)} title="Add topic">
        <form onSubmit={handleCreateTopic} className="flex flex-col gap-4" noValidate>
          <Input
            label="Topic title"
            placeholder="Algebra"
            required
            value={topicForm.title}
            onChange={(event) => setTopicForm({ ...topicForm, title: event.target.value })}
          />
          <Select
            label="Class level"
            required
            value={topicForm.class_level}
            onChange={(event) => setTopicForm({ ...topicForm, class_level: event.target.value })}
          >
            <option value="" disabled>
              Select a level
            </option>
            {classLevels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))}
          </Select>
          <Input
            label="Description"
            value={topicForm.description}
            onChange={(event) => setTopicForm({ ...topicForm, description: event.target.value })}
          />
          {topicError && (
            <p role="alert" className="text-sm text-red-600">
              {topicError}
            </p>
          )}
          <Button type="submit" disabled={isCreatingTopic}>
            {isCreatingTopic ? 'Creating…' : 'Add topic'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
