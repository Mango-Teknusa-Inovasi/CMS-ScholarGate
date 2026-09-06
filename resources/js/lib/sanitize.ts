import DOMPurify from 'dompurify'

/** Tag yang diizinkan untuk konten CMS (artikel, profil, sambutan). */
const ALLOWED_TAGS = [
  'p', 'br', 'hr', 'div', 'span', 'section',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 'u', 's', 'mark', 'sub', 'sup',
  'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
  'a', 'img', 'figure', 'figcaption',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'colgroup', 'col',
  'iframe', // YouTube embed dari editor
]

const ALLOWED_ATTR = [
  'href', 'target', 'rel', 'title', 'class', 'id',
  'src', 'alt', 'width', 'height', 'loading',
  'colspan', 'rowspan', 'scope',
  'allow', 'allowfullscreen', 'frameborder', 'referrerpolicy', 'scrolling',
  'style', // tip tap inline styles (color, text-align) — DOMPurify strip XSS dari style
]

/**
 * Sanitize HTML dari CMS sebelum render (mitigasi stored XSS).
 */
export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return ''

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    // Hanya http(s), mailto, tel, relative paths — blok javascript:
    ALLOWED_URI_REGEXP:
      /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ADD_ATTR: ['target'],
    FORBID_TAGS: ['script', 'style', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  })
}

/**
 * Plain text → HTML aman (newline → br).
 */
export function plainToSafeHtml(text: string | null | undefined): string {
  if (!text) return ''
  if (text.includes('<')) return sanitizeHtml(text)
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
  return escaped.replace(/\n/g, '<br/>')
}

/**
 * URL aman untuk href — blok javascript:, data:, vbscript:.
 * Relative path `/...` dan http(s) diizinkan.
 */
export function safeHref(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  const trimmed = url.trim()
  if (!trimmed || trimmed === '#') return undefined

  const lower = trimmed.toLowerCase()
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return undefined
  }

  // Protocol-relative //evil.com — treat as external https only if intentional
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`
  }

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed
  }

  if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed) || /^tel:/i.test(trimmed)) {
    return trimmed
  }

  // Bare domain without scheme — force https
  if (/^[a-z0-9.-]+\.[a-z]{2,}([/:?]|$)/i.test(trimmed)) {
    return `https://${trimmed}`
  }

  return undefined
}
