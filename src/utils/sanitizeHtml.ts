/** Keep lesson formatting rich while stripping scripts, event handlers, and unsafe URLs. */
export function sanitizeLessonHtml(value: string): string {
  if (typeof window === 'undefined') return value
  const doc = new DOMParser().parseFromString(value, 'text/html')
  doc.querySelectorAll('script, style, iframe, object, embed, form').forEach((node) => node.remove())
  doc.querySelectorAll<HTMLElement>('*').forEach((node) => {
    Array.from(node.attributes).forEach((attribute) => {
      if (attribute.name.toLowerCase().startsWith('on')) node.removeAttribute(attribute.name)
    })
    if (node.tagName === 'A') {
      const href = node.getAttribute('href') ?? ''
      if (!/^(https?:|mailto:|#)/i.test(href)) node.removeAttribute('href')
      node.setAttribute('target', '_blank')
      node.setAttribute('rel', 'noreferrer')
    }
    if (node.tagName === 'IMG') {
      const src = node.getAttribute('src') ?? ''
      if (!/^(https?:|data:image\/)/i.test(src)) node.removeAttribute('src')
    }
  })
  return doc.body.innerHTML
}
