/**
 * Soft colorful button tones — inspired by portal referensi (peach soft + pastel accents).
 * Solid = filled soft; soft = tinted pastel; outline = border pastel.
 */
export type ButtonTone =
  | 'sky'
  | 'teal'
  | 'mint'
  | 'coral'
  | 'amber'
  | 'violet'
  | 'rose'
  | 'indigo'
  | 'peach'
  | 'slate'

export const softTones: Record<
  ButtonTone,
  {
    solid: string
    soft: string
    outline: string
    /** icon chip / soft surface */
    chip: string
    hex: string
  }
> = {
  sky: {
    solid:
      'bg-sky-500 text-white shadow-[0_2px_10px_rgb(14_165_233/0.28)] hover:bg-sky-600',
    soft: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200/80 hover:bg-sky-100',
    outline: 'border border-sky-400/70 bg-white text-sky-600 hover:bg-sky-50',
    chip: 'bg-sky-50 text-sky-600',
    hex: '#0EA5E9',
  },
  teal: {
    solid:
      'bg-teal-500 text-white shadow-[0_2px_10px_rgb(20_184_166/0.28)] hover:bg-teal-600',
    soft: 'bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-200/80 hover:bg-teal-100',
    outline: 'border border-teal-400/70 bg-white text-teal-600 hover:bg-teal-50',
    chip: 'bg-teal-50 text-teal-600',
    hex: '#14B8A6',
  },
  mint: {
    solid:
      'bg-emerald-500 text-white shadow-[0_2px_10px_rgb(16_185_129/0.28)] hover:bg-emerald-600',
    soft: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/80 hover:bg-emerald-100',
    outline: 'border border-emerald-400/70 bg-white text-emerald-600 hover:bg-emerald-50',
    chip: 'bg-emerald-50 text-emerald-600',
    hex: '#10B981',
  },
  coral: {
    solid:
      'bg-rose-500 text-white shadow-[0_2px_10px_rgb(244_63_94/0.25)] hover:bg-rose-600',
    soft: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200/80 hover:bg-rose-100',
    outline: 'border border-rose-400/80 bg-white text-rose-500 hover:bg-rose-50',
    chip: 'bg-rose-50 text-rose-500',
    hex: '#F43F5E',
  },
  amber: {
    solid:
      'bg-amber-500 text-white shadow-[0_2px_10px_rgb(245_158_11/0.28)] hover:bg-amber-600',
    soft: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200/80 hover:bg-amber-100',
    outline: 'border border-amber-400/80 bg-white text-amber-700 hover:bg-amber-50',
    chip: 'bg-amber-50 text-amber-600',
    hex: '#F59E0B',
  },
  violet: {
    solid:
      'bg-violet-500 text-white shadow-[0_2px_10px_rgb(139_92_246/0.28)] hover:bg-violet-600',
    soft: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200/80 hover:bg-violet-100',
    outline: 'border border-violet-400/70 bg-white text-violet-600 hover:bg-violet-50',
    chip: 'bg-violet-50 text-violet-600',
    hex: '#8B5CF6',
  },
  rose: {
    solid:
      'bg-pink-500 text-white shadow-[0_2px_10px_rgb(236_72_153/0.25)] hover:bg-pink-600',
    soft: 'bg-pink-50 text-pink-700 ring-1 ring-inset ring-pink-200/80 hover:bg-pink-100',
    outline: 'border border-pink-400/70 bg-white text-pink-600 hover:bg-pink-50',
    chip: 'bg-pink-50 text-pink-600',
    hex: '#EC4899',
  },
  indigo: {
    solid:
      'bg-indigo-500 text-white shadow-[0_2px_10px_rgb(99_102_241/0.28)] hover:bg-indigo-600',
    soft: 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200/80 hover:bg-indigo-100',
    outline: 'border border-indigo-400/70 bg-white text-indigo-600 hover:bg-indigo-50',
    chip: 'bg-indigo-50 text-indigo-600',
    hex: '#6366F1',
  },
  peach: {
    solid:
      'bg-[#E8A87C] text-white shadow-[0_2px_10px_rgb(232_168_124/0.35)] hover:bg-[#d99566]',
    soft: 'bg-[#FDF1E7] text-[#B86B3A] ring-1 ring-inset ring-[#F0D4B8] hover:bg-[#FAE8D6]',
    outline: 'border border-[#E8A87C]/80 bg-white text-[#C47A45] hover:bg-[#FDF1E7]',
    chip: 'bg-[#FDF1E7] text-[#C47A45]',
    hex: '#E8A87C',
  },
  slate: {
    solid: 'bg-slate-600 text-white shadow-sm hover:bg-slate-700',
    soft: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-200/80',
    outline: 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50',
    chip: 'bg-slate-100 text-slate-600',
    hex: '#64748B',
  },
}

/** Rotate soft tones for lists (contact cards, quick links, etc.) */
export const toneCycle: ButtonTone[] = [
  'sky',
  'mint',
  'amber',
  'violet',
  'teal',
  'coral',
  'indigo',
  'peach',
  'rose',
]

export function toneAt(index: number): ButtonTone {
  return toneCycle[index % toneCycle.length]
}

export function toneClasses(
  tone: ButtonTone = 'sky',
  appearance: 'solid' | 'soft' | 'outline' | 'chip' = 'solid',
): string {
  return softTones[tone][appearance]
}
