import { cn } from '../../lib/utils'
import type { HTMLAttributes } from 'react'

type Props = HTMLAttributes<HTMLSpanElement> & {
  color?: string
}

const luminance = (hex: string) => {
  const channels = hex.match(/[\da-f]{2}/gi)?.slice(0, 3).map((part) => {
    const value = parseInt(part, 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  if (!channels || channels.length !== 3) return 0.01
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}

const accessibleBadgeColor = (source: string) => {
  const normalized = source.replace('#', '')
  if (!/^(?:[\da-f]{3}|[\da-f]{6})$/i.test(normalized)) return '#1f2937'
  const full = normalized.length === 3 ? normalized.split('').map((part) => part + part).join('') : normalized
  const rgb = full.match(/[\da-f]{2}/gi)!.map((part) => parseInt(part, 16))
  const background = rgb.map((channel) => Math.round(channel * 0.094 + 255 * 0.906))
  for (let amount = 0; amount <= 0.9; amount += 0.05) {
    const candidate = rgb.map((channel) => Math.round(channel * (1 - amount)))
    const text = `#${candidate.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
    const bg = `#${background.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
    const textLuminance = luminance(text)
    const backgroundLuminance = luminance(bg)
    const ratio = (Math.max(textLuminance, backgroundLuminance) + 0.05) / (Math.min(textLuminance, backgroundLuminance) + 0.05)
    if (ratio >= 4.5) return text
  }
  return '#1f2937'
}

export function Badge({ className, color = '#0EA5E9', style, ...props }: Props) {
  return (
    <span
      className={cn(
        'content-badge inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        className,
      )}
      style={{
        backgroundColor: `${color}18`,
        ...style,
        color: accessibleBadgeColor(color),
      }}
      {...props}
    />
  )
}
