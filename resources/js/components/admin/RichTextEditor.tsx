import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import Youtube from '@tiptap/extension-youtube'
import CharacterCount from '@tiptap/extension-character-count'
import { Iframe } from './tiptap/IframeExtension'
import { useCallback, useEffect, useRef } from 'react'
import { usePrompt } from '../ui/PromptModal'
import { useToast } from '../ui/Toast'
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Undo2,
  Video,
} from 'lucide-react'
import { api } from '../../lib/api'
import { cn } from '../../lib/utils'

type Props = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
}

function ToolbarBtn({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-lg text-body transition hover:bg-muted disabled:opacity-40',
        active && 'bg-brand-soft text-brand-dark',
      )}
    >
      {children}
    </button>
  )
}

export function RichTextEditor({ value, onChange, placeholder, className }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const { prompt } = usePrompt()
  const toast = useToast()

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-brand underline' },
      }),
      Image.configure({
        HTMLAttributes: { class: 'rounded-xl max-w-full h-auto' },
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Youtube.configure({
        width: 640,
        height: 360,
        HTMLAttributes: { class: 'rounded-xl overflow-hidden my-4' },
      }),
      Iframe,
      Placeholder.configure({
        placeholder: placeholder || 'Tulis isi konten di sini…',
      }),
      CharacterCount,
    ],
    content: value || '',
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          'prose-article min-h-[320px] max-w-none px-4 py-3 focus:outline-none',
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (value !== current && value !== undefined) {
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
  }, [value, editor])

  const setLink = useCallback(async () => {
    if (!editor) return
    const prev = editor.getAttributes('link').href as string | undefined
    const url = await prompt({
      title: 'Sisipkan tautan',
      message: 'Masukkan URL lengkap (https://…) atau kosongkan untuk menghapus tautan.',
      defaultValue: prev || 'https://',
      placeholder: 'https://contoh.sch.id/halaman',
      confirmLabel: 'Terapkan',
      required: false,
    })
    if (url === null) return
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      toast.info('Tautan dihapus.')
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
    toast.success('Tautan ditambahkan.')
  }, [editor, prompt, toast])

  const addYoutube = useCallback(async () => {
    if (!editor) return
    const url = await prompt({
      title: 'Sisipkan video YouTube',
      message: 'Tempel URL video YouTube.',
      placeholder: 'https://www.youtube.com/watch?v=…',
      confirmLabel: 'Sisipkan',
    })
    if (!url) return
    editor.commands.setYoutubeVideo({ src: url.trim() })
    toast.success('Video disisipkan.')
  }, [editor, prompt, toast])

  const addEmbed = useCallback(async () => {
    if (!editor) return
    const input = await prompt({
      title: 'Sisipkan Embed (Instagram / Iframe / Media)',
      message: 'Masukkan tautan postingan Instagram, video YouTube, Google Maps, Spotify, atau kode tag <iframe>.',
      placeholder: 'https://www.instagram.com/p/... atau <iframe src="..."></iframe>',
      confirmLabel: 'Sisipkan',
    })
    if (!input) return
    const trimmed = input.trim()

    // 1. Cek jika input adalah kode tag iframe lengkap: <iframe ... src="..." ...>
    const iframeSrcMatch = trimmed.match(/<iframe[^>]*\ssrc=["']([^"']+)["'][^>]*>/i)
    if (iframeSrcMatch) {
      const src = iframeSrcMatch[1]
      const widthMatch = trimmed.match(/\swidth=["']([^"']+)["']/i)
      const heightMatch = trimmed.match(/\sheight=["']([^"']+)["']/i)
      editor.commands.setIframe({
        src,
        width: widthMatch ? widthMatch[1] : '100%',
        height: heightMatch ? heightMatch[1] : '480',
      })
      toast.success('Iframe embed disisipkan.')
      return
    }

    // 2. Cek jika URL Instagram (Post, Reel, TV)
    const igMatch = trimmed.match(/instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/i)
    if (igMatch) {
      const type = igMatch[1].toLowerCase()
      const code = igMatch[2]
      const embedSrc = `https://www.instagram.com/${type}/${code}/embed`
      editor.commands.setIframe({
        src: embedSrc,
        width: '100%',
        height: '480',
      })
      toast.success('Postingan Instagram berhasil disisipkan.')
      return
    }

    // 3. Cek jika YouTube
    if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
      editor.commands.setYoutubeVideo({ src: trimmed })
      toast.success('Video YouTube disisipkan.')
      return
    }

    // 4. URL reguler lainnya (Google Maps, Spotify, Vimeo, dsb.)
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      editor.commands.setIframe({
        src: trimmed,
        width: '100%',
        height: '450',
      })
      toast.success('Embed media disisipkan.')
      return
    }

    toast.error('Format URL atau kode iframe tidak dikenali.')
  }, [editor, prompt, toast])

  const uploadImage = useCallback(
    async (file: File) => {
      if (!editor) return
      try {
        const form = new FormData()
        form.append('file', file)
        const { data } = await api.post('/admin/media', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        editor.chain().focus().setImage({ src: data.url, alt: file.name }).run()
        toast.success('Gambar disisipkan.')
      } catch {
        toast.error('Gagal mengunggah gambar.')
      }
    },
    [editor, toast],
  )

  if (!editor) return null

  const words = editor.storage.characterCount?.words?.() ?? 0
  const chars = editor.storage.characterCount?.characters?.() ?? 0

  return (
    <div className={cn('overflow-hidden rounded-[16px] border border-line bg-white', className)}>
      {/* Toolbar editor */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-line bg-peach-soft/60 p-2">
        <ToolbarBtn title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo2 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <Redo2 className="h-4 w-4" />
        </ToolbarBtn>
        <span className="mx-1 h-5 w-px bg-line" />

        <ToolbarBtn title="Heading 1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <Heading1 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn title="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn title="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="h-4 w-4" />
        </ToolbarBtn>
        <span className="mx-1 h-5 w-px bg-line" />

        <ToolbarBtn title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn title="Highlight" active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}>
          <Highlighter className="h-4 w-4" />
        </ToolbarBtn>
        <label className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg hover:bg-muted" title="Warna teks">
          <input
            type="color"
            className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0"
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          />
        </label>
        <span className="mx-1 h-5 w-px bg-line" />

        <ToolbarBtn title="Align left" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
          <AlignLeft className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn title="Align center" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
          <AlignCenter className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn title="Align right" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
          <AlignRight className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn title="Justify" active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
          <AlignJustify className="h-4 w-4" />
        </ToolbarBtn>
        <span className="mx-1 h-5 w-px bg-line" />

        <ToolbarBtn title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn title="Ordered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn title="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn title="Code block" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Code className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn title="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus className="h-4 w-4" />
        </ToolbarBtn>
        <span className="mx-1 h-5 w-px bg-line" />

        <ToolbarBtn title="Link" active={editor.isActive('link')} onClick={setLink}>
          <LinkIcon className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn title="Upload gambar" onClick={() => fileRef.current?.click()}>
          <ImageIcon className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn title="YouTube embed" onClick={addYoutube}>
          <Video className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn title="Embed (Instagram, Maps, Iframe)" onClick={addEmbed}>
          <Code2 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Tabel"
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
        >
          <TableIcon className="h-4 w-4" />
        </ToolbarBtn>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void uploadImage(f)
            e.target.value = ''
          }}
        />
      </div>

      <EditorContent editor={editor} />

      <div className="flex justify-between border-t border-line bg-page px-3 py-1.5 text-xs text-subtle">
        <span>Editor teks berformat — tebal, tautan, tabel, gambar, video</span>
        <span>
          {words} kata · {chars} karakter
        </span>
      </div>
    </div>
  )
}
