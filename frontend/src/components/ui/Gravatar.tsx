import { cn } from '../../lib/utils'

type Props = {
  email?: string
  url?: string | null
  name?: string
  size?: number
  className?: string
  alt?: string
}

/**
 * Profil pic wajib Gravatar.
 * Prioritas: url dari API (gravatar_url) → generate dari email di server.
 */
export function Gravatar({ email, url, name, size = 40, className, alt }: Props) {
  const src =
    url ||
    (email
      ? // Backend always supplies gravatar_url; client fallback without md5 uses mystery person
        `https://www.gravatar.com/avatar/?s=${size * 2}&d=mp`
      : `https://www.gravatar.com/avatar/?s=${size * 2}&d=mp`)

  return (
    <img
      src={src}
      alt={alt || name || 'Avatar'}
      width={size}
      height={size}
      className={cn('rounded-full object-cover bg-muted ring-2 ring-white shadow-sm', className)}
      style={{ width: size, height: size }}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  )
}
