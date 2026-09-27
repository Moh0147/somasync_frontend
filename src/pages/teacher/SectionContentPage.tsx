import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useParams } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useToast } from '@/components/feedback/Toast'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import {
  createContentBlock,
  deleteContentBlock,
  listAttachments,
  listContentBlocks,
  listLessonSections,
} from '@/services/lessonsService'
import { getApiErrorMessage } from '@/services/apiError'
import { resolveMediaUrl } from '@/services/mediaUrl'
import type { LessonAttachment, LessonSection } from '@/types/lesson'
import type { ContentBlockType, SectionContentBlock } from '@/types/lesson'

const blockTypeOptions: { value: ContentBlockType; label: string }[] = [
  { value: 'HEADING', label: 'Heading' },
  { value: 'TEXT', label: 'Text' },
  { value: 'KEY_POINT', label: 'Key point' },
  { value: 'IMAGE', label: 'Image' },
]

export default function SectionContentPage() {
  const { lessonId, sectionId } = useParams()
  const lessonIdNum = Number(lessonId)
  const sectionIdNum = Number(sectionId)
  const { showToast } = useToast()

  const [section, setSection] = useState<LessonSection | null>(null)
  const [blocks, setBlocks] = useState<SectionContentBlock[]>([])
  const [attachments, setAttachments] = useState<LessonAttachment[]>([])
  const [error, setError] = useState<string | null>(null)

  const [blockType, setBlockType] = useState<ContentBlockType>('TEXT')
  const [textValue, setTextValue] = useState('')
  const [imageAttachmentId, setImageAttachmentId] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  async function load() {
    setError(null)
    try {
      const [sections, blocksData, attachmentsData] = await Promise.all([
        listLessonSections(lessonIdNum),
        listContentBlocks(sectionIdNum),
        listAttachments(lessonIdNum),
      ])
      const found = sections.find((item) => item.id === sectionIdNum)
      if (!found) {
        setError('Section not found.')
        return
      }
      setSection(found)
      setBlocks(blocksData)
      setAttachments(attachmentsData)
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    load()
  }, [lessonIdNum, sectionIdNum])

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    if (blockType === 'IMAGE' && !imageAttachmentId) {
      setFormError('Select an attachment for the image block.')
      return
    }
    if (blockType !== 'IMAGE' && !textValue.trim()) {
      setFormError('Enter content for this block.')
      return
    }

    setIsCreating(true)
    try {
      const nextOrder = blocks.length === 0 ? 1 : Math.max(...blocks.map((block) => block.order)) + 1
      const created = await createContentBlock(sectionIdNum, {
        block_type: blockType,
        content: blockType === 'IMAGE' ? '' : textValue,
        image: blockType === 'IMAGE' ? Number(imageAttachmentId) : null,
        order: nextOrder,
      })
      setBlocks((current) => [...current, created])
      setTextValue('')
      setImageAttachmentId('')
      showToast('success', 'Content block added.')
    } catch (err) {
      setFormError(getApiErrorMessage(err))
    } finally {
      setIsCreating(false)
    }
  }

  async function handleDelete(blockId: number) {
    try {
      await deleteContentBlock(sectionIdNum, blockId)
      setBlocks((current) => current.filter((block) => block.id !== blockId))
      showToast('success', 'Content block removed.')
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    }
  }

  if (error) return <ErrorState description={error} onRetry={load} />
  if (!section) return <LoadingState message="Loading section…" />

  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order)

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb
        items={[
          { label: 'Lessons', href: '/teacher/lessons' },
          { label: 'Lesson', href: `/teacher/lessons/${lessonIdNum}` },
          { label: section.title },
        ]}
      />

      <Card>
        <CardHeader>
          <p className="text-sm font-semibold text-slate-900">Content blocks</p>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          {sortedBlocks.length === 0 && <EmptyState title="No content blocks yet." />}
          {sortedBlocks.length > 0 && (
            <ul className="divide-y divide-slate-100">
              {sortedBlocks.map((block) => (
                <li key={block.id} className="flex items-start justify-between gap-4 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{block.block_type}</p>
                    {block.block_type === 'IMAGE' ? (
                      block.image_reference ? (
                        <img
                          src={resolveMediaUrl(block.image_reference)}
                          alt=""
                          className="mt-1 h-24 rounded-md border border-slate-200 object-cover"
                        />
                      ) : (
                        <p className="text-slate-500">Image attachment unavailable.</p>
                      )
                    ) : (
                      <p className="mt-1 whitespace-pre-wrap text-slate-700">{block.content}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(block.id)}>
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleCreate} className="flex flex-col gap-4 border-t border-slate-100 pt-4" noValidate>
            <Select
              label="Block type"
              value={blockType}
              onChange={(event) => setBlockType(event.target.value as ContentBlockType)}
            >
              {blockTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            {blockType === 'IMAGE' ? (
              <Select
                label="Image attachment"
                value={imageAttachmentId}
                onChange={(event) => setImageAttachmentId(event.target.value)}
              >
                <option value="" disabled>
                  {attachments.length === 0 ? 'Upload an attachment on the lesson first' : 'Select an attachment'}
                </option>
                {attachments.map((attachment) => (
                  <option key={attachment.id} value={attachment.id}>
                    {attachment.file_name}
                  </option>
                ))}
              </Select>
            ) : (
              <Textarea
                label="Content"
                value={textValue}
                onChange={(event) => setTextValue(event.target.value)}
              />
            )}
            {formError && (
              <p role="alert" className="text-sm text-red-600">
                {formError}
              </p>
            )}
            <Button type="submit" disabled={isCreating} className="self-start">
              {isCreating ? 'Adding…' : 'Add block'}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
