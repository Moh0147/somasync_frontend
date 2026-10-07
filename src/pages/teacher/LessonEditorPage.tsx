import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useToast } from '@/components/feedback/Toast'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DescriptionList } from '@/components/ui/DescriptionList'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Textarea } from '@/components/ui/Textarea'
import { UploadIcon } from '@/components/ui/icons'
import { listClassLevels, listSubjects, listTopics } from '@/services/academicsService'
import { getApiErrorMessage } from '@/services/apiError'
import { resolveMediaUrl } from '@/services/mediaUrl'
import {
  archiveLesson,
  createSection,
  deleteAttachment,
  deleteLesson,
  deleteSection,
  getLesson,
  listAttachments,
  listLessonSections,
  publishLesson,
  swapSectionOrder,
  updateLesson,
  uploadAttachment,
} from '@/services/lessonsService'
import type { ClassLevel, Subject, Topic } from '@/types/academics'
import type { Lesson, LessonAttachment, LessonSection } from '@/types/lesson'
import { formatBytes } from '@/utils/formatBytes'

export default function LessonEditorPage() {
  const { lessonId } = useParams()
  const id = Number(lessonId)
  const navigate = useNavigate()
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [sections, setSections] = useState<LessonSection[]>([])
  const [attachments, setAttachments] = useState<LessonAttachment[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [error, setError] = useState<string | null>(null)

  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', description: '' })
  const [editError, setEditError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [isPublishing, setIsPublishing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isReordering, setIsReordering] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [sectionModalOpen, setSectionModalOpen] = useState(false)
  const [sectionTitle, setSectionTitle] = useState('')
  const [sectionError, setSectionError] = useState<string | null>(null)
  const [isCreatingSection, setIsCreatingSection] = useState(false)

  async function load() {
    setError(null)
    try {
      const [lessonData, sectionsData, attachmentsData, subjectsData, levelsData, topicsData] = await Promise.all([
        getLesson(id),
        listLessonSections(id),
        listAttachments(id),
        listSubjects(),
        listClassLevels(),
        listTopics(),
      ])
      setLesson(lessonData)
      setSections(sectionsData)
      setAttachments(attachmentsData)
      setSubjects(subjectsData)
      setClassLevels(levelsData)
      setTopics(topicsData)
      setEditForm({ title: lessonData.title, description: lessonData.description })
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    load()
  }, [id])

  function subjectName(subjectId: number) {
    return subjects.find((subject) => subject.id === subjectId)?.name ?? `#${subjectId}`
  }
  function levelName(levelId: number) {
    return classLevels.find((level) => level.id === levelId)?.name ?? `#${levelId}`
  }
  function topicTitle(topicId: number | null) {
    if (!topicId) return '—'
    return topics.find((topic) => topic.id === topicId)?.title ?? `#${topicId}`
  }

  async function handleEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setEditError(null)
    setIsSaving(true)
    try {
      const updated = await updateLesson(id, editForm)
      setLesson(updated)
      setEditOpen(false)
      showToast('success', 'Lesson updated.')
    } catch (err) {
      setEditError(getApiErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  async function handlePublish() {
    setIsPublishing(true)
    try {
      const updated = await publishLesson(id)
      setLesson(updated)
      showToast('success', 'Lesson published.')
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setIsPublishing(false)
    }
  }

  async function handleArchive() {
    setIsPublishing(true)
    try {
      const updated = await archiveLesson(id)
      setLesson(updated)
      showToast('success', 'Lesson archived.')
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setIsPublishing(false)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await deleteLesson(id)
      showToast('success', 'Lesson deleted.')
      navigate('/teacher/lessons', { replace: true })
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
      setIsDeleting(false)
      setDeleteConfirmOpen(false)
    }
  }

  async function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setIsUploading(true)
    try {
      const attachment = await uploadAttachment(id, file)
      setAttachments((current) => [attachment, ...current])
      showToast('success', 'File uploaded.')
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setIsUploading(false)
    }
  }

  async function handleDeleteAttachment(attachmentId: number) {
    try {
      await deleteAttachment(id, attachmentId)
      setAttachments((current) => current.filter((attachment) => attachment.id !== attachmentId))
      showToast('success', 'Attachment removed.')
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    }
  }

  async function handleCreateSection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSectionError(null)
    setIsCreatingSection(true)
    try {
      const nextOrder = sections.length === 0 ? 1 : Math.max(...sections.map((section) => section.order)) + 1
      const created = await createSection({ lesson: id, title: sectionTitle, order: nextOrder })
      setSections((current) => [...current, created].sort((a, b) => a.order - b.order))
      setSectionModalOpen(false)
      setSectionTitle('')
      showToast('success', 'Section added.')
    } catch (err) {
      setSectionError(getApiErrorMessage(err))
    } finally {
      setIsCreatingSection(false)
    }
  }

  async function handleDeleteSection(sectionId: number) {
    try {
      await deleteSection(sectionId)
      setSections((current) => current.filter((section) => section.id !== sectionId))
      showToast('success', 'Section removed.')
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= sections.length) return
    setIsReordering(true)
    try {
      const sorted = [...sections].sort((a, b) => a.order - b.order)
      await swapSectionOrder(sorted[index], sorted[targetIndex])
      const reloaded = await listLessonSections(id)
      setSections(reloaded)
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setIsReordering(false)
    }
  }

  if (error) return <ErrorState description={error} onRetry={load} />
  if (!lesson) return <LoadingState message="Loading lesson…" />

  const sortedSections = [...sections].sort((a, b) => a.order - b.order)

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={lesson.title}
        description={subjectName(lesson.subject)}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            {lesson.status === 'DRAFT' && (
              <Button size="sm" disabled={isPublishing} onClick={handlePublish}>
                Publish
              </Button>
            )}
            {lesson.status === 'PUBLISHED' && (
              <Button variant="danger" size="sm" disabled={isPublishing} onClick={handleArchive}>
                Archive
              </Button>
            )}
            {lesson.status === 'DRAFT' && (
              <Button variant="danger" size="sm" onClick={() => setDeleteConfirmOpen(true)}>
                Delete
              </Button>
            )}
          </>
        }
      />

      <Card>
        <CardHeader className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Lesson details</p>
          <StatusBadge
            status={lesson.status === 'PUBLISHED' ? 'completed' : lesson.status === 'ARCHIVED' ? 'locked' : 'pending'}
            label={lesson.status}
          />
        </CardHeader>
        <CardBody>
          <DescriptionList
            items={[
              { label: 'Subject', value: subjectName(lesson.subject) },
              { label: 'Class level (Form)', value: levelName(lesson.class_level) },
              { label: 'Topic', value: topicTitle(lesson.topic) },
              { label: 'Description', value: lesson.description || '—' },
            ]}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Supporting attachments</p>
        </CardHeader>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelected} />
        <CardBody>
          {attachments.length === 0 ? (
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed border-slate-200 px-6 py-10 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:hover:border-blue-500 dark:hover:bg-blue-500/5"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <UploadIcon className="h-5 w-5" />
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {isUploading ? 'Uploading…' : 'Click to upload a file'}
              </span>
              <span className="mt-1 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
                {isUploading ? 'Uploading…' : 'Upload file'}
              </span>
            </button>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click() } }}
              tabIndex={0}
              role="button"
              aria-label="Upload attachment"
              className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
            >
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {attachments.map((attachment) => (
                  <li key={attachment.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <a
                        href={resolveMediaUrl(attachment.file_reference)}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {attachment.file_name}
                      </a>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatBytes(attachment.file_size)} · v{attachment.version}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); void handleDeleteAttachment(attachment.id) }}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-center border-t border-slate-100 pt-3 dark:border-slate-800">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-60 dark:text-blue-400 dark:hover:bg-blue-500/10"
                >
                  <UploadIcon className="h-4 w-4" />
                  {isUploading ? 'Uploading…' : 'Add file'}
                </button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Sections</p>
          <Button size="sm" onClick={() => setSectionModalOpen(true)}>
            Add section
          </Button>
        </CardHeader>
        <CardBody>
          {sortedSections.length === 0 && (
            <EmptyState title="No sections yet." description="Break this lesson into sections for the mastery-based reader." />
          )}
          {sortedSections.length > 0 && (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedSections.map((section, index) => (
                <li key={section.id} className="flex flex-col gap-2 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      Section {index + 1}: {section.title}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={index === 0 || isReordering}
                      onClick={() => handleMove(index, -1)}
                    >
                      Move up
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={index === sortedSections.length - 1 || isReordering}
                      onClick={() => handleMove(index, 1)}
                    >
                      Move down
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/teacher/lessons/${id}/sections/${section.id}`)}
                    >
                      Manage content
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/teacher/lessons/${id}/sections/${section.id}/quiz`)}
                    >
                      Mini-Quiz
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteSection(section.id)}>
                      Remove
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit lesson">
        <form onSubmit={handleEdit} className="flex flex-col gap-4" noValidate>
          <Input
            label="Title"
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
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {editError}
            </p>
          )}
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </Modal>

      <Modal open={sectionModalOpen} onClose={() => setSectionModalOpen(false)} title="Add section">
        <form onSubmit={handleCreateSection} className="flex flex-col gap-4" noValidate>
          <Input
            label="Section title"
            placeholder="Introduction"
            required
            value={sectionTitle}
            onChange={(event) => setSectionTitle(event.target.value)}
          />
          {sectionError && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {sectionError}
            </p>
          )}
          <Button type="submit" disabled={isCreatingSection}>
            {isCreatingSection ? 'Adding…' : 'Add section'}
          </Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete lesson"
        message="This permanently deletes the draft lesson and its sections. This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
