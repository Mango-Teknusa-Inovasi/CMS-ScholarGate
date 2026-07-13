import { sanitizeHtml, plainToSafeHtml } from '../../lib/sanitize'
import { cn } from '../../lib/utils'

type Props = {
  html?: string | null
  /** Jika true, plain text (tanpa tag) di-escape + newline → br */
  plainFallback?: boolean
  className?: string
  as?: 'div' | 'section' | 'article'
}

/**
 * Render HTML CMS yang sudah di-sanitize (DOMPurify).
 * Ganti semua dangerouslySetInnerHTML dengan komponen ini.
 */
export function SafeHtml({
  html,
  plainFallback = false,
  className,
  as: Tag = 'div',
}: Props) {
  const clean = plainFallback ? plainToSafeHtml(html) : sanitizeHtml(html)

  if (!clean) return null

  return (
    <Tag
      className={cn(className)}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  )
}
