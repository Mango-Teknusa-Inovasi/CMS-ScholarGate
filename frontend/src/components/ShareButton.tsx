import { useState } from 'react'
import { Check, Copy, Share2 } from 'lucide-react'
import { cn } from '../lib/utils'

type Props = {
  url?: string
  title?: string
  text?: string
  className?: string
}

/**
 * Bagikan: Web Share API (mobile) → fallback menu copy / WhatsApp / FB / X.
 */
export function ShareButton({ url, title, text, className }: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '')
  const shareTitle = title || (typeof document !== 'undefined' ? document.title : 'Scholargate')
  const shareText = text || shareTitle

  const copyLink = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl)
      } else {
        const ta = document.createElement('textarea')
        ta.value = shareUrl
        ta.style.position = 'fixed'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
        setOpen(false)
      }, 1600)
    } catch {
      window.prompt('Salin tautan ini:', shareUrl)
    }
  }

  const onShare = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        })
        return
      } catch (err) {
        // user cancelled or not supported path
        if ((err as Error)?.name === 'AbortError') return
      }
    }
    setOpen((v) => !v)
  }

  const encoded = encodeURIComponent(shareUrl)
  const encodedText = encodeURIComponent(shareText)

  return (
    <div className={cn('relative inline-flex', className)}>
      <button
        type="button"
        onClick={() => void onShare()}
        className="inline-flex items-center gap-2 rounded-[12px] border border-line bg-white px-3 py-2 text-sm font-medium text-body shadow-sm transition hover:bg-muted active:scale-[0.98]"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
        {copied ? 'Tersalin' : 'Bagikan'}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Tutup"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute left-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-[14px] border border-line bg-white py-1 shadow-[var(--shadow-card-hover)]"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => void copyLink()}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-ink hover:bg-muted"
            >
              <Copy className="h-4 w-4 text-sky-600" />
              Salin tautan
            </button>
            <a
              role="menuitem"
              href={`https://wa.me/?text=${encodedText}%20${encoded}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-ink hover:bg-muted"
            >
              <span className="flex h-4 w-4 items-center justify-center text-[11px] font-bold text-emerald-600">
                WA
              </span>
              WhatsApp
            </a>
            <a
              role="menuitem"
              href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-ink hover:bg-muted"
            >
              <span className="flex h-4 w-4 items-center justify-center text-[11px] font-bold text-indigo-600">
                f
              </span>
              Facebook
            </a>
            <a
              role="menuitem"
              href={`https://twitter.com/intent/tweet?url=${encoded}&text=${encodedText}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-ink hover:bg-muted"
            >
              <span className="flex h-4 w-4 items-center justify-center text-[11px] font-bold text-sky-500">
                𝕏
              </span>
              X / Twitter
            </a>
          </div>
        </>
      )}
    </div>
  )
}
