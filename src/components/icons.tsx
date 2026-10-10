// Иконки — инлайн SVG, цвет берут из currentColor.

interface IconProps {
  size?: number
  className?: string
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 16 16',
  fill: 'none',
  'aria-hidden': true as const,
  focusable: 'false' as const,
})

export function PlayIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4.5 2.8v10.4a.6.6 0 0 0 .9.5l8.2-5.2a.6.6 0 0 0 0-1L5.4 2.3a.6.6 0 0 0-.9.5Z" fill="currentColor" />
    </svg>
  )
}

export function ResetIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3 8a5 5 0 1 0 1.6-3.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M3.2 2.2v2.6h2.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function WarnIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M8 1.8 15 14H1L8 1.8Z" fill="currentColor" />
      <path d="M8 6.2v3.6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="8" cy="11.9" r=".95" fill="#fff" />
    </svg>
  )
}

export function CloseIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function CheckIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="m3.2 8.4 3 3 6.6-6.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function SlidersIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M2.5 4.5h11M2.5 11.5h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="5.5" cy="4.5" r="1.9" fill="var(--icon-bg, var(--paper))" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="10.5" cy="11.5" r="1.9" fill="var(--icon-bg, var(--paper))" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

export function BookIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M8 4.2C6.6 3 4.6 2.6 2.2 2.8v9.6c2.4-.2 4.4.2 5.8 1.4 1.4-1.2 3.4-1.6 5.8-1.4V2.8C11.4 2.6 9.4 3 8 4.2Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M8 4.2v9.6" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

/** Значок вкладки: форма различается, а не только цвет — для тех, кто не различает красный и зелёный. */
export function BadgeIcon({ kind }: { kind: 'empty' | 'code' | 'done' | 'error' }) {
  const p = { width: 12, height: 12, viewBox: '0 0 12 12', 'aria-hidden': true as const, focusable: 'false' as const }
  if (kind === 'empty')
    return (
      <svg {...p}>
        <circle cx="6" cy="6" r="3.6" fill="none" stroke="var(--ink-3)" strokeWidth="1.4" />
      </svg>
    )
  if (kind === 'code')
    return (
      <svg {...p}>
        <circle cx="6" cy="6" r="3.6" fill="var(--leaf-fill)" />
      </svg>
    )
  if (kind === 'done')
    return (
      <svg {...p}>
        <path
          d="m2.2 6.4 2.4 2.4 5.2-5.4"
          fill="none"
          stroke="var(--leaf-fill)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  return (
    <svg {...p}>
      <path d="M6 1.2 11.2 10.6H.8L6 1.2Z" fill="var(--danger)" />
    </svg>
  )
}

/** Логотип HitBox: белый кубик — три грани разной яркости, тёмные рёбра. */
export function LogoCube({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false" className={className}>
      <g stroke="#0f1116" strokeWidth="1.3" strokeLinejoin="round">
        <path d="M16 2.8 28.2 9.8 16 16.8 3.8 9.8Z" fill="#ffffff" />
        <path d="M3.8 9.8 16 16.8v13.4L3.8 23.2Z" fill="#dfe3ea" />
        <path d="M28.2 9.8v13.4L16 30.2V16.8Z" fill="#b4bbc8" />
      </g>
    </svg>
  )
}

export function CodeIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="m5.5 4.5-3.5 3.5 3.5 3.5M10.5 4.5l3.5 3.5-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function HelpIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6.3 6.3a1.8 1.8 0 1 1 2.5 1.6c-.5.3-.8.7-.8 1.3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="8" cy="11.4" r=".9" fill="currentColor" />
    </svg>
  )
}

export function BulbIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M5.6 10.4A4.5 4.5 0 1 1 10.4 10.4c-.5.4-.8 1-.8 1.6H6.4c0-.6-.3-1.2-.8-1.6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M6.5 14h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

const TRIANGLES = { left: 'M11 3v10L3.5 8 11 3Z', right: 'M5 3v10l7.5-5L5 3Z', up: 'M3 11h10L8 3.5 3 11Z' }

export function TriangleIcon({ dir, size = 18 }: { dir: 'left' | 'right' | 'up'; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d={TRIANGLES[dir]} fill="currentColor" strokeLinejoin="round" />
    </svg>
  )
}

export function LockIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3" y="7" width="10" height="7" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function TargetIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M3 13 13 3M8.5 3H13v4.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function FaceIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="8" cy="8" r="6.4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="5.8" cy="6.6" r="0.95" fill="currentColor" />
      <circle cx="10.2" cy="6.6" r="0.95" fill="currentColor" />
      <path
        d="M5.3 9.6c.7 1 1.6 1.5 2.7 1.5s2-.5 2.7-1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Палитра художника: квест «выбери цвет». */
export function PaletteIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M8 1.8a6.2 6.2 0 1 0 0 12.4c.9 0 1.4-.6 1.4-1.3 0-.8-.6-1.1-.6-1.8 0-.7.6-1.2 1.3-1.2h1.5a2.6 2.6 0 0 0 2.6-2.6C14.2 4.3 11.5 1.8 8 1.8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="5" cy="7.6" r="1" fill="currentColor" />
      <circle cx="6.8" cy="4.8" r="1" fill="currentColor" />
      <circle cx="10" cy="4.8" r="1" fill="currentColor" />
    </svg>
  )
}
