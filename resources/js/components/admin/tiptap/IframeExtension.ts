import { Node, mergeAttributes } from '@tiptap/core'

export interface IframeOptions {
  allowFullscreen: boolean
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    iframe: {
      setIframe: (options: { src: string; width?: string | number; height?: string | number }) => ReturnType
    }
  }
}

export const Iframe = Node.create<IframeOptions>({
  name: 'iframe',
  group: 'block',
  selectable: true,
  draggable: true,
  atom: true,

  addOptions() {
    return {
      allowFullscreen: true,
      HTMLAttributes: {
        class: 'w-full rounded-xl overflow-hidden my-4 border border-line',
      },
    }
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
      frameborder: {
        default: '0',
      },
      allowfullscreen: {
        default: this.options.allowFullscreen,
        parseHTML: (element) => element.hasAttribute('allowfullscreen'),
        renderHTML: (attributes) => {
          if (!attributes.allowfullscreen) return {}
          return { allowfullscreen: 'true' }
        },
      },
      width: {
        default: '100%',
      },
      height: {
        default: '480',
      },
      scrolling: {
        default: 'no',
      },
      style: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'iframe',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['iframe', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
  },

  addCommands() {
    return {
      setIframe:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          })
        },
    }
  },
})
