import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useParams } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useToast } from '@/components/feedback/Toast'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import {
  createContentBlock,
  deleteContentBlock,
  listAttachments,
  listContentBlocks,
  listLessonSections,
  uploadAttachment,
} from '@/services/lessonsService'
import { getApiErrorMessage } from '@/services/apiError'
import { resolveMediaUrl } from '@/services/mediaUrl'
import type { LessonAttachment, LessonSection } from '@/types/lesson'
import type { ContentBlockType, SectionContentBlock } from '@/types/lesson'
import { sanitizeLessonHtml } from '@/utils/sanitizeHtml'
import { AlignCenterIcon, AlignJustifyIcon, AlignLeftIcon, AlignRightIcon, ListIcon, ListOrderedIcon } from '@/components/ui/editorIcons'

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
  const [isUploading, setIsUploading] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const selectionRef = useRef<Range | null>(null)

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

  function saveSelection() {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0 && editorRef.current?.contains(selection.anchorNode)) {
      selectionRef.current = selection.getRangeAt(0).cloneRange()
    }
  }

  function restoreSelection() {
    editorRef.current?.focus()
    const selection = window.getSelection()
    if (selection && selectionRef.current) {
      selection.removeAllRanges()
      selection.addRange(selectionRef.current)
    }
  }

  function format(command: string, value?: string) {
    restoreSelection()
    
    
    const commandValue = command === 'formatBlock' && value ? `<${value}>` : value
    const applied = document.execCommand(command, false, commandValue)
    if (!applied && command === 'formatBlock' && value) document.execCommand(command, false, value)
    saveSelection()
  }

  async function handleImageSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setIsUploading(true)
    try {
      const attachment = await uploadAttachment(lessonIdNum, file)
      setAttachments((current) => [...current, attachment])
      setBlockType('TEXT')
      editorRef.current?.focus()
      document.execCommand('insertHTML', false, `<img src="${resolveMediaUrl(attachment.file_reference)}" alt="${attachment.file_name}" />`)
      setTextValue(editorRef.current?.innerHTML ?? '')
      showToast('success', 'Image inserted into your notes.')
    } catch (err) {
      setFormError(getApiErrorMessage(err))
    } finally {
      setIsUploading(false)
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    if (blockType === 'IMAGE' && !imageAttachmentId) {
      setFormError('Select an attachment for the image block.')
      return
    }
    const richContent = editorRef.current?.innerHTML ?? textValue
    if (blockType !== 'IMAGE' && !editorRef.current?.innerText.trim() && !textValue.trim()) {
      setFormError('Enter content for this block.')
      return
    }

    setIsCreating(true)
    try {
      const nextOrder = blocks.length === 0 ? 1 : Math.max(...blocks.map((block) => block.order)) + 1
      const created = await createContentBlock(sectionIdNum, {
        block_type: blockType,
        content: blockType === 'IMAGE' ? '' : (richContent || textValue),
        image: blockType === 'IMAGE' ? Number(imageAttachmentId) : null,
        order: nextOrder,
      })
      setBlocks((current) => [...current, created])
      setTextValue('')
      if (editorRef.current) editorRef.current.innerHTML = ''
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
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{section.title}</h1>

      <Card>
        <CardHeader>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Content blocks</p>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          {sortedBlocks.length === 0 && <EmptyState title="No content blocks yet." />}
          {sortedBlocks.length > 0 && (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedBlocks.map((block) => (
                <li key={block.id} className="flex items-start justify-between gap-4 py-3 text-sm">
                  <div className="min-w-0 flex-1 overflow-x-hidden">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{block.block_type}</p>
                    {block.block_type === 'IMAGE' ? (
                      block.image_reference ? (
                        <img
                          src={resolveMediaUrl(block.image_reference)}
                          alt=""
                          className="mt-1 max-w-full rounded-md border border-slate-200 object-cover dark:border-slate-800"
                        />
                      ) : (
                        <p className="text-slate-500 dark:text-slate-400">Image attachment unavailable.</p>
                      )
                    ) : (
                      <div
                        className="prose prose-sm mt-1 max-w-none break-words text-slate-700 dark:prose-invert dark:text-slate-300 [&_img]:max-w-full [&_img]:h-auto [&_pre]:overflow-x-auto [&_table]:w-full [&_*]:max-w-full"
                        dangerouslySetInnerHTML={{ __html: sanitizeLessonHtml(block.content) }}
                      />
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="shrink-0" onClick={() => handleDelete(block.id)}>
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleCreate} className="flex flex-col gap-4 border-t border-slate-100 pt-4 dark:border-slate-800" noValidate>
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
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Content</span>
                <div className="flex items-center gap-1 overflow-x-auto rounded-t-md border border-b-0 border-slate-300 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800">
                  {[
                    ['bold', 'B', 'font-bold'], ['italic', 'I', 'italic'], ['underline', 'U', 'underline'],
                  ].map(([command, label, style]) => (
                    <button key={command} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => format(command)} className={`h-8 shrink-0 min-w-8 rounded px-2 text-sm text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-slate-700 ${style}`} aria-label={command}>{label}</button>
                  ))}
                  <span className="mx-1 h-5 w-px shrink-0 bg-slate-300 dark:bg-slate-600" />
                  <select aria-label="Font style" defaultValue="" onMouseDown={saveSelection} onChange={(event) => { format('fontName', event.target.value); event.currentTarget.value = '' }} className="h-8 w-[80px] shrink-0 rounded border border-slate-300 bg-white px-2 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">
                    <option value="" disabled>Font</option>
                    <option value="Arial">Arial</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Tahoma">Tahoma</option>
                    <option value="Times New Roman">Times NR</option>
                    <option value="Verdana">Verdana</option>
                  </select>
                  <select aria-label="Font size" defaultValue="" onMouseDown={saveSelection} onChange={(event) => { format('fontSize', event.target.value); event.currentTarget.value = '' }} className="h-8 w-[64px] shrink-0 rounded border border-slate-300 bg-white px-2 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">
                    <option value="" disabled>Size</option>
                    <option value="1">Small</option>
                    <option value="3">Normal</option>
                    <option value="5">Large</option>
                    <option value="7">Huge</option>
                  </select>
                  <label title="Text color" className="flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded border border-slate-300 bg-white px-2 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">
                    <span className="font-semibold">A</span><input aria-label="Text color" type="color" defaultValue="#1e293b" onMouseDown={saveSelection} onChange={(event) => format('foreColor', event.target.value)} className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0" />
                  </label>
                  <label title="Highlight color" className="flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded border border-slate-300 bg-white px-2 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">
                    <span className="rounded bg-yellow-200 px-1 font-semibold">H</span><input aria-label="Highlight color" type="color" defaultValue="#fef08a" onMouseDown={saveSelection} onChange={(event) => format('hiliteColor', event.target.value)} className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0" />
                  </label>
                  <span className="mx-1 h-5 w-px shrink-0 bg-slate-300 dark:bg-slate-600" />
                  <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => format('formatBlock', 'h2')} className="h-8 shrink-0 rounded px-2 text-xs font-semibold text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-slate-700">H2</button>
                  <button type="button" title="Bulleted list" aria-label="Bulleted list" onMouseDown={(event) => event.preventDefault()} onClick={() => format('insertUnorderedList')} className="flex h-8 shrink-0 items-center gap-1 rounded px-2 text-xs text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-slate-700"><ListIcon aria-hidden="true" className="h-4 w-4" /></button>
                  <button type="button" title="Numbered list" aria-label="Numbered list" onMouseDown={(event) => event.preventDefault()} onClick={() => format('insertOrderedList')} className="flex h-8 shrink-0 items-center gap-1 rounded px-2 text-xs text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-slate-700"><ListOrderedIcon aria-hidden="true" className="h-4 w-4" /></button>
                  <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => format('formatBlock', 'blockquote')} className="h-8 shrink-0 rounded px-2 text-xs text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-slate-700">"</button>
                  <span className="mx-1 h-5 w-px shrink-0 bg-slate-300 dark:bg-slate-600" />
                  <span className="sr-only">Alignment</span>
                  {[[ 'justifyLeft', AlignLeftIcon, 'Align left' ], [ 'justifyCenter', AlignCenterIcon, 'Align center' ], [ 'justifyRight', AlignRightIcon, 'Align right' ], [ 'justifyFull', AlignJustifyIcon, 'Justify' ]].map(([command, Icon, title]) => (
                    <button key={command as string} type="button" title={title as string} aria-label={title as string} onMouseDown={(event) => event.preventDefault()} onClick={() => format(command as string)} className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded px-2 text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-slate-700"><Icon aria-hidden="true" className="h-4 w-4" /></button>
                  ))}
                  <span className="mx-1 h-5 w-px shrink-0 bg-slate-300 dark:bg-slate-600" />
                  <button type="button" onClick={() => imageInputRef.current?.click()} disabled={isUploading} className="h-8 shrink-0 rounded px-2 text-xs text-blue-700 hover:bg-white disabled:opacity-50 dark:text-blue-300 dark:hover:bg-slate-700">{isUploading ? '…' : '＋ Img'}</button>
                  <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelected} />
                </div>
                <div ref={editorRef} contentEditable role="textbox" aria-multiline="true" suppressContentEditableWarning onInput={(event) => { setTextValue(event.currentTarget.innerHTML); saveSelection() }} onKeyUp={saveSelection} onMouseUp={saveSelection} data-placeholder="Write your lesson notes here…" className="lesson-editor-content min-h-48 rounded-b-md border border-slate-300 bg-white px-3 py-3 text-sm leading-7 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 [&:empty]:before:pointer-events-none [&:empty]:before:text-slate-400 [&:empty]:before:content-[attr(data-placeholder)]" />
                <p className="text-xs text-slate-500 dark:text-slate-400">Format text, choose fonts, sizes, colors, highlights, align paragraphs, add lists, quotes, headings, and upload images.</p>
              </div>
            )}
            {formError && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
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